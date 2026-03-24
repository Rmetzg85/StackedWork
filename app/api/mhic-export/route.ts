import { NextResponse } from "next/server";

export const maxDuration = 60;

// Maryland's HIC_location_pq (zip search) Perl module is broken on their server.
// Use HIC_personal_pq (name search) with last_name A–Z to enumerate all contractors.
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const MHIC_URL =
  "https://www.dllr.state.md.us/cgi-bin/ElectronicLicensing/OP_search/OP_search.cgi";

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

async function queryByLastName(letter: string): Promise<any[]> {
  try {
    const body = new URLSearchParams({
      calling_app: "HIC::HIC_personal_pq",
      last_name: letter,
      first_name: "",
    }).toString();

    const res = await fetch(MHIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0",
      },
      body,
      signal: AbortSignal.timeout(12000),
    });
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Debug mode: return raw HTML for a single letter search
  if (searchParams.get("debug") === "1") {
    const letter = (searchParams.get("letter") || "A").toUpperCase();
    const body = new URLSearchParams({
      calling_app: "HIC::HIC_personal_pq",
      last_name: letter,
      first_name: "",
    }).toString();
    const res = await fetch(MHIC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "Mozilla/5.0" },
      body,
      signal: AbortSignal.timeout(12000),
    });
    const html = await res.text();
    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
  }

  try {
    const seen = new Set<string>();
    const all: any[] = [];

    // Process letters in batches of 4 to stay within the 60s timeout
    const BATCH = 4;
    for (let i = 0; i < LETTERS.length; i += BATCH) {
      const batch = LETTERS.slice(i, i + BATCH);
      const results = await Promise.all(batch.map(queryByLastName));
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
