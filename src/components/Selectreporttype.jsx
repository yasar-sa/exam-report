import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import StudentCategoryPerformanceReport from "./StudentCategoryPerformanceReport";
import { useState } from "react";

export default function SelectReportType({ onBack }) {
  const [selectedView, setSelectedView] = useState(null);

  const reportTypes = [
    {
      id: "course",
      title: "COURSE PERFORMANCE",
      description:
        "See how your course(s) are doing and which ones may be at risk. Drill down to the student level to understand what's causing courses to be at risk.",
    },
    {
      id: "category",
      title: "CATEGORY PERFORMANCE",
      description:
        "See how categories performed across assessments over a period of time.",
    },
    {
      id: "student",
      title: "STUDENT CATEGORY PERFORMANCE",
      description:
        "See how categories are performing for students in a course or multiple courses.",
    },
  ];

  if (selectedView === "student") {
    return <StudentCategoryPerformanceReport onBack={() => setSelectedView(null)} />;
  }

  const handleSelect = (id) => {
    if (id === "student") {
      setSelectedView("student");
    } else {
      // Placeholder for other report types
      console.log("Selected report type:", id);
    }
  };

  return (
    <>

      <style>{`
        body { background: #f4f4f4; margin: 0; font-family: 'Segoe UI', sans-serif; }

        .top-bar {
          height: 6px;
          background: #1a73c1;
          width: 100%;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #1a73c1;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-decoration: none;
          text-transform: uppercase;
          cursor: pointer;
          border: none;
          background: none;
          padding: 0;
        }
        .back-link:hover { color: #1558a0; text-decoration: underline; }

        .page-content { padding: 28px 40px; }

        .section-title {
          font-size: 18px;
          color: #333;
          font-weight: 400;
          margin-bottom: 24px;
        }

        .report-card {
          background: white;
          border: 1px solid #d9d9d9;
          border-radius: 3px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }

        .card-header-bar {
          border-bottom: 2px solid #e0e0e0;
          padding: 16px 18px 14px;
        }

        .card-title {
          font-size: 12.5px;
          font-weight: 700;
          letter-spacing: 0.4px;
          color: #333;
          text-transform: uppercase;
          margin: 0;
        }

        .card-body-content {
          padding: 18px 18px 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .card-desc {
          font-size: 13.5px;
          color: #444;
          line-height: 1.55;
          flex: 1;
          margin-bottom: 20px;
        }

        .btn-select {
          border: 1.5px solid #1a73c1;
          background: white;
          color: #1a73c1;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.8px;
          padding: 8px 24px;
          border-radius: 3px;
          cursor: pointer;
          text-transform: uppercase;
          align-self: flex-start;
          transition: background 0.15s, color 0.15s;
        }
        .btn-select:hover {
          background: #1a73c1;
          color: white;
        }
      `}</style>

      <div className="top-bar" />

      <div className="page-content">
        <button className="back-link mb-4" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back to Advanced Reports
        </button>

        <div className="section-title">Select a Report Type</div>

        <div className="row g-3">
          {reportTypes.map((rt) => (
            <div className="col-12 col-md-4" key={rt.id}>
              <div className="report-card h-100">
                <div className="card-header-bar">
                  <p className="card-title">{rt.title}</p>
                </div>
                <div className="card-body-content">
                  <p className="card-desc">{rt.description}</p>
                  <button className="btn-select" onClick={() => handleSelect(rt.id)}>
                    SELECT
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}