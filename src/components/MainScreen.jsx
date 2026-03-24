import { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import SelectReportType from "./Selectreporttype";

const initialReports = [
  { id: 1, name: "cc", type: "Student Category Perf", department: "Jamia Darussalam", courses: 1, dateCreated: "Jun 29, 2025" },
  { id: 2, name: "Category Perf", type: "Student Category Perf", department: "Jamia Darussalam", courses: 1, dateCreated: "May 6, 2025" },
  { id: 3, name: "Category Perf (copy)", type: "Student Category Perf", department: "Jamia Darussalam", courses: 1, dateCreated: "May 6, 2025" },
  { id: 4, name: "Category Perf (copy) (copy)", type: "Student Category Perf", department: "Jamia Darussalam", courses: 1, dateCreated: "May 6, 2025" },
  { id: 5, name: "Course", type: "Course Performance", department: "Jamia Darussalam", courses: 2, dateCreated: "May 6, 2025" },
  { id: 6, name: "cc (copy)", type: "Student Category Perf", department: "Jamia Darussalam", courses: 1, dateCreated: "Oct 23, 2025" },
];

const SORT_DIRS = { asc: "asc", desc: "desc" };

export default function App() {
  const [view, setView] = useState("list"); // "list" | "selectType"

  if (view === "selectType") {
    return <SelectReportType onBack={() => setView("list")} />;
  }

  return <AdvancedReports onCreateNew={() => setView("selectType")} />;
}

function AdvancedReports({ onCreateNew }) {
  const [reports] = useState(initialReports);
  const [search, setSearch] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortCol, setSortCol] = useState("courses");
  const [sortDir, setSortDir] = useState(SORT_DIRS.asc);

  const filtered = reports.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    let valA = a[sortCol];
    let valB = b[sortCol];
    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();
    if (valA < valB) return sortDir === "asc" ? -1 : 1;
    if (valA > valB) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const displayed = sorted.slice(0, itemsPerPage);

  const allChecked = displayed.length > 0 && displayed.every((r) => selectedIds.includes(r.id));

  const toggleAll = () => {
    if (allChecked) setSelectedIds([]);
    else setSelectedIds(displayed.map((r) => r.id));
  };

  const toggleOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <span style={{ color: "#aaa", fontSize: 10 }}>↕</span>;
    return <span style={{ fontSize: 10 }}>{sortDir === "asc" ? "▲" : "▼"}</span>;
  };

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
      />

      <style>{`
        body { background: #f4f4f4; margin: 0; font-family: 'Segoe UI', sans-serif; }
        .examsoft-navbar {
          background: #1a73c1;
          height: 56px;
          display: flex;
          align-items: center;
          padding: 0 24px;
          gap: 16px;
        }
        .examsoft-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          color: white;
          font-weight: 700;
          font-size: 18px;
          letter-spacing: -0.3px;
        }
        .examsoft-logo svg { width: 32px; height: 32px; }
        .nav-divider {
          width: 1px;
          height: 32px;
          background: rgba(255,255,255,0.35);
          margin: 0 8px;
        }
        .nav-title { color: white; font-size: 14px; }
        .nav-subtitle { color: rgba(255,255,255,0.75); font-size: 11px; }
        .nav-right { margin-left: auto; display: flex; align-items: center; gap: 12px; color: white; font-size: 14px; }
        .nav-right .avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: rgba(255,255,255,0.2);
          display: flex; align-items: center; justify-content: center;
          border: 1.5px solid rgba(255,255,255,0.5);
        }
        .page-content { padding: 32px 48px; }
        .report-table { background: white; border-radius: 4px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        .report-table thead tr { background: #3d5166; }
        .report-table thead th {
          color: white; font-size: 11.5px; font-weight: 600;background: #3d5166;
          letter-spacing: 0.5px; text-transform: uppercase;
          padding: 14px 16px; border: none; white-space: nowrap;
          cursor: pointer; user-select: none;
        }
        .report-table thead th:hover { background: #4a6278; }
        .report-table tbody tr { border-bottom: 1px solid #eee; transition: background 0.15s; }
        .report-table tbody tr:last-child { border-bottom: none; }
        .report-table tbody tr:hover { background: #f7fafd; }
        .report-table tbody td { padding: 14px 16px; font-size: 14px; color: #333; vertical-align: middle; }
        .report-link { color: #1a73c1; text-decoration: none; font-weight: 500; }
        .report-link:hover { text-decoration: underline; color: #1558a0; }
        .courses-badge { color: #1a73c1; font-weight: 600; }
        .search-box {
          border: 1px solid #ddd; border-radius: 4px;
          padding: 9px 16px 9px 36px; font-size: 14px;
          background: white; width: 100%; outline: none;
          transition: border-color 0.2s;
        }
        .search-box:focus { border-color: #1a73c1; }
        .search-wrapper { position: relative; flex: 1; }
        .search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #999; }
        .filter-btn {
          border: 1px solid #ddd; background: white; border-radius: 4px;
          padding: 9px 16px; font-size: 14px; color: #555; cursor: pointer;
          white-space: nowrap;
        }
        .filter-btn:hover { background: #f5f5f5; }
        .btn-create {
          background: #2e7d32; color: white; border: none;
          border-radius: 4px; padding: 10px 20px; font-size: 13px;
          font-weight: 600; letter-spacing: 0.5px; cursor: pointer;
          white-space: nowrap;
        }
        .btn-create:hover { background: #276128; }
        .items-select {
          border: 1px solid #ccc; border-radius: 4px;
          padding: 6px 28px 6px 10px; font-size: 14px;
          background: white; appearance: auto; cursor: pointer;
        }
        .col-icon-btn {
          background: none; border: none; cursor: pointer; color: white; padding: 2px 6px;
        }
        .header-checkbox { accent-color: white; width: 15px; height: 15px; cursor: pointer; }
        .row-checkbox { accent-color: #1a73c1; width: 15px; height: 15px; cursor: pointer; }
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
          <div className="nav-title" style={{ fontWeight: 600 }}>ExamSoft Trials</div>
          <div className="nav-subtitle">ID#456</div>
        </div>
        <div className="nav-right">
          <span>ADMIN</span>
          <div className="avatar">
            <svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
          </div>
        </div>
      </div>

      {/* Page */}
      <div className="page-content">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h4 className="mb-0 fw-semibold" style={{ fontSize: 26, color: "#222" }}>Advanced Reports</h4>
          <button className="btn-create" onClick={onCreateNew}>CREATE NEW REPORT</button>
        </div>

        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: 14, color: "#444" }}>Items per page:</span>
            <select
              className="items-select"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
            >
              {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <span style={{ fontSize: 14, color: "#444" }}>Total Reports: {filtered.length}</span>
        </div>

        <div className="d-flex gap-0 mb-0">
          <div className="search-wrapper me-0" style={{ flex: 1 }}>
            <span className="search-icon">
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </span>
            <input
              className="search-box"
              style={{ borderRight: "none", borderRadius: "4px 0 0 4px" }}
              type="text"
              placeholder="Find a Report"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="filter-btn" style={{ borderRadius: "0 4px 4px 0", borderLeft: "none" }}>
            Filter ▾
          </button>
        </div>

        <div className="report-table mt-0">
          <table className="table mb-0 report-table">
            <thead>
              <tr>
                <th style={{ width: 48 }}>
                  <input type="checkbox" className="header-checkbox" checked={allChecked} onChange={toggleAll} />
                </th>
                <th onClick={() => handleSort("name")} className={sortCol === "name" ? "active" : ""}>
                  REPORT NAME &nbsp;<SortIcon col="name" />
                </th>
                <th onClick={() => handleSort("type")} className={sortCol === "type" ? "active" : ""}>
                  REPORT TYPE &nbsp;<SortIcon col="type" />
                </th>
                <th onClick={() => handleSort("department")} className={sortCol === "department" ? "active" : ""}>
                  DEPARTMENT &nbsp;<SortIcon col="department" />
                </th>
                <th onClick={() => handleSort("courses")} className={sortCol === "courses" ? "active" : ""} style={{ textAlign: "center" }}>
                  COURSES &nbsp;<SortIcon col="courses" />
                </th>
                <th onClick={() => handleSort("dateCreated")} className={sortCol === "dateCreated" ? "active" : ""}>
                  DATE CREATED &nbsp;<SortIcon col="dateCreated" />
                </th>
                <th style={{ width: 40, textAlign: "center" }}>
                  <button className="col-icon-btn" title="Column settings">⊞</button>
                </th>
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">No reports found.</td>
                </tr>
              ) : (
                displayed.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <input type="checkbox" className="row-checkbox" checked={selectedIds.includes(report.id)} onChange={() => toggleOne(report.id)} />
                    </td>
                    <td>
                      <a href="#" className="report-link" onClick={(e) => e.preventDefault()}>{report.name}</a>
                    </td>
                    <td>{report.type}</td>
                    <td>{report.department}</td>
                    <td style={{ textAlign: "center" }}>
                      <a href="#" className="courses-badge" onClick={(e) => e.preventDefault()}>{report.courses}</a>
                    </td>
                    <td>{report.dateCreated}</td>
                    <td></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}