import PropTypes from "prop-types";

/**
 * Reusable form field component with label
 */
export default function FormField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  rows,
  min,
  max,
  step,
  className = "",
  required = false,
}) {
  const inputClass = `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${className}`;

  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows || 3}
          className={inputClass}
          required={required}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => {
            const val = type === "number" ? parseFloat(e.target.value) || 0 : e.target.value;
            onChange(val);
          }}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          className={inputClass}
          required={required}
        />
      )}
    </div>
  );
}

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  type: PropTypes.oneOf(["text", "number", "date", "url", "email", "textarea"]),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  rows: PropTypes.number,
  min: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  max: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  step: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  className: PropTypes.string,
  required: PropTypes.bool,
};
