export interface TimelineStep {
  label: string;
  state: 'done' | 'active' | 'pending';
}

/**
 * GateTimeline — phase-gated progress for publications. Shows where a publication
 * is without a dense table. State is conveyed by node style + a text label.
 */
export function GateTimeline({ steps }: { steps: TimelineStep[] }) {
  const activeLabel = steps.find((s) => s.state === 'active')?.label;
  return (
    <div>
      <div className="scs-timeline" role="list" aria-label="Phase progress">
        {steps.map((step, i) => (
          <div className="scs-timeline__step" role="listitem" key={step.label}>
            <span
              className={`scs-timeline__node${step.state === 'done' ? ' scs-timeline__node--done' : ''}${
                step.state === 'active' ? ' scs-timeline__node--active' : ''
              }`}
              title={`${step.label}: ${step.state}`}
            />
            {i < steps.length - 1 && <span className="scs-timeline__connector" aria-hidden />}
          </div>
        ))}
      </div>
      {activeLabel && <div className="scs-timeline__label">Current: {activeLabel}</div>}
    </div>
  );
}
