import { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

export default function StudentCategoryPerformanceReport({ onBack }) {
  const [reportName, setReportName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [department, setDepartment] = useState("");
  const [assessmentTypes, setAssessmentTypes] = useState({
    Exam: true,
    Quiz: true,
    Assignment: true,
  });
  const [needsReview, setNeedsReview] = useState(70);
  const [studentAtRisk, setStudentAtRisk] = useState(70);
  const [categoryAtRisk, setCategoryAtRisk] = useState(70);

  const toggleAssessment = (type) => {
    setAssessmentTypes((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const SliderWithInput = ({ label, value, onChange }) => (
    <div className="mb-4">
      <div className="slider-label">{label}</div>
      <div className="slider-track-wrapper">
        <div className="slider-ticks">
          {[0, 25, 50, 75, 100].map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="custom-slider"
        />
      </div>
      <input
        type="number"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider-number-input"
      />
    </div>
  );

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { background: #f0f0f0; margin: 0; font-family: 'Segoe UI', sans-serif; }

        /* Navbar */
        .examsoft-navbar {
          background: #1a73c1; height: 56px;
          display: flex; align-items: center; padding: 0 24px; gap: 16px;
        }
        .examsoft-logo { display: flex; align-items: center; gap: 8px; color: white; font-weight: 700; font-size: 18px; }
        .examsoft-logo svg { width: 32px; height: 32px; }
        .nav-divider { width: 1px; height: 32px; background: rgba(255,255,255,0.35); margin: 0 8px; }
        .nav-title { color: white; font-size: 14px; font-weight: 600; }
        .nav-subtitle { color: rgba(255,255,255,0.75); font-size: 11px; }
        .nav-right { margin-left: auto; display: flex; align-items: center; gap: 12px; color: white; font-size: 14px; }
        .nav-avatar { width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; border: 1.5px solid rgba(255,255,255,0.5); }

        /* Sub-header */
        .sub-header {
          background: #f0f0f0;
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 28px;
          border-bottom: 1px solid #ddd;
        }
        .back-link {
          display: inline-flex; align-items: center; gap: 6px;
          color: #1a73c1; font-size: 12px; font-weight: 700;
          letter-spacing: 0.5px; text-transform: uppercase;
          cursor: pointer; border: none; background: none; padding: 0;
          text-decoration: none;
        }
        .back-link:hover { text-decoration: underline; color: #1558a0; }

        .btn-generate {
          background: #e0e0e0; color: #999; border: none;
          border-radius: 3px; padding: 10px 22px;
          font-size: 12px; font-weight: 700; letter-spacing: 0.6px;
          text-transform: uppercase; cursor: not-allowed;
        }
        .btn-generate.active {
          background: #2e7d32; color: white; cursor: pointer;
        }
        .btn-generate.active:hover { background: #276128; }

        /* Card */
        .form-card {
          background: white;
          margin: 24px 28px;
          border-radius: 3px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
          overflow: hidden;
        }
        .form-card-title {
          text-align: center;
          padding: 20px;
          font-size: 16px;
          font-weight: 700;
          color: #222;
          border-bottom: 1px solid #e8e8e8;
        }
        .form-body { padding: 32px 40px 40px; }

        /* Left column */
        .field-label {
          font-size: 11px; font-weight: 700; letter-spacing: 0.6px;
          text-transform: uppercase; color: #333; margin-bottom: 6px;
        }
        .field-label .optional { color: #e8a020; font-style: italic; font-weight: 400; text-transform: none; font-size: 11px; }

        .text-input {
          width: 100%; border: 1px solid #ccc; border-radius: 3px;
          padding: 10px 12px; font-size: 14px; color: #333; outline: none;
          transition: border-color 0.2s;
        }
        .text-input::placeholder { color: #aaa; font-style: italic; }
        .text-input:focus { border-color: #1a73c1; }

        .date-wrapper { position: relative; }
        .date-wrapper .text-input { padding-right: 38px; }
        .date-icon {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          color: #888; cursor: pointer;
        }

        .dept-select {
          width: 100%; border: 1px solid #ccc; border-radius: 3px;
          padding: 10px 12px; font-size: 14px; color: #555;
          background: white; appearance: auto; outline: none;
          transition: border-color 0.2s; cursor: pointer;
        }
        .dept-select:focus { border-color: #1a73c1; }

        .categories-hint { font-size: 12.5px; color: #555; font-style: italic; line-height: 1.5; margin-bottom: 10px; }

        .btn-add-category {
          width: 100%; border: 1.5px solid #1a73c1; border-radius: 3px;
          padding: 11px; font-size: 13px; font-weight: 600; color: #1a73c1;
          background: white; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
          transition: background 0.15s;
        }
        .btn-add-category:hover { background: #eaf2fb; }

        .btn-student-groups {
          border: 1.5px solid #1a73c1; border-radius: 3px;
          padding: 8px 18px; font-size: 11px; font-weight: 700;
          letter-spacing: 0.6px; color: #1a73c1; background: white;
          cursor: pointer; text-transform: uppercase;
          transition: background 0.15s;
        }
        .btn-student-groups:hover { background: #eaf2fb; }

        /* Divider */
        .col-divider {
          width: 1px; background: #e0e0e0; margin: 0 32px; flex-shrink: 0;
          align-self: stretch;
        }

        /* Right column */
        .section-title-right {
          font-size: 11.5px; font-weight: 700; letter-spacing: 0.5px;
          text-transform: uppercase; color: #333;
          display: flex; align-items: center; gap: 8px; margin-bottom: 4px;
        }
        .section-title-right .optional { color: #e8a020; font-style: italic; font-weight: 400; text-transform: none; font-size: 11px; }
        .section-desc { font-size: 13px; color: #444; margin-bottom: 14px; }

        .checkbox-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .checkbox-row input[type="checkbox"] { width: 16px; height: 16px; accent-color: #1a73c1; cursor: pointer; }
        .checkbox-row label { font-size: 14px; color: #333; cursor: pointer; margin: 0; }

        .threshold-section { margin-top: 28px; }
        .threshold-title {
          font-size: 11.5px; font-weight: 700; letter-spacing: 0.5px;
          text-transform: uppercase; color: #333;
          display: flex; align-items: center; gap: 8px; margin-bottom: 4px;
        }
        .threshold-title .optional { color: #e8a020; font-style: italic; font-weight: 400; text-transform: none; font-size: 11px; }
        .threshold-desc { font-size: 13px; color: #444; margin-bottom: 20px; }

        .slider-label { font-size: 14px; color: #333; margin-bottom: 4px; }
        .slider-track-wrapper { margin-bottom: 8px; }
        .slider-ticks {
          display: flex; justify-content: space-between;
          font-size: 11px; color: #666; margin-bottom: 2px;
          padding: 0 2px;
        }
        .custom-slider {
          width: 100%; accent-color: #888;
          height: 4px; cursor: pointer;
        }
        .slider-number-input {
          border: 1px solid #ccc; border-radius: 3px;
          padding: 7px 10px; font-size: 14px; width: 80px;
          text-align: center; outline: none;
          transition: border-color 0.2s;
        }
        .slider-number-input:focus { border-color: #1a73c1; }
      `}</style>

      {/* Navbar */}
      <div className="examsoft-navbar">
        <div className="examsoft-logo">
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="6" fill="white" fillOpacity="0.15"/>
            <path d="M8 14h24M8 20h16M8 26h20" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            <circle cx="30" cy="26" r="5" fill="#4fc3f7"/>
          </svg>
          <span>ExamSoft</span>
        </div>
        <div className="nav-divider" />
        <div>
          <div className="nav-title">ExamSoft Trials</div>
          <div className="nav-subtitle">ID#456</div>
        </div>
        <div className="nav-right">
          <span>ADMIN</span>
          <div className="nav-avatar">
            <svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
          </div>
        </div>
      </div>

      {/* Sub-header */}
      <div className="sub-header">
        <button className="back-link" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back to Advanced Reports
        </button>
        <button className={`btn-generate ${reportName.trim() ? "active" : ""}`}>
          GENERATE REPORT
        </button>
      </div>

      {/* Main Card */}
      <div className="form-card">
        <div className="form-card-title">Student Category Performance Report</div>

        <div className="form-body">
          <div className="d-flex">

            {/* LEFT COLUMN */}
            <div style={{ flex: 1 }}>

              {/* Report Name */}
              <div className="mb-4">
                <div className="field-label">REPORT NAME</div>
                <input
                  type="text"
                  className="text-input"
                  placeholder="Enter a name or title for this report"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                />
              </div>

              {/* Date Range */}
              <div className="mb-4">
                <div className="field-label">DATE RANGE</div>
                <div className="d-flex gap-3">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: "#444", marginBottom: 4 }}>Start Date</div>
                    <div className="date-wrapper">
                      <input
                        type="text"
                        className="text-input"
                        placeholder="ex: 12/10/2017"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                      <span className="date-icon">
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                          <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                        </svg>
                      </span>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: "#444", marginBottom: 4 }}>End Date</div>
                    <div className="date-wrapper">
                      <input
                        type="text"
                        className="text-input"
                        placeholder="ex: 12/10/2017"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                      <span className="date-icon">
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                          <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Department */}
              <div className="mb-4">
                <div className="field-label">DEPARTMENT</div>
                <select
                  className="dept-select"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="">Select a Department</option>
                  <option value="jamia">Jamia Darussalam</option>
                </select>
              </div>

              {/* Categories */}
              <div className="mb-4">
                <div className="field-label">CATEGORIES</div>
                <div className="categories-hint">
                  These are predefined reportable tags which are set at the institution and department level.
                </div>
                <button className="btn-add-category">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  Add Category
                </button>
              </div>

              {/* Student Groups */}
              <div className="mb-2">
                <div className="field-label">
                  STUDENT GROUPS <span className="optional">(Optional)</span>
                </div>
                <button className="btn-student-groups">STUDENT GROUPS</button>
              </div>

            </div>

            {/* Vertical Divider */}
            <div className="col-divider" />

            {/* RIGHT COLUMN */}
            <div style={{ flex: 1 }}>

              {/* Assessment Types */}
              <div className="mb-2">
                <div className="section-title-right">
                  ASSESSMENT TYPES <span className="optional">(Optional)</span>
                </div>
                <div className="section-desc">Select assessment types to be included in the final report.</div>
                {["Exam", "Quiz", "Assignment"].map((type) => (
                  <div className="checkbox-row" key={type}>
                    <input
                      type="checkbox"
                      id={type}
                      checked={assessmentTypes[type]}
                      onChange={() => toggleAssessment(type)}
                    />
                    <label htmlFor={type}>{type}</label>
                  </div>
                ))}
              </div>

              {/* Category At Risk Threshold */}
              <div className="threshold-section">
                <div className="threshold-title">
                  CATEGORY AT RISK THRESHOLD <span className="optional">(Optional)</span>
                </div>
                <div className="threshold-desc">
                  Determine what constitutes an at risk category to show up in the report
                </div>

                <SliderWithInput
                  label="Needs Review Threshold"
                  value={needsReview}
                  onChange={setNeedsReview}
                />
                <SliderWithInput
                  label="Student At Risk Threshold"
                  value={studentAtRisk}
                  onChange={setStudentAtRisk}
                />
                <SliderWithInput
                  label="Category At Risk Threshold"
                  value={categoryAtRisk}
                  onChange={setCategoryAtRisk}
                />
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}