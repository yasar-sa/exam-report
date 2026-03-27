import SliderWithInput from "./SliderWithInput";

export default function ReportFormRight({
  sliders,
  onValuesChange,
  assessmentTypes,
  sliderValues,
}) {
  const nextAssessmentTypes = assessmentTypes || {
    Exam: true,
    Quiz: true,
    Assignment: true,
  };
  const nextSliderValues =
    sliderValues ||
    Object.fromEntries(sliders.map((slider) => [slider.stateKey, 70]));

  const updateAssessmentType = (type) => {
    if (typeof onValuesChange !== "function") return;

    onValuesChange({
      assessmentTypes: {
        ...nextAssessmentTypes,
        [type]: !nextAssessmentTypes[type],
      },
      sliderValues: nextSliderValues,
    });
  };

  const updateSlider = (key, value) => {
    if (typeof onValuesChange !== "function") return;

    onValuesChange({
      assessmentTypes: nextAssessmentTypes,
      sliderValues: {
        ...nextSliderValues,
        [key]: value,
      },
    });
  };

  return (
    <div style={{ flex: 1 }}>
      <div className="mb-4">
        <div className="threshold-title">
          ASSESSMENT TYPES <span className="optional">(Optional)</span>
        </div>
        <div className="threshold-desc">
          Choose which assessment types should be included in the report
        </div>
        <div className="d-flex flex-wrap gap-3 mt-3">
          {["Exam", "Quiz", "Assignment"].map((type) => (
            <label
              key={type}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                color: "#444",
              }}
            >
              <input
                type="checkbox"
                checked={Boolean(nextAssessmentTypes[type])}
                onChange={() => updateAssessmentType(type)}
              />
              {type}
            </label>
          ))}
        </div>
      </div>

      <div className="threshold-section">
        <div className="threshold-title">
          CATEGORY AT RISK THRESHOLD <span className="optional">(Optional)</span>
        </div>
        <div className="threshold-desc">
          Determine what constitutes an at risk category to show up in the report
        </div>
        {sliders.map((slider) => (
          <SliderWithInput
            key={slider.stateKey}
            label={slider.label}
            value={nextSliderValues[slider.stateKey]}
            onChange={(value) => updateSlider(slider.stateKey, value)}
          />
        ))}
      </div>
    </div>
  );
}
