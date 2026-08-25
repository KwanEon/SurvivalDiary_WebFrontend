import { lazy, Suspense, useEffect, useState } from 'react';
import { Route, Switch } from 'wouter';
import { getAdminSessionUser } from '../features/admin/api';
import AdminLoginPage from '../features/admin/pages/AdminLoginPage';

const AdminPage = lazy(() => import('../features/admin'));
const LandingPage = lazy(() => import('../features/landing-test'));

function AdminOnlyRoute() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    void getAdminSessionUser()
      .then((user) => setAuthorized(user.role === 'ADMIN'))
      .catch(() => setAuthorized(false));
  }, []);

  if (authorized === null) return <div className="page-loading">관리자 권한을 확인하고 있어요.</div>;
  if (!authorized) return <AdminLoginPage onAuthenticated={() => setAuthorized(true)} />;
  return <AdminPage />;
}

function App() {
  return (
    <Suspense fallback={<div className="page-loading">페이지를 준비하고 있어요.</div>}>
      <Switch>
        <Route path="/admin" component={AdminOnlyRoute} />
        <Route component={LandingPage} />
      </Switch>
    </Suspense>
  );
}

export default App;
