// ABI for VaultCredit.sol (@fhevm/solidity API)
// externalEuint32 → bytes32 in ABI  (encrypted input handle from fhevmjs)
// euint32          → uint256 in ABI  (encrypted storage value, user-defined type wrapping uint256)
// ebool            → uint256 in ABI

export const VAULT_CREDIT_ABI = [
  // User submits 4 encrypted fields + shared ZK proof
  "function submitFinancialData(bytes32 encryptedIncome, bytes32 encryptedDebt, bytes32 encryptedMissedPayments, bytes32 encryptedEmploymentMonths, bytes calldata inputProof) external",

  // Lender threshold check — returns encrypted boolean (uint256 handle)
  "function checkCreditThreshold(address user, bytes32 encryptedThreshold, bytes calldata inputProof) external returns (uint256)",

  // View helpers
  "function hasScore(address user) external view returns (bool)",
  "function getEncryptedScore(address user) external view returns (uint256)",
  "function getLastUpdated(address user) external view returns (uint256)",

  // Events
  "event ScoreComputed(address indexed user, uint256 timestamp)",
  "event ThresholdChecked(address indexed lender, address indexed user, uint256 timestamp)",
];
