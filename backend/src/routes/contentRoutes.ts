import { Router } from "express";

import { protect, adminOnly } from "../middleware/authMiddleware.js";

import {
  createModule,
  getCourseModules,
  updateModule,
  deleteModule,
} from "../controllers/moduleController.js";

import {
  createLesson,
  getModuleLessons,
  updateLesson,
  deleteLesson,
  playLesson,
} from "../controllers/lessonController.js";

const router = Router();

// ADMIN MODULE MANAGEMENT
router.post("/courses/:courseId/modules", protect, adminOnly, createModule);

router.get("/courses/:courseId/modules", protect, adminOnly, getCourseModules);

router.put("/modules/:moduleId", protect, adminOnly, updateModule);

router.delete("/modules/:moduleId", protect, adminOnly, deleteModule);

// ADMIN LESSON MANAGEMENT
router.post(
  "/courses/:courseId/modules/:moduleId/lessons",
  protect,
  adminOnly,
  createLesson,
);

router.get(
  "/courses/:courseId/modules/:moduleId/lessons",
  protect,
  adminOnly,
  getModuleLessons,
);

router.put("/lessons/:lessonId", protect, adminOnly, updateLesson);

router.delete("/lessons/:lessonId", protect, adminOnly, deleteLesson);

// STUDENT VIDEO PLAYBACK
router.get("/lessons/:lessonId/play", protect, playLesson);

export default router;
