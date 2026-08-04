import { lazy, Suspense } from 'react';
import { Route, Switch } from 'wouter';
import AppShell from '../shared/layout/AppShell';
import LoginPage from '../features/auth/LoginPage';
import OAuthCallbackPage from '../features/auth/OAuthCallbackPage';
import { hasSession } from '../features/auth/api';

const DashboardPage = lazy(() => import('../features/dashboard'));
const ExpenseEntryPage = lazy(() => import('../features/expense-entry'));
const ExpenseStatisticsPage = lazy(() => import('../features/expense-statistics'));
const PoliciesPage = lazy(() => import('../features/policies'));
const SavingsMapPage = lazy(() => import('../features/savings-map'));
const CommunityPage = lazy(() => import('../features/community'));

function App() {
  if (window.location.pathname === '/auth/callback/kakao') {
    return <OAuthCallbackPage provider="kakao" />;
  }
  if (window.location.pathname === '/auth/callback/naver') {
    return <OAuthCallbackPage provider="naver" />;
  }
  if (!hasSession()) {
    return <LoginPage />;
  }
  return (
    <AppShell>
      <Suspense fallback={<div className="page-loading">화면을 준비하고 있어요.</div>}>
        <Switch>
          <Route path="/" component={DashboardPage} />
          <Route path="/expenses/new" component={ExpenseEntryPage} />
          <Route path="/expenses/statistics" component={ExpenseStatisticsPage} />
          <Route path="/policies" component={PoliciesPage} />
          <Route path="/map" component={SavingsMapPage} />
          <Route path="/community" component={CommunityPage} />
          <Route component={DashboardPage} />
        </Switch>
      </Suspense>
    </AppShell>
  );
}

export default App;
