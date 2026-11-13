import mongoose, { Schema } from "mongoose";

const webhookEventSchema = new Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
    },
    event: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("WebhookEvent", webhookEventSchema);
