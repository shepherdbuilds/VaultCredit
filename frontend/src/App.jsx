import { useState } from "react";
import NavBar from "./components/NavBar";
import ConnectWallet from "./components/ConnectWallet";
import CreditForm from "./components/CreditForm";
import ScoreDisplay from "./components/ScoreDisplay";
import LandingPage from "./pages/LandingPage";
import LenderDashboard from "./pages/LenderDashboard";

const FLOW_PAGES = new Set([
  "borrower-connect",
  "borrower-form",
  "borrower-result",
  "lender-connect",
  "lender-form",
]);

function App() {
  const [page, setPage] = useState("landing");
  const [walletAddress, setWalletAddress] = useState("");
  const [lenderAddress, setLenderAddress] = useState("");
  const [txResult, setTxResult] = useState(null);

  const nav = (target) => setPage(target);

  const disconnect = () => {
    setWalletAddress("");
    setLenderAddress("");
    setTxResult(null);
    setPage("landing");
  };

  const handleBorrowerConnect = (address) => {
    setWalletAddress(address);
    setPage("borrower-form");
  };

  const handleBorrowerSubmit = (result) => {
    setTxResult(result);
    setPage("borrower-result");
  };

  const handleBorrowerReset = () => {
    setTxResult(null);
    setPage("borrower-form");
  };

  const handleLenderConnect = (address) => {
    setLenderAddress(address);
    setPage("lender-form");
  };

  const activeWallet =
    page.startsWith("borrower") ? walletAddress :
    page.startsWith("lender")  ? lenderAddress :
    "";

  const isFlowPage = FLOW_PAGES.has(page);

  if (page === "landing") {
    return (
      <div className="app app--landing">
        <LandingPage
          onBorrower={() => nav("borrower-connect")}
          onLender={() => nav("lender-connect")}
        />
        <footer className="app-footer" style={{ textAlign: "center", padding: "32px 24px" }}>
          <span>Powered by </span>
          <a href="https://www.zama.ai/fhevm" target="_blank" rel="noopener noreferrer">
            Zama fhEVM
          </a>
          <span> · Sepolia Testnet</span>
        </footer>
      </div>
    );
  }

  return (
    <div className="app app--flow">
      <NavBar
        page={page}
        walletAddress={activeWallet}
        onNav={nav}
        onDisconnect={disconnect}
      />
      <div className="app-body">
        <div className="app-container">
          {page === "borrower-connect" && (
            <ConnectWallet mode="borrower" onConnect={handleBorrowerConnect} />
          )}
          {page === "borrower-form" && (
            <CreditForm
              walletAddress={walletAddress}
              onSubmit={handleBorrowerSubmit}
            />
          )}
          {page === "borrower-result" && (
            <ScoreDisplay
              txResult={txResult}
              walletAddress={walletAddress}
              onReset={handleBorrowerReset}
            />
          )}
          {page === "lender-connect" && (
            <ConnectWallet mode="lender" onConnect={handleLenderConnect} />
          )}
          {page === "lender-form" && (
            <LenderDashboard walletAddress={lenderAddress} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
