import { Request, Response } from "express";

import Course from "../models/Course.js";
import Module from "../models/Module.js";
import Lesson from "../models/Lesson.js";
import Enrollment from "../models/Enrollment.js";

export const getLearningCourse = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user?.userId;
    const { slug } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login",
      });
    }

    const course = await Course.findOne({ slug }).select(
      "title slug description thumbnail language level",
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const enrollment = await Enrollment.findOne({
      userId,
      courseId: course._id,
      status: "active",
    });

    const isEnrolled = Boolean(enrollment);

    const modules = await Module.find({
      courseId: course._id,
    })
      .select("title order")
      .sort({ order: 1 })
      .lean();

    const curriculum = await Promise.all(
      modules.map(async (module) => {
        const lessons = await Lesson.find({
          moduleId: module._id,
          courseId: course._id,
        })
          .select("title description duration order isPreview prompts")
          .sort({ order: 1 })
          .lean();

        return {
          _id: module._id,
          title: module.title,
          order: module.order,

          lessons: lessons.map((lesson) => {
            const isLocked = !isEnrolled && !lesson.isPreview;

            return {
              _id: lesson._id,
              title: lesson.title,
              description: lesson.description,
              duration: lesson.duration || 0,
              order: lesson.order,
              isPreview: lesson.isPreview,
              isLocked,

              // Never send paid lesson prompts to non-enrolled students.
              prompts: isLocked ? [] : lesson.prompts || [],
            };
          }),
        };
      }),
    );

    return res.status(200).json({
      success: true,
      course,
      isEnrolled,
      accessType: enrollment?.accessType || null,
      curriculum,
    });
  } catch (error) {
    console.error("Learning course error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load learning course",
    });
  }
};
