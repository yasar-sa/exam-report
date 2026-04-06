import Result from "../models/Result.js";
import {
  generateCourseReportSnapshot,
  generateStudentReportSnapshot,
  toObjectId,
} from "../services/reportSnapshotService.js";

const DEFAULT_THRESHOLD = 60;

const parseThreshold = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  const num = Number(value);
  if (Number.isNaN(num)) return fallback;
  return num;
};

//  COURSE REPORT
export const getCourseReport = async (req, res) => {
  const snapshot = await generateCourseReportSnapshot(req.query);

  res.json({
    success: true,
    data: snapshot.summary,
  });
};

//  COURSE → ASSESSMENTS
export const getCourseAssessments = async (req, res) => {
  const snapshot = await generateCourseReportSnapshot({
    ...req.query,
    courseId: req.params.courseId,
  });

  res.json({ success: true, data: snapshot.assessments });
};

//  ASSESSMENT → STUDENTS
export const getAssessmentStudents = async (req, res) => {
  const { assessmentId } = req.params;
  const assessmentObjId = toObjectId(assessmentId, "assessmentId");

  const { thresholdStudent } = req.query;
  const tStudent = parseThreshold(thresholdStudent, DEFAULT_THRESHOLD);

  const data = await Result.aggregate([
    { $match: { _reportCourse: assessmentObjId } },
    {
      $project: {
        _id: 0,
        name: "$student.name",
        score: "$percentage",
        status: { $cond: [{ $lt: ["$percentage", tStudent] }, "At Risk", "Good"] },
      },
    },
    { $sort: { score: 1 } },
  ]);

  res.json({ success: true, data });
};

//  STUDENT REPORT
export const getStudentReport = async (req, res) => {
  const snapshot = await generateStudentReportSnapshot(req.query);

  res.json({
    success: true,
    data: {
      totalStudents: snapshot.totalStudents,
      atRiskStudentsCount: snapshot.atRiskStudentsCount,
      students: snapshot.students,
    },
  });
};
