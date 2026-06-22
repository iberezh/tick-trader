import { useCallback, useEffect, useRef, useState } from 'react';
import type { DrawSegment } from '@/lib/chart-theme';
import type { EChartInstance } from '@/lib/echarts';

const PALETTE = ['#00e08f', '#ff5247', '#e9f2ec', '#f5b301', '#5b9bff'] as const;

function load(key: string): DrawSegment[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as DrawSegment[]) : [];
  } catch {
    return [];
  }
}

export interface Drawing {
  segments: DrawSegment[];
  preview: DrawSegment | null;
  enabled: boolean;
  color: string;
  palette: readonly string[];
  toggle: () => void;
  setColor: (c: string) => void;
  undo: () => void;
  clear: () => void;
}

export function useDrawing(chart: EChartInstance | null, storageKey: string | null): Drawing {
  const [segments, setSegments] = useState<DrawSegment[]>([]);
  const [preview, setPreview] = useState<DrawSegment | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [color, setColor] = useState<string>(PALETTE[0]);
  // Read through a ref inside the handlers so changing colour mid-drag doesn't rebind them.
  const colorRef = useRef(color);
  colorRef.current = color;

  // Reload when the account/symbol key changes; each pair keeps its own lines.
  useEffect(() => {
    setSegments(storageKey ? load(storageKey) : []);
    setPreview(null);
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(segments));
    } catch {
      // storage unavailable — lines simply won't persist
    }
  }, [segments, storageKey]);

  // Pointer drag → a segment in [candleIndex, price] space, bound only while the pen is active.
  useEffect(() => {
    if (!chart || !enabled) {
      setPreview(null); // drop any half-drawn line when the pen is toggled off
      return;
    }
    const dom = chart.getDom();
    let start: [number, number] | null = null;

    const toData = (e: PointerEvent): [number, number] | null => {
      const p = chart.convertFromPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [e.offsetX, e.offsetY]);
      if (Array.isArray(p) && p.length === 2) {
        const [x, y] = p;
        if (typeof x === 'number' && typeof y === 'number') return [x, y];
      }
      return null;
    };
    const down = (e: PointerEvent) => {
      start = toData(e);
    };
    const move = (e: PointerEvent) => {
      if (!start) return;
      const end = toData(e);
      if (end) setPreview({ id: 'preview', color: colorRef.current, points: [start, end] });
    };
    const up = (e: PointerEvent) => {
      if (!start) return;
      const end = toData(e);
      if (end && (end[0] !== start[0] || end[1] !== start[1])) {
        setSegments((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            color: colorRef.current,
            points: [start as [number, number], end],
          },
        ]);
      }
      start = null;
      setPreview(null);
    };
    // pointercancel (touch interrupt, focus loss) aborts the drag without committing a line.
    const cancel = () => {
      start = null;
      setPreview(null);
    };
    dom.addEventListener('pointerdown', down);
    dom.addEventListener('pointermove', move);
    dom.addEventListener('pointerup', up);
    dom.addEventListener('pointercancel', cancel);
    return () => {
      dom.removeEventListener('pointerdown', down);
      dom.removeEventListener('pointermove', move);
      dom.removeEventListener('pointerup', up);
      dom.removeEventListener('pointercancel', cancel);
    };
  }, [chart, enabled]);

  const toggle = useCallback(() => setEnabled((v) => !v), []);
  const undo = useCallback(() => setSegments((prev) => prev.slice(0, -1)), []);
  const clear = useCallback(() => setSegments([]), []);

  return { segments, preview, enabled, color, palette: PALETTE, toggle, setColor, undo, clear };
}
