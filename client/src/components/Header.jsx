import { ShieldCheck, WalletCards } from "lucide-react";

function Header({ apiOnline }) {
  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-icon">
          <WalletCards size={24} />
        </div>

        <div>
          <strong>EduFlow</strong>
          <span>SkillPay Agent</span>
        </div>
      </div>

      <div className={`network-status ${apiOnline ? "online" : "offline"}`}>
        <ShieldCheck size={16} />
        <span>{apiOnline ? "EduFlow API Online" : "API Offline"}</span>
      </div>
    </header>
  );
}

export default Header;

