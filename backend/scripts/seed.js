import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../config/db.js";

// Models
import Course from "../models/Course.js";
import Student from "../models/Student.js";
import Assessment from "../models/Assessment.js";
import Result from "../models/Result.js";

dotenv.config();

const DEPARTMENTS = ["Jamia Darussalam"];

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log("Clearing existing data...");
    await Result.deleteMany({});
    await Assessment.deleteMany({});
    await Student.deleteMany({});
    await Course.deleteMany({});

    console.log("Creating Courses...");
    const courses = await Course.insertMany([
      { name: "Mathematics 101" },
      { name: "Physics 201" },
      { name: "English Literature" },
    ]);

    console.log("Creating Students...");
    const studentsData = Array.from({ length: 20 }).map((_, i) => ({
      firstName: `Student${i + 1}`,
      lastName: `Test${i + 1}`,
      department: DEPARTMENTS[0],
    }));
    const students = await Student.insertMany(studentsData);

    console.log("Creating Assessments and Results...");
    for (const course of courses) {
      // Create 3 assessments per course (1 of each type)
      const assessments = await Assessment.insertMany([
        {
          name: `${course.name} Midterm Exam`,
          courseId: course._id,
          type: "Exam",
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        },
        {
          name: `${course.name} Pop Quiz`,
          courseId: course._id,
          type: "Quiz",
          date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        },
        {
          name: `${course.name} Final Project`,
          courseId: course._id,
          type: "Assignment",
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        },
      ]);

      // Create results
      const resultsData = [];
      for (const assessment of assessments) {
        for (const student of students) {
          // Generate a random score between 40 and 100 to ensure some are below the default 60 threshold
          const score = Math.floor(Math.random() * 61) + 40; 
          
          resultsData.push({
            studentId: student._id,
            assessmentId: assessment._id,
            score,
          });
        }
      }
      await Result.insertMany(resultsData);
    }

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
