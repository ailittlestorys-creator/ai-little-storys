import { Request, Response } from "express";
import { z } from "zod";

import Course from "../models/Course.js";
import Module from "../models/Module.js";
import Lesson from "../models/Lesson.js";
import Enrollment from "../models/Enrollment.js";
import cloudinary from "../config/cloudinary.js";

const promptsSchema = z
  .array(z.string().trim().min(1).max(10000))
  .max(30)
  .default([]);

const lessonSchema = z.object({
  title: z.string().trim().min(2).max(150),
  description: z.string().max(2000).default(""),
  videoPublicId: z.string().startsWith("course-platform/lessons/"),
  order: z.number().int().min(1),
  isPreview: z.boolean().default(false),
  prompts: promptsSchema,
});

// CREATE LESSON
export const createLesson = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = lessonSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Invalid lesson details",
        errors: result.error.flatten(),
      });
      return;
    }

    const course = await Course.findById(req.params.courseId);

    const module = await Module.findOne({
      _id: req.params.moduleId,
      courseId: req.params.courseId,
    });

    if (!course || !module) {
      res.status(404).json({
        success: false,
        message: "Course or module not found",
      });
      return;
    }

    // Verify uploaded video exists in Cloudinary
    const video = await cloudinary.api.resource(result.data.videoPublicId, {
      resource_type: "video",
      type: "authenticated",
    });

    if (video.resource_type !== "video") {
      res.status(400).json({
        success: false,
        message: "Invalid video asset",
      });
      return;
    }

    const lesson = await Lesson.create({
      courseId: course._id,
      moduleId: module._id,
      ...result.data,
      duration: Math.ceil(video.duration || 0),
    });

    res.status(201).json({
      success: true,
      message: "Lesson created successfully",
      lesson: {
        id: lesson._id,
        title: lesson.title,
        description: lesson.description,
        duration: lesson.duration,
        order: lesson.order,
        isPreview: lesson.isPreview,
        prompts: lesson.prompts,
      },
    });
  } catch (error: any) {
    console.error("CREATE LESSON ERROR:", error);

    res.status(error.code === 11000 ? 409 : 500).json({
      success: false,
      message:
        error.code === 11000
          ? "Lesson order already exists"
          : "Failed to create lesson",
    });
  }
};

// GET LESSONS
export const getModuleLessons = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const module = await Module.findOne({
      _id: req.params.moduleId,
      courseId: req.params.courseId,
    });

    if (!module) {
      res.status(404).json({
        success: false,
        message: "Module not found",
      });
      return;
    }

    const lessons = await Lesson.find({
      moduleId: module._id,
    })
      .select("-videoPublicId")
      .sort({ order: 1 });

    res.status(200).json({
      success: true,
      lessons,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch lessons",
    });
  }
};

// DELETE LESSON
export const deleteLesson = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);

    if (!lesson) {
      res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
      return;
    }

    await cloudinary.uploader.destroy(lesson.videoPublicId, {
      resource_type: "video",
      type: "authenticated",
    });

    await lesson.deleteOne();

    res.json({
      success: true,
      message: "Lesson deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to delete lesson",
    });
  }
};

// PLAY LESSON
export const playLesson = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);

    if (!lesson) {
      res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
      return;
    }

    if (!lesson.isPreview) {
      const enrollment = await Enrollment.findOne({
        userId: req.user?.userId,
        courseId: lesson.courseId,
        status: "active",
      });

      if (!enrollment) {
        res.status(403).json({
          success: false,
          message: "Purchase this course to watch this lesson",
        });
        return;
      }
    }

    const videoUrl = cloudinary.url(lesson.videoPublicId, {
      resource_type: "video",
      type: "authenticated",
      secure: true,
      sign_url: true,
      format: "mp4",
    });

    res.setHeader("Cache-Control", "private, no-store");

    res.status(200).json({
      success: true,
      videoUrl,
      duration: lesson.duration,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Unable to play lesson",
    });
  }
};

// UPDATE LESSON
export const updateLesson = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { lessonId } = req.params;

    const updateSchema = z
      .object({
        title: z.string().trim().min(2).max(150).optional(),
        description: z.string().max(2000).optional(),
        order: z.number().int().min(1).optional(),
        isPreview: z.boolean().optional(),
        prompts: promptsSchema.optional(),
      })
      .strict();

    const result = updateSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Invalid lesson details",
        errors: result.error.flatten(),
      });
      return;
    }

    const lesson = await Lesson.findById(lessonId);

    if (!lesson) {
      res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
      return;
    }

    // Prevent duplicate lesson order in the same module.
    if (result.data.order !== undefined) {
      const existingOrder = await Lesson.exists({
        _id: { $ne: lesson._id },
        moduleId: lesson.moduleId,
        order: result.data.order,
      });

      if (existingOrder) {
        res.status(409).json({
          success: false,
          message: "Another lesson already uses this order",
        });
        return;
      }
    }

    Object.assign(lesson, result.data);

    await lesson.save();

    res.status(200).json({
      success: true,
      message: "Lesson updated successfully",
      lesson: {
        _id: lesson._id,
        title: lesson.title,
        description: lesson.description,
        duration: lesson.duration,
        order: lesson.order,
        isPreview: lesson.isPreview,
        prompts: lesson.prompts,
      },
    });
  } catch (error: any) {
    console.error("UPDATE LESSON ERROR:", error);

    res.status(error.code === 11000 ? 409 : 500).json({
      success: false,
      message:
        error.code === 11000
          ? "Lesson order already exists"
          : "Failed to update lesson",
    });
  }
};
