import { useState } from "react";
import { BrowserProvider, Contract, getAddress } from "ethers";
import { createInstance, SepoliaConfig, initSDK } from "@zama-fhe/relayer-sdk/web";
import { CONTRACT_ADDRESS } from "../config";
import { VAULT_CREDIT_ABI } from "../abi";

const STEPS = [
  "Initializing FHE engine…",
  "Connecting to Zama relayer…",
  "Encrypting your financial data with FHE…",
  "Sending encrypted transaction…",
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
    const debt = parseInt(form.totalDebt, 10);
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
    if (!CONTRACT_ADDRESS)
      return setError(
        "Contract address not set. Add VITE_CONTRACT_ADDRESS to frontend/.env and restart the dev server."
      );

    // ── Ensure values fit in uint32 (4,294,967,295 max) ──────────────────
    if (income > 4294967295 || debt > 4294967295 || months > 4294967295)
      return setError("One or more values exceed the maximum allowed (uint32 range).");

    setLoading(true);
    setStep(0);

    try {
      // Step 0 — load WASM modules (tfhe + kms)
      await initSDK();

      // Step 1 — connect to Zama relayer to fetch the FHE public key and
      //          load coprocessor/KMS signers from the on-chain contracts
      setStep(1);
      const instance = await createInstance({
        ...SepoliaConfig,
        network: window.ethereum,
      });

      // Step 2 — encrypt all four inputs; the relayer validates the ZK proof
      //          and returns coprocessor-signed handles + inputProof
      setStep(2);
      const checksumContract = getAddress(CONTRACT_ADDRESS);
      const checksumWallet   = getAddress(walletAddress);

      const input = instance.createEncryptedInput(checksumContract, checksumWallet);
      // add32 produces an encrypted euint32; order must match contract parameter order
      input.add32(income);   // encryptedIncome
      input.add32(debt);     // encryptedDebt
      input.add32(missed);   // encryptedMissedPayments
      input.add32(months);   // encryptedEmploymentMonths

      const { handles, inputProof } = await input.encrypt();

      // Step 3 — connect to contract and send tx
      setStep(3);
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, VAULT_CREDIT_ABI, signer);

      const tx = await contract.submitFinancialData(
        handles[0],   // bytes32 encryptedIncome
        handles[1],   // bytes32 encryptedDebt
        handles[2],   // bytes32 encryptedMissedPayments
        handles[3],   // bytes32 encryptedEmploymentMonths
        inputProof    // bytes calldata inputProof
      );

      // Step 4 — wait for on-chain confirmation
      setStep(4);
      const receipt = await tx.wait();

      onSubmit({
        txHash: receipt.hash,
        blockNumber: Number(receipt.blockNumber),
        timestamp: new Date().toISOString(),
        walletAddress,
      });
    } catch (err) {
      console.error("VaultCredit submission error:", err);
      if (err.code === 4001 || err.code === "ACTION_REJECTED") {
        setError("Transaction rejected by user.");
      } else if (err.message?.includes("VITE_CONTRACT_ADDRESS")) {
        setError(err.message);
      } else {
        setError(
          err.reason || err.message || "Transaction failed. Check console for details."
        );
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
          These values are encrypted client-side with FHE before submission.
          The smart contract computes your credit score on the ciphertexts —
          no plaintext ever appears on-chain.
        </p>
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
          All values are encrypted using Zama's FHE before leaving your
          browser. The transaction contains only FHE ciphertexts — your raw
          income, debt, and payment history are mathematically private.
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner" />
              Processing…
            </>
          ) : (
            "Encrypt & Submit"
          )}
        </button>
      </form>
    </div>
  );
}

export default CreditForm;
