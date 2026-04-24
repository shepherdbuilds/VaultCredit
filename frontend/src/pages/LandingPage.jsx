import { useEffect, useState } from "react";
import { JsonRpcProvider, Contract } from "ethers";
import { CONTRACT_ADDRESS, SEPOLIA_RPC_URL } from "../config";
import { VAULT_CREDIT_ABI } from "../abi";

const STEPS = [
  {
    number: "01",
    title: "Connect your wallet",
    body: "Use any EIP-1193 wallet on Sepolia. Your wallet signs the encrypted transaction — no custody, no approvals.",
  },
  {
    number: "02",
    title: "Submit encrypted data",
    body: "Income, debt, missed payments, and employment tenure are encrypted client-side with Zama FHE before leaving your browser.",
  },
  {
    number: "03",
    title: "Score stored on-chain",
    body: "The smart contract computes a credit score entirely on ciphertexts. Lenders can request threshold comparisons — never the raw score.",
  },
];

const WHY_ITEMS = [
  {
    title: "Zero plaintext on-chain",
    body: "Traditional credit protocols store or transmit raw financial data. VaultCredit keeps every value encrypted end-to-end.",
  },
  {
    title: "Lender access without exposure",
    body: "A lender can verify \"score ≥ 650\" and receive an encrypted boolean. The actual score is never revealed.",
  },
  {
    title: "Self-sovereign data",
    body: "Only your wallet holds the FHE decryption key. You can re-submit or update your score at any time.",
  },
];

function useLiveStats() {
  const [stats, setStats] = useState({ totalScores: null, uniqueWallets: null });

  useEffect(() => {
    if (!CONTRACT_ADDRESS) return;
    let cancelled = false;

    async function load() {
      try {
        const provider = new JsonRpcProvider(SEPOLIA_RPC_URL);
        const contract = new Contract(CONTRACT_ADDRESS, VAULT_CREDIT_ABI, provider);
        const events = await contract.queryFilter(contract.filters.ScoreComputed());
        if (cancelled) return;
        const wallets = new Set(events.map((e) => e.args.user.toLowerCase()));
        setStats({ totalScores: events.length, uniqueWallets: wallets.size });
      } catch {
        // stats are decorative — silently fail
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return stats;
}

function LandingPage({ onBorrower, onLender }) {
  const stats = useLiveStats();

  const shortContract = CONTRACT_ADDRESS
    ? `${CONTRACT_ADDRESS.slice(0, 8)}…${CONTRACT_ADDRESS.slice(-6)}`
    : "Not deployed";

  return (
    <div className="landing-page">
      {/* Hero */}
      <section className="hero">
        <h1 className="hero-title">
          Credit scoring with<br />mathematically private data
        </h1>
        <p className="hero-tagline">
          VaultCredit uses Fully Homomorphic Encryption to compute credit scores
          on Sepolia. Your income, debt, and payment history are encrypted before
          submission and never appear in plaintext — on-chain or off.
        </p>
        <div className="hero-buttons">
          <button className="btn btn-primary" onClick={onBorrower}>
            Check Your Score
          </button>
          <button className="btn btn-secondary" onClick={onLender}>
            Verify a Borrower
          </button>
        </div>
      </section>

      {/* Live stats bar */}
      <div className="stats-bar">
        <div className="stats-bar-inner">
          <div className="stat-item">
            <span className="stat-number">
              {stats.totalScores !== null ? stats.totalScores.toLocaleString() : "—"}
            </span>
            <span className="stat-label">Scores computed</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {stats.uniqueWallets !== null ? stats.uniqueWallets.toLocaleString() : "—"}
            </span>
            <span className="stat-label">Unique wallets</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">Sepolia</span>
            <span className="stat-label">Network</span>
          </div>
          <div className="stat-item">
            <a
              className="proto-stat-link"
              href={
                CONTRACT_ADDRESS
                  ? `https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`
                  : "#"
              }
              target="_blank"
              rel="noopener noreferrer"
              title={CONTRACT_ADDRESS || ""}
            >
              {shortContract} ↗
            </a>
            <span className="stat-label">Contract</span>
          </div>
        </div>
      </div>

      {/* How it works */}
      <section className="section">
        <h2 className="section-title">How it works</h2>
        <div className="steps-grid">
          {STEPS.map((s) => (
            <div key={s.number} className="step-card">
              <div className="step-number">{s.number}</div>
              <h3 className="step-title">{s.title}</h3>
              <p className="step-body">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why it matters */}
      <section className="why-section">
        <h2 className="section-title">Why it matters</h2>
        <div className="steps-grid">
          {WHY_ITEMS.map((item) => (
            <div key={item.title} className="why-card">
              <h3 className="step-title">{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Protocol info */}
      <section className="proto-stats">
        <h2 className="section-title">Protocol</h2>
        <div className="proto-stats-card">
          <div className="proto-stat-row">
            <span className="proto-stat-key">Contract</span>
            {CONTRACT_ADDRESS ? (
              <a
                className="proto-stat-link"
                href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {CONTRACT_ADDRESS} ↗
              </a>
            ) : (
              <span className="proto-stat-val">Not deployed</span>
            )}
          </div>
          <div className="proto-stat-row">
            <span className="proto-stat-key">FHE library</span>
            <span className="proto-stat-val">Zama fhEVM · @zama-fhe/relayer-sdk</span>
          </div>
          <div className="proto-stat-row">
            <span className="proto-stat-key">Encryption type</span>
            <span className="proto-stat-val">euint32 (32-bit encrypted integers)</span>
          </div>
          <div className="proto-stat-row">
            <span className="proto-stat-key">Network</span>
            <span className="proto-stat-val">Ethereum Sepolia Testnet (chain 11155111)</span>
          </div>
          <div className="proto-stat-row">
            <span className="proto-stat-key">Relayer</span>
            <span className="proto-stat-val">relayer.testnet.zama.org</span>
          </div>
        </div>
      </section>

      {/* Bottom CTAs */}
      <section className="section">
        <div className="cta-pair">
          <div className="cta-card">
            <h3 className="cta-card-title">Submit your score</h3>
            <p className="cta-card-body">
              Connect a wallet, enter your financial data, and let FHE handle
              the rest. Your inputs never leave the browser unencrypted.
            </p>
            <button className="btn btn-primary" onClick={onBorrower}>
              Get Started
            </button>
          </div>
          <div className="cta-card">
            <h3 className="cta-card-title">Verify a borrower</h3>
            <p className="cta-card-body">
              Enter a borrower's address and a threshold. The contract returns
              an encrypted pass/fail — no raw score exposed.
            </p>
            <button className="btn btn-secondary" onClick={onLender}>
              Open Lender Dashboard
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
