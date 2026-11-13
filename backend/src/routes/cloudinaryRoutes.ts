import { Router } from "express";

import { protect, adminOnly } from "../middleware/authMiddleware.js";

import { generateUploadSignature } from "../controllers/cloudinaryController.js";

const router = Router();

router.use(protect, adminOnly);

router.post("/signature", generateUploadSignature);

export default router;
