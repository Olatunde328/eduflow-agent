import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  ReceiptText,
  ShieldX,
  X,
} from "lucide-react";
import StatusBadge from "./StatusBadge";

const decisionIcons = {
  PAY: CheckCircle2,
  HOLD: Clock3,
  ESCALATE: AlertTriangle,
  REJECT: ShieldX,
};

function shorten(value, start = 12, end = 8) {
  if (!value) return "Pending";
  return `${value.slice(0, start)}…${value.slice(-end)}`;
}

function DecisionReceipt({ result }) {
  if (!result) {
    return (
      <section className="panel receipt-empty">
        <ReceiptText size={34} />
        <h2>Decision receipt</h2>
        <p>
          Evaluate lesson evidence to see the policy result, or execute an
          approved payment to receive a Circle and Arc transaction receipt.
        </p>
      </section>
    );
  }

  const decision = result.decision;
  const Icon =
    decisionIcons[decision.decision] ?? AlertTriangle;

  const transaction = result.transaction;

  return (
    <section
      className={`panel receipt-panel receipt-${decision.decision.toLowerCase()}`}
    >
      <div className="receipt-header">
        <div className="decision-icon">
          <Icon size={27} />
        </div>

        <div>
          <span className="eyebrow">
            SkillPay policy receipt
          </span>
          <h2>{decision.decision}</h2>
          <p>{decision.explanation}</p>
        </div>

        <div className="decision-amount">
          <span>Authorized</span>
          <strong>
            {decision.authorizedAmount || 0} USDC
          </strong>
        </div>
      </div>

      <div className="agent-sequence">
        <span className="sequence-step complete">
          <Check size={15} />
          Evidence
        </span>

        <span className="sequence-line" />

        <span className="sequence-step complete">
          <Check size={15} />
          Policy
        </span>

        <span className="sequence-line" />

        <span
          className={`sequence-step ${
            result.paymentSubmitted
              ? "complete"
              : "blocked"
          }`}
        >
          {result.paymentSubmitted ? (
            <Check size={15} />
          ) : (
            <X size={15} />
          )}
          Settlement
        </span>
      </div>

      <div className="checks-list">
        {decision.checks.map((check) => (
          <article
            className={`check-row ${
              check.passed ? "passed" : "failed"
            }`}
            key={check.rule}
          >
            <div className="check-icon">
              {check.passed ? (
                <CheckCircle2 size={19} />
              ) : (
                <X size={19} />
              )}
            </div>

            <div className="check-main">
              <strong>{check.rule}</strong>
              <p>{check.reason}</p>
            </div>

            <div className="check-values">
              <span>{check.observed}</span>
              <small>{check.required}</small>
            </div>
          </article>
        ))}
      </div>

      {transaction && (
        <div className="transaction-card">
          <div>
            <span>Circle transaction state</span>
            <StatusBadge status={transaction.state} />
          </div>

          <div>
            <span>Transaction ID</span>
            <strong>
              {shorten(transaction.transactionId || transaction.id)}
            </strong>
          </div>

          <div>
            <span>Arc transaction hash</span>
            <strong>
              {shorten(transaction.transactionHash)}
            </strong>
          </div>

          {transaction.explorerUrl && (
            <a
              href={transaction.explorerUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open Arc receipt
              <ExternalLink size={15} />
            </a>
          )}
        </div>
      )}

      <div className="receipt-footer">
        <div>
          <span>Agreement</span>
          <strong>
            #{result.onchainAgreementId ?? "—"}
          </strong>
        </div>

        <div>
          <span>Milestone</span>
          <strong>{result.milestoneId}</strong>
        </div>

        <div>
          <span>Execution mode</span>
          <strong>{result.mode}</strong>
        </div>
      </div>
    </section>
  );
}

export default DecisionReceipt;