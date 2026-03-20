import * as React from "react";

type IconProps = React.SVGProps<SVGSVGElement> & {
  title?: string;
};

function BaseIcon({ title, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M9 18l6-6-6-6" />
    </BaseIcon>
  );
}

export function IconLock(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </BaseIcon>
  );
}

export function IconUsers(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </BaseIcon>
  );
}

export function IconHeart(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </BaseIcon>
  );
}

export function IconMessageCircle(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H6l-3 3v-6.5A8.5 8.5 0 1 1 21 11.5z" />
    </BaseIcon>
  );
}

export function IconHands(props: IconProps) {
  // Abstract “prayed” icon (non-emoji): two hands outline.
  return (
    <BaseIcon {...props}>
      <path d="M7 20l-1-8 3-6 2 2-2 4" />
      <path d="M17 20l1-8-3-6-2 2 2 4" />
      <path d="M10 6l2-2 2 2" />
    </BaseIcon>
  );
}

export function IconFeather(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M20.24 12.24a6 6 0 0 0-8.48-8.48L5 10.52V19h8.48z" />
      <path d="M16 8L2 22" />
      <path d="M17.5 15H9" />
    </BaseIcon>
  );
}

export function IconFilm(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 5v14" />
      <path d="M17 5v14" />
      <path d="M3 9h4" />
      <path d="M17 9h4" />
      <path d="M3 15h4" />
      <path d="M17 15h4" />
    </BaseIcon>
  );
}

export function IconCross(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 2v20" />
      <path d="M6 7h12" />
    </BaseIcon>
  );
}

export function IconGlobe(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </BaseIcon>
  );
}

export function IconVolumeX(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </BaseIcon>
  );
}

export function IconVolume2(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </BaseIcon>
  );
}

export function IconBookmark(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </BaseIcon>
  );
}

export function IconShare2(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5l6.8 3.9M15.4 6.6L8.6 10.5" />
    </BaseIcon>
  );
}

