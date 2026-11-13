import { Request, Response } from "express";
import { z } from "zod";

import Course from "../models/Course.js";
import Module from "../models/Module.js";
import Lesson from "../models/Lesson.js";

const moduleSchema = z.object({
  title: z.string().trim().min(2).max(150),
  order: z.number().int().min(1),
});

// CREATE MODULE
export const createModule = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = moduleSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Invalid module details",
      });
      return;
    }

    const course = await Course.findById(req.params.courseId);

    if (!course) {
      res.status(404).json({
        success: false,
        message: "Course not found",
      });
      return;
    }

    const module = await Module.create({
      courseId: course._id,
      ...result.data,
    });

    res.status(201).json({
      success: true,
      message: "Module created successfully",
      module,
    });
  } catch (error: any) {
    res.status(error.code === 11000 ? 409 : 500).json({
      success: false,
      message:
        error.code === 11000
          ? "Module order already exists"
          : "Failed to create module",
    });
  }
};

// GET COURSE MODULES
export const getCourseModules = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const modules = await Module.find({
      courseId: req.params.courseId,
    }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      modules,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to fetch modules",
    });
  }
};

// UPDATE MODULE
export const updateModule = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = moduleSchema.partial().safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Invalid module details",
      });
      return;
    }

    const module = await Module.findByIdAndUpdate(
      req.params.moduleId,
      result.data,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!module) {
      res.status(404).json({
        success: false,
        message: "Module not found",
      });
      return;
    }

    res.json({
      success: true,
      module,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to update module",
    });
  }
};

// DELETE MODULE
export const deleteModule = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const module = await Module.findById(req.params.moduleId);

    if (!module) {
      res.status(404).json({
        success: false,
        message: "Module not found",
      });
      return;
    }

    const hasLessons = await Lesson.exists({
      moduleId: module._id,
    });

    if (hasLessons) {
      res.status(409).json({
        success: false,
        message: "Delete lessons before deleting this module",
      });
      return;
    }

    await module.deleteOne();

    res.json({
      success: true,
      message: "Module deleted successfully",
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to delete module",
    });
  }
};
