import StatusBadge from './StatusBadge';

/** Suggested feature: visual timeline of every status change an idea has gone through. */
function IdeaTimeline({ history }) {
  if (!history || history.length === 0) return null;

  return (
    <ul className="timeline">
      {history.map((entry, i) => (
        <li key={i} className="timeline-entry">
          <div className="timeline-marker" />
          <div className="timeline-content">
            <div className="timeline-heading">
              <StatusBadge status={entry.to} />
              <span className="timeline-actor">by {entry.by?.username || 'system'}</span>
              <span className="timeline-date">{new Date(entry.at).toLocaleString()}</span>
            </div>
            {entry.note && <p className="timeline-note">{entry.note}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default IdeaTimeline;
