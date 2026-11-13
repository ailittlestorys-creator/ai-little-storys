import mongoose, { Schema, Document } from "mongoose";

export interface IModule extends Document {
  courseId: mongoose.Types.ObjectId;
  title: string;
  order: number;
}

const moduleSchema = new Schema<IModule>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    order: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { timestamps: true },
);

moduleSchema.index({ courseId: 1, order: 1 }, { unique: true });

export default mongoose.model<IModule>("Module", moduleSchema);
