import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as ideasApi from '../api/ideasApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ROLES, DECISION_OUTCOMES, CRITERIA_LABELS } from '../utils/constants';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import IdeaTimeline from '../components/IdeaTimeline';
import LoadingState from '../components/LoadingState';

/** Read-only summary of the evaluator's scores and system suggestion. */
function EvaluationSummary({ evaluation }) {
  if (!evaluation) return <p className="hint">Not evaluated yet.</p>;
  return (
    <>
      <ul className="report-list">
        {Object.entries(evaluation.scores).map(([key, value]) => (
          <li key={key}>
            <span>{CRITERIA_LABELS[key] || key}</span>
            <strong>{value}</strong>
          </li>
        ))}
      </ul>
      <p>
        <strong>Weighted total:</strong> {evaluation.weightedTotal} — {evaluation.systemSuggestion}
      </p>
      {evaluation.recommendation && <p>{evaluation.recommendation}</p>}
    </>
  );
}

/** Read-only summary of the committee's latest decision. Reason is always shown to the owner. */
function DecisionSummary({ decision }) {
  if (!decision) return <p className="hint">No decision yet.</p>;
  return (
    <p>
      <strong>{decision.outcome}</strong> by {decision.decidedBy?.username}
      {decision.reason && <> — {decision.reason}</>}
    </p>
  );
}

/** Coordinator-only actions available while an idea is Submitted. */
function ScreeningActions({ onForward, onRequestCompletion }) {
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  return (
    <div className="form-actions">
      <Button onClick={onForward}>Forward to Evaluation</Button>
      <Button variant="secondary" onClick={() => setShowNoteDialog(true)}>
        Request Completion
      </Button>
      {showNoteDialog && (
        <ConfirmDialog
          title="Request Completion"
          message="Explain what the owner needs to complete before this idea can move forward."
          requireNote
          confirmLabel="Send Back"
          onCancel={() => setShowNoteDialog(false)}
          onConfirm={(note) => {
            setShowNoteDialog(false);
            onRequestCompletion(note);
          }}
        />
      )}
    </div>
  );
}

/** Committee-only decision actions available once an idea Under Review has been evaluated. */
function DecisionActions({ onDecide }) {
  const [dialog, setDialog] = useState(null); // 'return' | 'reject' | null

  return (
    <div className="form-actions">
      <Button onClick={() => onDecide(DECISION_OUTCOMES.APPROVED_FOR_PILOT, '')}>Approve for Pilot</Button>
      <Button variant="secondary" onClick={() => setDialog('return')}>
        Return for Development
      </Button>
      <Button variant="danger" onClick={() => setDialog('reject')}>
        Reject &amp; Close
      </Button>
      {dialog && (
        <ConfirmDialog
          title={dialog === 'return' ? 'Return for Development' : 'Reject & Close'}
          message="A documented reason is required and will be shown to the idea owner."
          requireNote
          danger={dialog === 'reject'}
          confirmLabel={dialog === 'return' ? 'Return' : 'Reject'}
          onCancel={() => setDialog(null)}
          onConfirm={(note) => {
            setDialog(null);
            onDecide(dialog === 'return' ? DECISION_OUTCOMES.RETURNED_FOR_DEVELOPMENT : DECISION_OUTCOMES.REJECTED_AND_CLOSED, note);
          }}
        />
      )}
    </div>
  );
}

function IdeaDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [payload, setPayload] = useState(null);
  const [error, setError] = useState('');
  const [execForm, setExecForm] = useState({ ownerId: '', dueDate: '' });
  const [progressNote, setProgressNote] = useState('');
  const [finalReport, setFinalReport] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await ideasApi.getIdea(id);
      setPayload(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load idea');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!payload) return <LoadingState label="Loading idea..." />;

  const { idea, evaluation, decision, execution } = payload;
  const isOwner = idea.owner?._id === user.id;

  /** Runs a mutating action, refreshes the idea on success, and returns whether it succeeded. */
  const runAction = async (fn, successMessage) => {
    try {
      await fn();
      showToast(successMessage, 'success');
      await load();
      return true;
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed', 'error');
      return false;
    }
  };

  return (
    <div>
      <div className="page-title-row">
        <h1>
          {idea.code}: {idea.title}
        </h1>
        <StatusBadge status={idea.status} />
      </div>

      <div className="dashboard-grid">
        <Card title="Details">
          <p>
            <strong>Domain:</strong> {idea.domain}
          </p>
          <p>
            <strong>Department:</strong> {idea.department?.name}
          </p>
          <p>
            <strong>Owner:</strong> {idea.owner?.username}
          </p>
          <p>
            <strong>Initial Cost:</strong> ${idea.initialCost}
          </p>
          <p>
            <strong>Problem/Opportunity:</strong> {idea.problemStatement || '—'}
          </p>
          <p>
            <strong>Proposed Solution:</strong> {idea.proposedSolution || '—'}
          </p>
          <p>
            <strong>Expected Impact:</strong> {idea.expectedImpact || '—'}
          </p>
          <p>
            <strong>Implementation Requirements:</strong> {idea.implementationRequirements || '—'}
          </p>
          <p>
            <strong>Risks &amp; Dependencies:</strong> {idea.risksAndDependencies || '—'}
          </p>

          {idea.attachments?.length > 0 && (
            <>
              <strong>Attachments:</strong>
              <ul className="attachment-list">
                {idea.attachments.map((a) => (
                  <li key={a.storedName}>
                    <button className="link-button" onClick={() => ideasApi.downloadAttachment(idea._id, a.storedName, a.originalName)}>
                      {a.originalName}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {isOwner && ['Draft', 'Needs Completion'].includes(idea.status) && (
            <Button className="mt" onClick={() => navigate(`/ideas/${idea._id}/edit`)}>
              Edit Idea
            </Button>
          )}
        </Card>

        <Card title="Status Timeline">
          <IdeaTimeline history={idea.statusHistory} />
        </Card>

        <Card title="Evaluation">
          <EvaluationSummary evaluation={evaluation} />
          {user.role === ROLES.EVALUATOR && idea.status === 'Under Review' && !evaluation && (
            <Link to={`/ideas/${idea._id}/evaluate`}>
              <Button className="mt">Evaluate this idea</Button>
            </Link>
          )}
        </Card>

        <Card title="Committee Decision">
          <DecisionSummary decision={decision} />
        </Card>

        {execution && (
          <Card title="Execution">
            <p>
              <strong>Owner:</strong> {execution.owner?.username}
            </p>
            <p>
              <strong>Due date:</strong> {new Date(execution.dueDate).toLocaleDateString()}
            </p>
            <ul className="report-list">
              {execution.progressUpdates.map((p, i) => (
                <li key={i}>
                  <span>{new Date(p.at).toLocaleDateString()}</span>
                  <span>{p.note}</span>
                </li>
              ))}
            </ul>
            {execution.finalReport && (
              <p>
                <strong>Final report:</strong> {execution.finalReport}
              </p>
            )}
          </Card>
        )}
      </div>

      {user.role === ROLES.COORDINATOR && idea.status === 'Submitted' && (
        <Card title="Screening" className="mt">
          <ScreeningActions
            onForward={() => runAction(() => ideasApi.forwardToEvaluation(idea._id), 'Forwarded to evaluation')}
            onRequestCompletion={(note) =>
              runAction(() => ideasApi.requestCompletion(idea._id, note), 'Completion requested')
            }
          />
        </Card>
      )}

      {user.role === ROLES.COMMITTEE && idea.status === 'Under Review' && evaluation && (
        <Card title="Committee Decision" className="mt">
          <DecisionActions
            onDecide={(outcome, reason) =>
              runAction(() => ideasApi.makeDecision(idea._id, { outcome, reason }), 'Decision recorded')
            }
          />
        </Card>
      )}

      {user.role === ROLES.COMMITTEE && idea.status === 'Approved for Pilot' && !execution && (
        <Card title="Assign Execution" className="mt">
          <div className="form-grid">
            <div className="form-field">
              <label>Execution owner (user id)</label>
              <input
                value={execForm.ownerId}
                onChange={(e) => setExecForm((f) => ({ ...f, ownerId: e.target.value }))}
                placeholder={idea.owner?._id}
              />
            </div>
            <div className="form-field">
              <label>Due date</label>
              <input type="date" value={execForm.dueDate} onChange={(e) => setExecForm((f) => ({ ...f, dueDate: e.target.value }))} />
            </div>
          </div>
          <Button
            onClick={() =>
              runAction(
                () => ideasApi.assignExecution(idea._id, { ownerId: execForm.ownerId || idea.owner._id, dueDate: execForm.dueDate }),
                'Execution assigned'
              )
            }
          >
            Assign
          </Button>
        </Card>
      )}

      {execution && !execution.completedAt && idea.status === 'In Progress' && (isOwner || user.role === ROLES.COMMITTEE) && (
        <Card title="Log Progress / Complete" className="mt">
          <div className="form-field">
            <label>Progress note</label>
            <textarea rows={2} value={progressNote} onChange={(e) => setProgressNote(e.target.value)} />
          </div>
          <Button
            variant="secondary"
            onClick={async () => {
              const ok = await runAction(() => ideasApi.addProgressUpdate(idea._id, progressNote), 'Progress logged');
              if (ok) setProgressNote('');
            }}
          >
            Add Progress Update
          </Button>

          <div className="form-field mt">
            <label>Final report (required to complete)</label>
            <textarea rows={3} value={finalReport} onChange={(e) => setFinalReport(e.target.value)} />
          </div>
          <Button onClick={() => runAction(() => ideasApi.completeExecution(idea._id, finalReport), 'Idea marked as completed')}>
            Mark Completed
          </Button>
        </Card>
      )}

      {[ROLES.COMMITTEE, ROLES.ADMIN].includes(user.role) && idea.status === 'Completed' && (
        <Card title="Archive" className="mt">
          <p className="hint">This idea is complete. Closing it moves it to the final archived state.</p>
          <Button onClick={() => runAction(() => ideasApi.closeIdea(idea._id), 'Idea closed')}>Close Idea</Button>
        </Card>
      )}
    </div>
  );
}

export default IdeaDetails;
