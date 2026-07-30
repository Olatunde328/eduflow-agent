import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileCheck2,
  ScanSearch,
  ShieldAlert,
  WalletCards,
  XCircle,
} from "lucide-react";

const decisionConfig = {
  PAY: {
    icon: CheckCircle2,
    title: "Payment authorized",
    description: "All learning and spending conditions passed.",
  },
  HOLD: {
    icon: Clock3,
    title: "Payment on hold",
    description: "Required evidence is incomplete.",
  },
  ESCALATE: {
    icon: AlertTriangle,
    title: "Human review required",
    description: "The request exceeds the agent's authority.",
  },
  REJECT: {
    icon: XCircle,
    title: "Payment rejected",
    description: "The request violates the authorized policy.",
  },
};

function DecisionReceipt({ result }) {
  if (!result) {
    return (
      <section className="panel receipt-empty">
        <ShieldAlert size={34} />

        <h2>How SkillPay works</h2>

        <p>
          Every payment passes through evidence verification, policy checks,
          and a bounded payment decision.
        </p>

        <div className="how-it-works">
          <div>
            <FileCheck2 size={22} />
            <span>1</span>
            <strong>Evidence submitted</strong>
          </div>

          <div>
            <ScanSearch size={22} />
            <span>2</span>
            <strong>Agent evaluates rules</strong>
          </div>

          <div>
            <WalletCards size={22} />
            <span>3</span>
            <strong>USDC authorized or blocked</strong>
          </div>
        </div>
      </section>
    );
  }

  const decision = result.decision;
  const config = decisionConfig[decision.decision] || decisionConfig.HOLD;
  const DecisionIcon = config.icon;

  return (
    <section
      className={`panel receipt-panel receipt-${decision.decision.toLowerCase()}`}
    >
      <div className="receipt-header">
        <div className="decision-icon">
          <DecisionIcon size={30} />
        </div>

        <div>
          <span className="eyebrow">Proof-of-learning decision receipt</span>
          <h2>{config.title}</h2>
          <p>{config.description}</p>
        </div>

        <div className="decision-amount">
          <span>Authorized</span>
          <strong>{decision.authorizedAmount} USDC</strong>
        </div>
      </div>

      <div className="agent-sequence">
        <div className="sequence-step complete">
          <CheckCircle2 size={17} />
          <span>Evidence received</span>
        </div>

        <div className="sequence-line" />

        <div className="sequence-step complete">
          <CheckCircle2 size={17} />
          <span>Policy evaluated</span>
        </div>

        <div className="sequence-line" />

        <div
          className={`sequence-step ${
            decision.decision === "PAY" ? "complete" : "blocked"
          }`}
        >
          {decision.decision === "PAY" ? (
            <CheckCircle2 size={17} />
          ) : (
            <XCircle size={17} />
          )}
          <span>
            {decision.decision === "PAY"
              ? "Payment authorized"
              : "Payment prevented"}
          </span>
        </div>
      </div>

      <div className="decision-summary">
        <strong>Agent explanation</strong>
        <p>{decision.explanation}</p>
      </div>

      <div className="checks-list">
        {decision.checks.map((check) => (
          <article
            key={check.rule}
            className={`check-row ${check.passed ? "passed" : "failed"}`}
          >
            <div className="check-icon">
              {check.passed ? (
                <CheckCircle2 size={19} />
              ) : (
                <XCircle size={19} />
              )}
            </div>

            <div className="check-main">
              <strong>{formatRule(check.rule)}</strong>
              <p>{check.reason}</p>
            </div>

            <div className="check-values">
              <span>{check.observed}</span>
              <small>Required: {check.required}</small>
            </div>
          </article>
        ))}
      </div>

      <div className="receipt-footer">
        <div>
          <span>Evaluator</span>
          <strong>{decision.evaluator}</strong>
        </div>

        <div>
          <span>Milestone</span>
          <strong>{result.milestoneId}</strong>
        </div>

        <div>
          <span>Created</span>
          <strong>{new Date(result.createdAt).toLocaleString()}</strong>
        </div>

        <button type="button" disabled>
          <ExternalLink size={15} />
          Arc receipt pending
        </button>
      </div>
    </section>
  );
}

function formatRule(rule) {
  return rule
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
}

export default DecisionReceipt;
