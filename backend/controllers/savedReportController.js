import SavedReport from "../models/SavedReport.js";
import {
  generateCourseReportSnapshot,
  generateStudentReportSnapshot,
} from "../services/reportSnapshotService.js";

const buildSnapshot = async (type, config) => {
  if (type === "Course Performance") {
    return generateCourseReportSnapshot(config);
  }

  if (type === "Student Performance") {
    return generateStudentReportSnapshot(config);
  }

  throw new Error("Unsupported report type");
};

const toListItem = (report) => ({
  id: report._id.toString(),
  name: report.name,
  type: report.type,
  courseName: report.courseName || report.reportData?.courseName || "",
  department: report.department || report.courseName || "",
  dateCreated: report.createdAt ? new Date(report.createdAt).toLocaleDateString() : "",
  createdAt: report.createdAt,
  updatedAt: report.updatedAt,
  lastRerunAt: report.lastRerunAt,
});

const toDetailItem = (report) => ({
  id: report._id.toString(),
  name: report.name,
  type: report.type,
  courseName: report.courseName || report.reportData?.courseName || "",
  department: report.department || report.courseName || "",
  dateCreated: report.createdAt ? new Date(report.createdAt).toLocaleDateString() : "",
  createdAt: report.createdAt,
  updatedAt: report.updatedAt,
  lastRerunAt: report.lastRerunAt,
  config: report.config,
  reportData: report.reportData,
});

const normalizePayload = (body = {}) => {
  const config = body.config || {};

  return {
    name: body.name || config.reportName || body.type || "Saved Report",
    type: body.type,
    courseName: body.courseName || "",
    department: body.department || "",
    config,
  };
};

// @route   GET /api/saved-reports
export const getSavedReports = async (req, res) => {
  try {
    const reports = await SavedReport.find().sort({ createdAt: -1 });
    res.json({ success: true, data: reports.map(toListItem) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   GET /api/saved-reports/:id
export const getSavedReportById = async (req, res) => {
  try {
    const report = await SavedReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, error: "Report not found" });
    }

    res.json({ success: true, data: toDetailItem(report) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   POST /api/saved-reports
export const createSavedReport = async (req, res) => {
  try {
    const payload = normalizePayload(req.body);
    const reportData = await buildSnapshot(payload.type, payload.config);

    const saved = await SavedReport.create({
      ...payload,
      courseName: payload.courseName || reportData.courseName || "",
      reportData,
      lastRerunAt: null,
    });

    res.status(201).json({
      success: true,
      data: toDetailItem(saved),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   PUT /api/saved-reports/:id
export const updateSavedReport = async (req, res) => {
  try {
    const existing = await SavedReport.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: "Report not found" });
    }

    const payload = normalizePayload(req.body);
    const reportData = await buildSnapshot(payload.type, payload.config);

    existing.name = payload.name;
    existing.type = payload.type;
    existing.courseName = payload.courseName || reportData.courseName || "";
    existing.department = payload.department;
    existing.config = payload.config;
    existing.reportData = reportData;

    const updated = await existing.save();

    res.json({
      success: true,
      data: toDetailItem(updated),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   POST /api/saved-reports/:id/rerun
export const rerunSavedReport = async (req, res) => {
  try {
    const report = await SavedReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, error: "Report not found" });
    }

    const reportData = await buildSnapshot(report.type, report.config);
    report.courseName = report.courseName || reportData.courseName || "";
    report.reportData = reportData;
    report.lastRerunAt = new Date();

    const updated = await report.save();

    res.json({
      success: true,
      data: toDetailItem(updated),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   DELETE /api/saved-reports/:id
export const deleteSavedReport = async (req, res) => {
  try {
    const deleted = await SavedReport.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Report not found" });
    }

    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
