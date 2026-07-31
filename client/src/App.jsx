import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bot,
  CircleDollarSign,
  ExternalLink,
  LockKeyhole,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
} from "lucide-react";
import Header from "./components/Header";
import AgreementCard from "./components/AgreementCard";
import EvidenceForm from "./components/EvidenceForm";
import DecisionReceipt from "./components/DecisionReceipt";
import {
  evaluateMilestone,
  executeMilestone,
  getDemoAgreement,
  getPaymentTransaction,
} from "./services/api";
import "./App.css";

function App() {
  const [agreement, setAgreement] = useState(null);
  const [result, setResult] = useState(null);
  const [apiOnline, setApiOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("");
  const [error, setError] = useState("");
  const [activity, setActivity] = useState([
    {
      id: crypto.randomUUID(),
      title: "EduFlow workspace opened",
      detail: "Waiting for lesson evidence.",
      time: new Date().toLocaleTimeString(),
      type: "system",
    },
  ]);

  const busy = action !== "";

  const paidPercent = useMemo(() => {
    if (!agreement?.totalBudget) return 0;

    return Math.min(
      100,
      Math.round(
        (Number(agreement.amountPaid || 0) /
          Number(agreement.totalBudget)) *
          100,
      ),
    );
  }, [agreement]);

  function addActivity(title, detail, type = "system") {
    setActivity((items) => [
      {
        id: crypto.randomUUID(),
        title,
        detail,
        time: new Date().toLocaleTimeString(),
        type,
      },
      ...items,
    ]);
  }

  async function loadAgreement(showActivity = false) {
    try {
      const data = await getDemoAgreement();

      setAgreement(data);
      setApiOnline(true);

      if (showActivity) {
        addActivity(
          "Agreement refreshed",
          "Latest payment state loaded from the EduFlow API.",
          "system",
        );
      }
    } catch (requestError) {
      console.error(requestError);
      setApiOnline(false);
      setError(
        "Unable to connect to the EduFlow API. Start the backend on port 5000.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAgreement();
  }, []);

  async function handleEvaluate(evidence) {
    setAction("evaluate");
    setError("");
    setResult(null);

    addActivity(
      "Evidence submitted",
      `${evidence.milestoneId} sent to the SkillPay policy engine.`,
      "evidence",
    );

    try {
      const response = await evaluateMilestone(evidence);

      setResult(response);
      setApiOnline(true);

      addActivity(
        `Policy decision: ${response.decision.decision}`,
        response.decision.explanation,
        response.decision.decision.toLowerCase(),
      );
    } catch (requestError) {
      console.error(requestError);

      const message =
        requestError.response?.data?.error ||
        "The SkillPay Agent could not evaluate this evidence.";

      setError(message);
      addActivity("Evaluation failed", message, "error");
    } finally {
      setAction("");
    }
  }

  async function handleExecute(evidence) {
    const confirmed = window.confirm(
      "This will submit a real 10 USDC testnet milestone-payment request through the Circle executor. Continue?",
    );

    if (!confirmed) return;

    setAction("execute");
    setError("");
    setResult(null);

    addActivity(
      "Live payment requested",
      `${evidence.milestoneId} sent for policy review and Circle execution.`,
      "payment",
    );

    try {
      const response = await executeMilestone(evidence);

      setResult(response);
      setApiOnline(true);

      if (!response.paymentSubmitted) {
        addActivity(
          `Payment blocked: ${response.decision.decision}`,
          response.decision.explanation,
          response.decision.decision.toLowerCase(),
        );
      } else {
        addActivity(
          "Circle transaction submitted",
          `State: ${response.transaction?.state || "SUBMITTED"}`,
          "payment",
        );

        if (response.transaction?.transactionId) {
          const latest = await getPaymentTransaction(
            response.transaction.transactionId,
          );

          response.transaction = latest;
          setResult({ ...response });

          addActivity(
            `Transaction ${latest.state}`,
            latest.transactionHash
              ? `Arc transaction: ${latest.transactionHash}`
              : "Circle is still processing the transaction.",
            latest.state === "COMPLETE" ||
              latest.state === "CONFIRMED"
              ? "pay"
              : "payment",
          );
        }
      }

      if (response.agreement) {
        setAgreement(response.agreement);
      } else {
        await loadAgreement();
      }
    } catch (requestError) {
      console.error(requestError);

      const message =
        requestError.response?.data?.error ||
        "Circle could not execute the milestone payment.";

      setError(message);
      addActivity("Payment execution failed", message, "error");
    } finally {
      setAction("");
    }
  }

  return (
    <div className="app-shell">
      <Header apiOnline={apiOnline} />

      <main className="dashboard">
        <section className="hero-section">
          <div className="hero-copy">
            <span className="hero-label">
              Agentic learning commerce on Arc
            </span>

            <h1>
              Verified learning.
              <br />
              Autonomous USDC.
            </h1>

            <p>
              EduFlow evaluates lesson evidence, enforces payer-defined
              spending rules, and uses a Circle developer-controlled wallet
              to release authorized USDC on Arc.
            </p>

            <div className="hero-actions">
              <span>
                <ShieldCheck size={17} />
                Smart-contract enforced
              </span>

              <span>
                <Bot size={17} />
                Circle executor
              </span>

              <span>
                <CircleDollarSign size={17} />
                USDC settlement
              </span>
            </div>
          </div>

          <div className="hero-stat">
            <span>Escrowed learning budget</span>
            <strong>{agreement?.totalBudget ?? 30} USDC</strong>

            <div className="hero-progress">
              <div style={{ width: `${paidPercent}%` }} />
            </div>

            <small>
              {agreement?.remainingBudget ?? 30} USDC remains under the
              authorized policy.
            </small>
          </div>
        </section>

        <section className="trust-grid">
          <article>
            <ScanSearch size={22} />
            <div>
              <strong>Evidence-aware</strong>
              <span>
                Duration, learner confirmation, score, and amount are checked.
              </span>
            </div>
          </article>

          <article>
            <LockKeyhole size={22} />
            <div>
              <strong>Bounded authority</strong>
              <span>
                The agent cannot exceed the budget or milestone limit.
              </span>
            </div>
          </article>

          <article>
            <Activity size={22} />
            <div>
              <strong>Auditable settlement</strong>
              <span>
                Every executed payment can be verified on Arc.
              </span>
            </div>
          </article>
        </section>

        {busy && (
          <div className="agent-running-banner">
            <div className="agent-loader" />

            <div>
              <strong>
                {action === "execute"
                  ? "SkillPay is authorizing and executing payment"
                  : "SkillPay is evaluating lesson evidence"}
              </strong>

              <span>
                {action === "execute"
                  ? "Policy check → Circle signing → Arc settlement"
                  : "Checking learning conditions and spending limits"}
              </span>
            </div>
          </div>
        )}

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <section className="panel loading-panel">
            Loading the EduFlow workspace...
          </section>
        ) : (
          <>
            <div className="dashboard-grid">
              <AgreementCard
                agreement={agreement}
                onRefresh={() => loadAgreement(true)}
              />

              <EvidenceForm
                agreement={agreement}
                onEvaluate={handleEvaluate}
                onExecute={handleExecute}
                busy={busy}
              />
            </div>

            <div className="lower-grid">
              <DecisionReceipt result={result} />

              <section className="panel activity-panel">
                <div className="panel-heading">
                  <div>
                    <span className="eyebrow">Live audit trail</span>
                    <h2>Agent activity</h2>
                  </div>

                  <RefreshCw
                    size={18}
                    className={busy ? "spin-icon" : ""}
                  />
                </div>

                <div className="activity-list">
                  {activity.map((item) => (
                    <article
                      className={`activity-item activity-${item.type}`}
                      key={item.id}
                    >
                      <div className="activity-dot" />

                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.detail}</p>
                      </div>

                      <time>{item.time}</time>
                    </article>
                  ))}
                </div>

                {result?.transaction?.explorerUrl && (
                  <a
                    className="explorer-button"
                    href={result.transaction.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View transaction on Arc
                    <ExternalLink size={16} />
                  </a>
                )}
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;