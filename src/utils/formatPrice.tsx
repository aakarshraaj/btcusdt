export function formatPriceSafe(value?: number | null): string {
  if (value == null || !isFinite(value) || value <= 0) return "0.00";
  return value.toFixed(2);
}

/**
 * Split price into 3 display segments used by the 3-block UI:
 * left = leading digits (everything before last 3)
 * middle = last-3 or full integer when <=3 digits
 * right = decimal including dot (".00")
 */
export function splitPriceParts(value?: number | null) {
  if (value == null || !isFinite(value)) return { left: "", middle: "", right: ".00" };
  const s = formatPriceSafe(value);
  const [intPart, decPart = "00"] = s.split(".");
  if (intPart.length > 3) {
    return {
      left: intPart.slice(0, -3),
      middle: intPart.slice(-3),
      right: `.${decPart}`,
    };
  }
  return { left: "", middle: intPart, right: `.${decPart}` };
}