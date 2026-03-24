const CalendarIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

export default function ReportFormLeft({
  reportName, setReportName,
  startDate, setStartDate,
  endDate, setEndDate,
  department, setDepartment,
  children, // slot for extra fields below categories
}) {
  return (
    <div style={{ flex: 1 }}>

      {/* Report Name */}
      <div className="mb-4">
        <div className="field-label">REPORT NAME</div>
        <input
          type="text"
          className="text-input"
          placeholder="Enter a name or title for this report"
          value={reportName}
          onChange={(e) => setReportName(e.target.value)}
        />
      </div>

      {/* Date Range */}
      <div className="mb-4">
        <div className="field-label">DATE RANGE</div>
        <div className="d-flex gap-3">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: "#444", marginBottom: 4 }}>Start Date</div>
            <div className="date-wrapper">
              <input
                type="text"
                className="text-input"
                placeholder="ex: 12/10/2017"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span className="date-icon"><CalendarIcon /></span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: "#444", marginBottom: 4 }}>End Date</div>
            <div className="date-wrapper">
              <input
                type="text"
                className="text-input"
                placeholder="ex: 12/10/2017"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <span className="date-icon"><CalendarIcon /></span>
            </div>
          </div>
        </div>
      </div>

      {/* Department */}
      <div className="mb-4">
        <div className="field-label">DEPARTMENT</div>
        <select
          className="dept-select"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          <option value="">Select a Department</option>
          <option value="jamia">Jamia Darussalam</option>
        </select>
      </div>

      {/* Categories */}
      <div className="mb-4">
        <div className="field-label">CATEGORIES</div>
        <div className="categories-hint">
          These are predefined reportable tags which are set at the institution and department level.
        </div>
        <button className="btn-add-category">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Category
        </button>
      </div>

      {/* Student Groups */}
      <div className="mb-2">
        <div className="field-label">
          STUDENT GROUPS <span className="optional">(Optional)</span>
        </div>
        <button className="btn-student-groups">STUDENT GROUPS</button>
      </div>

      {/* Any extra fields passed from parent */}
      {children}
    </div>
  );
}
