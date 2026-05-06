function VaultLogo({ className = "" }) {
  return (
    <svg
      width="22"
      height="28"
      viewBox="0 0 22 28"
      fill="none"
      className={`vault-logo${className ? ` ${className}` : ""}`}
      aria-hidden="true"
    >
      <path
        d="M11 1L2 5.5V13C2 19.5 6 25.5 11 27.5C16 25.5 20 19.5 20 13V5.5L11 1Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <path
        d="M7.5 11L11 17.5L14.5 11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default VaultLogo;
