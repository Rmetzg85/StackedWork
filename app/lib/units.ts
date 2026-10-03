// Units for estimate line items. `value` is what gets saved in line_items[].unit and shown on the
// public estimate page and in the estimate email ("1 job × $1,850.00"); `label` is the dropdown text.
export const LINE_ITEM_UNITS: { value: string; label: string }[] = [
  { value: "hours", label: "hours" },
  { value: "job", label: "job (flat rate)" },
  { value: "each", label: "each" },
  { value: "sq ft", label: "sq ft" },
  { value: "linear ft", label: "linear ft" },
  { value: "days", label: "days" },
  { value: "lbs", label: "lbs" },
  { value: "bags", label: "bags" },
  { value: "gallons", label: "gallons" },
];

/**
 * Dropdown options for a line item. If the saved unit isn't one of ours (older rows, AI suggestions
 * like "lump sum"), it's kept as an extra option so editing never silently changes it to "hours".
 */
export function unitOptions(current?: string | null): { value: string; label: string }[] {
  const cur = (current ?? "").trim();
  if (!cur || LINE_ITEM_UNITS.some((u) => u.value === cur)) return LINE_ITEM_UNITS;
  return [...LINE_ITEM_UNITS, { value: cur, label: cur }];
}
