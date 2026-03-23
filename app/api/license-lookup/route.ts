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

// Shared browser-like headers to bypass basic User-Agent checks
const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Upgrade-Insecure-Requests": "1",
};

// Generic HTML table parser — extracts rows from the first data table found.
// columns: array of result field names mapped to column indices.
function parseTable(
  html: string,
  stateAbbr: string,
  columns: { license?: number; name?: number; trade_name?: number; city?: number; county?: number; status?: number },
  headerRows = 1,
): LicenseResult[] {
  const results: LicenseResult[] = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  const strip = (s: string) =>
    s.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").trim();
  let rowMatch;
  let rowIdx = 0;
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    if (rowIdx < headerRows) { rowIdx++; continue; }
    const cells: string[] = [];
    let cm;
    while ((cm = cellRegex.exec(rowMatch[1])) !== null) cells.push(strip(cm[1]));
    if (cells.length < 2) { rowIdx++; continue; }
    const get = (i?: number) => (i !== undefined && cells[i] ? cells[i] : "");
    results.push({
      license: get(columns.license),
      name: get(columns.name),
      trade_name: get(columns.trade_name),
      city: get(columns.city),
      county: get(columns.county),
      state: stateAbbr,
      status: get(columns.status),
    });
    rowIdx++;
  }
  return results.filter(r => r.name || r.license);
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
  // MD columns: license(0), name(1), trade_name(2), city(3), county(4), status(5)
  return parseTable(html, "MD", { license: 0, name: 1, trade_name: 2, city: 3, county: 4, status: 5 });
}

// ── Massachusetts HIC ──────────────────────────────────────────────────────────

async function lookupMA(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ Board: "HIC", Type: "LIC", Status: "AC" });
  if (name) params.set("LicenseeNameSearch", name);
  if (zip) params.set("City", zip);
  const res = await fetch(`https://license.reg.state.ma.us/pub/Lic_det.asp?${params}`, {
    headers: { ...BROWSER_HEADERS },
  });
  if (!res.ok) throw new Error(`MA HIC returned ${res.status}`);
  const html = await res.text();
  return parseTable(html, "MA", { license: 0, name: 1, city: 2, status: 3 });
}

// ── Florida DBPR ───────────────────────────────────────────────────────────────
// Two-step: GET the form to capture session cookie, then POST the search.

async function lookupFL(zip?: string, name?: string): Promise<LicenseResult[]> {
  const BASE = "https://www.myfloridalicense.com";
  // Step 1: get cookies
  const init = await fetch(`${BASE}/wl11.asp`, { headers: { ...BROWSER_HEADERS } });
  const cookies = init.headers.get("set-cookie") ?? "";
  // Step 2: search
  const params = new URLSearchParams({
    mode: "2", search: "Name", SID: "", brd: "0", typ: "", status: "A",
    sch: "", district: "", County: "",
  });
  if (zip) params.set("zip", zip);
  if (name) { params.set("LicenseeName", name.split(" ")[0] ?? ""); }
  const res = await fetch(`${BASE}/wl11.asp?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: `${BASE}/wl11.asp`, Cookie: cookies },
  });
  if (!res.ok) throw new Error(`FL DBPR returned ${res.status}`);
  const html = await res.text();
  // FL columns: license(0), name(1), city(2), county(3), status(4)
  return parseTable(html, "FL", { license: 0, name: 1, city: 2, county: 3, status: 4 });
}

// ── Virginia DPOR ──────────────────────────────────────────────────────────────

async function lookupVA(zip?: string, name?: string): Promise<LicenseResult[]> {
  const BASE = "https://dporweb.dpor.virginia.gov";
  const params = new URLSearchParams({ professionCode: "CONT", zipCode: zip ?? "", lastName: name ?? "" });
  const res = await fetch(`${BASE}/LicenseLookup/Search?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: `${BASE}/LicenseLookup/` },
  });
  if (!res.ok) throw new Error(`VA DPOR returned ${res.status}`);
  const html = await res.text();
  // VA columns vary — name(0), license(1), type(2), city(3), status(4)
  return parseTable(html, "VA", { name: 0, license: 1, trade_name: 2, city: 3, status: 4 });
}

// ── Oregon CCB ─────────────────────────────────────────────────────────────────

async function lookupOR(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams();
  if (zip) params.set("search[zip]", zip);
  if (name) params.set("search[name]", name);
  const res = await fetch(`https://search.ccb.state.or.us/search?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://search.ccb.state.or.us/" },
  });
  if (!res.ok) throw new Error(`OR CCB returned ${res.status}`);
  const html = await res.text();
  // OR columns: license(0), name(1), city(2), status(3)
  return parseTable(html, "OR", { license: 0, name: 1, city: 2, status: 3 });
}

// ── Pennsylvania AG HIC ────────────────────────────────────────────────────────

async function lookupPA(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ searchType: "zip", zipCode: zip ?? "", lastName: name ?? "" });
  const res = await fetch(`https://hicsearch.attorneygeneral.gov/Results?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://hicsearch.attorneygeneral.gov/" },
  });
  if (!res.ok) throw new Error(`PA AG HIC returned ${res.status}`);
  const html = await res.text();
  // PA columns: name(0), license(1), city(2), status(3)
  return parseTable(html, "PA", { name: 0, license: 1, city: 2, status: 3 });
}

// ── North Carolina NCLBGC ──────────────────────────────────────────────────────

async function lookupNC(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ zip: zip ?? "", companyName: name ?? "", status: "A" });
  const res = await fetch(`https://portal.nclbgc.org/Public/Search?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://portal.nclbgc.org/Public/Search" },
  });
  if (!res.ok) throw new Error(`NC NCLBGC returned ${res.status}`);
  const html = await res.text();
  return parseTable(html, "NC", { license: 0, name: 1, city: 2, status: 3 });
}

// ── Georgia Secretary of State ─────────────────────────────────────────────────

async function lookupGA(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ licenseType: "CONSTRUCTION", zipCode: zip ?? "", name: name ?? "", status: "Active" });
  const res = await fetch(`https://verify.sos.ga.gov/verification/Search.aspx?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://verify.sos.ga.gov/verification/" },
  });
  if (!res.ok) throw new Error(`GA SOS returned ${res.status}`);
  const html = await res.text();
  return parseTable(html, "GA", { name: 0, license: 1, city: 2, status: 3 });
}

// ── Washington L&I ─────────────────────────────────────────────────────────────

async function lookupWA(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ Zip: zip ?? "", Name: name ?? "", LicenseType: "CONTRACTOR" });
  const res = await fetch(`https://secure.lni.wa.gov/verify/Results.aspx?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://secure.lni.wa.gov/verify/" },
  });
  if (!res.ok) throw new Error(`WA L&I returned ${res.status}`);
  const html = await res.text();
  return parseTable(html, "WA", { name: 0, license: 1, city: 2, status: 3 });
}

// ── Tennessee ──────────────────────────────────────────────────────────────────

async function lookupTN(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ licenseType: "CONTRACTOR", zip: zip ?? "", name: name ?? "" });
  const res = await fetch(`https://verify.tn.gov/results?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://verify.tn.gov/" },
  });
  if (!res.ok) throw new Error(`TN verify returned ${res.status}`);
  const html = await res.text();
  return parseTable(html, "TN", { name: 0, license: 1, city: 2, status: 3 });
}

// ── Louisiana LSLBC ────────────────────────────────────────────────────────────

async function lookupLA(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ name: name ?? "", zip: zip ?? "" });
  const res = await fetch(`https://arlspublic.lslbc.louisiana.gov/Public/Search?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://arlspublic.lslbc.louisiana.gov/Public/Search" },
  });
  if (!res.ok) throw new Error(`LA LSLBC returned ${res.status}`);
  const html = await res.text();
  return parseTable(html, "LA", { license: 0, name: 1, city: 2, county: 3, status: 4 });
}

// ── South Carolina LLR ─────────────────────────────────────────────────────────

async function lookupSC(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ licenseType: "CONTRACTOR", zip: zip ?? "", name: name ?? "" });
  const res = await fetch(`https://verify.llr.sc.gov/search?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://verify.llr.sc.gov/" },
  });
  if (!res.ok) throw new Error(`SC LLR returned ${res.status}`);
  const html = await res.text();
  return parseTable(html, "SC", { name: 0, license: 1, city: 2, status: 3 });
}

// ── Nevada NSCB ────────────────────────────────────────────────────────────────

async function lookupNV(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ Zip: zip ?? "", CompanyName: name ?? "" });
  const res = await fetch(`https://app.nvcontractorsboard.com/Shared%20Documents/ContractorSearch.aspx?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://app.nvcontractorsboard.com/" },
  });
  if (!res.ok) throw new Error(`NV NSCB returned ${res.status}`);
  const html = await res.text();
  return parseTable(html, "NV", { license: 0, name: 1, city: 2, status: 3 });
}

// ── Arizona ROC ────────────────────────────────────────────────────────────────

async function lookupAZ(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ zip: zip ?? "", name: name ?? "", status: "Active" });
  const res = await fetch(`https://roc.az.gov/Search?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://roc.az.gov/" },
  });
  if (!res.ok) throw new Error(`AZ ROC returned ${res.status}`);
  const html = await res.text();
  return parseTable(html, "AZ", { license: 0, name: 1, city: 2, status: 3 });
}

// ── Minnesota DLI ──────────────────────────────────────────────────────────────

async function lookupMN(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ zip: zip ?? "", name: name ?? "", lictype: "RC" });
  const res = await fetch(`https://secure.doli.state.mn.us/lookup/licenseelookup.aspx?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://secure.doli.state.mn.us/lookup/licenseelookup.aspx" },
  });
  if (!res.ok) throw new Error(`MN DLI returned ${res.status}`);
  const html = await res.text();
  return parseTable(html, "MN", { license: 0, name: 1, city: 2, status: 3 });
}

// ── Wisconsin DSPS ─────────────────────────────────────────────────────────────

async function lookupWI(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ licenseType: "CONTRACTOR", zip: zip ?? "", name: name ?? "" });
  const res = await fetch(`https://licensesearch.wi.gov/search?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://licensesearch.wi.gov/" },
  });
  if (!res.ok) throw new Error(`WI DSPS returned ${res.status}`);
  const html = await res.text();
  return parseTable(html, "WI", { license: 0, name: 1, city: 2, status: 3 });
}

// ── Router map ─────────────────────────────────────────────────────────────────

type LookupFn = (zip?: string, name?: string) => Promise<LicenseResult[]>;

const SCRAPERS: Partial<Record<string, LookupFn>> = {
  MD: lookupMD,
  MA: lookupMA,
  FL: lookupFL,
  VA: lookupVA,
  OR: lookupOR,
  PA: lookupPA,
  NC: lookupNC,
  GA: lookupGA,
  WA: lookupWA,
  TN: lookupTN,
  LA: lookupLA,
  SC: lookupSC,
  NV: lookupNV,
  AZ: lookupAZ,
  MN: lookupMN,
  WI: lookupWI,
};

// ── Main handler ───────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const zip = searchParams.get("zip")?.trim();
  const name = searchParams.get("name")?.trim();
  const stateParam = searchParams.get("state")?.trim().toUpperCase();

  if (!zip && !name) {
    return NextResponse.json({ error: "Provide zip or name" }, { status: 400 });
  }

  // Determine state
  let stateInfo = stateParam ? STATE_REGISTRY[stateParam] : null;
  if (!stateInfo && zip) stateInfo = zipToState(zip);
  if (!stateInfo) {
    return NextResponse.json({ contractors: [], supported: false, error: "Could not determine state from zip code" });
  }

  const scraper = SCRAPERS[stateInfo.abbr];

  // No scraper — return official lookup URL
  if (!scraper) {
    return NextResponse.json({
      contractors: [], supported: false,
      state: stateInfo.abbr, stateName: stateInfo.name,
      agencyName: stateInfo.agencyName, lookupUrl: stateInfo.lookupUrl,
      notes: stateInfo.notes ?? null,
    });
  }

  // Try the scraper; on any failure fall back to the official URL gracefully
  try {
    const contractors = await scraper(zip, name);
    return NextResponse.json({
      contractors, supported: true,
      state: stateInfo.abbr, stateName: stateInfo.name,
      agencyName: stateInfo.agencyName, lookupUrl: stateInfo.lookupUrl,
    });
  } catch (err: any) {
    console.error(`[license-lookup] ${stateInfo.abbr} scraper failed:`, err.message);
    // Treat the same as "not supported" so the UI shows the official link
    return NextResponse.json({
      contractors: [], supported: false,
      state: stateInfo.abbr, stateName: stateInfo.name,
      agencyName: stateInfo.agencyName, lookupUrl: stateInfo.lookupUrl,
      notes: stateInfo.notes ?? null,
    });
  }
}
