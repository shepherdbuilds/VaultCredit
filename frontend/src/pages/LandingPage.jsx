import { useEffect, useRef, useState } from "react";
import { CONTRACT_ADDRESS } from "../config";
import ThemeToggle from "../components/ThemeToggle";
import VaultCreditLogo from "../components/VaultCreditLogo";

// ── FHE flow icons ────────────────────────────────────────────────────────────

const IconLock = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="5" y="11" width="14" height="10" rx="2" stroke="#1D4ED8" strokeWidth="1.5"/>
    <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="12" cy="16" r="1.5" fill="#1D4ED8"/>
  </svg>
);

const IconShield = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2L4 6v6c0 5.25 3.39 10.15 8 11.37C16.61 22.15 20 17.25 20 12V6l-8-4z"
      stroke="#1D4ED8" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M9 12l2 2 4-4" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconChip = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="7" y="7" width="10" height="10" rx="1.5" stroke="#1D4ED8" strokeWidth="1.5"/>
    <path d="M9 2v3M12 2v3M15 2v3M9 19v3M12 19v3M15 19v3M2 9h3M2 12h3M2 15h3M19 9h3M19 12h3M19 15h3"
      stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconDatabase = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <ellipse cx="12" cy="6" rx="8" ry="3" stroke="#1D4ED8" strokeWidth="1.5"/>
    <path d="M4 6v5c0 1.66 3.58 3 8 3s8-1.34 8-3V6" stroke="#1D4ED8" strokeWidth="1.5"/>
    <path d="M4 11v5c0 1.66 3.58 3 8 3s8-1.34 8-3v-5" stroke="#1D4ED8" strokeWidth="1.5"/>
  </svg>
);

const DIAGRAM_NODES = [
  { icon: <IconLock />,     label: "Your Data" },
  { icon: <IconShield />,   label: "Browser Encryption" },
  { icon: <IconChip />,     label: "Smart Contract" },
  { icon: <IconDatabase />, label: "Score Stored" },
];

function FheFlowDiagram() {
  return (
    <div className="fhe-diagram" role="img" aria-label="FHE flow: Your Data → Browser Encryption → Smart Contract → Score Stored">
      {DIAGRAM_NODES.map((node, i) => (
        <>
          <div key={node.label} className="fhe-node">
            {node.icon}
            <span className="fhe-node-label">{node.label}</span>
          </div>
          {i < DIAGRAM_NODES.length - 1 && (
            <div key={`connector-${i}`} className="fhe-connector">
              <div className="fhe-connector-line" />
              <div className="fhe-dot" style={{ animationDelay: `${i * 0.8}s` }} />
            </div>
          )}
        </>
      ))}
    </div>
  );
}

// ── Landing page content ──────────────────────────────────────────────────────

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

const TOTAL_SECTIONS = 6;

function LandingPage({ onBorrower, onLender, isDark, onToggleTheme }) {
  const [activeSection, setActiveSection] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const sections = Array.from(root.querySelectorAll(".snap-section"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const content = entry.target.querySelector(".snap-content");
          if (entry.isIntersecting) {
            content?.classList.add("is-visible");
            const idx = sections.indexOf(entry.target);
            if (idx !== -1) setActiveSection(idx);
          } else {
            content?.classList.remove("is-visible");
          }
        });
      },
      { root, threshold: 0.5 }
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-page" ref={containerRef}>

      {/* ── Landing navbar ── */}
      <header className="landing-nav">
        <span className="landing-nav-wordmark">
          <VaultCreditLogo />
        </span>
        <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
      </header>

      {/* ── Scroll progress dots ── */}
      <nav className="snap-progress" aria-label="Page sections">
        {Array.from({ length: TOTAL_SECTIONS }).map((_, i) => (
          <div
            key={i}
            className={`snap-dot${i === activeSection ? " snap-dot--active" : ""}`}
          />
        ))}
      </nav>

      {/* ── Snap 1: Hero ── */}
      <div className="snap-section">
        <div className="snap-content">
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
        </div>
      </div>

      {/* ── Snap 2: FHE Flow Diagram ── */}
      <div className="snap-section">
        <div className="snap-content">
          <div className="fhe-snap-section">
            <FheFlowDiagram />
          </div>
        </div>
      </div>

      {/* ── Snap 3: Why VaultCredit exists (dark) ── */}
      <div className="snap-section snap-section--dark">
        <div className="snap-content">
          <div className="trust-section">
            <h2 className="trust-headline">
              The problem is trust.<br />We eliminated it.
            </h2>
            <div className="trust-cards">
              <div className="trust-card">
                <div className="trust-card-accent" />
                <div className="trust-number">$600M+</div>
                <div className="trust-label">Lost to DeFi hacks in Q1 2026</div>
                <div className="trust-subtext">Protocols forced to expose sensitive data layers</div>
              </div>
              <div className="trust-card">
                <div className="trust-card-accent" />
                <div className="trust-number">2.8B+</div>
                <div className="trust-label">People lack access to fair credit</div>
                <div className="trust-subtext">Traditional systems exclude the underbanked globally</div>
              </div>
              <div className="trust-card">
                <div className="trust-card-accent" />
                <div className="trust-number">0</div>
                <div className="trust-label">Bytes of plaintext on VaultCredit</div>
                <div className="trust-subtext">Every input encrypted before it leaves your browser</div>
              </div>
            </div>
            <p className="trust-tagline">
              VaultCredit is the first protocol where the math itself is the guarantee.
            </p>
          </div>
        </div>
      </div>

      {/* ── Snap 4: How it works ── */}
      <div className="snap-section">
        <div className="snap-content">
          <section className="section">
            <h2 className="section-title">How it works</h2>
            <div className="steps-track">
              <div className="steps-grid">
                {STEPS.map((s) => (
                  <div key={s.number} className="step-card">
                    <div className="step-number">{s.number}</div>
                    <h3 className="step-title">{s.title}</h3>
                    <p className="step-body">{s.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ── Snap 5: Why it matters ── */}
      <div className="snap-section">
        <div className="snap-content">
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
        </div>
      </div>

      {/* ── Snap 6: CTA + Protocol + Footer ── */}
      <div className="snap-section snap-section--last">
        <div className="snap-content">
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

          <section className="proto-stats">
            <h2 className="section-title">Protocol</h2>
            <div className="proto-stats-card">
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

          <footer className="landing-footer">
            <div className="landing-footer-inner">
              <div className="landing-footer-top">
                <span className="landing-footer-wordmark">
                  <VaultCreditLogo iconSize={20} fontSize={14} gap={6} />
                </span>
                <span className="landing-footer-powered">
                  Powered by{" "}
                  <a href="https://www.zama.ai/fhevm" target="_blank" rel="noopener noreferrer">
                    Zama fhEVM
                  </a>
                </span>
                <a
                  className="landing-footer-github"
                  href="https://github.com/shepherdbuilds/VaultCredit"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub ↗
                </a>
              </div>
              {CONTRACT_ADDRESS && (
                <div className="landing-footer-contract">
                  <a
                    href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {CONTRACT_ADDRESS}
                  </a>
                  <span> · Sepolia Testnet</span>
                </div>
              )}
            </div>
          </footer>
        </div>
      </div>

    </div>
  );
}

export default LandingPage;
