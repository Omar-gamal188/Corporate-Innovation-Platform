import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { ROLES } from './utils/constants';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import IdeaForm from './pages/IdeaForm';
import IdeasList from './pages/IdeasList';
import IdeaDetails from './pages/IdeaDetails';
import Evaluation from './pages/Evaluation';
import Users from './pages/Users';
import AuditLog from './pages/AuditLog';
import Settings from './pages/Settings';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/ideas" element={<IdeasList />} />
              <Route
                path="/ideas/new"
                element={
                  <ProtectedRoute roles={[ROLES.EMPLOYEE]}>
                    <IdeaForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ideas/:id/edit"
                element={
                  <ProtectedRoute roles={[ROLES.EMPLOYEE]}>
                    <IdeaForm />
                  </ProtectedRoute>
                }
              />
              <Route path="/ideas/:id" element={<IdeaDetails />} />
              <Route
                path="/ideas/:id/evaluate"
                element={
                  <ProtectedRoute roles={[ROLES.EVALUATOR]}>
                    <Evaluation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute roles={[ROLES.ADMIN]}>
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/audit-log"
                element={
                  <ProtectedRoute roles={[ROLES.ADMIN]}>
                    <AuditLog />
                  </ProtectedRoute>
                }
              />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
