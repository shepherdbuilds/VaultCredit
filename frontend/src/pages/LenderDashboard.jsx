import { useState } from "react";
import { BrowserProvider, Contract, getAddress } from "ethers";
import { createInstance, SepoliaConfig, initSDK } from "@zama-fhe/relayer-sdk/web";
import { CONTRACT_ADDRESS } from "../config";
import { VAULT_CREDIT_ABI } from "../abi";

const STEPS = [
  "Initializing FHE engine…",
  "Connecting to Zama relayer…",
  "Encrypting threshold with FHE…",
  "Sending verification request…",
  "Waiting for on-chain confirmation…",
];

function LenderDashboard({ walletAddress }) {
  const [borrower, setBorrower] = useState("");
  const [threshold, setThreshold] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    // Validation
    let checksumBorrower;
    try {
      checksumBorrower = getAddress(borrower.trim());
    } catch {
      return setError("Invalid borrower address. Enter a valid Ethereum address.");
    }

    const thresh = parseInt(threshold, 10);
    if (isNaN(thresh) || thresh < 0 || thresh > 4294967295)
      return setError("Threshold must be a non-negative integer (0 – 4,294,967,295).");

    if (!CONTRACT_ADDRESS)
      return setError("Contract address not set. Add VITE_CONTRACT_ADDRESS to frontend/.env.");

    setLoading(true);
    setStep(0);

    try {
      // Step 0 — load WASM
      await initSDK();

      // Step 1 — connect to relayer
      setStep(1);
      const instance = await createInstance({
        ...SepoliaConfig,
        network: window.ethereum,
      });

      // Step 2 — encrypt threshold
      setStep(2);
      const checksumContract = getAddress(CONTRACT_ADDRESS);
      const checksumLender = getAddress(walletAddress);

      const input = instance.createEncryptedInput(checksumContract, checksumLender);
      input.add32(thresh);
      const { handles, inputProof } = await input.encrypt();

      // Step 3 — send transaction
      setStep(3);
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, VAULT_CREDIT_ABI, signer);

      // Check if borrower has a score first
      const hasScore = await contract.hasScore(checksumBorrower);
      if (!hasScore) {
        throw new Error("This address has no credit score on-chain yet.");
      }

      const tx = await contract.checkCreditThreshold(
        checksumBorrower,
        handles[0],
        inputProof
      );

      // Step 4 — wait for confirmation
      setStep(4);
      const receipt = await tx.wait();

      setResult({
        txHash: receipt.hash,
        blockNumber: Number(receipt.blockNumber),
        borrower: checksumBorrower,
        threshold: thresh,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("LenderDashboard error:", err);
      if (err.code === 4001 || err.code === "ACTION_REJECTED") {
        setError("Transaction rejected by user.");
      } else {
        setError(err.reason || err.message || "Transaction failed. Check console for details.");
      }
    } finally {
      setLoading(false);
      setStep(0);
    }
  };

  if (result) {
    const shortHash = `${result.txHash.slice(0, 12)}…${result.txHash.slice(-8)}`;
    const shortBorrower = `${result.borrower.slice(0, 8)}…${result.borrower.slice(-6)}`;
    return (
      <div className="page lender-result-page">
        <div className="success-header">
          <div className="success-badge">
            <span className="success-dot" />
            Confirmed
          </div>
          <h2 className="page-title">Threshold Check Submitted</h2>
          <p className="page-subtitle">
            The contract evaluated whether the borrower's encrypted score meets
            your threshold. The result is an encrypted boolean — no raw score
            was revealed.
          </p>
        </div>

        <div className="result-card">
          <div className="result-row">
            <span className="result-label">Borrower</span>
            <a
              className="result-link"
              href={`https://sepolia.etherscan.io/address/${result.borrower}`}
              target="_blank"
              rel="noopener noreferrer"
              title={result.borrower}
            >
              {shortBorrower} ↗
            </a>
          </div>
          <div className="result-row">
            <span className="result-label">Threshold</span>
            <span className="result-value">{result.threshold.toLocaleString()}</span>
          </div>
          <div className="result-row">
            <span className="result-label">Transaction</span>
            <a
              className="result-link"
              href={`https://sepolia.etherscan.io/tx/${result.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              title={result.txHash}
            >
              {shortHash} ↗
            </a>
          </div>
          <div className="result-row">
            <span className="result-label">Block</span>
            <span className="result-value">#{result.blockNumber.toLocaleString()}</span>
          </div>
          <div className="result-row">
            <span className="result-label">Submitted at</span>
            <span className="result-value">
              {new Date(result.timestamp).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="info-section">
          <p className="info-section-title">What happened</p>
          <ul className="info-list">
            <li>
              The threshold value was encrypted client-side before submission.
              The contract received only FHE ciphertexts.
            </li>
            <li>
              The contract compared the borrower's encrypted score against your
              encrypted threshold and emitted a <code>ThresholdChecked</code> event.
            </li>
            <li>
              The encrypted boolean result is stored on-chain. Decryption
              requires the borrower's cooperation via the Zama gateway.
            </li>
          </ul>
        </div>

        <div className="action-row">
          <button
            className="btn btn-secondary"
            onClick={() => setResult(null)}
          >
            Check Another
          </button>
          <a
            className="btn btn-primary"
            href={`https://sepolia.etherscan.io/tx/${result.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Etherscan ↗
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="page lender-page">
      <div className="page-header">
        <h2 className="page-title">Lender Dashboard</h2>
        <p className="page-subtitle">
          Enter a borrower's wallet address and a credit score threshold. The
          contract will verify whether the borrower's encrypted score meets your
          requirement — without revealing the actual score.
        </p>
      </div>

      <div className="wallet-badge">
        <span className="wallet-dot" />
        {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
      </div>

      <form onSubmit={handleSubmit} className="credit-form">
        <div className="form-group">
          <label htmlFor="borrowerAddress">Borrower Wallet Address</label>
          <input
            id="borrowerAddress"
            name="borrowerAddress"
            type="text"
            placeholder="0x…"
            value={borrower}
            onChange={(e) => setBorrower(e.target.value)}
            required
            disabled={loading}
            autoComplete="off"
            spellCheck={false}
          />
          <span className="field-hint">The Ethereum address that submitted a credit score</span>
        </div>

        <div className="form-group">
          <label htmlFor="threshold">Score Threshold</label>
          <input
            id="threshold"
            name="threshold"
            type="number"
            placeholder="e.g. 650"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            min="0"
            max="4294967295"
            required
            disabled={loading}
          />
          <span className="field-hint">
            Minimum score required (the contract checks: borrower score ≥ threshold)
          </span>
        </div>

        {error && <div className="error-box">{error}</div>}

        {loading && (
          <div className="loading-box">
            <span className="spinner" />
            <span>{STEPS[step]}</span>
          </div>
        )}

        <div className="info-card" style={{ marginBottom: 0 }}>
          The threshold is encrypted with FHE before sending. The smart contract
          evaluates the comparison entirely on ciphertexts — the borrower's score
          is never exposed during verification.
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner" />
              Processing…
            </>
          ) : (
            "Verify Borrower"
          )}
        </button>
      </form>
    </div>
  );
}

export default LenderDashboard;
