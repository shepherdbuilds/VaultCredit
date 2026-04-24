import { useState } from "react";
import WalletModal from "./WalletModal";

function ConnectWallet({ onConnect, mode = "borrower" }) {
  const [showModal, setShowModal] = useState(false);

  const isBorrower = mode === "borrower";

  return (
    <div className="page connect-page">
      <div className="logo-section">
        <h1 className="wordmark">VaultCredit</h1>
        <p className="tagline">
          {isBorrower
            ? "Privacy-preserving credit scoring on-chain"
            : "Verify borrower creditworthiness with FHE"}
        </p>
      </div>

      <div className="page-header">
        <p className="page-subtitle">
          {isBorrower
            ? "Your financial data is encrypted before it ever leaves your browser. The smart contract computes your credit score entirely on encrypted inputs — the raw numbers are mathematically invisible to everyone, including the protocol itself."
            : "Connect your wallet to verify a borrower's credit score against a threshold. The comparison runs on FHE ciphertexts — the borrower's actual score is never exposed."}
        </p>
      </div>

      <div className="info-card">
        {isBorrower ? (
          <>
            <strong>How it works</strong> — your income, debt, payment history,
            and employment data are encrypted client-side using the Zama FHE
            public key. The Solidity contract performs arithmetic on ciphertexts
            and stores your score without ever decrypting it.
          </>
        ) : (
          <>
            <strong>Lender flow</strong> — enter a borrower address and a score
            threshold. The contract returns an encrypted boolean: the threshold
            is met or it isn't, without disclosing the underlying score.
          </>
        )}
      </div>

      <button
        className="btn btn-primary"
        onClick={() => setShowModal(true)}
      >
        Connect Wallet
      </button>

      <p className="network-note">
        Requires Sepolia testnet · Get test ETH at sepoliafaucet.com
      </p>

      {showModal && (
        <WalletModal
          onConnect={(address) => {
            setShowModal(false);
            onConnect(address);
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

export default ConnectWallet;
