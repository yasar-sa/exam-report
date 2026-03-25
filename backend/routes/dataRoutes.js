import express from "express";
import mongoose from "mongoose";
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

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const buildPageMeta = (totalItems, page, limit) => ({
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
  page,
  limit,
});

const parseSort = (sortBy, order, allowedFields, defaultSortBy) => {
  const field = allowedFields.includes(sortBy) ? sortBy : defaultSortBy;
  const direction = order === "asc" ? 1 : -1;
  return { [field]: direction };
};


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
  const {
    page = "1",
    limit = "10",
    sortBy = "createdAt",
    order = "desc",
    search = "",
    department = "",
  } = req.query;

  const pageNum = toPositiveInt(page, 1);
  const limitNum = Math.min(toPositiveInt(limit, 10), 100);

  const filter = {};
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
    ];
  }
  if (department) {
    filter.department = department;
  }

  const [totalItems, data] = await Promise.all([
    Student.countDocuments(filter),
    Student.find(filter)
      .sort(parseSort(sortBy, order, ["firstName", "lastName", "department", "createdAt"], "createdAt"))
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
  ]);

  res.json({
    success: true,
    data,
    meta: buildPageMeta(totalItems, pageNum, limitNum),
  });
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
  const {
    page = "1",
    limit = "10",
    sortBy = "createdAt",
    order = "desc",
    search = "",
  } = req.query;

  const pageNum = toPositiveInt(page, 1);
  const limitNum = Math.min(toPositiveInt(limit, 10), 100);
  const filter = search ? { name: { $regex: search, $options: "i" } } : {};

  const [totalItems, data] = await Promise.all([
    Course.countDocuments(filter),
    Course.find(filter)
      .sort(parseSort(sortBy, order, ["name", "createdAt"], "createdAt"))
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
  ]);

  res.json({
    success: true,
    data,
    meta: buildPageMeta(totalItems, pageNum, limitNum),
  });
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
  const {
    page = "1",
    limit = "10",
    sortBy = "createdAt",
    order = "desc",
    search = "",
    type = "",
    courseId = "",
  } = req.query;

  const pageNum = toPositiveInt(page, 1);
  const limitNum = Math.min(toPositiveInt(limit, 10), 100);

  const filter = {};
  if (search) {
    filter.name = { $regex: search, $options: "i" };
  }
  if (type) {
    filter.type = type;
  }
  if (courseId) {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new ApiError(400, "Invalid courseId query parameter");
    }
    filter.courseId = courseId;
  }

  const [totalItems, data] = await Promise.all([
    Assessment.countDocuments(filter),
    Assessment.find(filter)
      .sort(parseSort(sortBy, order, ["name", "type", "date", "createdAt"], "createdAt"))
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
  ]);

  res.json({
    success: true,
    data,
    meta: buildPageMeta(totalItems, pageNum, limitNum),
  });
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
  const {
    page = "1",
    limit = "10",
    sortBy = "createdAt",
    order = "desc",
    studentId = "",
    assessmentId = "",
    minScore = "",
    maxScore = "",
  } = req.query;

  const pageNum = toPositiveInt(page, 1);
  const limitNum = Math.min(toPositiveInt(limit, 10), 100);
  const filter = {};

  if (studentId) {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new ApiError(400, "Invalid studentId query parameter");
    }
    filter.studentId = studentId;
  }
  if (assessmentId) {
    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
      throw new ApiError(400, "Invalid assessmentId query parameter");
    }
    filter.assessmentId = assessmentId;
  }

  if (minScore !== "" || maxScore !== "") {
    const minVal = minScore !== "" ? Number(minScore) : undefined;
    const maxVal = maxScore !== "" ? Number(maxScore) : undefined;
    if ((minVal !== undefined && Number.isNaN(minVal)) || (maxVal !== undefined && Number.isNaN(maxVal))) {
      throw new ApiError(400, "minScore and maxScore must be numeric");
    }
    filter.score = {};
    if (minVal !== undefined) filter.score.$gte = minVal;
    if (maxVal !== undefined) filter.score.$lte = maxVal;
  }

  const [totalItems, data] = await Promise.all([
    Result.countDocuments(filter),
    Result.find(filter)
      .sort(parseSort(sortBy, order, ["score", "createdAt"], "createdAt"))
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
  ]);

  res.json({
    success: true,
    data,
    meta: buildPageMeta(totalItems, pageNum, limitNum),
  });
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