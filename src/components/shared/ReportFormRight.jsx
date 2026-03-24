import { useState } from "react";
import SliderWithInput from "./SliderWithInput";

export default function ReportFormRight({ sliders }) {
  // sliders: array of { label, stateKey } — parent controls values via props if needed
  // For simplicity each instance manages its own slider state here
  const [assessmentTypes, setAssessmentTypes] = useState({
    Exam: true,
    Quiz: true,
    Assignment: true,
  });

  const [sliderValues, setSliderValues] = useState(
    Object.fromEntries(sliders.map((s) => [s.stateKey, 70]))
  );

  const toggleAssessment = (type) => {
    setAssessmentTypes((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const handleSlider = (key, val) => {
    setSliderValues((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div style={{ flex: 1 }}>

      {/* Assessment Types */}
      <div className="mb-2">
        <div className="section-title-right">
          ASSESSMENT TYPES <span className="optional">(Optional)</span>
        </div>
        <div className="section-desc">
          Select assessment types to be included in the final report.
        </div>
        {["Exam", "Quiz", "Assignment"].map((type) => (
          <div className="checkbox-row" key={type}>
            <input
              type="checkbox"
              id={`assess-${type}`}
              checked={assessmentTypes[type]}
              onChange={() => toggleAssessment(type)}
            />
            <label htmlFor={`assess-${type}`}>{type}</label>
          </div>
        ))}
      </div>

      {/* Threshold sliders */}
      <div className="threshold-section">
        <div className="threshold-title">
          CATEGORY AT RISK THRESHOLD <span className="optional">(Optional)</span>
        </div>
        <div className="threshold-desc">
          Determine what constitutes an at risk category to show up in the report
        </div>
        {sliders.map((s) => (
          <SliderWithInput
            key={s.stateKey}
            label={s.label}
            value={sliderValues[s.stateKey]}
            onChange={(val) => handleSlider(s.stateKey, val)}
          />
        ))}
      </div>

    </div>
  );
}
