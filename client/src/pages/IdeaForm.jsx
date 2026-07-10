import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as ideasApi from '../api/ideasApi';
import * as departmentsApi from '../api/departmentsApi';
import { useToast } from '../context/ToastContext';
import { IDEA_DOMAINS } from '../utils/constants';
import { validateAttachment } from '../utils/validators';
import Button from '../components/Button';
import Card from '../components/Card';
import Modal from '../components/Modal';
import LoadingState from '../components/LoadingState';

const EMPTY_FORM = {
  title: '',
  domain: '',
  department: '',
  problemStatement: '',
  proposedSolution: '',
  expectedImpact: '',
  initialCost: '',
  implementationRequirements: '',
  risksAndDependencies: '',
};

/** Handles both "create a new idea" (/ideas/new) and "edit a draft" (/ideas/:id/edit). */
function IdeaForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState(EMPTY_FORM);
  const [ideaId, setIdeaId] = useState(id || null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [duplicates, setDuplicates] = useState(null);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    departmentsApi.listDepartments().then(({ data }) => setDepartments(data.data));
  }, []);

  useEffect(() => {
    if (!id) return;
    ideasApi
      .getIdea(id)
      .then(({ data }) => {
        const idea = data.data.idea;
        setForm({
          title: idea.title,
          domain: idea.domain,
          department: idea.department._id,
          problemStatement: idea.problemStatement,
          proposedSolution: idea.proposedSolution,
          expectedImpact: idea.expectedImpact,
          initialCost: idea.initialCost,
          implementationRequirements: idea.implementationRequirements,
          risksAndDependencies: idea.risksAndDependencies,
        });
        setAttachments(idea.attachments);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load idea'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  /** Creates the draft on first save, or updates it on every save after that. */
  const persist = async () => {
    const payload = { ...form, initialCost: form.initialCost === '' ? 0 : Number(form.initialCost) };
    if (ideaId) {
      const { data } = await ideasApi.updateIdea(ideaId, payload);
      return data.data;
    }
    const { data } = await ideasApi.createDraft(payload);
    setIdeaId(data.data._id);
    return data.data;
  };

  const handleSaveDraft = async () => {
    setError('');
    setSaving(true);
    try {
      await persist();
      showToast('Draft saved', 'success');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitClick = async () => {
    setError('');
    setSaving(true);
    try {
      const idea = await persist();
      const { data } = await ideasApi.checkDuplicates(idea._id);
      if (data.data.length > 0) {
        setDuplicates(data.data);
      } else {
        await doSubmit(idea._id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit idea');
    } finally {
      setSaving(false);
    }
  };

  const doSubmit = async (targetId) => {
    await ideasApi.submitForReview(targetId);
    showToast('Idea submitted for review', 'success');
    navigate(`/ideas/${targetId}`);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      const err = validateAttachment(file);
      if (err) {
        showToast(err, 'error');
        return;
      }
    }
    setPendingFiles(files);
  };

  const handleUpload = async () => {
    if (pendingFiles.length === 0 || !ideaId) return;
    try {
      const { data } = await ideasApi.uploadAttachments(ideaId, pendingFiles);
      setAttachments(data.data.attachments);
      setPendingFiles([]);
      showToast('Attachments uploaded', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Upload failed', 'error');
    }
  };

  if (loading) return <LoadingState label="Loading idea..." />;

  return (
    <div>
      <h1>{id ? 'Edit Idea' : 'New Idea'}</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <Card>
        <div className="form-grid">
          <div className="form-field">
            <label>Title *</label>
            <input value={form.title} onChange={handleChange('title')} maxLength={150} />
          </div>

          <div className="form-field">
            <label>Idea Domain *</label>
            <select value={form.domain} onChange={handleChange('domain')}>
              <option value="">Select domain</option>
              {IDEA_DOMAINS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Department *</label>
            <select value={form.department} onChange={handleChange('department')}>
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Initial Cost</label>
            <input type="number" min="0" value={form.initialCost} onChange={handleChange('initialCost')} />
          </div>

          <div className="form-field form-field-wide">
            <label>Problem or Opportunity</label>
            <textarea rows={3} value={form.problemStatement} onChange={handleChange('problemStatement')} />
          </div>

          <div className="form-field form-field-wide">
            <label>Proposed Solution</label>
            <textarea rows={3} value={form.proposedSolution} onChange={handleChange('proposedSolution')} />
          </div>

          <div className="form-field form-field-wide">
            <label>Expected Impact</label>
            <textarea rows={3} value={form.expectedImpact} onChange={handleChange('expectedImpact')} />
          </div>

          <div className="form-field form-field-wide">
            <label>Implementation Requirements</label>
            <textarea rows={3} value={form.implementationRequirements} onChange={handleChange('implementationRequirements')} />
          </div>

          <div className="form-field form-field-wide">
            <label>Risks &amp; Dependencies</label>
            <textarea rows={3} value={form.risksAndDependencies} onChange={handleChange('risksAndDependencies')} />
          </div>
        </div>

        <div className="form-actions">
          <Button variant="secondary" disabled={saving} onClick={handleSaveDraft}>
            Save as Draft
          </Button>
          <Button disabled={saving} onClick={handleSubmitClick}>
            Submit for Review
          </Button>
        </div>
      </Card>

      {ideaId && (
        <Card title="Supporting Attachments" className="mt">
          <ul className="attachment-list">
            {attachments.map((a) => (
              <li key={a.storedName}>{a.originalName}</li>
            ))}
          </ul>
          <input type="file" multiple onChange={handleFileChange} />
          <Button variant="secondary" onClick={handleUpload} disabled={pendingFiles.length === 0}>
            Upload
          </Button>
          <p className="hint">Images, PDF, or Office documents. Max 5MB each.</p>
        </Card>
      )}

      {duplicates && (
        <Modal title="Similar ideas found" onClose={() => setDuplicates(null)}>
          <p>These existing ideas look similar. You can still submit if yours is different.</p>
          <ul className="duplicate-list">
            {duplicates.map((d) => (
              <li key={d._id}>
                <strong>{d.code}</strong> — {d.title} <span className="hint">({d.status})</span>
              </li>
            ))}
          </ul>
          <div className="modal-actions">
            <Button variant="ghost" onClick={() => setDuplicates(null)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                await doSubmit(ideaId);
                setDuplicates(null);
              }}
            >
              Submit anyway
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default IdeaForm;
