import mongoose from "mongoose";

const ResultSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student"
  },
  assessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assessment"
  },
  score: Number
});

export default mongoose.model("Result", ResultSchema);