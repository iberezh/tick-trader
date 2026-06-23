import { useCallback, useEffect, useRef, useState } from 'react';
import type { DrawSegment } from '@/lib/draw';
import type { EChartInstance } from '@/lib/echarts';

const PALETTE = ['#00e08f', '#ff5247', '#e9f2ec', '#f5b301', '#5b9bff'] as const;

export type DrawMode = 'line' | 'free';

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
  mode: DrawMode;
  color: string;
  palette: readonly string[];
  toggle: () => void;
  setMode: (m: DrawMode) => void;
  setColor: (c: string) => void;
  undo: () => void;
  clear: () => void;
}

export function useDrawing(chart: EChartInstance | null, storageKey: string | null): Drawing {
  const [segments, setSegments] = useState<DrawSegment[]>([]);
  const [preview, setPreview] = useState<DrawSegment | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<DrawMode>('line');
  const [color, setColor] = useState<string>(PALETTE[0]);
  // Read through refs inside the handlers so changing colour/mode mid-drag doesn't rebind them.
  const colorRef = useRef(color);
  colorRef.current = color;
  const modeRef = useRef(mode);
  modeRef.current = mode;

  // Reload when the account/symbol key changes; each pair keeps its own shapes.
  useEffect(() => {
    setSegments(storageKey ? load(storageKey) : []);
    setPreview(null);
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(segments));
    } catch {
      // storage unavailable — shapes simply won't persist
    }
  }, [segments, storageKey]);

  // Pointer drag → a [timestamp, price] polyline: 2 points in line mode, many in free mode.
  useEffect(() => {
    if (!chart || !enabled) {
      setPreview(null); // drop any half-drawn shape when the pen is toggled off
      return;
    }
    const dom = chart.getDom();
    let stroke: [number, number][] | null = null; // anchors captured for the active drag
    let raf = 0;

    const toData = (e: PointerEvent): [number, number] | null => {
      const p = chart.convertFromPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [e.offsetX, e.offsetY]);
      if (Array.isArray(p) && p.length === 2) {
        const [x, y] = p;
        if (typeof x === 'number' && typeof y === 'number') return [x, y];
      }
      return null;
    };
    const flush = () => {
      raf = 0;
      if (stroke) setPreview({ id: 'preview', color: colorRef.current, points: [...stroke] });
    };
    const down = (e: PointerEvent) => {
      const p = toData(e);
      stroke = p ? [p] : null;
    };
    const move = (e: PointerEvent) => {
      if (!stroke) return;
      const p = toData(e);
      const start = stroke[0];
      if (!p || !start) return;
      if (modeRef.current === 'free') {
        stroke.push(p); // accumulate the freehand path, repaint at most once per frame
        if (!raf) raf = requestAnimationFrame(flush);
      } else {
        setPreview({ id: 'preview', color: colorRef.current, points: [start, p] });
      }
    };
    const up = (e: PointerEvent) => {
      if (!stroke) return;
      const start = stroke[0];
      const end = toData(e);
      let points: [number, number][] | null = null;
      if (modeRef.current === 'free') {
        if (end) stroke.push(end);
        if (stroke.length >= 2) points = [...stroke];
      } else if (start && end && (end[0] !== start[0] || end[1] !== start[1])) {
        points = [start, end];
      }
      if (points) {
        setSegments((prev) => [
          ...prev,
          { id: crypto.randomUUID(), color: colorRef.current, points },
        ]);
      }
      stroke = null;
      setPreview(null);
    };
    // pointercancel (touch interrupt, focus loss) aborts the drag without committing.
    const cancel = () => {
      stroke = null;
      setPreview(null);
    };
    dom.addEventListener('pointerdown', down);
    dom.addEventListener('pointermove', move);
    dom.addEventListener('pointerup', up);
    dom.addEventListener('pointercancel', cancel);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      dom.removeEventListener('pointerdown', down);
      dom.removeEventListener('pointermove', move);
      dom.removeEventListener('pointerup', up);
      dom.removeEventListener('pointercancel', cancel);
    };
  }, [chart, enabled]);

  const toggle = useCallback(() => setEnabled((v) => !v), []);
  const undo = useCallback(() => {
    setSegments((prev) => prev.slice(0, -1));
    setPreview(null);
  }, []);
  const clear = useCallback(() => {
    setSegments([]);
    setPreview(null);
  }, []);

  return {
    segments,
    preview,
    enabled,
    mode,
    color,
    palette: PALETTE,
    toggle,
    setMode,
    setColor,
    undo,
    clear,
  };
}
