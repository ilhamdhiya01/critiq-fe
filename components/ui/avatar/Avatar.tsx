import Image from "next/image";
import React, { forwardRef } from "react";
import { tv } from "tailwind-variants";

import { getAvatarColor, getInitials } from "@/lib/helpers/avatar.helper";

const avatar = tv({
  base: "flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold",
  variants: {
    size: {
      xs: "h-5.5 w-5.5 text-[9px]",
      sm: "h-6.5 w-6.5 text-[9.5px]",
      md: "h-7 w-7 text-[10px]",
      lg: "h-7.5 w-7.5 text-[11px]",
    },
  },
  defaultVariants: { size: "xs" },
});

const PIXELS = { xs: 22, sm: 26, md: 28, lg: 30 } as const;

interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  size?: keyof typeof PIXELS;
  src?: string | null;
  // Overrides the colour derived from `name` (bg + text classes).
  colorClass?: string;
}

// Initials avatar. Uses the person's own initials — never the viewer's
// account image — unless an explicit `src` is passed.
const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(
  ({ name, size = "xs", src, colorClass, className, ...props }, ref) => (
    <span
      ref={ref}
      title={name}
      className={avatar({
        size,
        className: [
          colorClass ?? `${getAvatarColor(name)} text-neutral-50`,
          className,
        ]
          .filter(Boolean)
          .join(" "),
      })}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          width={PIXELS[size]}
          height={PIXELS[size]}
          className="h-full w-full object-cover"
        />
      ) : (
        getInitials(name)
      )}
    </span>
  ),
);

Avatar.displayName = "Avatar";

export default Avatar;
