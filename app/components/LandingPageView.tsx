import type { Metadata } from "next";
import MarketingShell, { TrialCta } from "./MarketingShell";
import JsonLd from "./JsonLd";
import { LANDING_PAGES } from "../lib/landing-pages";
import { RESOURCE_PAGES, absoluteUrl } from "../lib/site";
import { softwareApplicationLd } from "../lib/seo";

export function landingMetadata(slug: string): Metadata {
  const p = LANDING_PAGES[slug];
  const url = absoluteUrl(`/${slug}`);
  return {
    title: { absolute: p.title },
    description: p.description,
    alternates: { canonical: url },
    openGraph: { title: p.title, description: p.description, url, type: "article", siteName: "StackedWork", images: [{ url: "/og.png", width: 1200, height: 630, alt: "StackedWork: estimates and invoices from your phone" }] },
    twitter: { card: "summary_large_image", title: p.title, description: p.description, images: ["/og.png"] },
  };
}

export default function LandingPageView({ slug }: { slug: string }) {
  const p = LANDING_PAGES[slug];
  return (
    <MarketingShell>
      <JsonLd data={softwareApplicationLd(absoluteUrl(`/${slug}`))} />
      <article>
        <h1>{p.h1}</h1>
        {p.intro.map((t, i) => <p key={i}>{t}</p>)}
        <TrialCta />
        {p.sections.map((s) => (
          <section key={s.h2}>
            <h2>{s.h2}</h2>
            {s.body.map((t, i) => <p key={i}>{t}</p>)}
            {s.bullets && <ul>{s.bullets.map((b) => <li key={b}>{b}</li>)}</ul>}
            {s.image && (
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.image.src} alt={s.image.alt} width={s.image.width} height={s.image.height} loading="lazy" decoding="async" />
                <figcaption>{s.image.alt}. Screenshot of the real app with sample data.</figcaption>
              </figure>
            )}
          </section>
        ))}
        <TrialCta />
        <h2>Related</h2>
        <ul>
          {p.related.map((path) => {
            const r = RESOURCE_PAGES.find((x) => x.path === path)!;
            return <li key={path}><a href={path}>{r.title}</a>: {r.blurb}</li>;
          })}
        </ul>
      </article>
    </MarketingShell>
  );
}
