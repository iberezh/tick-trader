interface Props {
  size?: number;
  className?: string;
}

// Brand mark (logo option #22): a hexagon with a centre dot. Inherits `currentColor`.
export function LogoMark({ size = 18, className }: Props) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M16 4l10 6v12l-10 6-10-6V10z" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="16" r="3.5" fill="currentColor" />
    </svg>
  );
}
