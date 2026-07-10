import { useEffect, useState } from 'react';
import * as auditLogApi from '../api/auditLogApi';
import Card from '../components/Card';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

function AuditLog() {
  const [entries, setEntries] = useState(null);
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    const params = actionFilter ? { action: actionFilter } : {};
    auditLogApi.listAuditLog(params).then(({ data }) => setEntries(data.data.entries));
  }, [actionFilter]);

  return (
    <div>
      <h1>Audit Log</h1>

      <Card className="filters">
        <input
          placeholder="Filter by action (e.g. idea.transition)..."
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        />
      </Card>

      {!entries && <LoadingState label="Loading audit log..." />}
      {entries && entries.length === 0 && <EmptyState message="No audit entries found" />}

      {entries && entries.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>When</th>
              <th>User</th>
              <th>Action</th>
              <th>Target</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e._id}>
                <td>{new Date(e.createdAt).toLocaleString()}</td>
                <td>
                  {e.user?.username} ({e.user?.role})
                </td>
                <td>{e.action}</td>
                <td>{e.targetType}</td>
                <td>{e.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AuditLog;
