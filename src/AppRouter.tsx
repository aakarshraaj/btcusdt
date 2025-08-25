import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { CryptoProvider } from './context/CryptoContext';
import { PriceSkeleton } from './components/ui/PriceSkeleton';
import { SEO, seoConfigs } from './components/SEO';

// Lazy load components for better performance
const App = lazy(() => import('./OriginalApp'));
const CalculatorsIndex = lazy(() => import('./pages/CalculatorsIndex').then(module => ({ default: module.CalculatorsIndex })));
const ProfitCalculator = lazy(() => import('./pages/ProfitCalculator').then(module => ({ default: module.ProfitCalculator })));
const DCACalculator = lazy(() => import('./pages/DCACalculator').then(module => ({ default: module.DCACalculator })));
const StakingCalculator = lazy(() => import('./pages/StakingCalculator').then(module => ({ default: module.StakingCalculator })));
const MiningCalculator = lazy(() => import('./pages/MiningCalculator').then(module => ({ default: module.MiningCalculator })));

// Loading component for better UX
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center" role="status" aria-label="Loading page">
    <div className="space-y-4 w-full max-w-md">
      <PriceSkeleton />
      <div className="text-center text-muted-foreground">Loading...</div>
    </div>
  </div>
);

function AppRouter() {
  return (
    <CryptoProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/calculators" element={<CalculatorsPage />} />
            <Route path="/calculators/profit" element={<ProfitCalculatorPage />} />
            <Route path="/calculators/dca" element={<DCACalculatorPage />} />
            <Route path="/calculators/staking" element={<StakingCalculatorPage />} />
            <Route path="/calculators/mining" element={<MiningCalculatorPage />} />
          </Routes>
        </Suspense>
      </Router>
    </CryptoProvider>
  );
}

function HomePage() {
  return (
    <main id="main-content" role="main">
      <SEO {...seoConfigs.home} />
      <App />
    </main>
  );
}

function CalculatorsPage() {
  const navigate = useNavigate();
  
  return (
    <main id="main-content" role="main">
      <SEO {...seoConfigs.calculators} />
      <CalculatorsIndex
        onCalculatorClick={(slug) => navigate(`/calculators/${slug}`)}
        onHomeClick={() => navigate('/')}
      />
    </main>
  );
}

function ProfitCalculatorPage() {
  const navigate = useNavigate();
  
  return (
    <main id="main-content" role="main">
      <SEO {...seoConfigs.profit} />
      <ProfitCalculator
        onHomeClick={() => navigate('/')}
        onCalculatorClick={() => navigate('/calculators')}
        onNavigateToCalculator={(slug) => navigate(`/calculators/${slug}`)}
      />
    </main>
  );
}

function DCACalculatorPage() {
  const navigate = useNavigate();
  
  return (
    <main id="main-content" role="main">
      <SEO {...seoConfigs.dca} />
      <DCACalculator
        onHomeClick={() => navigate('/')}
        onCalculatorClick={() => navigate('/calculators')}
        onNavigateToCalculator={(slug) => navigate(`/calculators/${slug}`)}
      />
    </main>
  );
}

function StakingCalculatorPage() {
  const navigate = useNavigate();
  
  return (
    <main id="main-content" role="main">
      <SEO {...seoConfigs.staking} />
      <StakingCalculator
        onHomeClick={() => navigate('/')}
        onCalculatorClick={() => navigate('/calculators')}
        onNavigateToCalculator={(slug) => navigate(`/calculators/${slug}`)}
      />
    </main>
  );
}

function MiningCalculatorPage() {
  const navigate = useNavigate();
  
  return (
    <main id="main-content" role="main">
      <SEO {...seoConfigs.mining} />
      <MiningCalculator
        onHomeClick={() => navigate('/')}
        onCalculatorClick={() => navigate('/calculators')}
        onNavigateToCalculator={(slug) => navigate(`/calculators/${slug}`)}
      />
    </main>
  );
}

export default AppRouter;