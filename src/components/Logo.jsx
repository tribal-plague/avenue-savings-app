export default function Logo({ size = 28, className = '' }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 245 245"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block', flexShrink: 0 }}
    >
      <rect width="244.046" height="65.9176" fill="currentColor" />
      <rect y="197.225" width="244.046" height="65.9176" transform="rotate(-45 0 197.225)" fill="currentColor" />
      <rect x="178.124" y="244.046" width="244.046" height="65.9176" transform="rotate(-90 178.124 244.046)" fill="currentColor" />
    </svg>
  )
}
