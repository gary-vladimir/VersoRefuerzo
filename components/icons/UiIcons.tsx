// Small UI icons used outside the verse-icon catalog. Same line style.

type Props = {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
};

function Svg({
  size = 20,
  color = "currentColor",
  strokeWidth = 2,
  children,
  className,
}: Props & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  );
}

export const Check = (p: Props) => (
  <Svg {...p}>
    <path d="M5 12l5 5 9-11" />
  </Svg>
);

export const Close = (p: Props) => (
  <Svg {...p}>
    <path d="M6 6l12 12M6 18L18 6" />
  </Svg>
);

export const Plus = (p: Props) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const Sparkles = (p: Props) => (
  <Svg {...p}>
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
    <path d="M19 14l.7 2 2 .7-2 .7L19 19l-.7-1.6-2-.7 2-.7L19 14z" />
  </Svg>
);

export const BookSmall = (p: Props) => (
  <Svg {...p}>
    <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 0-2 2V5z" />
    <path d="M4 5v15" />
  </Svg>
);

export const AlertCircle = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v6M12 17h.01" />
  </Svg>
);
