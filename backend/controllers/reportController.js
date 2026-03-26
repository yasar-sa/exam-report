import mongoose from "mongoose";
import Result from "../models/Result.js";
import { ApiError } from "../middleware/errorHandler.js";

const DEFAULT_THRESHOLD = 60;

const parseCommaList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .flatMap((v) => String(v).split(","))
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

const parseThreshold = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  const num = Number(value);
  if (Number.isNaN(num)) return fallback;
  return num;
};

const toObjectId = (value, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(400, `Invalid ObjectId for '${fieldName}'`);
  }
  return new mongoose.Types.ObjectId(value);
};

//  COURSE REPORT
export const getCourseReport = async (req, res) => {
  const {
    courseId,
    startDate,
    endDate,
    types,
    thresholdCourse,
    thresholdStudent,
  } = req.query;

  const tCourse = parseThreshold(thresholdCourse, DEFAULT_THRESHOLD);
  const tStudent = parseThreshold(thresholdStudent, DEFAULT_THRESHOLD);
  const typeList = parseCommaList(types);

  const start = parseDate(startDate);
  const end = parseDate(endDate);

  const courseObjId = courseId ? toObjectId(courseId, "courseId") : null;

  const matchStage = {};
  if (typeList.length > 0) matchStage["assessment.type"] = { $in: typeList };
  if (start || end) {
    matchStage["assessment.date"] = {};
    if (start) matchStage["assessment.date"].$gte = start;
    if (end) matchStage["assessment.date"].$lte = end;
  }
  if (courseObjId) matchStage["course._id"] = courseObjId;

  const courseStudents = await Result.aggregate([
    {
      $lookup: {
        from: "assessments",
        localField: "assessmentId",
        foreignField: "_id",
        as: "assessment",
      },
    },
    { $unwind: "$assessment" },
    {
      $lookup: {
        from: "courses",
        localField: "assessment.courseId",
        foreignField: "_id",
        as: "course",
      },
    },
    { $unwind: "$course" },
    ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
    {
      $group: {
        _id: { courseId: "$course._id", studentId: "$studentId" },
        studentAvgScore: { $avg: "$score" },
      },
    },
    {
      $addFields: {
        isAtRiskStudent: { $lt: ["$studentAvgScore", tStudent] },
      },
    },
    {
      $group: {
        _id: "$_id.courseId",
        courseName: { $first: "$course.name" },
        avgScore: { $avg: "$studentAvgScore" },
        totalStudents: { $sum: 1 },
        atRiskStudents: { $sum: { $cond: ["$isAtRiskStudent", 1, 0] } },
      },
    },
    {
      $addFields: {
        isAtRiskCourse: { $lt: ["$avgScore", tCourse] },
      },
    },
    {
      $project: {
        _id: 0,
        courseId: "$_id",
        courseName: 1,
        avgScore: 1,
        totalStudents: 1,
        atRiskStudents: 1,
        isAtRiskCourse: 1,
      },
    },
  ]);

  const totalCourses = courseStudents.length;
  const atRiskCourseCount = courseStudents.filter((c) => c.isAtRiskCourse).length;

  res.json({
    success: true,
    data: {
      totalCourses,
      atRiskCourseCount,
      courses: courseStudents,
    },
  });
};

//  COURSE → ASSESSMENTS
export const getCourseAssessments = async (req, res) => {
  const { courseId } = req.params;
  const courseObjId = toObjectId(courseId, "courseId");

  const { startDate, endDate, types, thresholdCourse, thresholdStudent } = req.query;
  const tCourse = parseThreshold(thresholdCourse, DEFAULT_THRESHOLD);
  const tStudent = parseThreshold(thresholdStudent, DEFAULT_THRESHOLD);
  const typeList = parseCommaList(types);
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  const assessmentMatch = {
    "assessment.courseId": courseObjId,
  };
  if (typeList.length > 0) assessmentMatch["assessment.type"] = { $in: typeList };
  if (start || end) {
    assessmentMatch["assessment.date"] = {};
    if (start) assessmentMatch["assessment.date"].$gte = start;
    if (end) assessmentMatch["assessment.date"].$lte = end;
  }

  const data = await Result.aggregate([
    {
      $lookup: {
        from: "assessments",
        localField: "assessmentId",
        foreignField: "_id",
        as: "assessment",
      },
    },
    { $unwind: "$assessment" },
    { $match: assessmentMatch },
    {
      $group: {
        _id: "$assessment._id",
        name: { $first: "$assessment.name" },
        type: { $first: "$assessment.type" },
        date: { $first: "$assessment.date" },
        avgScore: { $avg: "$score" },
        totalStudents: { $sum: 1 },
        atRiskStudents: {
          $sum: { $cond: [{ $lt: ["$score", tStudent] }, 1, 0] },
        },
      },
    },
    {
      $addFields: {
        status: { $cond: [{ $lt: ["$avgScore", tCourse] }, "At Risk", "Good"] },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        type: 1,
        date: 1,
        avgScore: 1,
        status: 1,
        totalStudents: 1,
        atRiskStudents: 1,
        atRiskStudentPct: {
          $cond: [
            { $eq: ["$totalStudents", 0] },
            0,
            { $multiply: [{ $divide: ["$atRiskStudents", "$totalStudents"] }, 100] },
          ],
        },
      },
    },
    { $sort: { date: -1 } },
  ]);

  res.json({ success: true, data });
};

//  ASSESSMENT → STUDENTS
export const getAssessmentStudents = async (req, res) => {
  const { assessmentId } = req.params;
  const assessmentObjId = toObjectId(assessmentId, "assessmentId");

  const { thresholdStudent } = req.query;
  const tStudent = parseThreshold(thresholdStudent, DEFAULT_THRESHOLD);

  const data = await Result.aggregate([
    { $match: { assessmentId: assessmentObjId } },
    {
      $lookup: {
        from: "students",
        localField: "studentId",
        foreignField: "_id",
        as: "student",
      },
    },
    { $unwind: "$student" },
    {
      $project: {
        _id: 0,
        name: { $concat: ["$student.firstName", " ", "$student.lastName"] },
        score: 1,
        status: { $cond: [{ $lt: ["$score", tStudent] }, "At Risk", "Good"] },
      },
    },
    { $sort: { score: 1 } },
  ]);

  res.json({ success: true, data });
};

//  STUDENT REPORT
export const getStudentReport = async (req, res) => {
  const {
    courseId,
    startDate,
    endDate,
    types,
    thresholdStudent,
  } = req.query;

  const tStudent = parseThreshold(thresholdStudent, DEFAULT_THRESHOLD);
  const typeList = parseCommaList(types);
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  const assessmentMatch = {};
  if (courseId) assessmentMatch["assessment.courseId"] = toObjectId(courseId, "courseId");
  if (typeList.length > 0) assessmentMatch["assessment.type"] = { $in: typeList };
  if (start || end) {
    assessmentMatch["assessment.date"] = {};
    if (start) assessmentMatch["assessment.date"].$gte = start;
    if (end) assessmentMatch["assessment.date"].$lte = end;
  }

  const studentRows = await Result.aggregate([
    {
      $lookup: {
        from: "assessments",
        localField: "assessmentId",
        foreignField: "_id",
        as: "assessment",
      },
    },
    { $unwind: "$assessment" },
    ...(Object.keys(assessmentMatch).length > 0 ? [{ $match: assessmentMatch }] : []),
    {
      $group: {
        _id: "$studentId",
        avgScore: { $avg: "$score" },
      },
    },
    {
      $lookup: {
        from: "students",
        localField: "_id",
        foreignField: "_id",
        as: "student",
      },
    },
    { $unwind: "$student" },
    {
      $project: {
        _id: 0,
        name: { $concat: ["$student.firstName", " ", "$student.lastName"] },
        avgScore: 1,
        status: { $cond: [{ $lt: ["$avgScore", tStudent] }, "At Risk", "Good"] },
      },
    },
    { $sort: { avgScore: 1 } },
  ]);

  res.json({
    success: true,
    data: {
      totalStudents: studentRows.length,
      atRiskStudentsCount: studentRows.filter((s) => s.status === "At Risk").length,
      students: studentRows,
    },
  });
};

// export const getCourseSummary = async (req, res) => {
//   const data = await Result.aggregate([
//     {
//       $lookup: {
//         from: "assessments",
//         localField: "assessmentId",
//         foreignField: "_id",
//         as: "assessment"
//       }
//     },
//     { $unwind: "$assessment" },

//     {
//       $lookup: {
//         from: "courses",
//         localField: "assessment.courseId",
//         foreignField: "_id",
//         as: "course"
//       }
//     },
//     { $unwind: "$course" },

//     {
//       $group: {
//         _id: "$course._id",
//         avgScore: { $avg: "$score" }
//       }
//     },

//     {
//       $group: {
//         // _id: null,
//         totalCourses: { $sum: 1 },
//         atRiskCourses: {
//           $sum: {
//             $cond: [{ $lt: ["$avgScore", threshold] }, 1, 0]
//           }
//         }
//       }
//     }
//   ]);

//   res.json({ success: true, data: data[0] || {} });
// };