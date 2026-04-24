# VaultCredit

**Privacy-preserving on-chain credit scoring powered by Zama's Fully Homomorphic Encryption.**

VaultCredit lets users submit their financial data and receive a credit score computed entirely on-chain — without ever exposing their raw income, debt, or payment history to anyone. Not to the smart contract owner. Not to block explorers. Not to lenders. Only the encrypted score lives on-chain, and only the user holds the key to read it.

---

## The Problem

Traditional credit scoring requires you to hand your most sensitive financial data to a third party who can store, sell, or leak it. DeFi lending protocols are even worse: everything is public on-chain by default. A user who wants a credit score must either trust an off-chain oracle (centralised, opaque) or publish their financial data for the entire world to see.

Neither option is acceptable.

---

## How FHE Solves It

**Fully Homomorphic Encryption (FHE)** allows computation on encrypted data without decrypting it first. The result of the computation is itself encrypted and can only be decrypted by the holder of the private key.

VaultCredit uses Zama's [fhEVM](https://docs.zama.ai/fhevm) library to run credit-score arithmetic **directly inside the Ethereum smart contract** on FHE ciphertexts:

```
encrypted(income) → [contract does: score += income / 1000] → encrypted(score)
```

At no point is any plaintext produced on-chain. The EVM coprocessor handles the FHE operations; the smart contract stores only the resulting ciphertext handle.

### Scoring formula (all operations in FHE)

| Factor | Effect |
|---|---|
| Monthly income | +1 pt per $1,000 (capped at +150) |
| Total debt | −1 pt per $2,000 (capped at −200) |
| Missed payments (last 12 mo.) | −20 pts each (capped at 12 payments) |
| Months employed | +2 pts per month (capped at 60 months) |
| Base score | 500 |
| Range | 300 – 850 |

### Lender threshold check

A lender can ask "does this borrower's score meet my minimum?" by submitting their own **encrypted threshold**. The contract returns an **encrypted boolean** — the lender decrypts only `true` or `false`, never the actual score value.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Solidity 0.8.24 + [Zama fhEVM](https://github.com/zama-ai/fhevm) |
| FHE operations | `TFHE.sol` — add, sub, mul, div, min, cmux, ge |
| Dev environment | Hardhat 2.22 |
| Frontend | React 18 + Vite 5 |
| Client-side encryption | fhevmjs 0.5 |
| Wallet connection | ethers.js v6 (generic `window.ethereum`) |
| Network | Ethereum Sepolia testnet |

---

## Project Structure

```
VaultCredit/
├── contracts/
│   └── VaultCredit.sol        # FHE credit scoring contract
├── scripts/
│   └── deploy.js              # Deployment + optional Etherscan verification
├── hardhat.config.js
├── package.json               # Hardhat project
├── .env.example
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ConnectWallet.jsx  # Page 1 — wallet connection
    │   │   ├── CreditForm.jsx     # Page 2 — encrypt & submit data
    │   │   └── ScoreDisplay.jsx   # Page 3 — transaction result
    │   ├── App.jsx
    │   ├── App.css
    │   ├── abi.js             # Contract ABI
    │   ├── config.js          # Network & fhEVM config
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json           # Frontend project
```

---

## Setup

### Prerequisites

- Node.js ≥ 18
- A wallet with Sepolia ETH ([faucet](https://sepoliafaucet.com/))
- An RPC URL for Sepolia (Infura, Alchemy, or the free Ankr public endpoint)

### 1 — Install root dependencies (Hardhat)

```bash
cd VaultCredit
cp .env.example .env
# Edit .env with your PRIVATE_KEY and SEPOLIA_RPC_URL
npm install
```

### 2 — Compile the contract

```bash
npm run compile
```

You should see:

```
Compiling 1 Solidity file
Successfully compiled 1 Solidity file
```

### 3 — Deploy to Sepolia

```bash
npm run deploy:sepolia
```

The script prints your deployed contract address. Copy it.

### 4 — Configure the frontend

```bash
cd frontend
cp .env.example .env
# Set VITE_CONTRACT_ADDRESS=<address from step 3>
# Set VITE_SEPOLIA_RPC_URL=<your RPC URL>
```

### 5 — Run the frontend

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in a browser with a Web3 wallet installed.

---

## Using the App

1. **Connect Wallet** — click "Connect Wallet". Rabby, MetaMask, and any EIP-1193 wallet works. The app will prompt you to switch to Sepolia if you're on a different network.

2. **Submit Financial Data** — fill in:
   - Monthly income (USD)
   - Total debt (USD)
   - Missed payments in the last 12 months (0–12)
   - Months employed at your current job

   Click **Encrypt & Submit**. fhevmjs encrypts all four values client-side under the network's FHE public key. The wallet pops a transaction signature request — the calldata contains only ciphertexts.

3. **Score Result** — once the transaction confirms, your encrypted score is stored on Sepolia. You can view the transaction on Etherscan, click "Update Score" to re-submit, or share your wallet address with a lender for a threshold check.

---

## Smart Contract Interface

```solidity
// User submits encrypted financial data
function submitFinancialData(
    einput encryptedIncome,
    einput encryptedDebt,
    einput encryptedMissedPayments,
    einput encryptedEmploymentMonths,
    bytes calldata inputProof
) external;

// Lender checks if score meets an encrypted threshold
// Returns encrypted bool — lender never sees the actual score
function checkCreditThreshold(
    address user,
    einput encryptedThreshold,
    bytes calldata inputProof
) external returns (ebool);

// Returns encrypted score handle (user must be ACL-allowed to decrypt)
function getEncryptedScore(address user) external view returns (euint32);

function hasScore(address user) external view returns (bool);
function getLastUpdated(address user) external view returns (uint256);
```

---

## Key Security Properties

- **Zero plaintext on-chain** — income, debt, missed payments, employment months, and the computed score never appear in plaintext in any transaction, log, or storage slot.
- **Lender privacy** — the threshold submitted by a lender is also encrypted. Neither the borrower's score nor the lender's minimum is exposed.
- **User-controlled decryption** — `TFHE.allow(score, msg.sender)` in the contract grants only the submitting wallet the right to decrypt their own score via the Zama gateway.
- **Overflow-safe arithmetic** — every subtraction is guarded by a `TFHE.cmux` underflow check; inputs are capped before multiplication.

---

## Environment Variables

### Root `.env`

| Variable | Description |
|---|---|
| `PRIVATE_KEY` | Deployer wallet private key (no 0x prefix required) |
| `SEPOLIA_RPC_URL` | Sepolia JSON-RPC endpoint |
| `ETHERSCAN_API_KEY` | For automatic contract verification (optional) |

### `frontend/.env`

| Variable | Description |
|---|---|
| `VITE_CONTRACT_ADDRESS` | Deployed VaultCredit contract address |
| `VITE_SEPOLIA_RPC_URL` | Sepolia RPC URL for fhevmjs instance |

---

## License

MIT
