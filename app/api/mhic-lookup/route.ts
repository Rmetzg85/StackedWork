import { NextResponse } from "next/server";

// Proxies the Maryland MHIC public license query CGI.
// The CGI is at dllr.state.md.us — accessible from Vercel servers.
// Search by zip code returns all licensed contractors in that area.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const zip = searchParams.get("zip")?.trim();
  const name = searchParams.get("name")?.trim();

  if (!zip && !name) {
    return NextResponse.json({ error: "Provide zip or name" }, { status: 400 });
  }

  try {
    // Build form body — Maryland MHIC CGI uses different calling_app values
    // for each search type. HIC::HIC_location_pq searches by zip/city.
    let body: string;
    let callingApp: string;

    if (zip) {
      callingApp = "HIC::HIC_location_pq";
      body = new URLSearchParams({
        calling_app: callingApp,
        zip_code: zip,
        search_type: "ZIP",
      }).toString();
    } else {
      callingApp = "HIC::HIC_personal_pq";
      const [last = "", first = ""] = (name || "").split(" ");
      body = new URLSearchParams({
        calling_app: callingApp,
        last_name: last,
        first_name: first,
      }).toString();
    }

    const res = await fetch(
      "https://www.dllr.state.md.us/cgi-bin/ElectronicLicensing/OP_search/OP_search.cgi",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0",
        },
        body,
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: `MHIC returned ${res.status}` }, { status: 502 });
    }

    const html = await res.text();
    const contractors = parseMHICResults(html);
    return NextResponse.json({ contractors });
  } catch (err: any) {
    console.error("MHIC lookup error:", err);
    return NextResponse.json({ error: err.message || "Lookup failed" }, { status: 500 });
  }
}

// Parse the HTML table returned by the Maryland CGI.
// The results table contains columns: License #, Name, Trade Name, City, County, Status
function parseMHICResults(html: string): any[] {
  const contractors: any[] = [];

  // Find all <tr> rows inside the results table (skip header row)
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  const stripTags = (s: string) => s.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();

  let rowMatch;
  let rowCount = 0;
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const rowHtml = rowMatch[1];
    const cells: string[] = [];
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      cells.push(stripTags(cellMatch[1]));
    }
    // Expect at least 5 columns; skip header rows
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
