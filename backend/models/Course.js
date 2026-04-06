import mongoose from "mongoose";

const CourseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["course", "elective", "module"],
      index: true,
    },
  },
  { timestamps: true, collection: "course_hierarchies" }
);

export default mongoose.model("Course", CourseSchema);