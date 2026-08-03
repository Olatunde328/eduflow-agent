import { Bot, Play, ScanSearch } from "lucide-react";
import { useEffect, useState } from "react";

const scenarios = {
  valid: {
    durationMinutes: 55,
    learnerConfirmed: true,
    assessmentScore: 82,
    requestedAmount: 10,
    tutorStatement:
      "The learner completed the algebra lesson and passed the assessment.",
  },
  hold: {
    durationMinutes: 25,
    learnerConfirmed: false,
    assessmentScore: 75,
    requestedAmount: 10,
    tutorStatement:
      "The lesson started, but learner confirmation is still pending.",
  },
  escalate: {
    durationMinutes: 55,
    learnerConfirmed: true,
    assessmentScore: 45,
    requestedAmount: 10,
    tutorStatement:
      "The lesson was completed, but the learner needs further support.",
  },
};

function EvidenceForm({
  agreement,
  onEvaluate,
  onExecute,
  busy,
}) {
  const firstPending =
    agreement?.milestones?.find(
      (milestone) => !milestone.paid,
    ) ?? agreement?.milestones?.[0];

  const [form, setForm] = useState({
    milestoneId: firstPending?.id ?? "lesson_001",
    durationMinutes: 55,
    learnerConfirmed: true,
    assessmentScore: 82,
    requestedAmount: 10,
    tutorStatement:
      "The learner completed the lesson and demonstrated the expected outcome.",
  });

  useEffect(() => {
    if (firstPending?.id) {
      setForm((current) => ({
        ...current,
        milestoneId: firstPending.id,
      }));
    }
  }, [firstPending?.id]);

  function update(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function applyScenario(name) {
    setForm((current) => ({
      ...current,
      ...scenarios[name],
    }));
  }

  function submit(handler) {
    handler({
      ...form,
      durationMinutes: Number(form.durationMinutes),
      assessmentScore: Number(form.assessmentScore),
      requestedAmount: Number(form.requestedAmount),
    });
  }

  return (
    <section className="panel evidence-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Lesson evidence</span>
          <h2>SkillPay evaluation</h2>
        </div>

        <Bot size={22} />
      </div>

      <p className="panel-description">
        Test the policy engine first, then explicitly execute an approved
        milestone through Circle.
      </p>

      <div className="scenario-buttons">
        <button
          type="button"
          onClick={() => applyScenario("valid")}
        >
          Valid lesson
        </button>

        <button
          type="button"
          onClick={() => applyScenario("hold")}
        >
          Missing evidence
        </button>

        <button
          type="button"
          onClick={() => applyScenario("escalate")}
        >
          Low score
        </button>
      </div>

      <div className="evidence-form">
        <label>
          Milestone
          <select
            value={form.milestoneId}
            onChange={(event) =>
              update("milestoneId", event.target.value)
            }
          >
            {(agreement?.milestones ?? []).map((milestone) => (
              <option
                key={milestone.id}
                value={milestone.id}
                disabled={milestone.paid}
              >
                {milestone.title}
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
                min="0"
                value={form.durationMinutes}
                onChange={(event) =>
                  update(
                    "durationMinutes",
                    event.target.value,
                  )
                }
              />
              <span>minutes</span>
            </div>
          </label>

          <label>
            Assessment score
            <div className="input-with-unit">
              <input
                type="number"
                min="0"
                max="100"
                value={form.assessmentScore}
                onChange={(event) =>
                  update(
                    "assessmentScore",
                    event.target.value,
                  )
                }
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
              min="0.01"
              max="10"
              step="0.01"
              value={form.requestedAmount}
              onChange={(event) =>
                update(
                  "requestedAmount",
                  event.target.value,
                )
              }
            />
            <span>USDC</span>
          </div>
        </label>

        <label className="confirmation-control">
          <input
            type="checkbox"
            checked={form.learnerConfirmed}
            onChange={(event) =>
              update(
                "learnerConfirmed",
                event.target.checked,
              )
            }
          />

          <div>
            <strong>Learner confirmed completion</strong>
            <small>
              Required before the agent can authorize payment.
            </small>
          </div>
        </label>

        <label>
          Tutor statement
          <textarea
            rows="4"
            value={form.tutorStatement}
            onChange={(event) =>
              update("tutorStatement", event.target.value)
            }
          />
        </label>

        <div className="form-actions">
          <button
            className="secondary-button"
            type="button"
            disabled={busy}
            onClick={() => submit(onEvaluate)}
          >
            <ScanSearch size={17} />
            Evaluate only
          </button>

          <button
            className="primary-button"
            type="button"
            disabled={busy}
            onClick={() => submit(onExecute)}
          >
            <Play size={17} />
            Execute approved payment
          </button>
        </div>
      </div>
    </section>
  );
}

export default EvidenceForm;