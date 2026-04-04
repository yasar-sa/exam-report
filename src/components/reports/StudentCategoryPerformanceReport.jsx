import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Users,
  Activity,
  FileText,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Download,
  ArrowLeft,
  RefreshCw,
  Trash2,
  Edit3,
  Clock,
} from "lucide-react";
import Layout from "../shared/Layout";
import ReportFormShell from "../shared/ReportFormShell";
import ReportFormLeft from "../shared/ReportFormLeft";
import ReportFormRight from "../shared/ReportFormRight";

const API_BASE = "http://localhost:5000";

const SLIDERS = [
  { label: "Student At Risk Threshold", stateKey: "studentAtRisk" },
];

export default function StudentCategoryPerformanceReport({ initialConfig }) {
  const navigate = useNavigate();
  const [reportDbId, setReportDbId] = useState(initialConfig?.id || null);
  const [reportName, setReportName] = useState(
    initialConfig?.config?.reportName || initialConfig?.name || "",
  );
  const [courseId, setCourseId] = useState(
    initialConfig?.config?.courseId || "",
  );
  const [sliderValues, setSliderValues] = useState(
    initialConfig?.config?.sliderValues || { studentAtRisk: 70 },
  );
  const [courses, setCourses] = useState([]);
  const [report, setReport] = useState(initialConfig?.reportData || null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(!initialConfig);
  const [lastRerunAt, setLastRerunAt] = useState(
    initialConfig?.lastRerunAt || null,
  );
  const [rerunHistory, setRerunHistory] = useState(
    initialConfig?.rerunHistory || [],
  );
  const [showHistory, setShowHistory] = useState(false);

  // Pagination State
  const [students, setStudents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    limit: 10,
  });
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  const shouldLoadCourses = isEditing || !initialConfig;

  useEffect(() => {
    if (!shouldLoadCourses) return undefined;
    let cancelled = false;
    const loadCourses = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/courses`);
        const json = await res.json();
        if (!cancelled && json.success) setCourses(json.data || []);
      } catch {
        if (!cancelled) setCourses([]);
      }
    };
    loadCourses();
    return () => {
      cancelled = true;
    };
  }, [shouldLoadCourses]);

  useEffect(() => {
    if (isEditing || !reportDbId) return;
    let cancelled = false;
    const fetchStudents = async () => {
      setIsLoadingStudents(true);
      try {
        const res = await fetch(
          `${API_BASE}/api/saved-reports/${reportDbId}/students?page=${currentPage}&limit=10`,
        );
        const json = await res.json();
        if (!cancelled && json.success) {
          setStudents(json.data || []);
          setPagination(json.pagination);
        }
      } catch (e) {
        console.error("Failed to fetch students:", e);
      } finally {
        if (!cancelled) setIsLoadingStudents(false);
      }
    };
    fetchStudents();
    return () => {
      cancelled = true;
    };
  }, [reportDbId, currentPage, isEditing]);

  const goBack = () => {
    navigate(initialConfig ? "/" : "/reports/new");
  };

  const courseName = useMemo(() => {
    return (
      courses.find((c) => c._id === courseId)?.name ||
      report?.courseName ||
      initialConfig?.courseName ||
      ""
    );
  }, [courses, courseId, report, initialConfig]);

  const rerunLabel = lastRerunAt
    ? `Last rerun completed on ${new Date(lastRerunAt).toLocaleString()}`
    : "Last rerun status: not rerun yet";

  const syncFromSavedReport = (savedReport) => {
    setReportDbId(savedReport.id);
    setReport(savedReport.reportData || null);
    setReportName(savedReport.config?.reportName || savedReport.name || "");
    setCourseId(savedReport.config?.courseId || "");
    setSliderValues(savedReport.config?.sliderValues || { studentAtRisk: 70 });
    setLastRerunAt(savedReport.lastRerunAt || null);
    setRerunHistory(savedReport.rerunHistory || []);
    setIsEditing(false);
    setCurrentPage(1);
  };

  const buildPayload = () => ({
    name: reportName.trim() || "Student Performance",
    type: "Student Performance",
    courseName,
    config: { reportName, courseId, sliderValues },
  });

  const generateReport = async () => {
    if (!courseId) {
      setError("Please select a course.");
      return;
    }
    setIsGenerating(true);
    setError("");
    try {
      const payload = buildPayload();
      const method = reportDbId ? "PUT" : "POST";
      const url = reportDbId
        ? `${API_BASE}/api/saved-reports/${reportDbId}`
        : `${API_BASE}/api/saved-reports`;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json?.error || "Failed to generate report");

      if (reportDbId) {
        // If updating an existing report, sync locally
        syncFromSavedReport(json.data);
      } else if (json.data?.id) {
        // If new, just navigate; SavedReportPage will handle the first render
        navigate(`/reports/${json.data.id}`, {
          replace: true,
          state: { report: json.data },
        });
      }
    } catch (e) {
      setError(e?.message || "Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  const rerunReport = async () => {
    if (!reportDbId) {
      await generateReport();
      return;
    }
    setIsGenerating(true);
    setError("");
    try {
      const res = await fetch(
        `${API_BASE}/api/saved-reports/${reportDbId}/rerun`,
        { method: "POST" },
      );
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json?.error || "Failed to rerun report");
      syncFromSavedReport(json.data);
    } catch (e) {
      setError(e?.message || "Failed to rerun report");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      return;
    }
    if (!reportDbId) {
      goBack();
      return;
    }
    try {
      await fetch(`${API_BASE}/api/saved-reports/${reportDbId}`, {
        method: "DELETE",
      });
      navigate("/");
    } catch {
      setError("Failed to delete report.");
      setIsConfirmingDelete(false);
    }
  };

  const renderReportBody = () => {
    const atRiskCount = report?.atRiskStudentsCount ?? 0;
    const totalCount = report?.totalStudents ?? 0;

    return (
      <div className="report-body fade-in">
        {/* Analytics Summary */}
        <div className="row g-3 mb-4">
          <div className="col-md-6 col-lg-4">
            <div className="glass-card p-3 d-flex align-items-center gap-3">
              <div
                style={{
                  background: "#fee2e2",
                  padding: "10px",
                  borderRadius: "6px",
                  color: "#ef4444",
                }}
              >
                <Users size={24} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-soft)",
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                  }}
                >
                  AT-RISK STUDENTS
                </div>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "var(--text-main)",
                  }}
                >
                  {atRiskCount}
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6 col-lg-4">
            <div className="glass-card p-3 d-flex align-items-center gap-3">
              <div
                style={{
                  background: "#eef2ff",
                  padding: "10px",
                  borderRadius: "6px",
                  color: "var(--primary)",
                }}
              >
                <Users size={24} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-soft)",
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                  }}
                >
                  TOTAL STUDENTS
                </div>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "var(--text-main)",
                  }}
                >
                  {totalCount}
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-4 d-none d-lg-block">
            <div className="glass-card p-3 d-flex align-items-center gap-3">
              <div
                style={{
                  background: "#ecfdf5",
                  padding: "10px",
                  borderRadius: "6px",
                  color: "var(--accent)",
                }}
              >
                <Activity size={24} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-soft)",
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                  }}
                >
                  RISK THRESHOLD
                </div>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "var(--text-main)",
                  }}
                >
                  {report?.thresholds?.studentAtRisk ?? 0}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Info Badge */}
        <div className="d-flex mb-4 gap-2 flex-wrap">
          <div
            className="bg-white border px-3 py-1 rounded d-flex align-items-center gap-2"
            style={{
              fontSize: "11px",
              color: "var(--text-soft)",
              fontWeight: 600,
            }}
          >
            <BookOpen size={13} />
            COURSE:{" "}
            <span className="text-main">
              {report?.courseName || courseName}
            </span>
          </div>
          <div
            className="bg-white border px-3 py-1 rounded d-flex align-items-center gap-2"
            style={{
              fontSize: "11px",
              color: "var(--text-soft)",
              fontWeight: 600,
            }}
          >
            <Activity size={13} />
            LIMIT:{" "}
            <span className="text-main">
              {report?.thresholds?.studentAtRisk ?? 0}%
            </span>
          </div>
        </div>

        {/* Student Data Table */}
        <div className="glass-card shadow-sm overflow-hidden mt-4">
          <div className="p-3 border-bottom bg-light bg-opacity-50 d-flex justify-content-between align-items-center">
            <h3 className="h6 mb-0 fw-bold" style={{ fontSize: "12px" }}>
              STUDENT PERFORMANCE LISTING
            </h3>
            {isLoadingStudents && (
              <div className="spinner-border spinner-border-sm text-primary" />
            )}
          </div>
          <div className="table-responsive">
            <table className="premium-table mb-0">
              <thead>
                <tr>
                  <th style={{ width: "40%" }}>STUDENT IDENTITY</th>
                  <th className="text-end">ASSESSMENT AVERAGE</th>
                  <th className="text-center">RISK STATUS</th>
                  <th style={{ width: "100px" }} />
                </tr>
              </thead>
              <tbody
                style={{
                  opacity: isLoadingStudents ? 0.5 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                {students.length ? (
                  students.map((student, idx) => (
                    <motion.tr
                      key={student.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <td>
                        <div className="fw-bold text-main mb-1">
                          {student.name}
                        </div>
                        <div
                          className="d-flex align-items-center gap-2"
                          style={{ width: "100%" }}
                        >
                          <div
                            className="flex-grow-1"
                            style={{
                              height: "4px",
                              background: "#f1f5f9",
                              borderRadius: "2px",
                            }}
                          >
                            <div
                              style={{
                                width: `${Math.min(100, student.avgScore || 0)}%`,
                                height: "100%",
                                background:
                                  student.status === "At Risk"
                                    ? "#ef4444"
                                    : "var(--accent)",
                                borderRadius: "2px",
                              }}
                            />
                          </div>
                          <span
                            style={{
                              fontSize: "10px",
                              color: "var(--text-soft)",
                              fontWeight: 700,
                            }}
                          >
                            {Number(student.avgScore).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="text-end">
                        <span
                          style={{
                            fontWeight: 700,
                            color: "var(--primary)",
                            fontSize: "15px",
                          }}
                        >
                          {Number(student.avgScore).toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-center">
                        {student.status === "At Risk" ? (
                          <span className="badge-risk">
                            <AlertCircle size={12} /> AT RISK
                          </span>
                        ) : (
                          <span className="badge-success">
                            <CheckCircle2 size={12} /> GOOD
                          </span>
                        )}
                      </td>
                      <td className="text-end">
                        <button className="btn-icon">
                          <ChevronRight size={18} />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-5 text-muted">
                      No students found matching current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          {pagination.pages > 1 && (
            <div className="p-3 border-top d-flex justify-content-between align-items-center bg-light bg-opacity-50">
              <div className="text-soft" style={{ fontSize: "12px" }}>
                Showing <strong>{students.length}</strong> of{" "}
                <strong>{pagination.total}</strong> results
              </div>
              <div className="d-flex gap-2">
                <button
                  className="btn-premium py-1 px-3"
                  disabled={currentPage === 1 || isLoadingStudents}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  style={{ background: "white", border: "1px solid #e2e8f0" }}
                >
                  Previous
                </button>
                <div
                  className="d-flex align-items-center px-2 fw-bold text-main"
                  style={{ fontSize: "12px" }}
                >
                  {currentPage} / {pagination.pages}
                </div>
                <button
                  className="btn-premium py-1 px-3"
                  disabled={
                    currentPage === pagination.pages || isLoadingStudents
                  }
                  onClick={() => setCurrentPage((p) => p + 1)}
                  style={{ background: "white", border: "1px solid #e2e8f0" }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      {!isEditing && report ? (
        <div className="container-fluid py-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 gap-3">
            <div>
              <button
                className="btn-back d-flex align-items-center gap-2 mb-2"
                onClick={goBack}
              >
                <ArrowLeft size={16} /> Back to Dashboard
              </button>
              <h1 className="h3 fw-bold mb-0 text-main">
                {reportName || "Student Performance"}
              </h1>
              <p className="text-soft mb-0" style={{ fontSize: "14px" }}>
                In-depth student performance analysis across all course
                categories.
              </p>
            </div>

            <div className="d-flex flex-column align-items-md-end gap-2">
              <div className="d-flex gap-2 flex-wrap">
                <button
                  className={`btn-premium ${isConfirmingDelete ? "bg-danger text-white" : ""}`}
                  onClick={handleDelete}
                >
                  {isConfirmingDelete ? (
                    "CONFIRM"
                  ) : (
                    <>
                      <Trash2 size={16} /> DELETE
                    </>
                  )}
                </button>
                <button
                  className="btn-premium"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 size={16} /> MODIFY
                </button>
                <button
                  className="btn-premium btn-accent"
                  onClick={rerunReport}
                  disabled={isGenerating}
                >
                  <RefreshCw size={16} className={isGenerating ? "spin" : ""} />{" "}
                  {isGenerating ? "RUNNING..." : "RERUN"}
                </button>
              </div>
              <div
                className="d-flex align-items-center gap-2 text-soft"
                style={{ fontSize: "11px" }}
              >
                <span>{rerunLabel}</span>
                {rerunHistory.length > 0 && (
                  <button
                    className="btn-link p-0 text-primary"
                    onClick={() => setShowHistory(!showHistory)}
                  >
                    {showHistory ? "Hide History" : "View History"}
                  </button>
                )}
              </div>

              <AnimatePresence>
                {showHistory && rerunHistory.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="glass-card p-3 mt-2 shadow-lg"
                    style={{ maxWidth: "400px", zIndex: 10 }}
                  >
                    <div
                      className="fw-bold mb-2 text-soft d-flex align-items-center gap-2"
                      style={{ fontSize: "11px" }}
                    >
                      <Clock size={14} /> REFRESH HISTORY LOG
                    </div>
                    <div
                      className="table-responsive"
                      style={{ maxHeight: "200px" }}
                    >
                      <table
                        className="table table-sm mb-0"
                        style={{ fontSize: "11px" }}
                      >
                        <thead>
                          <tr>
                            <th>DATE</th>
                            <th>STUDENTS</th>
                            <th className="text-end">AVG</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rerunHistory.map((h, i) => (
                            <tr key={i}>
                              <td>
                                {new Date(h.rerunAt).toLocaleDateString()}
                              </td>
                              <td>{h.totalStudents}</td>
                              <td className="text-end fw-bold text-primary">
                                {Number(h.avgScore || 0).toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger rounded-4 shadow-sm border-0 mb-4">
              {error}
            </div>
          )}
          {renderReportBody()}
        </div>
      ) : (
        <ReportFormShell
          title="Student Performance Report"
          reportName={reportName}
          onBack={goBack}
          onGenerate={generateReport}
          onDelete={reportDbId ? handleDelete : undefined}
          isGenerating={isGenerating}
        >
          <div className="d-flex flex-column flex-md-row">
            <ReportFormLeft
              reportName={reportName}
              setReportName={setReportName}
              courses={courses}
              courseId={courseId}
              setCourseId={setCourseId}
              showDateRange={false}
              isMultipleCourse={true}
            />
            <div className="col-divider d-none d-md-block" />
            <ReportFormRight
              sliders={SLIDERS}
              sliderValues={sliderValues}
              onValuesChange={({ sliderValues: nextSliderValues }) => {
                setSliderValues((prev) => ({
                  ...prev,
                  ...(nextSliderValues || {}),
                }));
              }}
            />
          </div>
          {error && <div className="alert alert-danger mt-3">{error}</div>}
        </ReportFormShell>
      )}
    </Layout>
  );
}
