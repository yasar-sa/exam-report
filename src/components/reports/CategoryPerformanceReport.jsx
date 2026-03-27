import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../shared/Layout";
import ReportFormShell from "../shared/ReportFormShell";
import ReportFormLeft from "../shared/ReportFormLeft";
import ReportFormRight from "../shared/ReportFormRight";

const API_BASE = "http://localhost:5000";

const SLIDERS = [
  { label: "Course At Risk Threshold", stateKey: "courseAtRisk" },
  { label: "Student At Risk Threshold", stateKey: "studentAtRisk" },
];

const defaultAssessmentTypes = {
  Exam: true,
  Quiz: true,
  Assignment: true,
};

const defaultSliderValues = {
  courseAtRisk: 70,
  studentAtRisk: 70,
};

export default function CategoryPerformanceReport({ initialConfig }) {
  const navigate = useNavigate();
  const [reportDbId, setReportDbId] = useState(initialConfig?.id || null);
  const [reportName, setReportName] = useState(
    initialConfig?.config?.reportName || initialConfig?.name || "",
  );
  const [startDate, setStartDate] = useState(initialConfig?.config?.startDate || "");
  const [endDate, setEndDate] = useState(initialConfig?.config?.endDate || "");
  const [courseId, setCourseId] = useState(initialConfig?.config?.courseId || "");
  const [assessmentTypes, setAssessmentTypes] = useState(
    initialConfig?.config?.assessmentTypes || defaultAssessmentTypes,
  );
  const [sliderValues, setSliderValues] = useState(
    initialConfig?.config?.sliderValues || defaultSliderValues,
  );
  const [selectedAssessmentIds, setSelectedAssessmentIds] = useState(
    initialConfig?.config?.selectedAssessmentIds || initialConfig?.reportData?.selectedAssessmentIds || [],
  );
  const [courses, setCourses] = useState([]);
  const [courseAssessments, setCourseAssessments] = useState([]);
  const [report, setReport] = useState(initialConfig?.reportData || null);
  const [isEditing, setIsEditing] = useState(!initialConfig);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingAssessments, setIsLoadingAssessments] = useState(false);
  const [error, setError] = useState("");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [expandedAssessmentIds, setExpandedAssessmentIds] = useState({});
  const [lastRerunAt, setLastRerunAt] = useState(initialConfig?.lastRerunAt || null);

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

  useEffect(() => {
    if (!courseId || !isEditing) {
      setCourseAssessments([]);
      return undefined;
    }

    let cancelled = false;

    const loadAssessments = async () => {
      setIsLoadingAssessments(true);
      try {
        const res = await fetch(`${API_BASE}/api/assessments?courseId=${courseId}`);
        const json = await res.json();
        if (!cancelled && json.success) {
          setCourseAssessments(json.data || []);
        }
      } catch {
        if (!cancelled) {
          setCourseAssessments([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingAssessments(false);
        }
      }
    };

    loadAssessments();

    return () => {
      cancelled = true;
    };
  }, [courseId, isEditing]);

  useEffect(() => {
    if (!courseAssessments.length) return;

    setSelectedAssessmentIds((prev) =>
      prev.filter((assessmentId) =>
        courseAssessments.some((assessment) => assessment._id === assessmentId),
      ),
    );
  }, [courseAssessments]);

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
    setStartDate(savedReport.config?.startDate || "");
    setEndDate(savedReport.config?.endDate || "");
    setCourseId(savedReport.config?.courseId || "");
    setAssessmentTypes(savedReport.config?.assessmentTypes || defaultAssessmentTypes);
    setSliderValues(savedReport.config?.sliderValues || defaultSliderValues);
    setSelectedAssessmentIds(savedReport.config?.selectedAssessmentIds || []);
    setLastRerunAt(savedReport.lastRerunAt || null);
    setExpandedAssessmentIds({});
    setIsEditing(false);
  };

  const buildPayload = () => ({
    name: reportName.trim() || "Course Performance",
    type: "Course Performance",
    courseName,
    config: {
      reportName,
      startDate,
      endDate,
      courseId,
      assessmentTypes,
      sliderValues,
      selectedAssessmentIds,
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

  const toggleAssessmentRow = (assessmentId) => {
    setExpandedAssessmentIds((prev) => ({
      ...prev,
      [assessmentId]: !prev[assessmentId],
    }));
  };

  const toggleFormAssessment = (assessmentId) => {
    setSelectedAssessmentIds((prev) =>
      prev.includes(assessmentId)
        ? prev.filter((item) => item !== assessmentId)
        : [...prev, assessmentId],
    );
  };

  const atRiskAssessmentsCount =
    report?.assessments?.filter((assessment) => assessment.status === "At Risk").length || 0;
  const totalAssessmentsCount = report?.assessments?.length || 0;

  const renderReportBody = () => (
    <div className="report-body-container pt-2">
      <div className="mb-4">
        <div style={{ fontSize: 18, fontWeight: 400, color: "#333", marginBottom: 12 }}>
          Course Performance Report
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            fontSize: "11px",
            fontWeight: "600",
            color: "#555",
            textTransform: "uppercase",
            flexWrap: "wrap",
          }}
        >
          <span>
            <strong style={{ color: "#d32f2f" }}>
              At-Risk Course: {report?.summary?.atRiskCourseCount ?? 0}
            </strong>{" "}
            | Total Courses: {report?.summary?.totalCourses ?? 0}
          </span>
          <span>
            Assessments Filter:{" "}
            {report?.selectedAssessmentIds?.length
              ? `${report.selectedAssessmentIds.length} selected`
              : "All assessments"}
          </span>
        </div>
        <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
          Date Range: {report?.startedAt || "Any"} - {report?.endedAt || "Any"} | At-Risk Course
          Threshold: {report?.thresholds?.courseAtRisk ?? 0}% | At-Risk Student Threshold:{" "}
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
        <div className="d-flex align-items-center mb-3">
          <span style={{ fontSize: "18px", color: "#333" }}>
            {report?.courseName || courseName || "Unknown Course"}
          </span>
        </div>

        <div style={{ fontSize: "12px", color: "#666", marginBottom: "20px" }}>
          At-Risk Assessments: {atRiskAssessmentsCount} | Total Assessments: {totalAssessmentsCount} |
          Total Quizzes: {report?.assessments?.filter((assessment) => assessment.type === "Quiz").length || 0}
          {" | "}Total Exams: {report?.assessments?.filter((assessment) => assessment.type === "Exam").length || 0}
          {" | "}Total Assignments:{" "}
          {report?.assessments?.filter((assessment) => assessment.type === "Assignment").length || 0}
        </div>

        <div
          className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-end mb-2 gap-2"
          style={{ borderTop: "1px solid #eee", paddingTop: "15px" }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: "#333", textTransform: "uppercase" }}>
            Assessments
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

        <div className="table-responsive" style={{ borderRadius: "3px" }}>
          <table className="table" style={{ border: "1px solid #ddd", borderBottom: "none", minWidth: "850px" }}>
            <thead>
              <tr style={{ background: "#516275", color: "#fff", fontSize: "10px", letterSpacing: "0.5px" }}>
                <th style={{ padding: "12px 16px", fontWeight: "600", border: "none" }}>NAME</th>
                <th style={{ padding: "12px 16px", fontWeight: "600", border: "none" }}>TYPE</th>
                <th style={{ padding: "12px 16px", fontWeight: "600", border: "none" }}>SCHEDULED ON</th>
                <th style={{ padding: "12px 16px", fontWeight: "600", border: "none" }}>AVG SCORE</th>
                <th style={{ padding: "12px 16px", fontWeight: "600", border: "none" }}>STATUS</th>
                <th style={{ padding: "12px 16px", fontWeight: "600", border: "none", width: "120px" }} />
              </tr>
            </thead>
            <tbody>
              {report?.assessments?.length ? (
                report.assessments.map((assessment) => (
                  <Fragment key={assessment._id}>
                    <tr style={{ borderBottom: "1px solid #ddd", background: "white" }}>
                      <td style={{ verticalAlign: "middle", padding: "12px 16px" }}>
                        <div style={{ fontSize: "13px", color: "#333", marginBottom: "4px" }}>{assessment.name}</div>
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
                              left: `${Math.min(100, Math.max(0, assessment.avgScore || 0))}%`,
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
                      <td style={{ verticalAlign: "middle", fontSize: "13px", color: "#333", padding: "12px 16px" }}>
                        {assessment.type.toUpperCase()}
                      </td>
                      <td style={{ verticalAlign: "middle", fontSize: "13px", color: "#333", padding: "12px 16px" }}>
                        {assessment.date ? new Date(assessment.date).toLocaleDateString() : "-"}
                      </td>
                      <td style={{ verticalAlign: "middle", fontSize: "13px", color: "#333", padding: "12px 16px" }}>
                        {Number(assessment.avgScore ?? 0).toFixed(2)}%
                      </td>
                      <td style={{ verticalAlign: "middle", padding: "12px 16px" }}>
                        {assessment.status === "At Risk" ? (
                          <svg width="12" height="12" style={{ fill: "#d32f2f" }}>
                            <path d="M0,0 L12,0 L6,10 Z" />
                          </svg>
                        ) : (
                          <svg width="12" height="12" style={{ fill: "#388e3c" }}>
                            <path d="M6,0 L12,10 L0,10 Z" />
                          </svg>
                        )}
                      </td>
                      <td style={{ verticalAlign: "middle", padding: "12px 16px", textAlign: "right" }}>
                        <a
                          href="#"
                          style={{ color: "#1a73c1", fontSize: "13px", textDecoration: "none" }}
                          onClick={(e) => {
                            e.preventDefault();
                            toggleAssessmentRow(assessment._id);
                          }}
                        >
                          {expandedAssessmentIds[assessment._id] ? "Hide Student List" : "Student List"}
                        </a>
                      </td>
                    </tr>

                    {expandedAssessmentIds[assessment._id] ? (
                      <tr>
                        <td colSpan={6} style={{ padding: 0 }}>
                          <div style={{ padding: "0 0 0 40px", background: "#f5f5f5" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                padding: "15px 15px 10px",
                                fontSize: "12px",
                                color: "#666",
                              }}
                            >
                              Saved Students Snapshot
                            </div>
                            <div className="table-responsive" style={{ borderRadius: "3px" }}>
                              <table
                                className="table mb-0"
                                style={{ borderLeft: "1px solid #ddd", borderRight: "1px solid #ddd", minWidth: "600px" }}
                              >
                                <thead>
                                  <tr style={{ background: "#516275", color: "#fff", fontSize: "11px", letterSpacing: "0.5px" }}>
                                    <th style={{ fontWeight: "600", padding: "10px 15px", border: "none" }}>LAST NAME</th>
                                    <th style={{ fontWeight: "600", padding: "10px 15px", border: "none" }}>FIRST NAME</th>
                                    <th style={{ fontWeight: "600", padding: "10px 15px", border: "none" }}>ASSESSMENT SCORE</th>
                                    <th style={{ fontWeight: "600", padding: "10px 15px", border: "none" }}>STATUS</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {assessment.students?.length ? (
                                    assessment.students.map((student) => (
                                      <tr
                                        key={`${assessment._id}-${student.name}-${student.score}`}
                                        style={{ background: "white", borderBottom: "1px solid #ddd" }}
                                      >
                                        <td style={{ padding: "12px 15px", fontSize: "13px", color: "#333" }}>
                                          {student.lastName || "-"}
                                        </td>
                                        <td style={{ padding: "12px 15px", fontSize: "13px", color: "#333" }}>
                                          {student.firstName || "-"}
                                        </td>
                                        <td style={{ padding: "12px 15px", fontSize: "13px", color: "#333" }}>
                                          {Number(student.score ?? 0).toFixed(2)}%
                                        </td>
                                        <td style={{ padding: "12px 15px" }}>
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
                                    <tr style={{ background: "white", borderBottom: "1px solid #ddd" }}>
                                      <td colSpan={4} className="text-muted" style={{ padding: "15px" }}>
                                        No students found.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                            <div
                              style={{
                                height: "15px",
                                background: "white",
                                borderLeft: "1px solid #ddd",
                                borderRight: "1px solid #ddd",
                                borderBottom: "1px solid #ddd",
                                marginBottom: "20px",
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-muted py-4 text-center" style={{ background: "white" }}>
                    No assessments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
              <div className="d-flex align-items-center gap-3 flex-wrap justify-content-md-end">
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
              <div style={{ fontSize: "11px", color: "#666" }}>{rerunLabel}</div>
            </div>
          </div>
          {error && <div className="alert alert-danger mt-3">{error}</div>}
          {renderReportBody()}
        </>
      ) : (
        <ReportFormShell
          title="Course Performance Report"
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
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              courses={courses}
              courseId={courseId}
              setCourseId={(value) => {
                setCourseId(value);
                setSelectedAssessmentIds([]);
              }}
            >
              <div className="mt-4">
                <div className="field-label">ASSESSMENTS</div>
                <div style={{ fontSize: "12px", color: "#666", marginBottom: "10px" }}>
                  Select one or more assessments for this course. Leave all unchecked to include every
                  assessment in the course.
                </div>
                {!courseId ? (
                  <div className="text-muted" style={{ fontSize: "13px" }}>
                    Choose a course first to load its assessments.
                  </div>
                ) : isLoadingAssessments ? (
                  <div className="text-muted" style={{ fontSize: "13px" }}>
                    Loading assessments...
                  </div>
                ) : courseAssessments.length ? (
                  <div
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      padding: "12px",
                      maxHeight: "240px",
                      overflowY: "auto",
                      background: "#fafafa",
                    }}
                  >
                    {courseAssessments.map((assessment) => (
                      <label
                        key={assessment._id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          fontSize: "13px",
                          color: "#333",
                          padding: "8px 0",
                          borderBottom: "1px solid #ececec",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedAssessmentIds.includes(assessment._id)}
                          onChange={() => toggleFormAssessment(assessment._id)}
                        />
                        <span>
                          {assessment.name} ({assessment.type})
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted" style={{ fontSize: "13px" }}>
                    No assessments found for this course.
                  </div>
                )}
              </div>
            </ReportFormLeft>
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
