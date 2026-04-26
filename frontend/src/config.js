// ─── Network ────────────────────────────────────────────────────────────────
export const SEPOLIA_CHAIN_ID = 11155111n;
export const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7";

// ─── Contract ────────────────────────────────────────────────────────────────
// Fallback to the deployed address so a missing Vercel env var never silently
// routes calls to a wrong address (e.g. a Zama system contract).
export const CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS ||
  "0x80Eb34D15D2f116493fe682F600840BA83F46A3d";

// ─── RPC (read-only queries: events, view calls) ──────────────────────────────
export const SEPOLIA_RPC_URL =
  import.meta.env.VITE_SEPOLIA_RPC_URL || "https://rpc.sepolia.org";

// ─── Zama fhEVM ───────────────────────────────────────────────────────────────
// Config provided by SepoliaConfig from @zama-fhe/relayer-sdk.
// The relayer at relayer.testnet.zama.org handles public key distribution and
// ZK proof verification.
