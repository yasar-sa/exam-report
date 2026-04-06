import { useState, useMemo } from "react";
import { Search, Calendar as CalendarIcon } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function ReportFormLeft({
  reportName,
  setReportName,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  courses = [],
  courseId,
  setCourseId,
  showDateRange = true,
  dateRequired = false,
  isMultipleCourse = false,
  children,
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCourses = useMemo(() => {
    return (courses || [])
      .filter((c) => (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        const aIsSelected = isMultipleCourse
          ? Array.isArray(courseId) && courseId.includes(a._id)
          : courseId === a._id;
        const bIsSelected = isMultipleCourse
          ? Array.isArray(courseId) && courseId.includes(b._id)
          : courseId === b._id;
        if (aIsSelected && !bIsSelected) return -1;
        if (!aIsSelected && bIsSelected) return 1;
        return 0;
      });
  }, [courses, searchTerm, isMultipleCourse, courseId]);

  return (
    <div style={{ flex: 1.5 }}>
      {/* Report Name */}
      <div className="mb-4">
        <label className="field-label" style={{ color: "var(--text-soft)", fontSize: "12px", fontWeight: 600, marginBottom: "8px", display: "block" }}>
          REPORT NAME
        </label>
        <input
          type="text"
          className="text-input"
          placeholder="Enter a descriptive name..."
          value={reportName}
          onChange={(e) => setReportName(e.target.value)}
          style={{ 
            borderRadius: "10px", 
            border: "1.5px solid #e2e8f0", 
            padding: "12px 16px",
            fontSize: "15px",
            background: "#fff",
            transition: "all 0.2s"
          }}
        />
      </div>

      {/* Date Range */}
      {showDateRange && (
        <div className="mb-4">
          <label className="field-label" style={{ color: "var(--text-soft)", fontSize: "12px", fontWeight: 600, marginBottom: "8px", display: "block" }}>
            DATE RANGE {dateRequired && <span style={{ color: "#ef4444" }}>*</span>}
          </label>
          <div className="row g-3">
            <div className="col-6">
              <div style={{ position: "relative" }}>
                <DatePicker
                  selected={startDate ? new Date(startDate) : null}
                  onChange={(date) => setStartDate(date ? date.toISOString().split('T')[0] : "")}
                  className="text-input"
                  placeholderText="Start Date"
                  dateFormat="MMM d, yyyy"
                  required={dateRequired}
                  style={{ borderRadius: "10px", border: "1.5px solid #e2e8f0", paddingLeft: "40px" }}
                />
                
              </div>
            </div>
            <div className="col-6">
              <div style={{ position: "relative" }}>
                <DatePicker
                  selected={endDate ? new Date(endDate) : null}
                  onChange={(date) => setEndDate(date ? date.toISOString().split('T')[0] : "")}
                  className="text-input"
                  placeholderText="End Date"
                  dateFormat="MMM d, yyyy"
                  required={dateRequired}
                  style={{ borderRadius: "10px", border: "1.5px solid #e2e8f0", paddingLeft: "40px" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Selection */}
      <div className="mb-4">
        <label className="field-label" style={{ color: "var(--text-soft)", fontSize: "12px", fontWeight: 600, marginBottom: "8px", display: "block" }}>
          EXAM HIERARCHY {isMultipleCourse ? "(SELECT MULTIPLE)" : ""}
        </label>

        <div style={{ position: "relative", marginBottom: "12px" }}>
          <Search 
            size={18} 
            style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-soft)" }} 
          />
          <input
            type="text"
            className="text-input"
            placeholder="Search hierarchy..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              paddingLeft: "44px", 
              borderRadius: "10px", 
              border: "1.5px solid #e2e8f0",
              fontSize: "14px",
              background: "#fcfcfc"
            }}
          />
        </div>

        {isMultipleCourse ? (
          <div
            style={{
              border: "1.5px solid #e2e8f0",
              borderRadius: "12px",
              padding: "8px",
              maxHeight: "220px",
              overflowY: "auto",
              background: "#fff",
            }}
          >
            {filteredCourses.length > 0 ? (
              filteredCourses.map((c) => (
                <label
                  key={c._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  className="course-option"
                >
                  <input
                    type="checkbox"
                    checked={Array.isArray(courseId) && courseId.includes(c._id)}
                    onChange={(e) => {
                      const nextIds = e.target.checked
                        ? [...(Array.isArray(courseId) ? courseId : []), c._id]
                        : (Array.isArray(courseId) ? courseId : []).filter((id) => id !== c._id);
                      setCourseId(nextIds);
                    }}
                    style={{ width: "18px", height: "18px", accentColor: "var(--primary)" }}
                  />
                  <span style={{ fontSize: "14px", color: "var(--text-main)", fontWeight: 500 }}>{c.name}</span>
                </label>
              ))
            ) : (
              <div className="p-4 text-center text-muted" style={{ fontSize: "13px" }}>
                No hierarchies found for "{searchTerm}"
              </div>
            )}
          </div>
        ) : (
          <select
            className="dept-select"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            style={{ 
              borderRadius: "10px", 
              border: "1.5px solid #e2e8f0", 
              padding: "12px 16px",
              fontSize: "14px",
              background: "#fff",
              cursor: "pointer"
            }}
          >
            <option value="">Choose a hierarchy...</option>
            {filteredCourses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {children}
    </div>
  );
}
