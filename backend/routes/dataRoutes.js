import express from "express";
const router = express.Router();

import Student from "../models/Student.js";
import Course from "../models/Course.js";
import Assessment from "../models/Assessment.js";
import Result from "../models/Result.js";


// =======================
//  STUDENT CRUD
// =======================

// CREATE
router.post("/students", async (req, res) => {
  const data = await Student.create(req.body);
  res.json(data);
});

// GET ALL
router.get("/students", async (req, res) => {
  const data = await Student.find();
  res.json(data);
});

// GET ONE
router.get("/students/:id", async (req, res) => {
  const data = await Student.findById(req.params.id);
  res.json(data);
});

// UPDATE
router.put("/students/:id", async (req, res) => {
  const data = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(data);
});

// DELETE
router.delete("/students/:id", async (req, res) => {
  await Student.findByIdAndDelete(req.params.id);
  res.json({ message: "Student deleted" });
});


// =======================
//  COURSE CRUD
// =======================

router.post("/courses", async (req, res) => {
  const data = await Course.create(req.body);
  res.json(data);
});

router.get("/courses", async (req, res) => {
  const data = await Course.find();
  res.json(data);
});

router.get("/courses/:id", async (req, res) => {
  const data = await Course.findById(req.params.id);
  res.json(data);
});

router.put("/courses/:id", async (req, res) => {
  const data = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(data);
});

router.delete("/courses/:id", async (req, res) => {
  await Course.findByIdAndDelete(req.params.id);
  res.json({ message: "Course deleted" });
});


// =======================
//  ASSESSMENT CRUD
// =======================

router.post("/assessments", async (req, res) => {
  const data = await Assessment.create(req.body);
  res.json(data);
});

router.get("/assessments", async (req, res) => {
  const data = await Assessment.find();
  res.json(data);
});

router.get("/assessments/:id", async (req, res) => {
  const data = await Assessment.findById(req.params.id);
  res.json(data);
});

router.put("/assessments/:id", async (req, res) => {
  const data = await Assessment.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(data);
});

router.delete("/assessments/:id", async (req, res) => {
  await Assessment.findByIdAndDelete(req.params.id);
  res.json({ message: "Assessment deleted" });
});


// =======================
//  RESULT CRUD
// =======================

router.post("/results", async (req, res) => {
  const data = await Result.create(req.body);
  res.json(data);
});

router.get("/results", async (req, res) => {
  const data = await Result.find();
  res.json(data);
});

router.get("/results/:id", async (req, res) => {
  const data = await Result.findById(req.params.id);
  res.json(data);
});

router.put("/results/:id", async (req, res) => {
  const data = await Result.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(data);
});

router.delete("/results/:id", async (req, res) => {
  await Result.findByIdAndDelete(req.params.id);
  res.json({ message: "Result deleted" });
});


export default router;