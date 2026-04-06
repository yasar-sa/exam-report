import mongoose from "mongoose";

const ResultSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
    _reportCourse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReportInstance",
      index: true,
    },
    marks: {
      type: Number,
      required: true,
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
    },
    grade: {
      type: String,
    },
  },
  { timestamps: true, collection: "student_results" }
);

export default mongoose.model("Result", ResultSchema);