import {
  ArrowRightLeft,
  BookOpen,
  CalendarClock,
  CircleDollarSign,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";
import StatusBadge from "./StatusBadge";

function AgreementCard({ agreement }) {
  if (!agreement) {
    return <section className="panel loading-panel">Loading agreement...</section>;
  }

  const budgetUsed =
    agreement.totalBudget > 0
      ? (agreement.amountPaid / agreement.totalBudget) * 100
      : 0;

  return (
    <section className="panel agreement-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Active learning agreement</span>
          <h2>{agreement.title}</h2>
        </div>

        <StatusBadge status={agreement.status} />
      </div>

      <div className="agreement-parties">
        <div className="party-card">
          <span>Payer</span>
          <strong>{agreement.payer.name}</strong>
          <small>{agreement.payer.walletAddress}</small>
        </div>

        <div className="party-divider" aria-hidden="true">
          <ArrowRightLeft size={18} />
        </div>

        <div className="party-card">
          <span>Provider</span>
          <strong>{agreement.provider.name}</strong>
          <small>{agreement.provider.walletAddress}</small>
        </div>
      </div>

      <div className="budget-card">
        <div className="budget-top">
          <div>
            <span>Authorized budget</span>
            <strong>
              {agreement.totalBudget} {agreement.currency}
            </strong>
          </div>

          <CircleDollarSign size={28} />
        </div>

        <div className="budget-progress">
          <div style={{ width: `${budgetUsed}%` }} />
        </div>

        <div className="budget-footer">
          <span>{agreement.amountPaid} USDC paid</span>
          <span>{agreement.remainingBudget} USDC remaining</span>
        </div>
      </div>

      <div className="policy-grid">
        <div className="policy-item">
          <BookOpen size={19} />
          <div>
            <span>Subject</span>
            <strong>{agreement.subject}</strong>
          </div>
        </div>

        <div className="policy-item">
          <GraduationCap size={19} />
          <div>
            <span>Minimum score</span>
            <strong>{agreement.minimumAssessmentScore}%</strong>
          </div>
        </div>

        <div className="policy-item">
          <CalendarClock size={19} />
          <div>
            <span>Minimum duration</span>
            <strong>{agreement.minimumDurationMinutes} minutes</strong>
          </div>
        </div>

        <div className="policy-item">
          <ShieldCheck size={19} />
          <div>
            <span>Automatic payment limit</span>
            <strong>{agreement.autoPayLimit} USDC</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AgreementCard;
