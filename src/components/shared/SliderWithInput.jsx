export default function SliderWithInput({ label, value, onChange }) {
  return (
    <div className="mb-4">
      <div className="slider-label">{label}</div>
      <div className="slider-ticks">
        {[0, 25, 50, 75, 100].map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="custom-slider"
      />
      <div className="mt-2">
        <input
          type="number"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="slider-number-input"
        />
      </div>
    </div>
  );
}
