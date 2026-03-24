import { useState } from "react";
import Layout from "../shared/Layout";
import ReportFormShell from "../shared/ReportFormShell";
import ReportFormLeft from "../shared/ReportFormLeft";
import ReportFormRight from "../shared/ReportFormRight";

const SLIDERS = [
  { label: "Needs Review Threshold",    stateKey: "needsReview" },
  { label: "Category At Risk Threshold", stateKey: "categoryAtRisk" },
];

export default function CategoryPerformanceReport({ onBack }) {
  const [reportName, setReportName] = useState("");
  const [startDate,  setStartDate]  = useState("");
  const [endDate,    setEndDate]    = useState("");
  const [department, setDepartment] = useState("");

  return (
    <Layout>
      <ReportFormShell
        title="Category Performance Report"
        reportName={reportName}
        onBack={onBack}
      >
        <div className="d-flex">
          <ReportFormLeft
            reportName={reportName} setReportName={setReportName}
            startDate={startDate}   setStartDate={setStartDate}
            endDate={endDate}       setEndDate={setEndDate}
            department={department} setDepartment={setDepartment}
          />
          <div className="col-divider" />
          <ReportFormRight sliders={SLIDERS} />
        </div>
      </ReportFormShell>
    </Layout>
  );
}
