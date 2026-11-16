import { Router } from "express";

import {
  createCourse,
  getAdminCourses,
  updateCourse,
  deleteCourse,
  getDashboardStats,
  getStudentEmailLists,
} from "../controllers/adminController.js";

import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = Router();

// All routes below require admin authentication
router.use(protect, adminOnly);

router.get("/stats", getDashboardStats);

router.get("/courses", getAdminCourses);

// STUDENT EMAIL LISTS
router.get("/students/emails", getStudentEmailLists);

router.post("/courses", createCourse);

router.put("/courses/:id", updateCourse);

router.delete("/courses/:id", deleteCourse);

export default router;
