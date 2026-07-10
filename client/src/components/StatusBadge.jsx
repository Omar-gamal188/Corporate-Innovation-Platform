import { STATUS_COLORS } from '../utils/constants';

function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || '#6b7280';
  return (
    <span className="status-badge" style={{ backgroundColor: `${color}1a`, color, borderColor: `${color}55` }}>
      {status}
    </span>
  );
}

export default StatusBadge;
