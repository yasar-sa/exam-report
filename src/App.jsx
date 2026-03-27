import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AdvancedReportsPage from "./components/reports/AdvancedReports";
import CategoryPerformanceReport from "./components/reports/CategoryPerformanceReport";
import SavedReportPage from "./components/reports/SavedReportPage";
import SelectReportType from "./components/reports/SelectReportType";
import StudentCategoryPerformanceReport from "./components/reports/StudentCategoryPerformanceReport";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdvancedReportsPage />} />
        <Route path="/reports/new" element={<SelectReportType />} />
        <Route path="/reports/new/course" element={<CategoryPerformanceReport />} />
        <Route path="/reports/new/student" element={<StudentCategoryPerformanceReport />} />
        <Route path="/reports/:id" element={<SavedReportPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
