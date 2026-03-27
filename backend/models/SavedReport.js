import mongoose from "mongoose";

const SavedReportSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    courseName: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    config: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    reportData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    lastRerunAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("SavedReport", SavedReportSchema);
