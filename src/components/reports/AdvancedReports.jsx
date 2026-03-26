import { useEffect, useMemo, useState } from "react";
import Layout from "../shared/Layout";
import SelectReportType from "./SelectReportType";

export default function App() {
  const [view, setView] = useState("list");
  const [viewConfig, setViewConfig] = useState(null);
  const [reports, setReports] = useState([]);

  const fetchReports = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/saved-reports", { cache: "no-store" });
      const json = await res.json();
      if (json.success) setReports(json.data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleReportCreated = () => {
    fetchReports();
  };

  if (view === "selectType") {
    return (
      <SelectReportType
        onBack={() => { setView("list"); setViewConfig(null); }}
        onReportCreated={handleReportCreated}
        initialConfig={viewConfig}
      />
    );
  }

  return (
    <AdvancedReports
      onCreateNew={() => { setView("selectType"); setViewConfig(null); }}
      onViewReport={(r) => { setView("selectType"); setViewConfig(r); }}
      reports={reports}
    />
  );
}

function AdvancedReports({ onCreateNew, onViewReport, reports }) {
  const [search,       setSearch]      = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [selectedIds,  setSelectedIds]  = useState([]);
  const [sortCol,      setSortCol]      = useState("name");
  const [sortDir,      setSortDir]      = useState("asc");
  const [currentPage,  setCurrentPage]  = useState(1);

  const filtered = reports.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    let A = a[sortCol] || "", B = b[sortCol] || "";
    if (typeof A === "string") { A = A.toLowerCase(); B = B.toLowerCase(); }
    return A < B ? (sortDir === "asc" ? -1 : 1) : A > B ? (sortDir === "asc" ? 1 : -1) : 0;
  });

  // Reset to first page if search changes or items per page changes and total pages shrink
  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const displayed   = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
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
        @media (max-width: 768px) {
          .page-content { padding: 16px 20px; }
        }
        .report-table { background: white; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
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
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
          <h4 className="mb-0 fw-semibold" style={{ fontSize: 26, color: "#222" }}>Advanced Reports</h4>
          <button className="btn-create" onClick={onCreateNew}>CREATE NEW REPORT</button>
        </div>

        {/* Items per page + total */}
        <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between mb-3 gap-2">
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: 14, color: "#444" }}>Items per page:</span>
            <select className="items-select" value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}>
              {[10, 25, 50, 100].map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>
          <span style={{ fontSize: 14, color: "#444" }}>Total Reports: {filtered.length}</span>
        </div>

        <div className="d-flex mb-3">
          <div className="search-wrapper">
            <span className="search-icon">
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </span>
            <input
              className="search-box"
              style={{ borderRadius: "4px" }}
              placeholder="Find a Report"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive" style={{ borderRadius: '4px' }}>
          <div className="report-table">
          <table className="table mb-0 report-table" style={{ minWidth: '700px' }}>
            <thead>
              <tr>
                <th style={{ width: 48 }}>
                  <input type="checkbox" className="header-checkbox" checked={allChecked} onChange={toggleAll} />
                </th>
                {[
                  { col: "name",        label: "REPORT NAME" },
                  { col: "type",        label: "REPORT TYPE" },
                  { col: "department",  label: "DEPARTMENT" },
                  { col: "dateCreated", label: "DATE CREATED" },
                ].map(({ col, label }) => (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    className={sortCol === col ? "active" : ""}
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
                <tr><td colSpan={6} className="text-center text-muted py-4">No reports found.</td></tr>
              ) : displayed.map((r) => (
                <tr key={r.id}>
                  <td><input type="checkbox" className="row-checkbox" checked={selectedIds.includes(r.id)} onChange={() => toggleOne(r.id)} /></td>
                  <td><a href="#" className="report-link" onClick={(e) => { e.preventDefault(); onViewReport(r); }}>{r.name}</a></td>
                  <td>{r.type}</td>
                  <td>{r.department}</td>
                  <td>{r.dateCreated}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => onViewReport(r)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-center align-items-center mt-4 gap-2">
            <button 
              className="btn btn-sm btn-outline-secondary" 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              style={{ fontSize: "12px", border: "1px solid #ccc" }}
            >
              Previous
            </button>
            <span style={{ fontSize: "13px", color: "#555", fontWeight: 500, margin: "0 8px" }}>
              Page {currentPage} of {totalPages}
            </span>
            <button 
              className="btn btn-sm btn-outline-secondary" 
              disabled={currentPage === totalPages} 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              style={{ fontSize: "12px", border: "1px solid #ccc" }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
