export default function ReportFormShell({ title, reportName, onBack, children }) {
  const isReady = reportName.trim().length > 0;

  return (
    <>
      {/* Sub-header */}
      <div className="sub-header">
        <button className="back-link" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to Advanced Reports
        </button>
        <button className={`btn-generate ${isReady ? "active" : ""}`} disabled={!isReady}>
          GENERATE REPORT
        </button>
      </div>

      {/* Card */}
      <div className="form-card">
        <div className="form-card-title">{title}</div>
        <div className="form-body">{children}</div>
      </div>
    </>
  );
}
