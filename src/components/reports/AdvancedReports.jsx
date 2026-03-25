import { useState } from "react";
import Layout from "../shared/Layout";
import SelectReportType from "./SelectReportType";

const INITIAL_REPORTS = [
  { id: 1, name: "cc",                          type: "Student Category Perf", department: "Jamia Darussalam", courses: 1, dateCreated: "Jun 29, 2025" },
  { id: 2, name: "Category Perf 1",               type: "Student Category Perf", department: "Jamia Darussalam", courses: 1, dateCreated: "May 6, 2025"  },
  { id: 3, name: "Category Perf 2",         type: "Student Category Perf", department: "Jamia Darussalam", courses: 1, dateCreated: "May 6, 2025"  },
  { id: 4, name: "Category Perf 3",  type: "Student Category Perf", department: "Jamia Darussalam", courses: 1, dateCreated: "May 6, 2025"  },
  { id: 5, name: "Course",                       type: "Course Performance",     department: "Jamia Darussalam", courses: 1, dateCreated: "May 6, 2025"  },
  { id: 6, name: "cc 2",                    type: "Student Category Perf", department: "Jamia Darussalam", courses: 1, dateCreated: "Oct 23, 2025" },
];

export default function App() {
  const [view, setView] = useState("list");
  if (view === "selectType") return <SelectReportType onBack={() => setView("list")} />;
  return <AdvancedReports onCreateNew={() => setView("selectType")} />;
}

function AdvancedReports({ onCreateNew }) {
  const [reports]     = useState(INITIAL_REPORTS);
  const [search,       setSearch]      = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [selectedIds,  setSelectedIds]  = useState([]);
  const [sortCol,      setSortCol]      = useState("courses");
  const [sortDir,      setSortDir]      = useState("asc");

  const filtered = reports.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    let A = a[sortCol], B = b[sortCol];
    if (typeof A === "string") { A = A.toLowerCase(); B = B.toLowerCase(); }
    return A < B ? (sortDir === "asc" ? -1 : 1) : A > B ? (sortDir === "asc" ? 1 : -1) : 0;
  });

  const displayed   = sorted.slice(0, itemsPerPage);
  const allChecked  = displayed.length > 0 && displayed.every((r) => selectedIds.includes(r.id));
  const toggleAll   = () => setSelectedIds(allChecked ? [] : displayed.map((r) => r.id));
  const toggleOne   = (id) => setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const handleSort  = (col) => {
    if (sortCol === col) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const SortIcon = ({ col }) =>
    sortCol !== col
      ? <span style={{ color: "#aaa", fontSize: 10 }}>↕</span>
      : <span style={{ fontSize: 10 }}>{sortDir === "asc" ? "▲" : "▼"}</span>;

  return (
    <Layout>
      <style>{`
        .page-content { padding: 32px 48px; }
        .report-table { background: white; border-radius: 4px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        .report-table thead tr  { background: #3d5166; }
        .report-table thead th  {
          color: white; font-size: 11.5px; font-weight: 600; letter-spacing: 0.5px;background: #3d5166;
          text-transform: uppercase; padding: 14px 16px; border: none;
          white-space: nowrap; cursor: pointer; user-select: none;
        }
        .report-table thead th:hover { background: #4a6278; }
        .report-table tbody tr { border-bottom: 1px solid #eee; transition: background 0.15s; }
        .report-table tbody tr:last-child { border-bottom: none; }
        .report-table tbody tr:hover { background: #f7fafd; }
        .report-table tbody td { padding: 14px 16px; font-size: 14px; color: #333; vertical-align: middle; }
        .report-link { color: #1a73c1; text-decoration: none; font-weight: 500; }
        .report-link:hover { text-decoration: underline; }
        .courses-badge { color: #1a73c1; font-weight: 600; }
        .search-box {
          border: 1px solid #ddd; border-radius: 4px;
          padding: 9px 16px 9px 36px; font-size: 14px;
          background: white; width: 100%; outline: none; transition: border-color 0.2s;
        }
        .search-box:focus { border-color: #1a73c1; }
        .search-wrapper { position: relative; flex: 1; }
        .search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #999; }
        .filter-btn {
          border: 1px solid #ddd; background: white; border-radius: 4px;
          padding: 9px 16px; font-size: 14px; color: #555; cursor: pointer; white-space: nowrap;
        }
        .filter-btn:hover { background: #f5f5f5; }
        .items-select {
          border: 1px solid #ccc; border-radius: 4px;
          padding: 6px 10px; font-size: 14px; background: white; cursor: pointer;
        }
        .col-icon-btn { background: none; border: none; cursor: pointer; color: white; padding: 2px 6px; }
        .header-checkbox { accent-color: white; width: 15px; height: 15px; cursor: pointer; }
        .row-checkbox    { accent-color: #1a73c1; width: 15px; height: 15px; cursor: pointer; }
      `}</style>

      <div className="page-content">
        {/* Title row */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h4 className="mb-0 fw-semibold" style={{ fontSize: 26, color: "#222" }}>Advanced Reports</h4>
          <button className="btn-create" onClick={onCreateNew}>CREATE NEW REPORT</button>
        </div>

        {/* Items per page + total */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: 14, color: "#444" }}>Items per page:</span>
            <select className="items-select" value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}>
              {[10, 25, 50, 100].map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>
          <span style={{ fontSize: 14, color: "#444" }}>Total Reports: {filtered.length}</span>
        </div>

        {/* Search + Filter */}
        <div className="d-flex mb-0">
          <div className="search-wrapper">
            <span className="search-icon">
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </span>
            <input
              className="search-box"
              style={{ borderRight: "none", borderRadius: "4px 0 0 4px" }}
              placeholder="Find a Report"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="filter-btn" style={{ borderRadius: "0 4px 4px 0", borderLeft: "none" }}>
            Filter ▾
          </button>
        </div>

        {/* Table */}
        <div className="report-table">
          <table className="table mb-0 report-table">
            <thead>
              <tr>
                <th style={{ width: 48 }}>
                  <input type="checkbox" className="header-checkbox" checked={allChecked} onChange={toggleAll} />
                </th>
                {[
                  { col: "name",        label: "REPORT NAME" },
                  { col: "type",        label: "REPORT TYPE" },
                  { col: "department",  label: "DEPARTMENT" },
                  { col: "courses",     label: "COURSES", center: true },
                  { col: "dateCreated", label: "DATE CREATED" },
                ].map(({ col, label, center }) => (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    className={sortCol === col ? "active" : ""}
                    style={center ? { textAlign: "center" } : {}}
                  >
                    {label} &nbsp;<SortIcon col={col} />
                  </th>
                ))}
                <th style={{ width: 40, textAlign: "center" }}>
                  <button className="col-icon-btn">⊞</button>
                </th>
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-muted py-4">No reports found.</td></tr>
              ) : displayed.map((r) => (
                <tr key={r.id}>
                  <td><input type="checkbox" className="row-checkbox" checked={selectedIds.includes(r.id)} onChange={() => toggleOne(r.id)} /></td>
                  <td><a href="#" className="report-link" onClick={(e) => e.preventDefault()}>{r.name}</a></td>
                  <td>{r.type}</td>
                  <td>{r.department}</td>
                  <td style={{ textAlign: "center" }}>
                    <a href="#" className="courses-badge" onClick={(e) => e.preventDefault()}>{r.courses}</a>
                  </td>
                  <td>{r.dateCreated}</td>
                  <td />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
