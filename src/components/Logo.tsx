import { SVGProps } from 'react';

/**
 * FavSetter mark — a "messy stack of cards".
 * Square-safe (viewBox 0 0 32 32) so it can also be used as a favicon.
 * Uses currentColor so the parent controls the tint.
 */
export function Logo({ title = 'FavSetter', ...props }: SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      role="img"
      aria-label={title}
      {...props}
    >
      <rect x="5" y="20" width="22" height="6" rx="1.75" opacity="0.45" transform="rotate(-9 16 23)" />
      <rect x="5" y="12.5" width="22" height="6" rx="1.75" opacity="0.72" transform="rotate(5 16 15.5)" />
      <rect x="5" y="5" width="22" height="6" rx="1.75" transform="rotate(-3 16 8)" />
    </svg>
  );
}
