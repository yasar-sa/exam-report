export default function Navbar() {
  return (
    <div className="examsoft-navbar">
      <div className="examsoft-logo">
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="40" height="40" rx="6" fill="white" fillOpacity="0.15" />
          <path d="M8 14h24M8 20h16M8 26h20" stroke="white" strokeWidth="3" strokeLinecap="round" />
          <circle cx="30" cy="26" r="5" fill="#4fc3f7" />
        </svg>
        <span>ExamSoft</span>
      </div>
      <div className="nav-divider" />
      <div>
        <div className="nav-title">ExamSoft Trials</div>
        <div className="nav-subtitle">ID#456</div>
      </div>
      <div className="nav-right">
        <span>ADMIN</span>
        <div className="nav-avatar">
          <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
