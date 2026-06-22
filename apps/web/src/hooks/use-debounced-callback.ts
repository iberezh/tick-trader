import { type DependencyList, useEffect, useMemo, useRef } from 'react';

// Returns a stable wrapper that defers calling `fn` until `delay` ms after its last call.
// Used so a dragged slider updates its thumb on every move but only commits (and triggers
// refetches) once the user pauses — keeps the board from refetching on every pixel.
export function useDebouncedCallback<A extends DependencyList>(
  fn: (...args: A) => void,
  delay: number,
): (...args: A) => void {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return useMemo(
    () =>
      (...args: A): void => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => fnRef.current(...args), delay);
      },
    [delay],
  );
}
