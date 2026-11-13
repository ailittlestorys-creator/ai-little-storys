import { Router } from "express";
import { getStudentCourseDetails } from "../controllers/studentCourseController.js";
import { protect } from "../middleware/authMiddleware.js";

import { getMyCourses } from "../controllers/studentDashboardController.js";
import { getLearningCourse } from "../controllers/learningController.js";

const router = Router();

router.get("/my-courses", protect, getMyCourses);
router.get("/:slug/learning", protect, getLearningCourse);
router.get("/:slug", getStudentCourseDetails);

export default router;
