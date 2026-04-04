import { BarChart3, Bell, User, LayoutDashboard, FilePieChart } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <nav style={{ 
      height: "64px", 
      display: "flex", 
      alignItems: "center", 
      padding: "0 32px",
      zIndex: 1000,
      background: "#cad2e4ff",
      borderBottom: "1px solid #e2e8f0",
      position: "sticky",
      top: 0
    }}>
      <div 
        className="d-flex align-items-center gap-2" 
        onClick={() => navigate("/")}
        style={{ cursor: "pointer" }}
      >
        <div style={{ 
          background: "linear-gradient(135deg, var(--primary), #60a5fa)",
          padding: "8px",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)"
        }}>
          <BarChart3 size={24} color="white" />
        </div>
        <span style={{ 
          fontFamily: "Outfit", 
          fontSize: "20px", 
          fontWeight: 700, 
          color: "var(--text-main)",
          letterSpacing: "-0.5px"
        }}>
          Exam<span style={{ color: "var(--primary)" }}>Soft</span>
        </span>
      </div>

      <div className="mx-4" style={{ width: "1px", height: "24px", background: "#e2e8f0" }} />

      <div className="d-flex gap-4">
        <button 
          className="nav-btn"
          onClick={() => navigate("/")}
          style={{ 
            background: "none", 
            border: "none", 
            fontSize: "14px", 
            fontWeight: 500, 
            color: "var(--text-main)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 12px",
            borderRadius: "8px",
            transition: "all 0.2s"
          }}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </button>
        <button 
          className="nav-btn"
          onClick={() => navigate("/reports/new")}
          style={{ 
            background: "none", 
            border: "none", 
            fontSize: "14px", 
            fontWeight: 500, 
            color: "var(--text-soft)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 12px",
            borderRadius: "8px",
            transition: "all 0.2s"
          }}
        >
          <FilePieChart size={18} />
          Reports
        </button>
      </div>

      <div className="ms-auto d-flex align-items-center gap-3">
        <button style={{ background: "none", border: "none", color: "var(--text-soft)", cursor: "pointer" }}>
          <Bell size={20} />
        </button>
        <div style={{ width: "1px", height: "20px", background: "#e2e8f0" }} />
        <div className="d-flex align-items-center gap-3">
          <div className="text-end d-none d-sm-block">
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Admin User</div>
            <div style={{ fontSize: "11px", color: "var(--text-soft)" }}>ID#456</div>
          </div>
          <div style={{ 
            width: "38px", 
            height: "38px", 
            borderRadius: "12px", 
            background: "#f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #e2e8f0",
            color: "var(--primary)"
          }}>
            <User size={20} />
          </div>
        </div>
      </div>
    </nav>
  );
}
