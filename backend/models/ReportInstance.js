import mongoose from "mongoose";

const ReportInstanceSchema = new mongoose.Schema(
  {
    courseHeirarchyCode: {
      type: String,
      required: true,
      index: true,
    },
    _courseGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: true,
      index: true,
    },
    status: {
      overAll: {
        type: String,
        enum: ["PUBLISHED", "NOT_STARTED", "ONGOING"],
        index: true,
      },
    },
  },
  { timestamps: true, collection: "courses" }
);

export default mongoose.model("ReportInstance", ReportInstanceSchema);
