import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as usersApi from '../api/usersApi';
import * as criteriaWeightsApi from '../api/criteriaWeightsApi';
import { ROLES, CRITERIA_LABELS } from '../utils/constants';
import { isPasswordStrongEnough, getPasswordStrength } from '../utils/validators';
import Card from '../components/Card';
import Button from '../components/Button';

const STRENGTH_LABELS = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];

/** Suggested feature: a simple visual password strength meter (client-side hint only). */
function PasswordStrengthMeter({ password }) {
  const score = getPasswordStrength(password);
  return (
    <div className="strength-meter">
      <div className="strength-bar">
        <div className={`strength-fill strength-${score}`} style={{ width: `${(score / 4) * 100}%` }} />
      </div>
      <span className="hint">{password ? STRENGTH_LABELS[score] : ''}</span>
    </div>
  );
}

function ChangePasswordCard() {
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isPasswordStrongEnough(newPassword)) {
      setError('New password must be at least 8 characters and include letters and numbers');
      return;
    }
    try {
      await usersApi.changeOwnPassword(currentPassword, newPassword);
      showToast('Password changed', 'success');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    }
  };

  return (
    <Card title="Change Password">
      <form onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-field">
          <label>Current Password</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
        </div>
        <div className="form-field">
          <label>New Password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          <PasswordStrengthMeter password={newPassword} />
        </div>
        <Button type="submit">Update Password</Button>
      </form>
    </Card>
  );
}

function CriteriaWeightsCard() {
  const { showToast } = useToast();
  const [weights, setWeights] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    criteriaWeightsApi.getWeights().then(({ data }) => setWeights(data.data));
  }, []);

  if (!weights) return null;

  const total = Object.keys(CRITERIA_LABELS).reduce((sum, key) => sum + Number(weights[key] || 0), 0);

  const handleChange = (key) => (e) => setWeights((w) => ({ ...w, [key]: Number(e.target.value) }));

  const handleSave = async () => {
    setError('');
    try {
      await criteriaWeightsApi.updateWeights(weights);
      showToast('Criteria weights updated', 'success');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update weights');
    }
  };

  return (
    <Card title="Evaluation Criteria Weights" className="mt">
      {error && <div className="alert alert-error">{error}</div>}
      <div className="form-grid">
        {Object.entries(CRITERIA_LABELS).map(([key, label]) => (
          <div className="form-field" key={key}>
            <label>{label} (%)</label>
            <input type="number" min="0" max="100" value={weights[key]} onChange={handleChange(key)} />
          </div>
        ))}
      </div>
      <p className={total === 100 ? 'hint' : 'alert alert-error'}>Total: {total}% (must equal 100%)</p>
      <Button onClick={handleSave} disabled={total !== 100}>
        Save Weights
      </Button>
    </Card>
  );
}

function Settings() {
  const { user } = useAuth();
  return (
    <div>
      <h1>Settings</h1>
      <ChangePasswordCard />
      {user.role === ROLES.ADMIN && <CriteriaWeightsCard />}
    </div>
  );
}

export default Settings;
