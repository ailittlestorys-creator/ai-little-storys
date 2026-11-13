import { Request, Response } from "express";
import { randomUUID } from "crypto";
import cloudinary from "../config/cloudinary.js";

export const generateUploadSignature = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);

    const folder = "course-platform/lessons";

    const publicId = `${folder}/${randomUUID()}`;

    const paramsToSign = {
      timestamp,
      folder,
      public_id: publicId,
      type: "authenticated",
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!,
    );

    res.status(200).json({
      success: true,
      signature,
      timestamp,
      publicId,
      folder,
      type: "authenticated",
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
    });
  } catch (error) {
    console.error("Cloudinary Signature Error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to generate upload signature",
    });
  }
};
