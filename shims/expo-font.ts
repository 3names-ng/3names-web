import { useEffect, useState } from "react";

type FontMap = Record<string, number | string | { uri: string; headers?: any }>;

function toUrl(src: any): string {
  if (typeof src === "string") return src;
  if (src && typeof src === "object") return src.uri || "";
  return String(src ?? "");
}

/**
 * Loads fonts through the CSS FontFace API. Resolves loaded=true even when a
 * font fails so the app never hangs on a permanent null render.
 */
export function useFonts(fontMap: FontMap): [boolean, Error | null] {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const entries = Object.entries(fontMap);
        if (typeof (document as any) !== "undefined" && (document as any).fonts) {
          await Promise.all(
            entries.map(async ([name, src]) => {
              const url = toUrl(src);
              if (!url) return;
              try {
                const face = new FontFace(name, `url(${JSON.stringify(url).slice(1, -1)})`);
                await face.load();
                (document as any).fonts.add(face);
              } catch (e) {
                // Fallback: declare via CSS so the browser can still fetch it.
                const style = document.createElement("style");
                style.textContent = `@font-face { font-family: "${name}"; src: url("${url}"); font-display: swap; }`;
                document.head.appendChild(style);
              }
            })
          );
        }
      } catch (e) {
        if (!cancelled) setError(e as Error);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [loaded, error];
}
