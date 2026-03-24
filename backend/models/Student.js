import mongoose from "mongoose";

const StudentSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  department: String
});

export default mongoose.model("Student", StudentSchema);