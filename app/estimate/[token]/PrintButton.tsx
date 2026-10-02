"use client";
// Client island: the estimate page is a Server Component, which can't pass onClick handlers
// (that threw "Event handlers cannot be passed to Client Component props" → 500 for every real estimate).
export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{ padding: "10px 28px", background: "#F1F5F9", color: "#374151", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
    >
      🖨️ Print / Save as PDF
    </button>
  );
}
