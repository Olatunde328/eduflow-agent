import {
  ArrowRight,
  Clock3,
  RefreshCw,
  ShieldCheck,
  Target,
  WalletCards,
} from "lucide-react";
import StatusBadge from "./StatusBadge";

function shortenAddress(address) {
  if (!address) return "Not configured";
  return `${address.slice(0, 7)}…${address.slice(-5)}`;
}

function AgreementCard({ agreement, onRefresh }) {
  if (!agreement) return null;

  const paid = Number(agreement.amountPaid || 0);
  const total = Number(agreement.totalBudget || 0);
  const progress = total
    ? Math.min(100, Math.round((paid / total) * 100))
    : 0;

  return (
    <section className="panel agreement-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Funded agreement</span>
          <h2>{agreement.title}</h2>
        </div>

        <div className="heading-actions">
          <StatusBadge status={agreement.status} />

          <button
            className="icon-button"
            onClick={onRefresh}
            type="button"
            title="Refresh agreement"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="agreement-parties">
        <div className="party-card">
          <span>Payer</span>
          <strong>{agreement.payer.name}</strong>
          <small>
            {shortenAddress(agreement.payer.walletAddress)}
          </small>
        </div>

        <ArrowRight className="party-divider" size={20} />

        <div className="party-card">
          <span>Tutor provider</span>
          <strong>{agreement.provider.name}</strong>
          <small>
            {shortenAddress(agreement.provider.walletAddress)}
          </small>
        </div>
      </div>

      <div className="budget-card">
        <div className="budget-top">
          <div>
            <span>Remaining budget</span>
            <strong>{agreement.remainingBudget} USDC</strong>
          </div>

          <div className="budget-paid">
            <span>Paid</span>
            <strong>{agreement.amountPaid} USDC</strong>
          </div>
        </div>

        <div className="budget-progress">
          <div style={{ width: `${progress}%` }} />
        </div>

        <div className="budget-footer">
          <span>{progress}% settled</span>
          <span>{agreement.totalBudget} USDC escrowed</span>
        </div>
      </div>

      <div className="policy-grid">
        <div className="policy-item">
          <WalletCards size={18} />
          <div>
            <span>Maximum milestone</span>
            <strong>{agreement.amountPerMilestone} USDC</strong>
          </div>
        </div>

        <div className="policy-item">
          <Clock3 size={18} />
          <div>
            <span>Minimum duration</span>
            <strong>
              {agreement.minimumDurationMinutes} minutes
            </strong>
          </div>
        </div>

        <div className="policy-item">
          <Target size={18} />
          <div>
            <span>Assessment threshold</span>
            <strong>
              {agreement.minimumAssessmentScore}%
            </strong>
          </div>
        </div>

        <div className="policy-item">
          <ShieldCheck size={18} />
          <div>
            <span>Agent authority</span>
            <strong>{agreement.autoPayLimit} USDC</strong>
          </div>
        </div>
      </div>

      <div className="milestone-list">
        {agreement.milestones.map((milestone) => (
          <div className="milestone-row" key={milestone.id}>
            <span className="milestone-sequence">
              {milestone.sequence}
            </span>

            <div>
              <strong>{milestone.title}</strong>
              <small>{milestone.id}</small>
            </div>

            <StatusBadge status={milestone.status} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default AgreementCard;