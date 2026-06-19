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

/** Phone / tablet touch layout; desktop mouse uses a separate layout. */
export function useMobileImmersive(): boolean {
  const coarse = useMediaQuery("(pointer: coarse)");
  const touchPrimary = useMediaQuery("(hover: none)");
  const phoneNarrow = useMediaQuery("(max-width: 639px)");
  const touchViewport = useMediaQuery("(max-width: 1366px)");
  const shortHeight = useMediaQuery("(max-height: 520px)");

  const touchLike = coarse || touchPrimary;
  if (!touchLike) return false;
  return phoneNarrow || shortHeight || touchViewport;
}

/** Side-by-side photo layout for phone / tablet landscape. */
export function useMobileLandscapeLayout(): boolean {
  const landscape = useMediaQuery("(orientation: landscape)");
  const phoneLandscape = useMediaQuery("(max-height: 520px)");
  const tabletLandscape = useMediaQuery(
    "(min-width: 640px) and (max-width: 1366px)",
  );

  if (!landscape) return false;
  return phoneLandscape || tabletLandscape;
}
