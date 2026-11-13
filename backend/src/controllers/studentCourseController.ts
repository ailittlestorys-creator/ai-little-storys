import { Request, Response } from "express";
import Course from "../models/Course.js";
import Module from "../models/Module.js";
import Lesson from "../models/Lesson.js";

export const getStudentCourseDetails = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const course = await Course.findOne({
      slug,
      isPublished: true,
    }).select(
      "title slug description thumbnail price originalPrice language level",
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

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
        })
          .select("title description duration order isPreview")
          .sort({ order: 1 })
          .lean();

        return {
          _id: module._id,
          title: module.title,
          order: module.order,
          lessons: lessons.map((lesson) => ({
            _id: lesson._id,
            title: lesson.title,
            description: lesson.description,
            duration: lesson.duration,
            order: lesson.order,
            isPreview: lesson.isPreview,
          })),
        };
      }),
    );

    const totalLessons = curriculum.reduce(
      (total, module) => total + module.lessons.length,
      0,
    );

    const totalDuration = curriculum.reduce(
      (total, module) =>
        total +
        module.lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0),
      0,
    );

    return res.status(200).json({
      success: true,
      course,
      curriculum,
      stats: {
        totalModules: curriculum.length,
        totalLessons,
        totalDuration,
      },
    });
  } catch (error) {
    console.error("Get student course details error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load course details",
    });
  }
};
