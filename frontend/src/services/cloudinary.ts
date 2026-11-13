import api from "./api";

interface UploadSignature {
  signature: string;
  timestamp: number;
  publicId: string;
  folder: string;
  type: string;
  cloudName: string;
  apiKey: string;
}

interface CloudinaryUploadResponse {
  public_id: string;
  duration: number;
  bytes: number;
  format: string;
  resource_type: string;
}

export const uploadVideo = async (
  file: File,
  onProgress: (progress: number) => void,
): Promise<CloudinaryUploadResponse> => {
  if (!file.type.startsWith("video/")) {
    throw new Error("Please select a video file");
  }

  if (file.size > 100 * 1024 * 1024) {
    throw new Error("Video must be below 100 MB in this upload version");
  }

  const { data } = await api.post<{
    success: boolean;
    signature: string;
    timestamp: number;
    publicId: string;
    folder: string;
    type: string;
    cloudName: string;
    apiKey: string;
  }>("/admin/cloudinary/signature");

  const signature: UploadSignature = data;

  const formData = new FormData();

  formData.append("file", file);
  formData.append("api_key", signature.apiKey);
  formData.append("timestamp", String(signature.timestamp));
  formData.append("signature", signature.signature);
  formData.append("folder", signature.folder);
  formData.append("public_id", signature.publicId);
  formData.append("type", signature.type);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    const url =
      `https://api.cloudinary.com/v1_1/` +
      `${signature.cloudName}/video/upload`;

    xhr.open("POST", url);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);

        onProgress(progress);
      }
    };

    xhr.onload = () => {
      let result: any;

      try {
        result = JSON.parse(xhr.responseText);
      } catch {
        reject(new Error("Invalid Cloudinary response"));
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(result as CloudinaryUploadResponse);
      } else {
        reject(new Error(result.error?.message || "Video upload failed"));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error during video upload"));
    };

    xhr.onabort = () => {
      reject(new Error("Video upload cancelled"));
    };

    xhr.send(formData);
  });
};
