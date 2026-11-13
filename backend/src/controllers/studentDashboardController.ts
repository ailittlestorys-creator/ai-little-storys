import { Request, Response } from "express";
import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: "student" | "admin";
  };
}

export const getMyCourses = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login",
      });
    }

    // Get student's active enrollments
    const enrollments = await Enrollment.find({
      userId,
      status: "active",
    })
      .select("courseId enrolledAt accessType")
      .sort({ enrolledAt: -1 })
      .lean();

    if (enrollments.length === 0) {
      return res.status(200).json({
        success: true,
        totalCourses: 0,
        courses: [],
      });
    }

    const courseIds = enrollments.map((enrollment) => enrollment.courseId);

    // Fetch enrolled courses.
    // Do not filter isPublished: purchased students retain access
    // even if an admin later unpublishes the course.
    const courses = await Course.find({
      _id: { $in: courseIds },
    })
      .select(
        "title slug description thumbnail price originalPrice language level",
      )
      .lean();

    const result = enrollments
      .map((enrollment) => {
        const course = courses.find(
          (item) => item._id.toString() === enrollment.courseId.toString(),
        );

        if (!course) return null;

        return {
          enrollmentId: enrollment._id,
          enrolledAt: enrollment.enrolledAt,
          accessType: enrollment.accessType,
          course,
        };
      })
      .filter((item) => item !== null);

    return res.status(200).json({
      success: true,
      totalCourses: result.length,
      courses: result,
    });
  } catch (error) {
    console.error("Get my courses error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load purchased courses",
    });
  }
};
