import { useEffect, useState } from "react";
import { JsonRpcProvider, Contract } from "ethers";
import { CONTRACT_ADDRESS, SEPOLIA_RPC_URL } from "../config";
import { VAULT_CREDIT_ABI } from "../abi";

function useScoreHistory(walletAddress) {
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    if (!walletAddress || !CONTRACT_ADDRESS) {
      setHistoryLoading(false);
      return;
    }
    let cancelled = false;

    async function load() {
      try {
        const provider = new JsonRpcProvider(SEPOLIA_RPC_URL);
        const contract = new Contract(CONTRACT_ADDRESS, VAULT_CREDIT_ABI, provider);
        const events = await contract.queryFilter(
          contract.filters.ScoreComputed(walletAddress)
        );
        if (cancelled) return;
        const items = events
          .slice()
          .reverse()
          .map((e) => ({
            txHash: e.transactionHash,
            blockNumber: Number(e.blockNumber),
            timestamp: Number(e.args.timestamp),
          }));
        setHistory(items);
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [walletAddress]);

  return { history, historyLoading };
}

function ScoreDisplay({ txResult, walletAddress, onReset }) {
  const shortAddress = `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`;
  const shortHash = txResult?.txHash
    ? `${txResult.txHash.slice(0, 12)}…${txResult.txHash.slice(-8)}`
    : "—";
  const formattedTime = txResult?.timestamp
    ? new Date(txResult.timestamp).toLocaleString()
    : "—";

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!txResult?.txHash) return;
    navigator.clipboard.writeText(txResult.txHash).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const { history, historyLoading } = useScoreHistory(walletAddress);

  return (
    <div className="page result-page">
      <div className="progress">
        <div className="progress-step done">
          <span className="progress-dot">1</span>
          Connect
        </div>
        <div className="progress-line" />
        <div className="progress-step done">
          <span className="progress-dot">2</span>
          Financial Data
        </div>
        <div className="progress-line" />
        <div className="progress-step active">
          <span className="progress-dot">3</span>
          Result
        </div>
      </div>

      <div className="success-header">
        <div className="success-badge">
          <span className="success-dot" />
          Confirmed
        </div>
        <h2 className="page-title page-title--lg">Credit Score Computed</h2>
        <p className="page-subtitle">
          Your encrypted credit score has been stored on Sepolia. Raw financial
          data was never on-chain — only FHE ciphertexts.
        </p>
      </div>

      <div className="result-card">
        <div className="result-row">
          <span className="result-label">Status</span>
          <span className="result-value">Stored On-Chain</span>
        </div>
        <div className="result-row">
          <span className="result-label">Transaction</span>
          {txResult?.txHash ? (
            <div className="tx-hash-row">
              <a
                className="tx-hash-value"
                href={`https://sepolia.etherscan.io/tx/${txResult.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                title={txResult.txHash}
              >
                {shortHash} ↗
              </a>
              <button
                className={`copy-btn${copied ? " copy-btn--copied" : ""}`}
                onClick={handleCopy}
                title="Copy full transaction hash"
              >
                {copied ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L4.5 8.5L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <rect x="3.5" y="0.5" width="7" height="7.5" rx="1" stroke="currentColor" strokeWidth="1.1"/>
                    <rect x="0.5" y="3.5" width="7" height="7.5" rx="1" stroke="currentColor" strokeWidth="1.1" fill="var(--white)"/>
                  </svg>
                )}
              </button>
            </div>
          ) : (
            <span className="result-value">—</span>
          )}
        </div>
        <div className="result-row">
          <span className="result-label">Block</span>
          <span className="result-value">
            {txResult?.blockNumber ? `#${txResult.blockNumber.toLocaleString()}` : "—"}
          </span>
        </div>
        <div className="result-row">
          <span className="result-label">Wallet</span>
          <span className="result-value">{shortAddress}</span>
        </div>
        <div className="result-row">
          <span className="result-label">Computed at</span>
          <span className="result-value">{formattedTime}</span>
        </div>
      </div>

      <p className="motivational-line">
        Your financial data was never exposed.<br />
        Only you and authorized lenders can verify your score.
      </p>

      <div className="info-section">
        <p className="info-section-title">What this means</p>
        <ul className="info-list">
          <li>
            Your score is stored as an FHE ciphertext. No one — not the contract
            owner, not a node operator — can read it without your decryption key.
          </li>
          <li>
            Lenders can request a threshold comparison (e.g., "is this score ≥ 650?")
            and receive an <em>encrypted boolean</em> — never the actual score.
          </li>
          <li>
            Only you, as the wallet owner, hold the FHE decryption key. You can
            decrypt your score via the Zama gateway at any time.
          </li>
          <li>
            You can re-submit updated financial data at any time. Each submission
            overwrites your previous encrypted score.
          </li>
        </ul>
      </div>

      {/* Score history */}
      <div className="history-section">
        <h3 className="history-title">Submission History</h3>
        {historyLoading ? (
          <div className="history-loading">
            <span className="spinner" /> Loading events…
          </div>
        ) : history.length === 0 ? (
          <div className="history-empty-state">
            <div className="history-empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="#CBD5E1" strokeWidth="1.5"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="history-empty-text">Your submission history will appear here</p>
            <p className="history-empty-subtext">
              Each entry shows only metadata — your score remains encrypted on-chain
            </p>
          </div>
        ) : (
          <div className="history-list">
            {history.map((item, i) => {
              const shortTx = `${item.txHash.slice(0, 10)}…${item.txHash.slice(-6)}`;
              const date = item.timestamp
                ? new Date(item.timestamp * 1000).toLocaleString()
                : `Block #${item.blockNumber.toLocaleString()}`;
              return (
                <div key={item.txHash} className="history-item">
                  <div className="history-item-meta">
                    <span className="history-index">#{history.length - i}</span>
                    <span className="history-date">{date}</span>
                  </div>
                  <a
                    className="history-tx"
                    href={`https://sepolia.etherscan.io/tx/${item.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={item.txHash}
                  >
                    {shortTx} ↗
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="action-row">
        <button className="btn btn-secondary" onClick={onReset}>
          Update Score
        </button>
        {txResult?.txHash && (
          <a
            className="btn btn-primary"
            href={`https://sepolia.etherscan.io/tx/${txResult.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Etherscan ↗
          </a>
        )}
      </div>
    </div>
  );
}

export default ScoreDisplay;
