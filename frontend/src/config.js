// ─── Network ────────────────────────────────────────────────────────────────
export const SEPOLIA_CHAIN_ID = 11155111n;
export const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7";

// ─── Contract ────────────────────────────────────────────────────────────────
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";

// ─── RPC (read-only queries: events, view calls) ──────────────────────────────
export const SEPOLIA_RPC_URL =
  import.meta.env.VITE_SEPOLIA_RPC_URL || "https://rpc.sepolia.org";

// ─── Zama fhEVM ───────────────────────────────────────────────────────────────
// Config provided by SepoliaConfig from @zama-fhe/relayer-sdk.
// The relayer at relayer.testnet.zama.org handles public key distribution and
// ZK proof verification.
