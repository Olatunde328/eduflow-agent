import { useEffect, useState } from "react";
import {
  Bot,
  CircleDollarSign,
  LockKeyhole,
  ScanSearch,
} from "lucide-react";
import Header from "./components/Header";
import AgreementCard from "./components/AgreementCard";
import EvidenceForm from "./components/EvidenceForm";
import DecisionReceipt from "./components/DecisionReceipt";
import { evaluateMilestone, getDemoAgreement } from "./services/api";
import "./App.css";

function App() {
  const [agreement, setAgreement] = useState(null);
  const [decisionResult, setDecisionResult] = useState(null);
  const [apiOnline, setApiOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAgreement() {
      try {
        const data = await getDemoAgreement();
        setAgreement(data);
        setApiOnline(true);
      } catch (requestError) {
        console.error(requestError);
        setApiOnline(false);
        setError(
          "Unable to connect to the EduFlow API. Confirm the backend is running on port 5000.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadAgreement();
  }, []);

  const handleEvaluate = async (evidence) => {
    setEvaluating(true);
    setError("");
    setDecisionResult(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 700));
      const result = await evaluateMilestone(evidence);
      setDecisionResult(result);
      setApiOnline(true);
    } catch (requestError) {
      console.error(requestError);
      setError(
        requestError.response?.data?.error ||
          "The SkillPay Agent could not evaluate this evidence.",
      );
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="app-shell">
      <Header apiOnline={apiOnline} />

      <main className="dashboard">
        <section className="hero-section">
          <div>
            <span className="hero-label">Agentic learning commerce on Arc</span>

            <h1>
              Verified learning.
              <br />
              Autonomous USDC payments.
            </h1>

            <p>
              EduFlow gives a bounded economic agent permission to evaluate
              learning evidence and release payments only when every
              payer-defined condition is satisfied.
            </p>
          </div>

          <div className="hero-stat">
            <span>Authorized demo budget</span>
            <strong>{agreement?.totalBudget || 30} USDC</strong>
            <small>Protected by programmable spending policies</small>
          </div>
        </section>

        <section className="trust-grid">
          <article>
            <ScanSearch size={22} />
            <div>
              <strong>Evidence-aware decisions</strong>
              <span>Lesson duration, confirmation, and outcomes are checked.</span>
            </div>
          </article>

          <article>
            <CircleDollarSign size={22} />
            <div>
              <strong>Automatic USDC settlement</strong>
              <span>Approved milestones can trigger payment execution.</span>
            </div>
          </article>

          <article>
            <LockKeyhole size={22} />
            <div>
              <strong>Bounded spending authority</strong>
              <span>The agent cannot exceed the payer's approved policy.</span>
            </div>
          </article>
        </section>

        {evaluating && (
          <div className="agent-running-banner">
            <Bot size={19} />
            <div>
              <strong>SkillPay Agent is evaluating the evidence</strong>
              <span>Checking learning requirements and spending policy...</span>
            </div>
            <div className="agent-loader" />
          </div>
        )}

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <section className="panel loading-panel">
            Loading EduFlow workspace...
          </section>
        ) : (
          <>
            <div className="dashboard-grid">
              <AgreementCard agreement={agreement} />

              <EvidenceForm
                agreement={agreement}
                onEvaluate={handleEvaluate}
                evaluating={evaluating}
              />
            </div>

            <DecisionReceipt result={decisionResult} />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
