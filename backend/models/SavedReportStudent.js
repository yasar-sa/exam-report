import mongoose from "mongoose";

const SavedReportStudentSchema = new mongoose.Schema(
  {
    savedReportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SavedReport",
      required: true,
      index: true,
    },
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      default: null,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    score: {
      type: Number,
      default: 0,
    },
    avgScore: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["At Risk", "Good"],
      default: "Good",
    },
  },
  { timestamps: true }
);

// Compound index for sorted pagination within a report
SavedReportStudentSchema.index({ savedReportId: 1, assessmentId: 1, score: -1, lastName: 1 });
SavedReportStudentSchema.index({ savedReportId: 1, assessmentId: 1, avgScore: -1, lastName: 1 });

export default mongoose.model("SavedReportStudent", SavedReportStudentSchema);
