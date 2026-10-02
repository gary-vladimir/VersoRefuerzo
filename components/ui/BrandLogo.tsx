// The VersoRefuerzo mark: an open Bible with a cross at the spine, a
// flashcard with a check rising from it, and rays of light.
//
// Two variants generated from the official artwork (assets/brand):
//   - "gradient" (the brand indigo-to-violet) for light surfaces
//   - "white" for the dark night gradient and colored surfaces
// Imported statically so Next serves them from /_next (no auth middleware
// in the way, even on the signed-out login screen) with intrinsic sizes.

import Image from "next/image";
import logoGradient from "@/assets/brand/logo-gradient.png";
import logoWhite from "@/assets/brand/logo-white.png";

export function BrandLogo({
  size,
  variant = "gradient",
  priority = false,
  className,
  style,
}: {
  // Rendered width in px; height follows the artwork's aspect ratio.
  size: number;
  variant?: "gradient" | "white";
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const src = variant === "white" ? logoWhite : logoGradient;
  return (
    <Image
      src={src}
      alt="VersoRefuerzo"
      width={size}
      height={Math.round((size * src.height) / src.width)}
      priority={priority}
      className={className}
      style={style}
    />
  );
}
