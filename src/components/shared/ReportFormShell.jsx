export default function ReportFormShell({
  title,
  reportName,
  onBack,
  onGenerate,
  onDelete, // NEW
  isGenerating = false,
  children,
}) {
  const isReady = reportName.trim().length > 0 && typeof onGenerate === "function";

  return (
    <>
      <div className="sub-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="back-link" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to Advanced Reports
        </button>
        <div className="d-flex flex-column flex-sm-row gap-3 align-items-sm-center mt-3 mt-sm-0">
          {onDelete && (
            <button 
              onClick={onDelete}
              style={{ background: 'none', border: 'none', color: '#d32f2f', fontWeight: 600, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V67M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              DELETE
            </button>
          )}
          <button
            className={`btn-generate ${isReady && !isGenerating ? "active" : ""}`}
            disabled={!isReady || isGenerating}
            onClick={() => {
              if (!isReady || isGenerating) return;
              onGenerate();
            }}
          >
            GENERATE REPORT
          </button>
        </div>
      </div>

      {/* Card */}
      <div className="form-card">
        <div className="form-card-title">{title}</div>
        <div className="form-body">{children}</div>
      </div>
    </>
  );
}
