"use client";
import { useEffect, useState } from "react";
import { FOUNDER_OFF, parseFounderStatus, type FounderStatus } from "./offer";

/** Live founder-offer status from /api/founder-spots. Starts (and stays, on any error) as "off" = standard copy. */
export function useFounderOffer(): FounderStatus {
  const [f, setF] = useState<FounderStatus>(FOUNDER_OFF);
  useEffect(() => {
    let alive = true;
    fetch("/api/founder-spots").then((r) => (r.ok ? r.json() : null)).then((j) => { if (alive) setF(parseFounderStatus(j)); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  return f;
}
