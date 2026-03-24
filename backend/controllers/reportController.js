import mongoose from "mongoose";
import Result from "../models/Result.js";

const threshold = 60;

//  COURSE REPORT
export const getCourseReport = async (req, res) => {
  try {
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

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//  COURSE → ASSESSMENTS
export const getCourseAssessments = async (req, res) => {
  try {
    const { courseId } = req.params;

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

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//  ASSESSMENT → STUDENTS
export const getAssessmentStudents = async (req, res) => {
  try {
    const { assessmentId } = req.params;

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

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//  STUDENT REPORT
export const getStudentReport = async (req, res) => {
  try {
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

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
            $cond: [{ $lt: ["$avgScore", 60] }, 1, 0]
          }
        }
      }
    }
  ]);

  res.json(data[0] || {});
};