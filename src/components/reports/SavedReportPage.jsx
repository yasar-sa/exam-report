import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Layout from "../shared/Layout";
import CategoryPerformanceReport from "./CategoryPerformanceReport";
import StudentCategoryPerformanceReport from "./StudentCategoryPerformanceReport";

const API_BASE = "http://localhost:5000";

export default function SavedReportPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [report, setReport] = useState(location.state?.report || null);
  const [loading, setLoading] = useState(!location.state?.report);
  const [error, setError] = useState("");

  useEffect(() => {
    if (report?.id === id) return;

    let cancelled = false;

    const loadReport = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${API_BASE}/api/saved-reports/${id}`, {
          cache: "no-store",
        });
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json?.error || "Failed to load report");
        }

        if (!cancelled) {
          setReport(json.data);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || "Failed to load report");
          setLoading(false);
        }
      }
    };

    loadReport();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div style={{ padding: "28px 40px" }}>
          <button className="back-link mb-4" onClick={() => navigate("/")}>
            Back to Advanced Reports
          </button>
          <div className="alert alert-info mb-0">Loading report...</div>
        </div>
      </Layout>
    );
  }

  if (error || !report) {
    return (
      <Layout>
        <div style={{ padding: "28px 40px" }}>
          <button className="back-link mb-4" onClick={() => navigate("/")}>
            Back to Advanced Reports
          </button>
          <div className="alert alert-danger mb-0">{error || "Report not found."}</div>
        </div>
      </Layout>
    );
  }

  if (report.type === "Student Performance") {
    return <StudentCategoryPerformanceReport initialConfig={report} />;
  }

  return <CategoryPerformanceReport initialConfig={report} />;
}
