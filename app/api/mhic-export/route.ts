import { NextResponse } from "next/server";

export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Data source notes (as of March 2026)
// ---------------------------------------------------------------------------
// Maryland Open Data Portal scan results — confirmed NOT MHIC licensee data:
//   gfzb-gya9  "HomeData"   → Maryland property assessment (SDAT fields)
//   aid9-z2x4  "HomeData3"  → Same property assessment data
//   ps4k-bheb               → 404
//   gdzy-2fen  "PLC Data Catalog" → Licensing program metadata, not records
//   ipcm-ikyx               → was a guess; no longer exists
//
// DLLR CGI (dllr.state.md.us ElectronicLicensing):
//   HIC::HIC_location_pq  (zip search)    → broken server-side
//   HIC::HIC_company_pq   (name search)   → broken server-side
//   MHIC::MHIC_personal_info              → untested; probe with ?debug=1&mode=cgi-scan
//   ALL::ALL_personal_name                → untested; broad search across all boards
//
// Next steps if none of the above work:
//   1. File an MPIA (Public Records) request with DLLR for a bulk CSV
//   2. Use the local script: node scripts/pull-md-contractors.mjs
// ---------------------------------------------------------------------------

const MHIC_CGI =
  "https://www.dllr.state.md.us/cgi-bin/ElectronicLicensing/OP_search/OP_search.cgi";

// CGI calling_apps to scan for a working MHIC endpoint
const CGI_PROBES = [
  { label: "MHIC personal info",  params: { calling_app: "MHIC::MHIC_personal_info" } },
  { label: "HIC qselect",         params: { calling_app: "HIC::HIC_qselect" } },
  { label: "ALL personal name",   params: { calling_app: "ALL::ALL_personal_name" } },
];

function parseMHIC(html: string) {
  const contractors: any[] = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  const strip = (s: string) =>
    s.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();

  let rowMatch;
  let rowCount = 0;
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const cells: string[] = [];
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) cells.push(strip(cellMatch[1]));
    if (cells.length >= 5 && rowCount > 0 && !/license/i.test(cells[0])) {
      contractors.push({
        license: cells[0], name: cells[1], trade_name: cells[2],
        city: cells[3], county: cells[4], status: cells[5] || "",
      });
    }
    rowCount++;
  }
  return contractors;
}

function toCSV(rows: ReturnType<typeof parseMHIC>): string {
  const header = "License,Name,Trade Name,City,County,Status";
  const escape = (v: string) => `"${(v || "").replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [r.license, r.name, r.trade_name, r.city, r.county, r.status].map(escape).join(",")
  );
  return [header, ...lines].join("\r\n");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  if (searchParams.get("debug") === "1") {
    const mode = searchParams.get("mode") || "cgi-scan";

    // ?debug=1&mode=cgi-scan — probe all CGI calling_apps and return status + snippet
    if (mode === "cgi-scan") {
      const results: any[] = [];
      for (const probe of CGI_PROBES) {
        try {
          const qs = new URLSearchParams(probe.params as Record<string, string>).toString();
          const res = await fetch(`${MHIC_CGI}?${qs}`, {
            headers: { "User-Agent": "Mozilla/5.0" },
            signal: AbortSignal.timeout(12000),
          });
          const text = await res.text();
          const hasForm = /<form/i.test(text);
          const hasTable = /<table/i.test(text);
          const hasError = /error|not found|unavailable|maintenance/i.test(text);
          results.push({
            label: probe.label,
            calling_app: (probe.params as any).calling_app,
            status: res.status,
            hasForm,
            hasTable,
            hasError,
            snippet: text.slice(0, 300).replace(/\s+/g, " "),
          });
        } catch (e: any) {
          results.push({ label: probe.label, error: e.message });
        }
      }
      return NextResponse.json(results, { status: 200 });
    }

    // ?debug=1&mode=cgi-raw&app=HIC::HIC_qselect — raw HTML from a specific calling_app
    if (mode === "cgi-raw") {
      const app = searchParams.get("app") || "HIC::HIC_qselect";
      const res = await fetch(`${MHIC_CGI}?calling_app=${encodeURIComponent(app)}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(12000),
      });
      const html = await res.text();
      return new NextResponse(`<!-- status: ${res.status} calling_app: ${app} -->\n${html}`, {
        headers: { "Content-Type": "text/html" },
      });
    }

    // ?debug=1&mode=hic-search&field=zip_code&value=21201 — POST to HIC search
    if (mode === "hic-search") {
      const field = searchParams.get("field") || "zip_code";
      const value = searchParams.get("value") || "21201";
      // Try different calling_app variants for the location/zip search
      const apps = ["HIC::HIC_location_pq", "HIC::HIC_zip_pq", "HIC::HIC_personal_pq"];
      const results: any[] = [];
      for (const app of apps) {
        const body = new URLSearchParams({ calling_app: app, [field]: value, search_type: field === "zip_code" ? "ZIP" : "NAME" }).toString();
        const res = await fetch(MHIC_CGI, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "Mozilla/5.0" },
          body,
          signal: AbortSignal.timeout(10000),
        });
        const text = await res.text();
        const hasError = /error|can't locate|not found|unavailable/i.test(text.slice(0, 500));
        const hasTable = /<table/i.test(text);
        const rowCount = (text.match(/<tr/gi) || []).length;
        results.push({ app, status: res.status, hasError, hasTable, rowCount, snippet: text.slice(0, 400).replace(/\s+/g, " ") });
      }
      return NextResponse.json(results, { status: 200 });
    }

    // ?debug=1&mode=company&term=Smith — POST company name search
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
      return new NextResponse(`<!-- status: ${res.status} -->\n${html}`, {
        headers: { "Content-Type": "text/html" },
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Main export — attempt CGI zip-based scrape across all Maryland zip codes
  // ---------------------------------------------------------------------------
  const MD_ZIPS = [
    "21201","21202","21205","21210","21211","21215","21218","21224","21229","21230",
    "21222","21228","21234","21236","21237","21244",
    "21401","21403","21061","21122","21146",
    "20814","20850","20902","20906","20910",
    "20740","20743","20745","20770","20772",
    "21042","21044","21045",
    "21701","21702","21703",
    "21014","21015","21078",
    "21157","21158",
    "21740","21742",
    "21502","21550","21921","21620","21666",
    "21601","21629","21613","21801","21804","21842","21811",
    "20678","20646","20601","20650",
  ];

  try {
    const seen = new Set<string>();
    const all: any[] = [];

    const queryZip = async (zip: string) => {
      const body = new URLSearchParams({
        calling_app: "HIC::HIC_location_pq",
        zip_code: zip,
        search_type: "ZIP",
      }).toString();
      const res = await fetch(MHIC_CGI, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "Mozilla/5.0" },
        body,
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) return [];
      return parseMHIC(await res.text());
    };

    // Batch 5 at a time to avoid hammering the server
    for (let i = 0; i < MD_ZIPS.length; i += 5) {
      const batch = MD_ZIPS.slice(i, i + 5);
      const results = await Promise.all(batch.map(queryZip));
      for (const contractors of results) {
        for (const c of contractors) {
          if (c.license && !seen.has(c.license)) {
            seen.add(c.license);
            all.push(c);
          }
        }
      }
    }

    if (all.length === 0) {
      return NextResponse.json(
        {
          error: "No contractor data returned. The MHIC CGI search modules appear to be offline.",
          hint: "Use ?debug=1&mode=cgi-scan to check which endpoints respond, or run scripts/pull-md-contractors.mjs locally.",
        },
        { status: 502 }
      );
    }

    const csv = toCSV(all);
    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="maryland-contractors-${date}.csv"`,
        "X-Contractor-Count": String(all.length),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Export failed" }, { status: 500 });
  }
}
