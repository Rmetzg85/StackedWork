import { NextResponse } from "next/server";
import { zipToState, STATE_REGISTRY } from "@/app/lib/zip-to-state";

export interface LicenseResult {
  license: string;
  name: string;
  trade_name?: string;
  city?: string;
  county?: string;
  state: string;
  status: string;
}

// ── Maryland MHIC ──────────────────────────────────────────────────────────────

async function lookupMD(zip?: string, name?: string): Promise<LicenseResult[]> {
  let body: string;
  if (zip) {
    body = new URLSearchParams({ calling_app: "HIC::HIC_location_pq", zip_code: zip, search_type: "ZIP" }).toString();
  } else {
    const [last = "", first = ""] = (name || "").split(" ");
    body = new URLSearchParams({ calling_app: "HIC::HIC_personal_pq", last_name: last, first_name: first }).toString();
  }
  const res = await fetch("https://www.dllr.state.md.us/cgi-bin/ElectronicLicensing/OP_search/OP_search.cgi", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "Mozilla/5.0" },
    body,
  });
  if (!res.ok) throw new Error(`MHIC returned ${res.status}`);
  const html = await res.text();
  return parseMHIC(html);
}

function parseMHIC(html: string): LicenseResult[] {
  const results: LicenseResult[] = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  const strip = (s: string) => s.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();
  let rowMatch, rowCount = 0;
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const cells: string[] = [];
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) cells.push(strip(cellMatch[1]));
    if (cells.length >= 5 && rowCount > 0 && !/license/i.test(cells[0])) {
      results.push({ license: cells[0], name: cells[1], trade_name: cells[2], city: cells[3], county: cells[4], state: "MD", status: cells[5] || "" });
    }
    rowCount++;
  }
  return results;
}

// ── Massachusetts HIC ──────────────────────────────────────────────────────────

async function lookupMA(zip?: string, name?: string): Promise<LicenseResult[]> {
  // MA Office of Consumer Affairs HIC public lookup
  const params = new URLSearchParams({ Board: "HIC", Type: "LIC", Status: "AC" });
  if (name) params.set("LicenseeNameSearch", name);
  if (zip) params.set("City", zip); // MA search uses city/town, not zip — best effort
  const res = await fetch(`https://license.reg.state.ma.us/pub/Lic_det.asp?${params}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error(`MA lookup returned ${res.status}`);
  const html = await res.text();
  return parseMAResults(html);
}

function parseMAResults(html: string): LicenseResult[] {
  const results: LicenseResult[] = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  const strip = (s: string) => s.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();
  let rowMatch, rowCount = 0;
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const cells: string[] = [];
    let cm;
    while ((cm = cellRegex.exec(rowMatch[1])) !== null) cells.push(strip(cm[1]));
    if (cells.length >= 3 && rowCount > 0 && cells[0] && !/^lic/i.test(cells[0])) {
      results.push({ license: cells[0] || "", name: cells[1] || "", city: cells[2] || "", state: "MA", status: cells[3] || "Active" });
    }
    rowCount++;
  }
  return results;
}

// ── Main handler ───────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const zip = searchParams.get("zip")?.trim();
  const name = searchParams.get("name")?.trim();
  const stateParam = searchParams.get("state")?.trim().toUpperCase();

  if (!zip && !name) {
    return NextResponse.json({ error: "Provide zip or name" }, { status: 400 });
  }

  // Determine state from param or zip
  let stateInfo = stateParam ? STATE_REGISTRY[stateParam] : null;
  if (!stateInfo && zip) stateInfo = zipToState(zip);

  if (!stateInfo) {
    return NextResponse.json({ error: "Could not determine state from zip code", contractors: [], supported: false }, { status: 200 });
  }

  // If not scraperSupported, return the official lookup URL
  if (!stateInfo.scraperSupported) {
    return NextResponse.json({
      contractors: [],
      supported: false,
      state: stateInfo.abbr,
      stateName: stateInfo.name,
      agencyName: stateInfo.agencyName,
      lookupUrl: stateInfo.lookupUrl,
      notes: stateInfo.notes ?? null,
    });
  }

  // Run the appropriate scraper
  try {
    let contractors: LicenseResult[] = [];

    if (stateInfo.abbr === "MD") {
      contractors = await lookupMD(zip, name);
    } else if (stateInfo.abbr === "MA") {
      contractors = await lookupMA(zip, name);
    }

    return NextResponse.json({
      contractors,
      supported: true,
      state: stateInfo.abbr,
      stateName: stateInfo.name,
      agencyName: stateInfo.agencyName,
      lookupUrl: stateInfo.lookupUrl,
    });
  } catch (err: any) {
    console.error(`License lookup error for ${stateInfo.abbr}:`, err);
    return NextResponse.json({ error: err.message || "Lookup failed", contractors: [], supported: true, state: stateInfo.abbr, lookupUrl: stateInfo.lookupUrl }, { status: 500 });
  }
}
