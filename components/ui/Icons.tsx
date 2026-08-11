import type { SVGProps } from "react";

/**
 * Rounded, chunky line icons — no emoji anywhere in the product.
 * Every icon inherits `currentColor` so it can sit on any clay tone.
 */

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 22, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const PlaneIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M10.5 13.5 3.5 11.2a.6.6 0 0 1-.1-1.1l1.9-1.1a1 1 0 0 1 .8-.1l2.6.8 4.1-2.4-6-3.4a.6.6 0 0 1 0-1l1.6-.9a1 1 0 0 1 .9 0l8 2.9 2.3-1.3a2 2 0 0 1 2 3.5l-2.3 1.3-.5 8.4a1 1 0 0 1-.5.8l-1.6.9a.6.6 0 0 1-.9-.5l-.6-6.9-4.1 2.4.1 2.7a1 1 0 0 1-.4.7L8.9 19a.6.6 0 0 1-.9-.6l1-3z" />
  </Base>
);

export const SearchIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-3.6-3.6" />
  </Base>
);

export const BellIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M18 15.5V11a6 6 0 0 0-12 0v4.5L4.6 17a.8.8 0 0 0 .6 1.3h13.6a.8.8 0 0 0 .6-1.3z" />
    <path d="M10 21a2.4 2.4 0 0 0 4 0" />
  </Base>
);

export const SettingsIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3.2 13.4 5a1 1 0 0 0 1 .4l2.2-.4.9 2-1.5 1.6a1 1 0 0 0-.2 1l.7 2.1-2 1.1v2.2l-2.1.7a1 1 0 0 0-.8.7L10.9 21l-2-1-1.7 1.2-1.6-1.6.5-2.2a1 1 0 0 0-.3-1L4 14.9l1-2 2.2-.3a1 1 0 0 0 .8-.6l.8-2.1 2.2.2z" />
  </Base>
);

export const SparkIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3.5c.6 3.6 1.9 5 5.5 5.5-3.6.6-4.9 1.9-5.5 5.5-.6-3.6-1.9-4.9-5.5-5.5 3.6-.5 4.9-1.9 5.5-5.5Z" />
    <path d="M18 15c.3 1.9 1 2.6 2.9 2.9-1.9.3-2.6 1-2.9 2.9-.3-1.9-1-2.6-2.9-2.9 1.9-.3 2.6-1 2.9-2.9Z" />
  </Base>
);

export const CalendarIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="4" />
    <path d="M3.5 10h17M8.5 3.5v3M15.5 3.5v3" />
  </Base>
);

export const UsersIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="9.5" cy="9" r="3.4" />
    <path d="M3.8 19.2a5.8 5.8 0 0 1 11.4 0" />
    <path d="M16 6.2a3.2 3.2 0 0 1 0 6M17.6 14.2a5.4 5.4 0 0 1 3 4.4" />
  </Base>
);

export const WalletIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6H17a3 3 0 0 1 3 3v7.5a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" />
    <path d="M4 9V7.4a2 2 0 0 1 1.5-1.9L15 3.6" />
    <circle cx="16" cy="13" r="1.3" fill="currentColor" stroke="none" />
  </Base>
);

export const CheckIcon = (p: IconProps) => (
  <Base strokeWidth={2.8} {...p}>
    <path d="m5 12.5 4.4 4.3L19 7" />
  </Base>
);

export const BookmarkIcon = ({
  filled = false,
  ...p
}: IconProps & { filled?: boolean }) => (
  <Base {...p}>
    <path
      d="M6.5 4.8h11a1.5 1.5 0 0 1 1.5 1.5v13.2a.8.8 0 0 1-1.2.7L12 16.6l-5.8 3.6a.8.8 0 0 1-1.2-.7V6.3a1.5 1.5 0 0 1 1.5-1.5Z"
      fill={filled ? "currentColor" : "none"}
    />
  </Base>
);

export const ChevronLeftIcon = (p: IconProps) => (
  <Base strokeWidth={2.4} {...p}>
    <path d="M14.5 5.5 8 12l6.5 6.5" />
  </Base>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Base strokeWidth={2.4} {...p}>
    <path d="M9.5 5.5 16 12l-6.5 6.5" />
  </Base>
);

export const GlobeIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.4 2.6 3.6 5.4 3.6 8.5s-1.2 5.9-3.6 8.5C9.6 17.9 8.4 15.1 8.4 12S9.6 6.1 12 3.5Z" />
  </Base>
);

export const SuitcaseIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="3.2" y="7.5" width="17.6" height="13" rx="4" />
    <path d="M8.5 7.5V5.8A2.3 2.3 0 0 1 10.8 3.5h2.4a2.3 2.3 0 0 1 2.3 2.3v1.7M9 12v4M15 12v4" />
  </Base>
);

export const FlameIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3.2c3.4 3 5.3 5.7 5.3 8.6a5.3 5.3 0 0 1-10.6 0c0-1.3.5-2.4 1.4-3.3.3 1.2 1 1.9 2 2 .1-2.6.7-4.7 1.9-7.3Z" />
  </Base>
);

export const CameraIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4.5 7.8h2.8l1.4-2.3h6.6l1.4 2.3h2.8a2 2 0 0 1 2 2v8a2.5 2.5 0 0 1-2.5 2.5H5a2.5 2.5 0 0 1-2.5-2.5v-8a2 2 0 0 1 2-2Z" />
    <circle cx="12" cy="13.2" r="3.4" />
  </Base>
);

export const SunIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.8v2M12 19.2v2M4.4 4.4l1.4 1.4M18.2 18.2l1.4 1.4M2.8 12h2M19.2 12h2M4.4 19.6l1.4-1.4M18.2 5.8l1.4-1.4" />
  </Base>
);

export const CloudIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M7.4 18.5a4.4 4.4 0 0 1-.5-8.8 5.4 5.4 0 0 1 10.3 1.1 3.9 3.9 0 0 1-.7 7.7z" />
  </Base>
);

export const MenuIcon = (p: IconProps) => (
  <Base strokeWidth={2.3} {...p}>
    <path d="M4.5 7.5h15M4.5 12h15M4.5 16.5h9" />
  </Base>
);

export const SoundOnIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4.5 9.5h3l4-3.4a.7.7 0 0 1 1.2.5v10.8a.7.7 0 0 1-1.2.5l-4-3.4h-3a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z" />
    <path d="M16.4 9a4.2 4.2 0 0 1 0 6M18.8 6.4a7.6 7.6 0 0 1 0 11.2" />
  </Base>
);

export const SoundOffIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4.5 9.5h3l4-3.4a.7.7 0 0 1 1.2.5v10.8a.7.7 0 0 1-1.2.5l-4-3.4h-3a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z" />
    <path d="m16.5 10 4.5 4.5M21 10l-4.5 4.5" />
  </Base>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Base strokeWidth={2.3} {...p}>
    <path d="M4.5 12h14.5M13.5 6.5 19.5 12l-6 5.5" />
  </Base>
);

export const StarIcon = (p: IconProps) => (
  <Base {...p}>
    <path
      d="m12 4.2 2.3 4.7 5.2.8-3.8 3.6.9 5.1L12 16l-4.6 2.4.9-5.1-3.8-3.6 5.2-.8z"
      fill="currentColor"
      stroke="none"
    />
  </Base>
);

export const PinIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 21c4-4.3 6-7.6 6-10a6 6 0 1 0-12 0c0 2.4 2 5.7 6 10Z" />
    <circle cx="12" cy="10.8" r="2.3" />
  </Base>
);

export const SwapIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4.5 8.5h13M14.5 5.5l3 3-3 3M19.5 15.5h-13M9.5 12.5l-3 3 3 3" />
  </Base>
);

export const PlusIcon = (p: IconProps) => (
  <Base strokeWidth={2.4} {...p}>
    <path d="M12 5.5v13M5.5 12h13" />
  </Base>
);

export const TrendIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 16.5 9.5 11l3.5 3.4L20 7.5" />
    <path d="M20 12V7.5h-4.5" />
  </Base>
);

export const UserIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="8.5" r="3.8" />
    <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
  </Base>
);

export const HomeIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 10.6 12 4l8 6.6" />
    <path d="M6 10.2v7.6A2.2 2.2 0 0 0 8.2 20h7.6a2.2 2.2 0 0 0 2.2-2.2v-7.6" />
    <path d="M10 20v-5h4v5" />
  </Base>
);

export const ClockIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.3" />
    <path d="M12 7.4V12l3.1 2" />
  </Base>
);

export const TrashIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4.8 6.8h14.4M9.6 6.8V5.2a1.6 1.6 0 0 1 1.6-1.6h1.6a1.6 1.6 0 0 1 1.6 1.6v1.6" />
    <path d="M6.6 6.8 7.4 19a2 2 0 0 0 2 1.8h5.2a2 2 0 0 0 2-1.8l.8-12.2" />
  </Base>
);

export const GripIcon = (p: IconProps) => (
  <Base strokeWidth={2.6} {...p}>
    <path d="M9 7h.01M15 7h.01M9 12h.01M15 12h.01M9 17h.01M15 17h.01" />
  </Base>
);

export const ReceiptIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 3.6h12v17l-2.4-1.6-2.4 1.6-2.4-1.6-2.4 1.6L6 20.6z" />
    <path d="M9.4 8.4h5.2M9.4 12.4h5.2" />
  </Base>
);

export const BedIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M3.4 18v-9M3.4 13.2h17.2V18" />
    <path d="M3.4 13.2V9.6h9.8a3.4 3.4 0 0 1 3.4 3.6" />
    <circle cx="7.6" cy="10.4" r="1.8" />
  </Base>
);

export const UtensilsIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M7 3.4v7a2.6 2.6 0 0 0 5.2 0v-7M9.6 10.4V20.6" />
    <path d="M17.4 3.4c-1.6 1.2-2.4 3-2.4 5.4 0 1.8.8 2.8 2.4 3V20.6" />
  </Base>
);

export const TicketIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M3.6 9.4V7.2a1.6 1.6 0 0 1 1.6-1.6h13.6a1.6 1.6 0 0 1 1.6 1.6v2.2a2.6 2.6 0 0 0 0 5.2v2.2a1.6 1.6 0 0 1-1.6 1.6H5.2a1.6 1.6 0 0 1-1.6-1.6v-2.2a2.6 2.6 0 0 0 0-5.2Z" />
    <path d="M13.4 5.6v12.8" strokeDasharray="2 2.4" />
  </Base>
);

export const BagIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M5.4 8.4h13.2l-1.1 10.4a2 2 0 0 1-2 1.8H8.5a2 2 0 0 1-2-1.8z" />
    <path d="M9 8.4V6.6a3 3 0 0 1 6 0v1.8" />
  </Base>
);

export const EditIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4.6 19.4h3.2L18.4 8.8a2.3 2.3 0 0 0-3.2-3.2L4.6 16.2z" />
    <path d="m14.4 6.6 3.2 3.2" />
  </Base>
);

export const RefreshIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M19.4 11.2a7.4 7.4 0 1 0-1 5" />
    <path d="M19.8 5.2v6h-6" />
  </Base>
);

export const ChevronDownIcon = (p: IconProps) => (
  <Base strokeWidth={2.4} {...p}>
    <path d="M5.5 9.5 12 16l6.5-6.5" />
  </Base>
);

export const ChatIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5z" />
    <path d="M8 9h8M8 12.2h5" />
  </Base>
);

export const LocationArrowIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="m4 4 16 6.5-7 2.5-2.5 7z" />
  </Base>
);

export const PiggyBankIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M19 9a4 4 0 0 0-4-4H9a6 6 0 0 0-6 6v3a3 3 0 0 0 3 3h1v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2h4v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2h1a3 3 0 0 0 3-3v-2.5a3.5 3.5 0 0 0-.5-2.5Z" />
    <path d="M16 11h.01" strokeWidth={2.5} />
    <path d="M11 5v2" />
  </Base>
);

export const ShieldIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3s7 3 7 8c0 5.5-4 8.5-7 10-3-1.5-7-4.5-7-10 0-5 7-8 7-8Z" />
  </Base>
);

export const AlertTriangleIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M10.3 3.6a2 2 0 0 1 3.4 0l7.2 12.5A2 2 0 0 1 19.2 19H4.8a2 2 0 0 1-1.7-2.9l7.2-12.5Z" />
    <path d="M12 9v4M12 16h.01" />
  </Base>
);

export const AwardIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="9" r="5" />
    <path d="M8.2 13.4 7 21l5-2.5 5 2.5-1.2-7.6" />
  </Base>
);

export const LightbulbIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-6 6c0 2.2 1.2 4.1 3 5.2V16a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-1.8c1.8-1.1 3-3 3-5.2a6 6 0 0 0-6-6Z" />
  </Base>
);

export const ChartPieIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M21.2 15.9A10 10 0 1 1 8.1 2.8" />
    <path d="M22 12A10 10 0 0 0 12 2v10z" />
  </Base>
);

export const CrownIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="m3 17 2-10 4 4 3-6 3 6 4-4 2 10H3z" />
  </Base>
);

export const BackpackIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="5" y="8" width="14" height="12" rx="3" />
    <path d="M9 8V5a3 3 0 0 1 6 0v3M9 13h6M12 13v4" />
  </Base>
);

export const CarIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 14h16v3a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3z" />
    <path d="M6 14l1.8-4.5A2 2 0 0 1 9.7 8h4.6a2 2 0 0 1 1.9 1.5L18 14" />
    <circle cx="7.5" cy="14" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="16.5" cy="14" r="1.5" fill="currentColor" stroke="none" />
  </Base>
);

export const BoatIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M2 17l2 3h16l2-3H2zM12 3v11M8 7l4-4 4 4" />
  </Base>
);

export const CompassIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m16.2 7.8-2.1 6.3-6.3 2.1 2.1-6.3 6.3-2.1z" />
  </Base>
);

export const BuildingIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M9 8h2M13 8h2M9 12h2M13 12h2M11 16v4" />
  </Base>
);

export const ArrowLeftIcon = (p: IconProps) => (
  <Base strokeWidth={2.3} {...p}>
    <path d="M19.5 12H5M10.5 17.5 4.5 12l6-5.5" />
  </Base>
);

export const InfoIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8h.01M12 12v4" />
  </Base>
);

export const BookOpenIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </Base>
);
