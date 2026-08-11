"use client";

import { TONES, shade } from "@/lib/tones";
import {
  AVATARS,
  DEFAULT_AVATAR_ID,
  getAvatar,
  type AvatarSpec,
} from "@/lib/avatars";

export { AVATARS, DEFAULT_AVATAR_ID, getAvatar };
export type { AvatarSpec };

/* ------------------------------------------------------------------ */
/* Clay traveler avatars                                               */
/*                                                                     */
/* One renderer, twelve configurations. Every face is built from the   */
/* same moulded parts, which is what makes the set feel like a family  */
/* rather than twelve unrelated drawings.                              */
/* ------------------------------------------------------------------ */

export interface ClayAvatarProps {
  /** avatar id, or undefined to fall back to initials */
  id?: string;
  size?: number;
  className?: string;
  /** shown when no avatar id matches — e.g. "SR" */
  initials?: string;
  ring?: boolean;
}

export function ClayAvatar({
  id,
  size = 56,
  className = "",
  initials,
  ring = false,
}: ClayAvatarProps) {
  const known = AVATARS.some((avatar) => avatar.id === id);

  if (!known && initials) {
    return (
      <span
        style={{ width: size, height: size, fontSize: size * 0.34 }}
        className={`flex items-center justify-center rounded-full bg-clay-lilac font-display font-bold text-clay-ink shadow-clay-xs ${className}`}
      >
        {initials}
      </span>
    );
  }

  const spec = getAvatar(id);
  const bg = TONES[spec.bg].hex;

  return (
    <span
      style={{ width: size, height: size }}
      className={`inline-block overflow-hidden rounded-full shadow-clay-xs ${
        ring ? "ring-4 ring-clay-surface" : ""
      } ${className}`}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        <AvatarArt spec={spec} bg={bg} />
      </svg>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* The parts                                                           */
/* ------------------------------------------------------------------ */

function AvatarArt({ spec, bg }: { spec: AvatarSpec; bg: string }) {
  const shadow = shade(spec.skin, -0.22);
  const hairBack = shade(spec.hair.color, -0.12);

  return (
    <g>
      {/* background */}
      <circle cx="50" cy="50" r="50" fill={bg} />
      <ellipse cx="32" cy="24" rx="22" ry="12" fill="#ffffff" opacity="0.28" />

      {/* hair behind the head */}
      {spec.hair.style === "afro" && (
        <circle cx="50" cy="42" r="32" fill={hairBack} />
      )}
      {spec.hair.style === "long" && (
        <path d="M20 46c0-18 13-30 30-30s30 12 30 30v34H20z" fill={hairBack} />
      )}
      {spec.hair.style === "braids" && (
        <>
          <path d="M20 46c0-18 13-30 30-30s30 12 30 30v10H20z" fill={hairBack} />
          <rect x="16" y="46" width="12" height="34" rx="6" fill={hairBack} />
          <rect x="72" y="46" width="12" height="34" rx="6" fill={hairBack} />
          <circle cx="22" cy="80" r="4" fill={spec.top} />
          <circle cx="78" cy="80" r="4" fill={spec.top} />
        </>
      )}
      {spec.hair.style === "bun" && (
        <circle cx="50" cy="17" r="11" fill={hairBack} />
      )}

      {/* shoulders */}
      <path d="M18 100c0-15 14-24 32-24s32 9 32 24z" fill={spec.top} />
      <path
        d="M50 76c18 0 32 9 32 24H62c0-9-5-18-12-24z"
        fill={shade(spec.top, -0.18)}
      />
      {/* neck */}
      <rect x="42" y="62" width="16" height="18" rx="8" fill={shadow} />

      {/* head */}
      <circle cx="50" cy="46" r="26" fill={spec.skin} />
      <path d="M50 20a26 26 0 0 1 0 52c9-14 9-38 0-52Z" fill={shadow} opacity="0.5" />

      {/* hair in front */}
      {spec.hair.style === "short" && (
        <path d="M24 44c0-15 12-25 26-25s26 10 26 25c-4-9-13-13-26-13S28 35 24 44Z" fill={spec.hair.color} />
      )}
      {(spec.hair.style === "long" || spec.hair.style === "braids") && (
        <path d="M24 46c0-16 12-27 26-27s26 11 26 27c-5-11-14-15-26-15S29 35 24 46Z" fill={spec.hair.color} />
      )}
      {spec.hair.style === "bun" && (
        <path d="M25 42c0-14 11-24 25-24s25 10 25 24c-5-10-14-14-25-14s-20 4-25 14Z" fill={spec.hair.color} />
      )}
      {spec.hair.style === "curly" && (
        <g fill={spec.hair.color}>
          <circle cx="32" cy="30" r="10" />
          <circle cx="44" cy="23" r="11" />
          <circle cx="57" cy="23" r="11" />
          <circle cx="68" cy="31" r="10" />
        </g>
      )}
      {spec.hair.style === "afro" && (
        <path d="M24 42c0-16 12-26 26-26s26 10 26 26c-6-10-15-14-26-14s-20 4-26 14Z" fill={spec.hair.color} />
      )}

      {/* hats */}
      {spec.hat.style === "sun" && (
        <>
          <ellipse cx="50" cy="34" rx="42" ry="10" fill={spec.hat.color} />
          <path d="M28 34c0-13 10-22 22-22s22 9 22 22Z" fill={shade(spec.hat.color, 0.15)} />
          <rect x="28" y="30" width="44" height="6" rx="3" fill={shade(spec.hat.color, -0.2)} />
        </>
      )}
      {spec.hat.style === "beanie" && (
        <>
          <path d="M24 34c0-15 12-25 26-25s26 10 26 25Z" fill={spec.hat.color} />
          <rect x="22" y="30" width="56" height="9" rx="4.5" fill={shade(spec.hat.color, -0.2)} />
          <circle cx="50" cy="9" r="6" fill={shade(spec.hat.color, 0.25)} />
        </>
      )}
      {spec.hat.style === "cap" && (
        <>
          <path d="M25 33c0-14 11-24 25-24s25 10 25 24Z" fill={spec.hat.color} />
          <rect x="25" y="29" width="50" height="7" rx="3.5" fill={shade(spec.hat.color, -0.15)} />
          <path d="M75 30c11 0 18 3 20 7H73z" fill={shade(spec.hat.color, -0.25)} />
        </>
      )}
      {spec.hat.style === "bandana" && (
        <>
          <path d="M24 33c0-14 12-24 26-24s26 10 26 24Z" fill={spec.hat.color} />
          <rect x="23" y="28" width="54" height="8" rx="4" fill={shade(spec.hat.color, -0.18)} />
          <path d="M77 30l10-4-3 9z" fill={shade(spec.hat.color, -0.1)} />
        </>
      )}
      {spec.hat.style === "turban" && (
        <>
          <path d="M22 36c0-17 13-29 28-29s28 12 28 29Z" fill={spec.hat.color} />
          <path d="M24 30c8-6 18-9 26-9s18 3 26 9" stroke={shade(spec.hat.color, -0.25)} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M26 22c7-5 15-8 24-8s17 3 24 8" stroke={shade(spec.hat.color, 0.2)} strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* face */}
      <FaceFeatures spec={spec} shadow={shadow} />

      {/* accessories drawn over the face */}
      {spec.accessory === "glasses" && (
        <g stroke="#3a2a22" strokeWidth="2.4" fill="none" opacity="0.85">
          <circle cx="40" cy="47" r="8.5" fill="#ffffff" fillOpacity="0.35" />
          <circle cx="60" cy="47" r="8.5" fill="#ffffff" fillOpacity="0.35" />
          <path d="M48.5 47h3M31.5 45l-5-2M68.5 45l5-2" />
        </g>
      )}
      {spec.accessory === "shades" && (
        <g>
          <rect x="30" y="41" width="18" height="12" rx="5" fill="#3a2a22" />
          <rect x="52" y="41" width="18" height="12" rx="5" fill="#3a2a22" />
          <path d="M48 46h4" stroke="#3a2a22" strokeWidth="3" />
          <path d="M26.5 43l3.5-1M73.5 43L70 42" stroke="#3a2a22" strokeWidth="2.4" strokeLinecap="round" />
          <rect x="32" y="43" width="6" height="3" rx="1.5" fill="#ffffff" opacity="0.4" />
        </g>
      )}
      {spec.accessory === "headphones" && (
        <g>
          <path d="M22 48a28 28 0 0 1 56 0" stroke="#4a3a30" strokeWidth="5" fill="none" strokeLinecap="round" />
          <rect x="15" y="44" width="12" height="18" rx="6" fill="#4a3a30" />
          <rect x="73" y="44" width="12" height="18" rx="6" fill="#4a3a30" />
          <rect x="17.5" y="47" width="7" height="6" rx="3" fill={spec.top} />
          <rect x="75.5" y="47" width="7" height="6" rx="3" fill={spec.top} />
        </g>
      )}
      {spec.accessory === "earrings" && (
        <g fill={shade(spec.top, -0.15)}>
          <circle cx="24" cy="52" r="4" />
          <circle cx="76" cy="52" r="4" />
        </g>
      )}
    </g>
  );
}

function FaceFeatures({ spec, shadow }: { spec: AvatarSpec; shadow: string }) {
  const cheek = shade(spec.skin, -0.28);

  return (
    <g>
      {spec.beard && (
        <path
          d="M28 48c0 16 10 26 22 26s22-10 22-26c-3 10-11 15-22 15S31 58 28 48Z"
          fill={spec.hair.color}
          opacity="0.92"
        />
      )}

      {/* eyes */}
      <circle cx="40" cy="47" r="3.6" fill="#3a2a22" />
      <circle cx="60" cy="47" r="3.6" fill="#3a2a22" />
      <circle cx="41.2" cy="45.8" r="1.3" fill="#ffffff" />
      <circle cx="61.2" cy="45.8" r="1.3" fill="#ffffff" />

      {/* brows */}
      <path
        d="M35 40.5c2-2 6-2 8-0.6M57 39.9c2-1.4 6-1.4 8 0.6"
        stroke={shade(spec.hair.color, -0.1)}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.8"
      />

      {/* cheeks */}
      <ellipse cx="33" cy="55" rx="5.5" ry="3.4" fill={cheek} opacity="0.35" />
      <ellipse cx="67" cy="55" rx="5.5" ry="3.4" fill={cheek} opacity="0.35" />

      {/* nose + smile */}
      <path d="M50 50v4" stroke={shadow} strokeWidth="2.2" strokeLinecap="round" opacity="0.6" />
      <path
        d="M44 58c3 3.6 9 3.6 12 0"
        stroke="#3a2a22"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
    </g>
  );
}
