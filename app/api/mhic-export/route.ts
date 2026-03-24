import { NextResponse } from "next/server";

export const maxDuration = 60;

// Maryland MHIC licensee data via the Maryland Open Data Portal (Socrata).
// Dataset candidates (try ?debug=1&mode=scan to identify the live one):
//   gfzb-gya9  "HomeData"  (Business & Economy category — most likely MHIC)
//   aid9-z2x4  "HomeData3"
//   ipcm-ikyx  original guess — confirmed 404
//   ps4k-bheb  secondary guess
//   gdzy-2fen  "PLC Data Catalog" (all professional licenses)
const SOCRATA_BASE = "https://opendata.maryland.gov/resource";
const DATASET_IDS = ["gfzb-gya9", "aid9-z2x4", "ps4k-bheb", "gdzy-2fen"];
const SOCRATA_LIMIT = 50000;

// CGI fallback — broken as of March 2026 but kept for reference
const MHIC_CGI =
  "https://www.dllr.state.md.us/cgi-bin/ElectronicLicensing/OP_search/OP_search.cgi";

async function fetchSocrataAll(datasetId: string): Promise<any[] | null> {
  const url = `${SOCRATA_BASE}/${datasetId}.json?$limit=${SOCRATA_LIMIT}&$offset=0`;
  const res = await fetch(url, {
    headers: { "Accept": "application/json" },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  return data;
}

function socrataToRow(r: any) {
  return {
    license:     r.license_number  || r.licensenum   || r.license      || "",
    name:        r.licensee_name   || r.name          || r.full_name    || "",
    trade_name:  r.business_name   || r.trade_name    || r.tradename    || "",
    city:        r.city            || "",
    county:      r.county          || "",
    status:      r.license_status  || r.status        || "",
    expiration:  r.expiration_date || r.exp_date      || "",
  };
}

function toCSV(rows: ReturnType<typeof socrataToRow>[]): string {
  const header = "License,Name,Trade Name,City,County,Status,Expiration";
  const escape = (v: string) => `"${(v || "").replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [r.license, r.name, r.trade_name, r.city, r.county, r.status, r.expiration]
      .map(escape)
      .join(",")
  );
  return [header, ...lines].join("\r\n");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Debug: probe the Socrata dataset or CGI
  if (searchParams.get("debug") === "1") {
    const mode = searchParams.get("mode") || "socrata";

    // ?debug=1&mode=scan  — probe all candidate IDs and return a status report
    if (mode === "scan") {
      const results: any[] = [];
      for (const id of DATASET_IDS) {
        try {
          const url = `${SOCRATA_BASE}/${id}.json?$limit=2`;
          const res = await fetch(url, { headers: { "Accept": "application/json" }, signal: AbortSignal.timeout(10000) });
          const body = await res.text();
          let preview: any = null;
          try { preview = JSON.parse(body); } catch {}
          const keys = Array.isArray(preview) && preview[0] ? Object.keys(preview[0]) : null;
          results.push({ id, status: res.status, rows: Array.isArray(preview) ? preview.length : null, fields: keys });
        } catch (e: any) {
          results.push({ id, error: e.message });
        }
      }
      return NextResponse.json(results, { status: 200 });
    }

    if (mode === "socrata") {
      const id = searchParams.get("id") || DATASET_IDS[0];
      const url = `${SOCRATA_BASE}/${id}.json?$limit=5`;
      const res = await fetch(url, { headers: { "Accept": "application/json" }, signal: AbortSignal.timeout(12000) });
      const body = await res.text();
      return new NextResponse(`<!-- status: ${res.status} dataset: ${id} -->\n${body}`, {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (mode === "qselect") {
      const res = await fetch(`${MHIC_CGI}?calling_app=HIC::HIC_qselect`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(12000),
      });
      const html = await res.text();
      return new NextResponse(`<!-- status: ${res.status} -->\n${html}`, { headers: { "Content-Type": "text/html" } });
    }

    if (mode === "company") {
      const term = searchParams.get("term") || "Smith";
      const body = new URLSearchParams({ calling_app: "HIC::HIC_company_pq", trade_name: term }).toString();
      const res = await fetch(MHIC_CGI, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "Mozilla/5.0" },
        body,
        signal: AbortSignal.timeout(12000),
      });
      const html = await res.text();
      return new NextResponse(`<!-- status: ${res.status} -->\n${html}`, { headers: { "Content-Type": "text/html" } });
    }
  }

  try {
    // Try each known dataset ID
    let rows: ReturnType<typeof socrataToRow>[] = [];
    for (const id of DATASET_IDS) {
      const data = await fetchSocrataAll(id);
      if (data && data.length > 0) {
        rows = data.map(socrataToRow);
        break;
      }
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Maryland open data portal did not return contractor data. Dataset may have moved." },
        { status: 502 }
      );
    }

    const csv = toCSV(rows);
    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="maryland-contractors-${date}.csv"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Export failed" }, { status: 500 });
  }
}
