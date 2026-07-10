import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as ideasApi from '../api/ideasApi';
import { IDEA_DOMAINS } from '../utils/constants';
import StatusBadge from '../components/StatusBadge';
import Card from '../components/Card';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

const STATUS_OPTIONS = [
  'Draft',
  'Submitted',
  'Under Review',
  'Needs Completion',
  'Approved for Pilot',
  'In Progress',
  'Completed',
  'Closed',
];

/** Lists ideas visible to the current role; the API applies the actual visibility rules. */
function IdeasList() {
  const [ideas, setIdeas] = useState(null);
  const [filters, setFilters] = useState({ status: '', domain: '', search: '' });
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.domain) params.domain = filters.domain;
      if (filters.search) params.search = filters.search;
      const { data } = await ideasApi.listIdeas(params);
      setIdeas(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load ideas');
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  return (
    <div>
      <h1>Ideas</h1>

      <Card className="filters">
        <input
          placeholder="Search by keyword..."
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
        />
        <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select value={filters.domain} onChange={(e) => setFilters((f) => ({ ...f, domain: e.target.value }))}>
          <option value="">All domains</option>
          {IDEA_DOMAINS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </Card>

      {error && <div className="alert alert-error">{error}</div>}
      {!ideas && !error && <LoadingState label="Loading ideas..." />}
      {ideas && ideas.length === 0 && <EmptyState message="No ideas match these filters" />}

      {ideas && ideas.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Title</th>
              <th>Domain</th>
              <th>Department</th>
              <th>Owner</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {ideas.map((idea) => (
              <tr key={idea._id}>
                <td>
                  <Link to={`/ideas/${idea._id}`}>{idea.code}</Link>
                </td>
                <td>{idea.title}</td>
                <td>{idea.domain}</td>
                <td>{idea.department?.name}</td>
                <td>{idea.owner?.username}</td>
                <td>
                  <StatusBadge status={idea.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default IdeasList;
