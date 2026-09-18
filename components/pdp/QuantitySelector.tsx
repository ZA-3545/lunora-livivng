"use client";

type QuantitySelectorProps = {
  value: number;
  onChange: (value: number) => void;
};

export function QuantitySelector({ value, onChange }: QuantitySelectorProps) {
  return (
    <div className="qty">
      <button
        type="button"
        className="btn-outline qty-btn"
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        −
      </button>
      <span className="qty-value" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="btn-outline qty-btn"
        aria-label="Increase quantity"
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}
