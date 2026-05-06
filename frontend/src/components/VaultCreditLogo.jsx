export default function VaultCreditLogo({ iconSize = 28, fontSize = 18, gap = 8 }) {
  return (
    <span className="vc-logo" style={{ gap }}>
      <svg width={iconSize} height={iconSize} viewBox="0 0 22 26" fill="none" aria-hidden="true">
        <path
          d="M11 1L2 5V12C2 18.5 6.5 23.5 11 25.5C15.5 23.5 20 18.5 20 12V5L11 1Z"
          fill="#1D4ED8"
          fillOpacity="0.12"
          stroke="#1D4ED8"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M7.5 9L11 17L14.5 9"
          stroke="#1D4ED8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="vc-logo-text" style={{ fontSize }}>
        <span className="vc-logo-vault">Vault</span>
        <span className="vc-logo-credit">Credit</span>
      </span>
    </span>
  );
}
