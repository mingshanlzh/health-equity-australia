export default function Logo({ size = 34 }: { size?: number }) {
  // Brand mark: the "equity bars" — matches the site favicon.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="8" y="14" width="32" height="8" rx="4" fill="currentColor" />
      <rect x="8" y="26" width="32" height="8" rx="4" fill="#E7A33E" />
    </svg>
  );
}
