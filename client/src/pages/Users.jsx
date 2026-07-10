import { useEffect, useState } from 'react';
import * as usersApi from '../api/usersApi';
import * as departmentsApi from '../api/departmentsApi';
import { useToast } from '../context/ToastContext';
import { ROLES, ROLE_LABELS } from '../utils/constants';
import { isPasswordStrongEnough } from '../utils/validators';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingState from '../components/LoadingState';

const EMPTY_FORM = { username: '', email: '', password: '', role: ROLES.EMPLOYEE, department: '' };

function Users() {
  const { showToast } = useToast();
  const [users, setUsers] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const load = () => usersApi.listUsers().then(({ data }) => setUsers(data.data));

  useEffect(() => {
    load();
    departmentsApi.listDepartments().then(({ data }) => setDepartments(data.data));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (!isPasswordStrongEnough(form.password)) {
      setError('Password must be at least 8 characters and include letters and numbers');
      return;
    }
    try {
      await usersApi.createUser(form);
      showToast('User created', 'success');
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleRoleChange = async (userId, role) => {
    await usersApi.updateUser(userId, { role });
    showToast('Role updated', 'success');
    load();
  };

  const handleToggleActive = async (userId, isActive) => {
    await usersApi.updateUser(userId, { isActive: !isActive });
    showToast(isActive ? 'User deactivated' : 'User activated', 'success');
    load();
  };

  const handleUnlock = async (userId) => {
    await usersApi.unlockUser(userId);
    showToast('User unlocked', 'success');
    load();
  };

  return (
    <div>
      <h1>Users</h1>

      <Card title="Create User">
        <form onSubmit={handleCreate}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-grid">
            <div className="form-field">
              <label>Username</label>
              <input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} required />
            </div>
            <div className="form-field">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="form-field">
              <label>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
              />
            </div>
            <div className="form-field">
              <label>Role</label>
              <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                {Object.values(ROLES).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Department</label>
              <select value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} required>
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button type="submit">Create User</Button>
        </form>
      </Card>

      <Card title="All Users" className="mt">
        {!users && <LoadingState />}
        {users && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>
                    <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)}>
                      {Object.values(ROLES).map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{u.department?.name}</td>
                  <td>{u.isActive ? 'Active' : 'Deactivated'}</td>
                  <td>
                    <Button variant="ghost" onClick={() => handleToggleActive(u.id, u.isActive)}>
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button variant="ghost" onClick={() => handleUnlock(u.id)}>
                      Unlock
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

export default Users;
