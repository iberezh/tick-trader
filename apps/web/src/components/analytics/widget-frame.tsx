import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  legend?: ReactNode;
  onRemove: () => void;
  children: ReactNode;
}

// Card chrome around every grid widget. The header doubles as the drag handle
// (RGL `draggableHandle=".drag-handle"`); the remove button opts out of dragging.
export function WidgetFrame({ title, legend, onRemove, children }: Props) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card">
      <div className="drag-handle flex cursor-move items-center gap-2 border-b px-3 py-1.5">
        <span className="font-mono text-xs text-muted-foreground">{title}</span>
        <span className="ml-auto flex items-center gap-3 text-[10px]">{legend}</span>
        <button
          type="button"
          aria-label="Remove widget"
          onClick={onRemove}
          onMouseDown={(e) => e.stopPropagation()}
          className="text-muted-foreground transition-colors hover:text-down"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="min-h-0 flex-1 p-2">{children}</div>
    </div>
  );
}
