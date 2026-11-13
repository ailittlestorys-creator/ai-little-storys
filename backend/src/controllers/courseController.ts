import { Request, Response } from "express";
import Course from "../models/Course.js";

// Get all published courses
export const getCourses = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const courses = await Course.find({
      isPublished: true,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      courses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch courses",
    });
  }
};

// Get single course
export const getCourseBySlug = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const course = await Course.findOne({
      slug: req.params.slug,
      isPublished: true,
    });

    if (!course) {
      res.status(404).json({
        success: false,
        message: "Course not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch course",
    });
  }
};
