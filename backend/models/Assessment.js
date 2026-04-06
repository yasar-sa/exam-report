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
      index: true,
    },
    status: {
      type: String,
      enum: ["COMPLETED", "NOT_SCHEDULED", "SCHEDULED", "ONGOING"],
      index: true,
    },
    date: {
      type: Date,
      index: true,
    },
  },
  { timestamps: true, collection: "exam_course_groups" }
);

export default mongoose.model("Assessment", AssessmentSchema);