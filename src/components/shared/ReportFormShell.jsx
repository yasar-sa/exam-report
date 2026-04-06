import { ChevronLeft, Send, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ReportFormShell({
  title,
  reportName,
  onBack,
  onGenerate,
  onDelete,
  isGenerating = false,
  children,
}) {
  const navigate = useNavigate();
  const isReady = (reportName || "").trim().length > 0 && typeof onGenerate === "function";

  return (
    <div className="fade-in" style={{ maxWidth: "1000px", margin: "24px auto" }}>
      <div className="d-flex justify-content-between align-items-center mb-4 px-2">
        <button 
          onClick={onBack}
          className="btn-premium"
          style={{ 
            color: "var(--text-soft)",
            padding: "8px 16px",
            background: "white",
            border: "1px solid #e2e8f0"
          }}
        >
          <ChevronLeft size={18} />
          Back to Reports
        </button>

        <div className="d-flex gap-3">
          {onDelete && (
            <button 
              onClick={onDelete}
              className="btn-premium"
              style={{ background: "#fee2e2", color: "#991b1b" }}
            >
              <Trash2 size={18} />
              Delete
            </button>
          )}
          <button 
            className={`btn-premium btn-primary-modern ${(!isReady || isGenerating) ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => isReady && !isGenerating && onGenerate()}
            disabled={!isReady || isGenerating}
          >
            <Send size={18} />
            {isGenerating ? "Generating..." : "Generate Report"}
          </button>
        </div>
      </div>

      <div className="glass-card shadow-sm overflow-hidden">
        <div style={{ 
          padding: "24px", 
          borderBottom: "1px solid #f1f5f9", 
          textAlign: "center",
          background: "#fcfcfc"
        }}>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>{title}</h2>
          {reportName && (
            <div style={{ fontSize: "14px", color: "var(--text-soft)", marginTop: "6px" }}>
              {reportName}
            </div>
          )}
        </div>
        <div style={{ padding: "32px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
