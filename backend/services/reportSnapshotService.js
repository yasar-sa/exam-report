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
  return Number.isNaN(d.getTime()) ? null : d;
};

const parseThreshold = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  const num = Number(value);
  return Number.isNaN(num) ? fallback : num;
};

export const toObjectId = (value, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(400, `Invalid ObjectId for '${fieldName}'`);
  }
  return new mongoose.Types.ObjectId(value);
};

const buildTypeList = (config = {}) => {
  if (config.types) return parseCommaList(config.types);
  if (config.selectedTypesString) return parseCommaList(config.selectedTypesString);
  if (config.assessmentTypes && typeof config.assessmentTypes === "object") {
    return Object.entries(config.assessmentTypes)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([type]) => type);
  }
  return [];
};

const buildCommonConfig = (config = {}) => {
  const thresholds = config.sliderValues || {};

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
    assessmentIdList: parseCommaList(
      config.assessmentIds || config.selectedAssessmentIds,
    ).map((id) => toObjectId(id, "assessmentId")),
    courseIds: parseCommaList(config.courseId || config.courseIds).map((id) =>
      toObjectId(id, "courseId"),
    ),
    typeList: buildTypeList(config),
  };
};

const buildAssessmentMatch = ({
  courseIds,
  assessmentIdList,
  start,
  end,
  includeDate,
}) => {
  const match = {
    "course._id": { $in: courseIds },
  };

  if (assessmentIdList.length > 0) {
    match["assessment._id"] = { $in: assessmentIdList };
  }

  if (includeDate && (start || end)) {
    match["assessment.date"] = {};
    if (start) match["assessment.date"].$gte = start;
    if (end) match["assessment.date"].$lte = end;
  }

  return match;
};

const buildCombinedCourseName = (courses) => {
  if (courses.length > 1) {
    return `${courses.length} Courses (${courses.map((course) => course.name).join(", ")})`;
  }
  return courses[0].name;
};

const fetchResultRows = async (assessmentMatch) => {
  return Result.aggregate([
    {
      $lookup: {
        from: "courses", //name of the collection in the db digiassess
        localField: "_reportCourse", //field name of the courses collection in the student_result collection
        foreignField: "_id", //field name of the course in the courses collection
        as: "reportInstance", // name of the new name to be created
      },
    },
    { $unwind: "$reportInstance" },
    { $match: { "reportInstance.status.overAll": "PUBLISHED" } },
    {
      $lookup: {
        from: "exam_course_groups",
        localField: "reportInstance._courseGroup",
        foreignField: "_id",
        as: "assessment",
      },
    },
    { $unwind: "$assessment" },
    { $match: { "assessment.status": "COMPLETED" } },
    {
      $lookup: {
        from: "course_hierarchies",
        localField: "assessment.name",
        foreignField: "name",
        as: "course",
      },
    },
    { $unwind: "$course" },
    { $match: assessmentMatch },
    {
      $project: {
        _id: 0,
        assessmentId: "$reportInstance._id",
        assessmentName: "$assessment.name",
        assessmentDate: "$assessment.date",
        courseId: "$course._id",
        studentId: "$student._id",
        name: "$student.name",
        score: "$percentage",
        marks: 1,
        totalMarks: 1,
        grade: 1,
        percentage: 1,
        year: "$assessment.hierarchy.year.name",
        term: "$assessment.hierarchy.term.name",
        level: "$assessment.hierarchy.level.name",
        program: "$assessment.hierarchy.program.name",
      },
    },
    { $sort: { assessmentDate: -1, score: 1, name: 1 } },
  ]);
};

const buildCourseSnapshotFromRows = ({
  rows,
  courses,
  courseIds,
  startDate,
  endDate,
  typeList,
  thresholdCourse,
  thresholdStudent,
  assessmentIdList,
}) => {
  const assessmentMap = new Map();
  const studentAverageMap = new Map();
  const students = [];

  for (const row of rows) {
    const assessmentKey = String(row.assessmentId);
    const studentKey = String(row.studentId);

    if (!assessmentMap.has(assessmentKey)) {
      assessmentMap.set(assessmentKey, {
        _id: row.assessmentId,
        name: row.assessmentName,
        date: row.assessmentDate,
        year: row.year,
        term: row.term,
        level: row.level,
        program: row.program,
        scoreTotal: 0,
        totalStudents: 0,
        atRiskStudents: 0,
      });
    }

    const assessment = assessmentMap.get(assessmentKey);
    assessment.scoreTotal += row.score;
    assessment.totalStudents += 1;
    if (row.score < thresholdStudent) {
      assessment.atRiskStudents += 1;
    }

    if (!studentAverageMap.has(studentKey)) {
      studentAverageMap.set(studentKey, {
        studentId: row.studentId,
        scoreTotal: 0,
        count: 0,
      });
    }

    const studentAverage = studentAverageMap.get(studentKey);
    studentAverage.scoreTotal += row.score;
    studentAverage.count += 1;

    students.push({
      assessmentId: row.assessmentId,
      studentId: row.studentId,
      name: row.name,
      score: row.score,
      marks: row.marks,
      totalMarks: row.totalMarks,
      grade: row.grade,
      status: row.score < thresholdStudent ? "At Risk" : "Good",
    });
  }

  const assessments = Array.from(assessmentMap.values())
    .map((assessment) => {
      const avgScore =
        assessment.totalStudents > 0 ? assessment.scoreTotal / assessment.totalStudents : 0;

      return {
        _id: assessment._id,
        name: assessment.name,
        date: assessment.date,
        year: assessment.year,
        term: assessment.term,
        level: assessment.level,
        program: assessment.program,
        avgScore,
        totalStudents: assessment.totalStudents,
        atRiskStudents: assessment.atRiskStudents,
        atRiskStudentPct:
          assessment.totalStudents > 0
            ? (assessment.atRiskStudents / assessment.totalStudents) * 100
            : 0,
        status: avgScore < thresholdCourse ? "At Risk" : "Good",
      };
    })
    .sort((first, second) => new Date(second.date) - new Date(first.date));

  const totalAssessmentsCount = assessments.length;
  const atRiskAssessmentsCount = assessments.filter((a) => a.status === "At Risk").length;
  const avgScore =
    totalAssessmentsCount > 0
      ? assessments.reduce((sum, a) => sum + a.avgScore, 0) / totalAssessmentsCount
      : 0;

  return {
    summary: {
      courseId: courseIds.map((id) => String(id)).join(","),
      courseName: buildCombinedCourseName(courses),
      startedAt: startDate,
      endedAt: endDate,
      selectedTypesString: typeList.join(","),
      thresholds: {
        courseAtRisk: thresholdCourse,
        studentAtRisk: thresholdStudent,
      },
      selectedAssessmentIds: assessmentIdList.map((id) => String(id)),
      totalAssessmentsCount,
      atRiskAssessmentsCount,
      avgScore,
      assessments,
    },
    students,
  };
};

const buildStudentSnapshotFromRows = ({
  rows,
  courses,
  courseIds,
  typeList,
  thresholdStudent,
  assessmentIdList,
}) => {
  const studentMap = new Map();

  for (const row of rows) {
    const studentKey = String(row.studentId);

    if (!studentMap.has(studentKey)) {
      studentMap.set(studentKey, {
        _id: row.studentId,
        name: row.name,
        scoreTotal: 0,
        count: 0,
      });
    }

    const student = studentMap.get(studentKey);
    student.scoreTotal += row.score;
    student.count += 1;
  }

  const students = Array.from(studentMap.values())
    .map((student) => {
      const avgScore = student.count > 0 ? student.scoreTotal / student.count : 0;
      return {
        studentId: student._id,
        name: student.name,
        avgScore,
        status: avgScore < thresholdStudent ? "At Risk" : "Good",
      };
    })
    .sort((first, second) => {
      if (first.avgScore !== second.avgScore) return first.avgScore - second.avgScore;
      return first.name.localeCompare(second.name);
    });

  return {
    summary: {
      courseId: courseIds.map((id) => String(id)).join(","),
      courseName: courses.length > 1 ? `${courses.length} Courses` : courses[0].name,
      startedAt: "",
      endedAt: "",
      selectedTypesString: typeList.join(","),
      thresholds: {
        studentAtRisk: thresholdStudent,
      },
      selectedAssessmentIds: assessmentIdList.map((id) => String(id)),
      totalStudents: students.length,
      atRiskStudentsCount: students.filter((student) => student.status === "At Risk").length,
      avgScore:
        students.length > 0
          ? students.reduce((sum, student) => sum + student.avgScore, 0) / students.length
          : 0,
    },
    students,
  };
};

export const generateCourseReportSnapshot = async (config = {}) => {
  const {
    startDate,
    endDate,
    thresholdCourse,
    thresholdStudent,
    typeList,
    assessmentIdList,
    courseIds,
  } = buildCommonConfig(config);

  if (courseIds.length === 0) {
    throw new ApiError(400, "At least one courseId is required");
  }

  if (!startDate || !endDate) {
    throw new ApiError(400, "Both 'startDate' and 'endDate' are required for Course Reports");
  }

  const start = parseDate(startDate);
  const end = parseDate(endDate);

  if (start && end && start > end) {
    throw new ApiError(400, "'startDate' cannot be after 'endDate'");
  }

  const courses = await Course.find({ _id: { $in: courseIds } }).lean();
  if (courses.length === 0) {
    throw new ApiError(404, "No courses found");
  }

  const assessmentMatch = buildAssessmentMatch({
    courseIds,
    typeList,
    assessmentIdList,
    start,
    end,
    includeDate: true,
  });

  const rows = await fetchResultRows(assessmentMatch);

  return buildCourseSnapshotFromRows({
    rows,
    courses,
    courseIds,
    startDate,
    endDate,
    typeList,
    thresholdCourse,
    thresholdStudent,
    assessmentIdList,
  });
};

export const generateStudentReportSnapshot = async (config = {}) => {
  const { thresholdStudent, typeList, assessmentIdList, courseIds } =
    buildCommonConfig(config);

  if (courseIds.length === 0) {
    throw new ApiError(400, "At least one courseId is required");
  }

  const courses = await Course.find({ _id: { $in: courseIds } }).lean();
  if (courses.length === 0) {
    throw new ApiError(404, "No courses found");
  }

  const assessmentMatch = buildAssessmentMatch({
    courseIds,
    typeList,
    assessmentIdList,
    includeDate: false,
  });

  const rows = await fetchResultRows(assessmentMatch);

  return buildStudentSnapshotFromRows({
    rows,
    courses,
    courseIds,
    typeList,
    thresholdStudent,
    assessmentIdList,
  });
};