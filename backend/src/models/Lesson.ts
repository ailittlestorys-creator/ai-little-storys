import mongoose, { Schema, Document } from "mongoose";

export interface ILesson extends Document {
  courseId: mongoose.Types.ObjectId;
  moduleId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  videoPublicId: string;
  duration: number;
  order: number;
  isPreview: boolean;
  prompts: string[];
}

const lessonSchema = new Schema<ILesson>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    moduleId: {
      type: Schema.Types.ObjectId,
      ref: "Module",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    videoPublicId: {
      type: String,
      required: true,
    },

    duration: {
      type: Number,
      default: 0,
      min: 0,
    },

    order: {
      type: Number,
      required: true,
      min: 1,
    },

    isPreview: {
      type: Boolean,
      default: false,
    },

    prompts: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 10000,
        },
      ],
      default: [],
      validate: {
        validator: (prompts: string[]) =>
          prompts.every((prompt) => prompt.length > 0),
        message: "Prompts cannot be empty",
      },
    },
  },
  { timestamps: true },
);

lessonSchema.index({ moduleId: 1, order: 1 }, { unique: true });

export default mongoose.model<ILesson>("Lesson", lessonSchema);
