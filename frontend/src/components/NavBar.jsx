function NavBar({ page, walletAddress, onNav, onDisconnect }) {
  const isBorrower =
    page === "borrower-connect" ||
    page === "borrower-form" ||
    page === "borrower-result";
  const isLender =
    page === "lender-connect" ||
    page === "lender-form" ||
    page === "lender-result";

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`
    : null;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <button className="nav-wordmark" onClick={() => onNav("landing")}>
          VaultCredit
        </button>

        <div className="nav-tabs">
          <button
            className={`nav-tab${isBorrower ? " active" : ""}`}
            onClick={() => onNav("borrower-connect")}
          >
            Borrower
          </button>
          <button
            className={`nav-tab${isLender ? " active" : ""}`}
            onClick={() => onNav("lender-connect")}
          >
            Lender
          </button>
        </div>

        <div className="nav-right">
          {shortAddress ? (
            <>
              <div className="nav-wallet">
                <span className="nav-wallet-dot" />
                {shortAddress}
              </div>
              <button className="nav-disconnect" onClick={onDisconnect}>
                Disconnect
              </button>
            </>
          ) : (
            <span className="nav-no-wallet">Not connected</span>
          )}
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
