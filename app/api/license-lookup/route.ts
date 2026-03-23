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

// ── Alabama ALBGC ──────────────────────────────────────────────────────────────

async function lookupAL(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ zip: zip ?? "", name: name ?? "", status: "A" });
  const res = await fetch(`https://gencon.state.al.us/search.aspx?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://gencon.state.al.us/" },
  });
  if (!res.ok) throw new Error(`AL ALBGC returned ${res.status}`);
  return parseTable(await res.text(), "AL", { license: 0, name: 1, city: 2, status: 3 });
}

// ── Alaska DCBPL ───────────────────────────────────────────────────────────────

async function lookupAK(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ zip: zip ?? "", name: name ?? "", profType: "CONTRACTOR" });
  const res = await fetch(`https://www.commerce.alaska.gov/cbp/main/search/professional?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://www.commerce.alaska.gov/cbp/main/search/professional" },
  });
  if (!res.ok) throw new Error(`AK DCBPL returned ${res.status}`);
  return parseTable(await res.text(), "AK", { license: 0, name: 1, city: 2, status: 3 });
}

// ── Arkansas ACLB ──────────────────────────────────────────────────────────────

async function lookupAR(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ zip: zip ?? "", name: name ?? "" });
  const res = await fetch(`https://www.aclb.arkansas.gov/Home/Verification?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://www.aclb.arkansas.gov/Home/Verification" },
  });
  if (!res.ok) throw new Error(`AR ACLB returned ${res.status}`);
  return parseTable(await res.text(), "AR", { license: 0, name: 1, city: 2, status: 3 });
}

// ── California CSLB ────────────────────────────────────────────────────────────

async function lookupCA(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ LicenseType: "C", Status: "A", ZipCode: zip ?? "", LicenseName: name ?? "" });
  const res = await fetch(`https://www.cslb.ca.gov/OnlineServices/CheckLicenseII/ZipCodeSearch.aspx?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://www.cslb.ca.gov/onlineservices/checklicenseII/checklicense.aspx" },
  });
  if (!res.ok) throw new Error(`CA CSLB returned ${res.status}`);
  return parseTable(await res.text(), "CA", { license: 0, name: 1, city: 2, status: 3 });
}

// ── Colorado DORA ──────────────────────────────────────────────────────────────

async function lookupCO(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ professionCode: "GC", zipCode: zip ?? "", lastName: name ?? "" });
  const res = await fetch(`https://apps2.colorado.gov/dora/licensing/Lookup/LicenseLookup.aspx?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://apps2.colorado.gov/dora/licensing/Lookup/LicenseLookup.aspx" },
  });
  if (!res.ok) throw new Error(`CO DORA returned ${res.status}`);
  return parseTable(await res.text(), "CO", { license: 0, name: 1, city: 2, status: 3 });
}

// ── Connecticut DCP ────────────────────────────────────────────────────────────

async function lookupCT(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ licenseType: "HIC", zip: zip ?? "", name: name ?? "" });
  const res = await fetch(`https://www.elicense.ct.gov/Lookup/LicenseLookup.aspx?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://www.elicense.ct.gov/Lookup/LicenseLookup.aspx" },
  });
  if (!res.ok) throw new Error(`CT DCP returned ${res.status}`);
  return parseTable(await res.text(), "CT", { license: 0, name: 1, city: 2, status: 3 });
}

// ── Delaware ───────────────────────────────────────────────────────────────────

async function lookupDE(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ licType: "CONTRACTOR", zip: zip ?? "", name: name ?? "" });
  const res = await fetch(`https://onestop.delaware.gov/osbrlpublic/Home/LicenseSearch?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://onestop.delaware.gov/osbrlpublic/Home/LicenseSearch" },
  });
  if (!res.ok) throw new Error(`DE returned ${res.status}`);
  return parseTable(await res.text(), "DE", { license: 0, name: 1, city: 2, status: 3 });
}

// ── Hawaii DCCA ────────────────────────────────────────────────────────────────

async function lookupHI(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ licType: "C", zip: zip ?? "", name: name ?? "" });
  const res = await fetch(`https://pvl.ehawaii.gov/pvlsearch/app?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://pvl.ehawaii.gov/pvlsearch/" },
  });
  if (!res.ok) throw new Error(`HI DCCA returned ${res.status}`);
  return parseTable(await res.text(), "HI", { license: 0, name: 1, city: 2, status: 3 });
}

// ── Idaho IPLA ─────────────────────────────────────────────────────────────────

async function lookupID(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ licenseType: "PWC", zipCode: zip ?? "", name: name ?? "" });
  const res = await fetch(`https://ipla.idaho.gov/ipla/public/LicenseLookup?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://ipla.idaho.gov/ipla/public/LicenseLookup" },
  });
  if (!res.ok) throw new Error(`ID IPLA returned ${res.status}`);
  return parseTable(await res.text(), "ID", { license: 0, name: 1, city: 2, status: 3 });
}

// ── Illinois IDFPR ─────────────────────────────────────────────────────────────

async function lookupIL(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ licType: "CONTRACTOR", zip: zip ?? "", name: name ?? "" });
  const res = await fetch(`https://online-dfpr.micropact.com/lookup/licenselookup.aspx?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://online-dfpr.micropact.com/lookup/licenselookup.aspx" },
  });
  if (!res.ok) throw new Error(`IL IDFPR returned ${res.status}`);
  return parseTable(await res.text(), "IL", { license: 0, name: 1, city: 2, status: 3 });
}

// ── Indiana PLA ────────────────────────────────────────────────────────────────

async function lookupIN(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ licenseType: "HIM", zip: zip ?? "", name: name ?? "" });
  const res = await fetch(`https://mylicense.in.gov/everification/Search.aspx?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://mylicense.in.gov/everification/" },
  });
  if (!res.ok) throw new Error(`IN PLA returned ${res.status}`);
  return parseTable(await res.text(), "IN", { license: 0, name: 1, city: 2, status: 3 });
}

// ── Iowa DOL ───────────────────────────────────────────────────────────────────

async function lookupIA(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ zip: zip ?? "", name: name ?? "" });
  const res = await fetch(`https://www.iowadivisionoflabor.gov/contractor-licensing/search?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://www.iowadivisionoflabor.gov/contractor-licensing" },
  });
  if (!res.ok) throw new Error(`IA DOL returned ${res.status}`);
  return parseTable(await res.text(), "IA", { license: 0, name: 1, city: 2, status: 3 });
}

// ── Kansas AG ─────────────────────────────────────────────────────────────────

async function lookupKS(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ zip: zip ?? "", name: name ?? "" });
  const res = await fetch(`https://ag.ks.gov/licensing/contractor-registration/search?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://ag.ks.gov/licensing/contractor-registration" },
  });
  if (!res.ok) throw new Error(`KS AG returned ${res.status}`);
  return parseTable(await res.text(), "KS", { license: 0, name: 1, city: 2, status: 3 });
}

// ── Kentucky DHBC ──────────────────────────────────────────────────────────────

async function lookupKY(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ zipCode: zip ?? "", name: name ?? "", licenseType: "CONTRACTOR" });
  const res = await fetch(`https://dhbc.ky.gov/Pages/LookUpLicense.aspx?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://dhbc.ky.gov/Pages/LookUpLicense.aspx" },
  });
  if (!res.ok) throw new Error(`KY DHBC returned ${res.status}`);
  return parseTable(await res.text(), "KY", { license: 0, name: 1, city: 2, status: 3 });
}

// ── Maine OPLR ─────────────────────────────────────────────────────────────────

async function lookupME(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ board: "HOME", zip: zip ?? "", name: name ?? "" });
  const res = await fetch(`https://www.pfr.maine.gov/almsonline/almsquery/SearchEntity.aspx?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://www.pfr.maine.gov/almsonline/almsquery/welcome.aspx" },
  });
  if (!res.ok) throw new Error(`ME OPLR returned ${res.status}`);
  return parseTable(await res.text(), "ME", { license: 0, name: 1, city: 2, status: 3 });
}

// ── Michigan LARA ──────────────────────────────────────────────────────────────

async function lookupMI(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ licenseType: "RESIDENTIAL", zip: zip ?? "", name: name ?? "" });
  const res = await fetch(`https://www.lara.michigan.gov/Lic/ContactSearch.aspx?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://www.lara.michigan.gov/Lic/ContactSearch.aspx" },
  });
  if (!res.ok) throw new Error(`MI LARA returned ${res.status}`);
  return parseTable(await res.text(), "MI", { license: 0, name: 1, city: 2, status: 3 });
}

// ── Mississippi MSBOC ──────────────────────────────────────────────────────────

async function lookupMS(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ zip: zip ?? "", name: name ?? "" });
  const res = await fetch(`https://www.msboc.us/ContractorSearch?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://www.msboc.us/ContractorSearch" },
  });
  if (!res.ok) throw new Error(`MS MSBOC returned ${res.status}`);
  return parseTable(await res.text(), "MS", { license: 0, name: 1, city: 2, status: 3 });
}

// ── Missouri DPR ───────────────────────────────────────────────────────────────

async function lookupMO(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ zip: zip ?? "", name: name ?? "", board: "CONTRACTOR" });
  const res = await fetch(`https://pr.mo.gov/licensee-search.asp?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://pr.mo.gov/licensee-search.asp" },
  });
  if (!res.ok) throw new Error(`MO DPR returned ${res.status}`);
  return parseTable(await res.text(), "MO", { license: 0, name: 1, city: 2, status: 3 });
}

// ── Montana DLI ────────────────────────────────────────────────────────────────

async function lookupMT(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ mylist: "lic", zip: zip ?? "", name: name ?? "" });
  const res = await fetch(`https://ebizws.mt.gov/PUBLICPORTAL/searchform?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://ebizws.mt.gov/PUBLICPORTAL/searchform?mylist=lic" },
  });
  if (!res.ok) throw new Error(`MT DLI returned ${res.status}`);
  return parseTable(await res.text(), "MT", { license: 0, name: 1, city: 2, status: 3 });
}

// ── Nebraska DOL ───────────────────────────────────────────────────────────────

async function lookupNE(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ licType: "CONTRACTOR", zip: zip ?? "", name: name ?? "" });
  const res = await fetch(`https://www.nebraska.gov/LISShowPublicLicense.cgi?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://www.nebraska.gov/LISShowPublicLicense.cgi" },
  });
  if (!res.ok) throw new Error(`NE DOL returned ${res.status}`);
  return parseTable(await res.text(), "NE", { license: 0, name: 1, city: 2, status: 3 });
}

// ── New Hampshire OPLC ─────────────────────────────────────────────────────────

async function lookupNH(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ licType: "HIC", zip: zip ?? "", name: name ?? "" });
  const res = await fetch(`https://forms.nh.gov/licenseverification/search?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://forms.nh.gov/licenseverification/" },
  });
  if (!res.ok) throw new Error(`NH OPLC returned ${res.status}`);
  return parseTable(await res.text(), "NH", { license: 0, name: 1, city: 2, status: 3 });
}

// ── New Jersey DCA ─────────────────────────────────────────────────────────────

async function lookupNJ(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ facility: "N", zip: zip ?? "", name: name ?? "" });
  const res = await fetch(`https://newjersey.mylicense.com/verification/Search.aspx?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://newjersey.mylicense.com/verification/" },
  });
  if (!res.ok) throw new Error(`NJ DCA returned ${res.status}`);
  return parseTable(await res.text(), "NJ", { license: 0, name: 1, city: 2, status: 3 });
}

// ── New Mexico RLD ─────────────────────────────────────────────────────────────

async function lookupNM(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ zip: zip ?? "", name: name ?? "", licType: "GB98" });
  const res = await fetch(`https://www.rld.nm.gov/licensing/lookup?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://www.rld.nm.gov/" },
  });
  if (!res.ok) throw new Error(`NM RLD returned ${res.status}`);
  return parseTable(await res.text(), "NM", { license: 0, name: 1, city: 2, status: 3 });
}

// ── North Dakota SOS ───────────────────────────────────────────────────────────

async function lookupND(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ zip: zip ?? "", name: name ?? "" });
  const res = await fetch(`https://firststop.sos.nd.gov/search/business?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://firststop.sos.nd.gov/search/business" },
  });
  if (!res.ok) throw new Error(`ND SOS returned ${res.status}`);
  return parseTable(await res.text(), "ND", { license: 0, name: 1, city: 2, status: 3 });
}

// ── Ohio eLicense ──────────────────────────────────────────────────────────────

async function lookupOH(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ licenseType: "HIC", zip: zip ?? "", name: name ?? "" });
  const res = await fetch(`https://elicense.ohio.gov/OH_SearchResults?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://elicense.ohio.gov/OH_HomePage" },
  });
  if (!res.ok) throw new Error(`OH eLicense returned ${res.status}`);
  return parseTable(await res.text(), "OH", { license: 0, name: 1, city: 2, status: 3 });
}

// ── Oklahoma CIB ───────────────────────────────────────────────────────────────

async function lookupOK(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ zip: zip ?? "", name: name ?? "" });
  const res = await fetch(`https://www.ok.gov/cib/Contractor_Licensing/Contractor_Search/index.html?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://www.ok.gov/cib/" },
  });
  if (!res.ok) throw new Error(`OK CIB returned ${res.status}`);
  return parseTable(await res.text(), "OK", { license: 0, name: 1, city: 2, status: 3 });
}

// ── Rhode Island CRB ───────────────────────────────────────────────────────────

async function lookupRI(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ zip: zip ?? "", name: name ?? "" });
  const res = await fetch(`https://crb.ri.gov/contractor-search?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://crb.ri.gov/contractor-search" },
  });
  if (!res.ok) throw new Error(`RI CRB returned ${res.status}`);
  return parseTable(await res.text(), "RI", { license: 0, name: 1, city: 2, status: 3 });
}

// ── South Dakota DOL ───────────────────────────────────────────────────────────

async function lookupSD(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ zip: zip ?? "", name: name ?? "" });
  const res = await fetch(`https://dlr.sd.gov/contractor/search?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://dlr.sd.gov/contractor/contractor_licensing.aspx" },
  });
  if (!res.ok) throw new Error(`SD DOL returned ${res.status}`);
  return parseTable(await res.text(), "SD", { license: 0, name: 1, city: 2, status: 3 });
}

// ── Texas TDLR ────────────────────────────────────────────────────────────────
// TX only licenses specialty trades (electrical, plumbing, HVAC, AC) at state level

async function lookupTX(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ zip: zip ?? "", name: name ?? "" });
  const res = await fetch(`https://www.tdlr.texas.gov/LicenseSearch/licfile.asp?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://www.tdlr.texas.gov/LicenseSearch/" },
  });
  if (!res.ok) throw new Error(`TX TDLR returned ${res.status}`);
  return parseTable(await res.text(), "TX", { license: 0, name: 1, city: 2, status: 3 });
}

// ── Utah DOPL ─────────────────────────────────────────────────────────────────

async function lookupUT(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ licType: "GCME", zip: zip ?? "", name: name ?? "" });
  const res = await fetch(`https://dopl.utah.gov/license_lookup/results?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://dopl.utah.gov/license_lookup/" },
  });
  if (!res.ok) throw new Error(`UT DOPL returned ${res.status}`);
  return parseTable(await res.text(), "UT", { license: 0, name: 1, city: 2, status: 3 });
}

// ── Vermont SOS ────────────────────────────────────────────────────────────────

async function lookupVT(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ zip: zip ?? "", name: name ?? "" });
  const res = await fetch(`https://sos.vermont.gov/licensing/lookup?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://sos.vermont.gov/corporations/reg-professional-licensing/" },
  });
  if (!res.ok) throw new Error(`VT SOS returned ${res.status}`);
  return parseTable(await res.text(), "VT", { license: 0, name: 1, city: 2, status: 3 });
}

// ── West Virginia DOL ──────────────────────────────────────────────────────────

async function lookupWV(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ zip: zip ?? "", name: name ?? "" });
  const res = await fetch(`https://labor.wv.gov/Contractor-Licensing/search?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://labor.wv.gov/Contractor-Licensing/Pages/Contractor-Licensing.aspx" },
  });
  if (!res.ok) throw new Error(`WV DOL returned ${res.status}`);
  return parseTable(await res.text(), "WV", { license: 0, name: 1, city: 2, status: 3 });
}

// ── Wyoming ────────────────────────────────────────────────────────────────────

async function lookupWY(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ zip: zip ?? "", name: name ?? "" });
  const res = await fetch(`https://wyominglicensing.com/search?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://wyominglicensing.com/" },
  });
  if (!res.ok) throw new Error(`WY returned ${res.status}`);
  return parseTable(await res.text(), "WY", { license: 0, name: 1, city: 2, status: 3 });
}

// ── DC DCRA ────────────────────────────────────────────────────────────────────

async function lookupDC(zip?: string, name?: string): Promise<LicenseResult[]> {
  const params = new URLSearchParams({ licType: "CONTRACTOR", zip: zip ?? "", name: name ?? "" });
  const res = await fetch(`https://dcra.dc.gov/licensing/search?${params}`, {
    headers: { ...BROWSER_HEADERS, Referer: "https://dcra.dc.gov/service/licensing-verification" },
  });
  if (!res.ok) throw new Error(`DC DCRA returned ${res.status}`);
  return parseTable(await res.text(), "DC", { license: 0, name: 1, city: 2, status: 3 });
}

// ── Router map ─────────────────────────────────────────────────────────────────

type LookupFn = (zip?: string, name?: string) => Promise<LicenseResult[]>;

const SCRAPERS: Partial<Record<string, LookupFn>> = {
  // Proven / high-confidence
  MD: lookupMD, MA: lookupMA,
  // Best-effort with browser headers + graceful fallback
  AL: lookupAL, AK: lookupAK, AR: lookupAR, AZ: lookupAZ,
  CA: lookupCA, CO: lookupCO, CT: lookupCT,
  DC: lookupDC, DE: lookupDE,
  FL: lookupFL,
  GA: lookupGA,
  HI: lookupHI,
  IA: lookupIA, ID: lookupID, IL: lookupIL, IN: lookupIN,
  KS: lookupKS, KY: lookupKY,
  LA: lookupLA,
  ME: lookupME, MI: lookupMI, MN: lookupMN, MO: lookupMO, MS: lookupMS, MT: lookupMT,
  NC: lookupNC, ND: lookupND, NE: lookupNE, NH: lookupNH, NJ: lookupNJ, NM: lookupNM, NV: lookupNV,
  OH: lookupOH, OK: lookupOK, OR: lookupOR,
  PA: lookupPA,
  RI: lookupRI,
  SC: lookupSC, SD: lookupSD,
  TN: lookupTN, TX: lookupTX,
  UT: lookupUT,
  VA: lookupVA, VT: lookupVT,
  WA: lookupWA, WI: lookupWI, WV: lookupWV, WY: lookupWY,
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
