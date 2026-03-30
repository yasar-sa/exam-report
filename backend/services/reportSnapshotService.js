import mongoose from "mongoose";
import Course from "../models/Course.js";
import Result from "../models/Result.js";
import { ApiError } from "../middleware/errorHandler.js";

const DEFAULT_THRESHOLD = 60;

// Parses a comma-separated string or array into a clean string array
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

// Parses a value into a valid Date, or returns null if invalid
const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

// Parses a numeric threshold, falling back to a default if absent or invalid
const parseThreshold = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  const num = Number(value);
  return Number.isNaN(num) ? fallback : num;
};

// Converts a string to a Mongoose ObjectId, throws 400 if invalid
export const toObjectId = (value, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(400, `Invalid ObjectId for '${fieldName}'`);
  }
  return new mongoose.Types.ObjectId(value);
};

// Resolves the assessment type list from several possible config shapes
const buildTypeList = (config = {}) => {
  if (config.types) return parseCommaList(config.types);
  if (config.selectedTypesString)
    return parseCommaList(config.selectedTypesString);
  if (config.assessmentTypes && typeof config.assessmentTypes === "object") {
    return Object.entries(config.assessmentTypes)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([type]) => type);
  }
  return [];
};

// Extracts and normalises shared filtering config (dates, thresholds, types, assessment IDs)
const buildCommonConfig = (config = {}) => {
  const thresholds = config.sliderValues || {};
  const assessmentIdList = parseCommaList(
    config.assessmentIds || config.selectedAssessmentIds,
  ).map((id) => toObjectId(id, "assessmentId"));

  return {
    startDate: config.startDate || "",
    endDate: config.endDate || "",
    thresholdCourse: parseThreshold(
      config.thresholdCourse ?? thresholds.courseAtRisk,
      DEFAULT_THRESHOLD,
    ),
    thresholdStudent: parseThreshold(
      config.thresholdStudent ?? thresholds.studentAtRisk,
      DEFAULT_THRESHOLD,
    ),
    typeList: buildTypeList(config),
    assessmentIdList,
  };
};

// Adds $gte/$lte date range filter onto a $match object if dates are provided
const withDateMatch = (target, start, end, fieldName) => {
  if (!start && !end) return;
  target[fieldName] = {};
  if (start) target[fieldName].$gte = start;
  if (end) target[fieldName].$lte = end;
};

// ─── Course Report ────────────────────────────────────────────────────────────

export const generateCourseReportSnapshot = async (config = {}) => {
  const { courseId } = config;
  if (!courseId) throw new ApiError(400, "courseId is required");

  const courseObjId = toObjectId(courseId, "courseId");
  const {
    startDate,
    endDate,
    thresholdCourse,
    thresholdStudent,
    typeList,
    assessmentIdList,
  } = buildCommonConfig(config);

  const start = parseDate(startDate);
  const end = parseDate(endDate);

  const course = await Course.findById(courseObjId).lean();
  if (!course) throw new ApiError(404, "Course not found");

  const summaryMatch = { "course._id": courseObjId };
  const assessmentMatch = { "assessment.courseId": courseObjId };

  if (typeList.length > 0) {
    summaryMatch["assessment.type"] = { $in: typeList };
    assessmentMatch["assessment.type"] = { $in: typeList };
  }
  if (assessmentIdList.length > 0) {
    summaryMatch["assessment._id"] = { $in: assessmentIdList };
    assessmentMatch["assessment._id"] = { $in: assessmentIdList };
  }
2
  withDateMatch(summaryMatch, start, end, "assessment.date");
  withDateMatch(assessmentMatch, start, end, "assessment.date");

  const [courseStudents, assessments, studentRows] = await Promise.all([
    // Aggregation 1: Per-course student averages → course-level risk summary
    Result.aggregate([
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
      { $match: summaryMatch },
      {
        // Step 1: Average each student's score within the course
        $group: {
          _id: { courseId: "$course._id", studentId: "$studentId" },
          courseName: { $first: "$course.name" },
          studentAvgScore: { $avg: "$score" },
        },
      },
      {
        $addFields: {
          isAtRiskStudent: { $lt: ["$studentAvgScore", thresholdStudent] },
        },
      },
      {
        // Step 2: Roll up to course level
        $group: {
          _id: "$_id.courseId",
          courseName: { $first: "$courseName" },
          avgScore: { $avg: "$studentAvgScore" },
          totalStudents: { $sum: 1 },
        },
      },
      {
        $addFields: {
          isAtRiskCourse: { $lt: ["$avgScore", thresholdCourse] },
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
    ]),

    // Aggregation 2: Per-assessment averages and risk status
    Result.aggregate([
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
            $sum: { $cond: [{ $lt: ["$score", thresholdStudent] }, 1, 0] },
          },
        },
      },
      {
        $addFields: {
          status: {
            $cond: [{ $lt: ["$avgScore", thresholdCourse] }, "At Risk", "Good"],
          },
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
              {
                $multiply: [
                  { $divide: ["$atRiskStudents", "$totalStudents"] },
                  100,
                ],
              },
            ],
          },
        },
      },
      { $sort: { date: -1 } },
    ]),

    // Aggregation 3: Flat list of student scores per assessment
    Result.aggregate([
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
          assessmentId: "$assessment._id",
          studentId: "$student._id",
          firstName: "$student.firstName",
          lastName: "$student.lastName",
          name: { $concat: ["$student.firstName", " ", "$student.lastName"] },
          score: 1,
          status: {
            $cond: [{ $lt: ["$score", thresholdStudent] }, "At Risk", "Good"],
          },
        },
      },
      { $sort: { score: 1, lastName: 1, firstName: 1 } },
    ]),
  ]);

  const courseSummary = courseStudents[0] || {
    courseId: course._id,
    courseName: course.name,
    avgScore: 0,
    totalStudents: 0,
    atRiskStudents: 0,
    isAtRiskCourse: false,
  };

  return {
    summary: {
      courseId: String(course._id),
      courseName: course.name,
      startedAt: startDate || "",
      endedAt: endDate || "",
      selectedTypesString: typeList.join(","),
      thresholds: {
        courseAtRisk: thresholdCourse,
        studentAtRisk: thresholdStudent,
      },
      selectedAssessmentIds: assessmentIdList.map((id) => String(id)),
      totalCourses: courseStudents.length > 0 ? courseStudents.length : 1,
      atRiskCourseCount:
        courseStudents.length > 0
          ? courseStudents.filter((c) => c.isAtRiskCourse).length
          : courseSummary.isAtRiskCourse
            ? 1
            : 0,
      courses: [courseSummary],
      avgScore: courseSummary.avgScore,
      totalStudents: courseSummary.totalStudents,
      atRiskStudents: courseSummary.atRiskStudents,
      isAtRiskCourse: courseSummary.isAtRiskCourse,
      assessments,
    },
    students: studentRows.map((s) => ({
      assessmentId: s.assessmentId,
      studentId: s.studentId,
      firstName: s.firstName,
      lastName: s.lastName,
      name: s.name,
      score: s.score,
      status: s.status,
    })),
  };
};

// ─── Student Report ───────────────────────────────────────────────────────────

export const generateStudentReportSnapshot = async (config = {}) => {
  const { courseId } = config;
  if (!courseId) throw new ApiError(400, "courseId is required");

  const courseObjId = toObjectId(courseId, "courseId");
  const { startDate, endDate, thresholdStudent, typeList, assessmentIdList } =
    buildCommonConfig(config);

  const start = parseDate(startDate);
  const end = parseDate(endDate);

  const course = await Course.findById(courseObjId).lean();
  if (!course) throw new ApiError(404, "Course not found");

  const assessmentMatch = { "assessment.courseId": courseObjId };
  if (typeList.length > 0)
    assessmentMatch["assessment.type"] = { $in: typeList };
  if (assessmentIdList.length > 0)
    assessmentMatch["assessment._id"] = { $in: assessmentIdList };
  withDateMatch(assessmentMatch, start, end, "assessment.date");

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
    { $match: assessmentMatch },
    {
      // Average each student's scores across all matching assessments
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
        _id: 1,
        firstName: "$student.firstName",
        lastName: "$student.lastName",
        name: { $concat: ["$student.firstName", " ", "$student.lastName"] },
        avgScore: 1,
        status: {
          $cond: [{ $lt: ["$avgScore", thresholdStudent] }, "At Risk", "Good"],
        },
      },
    },
    { $sort: { avgScore: 1, lastName: 1, firstName: 1 } },
  ]);

  return {
    summary: {
      courseId: String(course._id),
      courseName: course.name,
      startedAt: startDate || "",
      endedAt: endDate || "",
      selectedTypesString: typeList.join(","),
      thresholds: {
        studentAtRisk: thresholdStudent,
      },
      selectedAssessmentIds: assessmentIdList.map((id) => String(id)),
      totalStudents: studentRows.length,
      atRiskStudentsCount: studentRows.filter((s) => s.status === "At Risk")
        .length,
      avgScore:
        studentRows.length > 0
          ? studentRows.reduce((sum, s) => sum + (s.avgScore || 0), 0) /
            studentRows.length
          : 0,
    },
    students: studentRows.map((s) => ({
      studentId: s._id,
      firstName: s.firstName,
      lastName: s.lastName,
      name: s.name,
      avgScore: s.avgScore,
      status: s.status,
    })),
  };
};

