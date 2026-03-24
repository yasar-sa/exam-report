import express from "express";
const router = express.Router();

import {
    getCourseReport,
    getCourseAssessments,
    getAssessmentStudents,
    getStudentReport,
    getCourseSummary,
} from "../controllers/reportController.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { validateObjectIdParam } from "../middleware/validators.js";

router.get("/course", asyncHandler(getCourseReport));
router.get(
    "/courses/:courseId/assessments",
    validateObjectIdParam("courseId"),
    asyncHandler(getCourseAssessments),
);
router.get(
    "/assessments/:assessmentId/students",
    validateObjectIdParam("assessmentId"),
    asyncHandler(getAssessmentStudents),
);
router.get("/students", asyncHandler(getStudentReport));
router.get("/course/summary", asyncHandler(getCourseSummary));

export default router;
