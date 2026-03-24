import mongoose from "mongoose";

const AssessmentSchema = new mongoose.Schema({
  name: String,
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course"
  },
  type: String,
  date: Date
});

export default mongoose.model("Assessment", AssessmentSchema);