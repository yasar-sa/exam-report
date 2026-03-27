import mongoose from "mongoose";
import Course from "../models/Course.js";
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

export const toObjectId = (value, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(400, `Invalid ObjectId for '${fieldName}'`);
  }
  return new mongoose.Types.ObjectId(value);
};

const buildTypeList = (config = {}) => {
  if (config.types) return parseCommaList(config.types);

  if (config.selectedTypesString) {
    return parseCommaList(config.selectedTypesString);
  }

  if (config.assessmentTypes && typeof config.assessmentTypes === "object") {
    return Object.entries(config.assessmentTypes)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([type]) => type);
  }

  return [];
};

const buildCommonConfig = (config = {}) => {
  const thresholds = config.sliderValues || {};
  const assessmentIdList = parseCommaList(
    config.assessmentIds || config.selectedAssessmentIds,
  ).map((assessmentId) => toObjectId(assessmentId, "assessmentId"));

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

const withDateMatch = (target, start, end, fieldName) => {
  if (!start && !end) return;

  target[fieldName] = {};
  if (start) target[fieldName].$gte = start;
  if (end) target[fieldName].$lte = end;
};

export const generateCourseReportSnapshot = async (config = {}) => {
  const { courseId } = config;
  if (!courseId) {
    throw new ApiError(400, "courseId is required");
  }

  const courseObjId = toObjectId(courseId, "courseId");
  const {
    startDate,
    endDate,
    thresholdCourse,
    thresholdStudent,
    typeList,
    assessmentIdList,
  } =
    buildCommonConfig(config);

  const start = parseDate(startDate);
  const end = parseDate(endDate);

  const course = await Course.findById(courseObjId).lean();
  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  const summaryMatch = { "course._id": courseObjId };
  if (typeList.length > 0) summaryMatch["assessment.type"] = { $in: typeList };
  if (assessmentIdList.length > 0) summaryMatch["assessment._id"] = { $in: assessmentIdList };
  withDateMatch(summaryMatch, start, end, "assessment.date");

  const assessmentMatch = { "assessment.courseId": courseObjId };
  if (typeList.length > 0) assessmentMatch["assessment.type"] = { $in: typeList };
  if (assessmentIdList.length > 0) assessmentMatch["assessment._id"] = { $in: assessmentIdList };
  withDateMatch(assessmentMatch, start, end, "assessment.date");

  const [courseStudents, assessments, studentRows] = await Promise.all([
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
        $group: {
          _id: "$_id.courseId",
          courseName: { $first: "$courseName" },
          avgScore: { $avg: "$studentAvgScore" },
          totalStudents: { $sum: 1 },
          atRiskStudents: { $sum: { $cond: ["$isAtRiskStudent", 1, 0] } },
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
              { $multiply: [{ $divide: ["$atRiskStudents", "$totalStudents"] }, 100] },
            ],
          },
        },
      },
      { $sort: { date: -1 } },
    ]),
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
          firstName: "$student.firstName",
          lastName: "$student.lastName",
          name: {
            $concat: ["$student.firstName", " ", "$student.lastName"],
          },
          score: 1,
          status: { $cond: [{ $lt: ["$score", thresholdStudent] }, "At Risk", "Good"] },
        },
      },
      { $sort: { score: 1, lastName: 1, firstName: 1 } },
    ]),
  ]);

  const studentsByAssessment = studentRows.reduce((acc, student) => {
    const key = String(student.assessmentId);
    if (!acc[key]) acc[key] = [];
    acc[key].push({
      firstName: student.firstName,
      lastName: student.lastName,
      name: student.name,
      score: student.score,
      status: student.status,
    });
    return acc;
  }, {});

  const courseSummary = courseStudents[0] || {
    courseId: course._id,
    courseName: course.name,
    avgScore: 0,
    totalStudents: 0,
    atRiskStudents: 0,
    isAtRiskCourse: false,
  };

  const hydratedAssessments = assessments.map((assessment) => ({
    ...assessment,
    students: studentsByAssessment[String(assessment._id)] || [],
  }));

  return {
    courseId: String(course._id),
    courseName: course.name,
    startedAt: startDate || "",
    endedAt: endDate || "",
    selectedTypesString: typeList.join(","),
    thresholds: {
      courseAtRisk: thresholdCourse,
      studentAtRisk: thresholdStudent,
    },
    selectedAssessmentIds: assessmentIdList.map((assessmentId) => String(assessmentId)),
    summary: {
      totalCourses: courseStudents.length > 0 ? courseStudents.length : 1,
      atRiskCourseCount:
        courseStudents.length > 0
          ? courseStudents.filter((item) => item.isAtRiskCourse).length
          : courseSummary.isAtRiskCourse
            ? 1
            : 0,
      courses: [courseSummary],
      avgScore: courseSummary.avgScore,
      totalStudents: courseSummary.totalStudents,
      atRiskStudents: courseSummary.atRiskStudents,
      isAtRiskCourse: courseSummary.isAtRiskCourse,
    },
    assessments: hydratedAssessments,
  };
};

export const generateStudentReportSnapshot = async (config = {}) => {
  const { courseId } = config;
  if (!courseId) {
    throw new ApiError(400, "courseId is required");
  }

  const courseObjId = toObjectId(courseId, "courseId");
  const { startDate, endDate, thresholdStudent, typeList, assessmentIdList } =
    buildCommonConfig(config);

  const start = parseDate(startDate);
  const end = parseDate(endDate);

  const course = await Course.findById(courseObjId).lean();
  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  const assessmentMatch = { "assessment.courseId": courseObjId };
  if (typeList.length > 0) assessmentMatch["assessment.type"] = { $in: typeList };
  if (assessmentIdList.length > 0) assessmentMatch["assessment._id"] = { $in: assessmentIdList };
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
        firstName: "$student.firstName",
        lastName: "$student.lastName",
        name: { $concat: ["$student.firstName", " ", "$student.lastName"] },
        avgScore: 1,
        status: { $cond: [{ $lt: ["$avgScore", thresholdStudent] }, "At Risk", "Good"] },
      },
    },
    { $sort: { avgScore: 1, lastName: 1, firstName: 1 } },
  ]);

  return {
    courseId: String(course._id),
    courseName: course.name,
    startedAt: startDate || "",
    endedAt: endDate || "",
    selectedTypesString: typeList.join(","),
    thresholds: {
      studentAtRisk: thresholdStudent,
    },
    selectedAssessmentIds: assessmentIdList.map((assessmentId) => String(assessmentId)),
    totalStudents: studentRows.length,
    atRiskStudentsCount: studentRows.filter((item) => item.status === "At Risk").length,
    students: studentRows,
  };
};
