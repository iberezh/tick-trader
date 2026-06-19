import type { LabelHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: reusable primitive; callers associate it via htmlFor
    <label className={cn('text-xs font-medium text-muted-foreground', className)} {...props} />
  );
}
