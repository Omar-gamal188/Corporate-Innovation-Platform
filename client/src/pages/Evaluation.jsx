import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as ideasApi from '../api/ideasApi';
import * as criteriaWeightsApi from '../api/criteriaWeightsApi';
import { useToast } from '../context/ToastContext';
import { CRITERIA_LABELS } from '../utils/constants';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingState from '../components/LoadingState';

const EMPTY_SCORES = {
  businessImpact: 50,
  feasibility: 50,
  initialCost: 50,
  innovation: 50,
  implementationRisk: 50,
  scalability: 50,
};

/** Live preview of the weighted total, computed the same way the server does, for instant feedback. */
function computeLiveTotal(scores, weights) {
  if (!weights) return null;
  const total = Object.keys(EMPTY_SCORES).reduce((sum, key) => sum + (Number(scores[key]) * weights[key]) / 100, 0);
  return Math.round(total * 100) / 100;
}

function Evaluation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [idea, setIdea] = useState(null);
  const [weights, setWeights] = useState(null);
  const [scores, setScores] = useState(EMPTY_SCORES);
  const [recommendation, setRecommendation] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([ideasApi.getIdea(id), criteriaWeightsApi.getWeights()])
      .then(([ideaRes, weightsRes]) => {
        setIdea(ideaRes.data.data.idea);
        setWeights(weightsRes.data.data);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load'));
  }, [id]);

  const handleScoreChange = (key) => (e) => setScores((s) => ({ ...s, [key]: Number(e.target.value) }));

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      await ideasApi.submitEvaluation(id, { scores, recommendation });
      showToast('Evaluation submitted', 'success');
      navigate(`/ideas/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit evaluation');
    } finally {
      setSaving(false);
    }
  };

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!idea) return <LoadingState label="Loading..." />;

  const liveTotal = computeLiveTotal(scores, weights);

  return (
    <div>
      <h1>Evaluate: {idea.title}</h1>
      <p className="hint">{idea.code}</p>

      <Card title="Weighted Scores (0-100 each)">
        <div className="form-grid">
          {Object.keys(EMPTY_SCORES).map((key) => (
            <div className="form-field" key={key}>
              <label>
                {CRITERIA_LABELS[key]} (weight: {weights?.[key]}%)
              </label>
              <input type="number" min="0" max="100" value={scores[key]} onChange={handleScoreChange(key)} />
            </div>
          ))}
        </div>

        <div className="form-field form-field-wide">
          <label>Recommendation</label>
          <textarea rows={3} value={recommendation} onChange={(e) => setRecommendation(e.target.value)} />
        </div>

        {liveTotal !== null && (
          <p className="kpi-number">
            Weighted total: {liveTotal} {liveTotal >= 80 ? '(Recommend Pilot)' : liveTotal >= 60 ? '(Needs Development)' : '(Archive)'}
          </p>
        )}

        <Button onClick={handleSubmit} disabled={saving}>
          Submit Evaluation
        </Button>
      </Card>
    </div>
  );
}

export default Evaluation;
