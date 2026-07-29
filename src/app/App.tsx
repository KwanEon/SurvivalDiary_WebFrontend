import { lazy, Suspense } from 'react';
import { Route, Switch } from 'wouter';
import AppShell from '../shared/layout/AppShell';

const DashboardPage = lazy(() => import('../features/dashboard'));
const ExpenseEntryPage = lazy(() => import('../features/expense-entry'));
const ExpenseStatisticsPage = lazy(() => import('../features/expense-statistics'));
const PoliciesPage = lazy(() => import('../features/policies'));
const SavingsMapPage = lazy(() => import('../features/savings-map'));
const CommunityPage = lazy(() => import('../features/community'));

function App() {
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
