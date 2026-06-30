import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import LoginScreen from './components/LoginScreen';
import Catalog from './components/Catalog';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './utils/firebase';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ color: 'var(--text-muted)' }}>Loading...</h2>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div style={{ paddingBottom: '80px' }}>
      <nav style={{ 
        display: 'flex', 
        gap: '1rem', 
        padding: '1rem', 
        background: 'var(--surface-color)', 
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <button 
          onClick={() => setActiveTab('dashboard')}
          style={{ 
            background: activeTab === 'dashboard' ? 'var(--primary-color)' : 'transparent',
            color: activeTab === 'dashboard' ? 'white' : 'var(--text-muted)',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Dashboard
        </button>
        <button 
          onClick={() => setActiveTab('catalog')}
          style={{ 
            background: activeTab === 'catalog' ? 'var(--primary-color)' : 'transparent',
            color: activeTab === 'catalog' ? 'white' : 'var(--text-muted)',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Catalog
        </button>
      </nav>

      {activeTab === 'dashboard' ? <Dashboard /> : <Catalog />}
    </div>
  );
}

export default App;
