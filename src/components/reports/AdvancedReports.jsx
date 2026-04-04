import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Plus, FileText, Calendar, ChevronRight, 
  ChevronLeft, ArrowUpDown, Filter, MoreVertical, Eye,
  BarChart2, UserCheck
} from "lucide-react";
import Layout from "../shared/Layout";

const API_BASE = "http://localhost:5000";

export default function AdvancedReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortCol, setSortCol] = useState("dateCreated");
  const [sortDir, setSortDir] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchReports = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/saved-reports`, { cache: "no-store" });
        const json = await res.json();
        if (!cancelled && json.success) setReports(json.data);
      } catch {
        if (!cancelled) setReports([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchReports();
    return () => { cancelled = true; };
  }, []);

  const filtered = reports.filter((report) =>
    report.name.toLowerCase().includes(search.toLowerCase()),
  );

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let first = a[sortCol] || "";
      let second = b[sortCol] || "";
      if (typeof first === "string") {
        first = first.toLowerCase();
        second = second.toLowerCase();
      }
      return first < second ? (sortDir === "asc" ? -1 : 1) : first > second ? (sortDir === "asc" ? 1 : -1) : 0;
    });
  }, [filtered, sortCol, sortDir]);

  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  const effectiveCurrentPage = Math.min(currentPage, totalPages);
  const displayed = sorted.slice(
    (effectiveCurrentPage - 1) * itemsPerPage,
    effectiveCurrentPage * itemsPerPage,
  );

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
      return;
    }
    setSortCol(col);
    setSortDir("asc");
  };

  return (
    <Layout>
      <div className="container-fluid py-4 px-md-5 fade-in">
        {/* Dashboard Header */}
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
          <div>
            <h1 className="h4 fw-bold mb-1 text-main">Advanced Reports</h1>
            <p className="text-soft mb-0" style={{ fontSize: '14px' }}>
              View and manage your saved report snapshots.
            </p>
          </div>
          <button className="btn-premium btn-accent shadow-sm py-2 px-4 d-flex align-items-center gap-2" onClick={() => navigate("/reports/new")}>
            <Plus size={18} /> CREATE NEW REPORT
          </button>
        </div>

        {/* Search Row */}
        <div className="glass-card p-3 mb-4 d-flex flex-column flex-md-row align-items-md-center gap-3">
          <div className="position-relative flex-grow-1">
            <Search className="position-absolute translate-middle-y top-50 start-0 ms-3 text-soft" size={16} />
            <input
              type="text"
              className="form-control ps-5 py-2"
              placeholder="Quick search reports..."
              style={{ borderRadius: '6px', fontSize: '14px', border: '1px solid #e2e8f0', background: '#fcfcfc' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="d-flex align-items-center gap-2 text-soft px-2" style={{ fontSize: '13px', fontWeight: 500 }}>
             <Filter size={16} />
             <span>Total: {filtered.length}</span>
          </div>
        </div>

        {/* Reports Table Card */}
        <div className="glass-card overflow-hidden shadow-sm">
          <div className="table-responsive">
            <table className="premium-table mb-0">
              <thead>
                <tr>
                  <th onClick={() => handleSort("name")} style={{ cursor: 'pointer' }}>
                    <div className="d-flex align-items-center gap-2">
                      REPORT NAME <ArrowUpDown size={12} className="text-soft" />
                    </div>
                  </th>
                  <th onClick={() => handleSort("type")} style={{ cursor: 'pointer' }}>
                    <div className="d-flex align-items-center gap-2">
                      TYPE <ArrowUpDown size={12} className="text-soft" />
                    </div>
                  </th>
                  <th onClick={() => handleSort("courseName")} style={{ cursor: 'pointer' }}>
                    <div className="d-flex align-items-center gap-2">
                      COURSE <ArrowUpDown size={12} className="text-soft" />
                    </div>
                  </th>
                  <th onClick={() => handleSort("dateCreated")} style={{ cursor: 'pointer' }}>
                    <div className="d-flex align-items-center gap-2">
                      CREATED <ArrowUpDown size={12} className="text-soft" />
                    </div>
                  </th>
                  <th />
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {loading ? (
                    <tr><td colSpan={5} className="text-center py-5 text-soft">Loading snapshots...</td></tr>
                  ) : displayed.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-5 text-soft">No reports matches your search.</td></tr>
                  ) : displayed.map((report, idx) => (
                    <motion.tr
                      key={report.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => navigate(`/reports/${report.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                         <div className="d-flex align-items-center gap-3">
                            <div className="p-2 rounded-2 bg-light text-primary">
                               {report.type === "Student Performance" ? <UserCheck size={16} /> : <BarChart2 size={16} />}
                            </div>
                            <span className="fw-bold text-main">{report.name}</span>
                         </div>
                      </td>
                      <td>
                        <span className="badge-success px-3" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>
                           {report.type}
                        </span>
                      </td>
                      <td className="text-soft">{report.courseName || "Multiple Courses"}</td>
                      <td className="text-soft">
                         <div className="d-flex align-items-center gap-2">
                            <Calendar size={14} />
                            {report.dateCreated || "-"}
                         </div>
                      </td>
                      <td className="text-end">
                        <button className="btn-icon">
                          <Eye size={18} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-4 border-top d-flex justify-content-between align-items-center bg-light bg-opacity-10">
              <div className="text-soft d-none d-sm-block" style={{ fontSize: '13px' }}>
                Showing <strong>{displayed.length}</strong> of <strong>{filtered.length}</strong> snapshots
              </div>
              <div className="d-flex gap-2 align-items-center">
                <button
                  className="btn-premium py-1 px-3"
                  disabled={effectiveCurrentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={16} /> Prev
                </button>
                <div className="px-3 fw-bold text-main" style={{ fontSize: '14px' }}>
                  {effectiveCurrentPage} / {totalPages}
                </div>
                <button
                  className="btn-premium py-1 px-3"
                  disabled={effectiveCurrentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
