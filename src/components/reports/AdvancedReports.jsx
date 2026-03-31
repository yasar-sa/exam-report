import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../shared/Layout";

const API_BASE = "http://localhost:5000";

export default function AdvancedReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortCol, setSortCol] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchReports = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/saved-reports`, { cache: "no-store" });
        const json = await res.json();
        if (!cancelled && json.success) {
          setReports(json.data);
        }
      } catch {
        if (!cancelled) {
          setReports([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchReports();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = reports.filter((report) =>
    report.name.toLowerCase().includes(search.toLowerCase()),
  );

  const sorted = [...filtered].sort((a, b) => {
    let first = a[sortCol] || "";
    let second = b[sortCol] || "";
    if (typeof first === "string") {
      first = first.toLowerCase();
      second = second.toLowerCase();
    }
    return first < second ? (sortDir === "asc" ? -1 : 1) : first > second ? (sortDir === "asc" ? 1 : -1) : 0;
  });

  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  const effectiveCurrentPage = Math.min(currentPage, totalPages);
  const displayed = sorted.slice(
    (effectiveCurrentPage - 1) * itemsPerPage,
    effectiveCurrentPage * itemsPerPage,
  );
  const allChecked = displayed.length > 0 && displayed.every((report) => selectedIds.includes(report.id));

  const toggleAll = () => {
    setSelectedIds(allChecked ? [] : displayed.map((report) => report.id));
  };

  const toggleOne = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
      return;
    }
    setSortCol(col);
    setSortDir("asc");
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
          color: white; font-size: 11.5px; font-weight: 600; letter-spacing: 0.5px; background: #3d5166;
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
        .items-select {
          border: 1px solid #ccc; border-radius: 4px;
          padding: 6px 10px; font-size: 14px; background: white; cursor: pointer;
        }
        .col-icon-btn { background: none; border: none; cursor: pointer; color: white; padding: 2px 6px; }
        .header-checkbox { accent-color: white; width: 15px; height: 15px; cursor: pointer; }
        .row-checkbox { accent-color: #1a73c1; width: 15px; height: 15px; cursor: pointer; }
        .report-meta { font-size: 12px; color: #666; }
      `}</style>

      <div className="page-content">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
          <div>
            <h4 className="mb-1 fw-semibold" style={{ fontSize: 26, color: "#222" }}>Advanced Reports</h4>
            <div className="report-meta">Saved report snapshots live here. Open one report with a single saved-report fetch.</div>
          </div>
          <button className="btn-create" onClick={() => navigate("/reports/new")}>
            CREATE NEW REPORT
          </button>
        </div>

        <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between mb-3 gap-2">
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: 14, color: "#444" }}>Items per page:</span>
            <select className="items-select" value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}>
              {[10, 25, 50, 100].map((count) => <option key={count}>{count}</option>)}
            </select>
          </div>
          <span style={{ fontSize: 14, color: "#444" }}>Total Reports: {filtered.length}</span>
        </div>

        <div className="d-flex mb-3">
          <div className="search-wrapper" style={{ flex: 1 }}>
            <span className="search-icon">
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </span>
            <input
              className="search-box"
              placeholder="Find a Report"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-responsive" style={{ borderRadius: "4px" }}>
          <div className="report-table slide-down">
            <table className="table mb-0 report-table" style={{ minWidth: "780px" }}>
              <thead>
                <tr>
                  <th style={{ width: 48 }}>
                    <input type="checkbox" className="header-checkbox" checked={allChecked} onChange={toggleAll} />
                  </th>
                  {[
                    { col: "name", label: "REPORT NAME" },
                    { col: "type", label: "REPORT TYPE" },
                    { col: "courseName", label: "COURSE" },
                    { col: "dateCreated", label: "DATE CREATED" },
                    // { col: "lastRerunAt", label: "LAST RERUN" },
                  ].map(({ col, label }) => (
                    <th key={col} onClick={() => handleSort(col)} className={sortCol === col ? "active" : ""}>
                      {label} <SortIcon col={col} />
                    </th>
                  ))}
                  <th style={{ width: 40, textAlign: "center" }}>
                    <button className="col-icon-btn">⊞</button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-4">Loading reports...</td>
                  </tr>
                ) : displayed.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-4">No reports found.</td>
                  </tr>
                ) : (
                  displayed.map((report) => (
                    <tr key={report.id}>
                      <td>
                        <input
                          type="checkbox"
                          className="row-checkbox"
                          checked={selectedIds.includes(report.id)}
                          onChange={() => toggleOne(report.id)}
                        />
                      </td>
                      <td>
                        <a
                          href="#"
                          className="report-link"
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(`/reports/${report.id}`);
                          }}
                        >
                          {report.name}
                        </a>
                      </td>
                      <td>{report.type}</td>
                      <td>{report.courseName || "-"}</td>
                      <td>{report.dateCreated || "-"}</td>
                      {/* <td>{report.lastRerunAt ? new Date(report.lastRerunAt).toLocaleString() : "Never rerun"}</td> */}
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          style={{ fontSize: "11px", fontWeight: 600, padding: "4px 10px" }}
                          onClick={() => navigate(`/reports/${report.id}`)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="d-flex justify-content-center align-items-center mt-4 gap-2">
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={effectiveCurrentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, Math.min(page, totalPages) - 1))}
              style={{ fontSize: "12px", border: "1px solid #ccc" }}
            >
              Previous
            </button>
            <span style={{ fontSize: "13px", color: "#555", fontWeight: 500, margin: "0 8px" }}>
              Page {effectiveCurrentPage} of {totalPages}
            </span>
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={effectiveCurrentPage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, Math.min(page, totalPages) + 1))}
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
