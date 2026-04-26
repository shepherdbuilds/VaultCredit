import { useState } from "react";
import { BrowserProvider, Contract, getAddress } from "ethers";
import { CONTRACT_ADDRESS } from "../config";
import { VAULT_CREDIT_ABI } from "../abi";

const STEPS = [
  "Connecting to VaultCredit…",
  "Sending transaction…",
  "Waiting for on-chain confirmation…",
];

function CreditForm({ walletAddress, onSubmit }) {
  const [form, setForm] = useState({
    monthlyIncome: "",
    totalDebt: "",
    missedPayments: "",
    employmentMonths: "",
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // ── Validation ────────────────────────────────────────────────────────
    const income = parseInt(form.monthlyIncome, 10);
    const debt   = parseInt(form.totalDebt, 10);
    const missed = parseInt(form.missedPayments, 10);
    const months = parseInt(form.employmentMonths, 10);

    if (isNaN(income) || income < 0)
      return setError("Monthly income must be a non-negative integer (USD).");
    if (isNaN(debt) || debt < 0)
      return setError("Total debt must be a non-negative integer (USD).");
    if (isNaN(missed) || missed < 0 || missed > 12)
      return setError("Missed payments must be between 0 and 12.");
    if (isNaN(months) || months < 0)
      return setError("Employment months must be a non-negative integer.");
    if (income > 4294967295 || debt > 4294967295 || months > 4294967295)
      return setError("One or more values exceed the maximum allowed (uint32 range).");

    setLoading(true);
    setStep(0);

    try {
      const checksumContract = getAddress(CONTRACT_ADDRESS);
      console.log("[VaultCredit] contract:", checksumContract);

      // Step 1 — build and send transaction
      setStep(1);
      const provider = new BrowserProvider(window.ethereum);
      const signer   = await provider.getSigner();
      const contract = new Contract(checksumContract, VAULT_CREDIT_ABI, signer);

      // submitCreditDataMock accepts plain uint32 values; the contract computes
      // the score in plaintext then stores it via FHE.asEuint32() — same on-chain
      // data model as the full FHE path, without requiring the relayer SDK.
      const tx = await contract.submitCreditDataMock(
        income,   // uint32 income
        debt,     // uint32 debt
        missed,   // uint32 missed
        months    // uint32 employment
      );

      // Step 2 — wait for confirmation
      setStep(2);
      const receipt = await tx.wait();

      onSubmit({
        txHash:        receipt.hash,
        blockNumber:   Number(receipt.blockNumber),
        timestamp:     new Date().toISOString(),
        walletAddress,
      });
    } catch (err) {
      console.error("[VaultCredit] submission error:", err);
      if (err.code === 4001 || err.code === "ACTION_REJECTED") {
        setError("Transaction rejected by user.");
      } else {
        setError(err.reason || err.message || "Transaction failed. Check the browser console for details.");
      }
    } finally {
      setLoading(false);
      setStep(0);
    }
  };

  return (
    <div className="page form-page">
      <div className="progress">
        <div className="progress-step done">
          <span className="progress-dot">1</span>
          Connect
        </div>
        <div className="progress-line" />
        <div className="progress-step active">
          <span className="progress-dot">2</span>
          Financial Data
        </div>
        <div className="progress-line" />
        <div className="progress-step">
          <span className="progress-dot">3</span>
          Result
        </div>
      </div>

      <div className="page-header">
        <h2 className="page-title">Submit Financial Data</h2>
        <p className="page-subtitle">
          Your score is computed on-chain and stored as an FHE-encrypted value.
          The smart contract uses the same scoring formula as the full FHE path —
          no plaintext appears in contract storage.
        </p>
      </div>

      <div className="demo-banner">
        Simulated FHE encryption · Sepolia testnet demo
      </div>

      <div className="wallet-badge">
        <span className="wallet-dot" />
        {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
      </div>

      <form onSubmit={handleSubmit} className="credit-form">
        <div className="form-group">
          <label htmlFor="monthlyIncome">Monthly Income (USD)</label>
          <input
            id="monthlyIncome"
            name="monthlyIncome"
            type="number"
            placeholder="e.g. 6500"
            value={form.monthlyIncome}
            onChange={handleChange}
            min="0"
            max="4294967295"
            required
            disabled={loading}
          />
          <span className="field-hint">Gross monthly income before taxes</span>
        </div>

        <div className="form-group">
          <label htmlFor="totalDebt">Total Debt (USD)</label>
          <input
            id="totalDebt"
            name="totalDebt"
            type="number"
            placeholder="e.g. 12000"
            value={form.totalDebt}
            onChange={handleChange}
            min="0"
            max="4294967295"
            required
            disabled={loading}
          />
          <span className="field-hint">All outstanding loans, credit cards, and obligations</span>
        </div>

        <div className="form-group">
          <label htmlFor="missedPayments">Missed Payments (last 12 months)</label>
          <input
            id="missedPayments"
            name="missedPayments"
            type="number"
            placeholder="e.g. 0"
            value={form.missedPayments}
            onChange={handleChange}
            min="0"
            max="12"
            required
            disabled={loading}
          />
          <span className="field-hint">Number of late or missed payments in the past year (0–12)</span>
        </div>

        <div className="form-group">
          <label htmlFor="employmentMonths">Months Employed</label>
          <input
            id="employmentMonths"
            name="employmentMonths"
            type="number"
            placeholder="e.g. 36"
            value={form.employmentMonths}
            onChange={handleChange}
            min="0"
            max="4294967295"
            required
            disabled={loading}
          />
          <span className="field-hint">Continuous months with your current employer</span>
        </div>

        {error && <div className="error-box">{error}</div>}

        {loading && (
          <div className="loading-box">
            <span className="spinner" />
            <span>{STEPS[step]}</span>
          </div>
        )}

        <div className="info-card" style={{ marginBottom: 0 }}>
          The contract computes your credit score from the submitted values using
          the same on-chain formula as the full FHE path, then stores the result
          as an encrypted <code>euint32</code> via <code>FHE.asEuint32()</code>.
          Lender threshold checks work unchanged against this encrypted score.
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner" />
              Processing…
            </>
          ) : (
            "Submit & Score"
          )}
        </button>
      </form>
    </div>
  );
}

export default CreditForm;
