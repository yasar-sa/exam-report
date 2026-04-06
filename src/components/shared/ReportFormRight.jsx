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

  const updateSlider = (key, value) => {
    if (typeof onValuesChange !== "function") return;

    onValuesChange({
      sliderValues: {
        ...nextSliderValues,
        [key]: value,
      },
    });
  };

  return (
    <div style={{ flex: 1 }}>
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
