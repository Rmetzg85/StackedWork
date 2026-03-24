import { NextResponse } from "next/server";

export const maxDuration = 60;

const MD_ZIPS = [
  // Baltimore City
  "21201","21202","21205","21210","21211","21215","21218","21224","21229","21230",
  // Baltimore County
  "21222","21228","21234","21236","21237","21244",
  // Anne Arundel
  "21401","21403","21061","21122","21146",
  // Montgomery
  "20814","20850","20902","20906","20910",
  // Prince George's
  "20740","20743","20745","20770","20772",
  // Howard
  "21042","21044","21045",
  // Frederick
  "21701","21702","21703",
  // Harford
  "21014","21015","21078",
  // Carroll
  "21157","21158",
  // Washington
  "21740","21742",
  // Allegany
  "21502",
  // Garrett
  "21550",
  // Cecil
  "21921",
  // Kent
  "21620",
  // Queen Anne's
  "21666",
  // Talbot
  "21601",
  // Caroline
  "21629",
  // Dorchester
  "21613",
  // Wicomico
  "21801","21804",
  // Worcester
  "21842","21811",
  // Calvert
  "20678",
  // Charles
  "20646","20601",
  // St. Mary's
  "20650",
];

function parseMHICResults(html: string): any[] {
  const contractors: any[] = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  const stripTags = (s: string) =>
    s.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();

  let rowMatch;
  let rowCount = 0;
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const cells: string[] = [];
    let cellMatch;
    const rowHtml = rowMatch[1];
    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      cells.push(stripTags(cellMatch[1]));
    }
    if (cells.length >= 5 && rowCount > 0 && !/license/i.test(cells[0])) {
      contractors.push({
        license: cells[0] || "",
        name: cells[1] || "",
        trade_name: cells[2] || "",
        city: cells[3] || "",
        county: cells[4] || "",
        status: cells[5] || "",
      });
    }
    rowCount++;
  }
  return contractors;
}

async function queryZip(zip: string): Promise<any[]> {
  try {
    const body = new URLSearchParams({
      calling_app: "HIC::HIC_location_pq",
      zip_code: zip,
      search_type: "ZIP",
    }).toString();

    const res = await fetch(
      "https://www.dllr.state.md.us/cgi-bin/ElectronicLicensing/OP_search/OP_search.cgi",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0",
        },
        body,
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return [];
    const html = await res.text();
    return parseMHICResults(html);
  } catch {
    return [];
  }
}

function toCSV(rows: any[]): string {
  const header = "License,Name,Trade Name,City,County,Status";
  const escape = (v: string) => `"${(v || "").replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [r.license, r.name, r.trade_name, r.city, r.county, r.status].map(escape).join(",")
  );
  return [header, ...lines].join("\r\n");
}

export async function GET() {
  try {
    const seen = new Set<string>();
    const all: any[] = [];

    const BATCH = 5;
    for (let i = 0; i < MD_ZIPS.length; i += BATCH) {
      const batch = MD_ZIPS.slice(i, i + BATCH);
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

    const csv = toCSV(all);
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
