import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../shared/Layout";
import ReportFormShell from "../shared/ReportFormShell";
import ReportFormLeft from "../shared/ReportFormLeft";
import ReportFormRight from "../shared/ReportFormRight";

const API_BASE = "http://localhost:5000";

const SLIDERS = [{ label: "Student At Risk Threshold", stateKey: "studentAtRisk" }];

const defaultAssessmentTypes = {
  Exam: true,
  Quiz: true,
  Assignment: true,
};

export default function StudentCategoryPerformanceReport({ initialConfig }) {
  const navigate = useNavigate();
  const [reportDbId, setReportDbId] = useState(initialConfig?.id || null);
  const [reportName, setReportName] = useState(
    initialConfig?.config?.reportName || initialConfig?.name || "",
  );
  const [courseId, setCourseId] = useState(initialConfig?.config?.courseId || "");
  const [assessmentTypes, setAssessmentTypes] = useState(
    initialConfig?.config?.assessmentTypes || defaultAssessmentTypes,
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
  const [lastRerunAt, setLastRerunAt] = useState(initialConfig?.lastRerunAt || null);
  const [rerunHistory, setRerunHistory] = useState(initialConfig?.rerunHistory || []);
  const [showHistory, setShowHistory] = useState(false);

  // Pagination State
  const [students, setStudents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0, limit: 10 });
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  const shouldLoadCourses = isEditing || !initialConfig;

  useEffect(() => {
    if (!shouldLoadCourses) return undefined;

    let cancelled = false;

    const loadCourses = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/courses`);
        const json = await res.json();
        if (!cancelled && json.success) {
          setCourses(json.data || []);
        }
      } catch {
        if (!cancelled) {
          setCourses([]);
        }
      }
    };

    loadCourses();

    return () => {
      cancelled = true;
    };
  }, [shouldLoadCourses]);

  // Fetch paginated students
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
      courses.find((course) => course._id === courseId)?.name ||
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
    setAssessmentTypes(savedReport.config?.assessmentTypes || defaultAssessmentTypes);
    setSliderValues(savedReport.config?.sliderValues || { studentAtRisk: 70 });
    setLastRerunAt(savedReport.lastRerunAt || null);
    setRerunHistory(savedReport.rerunHistory || []);
    setIsEditing(false);
    // Reset pagination on sync
    setCurrentPage(1);
  };

  const buildPayload = () => ({
    name: reportName.trim() || "Student Performance",
    type: "Student Performance",
    courseName,
    config: {
      reportName,
      courseId,
      assessmentTypes,
      sliderValues,
    },
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

      if (!res.ok || !json.success) {
        throw new Error(json?.error || "Failed to generate report");
      }

      syncFromSavedReport(json.data);
      if (!reportDbId && json.data?.id) {
        navigate(`/reports/${json.data.id}`, { replace: true, state: { report: json.data } });
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
      const res = await fetch(`${API_BASE}/api/saved-reports/${reportDbId}/rerun`, {
        method: "POST",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json?.error || "Failed to rerun report");
      }

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

  const renderReportBody = () => (
    <div className="report-body-container pt-2">
      <div className="mb-4">
        <div style={{ fontSize: 18, fontWeight: 400, color: "#333", marginBottom: 12 }}>
          Student Performance Report
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            fontSize: "11px",
            fontWeight: "600",
            color: "#555",
            textTransform: "uppercase",
          }}
        >
          <span>
            <strong style={{ color: "#d32f2f" }}>
              At-Risk Students: {report?.atRiskStudentsCount ?? 0}
            </strong>{" "}
            | Total Students: {report?.totalStudents ?? 0}
          </span>
        </div>
        <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
          Course: {report?.courseName || courseName || "Unknown"} | Student At Risk Threshold:{" "}
          {report?.thresholds?.studentAtRisk ?? 0}%
        </div>
      </div>

      <div
        className="report-card"
        style={{
          background: "white",
          padding: "20px",
          border: "1px solid #ddd",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <div
          className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-end mb-2 gap-2"
          style={{ borderBottom: "1px solid #eee", paddingBottom: "10px", marginBottom: "15px" }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: "#333", textTransform: "uppercase" }}>
            Students
          </div>
          <div className="d-flex flex-wrap gap-2 gap-sm-3 align-items-center" style={{ fontSize: 11, color: "#555" }}>
            <span>
              <svg width="10" height="10" style={{ fill: "#d32f2f", transform: "translateY(2px)" }}>
                <path d="M0,0 L10,0 L5,8 Z" />
              </svg>{" "}
              At-Risk
            </span>
            <span>
              <svg width="10" height="10" style={{ fill: "#388e3c", transform: "translateY(1px)" }}>
                <path d="M5,0 L10,8 L0,8 Z" />
              </svg>{" "}
              Doing Well
            </span>
          </div>
        </div>

        <div className="table-responsive" style={{ borderRadius: "3px", position: "relative" }}>
          {isLoadingStudents && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(255,255,255,0.6)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1,
              }}
            >
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}
          <table className="table" style={{ border: "1px solid #ddd", borderBottom: "none", minWidth: "750px" }}>
            <thead>
              <tr style={{ background: "#516275", color: "#fff", fontSize: "10px", letterSpacing: "0.5px" }}>
                <th style={{ padding: "12px 16px", fontWeight: "600", border: "none" }}>STUDENT</th>
                <th style={{ padding: "12px 16px", fontWeight: "600", border: "none" }}>ASSESSMENT AVG SCORE</th>
                <th style={{ padding: "12px 16px", fontWeight: "600", border: "none" }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {students.length ? (
                students.map((student) => (
                  <tr
                    key={`${student.name}-${student.avgScore}`}
                    style={{ borderBottom: "1px solid #ddd", background: "white" }}
                  >
                    <td
                      style={{
                        verticalAlign: "middle",
                        padding: "12px 16px",
                        fontSize: "13px",
                        color: "#333",
                        width: "40%",
                      }}
                    >
                      <div style={{ marginBottom: "4px" }}>{student.name}</div>
                      <div
                        style={{
                          position: "relative",
                          width: "100%",
                          height: "8px",
                          background: "#e0e0e0",
                          borderRadius: "1px",
                          marginTop: "15px",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            left: `${Math.min(100, Math.max(0, student.avgScore || 0))}%`,
                            top: "-6px",
                            transform: "translateX(-50%)",
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 10 10" style={{ fill: "none", stroke: "#cfa625", strokeWidth: "2" }}>
                            <path d="M5 1L9 5L5 9L1 5Z" />
                          </svg>
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "10px",
                          color: "#999",
                          marginTop: "2px",
                        }}
                      >
                        <span>0</span>
                        <span>50</span>
                        <span>100</span>
                      </div>
                    </td>
                    <td style={{ verticalAlign: "middle", padding: "12px 16px", fontSize: "13px", color: "#333" }}>
                      {Number(student.avgScore ?? 0).toFixed(2)}%
                    </td>
                    <td style={{ verticalAlign: "middle", padding: "12px 16px" }}>
                      {student.status === "At Risk" ? (
                        <svg width="12" height="12" style={{ fill: "#d32f2f" }}>
                          <path d="M0,0 L12,0 L6,10 Z" />
                        </svg>
                      ) : (
                        <svg width="12" height="12" style={{ fill: "#388e3c" }}>
                          <path d="M6,0 L12,10 L0,10 Z" />
                        </svg>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="text-muted py-4 text-center" style={{ background: "white" }}>
                    {isLoadingStudents ? "Loading..." : "No students found for the selected filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {pagination.pages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-3 pt-3" style={{ borderTop: "1px solid #eee" }}>
            <div style={{ fontSize: "11px", color: "#666" }}>
              Showing {students.length} of {pagination.total} students (Page {currentPage} of {pagination.pages})
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={currentPage === 1 || isLoadingStudents}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{ fontSize: "11px", padding: "4px 12px" }}
              >
                Previous
              </button>
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={currentPage === pagination.pages || isLoadingStudents}
                onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))}
                style={{ fontSize: "11px", padding: "4px 12px" }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Layout>
      {!isEditing && report ? (
        <>
          <div
            className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-3"
            style={{ borderBottom: "1px solid #ddd", paddingBottom: "12px" }}
          >
            <div>
              <button className="back-link mb-2" onClick={goBack}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
                Back to Advanced Reports
              </button>
            </div>

            <div className="d-flex flex-column align-items-md-end gap-2">
              <div className="d-flex flex-wrap align-items-center gap-3 mt-2 mt-md-0 justify-content-md-end">
                <button
                  onClick={handleDelete}
                  onMouseLeave={() => setIsConfirmingDelete(false)}
                  style={{
                    border: isConfirmingDelete ? "1px solid #d32f2f" : "none",
                    background: isConfirmingDelete ? "#fff5f5" : "none",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#d32f2f",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "4px 8px",
                    borderRadius: "4px",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  {isConfirmingDelete ? "CONFIRM DELETE?" : "DELETE"}
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    border: "none",
                    background: "none",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#1a73c1",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    marginLeft: "15px",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  EDIT & CREATE NEW
                </button>
                <button
                  className="btn btn-sm"
                  style={{
                    background: "#008e45",
                    color: "white",
                    fontSize: "11px",
                    fontWeight: 600,
                    border: "none",
                    padding: "6px 14px",
                    borderRadius: "3px",
                  }}
                  onClick={rerunReport}
                  disabled={isGenerating}
                >
                  {isGenerating ? "RERUNNING..." : "RERUN REPORT"}
                </button>
              </div>
              <div className="d-flex align-items-center gap-2" style={{ fontSize: "11px", color: "#666" }}>
                <span>{rerunLabel}</span>
                {rerunHistory.length > 0 && (
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    style={{
                      border: "none",
                      background: "none",
                      color: "#1a73c1",
                      padding: 0,
                      fontSize: "11px",
                      textDecoration: "underline",
                      cursor: "pointer",
                    }}
                  >
                    {showHistory ? "Hide History" : "View History Log"}
                  </button>
                )}
              </div>

              {showHistory && rerunHistory.length > 0 && (
                <div
                  className="mt-2 text-start p-2"
                  style={{
                    background: "#f9f9f9",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    width: "100%",
                    maxWidth: "400px",
                  }}
                >
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#555", marginBottom: "8px", textTransform: "uppercase" }}>
                    Rerun History Log
                  </div>
                  <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                    <table style={{ width: "100%", fontSize: "10px", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #eee", textAlign: "left", color: "#666" }}>
                          <th style={{ padding: "4px 0" }}>DATE</th>
                          <th>STUDENTS</th>
                          <th>AT-RISK</th>
                          <th style={{ textAlign: "right" }}>AVG</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rerunHistory.map((entry, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid #f0f0f0" }}>
                            <td style={{ padding: "6px 0", color: "#333" }}>
                              {new Date(entry.rerunAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                            </td>
                            <td style={{ color: "#333" }}>{entry.totalStudents}</td>
                            <td style={{ color: entry.atRiskCount > 0 ? "#d32f2f" : "#333" }}>{entry.atRiskCount}</td>
                            <td style={{ textAlign: "right", color: "#333" }}>{Number(entry.avgScore || 0).toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
          {error && <div className="alert alert-danger mt-3">{error}</div>}
          {renderReportBody()}
        </>
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
            />
            <div className="col-divider d-none d-md-block" />
            <ReportFormRight
              sliders={SLIDERS}
              assessmentTypes={assessmentTypes}
              sliderValues={sliderValues}
              onValuesChange={({ assessmentTypes: nextTypes, sliderValues: nextSliderValues }) => {
                setAssessmentTypes(nextTypes || assessmentTypes);
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
