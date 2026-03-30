import mongoose from "mongoose";

const AssessmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
      enum: ["Exam", "Quiz", "Assignment"],
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Assessment", AssessmentSchema);