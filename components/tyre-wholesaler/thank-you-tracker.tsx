"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

// Fires the conversion events once when the thank-you page loads.
// This page is the ad/SEO conversion target — keep events here, not duplicated elsewhere.

export default function ThankYouTracker() {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackEvent("generate_lead", {
      lead_source: "tyre_wholesaler_landing",
      landing_page: "/tyre-wholesaler",
    });
    trackEvent("tyre_wholesaler_lead_submitted");
  }, []);

  return null;
}
