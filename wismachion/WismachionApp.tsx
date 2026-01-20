import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { WismachionHeader } from './components/WismachionHeader';
import { WismachionHero } from './components/WismachionHero';
import { ProductFeatures } from './components/ProductFeatures';
import { PricingPlans } from './components/PricingPlans';
import { CustomerPortal } from './components/CustomerPortal';
import { WismachionFooter } from './components/WismachionFooter';
import { PurchaseDialog } from './components/PurchaseDialog';
import { LoginDialog } from './components/LoginDialog';
import { FreeTrialDialog } from './components/FreeTrialDialog'; // 🆕
import { PayPalTestPage } from './components/PayPalTestPage';
import { HealthCheckTest } from './components/HealthCheckTest';
import { SimpleHealthTest } from './components/SimpleHealthTest';
import { PayPalDiagnostic } from './components/PayPalDiagnostic';

export default function WismachionApp() {
  const [currentView, setCurrentView] = useState<'home' | 'portal' | 'test' | 'health' | 'simple' | 'diagnostic'>('home');
  const [showPurchase, setShowPurchase] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showFreeTrial, setShowFreeTrial] = useState(false); // 🆕
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'enterprise' | null>(null);
  const [user, setUser] = useState<any>(null);
  
  // Check for test mode in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('test') === 'paypal') {
      setCurrentView('test');
    } else if (params.get('test') === 'health') {
      setCurrentView('health');
    } else if (params.get('test') === 'simple') {
      setCurrentView('simple');
    } else if (params.get('test') === 'diagnostic') {
      setCurrentView('diagnostic');
    }
  }, []);

  const handlePurchase = (plan: 'standard' | 'enterprise') => {
    setSelectedPlan(plan);
    setShowPurchase(true);
  };

  const handleLogin = () => {
    setShowLogin(true);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Toaster position="top-center" richColors />
      
      <WismachionHeader 
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onPortal={() => setCurrentView('portal')}
        onHome={() => setCurrentView('home')}
      />

      {currentView === 'home' ? (
        <>
          <WismachionHero 
            onGetStarted={() => handlePurchase('standard')} 
            onFreeTrial={() => setShowFreeTrial(true)} 
          />
          <ProductFeatures />
          <PricingPlans onSelectPlan={handlePurchase} />
          <WismachionFooter />
        </>
      ) : currentView === 'portal' ? (
        <CustomerPortal user={user} />
      ) : currentView === 'test' ? (
        <PayPalTestPage />
      ) : currentView === 'health' ? (
        <HealthCheckTest />
      ) : currentView === 'simple' ? (
        <SimpleHealthTest />
      ) : (
        <PayPalDiagnostic />
      )}

      <PurchaseDialog
        open={showPurchase}
        onClose={() => setShowPurchase(false)}
        plan={selectedPlan}
      />

      <LoginDialog
        open={showLogin}
        onClose={() => setShowLogin(false)}
        onSuccess={(userData) => {
          setUser(userData);
          setCurrentView('portal');
          setShowLogin(false);
        }}
      />

      <FreeTrialDialog
        open={showFreeTrial}
        onClose={() => setShowFreeTrial(false)}
      />
    </div>
  );
}