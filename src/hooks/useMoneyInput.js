// hooks/useMoneyInput.js
import { useState } from "react";
import { formatMoneyDisplay, parseMoneyToNumber } from "../lib/money";

export default function useMoneyInput(initial = "", currency = "MXN") {
  const [raw, setRaw] = useState(initial === null ? "" : String(initial));
  const [formatted, setFormatted] = useState(
    initial
      ? formatMoneyDisplay(
          parseMoneyToNumber(initial) ?? Number(initial),
          currency
        )
      : ""
  );

  function onChange(e) {
    const v = e.target.value;
    // allow digits and dot
    if (/^[0-9]*\.?[0-9]*$/.test(v) || v === "") {
      setRaw(v);
    }
  }

  function onBlur() {
    const n = Number(raw);
    if (!isNaN(n) && raw !== "") {
      setFormatted(formatMoneyDisplay(n, currency));
    } else {
      setFormatted("");
    }
  }

  // onFocus is intentionally a no-op - keeps raw value editable without clearing
  function onFocus() {}

  function setCurrency(curr) {
    // reformat formatted if raw empty
    if (formatted) {
      const n = parseMoneyToNumber(formatted);
      setFormatted(formatMoneyDisplay(n, curr));
    }
  }

  function getNumber() {
    return (
      parseMoneyToNumber(raw) ??
      (formatted ? parseMoneyToNumber(formatted) : null)
    );
  }

  return {
    raw,
    formatted,
    onChange,
    onBlur,
    onFocus,
    setRaw,
    setFormatted,
    getNumber,
    setCurrency,
  };
}
