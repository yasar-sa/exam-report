import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  BookOpen,
  BarChart3,
  Users,
  Activity,
  FileText,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  Share2,
  Clock,
  Trash2,
  Edit3,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import Layout from "../shared/Layout";
import ReportFormShell from "../shared/ReportFormShell";
import ReportFormLeft from "../shared/ReportFormLeft";
import ReportFormRight from "../shared/ReportFormRight";

const API_BASE = "http://localhost:5000";

const SLIDERS = [
  { label: "Course At Risk Threshold", stateKey: "courseAtRisk" },
  { label: "Student At Risk Threshold", stateKey: "studentAtRisk" },
];

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
  const [startDate, setStartDate] = useState(
    initialConfig?.config?.startDate || "",
  );
  const [endDate, setEndDate] = useState(initialConfig?.config?.endDate || "");
  const [courseIds, setCourseIds] = useState(
    initialConfig?.config?.courseId
      ? typeof initialConfig.config.courseId === "string"
        ? initialConfig.config.courseId.split(",").filter(Boolean)
        : initialConfig.config.courseId
      : [],
  );
  const [sliderValues, setSliderValues] = useState(
    initialConfig?.config?.sliderValues || defaultSliderValues,
  );
  const [courses, setCourses] = useState([]);
  const [report, setReport] = useState(initialConfig?.reportData || null);
  const [isEditing, setIsEditing] = useState(!initialConfig);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [expandedAssessmentIds, setExpandedAssessmentIds] = useState({});
  const [lastRerunAt, setLastRerunAt] = useState(
    initialConfig?.lastRerunAt || null,
  );
  const [rerunHistory, setRerunHistory] = useState(
    initialConfig?.rerunHistory || [],
  );
  const [showHistory, setShowHistory] = useState(false);
  const [assessmentData, setAssessmentData] = useState({});
  const [expandedCourseIds, setExpandedCourseIds] = useState({});

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
        if (!cancelled) setCourses([]);
      }
    };
    loadCourses();
    return () => {
      cancelled = true;
    };
  }, [shouldLoadCourses]);

  const fetchAssessmentStudents = async (assessmentId, page = 1) => {
    if (!reportDbId) return;
    setAssessmentData((prev) => ({
      ...prev,
      [assessmentId]: { ...(prev[assessmentId] || {}), loading: true, page },
    }));

    try {
      const res = await fetch(
        `${API_BASE}/api/saved-reports/${reportDbId}/students?page=${page}&limit=10&assessmentId=${assessmentId}`,
      );
      const json = await res.json();
      if (json.success) {
        setAssessmentData((prev) => ({
          ...prev,
          [assessmentId]: {
            data: json.data || [],
            pagination: json.pagination,
            loading: false,
            page,
          },
        }));
      }
    } catch (e) {
      console.error("Failed to fetch assessment students:", e);
      setAssessmentData((prev) => ({
        ...prev,
        [assessmentId]: { ...(prev[assessmentId] || {}), loading: false },
      }));
    }
  };

  const goBack = () => {
    navigate(initialConfig ? "/" : "/reports/new");
  };

  const courseName = useMemo(() => {
    if (courseIds.length > 1) return `${courseIds.length} Courses Selected`;
    return (
      courses.find((c) => c._id === courseIds[0])?.name ||
      report?.courseName ||
      initialConfig?.courseName ||
      ""
    );
  }, [courses, courseIds, report, initialConfig]);

  const rerunLabel = lastRerunAt
    ? `Last rerun completed on ${new Date(lastRerunAt).toLocaleString()}`
    : "Last rerun status: not rerun yet";

  const syncFromSavedReport = (savedReport) => {
    setReportDbId(savedReport.id);
    setReport(savedReport.reportData || null);
    setReportName(savedReport.config?.reportName || savedReport.name || "");
    setStartDate(savedReport.config?.startDate || "");
    setEndDate(savedReport.config?.endDate || "");
    setCourseIds(
      savedReport.config?.courseId
        ? typeof savedReport.config.courseId === "string"
          ? savedReport.config.courseId.split(",").filter(Boolean)
          : savedReport.config.courseId
        : [],
    );
    setSliderValues(savedReport.config?.sliderValues || defaultSliderValues);
    setLastRerunAt(savedReport.lastRerunAt || null);
    setRerunHistory(savedReport.rerunHistory || []);
    setExpandedAssessmentIds({});
    setAssessmentData({});
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
      courseId: courseIds.join(","),
      sliderValues,
    },
  });

  const generateReport = async () => {
    if (!courseIds.length) {
      setError("Please select at least one course.");
      return;
    }
    if (!startDate || !endDate) {
      setError("Please select both start and end dates.");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError("Start date cannot be after end date.");
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

  const toggleAssessmentRow = (assessmentId) => {
    const isExpanding = !expandedAssessmentIds[assessmentId];
    setExpandedAssessmentIds((prev) => ({
      ...prev,
      [assessmentId]: isExpanding,
    }));
    if (isExpanding && !assessmentData[assessmentId])
      fetchAssessmentStudents(assessmentId, 1);
  };

  const renderReportBody = () => {
    const assessments = report?.assessments || [];
    const courseGroups = report?.courseGroups || [
      {
        courseName: report?.courseName || "All Courses",
        totalAssessments: assessments.length,
        atRiskAssessments: assessments.filter((a) => a.status === "At Risk").length,
        avgScore: report?.avgScore || 0,
        totalStudents: report?.totalStudents || 0,
        atRiskStudents: report?.atRiskStudentsCount || 0,
        assessments: assessments,
        status: report?.avgScore < (report?.thresholds?.courseAtRisk || 60) ? "At Risk" : "Good",
      },
    ];

    const atRiskCoursesCount = report?.atRiskCoursesCount ?? courseGroups.filter(g => g.status === 'At Risk').length;
    const totalCoursesCount = report?.totalCoursesCount ?? courseGroups.length;
    const avgScore = report?.avgScore || 0;

    const toggleCourse = (courseId) => {
      setExpandedCourseIds(prev => ({
        ...prev,
        [courseId]: !prev[courseId]
      }));
    };

    return (
      <div className="report-body fade-in">
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="glass-card p-3 d-flex align-items-center gap-3">
              <div style={{ background: "#fee2e2", padding: "10px", borderRadius: "6px", color: "#ef4444" }}>
                <Activity size={24} />
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--text-soft)", fontWeight: 700, letterSpacing: "0.02em" }}>AT-RISK COURSES</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-main)" }}>{atRiskCoursesCount}</div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="glass-card p-3 d-flex align-items-center gap-3">
              <div style={{ background: "#eef2ff", padding: "10px", borderRadius: "6px", color: "#var(--primary)" }}>
                <BookOpen size={24} />
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--text-soft)", fontWeight: 700, letterSpacing: "0.02em" }}>TOTAL COURSES</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-main)" }}>{totalCoursesCount}</div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="glass-card p-3 d-flex align-items-center gap-3">
              <div style={{ background: "#ecfdf5", padding: "10px", borderRadius: "6px", color: "var(--accent)" }}>
                <BarChart3 size={24} />
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--text-soft)", fontWeight: 700, letterSpacing: "0.02em" }}>AVG SCORE</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-main)" }}>{Number(avgScore).toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="d-flex flex-wrap gap-2 mb-4"
          style={{ fontSize: "11px", color: "var(--text-soft)" }}
        >
          <div className="bg-white border px-3 py-1 rounded d-flex align-items-center gap-2">
            <Calendar size={13} /> {report?.startedAt || "Any"} — {report?.endedAt || "Any"}
          </div>
          <div className="bg-white border px-3 py-1 rounded d-flex align-items-center gap-2">
            <BookOpen size={13} /> COURSE: <span className="text-main">{report?.courseName || courseName}</span>
          </div>
          <div className="bg-white border px-3 py-1 rounded d-flex align-items-center gap-2">
            <Activity size={13} /> Course Limit: {report?.thresholds?.courseAtRisk ?? 0}%
          </div>
          <div className="bg-white border px-3 py-1 rounded d-flex align-items-center gap-2">
            <Users size={13} /> Student Limit: {report?.thresholds?.studentAtRisk ?? 0}%
          </div>
        </div>

        <div className="space-y-4">
          {courseGroups.map((group, groupIdx) => {
            const courseId = group.courseId || `group-${groupIdx}`;
            const isExpanded = expandedCourseIds[courseId] !== false; // Default to expanded
            const assessmentsForGroup = group.assessments || [];

            return (
              <div key={courseId} className="glass-card shadow-sm overflow-hidden mb-4">
                <div 
                  className="p-3 border-bottom bg-light bg-opacity-50 d-flex justify-content-between align-items-center"
                  onClick={() => toggleCourse(courseId)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex align-items-center gap-3">
                    {group.status === "At Risk" ? (
                      <span className="badge-risk" style={{ borderRadius: '4px' }}>At Risk</span>
                    ) : (
                      <span className="badge-success" style={{ borderRadius: '4px' }}>Good</span>
                    )}
                    <h3 className="h6 mb-0 fw-bold text-main" style={{ fontSize: '14px' }}>{group.courseName}</h3>
                  </div>
                  <div className="d-flex align-items-center gap-4">
                    <div style={{ fontSize: '11px', color: 'var(--text-soft)' }}>
                      At-Risk Assessments: <strong className="text-danger">{group.atRiskAssessments}</strong> | 
                      At-Risk Students: <strong className="text-danger">{group.atRiskStudents}/{group.totalStudents}</strong> | 
                      Total Assessments: <strong>{group.totalAssessments}</strong>
                    </div>
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="table-responsive">
                        <table className="premium-table mb-0">
                          <thead>
                            <tr>
                              <th>EXAM NAME</th>
                              <th>YEAR / TERM</th>
                              <th>SCHEDULED</th>
                              <th className="text-end">AVG SCORE</th>
                              <th className="text-center">STATUS</th>
                              <th style={{ width: "160px" }} />
                            </tr>
                          </thead>
                          <tbody>
                            {assessmentsForGroup.length ? assessmentsForGroup.map((assessment, idx) => {
                              const isRowExpanded = expandedAssessmentIds[assessment._id];
                              const detail = assessmentData[assessment._id] || {};
                              const students = detail.data || [];
                              return (
                                <Fragment key={assessment._id}>
                                  <motion.tr
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleAssessmentRow(assessment._id);
                                    }}
                                    style={{ cursor: 'pointer', background: isRowExpanded ? 'rgba(37, 99, 235, 0.04)' : 'transparent' }}
                                  >
                                    <td className="fw-bold text-main">{assessment.name}</td>
                                    <td className="text-soft">{assessment.year || "-"} / {assessment.term || "-"}</td>
                                    <td className="text-soft">
                                      <div className="d-flex align-items-center gap-2">
                                        <Clock size={12} />
                                        {assessment.date ? new Date(assessment.date).toLocaleDateString() : "-"}
                                      </div>
                                    </td>
                                    <td className="text-end">
                                      <span style={{ fontWeight: 700, color: "var(--primary)" }}>{Number(assessment.avgScore ?? 0).toFixed(1)}%</span>
                                    </td>
                                    <td className="text-center">
                                      {assessment.status === "At Risk" ? (
                                        <span className="badge-risk" style={{ borderRadius: '4px' }}><AlertCircle size={12} /> AT RISK</span>
                                      ) : (
                                        <span className="badge-success" style={{ borderRadius: '4px' }}><CheckCircle2 size={12} /> GOOD</span>
                                      )}
                                    </td>
                                    <td className="text-end">
                                      <button className="btn-icon">
                                        {isRowExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                      </button>
                                    </td>
                                  </motion.tr>
                                  <AnimatePresence>
                                    {isRowExpanded && (
                                      <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <td colSpan={6} className="p-0 border-0">
                                          <div className="p-4" style={{ background: '#f8fafc', margin: '0 20px 20px 20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                              <div className="d-flex align-items-center gap-2 fw-bold text-soft" style={{ fontSize: '11px' }}>
                                                <Users size={14} /> STUDENT RESULTS SNAPSHOT
                                                {detail.loading && <div className="spinner-border spinner-border-sm text-primary ms-2" />}
                                              </div>
                                            </div>
                                            <div className="table-responsive rounded-3 border bg-white overflow-hidden">
                                              <table className="table table-sm table-hover mb-0">
                                                <thead className="bg-light">
                                                  <tr style={{ fontSize: '10px', color: 'var(--text-soft)' }}>
                                                    <th className="ps-3 py-2">STUDENT</th>
                                                    <th className="py-2 text-end pe-3">SCORE</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {students.length ? students.map((s, i) => (
                                                    <tr key={i} style={{ fontSize: '12px' }}>
                                                      <td className="ps-3 py-2 fw-medium">{s.name}</td>
                                                      <td className="text-end pe-3 py-2">
                                                        <span className={s.score < (report?.thresholds?.studentAtRisk || 70) ? 'text-danger fw-bold' : 'fw-bold text-accent'}>
                                                          {s.score.toFixed(1)}%
                                                        </span>
                                                      </td>
                                                    </tr>
                                                  )) : (
                                                    <tr>
                                                      <td colSpan={2} className="text-center py-3 text-muted">
                                                        {detail.loading ? 'Updating list...' : 'No student data record found.'}
                                                      </td>
                                                    </tr>
                                                  )}
                                                </tbody>
                                              </table>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center mt-3">
                                              <div className="text-soft" style={{ fontSize: '11px' }}>Showing {students.length} students</div>
                                              <div className="d-flex gap-2">
                                                <button 
                                                  className="btn-premium py-1 px-2" 
                                                  style={{ fontSize: '10px' }} 
                                                  disabled={detail.page === 1} 
                                                  onClick={(e) => { e.stopPropagation(); fetchAssessmentStudents(assessment._id, detail.page - 1); }}
                                                >
                                                  Prev
                                                </button>
                                                <button 
                                                  className="btn-premium py-1 px-2" 
                                                  style={{ fontSize: '10px' }} 
                                                  disabled={!students.length || students.length < 10} 
                                                  onClick={(e) => { e.stopPropagation(); fetchAssessmentStudents(assessment._id, detail.page + 1); }}
                                                >
                                                  Next
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        </td>
                                      </motion.tr>
                                    )}
                                  </AnimatePresence>
                                </Fragment>
                              );
                            }) : (
                              <tr><td colSpan={6} className="text-center py-5 text-muted">No exams available for this course.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
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
                <ArrowLeft size={16} /> Back to Reports
              </button>
              <h1 className="h3 fw-bold mb-0 text-main">
                {reportName || "Course Report"}
              </h1>
              <p className="text-soft mb-0" style={{ fontSize: "14px" }}>
                Analyze performance across all assessments in the selected
                period.
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
                    {showHistory ? "Hide History" : "View Logs"}
                  </button>
                )}
              </div>

              <AnimatePresence>
                {showHistory && rerunHistory.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass-card p-3 mt-2 shadow-lg"
                    style={{ maxWidth: "400px", zIndex: 10 }}
                  >
                    <div
                      className="fw-bold mb-2 d-flex align-items-center gap-2"
                      style={{ fontSize: "11px", color: "var(--primary)" }}
                    >
                      <Clock size={14} /> RERUN HISTORY LOGS
                    </div>
                    <div
                      className="table-responsive"
                      style={{ maxHeight: "200px" }}
                    >
                      <table
                        className="table table-sm mb-0"
                        style={{ fontSize: "10px" }}
                      >
                        <thead className="text-soft">
                          <tr>
                            <th>DATE</th>
                            <th>EXAMS</th>
                            <th className="text-end">AVG</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rerunHistory.map((h, i) => (
                            <tr key={i}>
                              <td>
                                {new Date(h.rerunAt).toLocaleDateString()}
                              </td>
                              <td>
                                {h.totalAssessments || h.totalStudents || 0}
                              </td>
                              <td className="text-end fw-bold">
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
              courseId={courseIds}
              setCourseId={setCourseIds}
              dateRequired={true}
              isMultipleCourse={true}
            />
            <div className="col-divider d-none d-md-block" />
            <ReportFormRight
              sliders={SLIDERS}
              sliderValues={sliderValues}
              onValuesChange={({ sliderValues: nextVals }) => {
                setSliderValues((prev) => ({ ...prev, ...(nextVals || {}) }));
              }}
            />
          </div>
          {error && <div className="alert alert-danger mt-3">{error}</div>}
        </ReportFormShell>
      )}
    </Layout>
  );
}
