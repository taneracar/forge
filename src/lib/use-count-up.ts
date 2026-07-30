import { useEffect, useRef, useState } from "react";

/** Tweens from the previous value to `target` over `durationMs` instead of snapping. */
export function useCountUp(target: number, durationMs = 400): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;

    let frame: number;
    const start = Date.now();

    function tick() {
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / durationMs);
      // Ease-out so it settles rather than stopping abruptly.
      const eased = 1 - (1 - progress) * (1 - progress);
      setValue(from + (target - from) * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    }
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return value;
}
