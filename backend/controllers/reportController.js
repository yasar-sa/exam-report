import mongoose from "mongoose";
import Result from "../models/Result.js";
import { ApiError } from "../middleware/errorHandler.js";

const threshold = 60;

//  COURSE REPORT
export const getCourseReport = async (req, res) => {
  const data = await Result.aggregate([
    {
      $lookup: {
        from: "assessments",
        localField: "assessmentId",
        foreignField: "_id",
        as: "assessment"
      }
    },
    { $unwind: "$assessment" },

    {
      $lookup: {
        from: "courses",
        localField: "assessment.courseId",
        foreignField: "_id",
        as: "course"
      }
    },
    { $unwind: "$course" },

    {
      $group: {
        _id: "$course._id",
        courseName: { $first: "$course.name" },
        avgScore: { $avg: "$score" },
        totalStudents: { $sum: 1 },
        atRiskStudents: {
          $sum: {
            $cond: [{ $lt: ["$score", threshold] }, 1, 0]
          }
        }
      }
    }
  ]);

  res.json({ success: true, data });
};

//  COURSE → ASSESSMENTS
export const getCourseAssessments = async (req, res) => {
  const { courseId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new ApiError(400, "Invalid courseId");
  }

  const data = await Result.aggregate([
    {
      $lookup: {
        from: "assessments",
        localField: "assessmentId",
        foreignField: "_id",
        as: "assessment"
      }
    },
    { $unwind: "$assessment" },

    {
      $match: {
        "assessment.courseId": new mongoose.Types.ObjectId(courseId)
      }
    },

    {
      $group: {
        _id: "$assessment._id",
        name: { $first: "$assessment.name" },
        avgScore: { $avg: "$score" },
        date: { $first: "$assessment.date" }
      }
    }
  ]);

  res.json({ success: true, data });
};

//  ASSESSMENT → STUDENTS
export const getAssessmentStudents = async (req, res) => {
  const { assessmentId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
    throw new ApiError(400, "Invalid assessmentId");
  }

  const data = await Result.aggregate([
    {
      $match: {
        assessmentId: new mongoose.Types.ObjectId(assessmentId)
      }
    },

    {
      $lookup: {
        from: "students",
        localField: "studentId",
        foreignField: "_id",
        as: "student"
      }
    },
    { $unwind: "$student" },

    {
      $project: {
        name: {
          $concat: ["$student.firstName", " ", "$student.lastName"]
        },
        score: 1,
        status: {
          $cond: [{ $lt: ["$score", threshold] }, "At Risk", "Good"]
        }
      }
    }
  ]);

  res.json({ success: true, data });
};

//  STUDENT REPORT
export const getStudentReport = async (req, res) => {
  const data = await Result.aggregate([
    {
      $lookup: {
        from: "students",
        localField: "studentId",
        foreignField: "_id",
        as: "student"
      }
    },
    { $unwind: "$student" },

    {
      $group: {
        _id: "$student._id",
        name: {
          $first: {
            $concat: ["$student.firstName", " ", "$student.lastName"]
          }
        },
        avgScore: { $avg: "$score" }
      }
    },

    {
      $project: {
        name: 1,
        avgScore: 1,
        status: {
          $cond: [{ $lt: ["$avgScore", threshold] }, "At Risk", "Good"]
        }
      }
    }
  ]);

  res.json({ success: true, data });
};

export const getCourseSummary = async (req, res) => {
  const data = await Result.aggregate([
    {
      $lookup: {
        from: "assessments",
        localField: "assessmentId",
        foreignField: "_id",
        as: "assessment"
      }
    },
    { $unwind: "$assessment" },

    {
      $lookup: {
        from: "courses",
        localField: "assessment.courseId",
        foreignField: "_id",
        as: "course"
      }
    },
    { $unwind: "$course" },

    {
      $group: {
        _id: "$course._id",
        avgScore: { $avg: "$score" }
      }
    },

    {
      $group: {
        _id: null,
        totalCourses: { $sum: 1 },
        atRiskCourses: {
          $sum: {
            $cond: [{ $lt: ["$avgScore", threshold] }, 1, 0]
          }
        }
      }
    }
  ]);

  res.json({ success: true, data: data[0] || {} });
};