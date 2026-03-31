import SavedReport from "../models/SavedReport.js";
import SavedReportStudent from "../models/SavedReportStudent.js";
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
  reportData: report.reportData, // Now only contains 'summary'
  rerunHistory: report.rerunHistory || [],
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

const persistStudents = async (reportId, students = []) => {
  // Wipe old students for this report
  await SavedReportStudent.deleteMany({ savedReportId: reportId });

  if (students.length > 0) {
    const docs = students.map((s) => ({
      ...s,
      savedReportId: reportId,
    }));
    await SavedReportStudent.insertMany(docs);
  }
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

// @route   GET /api/saved-reports/:id/students
export const getSavedReportStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const assessmentId = req.query.assessmentId || null;
    const skip = (page - 1) * limit;

    const query = { savedReportId: id };
    if (assessmentId) query.assessmentId = assessmentId;

    const total = await SavedReportStudent.countDocuments(query);
    const students = await SavedReportStudent.find(query)
      .sort({ avgScore: -1, score: -1, lastName: 1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: students,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   POST /api/saved-reports
export const createSavedReport = async (req, res) => {
  try {
    const payload = normalizePayload(req.body);
    const { summary, students } = await buildSnapshot(payload.type, payload.config);

    const saved = await SavedReport.create({
      ...payload,
      courseName: payload.courseName || summary.courseName || "",
      reportData: summary,
      lastRerunAt: null,
    });

    await persistStudents(saved._id, students);

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
    const { summary, students } = await buildSnapshot(payload.type, payload.config);

    existing.name = payload.name;
    existing.type = payload.type;
    existing.courseName = payload.courseName || summary.courseName || "";
    existing.department = payload.department;
    existing.config = payload.config;
    existing.reportData = summary;

    const updated = await existing.save();
    await persistStudents(updated._id, students);

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

    const { summary, students } = await buildSnapshot(report.type, report.config);
    report.courseName = report.courseName || summary.courseName || "";
    report.reportData = summary;
    const historyEntry = {
      rerunAt: new Date(),
      totalStudents: summary.totalStudents || 0,
      totalAssessments: summary.totalAssessmentsCount || 0,
      atRiskCount: summary.atRiskStudentsCount || summary.atRiskStudents || 0,
      atRiskAssessments: summary.atRiskAssessmentsCount || 0,
      avgScore: summary.avgScore || 0,
    };

    report.rerunHistory = [historyEntry, ...(report.rerunHistory || [])].slice(0, 20);
    report.lastRerunAt = historyEntry.rerunAt;

    const updated = await report.save();
    await persistStudents(updated._id, students);

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

    // Cascading delete
    await SavedReportStudent.deleteMany({ savedReportId: req.params.id });

    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
