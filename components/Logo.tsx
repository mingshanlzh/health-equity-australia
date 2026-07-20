export default function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="44" height="44" rx="12" fill="currentColor" opacity="0.12" />
      <rect x="2" y="2" width="44" height="44" rx="12" stroke="currentColor" strokeWidth="2.5" opacity="0.9" />
      {/* equals sign — equity */}
      <rect x="13" y="17" width="22" height="4.5" rx="2.25" fill="currentColor" />
      <rect x="13" y="26.5" width="22" height="4.5" rx="2.25" fill="currentColor" />
      {/* pulse line — health */}
      <path
        d="M8 39.5h9l3-5 4 8 4-11 3 8h9"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.85"
      />
    </svg>
  );
}
