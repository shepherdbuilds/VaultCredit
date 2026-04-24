# VaultCredit

**Privacy-preserving credit scoring on-chain. Your financial data is mathematically invisible — even to the protocol.**

[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity)](https://soliditylang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Sepolia](https://img.shields.io/badge/Network-Sepolia-627EEA?logo=ethereum)](https://sepolia.etherscan.io/)
[![Zama fhEVM](https://img.shields.io/badge/Zama-fhEVM-FF6B35)](https://www.zama.ai/fhevm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Contract:** [`0xb0d7580baE00750F060F0B719925fD2C03EE434f`](https://sepolia.etherscan.io/address/0xb0d7580baE00750F060F0B719925fD2C03EE434f) · Sepolia Testnet

---

## The Problem

DeFi lending today is broken by design when it comes to privacy.

**Overcollateralization is a workaround, not a solution.** Protocols like Aave and Compound require borrowers to lock up more collateral than they borrow precisely because they have no way to assess creditworthiness privately. The underlying problem is not technical — it is informational. Creditworthiness requires financial data. Financial data is sensitive. And on-chain, everything is public.

The existing alternatives are all bad:

- **Traditional credit bureaus** (Equifax, Experian, TransUnion) aggregate raw financial data in centralized databases that have been repeatedly breached. The 2017 Equifax hack exposed 147 million people's financial histories. Putting this model on-chain does not fix it — it makes the data permanent, public, and immutable forever.
- **Sharing data on-chain** defeats the purpose entirely. Posting your income and debt history to a public blockchain to access a loan is a privacy disaster. Once on-chain, that data is permanent, searchable, and indexable by anyone.
- **Trusted oracles and off-chain computation** reintroduce centralization and trust assumptions. You are back to "trust us" — which is antithetical to the entire premise of DeFi.

There has been no solution that computes credit scores without exposing the underlying data — until now.

---

## The Solution

VaultCredit uses **Fully Homomorphic Encryption (FHE)** via [Zama's fhEVM](https://www.zama.ai/fhevm) to compute credit scores entirely on encrypted inputs, directly inside a smart contract.

Here is what that means in practice:

1. **Your data is encrypted in your browser** before it is ever sent anywhere. Your income, total debt, payment history, and employment tenure are encrypted client-side using the network's FHE public key. The encrypted ciphertexts — not the raw values — are what gets submitted to the blockchain.

2. **The smart contract performs arithmetic on ciphertexts.** Addition, subtraction, multiplication, comparison — all of it runs on encrypted values without ever decrypting them. The contract never sees plaintext at any point during execution.

3. **The encrypted score is stored on-chain.** No one — not the contract owner, not a node operator, not a block explorer — can read the stored value. It is a ciphertext handle that is only decryptable by the holder of the corresponding FHE decryption key: you.

4. **Lenders query thresholds, not scores.** When a lender wants to verify creditworthiness, they submit an encrypted threshold (e.g., 650). The contract evaluates `score ≥ threshold` entirely in FHE and returns an **encrypted boolean**. The lender learns pass or fail. They never learn the actual score.

No middleman. No data exposure. No trust required.

---

## How FHE Works (Plain English)

Normal encryption works like a safe. You lock your data, ship it somewhere, and it can only be used after someone unlocks it with the key. The problem: to do any computation on the data, you have to unlock it first — which means someone, somewhere, has to see the plaintext.

**Fully Homomorphic Encryption breaks this constraint.**

FHE allows you to perform arbitrary computations on encrypted data and get an encrypted result — without ever decrypting anything in between. It is mathematically equivalent to doing the computation on the plaintext, but the computation happens entirely in the encrypted domain.

Think of it like this: you put a number in a sealed, tamper-proof envelope. You hand the envelope to a computer. The computer does math on the sealed envelope — adds to it, multiplies it, compares it — and hands you back a sealed envelope containing the answer. Neither the computer nor anyone watching ever sees what is inside. You open the final envelope with your key and get the result.

VaultCredit applies this to credit scoring. The inputs go into the envelope in your browser. The smart contract does the math on sealed envelopes. The result — your encrypted score — comes out still sealed. The only person who can open it is you.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Client)                    │
│                                                         │
│  User fills form → @zama-fhe/relayer-sdk encrypts      │
│  income, debt, missed payments, employment months       │
│  using the Sepolia FHE public key via the relayer       │
│                                                         │
│  Output: 4× euint32 ciphertext handles + inputProof    │
└───────────────────────────┬─────────────────────────────┘
                            │  eth_sendRawTransaction
                            ▼
┌─────────────────────────────────────────────────────────┐
│              VaultCredit.sol (Sepolia)                  │
│                                                         │
│  submitFinancialData(h0, h1, h2, h3, inputProof)       │
│                                                         │
│  FHE.fromExternal()  →  validates ZK proof             │
│  _computeScore()     →  runs entirely in FHE:          │
│                                                         │
│    score = 500 (base)                                   │
│           + min(income ÷ 1000,  150)   ← income bonus  │
│           − min(debt   ÷ 2000,  200)   ← debt penalty  │
│           − min(missed,  12) × 20      ← payment hist  │
│           + min(months,  60) × 2       ← employment    │
│             clamped to [300, 850]                       │
│                                                         │
│  profiles[msg.sender].score = encrypted_result        │
│  emit ScoreComputed(user, timestamp)                   │
└──────────────────┬────────────────────┬────────────────┘
                   │                    │
          Borrower │                    │ Lender
                   ▼                    ▼
   ┌───────────────────┐   ┌─────────────────────────────┐
   │  Decrypt own      │   │  checkCreditThreshold(      │
   │  score via Zama   │   │    borrower,                │
   │  gateway (FHE     │   │    encryptedThreshold,      │
   │  decryption key)  │   │    inputProof               │
   │                   │   │  )                          │
   │  Score stays      │   │  FHE.ge(score, threshold)   │
   │  encrypted until  │   │  Returns: ebool (encrypted) │
   │  user requests    │   │  Lender gets pass/fail only │
   └───────────────────┘   └─────────────────────────────┘
```

### Scoring Formula

The algorithm is open and deterministic. The *weights* are public knowledge — only the *inputs* are private.

| Factor | Calculation | Max Impact |
|---|---|---|
| Base score | 500 (constant) | — |
| Monthly income | `+ min(income ÷ $1,000, 150)` | +150 pts |
| Total debt | `− min(debt ÷ $2,000, 200)` | −200 pts |
| Missed payments | `− min(count, 12) × 20` | −240 pts |
| Employment tenure | `+ min(months, 60) × 2` | +120 pts |
| **Range** | `clamp(score, 300, 850)` | **300 – 850** |

All arithmetic — including division, min, subtraction, and multiplication — runs inside the FHE coprocessor on ciphertexts. Underflow is prevented using `FHE.select()` guards rather than plaintext branches, ensuring the score never wraps below 300 regardless of input values.

---

## Features

### Borrower Flow
- Connect any EIP-1193 wallet (Rabby, MetaMask, Coinbase, or any injected provider)
- Automatic Sepolia network detection and chain switching via `wallet_switchEthereumChain`
- Client-side FHE encryption via `@zama-fhe/relayer-sdk` — all four inputs share one bundled ZK proof
- Step-by-step progress UI: WASM init → relayer connect → encrypt → submit → confirm
- Full submission history per wallet sourced from `ScoreComputed` on-chain events

### Lender Flow
- Dedicated lender dashboard with borrower address and minimum score threshold inputs
- `hasScore()` pre-check before sending a transaction — reverts early if borrower has no profile
- Threshold encrypted client-side before submission — lender's required score is also private
- Encrypted boolean result returned and verifiable on-chain via `ThresholdChecked` event

### Protocol Transparency
- Live stats on landing page: total scores computed, unique wallets, deployed contract address
- All `ScoreComputed` and `ThresholdChecked` events are publicly verifiable on Etherscan
- Scoring algorithm weights are public constants in the contract — auditable by anyone

### UI
- Mercury-style minimal interface — no decorative gradients, no distracting elements
- Multi-wallet modal with per-wallet presence detection
- Fully responsive from 320px to widescreen

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart contract | Solidity `^0.8.24` + Zama `@fhevm/solidity ^0.11.1` |
| FHE operations | `FHE.sol` — `add`, `sub`, `mul`, `div`, `min`, `ge`, `select`, `allow`, `allowTransient` |
| Development | Hardhat `^2.22.8` + `@nomicfoundation/hardhat-toolbox` |
| Frontend | React 18 + Vite 5 |
| Wallet integration | ethers.js v6 — `BrowserProvider`, `Contract`, `JsonRpcProvider` |
| FHE client SDK | `@zama-fhe/relayer-sdk/web` — WASM-based, Cloudflare-backed relayer |
| Node polyfills | `vite-plugin-node-polyfills` — Buffer + process for WASM modules |
| Network | Ethereum Sepolia Testnet (Chain ID: 11155111) |

---

## Smart Contract

**Address:** [`0xb0d7580baE00750F060F0B719925fD2C03EE434f`](https://sepolia.etherscan.io/address/0xb0d7580baE00750F060F0B719925fD2C03EE434f)  
**Network:** Ethereum Sepolia Testnet (Chain ID: 11155111)  
**Compiler:** Solidity 0.8.24  
**Inherits:** `ZamaEthereumConfig` — auto-configures the FHE coprocessor, KMS, and ACL contract addresses for Sepolia

### `submitFinancialData`

```solidity
function submitFinancialData(
    externalEuint32 encryptedIncome,
    externalEuint32 encryptedDebt,
    externalEuint32 encryptedMissedPayments,
    externalEuint32 encryptedEmploymentMonths,
    bytes calldata inputProof
) external
```

The borrower entry point. Accepts four `externalEuint32` ciphertext handles and a single bundled ZK proof covering all four values. `FHE.fromExternal()` verifies the proof in one coprocessor round trip and promotes the handles to typed `euint32` values. `_computeScore()` then runs the full scoring formula in FHE — no intermediate plaintext is produced at any step. The resulting encrypted score is stored in `profiles[msg.sender]`, ACL access is granted to the sender (for gateway decryption), and `ScoreComputed` is emitted.

### `checkCreditThreshold`

```solidity
function checkCreditThreshold(
    address user,
    externalEuint32 encryptedThreshold,
    bytes calldata inputProof
) external returns (ebool)
```

The lender entry point. Takes a borrower address and an encrypted minimum score threshold. Reverts if the borrower has no credit profile. Evaluates `FHE.ge(score, threshold)` — a fully encrypted comparison — and returns the encrypted boolean result. The caller is granted transient ACL access to decrypt the result within the transaction. Neither the score nor the threshold is ever revealed to any party.

### `hasScore`

```solidity
function hasScore(address user) external view returns (bool)
```

Returns whether an address has a stored credit profile. Used by the frontend to pre-validate lender requests and avoid wasting gas on a guaranteed revert.

### `getEncryptedScore`

```solidity
function getEncryptedScore(address user) external view returns (euint32)
```

Returns the raw `euint32` ciphertext handle. The caller must hold ACL permission (i.e., be the score owner) to decrypt it via the Zama gateway. Reverts if no score exists.

### `getLastUpdated`

```solidity
function getLastUpdated(address user) external view returns (uint256)
```

Returns the `block.timestamp` of the most recent `submitFinancialData` call for the given address.

### Events

```solidity
event ScoreComputed(address indexed user, uint256 timestamp);
event ThresholdChecked(address indexed lender, address indexed user, uint256 timestamp);
```

`ScoreComputed` is indexed by `user`, enabling efficient per-wallet history queries via:

```js
contract.queryFilter(contract.filters.ScoreComputed(walletAddress))
```

---

## Setup

### Prerequisites

- Node.js ≥ 18
- A Sepolia RPC URL (Alchemy, Infura, or Ankr)
- A wallet with Sepolia ETH — get some at [sepoliafaucet.com](https://sepoliafaucet.com)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/VaultCredit.git
cd VaultCredit
```

### 2. Install dependencies

```bash
# Root (Hardhat + contract tooling)
npm install

# Frontend
cd frontend && npm install && cd ..
```

### 3. Configure the deployer environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Private key of the deployer wallet (no 0x prefix)
PRIVATE_KEY=your_deployer_private_key

# Sepolia RPC endpoint
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

> `.env` is listed in `.gitignore` and is never committed.

### 4. Compile

```bash
npx hardhat compile
```

### 5. Deploy to Sepolia

```bash
npm run deploy:sepolia
```

Note the deployed contract address from the output.

### 6. Configure the frontend

```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env`:

```env
# Address from the deployment step above
VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress

# Public Sepolia RPC for event queries (read-only, no key required)
VITE_SEPOLIA_RPC_URL=https://rpc.ankr.com/eth_sepolia
```

### 7. Start the dev server

```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Available scripts

| Location | Command | Description |
|---|---|---|
| Root | `npm run compile` | Compile Solidity with Hardhat |
| Root | `npm run test` | Run Hardhat test suite |
| Root | `npm run deploy:sepolia` | Deploy VaultCredit to Sepolia |
| Root | `npm run clean` | Clear Hardhat artifacts and cache |
| `frontend/` | `npm run dev` | Start Vite dev server |
| `frontend/` | `npm run build` | Production build |

---

## Security Considerations

### What is private

| Data | On-chain visibility |
|---|---|
| Monthly income | Encrypted — ciphertext only |
| Total debt | Encrypted — ciphertext only |
| Missed payments | Encrypted — ciphertext only |
| Employment tenure | Encrypted — ciphertext only |
| Credit score | Encrypted — FHE ciphertext handle |
| Lender's threshold | Encrypted — ciphertext only |
| Threshold result (pass/fail) | Encrypted boolean — decryptable only by the lender |

### What is public

| Data | Visibility |
|---|---|
| Scoring algorithm weights | Public constants in the contract source |
| `ScoreComputed` event | Address + timestamp only — no score value |
| `ThresholdChecked` event | Lender address, borrower address, timestamp |
| Contract balance | Zero — no ETH is held |

### Design decisions

- **Private keys** are only read from `.env` at deploy time and are never stored on-chain, in the frontend bundle, or anywhere in the repository
- **`.env` is gitignored** — only `.env.example` is committed
- **All four inputs share one ZK proof**, generated and verified in a single coprocessor round trip via `FHE.fromExternal()`, preventing mismatched ciphertext submissions
- **ACL enforcement** — the Zama FHE coprocessor tracks per-handle access permissions; only addresses explicitly granted access via `FHE.allow()` or `FHE.allowTransient()` can request decryption
- **No admin keys** — the contract has no `owner`, no `pause()`, no upgrade proxy, and no privileged functions. Once deployed, it is fully immutable and permissionless

---

## Known Attack Vectors & Mitigations

### Sybil attacks — fresh wallet score inflation

**Vector:** A borrower creates a fresh wallet, reports minimal debt and maximum employment months, and submits optimistic financial data to obtain an inflated score before applying for a loan.

**Current state:** The v1 protocol accepts self-reported data. This is intentional — the v1 scope demonstrates the FHE mechanics and architecture, not production-grade lending underwriting.

**Phase 2 mitigation:** Integration with [Worldcoin World ID](https://worldcoin.org/world-id) to enforce unique-human verification at the wallet level. Each World ID proof binds a single real human identity to one credit profile, making Sybil attacks economically infeasible regardless of wallet count.

### Data accuracy — fabricated inputs

**Vector:** A borrower submits false financial data — overstating income, understating debt — to obtain a higher score than warranted.

**Current state:** Without an oracle or attestation layer, the contract cannot distinguish accurate from fabricated inputs.

**Phase 2 mitigation:** ZK proofs of bank API data (via Plaid or equivalent) to attest that the encrypted values correspond to verified external sources — without exposing the raw values. The ZK proof guarantees the data is real; the FHE encryption ensures it stays private.

### Front-running threshold checks

**Vector:** A miner or MEV bot front-runs a lender's threshold transaction and attempts to infer information about the score.

**Mitigation:** The threshold value is encrypted before submission. Even a successful front-run reveals nothing — the ciphertext is opaque without the FHE decryption key. The encrypted boolean result is further protected by `FHE.allowTransient()`, granting decryption access only to the original transaction sender within that transaction's scope.

---

## Roadmap

### Phase 2 — Identity & Verified Data

- **Worldcoin / World ID** — one proof-of-humanity per credit profile, eliminating Sybil attacks at the identity layer
- **ZK-verified income attestations** — borrowers prove income from a real bank account without revealing the account or amount to anyone except the FHE coprocessor
- **Score history with decay** — time-weighted recomputation so stale financial data loses influence over time

### Phase 3 — On-Chain Lending

- **Under-collateralized loan origination** — lenders define pools with minimum score thresholds; borrowers who pass the encrypted check can draw without posting collateral above their credit limit
- **FHE-priced interest rates** — rates computed from encrypted score bands without revealing which band a borrower falls into
- **Multi-chain deployment** — Ethereum mainnet and L2s as Zama fhEVM support expands

### Phase 4 — Governance

- **DAO-governed scoring parameters** — token holders vote on algorithm weights; changes take effect in the next deployed contract version
- **Auditor ACL grants** — credit methodology auditable by permissioned third parties without access to individual user data

---

## License

MIT — see [LICENSE](LICENSE).

---

## Acknowledgements

Built with [Zama fhEVM](https://www.zama.ai/fhevm) — the Fully Homomorphic Encryption coprocessor for EVM-compatible blockchains. The `@fhevm/solidity` library, `@zama-fhe/relayer-sdk`, and the Sepolia testnet infrastructure are all Zama projects.
