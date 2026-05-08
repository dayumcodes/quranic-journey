"use client";

import { useCallback, useEffect, useState } from "react";
import { classifyLocation } from "@/lib/utils/locationClassifier";
import type { LocationClassification, LocationState, NominatimResult } from "@/types";

export function useLocation(): { state: LocationState; classification: LocationClassification | null; retry: () => void } {
  const [state, setState] = useState<LocationState>("IDLE");
  const [classification, setClassification] = useState<LocationClassification | null>(null);

  const detect = useCallback(() => {
    if (!navigator.geolocation) {
      setState("ERROR");
      return;
    }
    setState("DETECTING");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const nominatim = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
          );
          const data = (await nominatim.json()) as NominatimResult;
          setClassification(classifyLocation(data));
          setState("DETECTED");
        } catch {
          setState("ERROR");
        }
      },
      () => setState("DENIED")
    );
  }, []);

  useEffect(() => { detect(); }, [detect]);
  return { state, classification, retry: detect };
}
