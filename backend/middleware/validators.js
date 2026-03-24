import mongoose from "mongoose";
import { ApiError } from "./errorHandler.js";
import Course from "../models/Course.js";

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const assertObjectId = (value, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(400, `Invalid ObjectId for '${fieldName}'`);
  }
};

export const validateObjectIdParam = (paramName) => (req, res, next) => {
  try {
    assertObjectId(req.params[paramName], paramName);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateStudentPayload = (req, res, next) => {
  try {
    const { firstName, lastName, department } = req.body || {};

    if (!isNonEmptyString(firstName)) {
      throw new ApiError(400, "firstName is required");
    }
    if (!isNonEmptyString(lastName)) {
      throw new ApiError(400, "lastName is required");
    }
    if (!isNonEmptyString(department)) {
      throw new ApiError(400, "department is required");
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const validateCoursePayload = (req, res, next) => {
  try {
    const { name } = req.body || {};
    if (!isNonEmptyString(name)) {
      throw new ApiError(400, "name is required");
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const validateAssessmentPayload = async (req, res, next) => {
  try {
    const { name, courseId, type, date } = req.body || {};

    if (!isNonEmptyString(name)) {
      throw new ApiError(400, "name is required");
    }
    if (!isNonEmptyString(type)) {
      throw new ApiError(400, "type is required");
    }
    if (!isNonEmptyString(courseId)) {
      throw new ApiError(400, "courseId is required");
    }
    assertObjectId(courseId, "courseId");

    const courseExists = await Course.exists({ _id: courseId });
    if (!courseExists) {
      throw new ApiError(400, "courseId does not reference an existing course");
    }

    if (!date || Number.isNaN(new Date(date).getTime())) {
      throw new ApiError(400, "date must be a valid date");
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const validateResultPayload = (req, res, next) => {
  try {
    const { studentId, assessmentId, score } = req.body || {};

    if (!isNonEmptyString(studentId)) {
      throw new ApiError(400, "studentId is required");
    }
    if (!isNonEmptyString(assessmentId)) {
      throw new ApiError(400, "assessmentId is required");
    }
    assertObjectId(studentId, "studentId");
    assertObjectId(assessmentId, "assessmentId");

    if (typeof score !== "number" || Number.isNaN(score) || score < 0 || score > 100) {
      throw new ApiError(400, "score must be a number between 0 and 100");
    }

    next();
  } catch (error) {
    next(error);
  }
};
