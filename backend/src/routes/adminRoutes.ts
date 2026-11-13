import { Router } from "express";

import {
  createCourse,
  getAdminCourses,
  updateCourse,
  deleteCourse,
  getDashboardStats,
} from "../controllers/adminController.js";

import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = Router();

// All routes below require admin authentication
router.use(protect, adminOnly);

router.get("/stats", getDashboardStats);

router.get("/courses", getAdminCourses);

router.post("/courses", createCourse);

router.put("/courses/:id", updateCourse);

router.delete("/courses/:id", deleteCourse);

export default router;
