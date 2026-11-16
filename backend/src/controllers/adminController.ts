import { Request, Response } from "express";
import { z } from "zod";

import Course from "../models/Course.js";
import User from "../models/User.js";
import Enrollment from "../models/Enrollment.js";

const courseSchema = z.object({
  title: z.string().trim().min(3).max(150),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(180)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().min(10).max(5000),
  thumbnail: z.string().url().or(z.literal("")).optional(),
  price: z.number().min(0),
  originalPrice: z.number().min(0).default(0),
  language: z.string().default("Telugu"),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]),
  isPublished: z.boolean().default(false),
});

// CREATE COURSE
export const createCourse = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = courseSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Invalid course details",
        errors: result.error.flatten(),
      });
      return;
    }

    const existing = await Course.findOne({
      slug: result.data.slug,
    });

    if (existing) {
      res.status(409).json({
        success: false,
        message: "Course slug already exists",
      });
      return;
    }

    const course = await Course.create(result.data);

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      course,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to create course",
    });
  }
};

// GET ALL COURSES FOR ADMIN WITH PURCHASE COUNT
export const getAdminCourses = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const [courses, purchaseCounts] = await Promise.all([
      Course.find().sort({ createdAt: -1 }),

      Enrollment.aggregate([
        {
          $match: {
            status: "active",
          },
        },
        {
          $group: {
            _id: "$courseId",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const purchaseCountMap = new Map<string, number>(
      purchaseCounts.map((item) => [String(item._id), item.count]),
    );

    const coursesWithPurchaseCount = courses.map((course) => ({
      ...course.toObject(),
      purchaseCount: purchaseCountMap.get(String(course._id)) ?? 0,
    }));

    res.status(200).json({
      success: true,
      courses: coursesWithPurchaseCount,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch courses",
    });
  }
};

// UPDATE COURSE
export const updateCourse = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = courseSchema.partial().safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Invalid course details",
        errors: result.error.flatten(),
      });
      return;
    }

    const course = await Course.findByIdAndUpdate(req.params.id, result.data, {
      new: true,
      runValidators: true,
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
      message: "Course updated successfully",
      course,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to update course",
    });
  }
};

// DELETE COURSE
export const deleteCourse = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      res.status(404).json({
        success: false,
        message: "Course not found",
      });
      return;
    }

    const enrolled = await Enrollment.exists({
      courseId: course._id,
    });

    if (enrolled) {
      res.status(409).json({
        success: false,
        message: "This course has enrollments. Unpublish it instead.",
      });
      return;
    }

    await course.deleteOne();

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to delete course",
    });
  }
};

// ADMIN DASHBOARD STATS
export const getDashboardStats = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const [totalCourses, totalStudents, totalPurchases] = await Promise.all([
      Course.countDocuments(),
      User.countDocuments({ role: "student" }),
      Enrollment.countDocuments({ status: "active" }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalCourses,
        totalStudents,
        totalPurchases,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats",
    });
  }
};

// GET STUDENT EMAIL LISTS FOR ADMIN
export const getStudentEmailLists = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Students who have ever purchased at least one course
    const purchasedUserIds = await Enrollment.distinct("userId");

    const [purchasedStudents, notPurchasedStudents] = await Promise.all([
      User.find({
        _id: { $in: purchasedUserIds },
        role: "student",
      })
        .select("name email createdAt")
        .sort({ createdAt: -1 })
        .lean(),

      User.find({
        role: "student",
        _id: { $nin: purchasedUserIds },
      })
        .select("name email createdAt")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      purchasedStudents,
      notPurchasedStudents,
      counts: {
        purchased: purchasedStudents.length,
        notPurchased: notPurchasedStudents.length,
      },
    });
  } catch (error) {
    console.error("Student email lists error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch student email lists",
    });
  }
};
