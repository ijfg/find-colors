import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);

  return matches;
}

export function useCoarsePointer(): boolean {
  return useMediaQuery("(pointer: coarse)");
}

export function useCompactWidth(): boolean {
  return useMediaQuery("(max-width: 639px)");
}

/** Phone touch layout in portrait or landscape (not tablet/desktop). */
export function useMobileImmersive(): boolean {
  const coarse = useCoarsePointer();
  const narrowWidth = useMediaQuery("(max-width: 639px)");
  const shortHeight = useMediaQuery("(max-height: 520px)");
  return coarse && (narrowWidth || shortHeight);
}
