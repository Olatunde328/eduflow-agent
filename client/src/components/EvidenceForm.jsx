import { useEffect, useState } from "react";
import { Bot, Play, RotateCcw } from "lucide-react";

const defaultEvidence = {
  milestoneId: "lesson_001",
  durationMinutes: 52,
  learnerConfirmed: true,
  assessmentScore: 80,
  requestedAmount: 10,
  tutorStatement: "Completed algebra lesson and learner assessment.",
};

function EvidenceForm({ agreement, onEvaluate, evaluating }) {
  const [form, setForm] = useState(defaultEvidence);

  useEffect(() => {
    if (agreement?.milestones?.length && !form.milestoneId) {
      setForm((current) => ({
        ...current,
        milestoneId: agreement.milestones[0].id,
      }));
    }
  }, [agreement, form.milestoneId]);

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? Number(value)
            : value,
    }));
  };

  const loadScenario = (scenario) => {
    if (scenario === "pay") {
      setForm({
        milestoneId: "lesson_001",
        durationMinutes: 52,
        learnerConfirmed: true,
        assessmentScore: 80,
        requestedAmount: 10,
        tutorStatement: "Completed algebra lesson and learner assessment.",
      });
    }

    if (scenario === "hold") {
      setForm({
        milestoneId: "lesson_002",
        durationMinutes: 48,
        learnerConfirmed: false,
        assessmentScore: 75,
        requestedAmount: 10,
        tutorStatement: "Lesson completed but learner confirmation is missing.",
      });
    }

    if (scenario === "reject") {
      setForm({
        milestoneId: "lesson_003",
        durationMinutes: 50,
        learnerConfirmed: true,
        assessmentScore: 82,
        requestedAmount: 15,
        tutorStatement: "Payment request exceeds the approved lesson amount.",
      });
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onEvaluate(form);
  };

  return (
    <section className="panel evidence-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Agent workspace</span>
          <h2>Submit lesson evidence</h2>
        </div>

        <Bot size={25} />
      </div>

      <div className="scenario-buttons">
        <button type="button" onClick={() => loadScenario("pay")}>
          Valid payment
        </button>

        <button type="button" onClick={() => loadScenario("hold")}>
          Missing evidence
        </button>

        <button type="button" onClick={() => loadScenario("reject")}>
          Overspending attempt
        </button>
      </div>

      <form onSubmit={handleSubmit} className="evidence-form">
        <label>
          Milestone
          <select
            name="milestoneId"
            value={form.milestoneId}
            onChange={updateField}
          >
            {agreement?.milestones?.map((milestone) => (
              <option key={milestone.id} value={milestone.id}>
                Lesson {milestone.sequence}: {milestone.title}
              </option>
            ))}
          </select>
        </label>

        <div className="form-row">
          <label>
            Lesson duration
            <div className="input-with-unit">
              <input
                type="number"
                name="durationMinutes"
                min="0"
                value={form.durationMinutes}
                onChange={updateField}
              />
              <span>minutes</span>
            </div>
          </label>

          <label>
            Assessment score
            <div className="input-with-unit">
              <input
                type="number"
                name="assessmentScore"
                min="0"
                max="100"
                value={form.assessmentScore}
                onChange={updateField}
              />
              <span>%</span>
            </div>
          </label>
        </div>

        <label>
          Requested payment
          <div className="input-with-unit">
            <input
              type="number"
              name="requestedAmount"
              min="0.01"
              step="0.01"
              value={form.requestedAmount}
              onChange={updateField}
            />
            <span>USDC</span>
          </div>
        </label>

        <label className="confirmation-control">
          <input
            type="checkbox"
            name="learnerConfirmed"
            checked={form.learnerConfirmed}
            onChange={updateField}
          />

          <span>
            <strong>Learner confirmed completion</strong>
            <small>This agreement requires learner confirmation.</small>
          </span>
        </label>

        <label>
          Tutor statement
          <textarea
            name="tutorStatement"
            rows="4"
            maxLength="1000"
            value={form.tutorStatement}
            onChange={updateField}
          />
        </label>

        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setForm(defaultEvidence)}
          >
            <RotateCcw size={17} />
            Reset
          </button>

          <button
            type="submit"
            className="primary-button"
            disabled={evaluating}
          >
            <Play size={17} />
            {evaluating ? "Agent evaluating..." : "Run SkillPay Agent"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default EvidenceForm;
