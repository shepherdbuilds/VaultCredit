import { useState } from "react";
import { BrowserProvider } from "ethers";
import { SEPOLIA_CHAIN_ID, SEPOLIA_CHAIN_ID_HEX } from "../config";

const WALLETS = [
  {
    id: "rabby",
    name: "Rabby",
    detect: () =>
      typeof window.ethereum !== "undefined" && window.ethereum.isRabby === true,
  },
  {
    id: "metamask",
    name: "MetaMask",
    detect: () =>
      typeof window.ethereum !== "undefined" && window.ethereum.isMetaMask === true,
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    detect: () =>
      typeof window.ethereum !== "undefined" &&
      (window.ethereum.isCoinbaseWallet === true ||
        window.ethereum.selectedProvider?.isCoinbaseWallet === true),
  },
  {
    id: "injected",
    name: "Browser Wallet",
    detect: () => typeof window.ethereum !== "undefined",
  },
];

async function switchToSepolia() {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
    });
  } catch (err) {
    if (err.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: SEPOLIA_CHAIN_ID_HEX,
            chainName: "Sepolia Testnet",
            nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://rpc.ankr.com/eth_sepolia"],
            blockExplorerUrls: ["https://sepolia.etherscan.io"],
          },
        ],
      });
    } else {
      throw new Error("Please switch to Sepolia testnet in your wallet.");
    }
  }
}

function WalletModal({ onConnect, onClose }) {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState("");

  const specificDetected = WALLETS.slice(0, 3).find((w) => w.detect());

  const connect = async (wallet) => {
    if (!wallet.detect()) {
      setError(`${wallet.name} not detected. Install the extension and refresh.`);
      return;
    }
    setError("");
    setLoading(wallet.id);

    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      if (!accounts || accounts.length === 0)
        throw new Error("No accounts found. Unlock your wallet.");

      const network = await provider.getNetwork();
      if (network.chainId !== SEPOLIA_CHAIN_ID) {
        await switchToSepolia();
      }

      onConnect(accounts[0]);
    } catch (err) {
      if (err.code === 4001) {
        setError("Connection rejected.");
      } else {
        setError(err.message || "Failed to connect.");
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Connect Wallet</span>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <p className="modal-subtitle">
          Select your wallet to connect to Sepolia testnet.
        </p>

        {error && <div className="error-box" style={{ marginBottom: 12 }}>{error}</div>}

        <div className="wallet-options">
          {WALLETS.slice(0, 3).map((wallet) => {
            const isDetected = wallet.detect();
            return (
              <button
                key={wallet.id}
                className={`wallet-option${isDetected ? " wallet-detected" : ""}`}
                onClick={() => connect(wallet)}
                disabled={loading !== null || !isDetected}
              >
                <span className="wallet-option-name">{wallet.name}</span>
                {loading === wallet.id ? (
                  <span className="spinner" style={{ width: 14, height: 14 }} />
                ) : isDetected ? (
                  <span className="wallet-detected-badge">Detected</span>
                ) : (
                  <span className="wallet-soon-badge">Not installed</span>
                )}
              </button>
            );
          })}

          {/* Injected fallback — only show if no named wallet was detected */}
          {!specificDetected && (
            <button
              className={`wallet-option${WALLETS[3].detect() ? " wallet-detected" : ""}`}
              onClick={() => connect(WALLETS[3])}
              disabled={loading !== null || !WALLETS[3].detect()}
            >
              <span className="wallet-option-name">Browser Wallet</span>
              {loading === "injected" ? (
                <span className="spinner" style={{ width: 14, height: 14 }} />
              ) : WALLETS[3].detect() ? (
                <span className="wallet-detected-badge">Detected</span>
              ) : (
                <span className="wallet-soon-badge">Not found</span>
              )}
            </button>
          )}

          <button className="wallet-option" disabled>
            <span className="wallet-option-name">WalletConnect</span>
            <span className="wallet-soon-badge">Coming soon</span>
          </button>
        </div>

        <p style={{ marginTop: 16, fontSize: 12, color: "var(--text-secondary)", textAlign: "center" }}>
          Requires Sepolia testnet · Get test ETH at{" "}
          <a href="https://sepoliafaucet.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--blue)" }}>
            sepoliafaucet.com
          </a>
        </p>
      </div>
    </div>
  );
}

export default WalletModal;
