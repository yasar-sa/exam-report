import express from "express";
const router = express.Router();

import {
  getCourseReport,
  getCourseAssessments,
  getAssessmentStudents,
  getStudentReport,
  getCourseSummary
} from "../controllers/reportController.js";

router.get("/course", getCourseReport);
router.get("/courses/:courseId/assessments", getCourseAssessments);
router.get("/assessments/:assessmentId/students", getAssessmentStudents);
router.get("/students", getStudentReport);
router.get("/course/summary", getCourseSummary);

export default router;