import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 22, ...rest }: P) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...rest,
  };
}

export const QrIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="7" height="7" rx="1.4" />
    <rect x="14" y="3" width="7" height="7" rx="1.4" />
    <rect x="3" y="14" width="7" height="7" rx="1.4" />
    <path d="M14 14h3v3h-3zM20 14v.01M17 20v.01M20.5 17.5l.01.01M14 20.5h.01M20 21l-2.5-2.5" />
  </svg>
);

export const CameraIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 8.5C4 7.1 5.1 6 6.5 6h1l1.2-2h6.6L16.5 6h1C18.9 6 20 7.1 20 8.5v8c0 1.4-1.1 2.5-2.5 2.5h-11C5.1 19 4 17.9 4 16.5v-8Z" />
    <circle cx="12" cy="12.4" r="3.4" />
    <path d="M17.2 8.8v.01" strokeWidth="2.6" />
  </svg>
);

export const GalleryIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
    <circle cx="9" cy="10" r="1.8" />
    <path d="M4.5 17.5 10 13l3.5 3 3-2.5 3 3.5" />
  </svg>
);

export const PinchIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M9.5 11.5V5.8a1.8 1.8 0 0 1 3.6 0v5" />
    <path d="M13.1 10.4V8.2a1.7 1.7 0 0 1 3.4 0v3.6c1.5.6 2.5 2 2.5 3.9 0 2.9-2.3 4.8-5.4 4.8-2.6 0-4-1-5.6-3.3L6 14.6c-.6-.9-.3-1.9.5-2.3.8-.5 1.7-.2 2.3.6l.7 1" />
    <path d="M5.5 3.5 4 5l1.5 1.5M18.5 3.5 20 5l-1.5 1.5" />
  </svg>
);

export const PenIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="m14.5 5.5 4 4L8 20l-4.6 1L4.5 16 14.5 5.5Z" />
    <path d="m12.5 7.5 4 4" />
  </svg>
);

export const SparkIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.5c.5 4.6 1.9 6 6.5 6.5-4.6.5-6 1.9-6.5 6.5-.5-4.6-1.9-6-6.5-6.5 4.6-.5 6-1.9 6.5-6.5Z" />
    <path d="M18.8 15.5c.25 2 .9 2.65 2.9 2.9-2 .25-2.65.9-2.9 2.9-.25-2-.9-2.65-2.9-2.9 2-.25 2.65-.9 2.9-2.9Z" />
  </svg>
);

export const PrinterIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 8V3.5h10V8" />
    <path d="M7 17H4.8C3.8 17 3 16.2 3 15.2v-5.4C3 8.8 3.8 8 4.8 8h14.4c1 0 1.8.8 1.8 1.8v5.4c0 1-.8 1.8-1.8 1.8H17" />
    <rect x="7" y="14" width="10" height="6.5" rx="1" />
    <path d="M6.2 11h.01M9.2 17.2h5.6" />
  </svg>
);

export const PhoneIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="6.5" y="2.5" width="11" height="19" rx="2.6" />
    <path d="M10.5 5h3M11 18.5h2" />
  </svg>
);

export const BoltIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M13 2.5 5 13.5h5.5L10 21.5l8-11h-5.5L13 2.5Z" />
  </svg>
);

export const HeartIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 20s-7.5-4.6-8.7-9.6C2.5 7 4.6 4.5 7.4 4.5c2 0 3.6 1.2 4.6 2.8 1-1.6 2.6-2.8 4.6-2.8 2.8 0 4.9 2.5 4.1 5.9C19.5 15.4 12 20 12 20Z" />
  </svg>
);

export const StarIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="m12 3.2 2.5 5.4 5.9.7-4.4 4 1.2 5.8L12 16.2l-5.2 2.9L8 13.3l-4.4-4 5.9-.7L12 3.2Z" />
  </svg>
);

export const FlowerIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="2.6" />
    <path d="M12 9.4c-2.4 0-3.4-2-2.4-3.9.9-1.8 3.9-1.8 4.8 0 1 1.9 0 3.9-2.4 3.9ZM14.6 12c0-2.4 2-3.4 3.9-2.4 1.8.9 1.8 3.9 0 4.8-1.9 1-3.9 0-3.9-2.4ZM12 14.6c2.4 0 3.4 2 2.4 3.9-.9 1.8-3.9 1.8-4.8 0-1-1.9 0-3.9 2.4-3.9ZM9.4 12c0 2.4-2 3.4-3.9 2.4-1.8-.9-1.8-3.9 0-4.8 1.9-1 3.9 0 3.9 2.4Z" />
  </svg>
);

export const SwirlIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 12c0-1.6 1.3-2.6 2.7-2.2 1.7.4 2.5 2.2 1.8 3.9-.9 2.2-3.6 3-5.8 2-2.8-1.2-3.8-4.6-2.4-7.3C9.8 5.4 13.6 4.6 16.5 6.3c3.4 2 4.5 6.5 2.3 9.8" />
  </svg>
);

export const KeyIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="8" cy="15.5" r="4.5" />
    <path d="m11.5 12.5 8-8M17 7l2.5 2.5M14.5 9.5 17 12" />
  </svg>
);

export const ShieldIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 2.8 4.5 5.5v6c0 4.6 3.2 8 7.5 9.7 4.3-1.7 7.5-5.1 7.5-9.7v-6L12 2.8Z" />
    <path d="m8.8 11.8 2.3 2.3 4.3-4.6" />
  </svg>
);

export const UserIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="3.8" />
    <path d="M4.5 20.5c.8-3.7 3.8-5.8 7.5-5.8s6.7 2.1 7.5 5.8" />
  </svg>
);

export const SendIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M20.5 3.5 3.5 10l6.5 2.5L12.5 19l8-15.5Z" />
    <path d="M10 12.5 20.5 3.5" />
  </svg>
);

export const ZoomInIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m20.5 20.5-5.4-5.4M10.5 8v5M8 10.5h5" />
  </svg>
);

export const ZoomOutIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m20.5 20.5-5.4-5.4M8 10.5h5" />
  </svg>
);

export const RotateIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 8a8.4 8.4 0 0 1 14.7-1.5L21 9" />
    <path d="M21 4.5V9h-4.5M19.5 16a8.4 8.4 0 0 1-14.7 1.5L3 15" />
    <path d="M3 19.5V15h4.5" />
  </svg>
);

export const ResetIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.5a8.5 8.5 0 1 1-8 5.6" />
    <path d="M4 4.5v4.6h4.6" />
    <circle cx="12" cy="12" r="1.4" />
  </svg>
);

export const CheckIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="m4.5 12.5 5 5L19.5 6.5" />
  </svg>
);

export const XIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="m5.5 5.5 13 13M18.5 5.5l-13 13" />
  </svg>
);

export const DownloadIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.5v11M7.5 10 12 14.5 16.5 10" />
    <path d="M4.5 16.5v2.5c0 .8.7 1.5 1.5 1.5h12c.8 0 1.5-.7 1.5-1.5v-2.5" />
  </svg>
);

export const TrashIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 6.5h14M9.5 6V4.5c0-.6.4-1 1-1h3c.6 0 1 .4 1 1V6" />
    <path d="M6.5 6.5 7.4 19c.05.8.7 1.5 1.6 1.5h6c.9 0 1.55-.7 1.6-1.5l.9-12.5" />
    <path d="M10 10.5v6M14 10.5v6" />
  </svg>
);

export const UsbIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 21V7" />
    <path d="m12 7-2.5 3h5L12 7ZM12 21a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Z" />
    <path d="M12 14.5H8.2c-.7 0-1.2-.5-1.2-1.2V11M7 8.5 5.4 10 7 11.5M12 12h3.8c.7 0 1.2.5 1.2 1.2V15a1.7 1.7 0 1 0 1.2 1.6" />
  </svg>
);

export const WifiIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 9.5c5.2-4.6 12.8-4.6 18 0M6.2 13c3.4-3 8.2-3 11.6 0M9.4 16.4c1.5-1.3 3.7-1.3 5.2 0" />
    <circle cx="12" cy="19.3" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);

export const ImageIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="2.4" />
    <path d="M8.5 10.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6ZM4 18.5 10 13l3.5 3 3-2.5 3.5 4" />
  </svg>
);

export const LockIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="5" y="10.5" width="14" height="10" rx="2" />
    <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
    <path d="M12 14.5v2.5" />
  </svg>
);

export const AlertTriangleIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.5 3.5 20h17L12 3.5Z" />
    <path d="M12 9v4M12 16h.01" />
  </svg>
);

export const ArrowDownIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4v15M5.5 12.5 12 19l6.5-6.5" />
  </svg>
);

export const ArrowRightIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 12h15M13 5.5 19.5 12 13 18.5" />
  </svg>
);

export const CopyIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="8.5" y="8.5" width="12" height="12" rx="2" />
    <path d="M15.5 5.5v-1c0-.6-.4-1-1-1h-10c-.6 0-1 .4-1 1v10c0 .6.4 1 1 1h1" />
  </svg>
);

export const TerminalIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="2.5" y="4" width="19" height="16" rx="2.5" />
    <path d="m6.5 9 3 3-3 3M12.5 15.5h5" />
  </svg>
);

export const LogoMark = ({ size = 34, ...rest }: P) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" {...rest}>
    <rect x="6" y="6" width="36" height="36" rx="11" fill="#7cc24b" stroke="#1e2b22" strokeWidth="2.5" />
    <rect x="13" y="11" width="22" height="14" rx="3" fill="#fbf6ea" stroke="#1e2b22" strokeWidth="2.2" />
    <circle cx="20" cy="18" r="2" fill="#1e2b22" />
    <circle cx="28" cy="18" r="2" fill="#1e2b22" />
    <rect x="15" y="27" width="18" height="11" rx="2.5" fill="#f5873c" stroke="#1e2b22" strokeWidth="2.2" />
    <path d="M18.5 31.5c1 1.6 2.2 2.4 3.5 2.4s2.5-.8 3.5-2.4" stroke="#1e2b22" strokeWidth="2" strokeLinecap="round" />
    <circle cx="39" cy="10" r="5" fill="#f5873c" stroke="#1e2b22" strokeWidth="2.2" />
    <path d="M39 7.6v2.4l1.7 1" stroke="#1e2b22" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
