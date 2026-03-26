import { useState } from "react";
import Layout from "../shared/Layout";
import StudentCategoryPerformanceReport from "./StudentCategoryPerformanceReport";
import CategoryPerformanceReport from "./CategoryPerformanceReport";

const REPORT_TYPES = [
  {
    id: "course",
    title: "COURSE REPORT",
    description: "See how your course is doing and which assessments may be at risk. Drill down to the student level to understand what's causing courses to be at risk.",
  },
  {
    id: "student",
    title: "STUDENT REPORT",
    description: "See how individual students are performing in a course across assessments.",
  },
];

export default function SelectReportType({ onBack, onReportCreated, initialConfig }) {
  const [selectedView, setSelectedView] = useState(() => {
    if (initialConfig) {
      return initialConfig.type === "Student Performance" ? "student" : "course";
    }
    return null;
  });

  if (selectedView === "student") {
    return (
      <StudentCategoryPerformanceReport
        onBack={onBack}
        onReportCreated={onReportCreated}
        initialConfig={initialConfig}
      />
    );
  }
  if (selectedView === "course") {
    return (
      <CategoryPerformanceReport
        onBack={onBack}
        onReportCreated={onReportCreated}
        initialConfig={initialConfig}
      />
    );
  }

  return (
    <Layout>
      <style>{`
        .select-page { padding: 28px 40px; }
        @media (max-width: 768px) {
          .select-page { padding: 16px 20px; }
        }
        .report-card {
          background: white; border: 1px solid #d9d9d9; border-radius: 3px;
          display: flex; flex-direction: column;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .card-header-bar { border-bottom: 2px solid #e0e0e0; padding: 16px 18px 14px; }
        .card-title {
          font-size: 12.5px; font-weight: 700; letter-spacing: 0.4px;
          color: #333; text-transform: uppercase; margin: 0;
        }
        .card-body-content {
          padding: 18px 18px 20px; flex: 1;
          display: flex; flex-direction: column;
        }
        .card-desc { font-size: 13.5px; color: #444; line-height: 1.55; flex: 1; margin-bottom: 20px; }
        .section-heading { font-size: 18px; color: #333; font-weight: 400; margin-bottom: 24px; }
      `}</style>

      <div className="select-page">
        <button className="back-link mb-4" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to Advanced Reports
        </button>

        <div className="section-heading">Select a Report Type</div>

        <div className="row g-3">
          {REPORT_TYPES.map((rt) => (
            <div className="col-12 col-md-4" key={rt.id}>
              <div className="report-card h-100">
                <div className="card-header-bar">
                  <p className="card-title">{rt.title}</p>
                </div>
                <div className="card-body-content">
                  <p className="card-desc">{rt.description}</p>
                  <button className="btn-select" onClick={() => setSelectedView(rt.id)}>
                    SELECT
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
