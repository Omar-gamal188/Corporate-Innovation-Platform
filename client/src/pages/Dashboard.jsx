import { useEffect, useState } from 'react';
import * as dashboardApi from '../api/dashboardApi';
import Card from '../components/Card';
import LoadingState from '../components/LoadingState';

function Dashboard() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardApi
      .getDashboard()
      .then(({ data }) => setReport(data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard'));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!report) return <LoadingState label="Loading dashboard..." />;

  const { kpis, funnel, byDepartment, byDomain, avgEvaluationTimeHours, implementationRatePercent } = report;

  return (
    <div>
      <h1>Dashboard</h1>

      <div className="kpi-grid">
        <Card title="Total Ideas">
          <p className="kpi-number">{kpis.total}</p>
        </Card>
        <Card title="Under Evaluation">
          <p className="kpi-number">{kpis.underEvaluation}</p>
        </Card>
        <Card title="Approved for Pilot">
          <p className="kpi-number">{kpis.approvedForPilot}</p>
        </Card>
        <Card title="Completed">
          <p className="kpi-number">{kpis.completed}</p>
        </Card>
      </div>

      <div className="dashboard-grid">
        <Card title="Conversion Funnel">
          <ul className="funnel">
            {funnel.map((stage) => (
              <li key={stage.stage}>
                <span>{stage.stage}</span>
                <strong>{stage.count}</strong>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="By Department">
          <ul className="report-list">
            {byDepartment.map((row) => (
              <li key={row.department}>
                <span>{row.department}</span>
                <strong>{row.count}</strong>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="By Domain">
          <ul className="report-list">
            {byDomain.map((row) => (
              <li key={row.domain}>
                <span>{row.domain}</span>
                <strong>{row.count}</strong>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Performance">
          <ul className="report-list">
            <li>
              <span>Avg. evaluation time</span>
              <strong>{avgEvaluationTimeHours}h</strong>
            </li>
            <li>
              <span>Implementation rate</span>
              <strong>{implementationRatePercent}%</strong>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
