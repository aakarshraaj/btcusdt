import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import App from './OriginalApp';  // Use the working OriginalApp
import { CalculatorsIndex } from './pages/CalculatorsIndex';
import { ProfitCalculator } from './pages/ProfitCalculator';
import { DCACalculator } from './pages/DCACalculator';
import { StakingCalculator } from './pages/StakingCalculator';
import { MiningCalculator } from './pages/MiningCalculator';
import { CryptoProvider } from './context/CryptoContext';

function AppRouter() {
  return (
    <CryptoProvider>
      <Router>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/calculators" element={<CalculatorsPage />} />
          <Route path="/calculators/profit" element={<ProfitCalculatorPage />} />
          <Route path="/calculators/dca" element={<DCACalculatorPage />} />
          <Route path="/calculators/staking" element={<StakingCalculatorPage />} />
          <Route path="/calculators/mining" element={<MiningCalculatorPage />} />
        </Routes>
      </Router>
    </CryptoProvider>
  );
}

function CalculatorsPage() {
  const navigate = useNavigate();
  
  return (
    <CalculatorsIndex
      onCalculatorClick={(slug) => navigate(`/calculators/${slug}`)}
      onHomeClick={() => navigate('/')}
    />
  );
}

function ProfitCalculatorPage() {
  const navigate = useNavigate();
  
  return (
    <ProfitCalculator
      onHomeClick={() => navigate('/')}
      onCalculatorClick={(slug) => navigate(`/calculators/${slug}`)}
    />
  );
}

function DCACalculatorPage() {
  const navigate = useNavigate();
  
  return (
    <DCACalculator
      onHomeClick={() => navigate('/')}
      onCalculatorClick={(slug) => navigate(`/calculators/${slug}`)}
    />
  );
}

function StakingCalculatorPage() {
  const navigate = useNavigate();
  
  return (
    <StakingCalculator
      onHomeClick={() => navigate('/')}
      onCalculatorClick={(slug) => navigate(`/calculators/${slug}`)}
    />
  );
}

function MiningCalculatorPage() {
  const navigate = useNavigate();
  
  return (
    <MiningCalculator
      onHomeClick={() => navigate('/')}
      onCalculatorClick={(slug) => navigate(`/calculators/${slug}`)}
    />
  );
}

export default AppRouter;