import { useEffect, useState } from "react";
import SliderWithInput from "./SliderWithInput";

export default function ReportFormRight({ sliders, onValuesChange }) {
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

  useEffect(() => {
    if (typeof onValuesChange !== "function") return;
    onValuesChange({ assessmentTypes, sliderValues });
  }, [assessmentTypes, sliderValues, onValuesChange]);

  return (
    <div style={{ flex: 1 }}>



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
