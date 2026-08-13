import { lazy, Suspense } from 'react';
import { Redirect, Route, Switch, useLocation } from 'wouter';
import AppShell from '../shared/layout/AppShell';
import { AuthProvider, useAuth } from '../features/auth/AuthContext';
import { LoginPage, SignupPage, SocialCallbackPage } from '../features/auth';

const DashboardPage = lazy(() => import('../features/dashboard'));
const ExpenseEntryPage = lazy(() => import('../features/expense-entry'));
const ExpenseStatisticsPage = lazy(() => import('../features/expense-statistics'));
const PoliciesPage = lazy(() => import('../features/policies'));
const PolicyConditionsPage = lazy(() => import('../features/policies/pages/PolicyConditionsPage'));
const HiddenPoliciesPage = lazy(() => import('../features/policies/pages/HiddenPoliciesPage'));
const PolicyDetailPage = lazy(() => import('../features/policies/pages/PolicyDetailPage'));
const SavingsMapPage = lazy(() => import('../features/savings-map'));
const CommunityPage = lazy(() => import('../features/community'));
const CommunityPostPage = lazy(() => import('../features/community/pages/CommunityPostPage'));
const CommunityPostFormPage = lazy(() => import('../features/community/pages/CommunityPostFormPage'));
const ProfilePage = lazy(() => import('../features/profile'));
const ProfileEditPage = lazy(() => import('../features/profile/pages/ProfileEditPage'));
const AdminPage = lazy(() => import('../features/admin'));

function AdminOnlyRoute() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  if (isLoading) return <div className="page-loading">관리자 권한을 확인하고 있어요.</div>;
  if (!user) return <Redirect to={`/login?returnTo=${encodeURIComponent(location)}`} />;
  if (user.role !== 'ADMIN') return <Redirect to="/" />;
  return <Suspense fallback={<div className="page-loading">관리자 센터를 준비하고 있어요.</div>}><AdminPage /></Suspense>;
}

function ProtectedApp() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) return <div className="page-loading">로그인 상태를 확인하고 있어요.</div>;
  if (!user) return <Redirect to={`/login?returnTo=${encodeURIComponent(location)}`} />;

  return (
    <AppShell>
      <Suspense fallback={<div className="page-loading">화면을 준비하고 있어요.</div>}>
        <Switch>
          <Route path="/" component={DashboardPage} />
          <Route path="/expenses/new" component={ExpenseEntryPage} />
          <Route path="/expenses/statistics" component={ExpenseStatisticsPage} />
          <Route path="/policies/conditions" component={PolicyConditionsPage} />
          <Route path="/policies/hidden" component={HiddenPoliciesPage} />
          <Route path="/policies/:policyId" component={PolicyDetailPage} />
          <Route path="/policies" component={PoliciesPage} />
          <Route path="/map" component={SavingsMapPage} />
          <Route path="/community" component={CommunityPage} />
          <Route path="/community/new" component={CommunityPostFormPage} />
          <Route path="/community/:postId/edit" component={CommunityPostFormPage} />
          <Route path="/community/:postId" component={CommunityPostPage} />
          <Route path="/profile/edit" component={ProfileEditPage} />
          <Route path="/profile" component={ProfilePage} />
          <Route component={DashboardPage} />
        </Switch>
      </Suspense>
    </AppShell>
  );
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/auth/callback/kakao">
        <SocialCallbackPage provider="kakao" />
      </Route>
      <Route path="/auth/callback/naver">
        <SocialCallbackPage provider="naver" />
      </Route>
      <Route path="/admin" component={AdminOnlyRoute} />
      <Route>
        <ProtectedApp />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
