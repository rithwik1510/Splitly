"use client";

import { useEffect } from "react";
import { onCLS, onFID, onLCP, onTTFB, onINP, type Metric } from "web-vitals";

export function WebVitalsReporter() {
  useEffect(() => {
    const endpoint = process.env.NEXT_PUBLIC_VITALS_ENDPOINT;

    const report = (metric: Metric) => {
      if (endpoint) {
        try {
          // Fire-and-forget; avoid blocking the UI
          navigator.sendBeacon?.(
            endpoint,
            JSON.stringify({
              name: metric.name,
              id: metric.id,
              value: metric.value,
              delta: (metric as any).delta,
              navigationType: (performance.getEntriesByType("navigation")[0] as any)?.type,
              url: location.href,
              timestamp: Date.now(),
            })
          );
        } catch {
          // no-op
        }
      } else {
        // Default to console for local baseline capture
        // eslint-disable-next-line no-console
        console.log("[web-vitals]", metric.name, Math.round(metric.value), metric);
      }
    };

    onCLS(report);
    onFID(report);
    onLCP(report);
    onTTFB(report);
    onINP(report);
  }, []);

  return null;
}
