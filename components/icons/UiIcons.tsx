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

export const Dots = (p: Props) => (
  <Svg {...p}>
    <circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none" />
  </Svg>
);

export const Bulb = (p: Props) => (
  <Svg {...p}>
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 0 0-4 10c.7.7 1 1.6 1 2.5h6c0-.9.3-1.8 1-2.5A6 6 0 0 0 12 3z" />
  </Svg>
);

export const Eye = (p: Props) => (
  <Svg {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

export const Pencil = (p: Props) => (
  <Svg {...p}>
    <path d="M4 20h4L18 10l-4-4L4 16v4z" />
    <path d="M13.5 6.5l4 4" />
  </Svg>
);

export const Trash = (p: Props) => (
  <Svg {...p}>
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
    <path d="M10 11v6M14 11v6" />
  </Svg>
);

export const Refresh = (p: Props) => (
  <Svg {...p}>
    <path d="M21 12a9 9 0 1 1-2.6-6.4" />
    <path d="M21 3v5h-5" />
  </Svg>
);

export const Search = (p: Props) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </Svg>
);

export const Chevron = (p: Props) => (
  <Svg {...p}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
);

export const Heart = (p: Props) => (
  <Svg {...p}>
    <path d="M12 21s-7-4.5-9.5-9.5C0.5 7 4 3 7.5 3c2 0 3.5 1 4.5 2.5C13 4 14.5 3 16.5 3 20 3 23.5 7 21.5 11.5 19 16.5 12 21 12 21z" />
  </Svg>
);

export const HeartFilled = (p: Props) => (
  <Svg {...p}>
    <path
      d="M12 21s-7-4.5-9.5-9.5C0.5 7 4 3 7.5 3c2 0 3.5 1 4.5 2.5C13 4 14.5 3 16.5 3 20 3 23.5 7 21.5 11.5 19 16.5 12 21 12 21z"
      fill="currentColor"
    />
  </Svg>
);
