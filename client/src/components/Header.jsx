import { Bot, Radio } from "lucide-react";

function Header({ apiOnline }) {
  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-icon">
          <Bot size={23} />
        </div>

        <div>
          <strong>EduFlow</strong>
          <span>SkillPay Agent</span>
        </div>
      </div>

      <div
        className={`network-status ${
          apiOnline ? "online" : "offline"
        }`}
      >
        <Radio size={14} />
        <span>
          {apiOnline
            ? "Arc Testnet · API online"
            : "API offline"}
        </span>
      </div>
    </header>
  );
}

export default Header;