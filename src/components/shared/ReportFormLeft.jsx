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
  courses,
  courseId,
  setCourseId,
  department,
  setDepartment,
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
        <div className="d-flex flex-column flex-sm-row gap-3">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: "#444", marginBottom: 4 }}>Start Date</div>
            <div className="date-wrapper">
              <input
                type="date"
                className="text-input"
                style={{ height: '38px', paddingRight: '10px' }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: "#444", marginBottom: 4 }}>End Date</div>
            <div className="date-wrapper">
              <input
                type="date"
                className="text-input"
                style={{ height: '38px', paddingRight: '10px' }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Course OR Department (fallback) */}
      <div className="mb-4">
        {Array.isArray(courses) && courses.length > 0 && setCourseId ? (
          <>
            <div className="field-label">COURSE</div>
            <select
              className="dept-select"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
            >
              <option value="">Select a Course</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </>
        ) : (
          <>
            <div className="field-label">DEPARTMENT</div>
            <select
              className="dept-select"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="">Select a Department</option>
              <option value="jamia">Jamia Darussalam</option>
            </select>
          </>
        )}
      </div>



      {/* Any extra fields passed from parent */}
      {children}
    </div>
  );
}
