import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <>
      <style>{`
        /* ── Base ── */
        body { background: #f0f0f0; margin: 0; font-family: 'Segoe UI', sans-serif; }

        /* ── Navbar ── */
        .examsoft-navbar {
          background: #1a73c1; height: 56px;
          display: flex; align-items: center; padding: 0 24px; gap: 16px;
        }
        .examsoft-logo {
          display: flex; align-items: center; gap: 8px;
          color: white; font-weight: 700; font-size: 18px; letter-spacing: -0.3px;
        }
        .examsoft-logo svg { width: 32px; height: 32px; }
        .nav-divider { width: 1px; height: 32px; background: rgba(255,255,255,0.35); margin: 0 8px; }
        .nav-title { color: white; font-size: 14px; font-weight: 600; }
        .nav-subtitle { color: rgba(255,255,255,0.75); font-size: 11px; }
        .nav-right { margin-left: auto; display: flex; align-items: center; gap: 12px; color: white; font-size: 14px; }
        .nav-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: rgba(255,255,255,0.2);
          display: flex; align-items: center; justify-content: center;
          border: 1.5px solid rgba(255,255,255,0.5);
        }

        /* ── Sub-header (used in report form screens) ── */
        .sub-header {
          background: #f0f0f0;
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 28px;
          border-bottom: 1px solid #ddd;
        }

        /* ── Back link ── */
        .back-link {
          display: inline-flex; align-items: center; gap: 6px;
          color: #1a73c1; font-size: 12px; font-weight: 700;
          letter-spacing: 0.5px; text-transform: uppercase;
          cursor: pointer; border: none; background: none; padding: 0;
          text-decoration: none;
        }
        .back-link:hover { text-decoration: underline; color: #1558a0; }

        /* ── Buttons ── */
        .btn-create {
          background: #2e7d32; color: white; border: none;
          border-radius: 4px; padding: 10px 20px; font-size: 13px;
          font-weight: 600; letter-spacing: 0.5px; cursor: pointer; white-space: nowrap;
        }
        .btn-create:hover { background: #276128; }

        .btn-generate {
          background: #e0e0e0; color: #999; border: none;
          border-radius: 3px; padding: 10px 22px;
          font-size: 12px; font-weight: 700; letter-spacing: 0.6px;
          text-transform: uppercase; cursor: not-allowed;
        }
        .btn-generate.active { background: #2e7d32; color: white; cursor: pointer; }
        .btn-generate.active:hover { background: #276128; }

        .btn-select {
          border: 1.5px solid #1a73c1; background: white; color: #1a73c1;
          font-size: 12px; font-weight: 700; letter-spacing: 0.8px;
          padding: 8px 24px; border-radius: 3px; cursor: pointer;
          text-transform: uppercase; align-self: flex-start;
          transition: background 0.15s, color 0.15s;
        }
        .btn-select:hover { background: #1a73c1; color: white; }

        .btn-add-category {
          width: 100%; border: 1.5px solid #1a73c1; border-radius: 3px;
          padding: 11px; font-size: 13px; font-weight: 600; color: #1a73c1;
          background: white; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          transition: background 0.15s;
        }
        .btn-add-category:hover { background: #eaf2fb; }

        .btn-student-groups {
          border: 1.5px solid #1a73c1; border-radius: 3px;
          padding: 8px 18px; font-size: 11px; font-weight: 700;
          letter-spacing: 0.6px; color: #1a73c1; background: white;
          cursor: pointer; text-transform: uppercase; transition: background 0.15s;
        }
        .btn-student-groups:hover { background: #eaf2fb; }

        /* ── Form card (report create screens) ── */
        .form-card {
          background: white; margin: 24px 28px; border-radius: 3px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08); overflow: hidden;
        }
        .form-card-title {
          text-align: center; padding: 20px;
          font-size: 16px; font-weight: 700; color: #222;
          border-bottom: 1px solid #e8e8e8;
        }
        .form-body { padding: 32px 40px 40px; }

        /* ── Form fields ── */
        .field-label {
          font-size: 11px; font-weight: 700; letter-spacing: 0.6px;
          text-transform: uppercase; color: #333; margin-bottom: 6px;
        }
        .field-label .optional {
          color: #e8a020; font-style: italic; font-weight: 400;
          text-transform: none; font-size: 11px;
        }
        .text-input {
          width: 100%; border: 1px solid #ccc; border-radius: 3px;
          padding: 10px 12px; font-size: 14px; color: #333; outline: none;
          transition: border-color 0.2s;
        }
        .text-input::placeholder { color: #aaa; font-style: italic; }
        .text-input:focus { border-color: #1a73c1; }
        .date-wrapper { position: relative; }
        .date-wrapper .text-input { padding-right: 38px; }
        .date-icon {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          color: #888; cursor: pointer;
        }
        .dept-select {
          width: 100%; border: 1px solid #ccc; border-radius: 3px;
          padding: 10px 12px; font-size: 14px; color: #555;
          background: white; appearance: auto; outline: none;
          transition: border-color 0.2s; cursor: pointer;
        }
        .dept-select:focus { border-color: #1a73c1; }
        .categories-hint {
          font-size: 12.5px; color: #555; font-style: italic;
          line-height: 1.5; margin-bottom: 10px;
        }
        .col-divider {
          width: 1px; background: #e0e0e0; margin: 0 32px;
          flex-shrink: 0; align-self: stretch;
        }

        /* ── Right column (assessment / threshold) ── */
        .section-title-right {
          font-size: 11.5px; font-weight: 700; letter-spacing: 0.5px;
          text-transform: uppercase; color: #333;
          display: flex; align-items: center; gap: 8px; margin-bottom: 4px;
        }
        .section-title-right .optional {
          color: #e8a020; font-style: italic; font-weight: 400;
          text-transform: none; font-size: 11px;
        }
        .section-desc { font-size: 13px; color: #444; margin-bottom: 14px; }
        .checkbox-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .checkbox-row input[type="checkbox"] { width: 16px; height: 16px; accent-color: #1a73c1; cursor: pointer; }
        .checkbox-row label { font-size: 14px; color: #333; cursor: pointer; margin: 0; }
        .threshold-section { margin-top: 28px; }
        .threshold-title {
          font-size: 11.5px; font-weight: 700; letter-spacing: 0.5px;
          text-transform: uppercase; color: #333;
          display: flex; align-items: center; gap: 8px; margin-bottom: 4px;
        }
        .threshold-title .optional {
          color: #e8a020; font-style: italic; font-weight: 400;
          text-transform: none; font-size: 11px;
        }
        .threshold-desc { font-size: 13px; color: #444; margin-bottom: 20px; }
        .slider-label { font-size: 14px; color: #333; margin-bottom: 4px; }
        .slider-ticks {
          display: flex; justify-content: space-between;
          font-size: 11px; color: #666; margin-bottom: 2px; padding: 0 2px;
        }
        .custom-slider { width: 100%; accent-color: #888; height: 4px; cursor: pointer; }
        .slider-number-input {
          border: 1px solid #ccc; border-radius: 3px;
          padding: 7px 10px; font-size: 14px; width: 80px;
          text-align: center; outline: none; transition: border-color 0.2s;
        }
        .slider-number-input:focus { border-color: #1a73c1; }
      `}</style>
      <Navbar />
      {children}
    </>
  );
}
