import express from "express";
const router = express.Router();

import Student from "../models/Student.js";
import Course from "../models/Course.js";
import Assessment from "../models/Assessment.js";
import Result from "../models/Result.js";
import { ApiError, asyncHandler } from "../middleware/errorHandler.js";
import {
  validateAssessmentPayload,
  validateCoursePayload,
  validateObjectIdParam,
  validateResultPayload,
  validateStudentPayload,
} from "../middleware/validators.js";


// =======================
//  STUDENT CRUD
// =======================

// CREATE
router.post("/students", validateStudentPayload, asyncHandler(async (req, res) => {
  const data = await Student.create(req.body);
  res.status(201).json({ success: true, data });
}));

// GET ALL
router.get("/students", asyncHandler(async (req, res) => {
  const data = await Student.find();
  res.json({ success: true, data });
}));

// GET ONE
router.get("/students/:id", validateObjectIdParam("id"), asyncHandler(async (req, res) => {
  const data = await Student.findById(req.params.id);
  if (!data) throw new ApiError(404, "Student not found");
  res.json({ success: true, data });
}));

// UPDATE
router.put("/students/:id", validateObjectIdParam("id"), validateStudentPayload, asyncHandler(async (req, res) => {
  const data = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!data) throw new ApiError(404, "Student not found");
  res.json({ success: true, data });
}));

// DELETE
router.delete("/students/:id", validateObjectIdParam("id"), asyncHandler(async (req, res) => {
  await Student.findByIdAndDelete(req.params.id);
  res.json({ success: true, data: { message: "Student deleted" } });
}));


// =======================
//  COURSE CRUD
// =======================

router.post("/courses", validateCoursePayload, asyncHandler(async (req, res) => {
  const data = await Course.create(req.body);
  res.status(201).json({ success: true, data });
}));

router.get("/courses", asyncHandler(async (req, res) => {
  const data = await Course.find();
  res.json({ success: true, data });
}));

router.get("/courses/:id", validateObjectIdParam("id"), asyncHandler(async (req, res) => {
  const data = await Course.findById(req.params.id);
  if (!data) throw new ApiError(404, "Course not found");
  res.json({ success: true, data });
}));

router.put("/courses/:id", validateObjectIdParam("id"), validateCoursePayload, asyncHandler(async (req, res) => {
  const data = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!data) throw new ApiError(404, "Course not found");
  res.json({ success: true, data });
}));

router.delete("/courses/:id", validateObjectIdParam("id"), asyncHandler(async (req, res) => {
  await Course.findByIdAndDelete(req.params.id);
  res.json({ success: true, data: { message: "Course deleted" } });
}));


// =======================
//  ASSESSMENT CRUD
// =======================

router.post("/assessments", validateAssessmentPayload, asyncHandler(async (req, res) => {
  const data = await Assessment.create(req.body);
  res.status(201).json({ success: true, data });
}));

router.get("/assessments", asyncHandler(async (req, res) => {
  const data = await Assessment.find();
  res.json({ success: true, data });
}));

router.get("/assessments/:id", validateObjectIdParam("id"), asyncHandler(async (req, res) => {
  const data = await Assessment.findById(req.params.id);
  if (!data) throw new ApiError(404, "Assessment not found");
  res.json({ success: true, data });
}));

router.put("/assessments/:id", validateObjectIdParam("id"), validateAssessmentPayload, asyncHandler(async (req, res) => {
  const data = await Assessment.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!data) throw new ApiError(404, "Assessment not found");
  res.json({ success: true, data });
}));

router.delete("/assessments/:id", validateObjectIdParam("id"), asyncHandler(async (req, res) => {
  await Assessment.findByIdAndDelete(req.params.id);
  res.json({ success: true, data: { message: "Assessment deleted" } });
}));


// =======================
//  RESULT CRUD
// =======================

router.post("/results", validateResultPayload, asyncHandler(async (req, res) => {
  const data = await Result.create(req.body);
  res.status(201).json({ success: true, data });
}));

router.get("/results", asyncHandler(async (req, res) => {
  const data = await Result.find();
  res.json({ success: true, data });
}));

router.get("/results/:id", validateObjectIdParam("id"), asyncHandler(async (req, res) => {
  const data = await Result.findById(req.params.id);
  if (!data) throw new ApiError(404, "Result not found");
  res.json({ success: true, data });
}));

router.put("/results/:id", validateObjectIdParam("id"), validateResultPayload, asyncHandler(async (req, res) => {
  const data = await Result.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!data) throw new ApiError(404, "Result not found");
  res.json({ success: true, data });
}));

router.delete("/results/:id", validateObjectIdParam("id"), asyncHandler(async (req, res) => {
  await Result.findByIdAndDelete(req.params.id);
  res.json({ success: true, data: { message: "Result deleted" } });
}));


export default router;