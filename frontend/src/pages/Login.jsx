import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Sun, Moon } from 'lucide-react';
import api from '../api';
import logo from '../assets/logo.png';

function Login({ onLogin }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/accounts/users/login/', { email, password });
      if (res.data) {
        onLogin(res.data);
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh', 
      width: '100%',
      background: 'var(--background)',
      position: 'relative', 
      overflow: 'hidden',
      padding: '2rem'
    }}>
      <div style={{ position: 'absolute', top: '2rem', right: '2rem', zIndex: 100 }}>
        <button 
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
          style={{ 
            width: '48px', height: '48px', borderRadius: '50%', 
            background: 'var(--surface)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
            color: 'var(--text-main)'
          }}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
      {/* Decorative elements */}
      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(91,141,255,0.08) 0%, transparent 70%)', borderRadius: '50%' }}></div>
      <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(91,141,255,0.08) 0%, transparent 70%)', borderRadius: '50%' }}></div>

      <div className="glass-panel" style={{ 
        width: '100%', 
        maxWidth: '420px', 
        padding: '3.5rem 2.5rem',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative',
        zIndex: 10,
        margin: '2rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            marginBottom: '1.5rem',
          }}>
            <img src={logo} alt="Portal Logo" style={{ height: '110px', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>PORTAL</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 500 }}>Absence Management Platform</p>
        </div>

        {error && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.08)', 
            color: 'var(--danger)', 
            padding: '1rem', 
            borderRadius: 'var(--radius-md)', 
            marginBottom: '1.5rem', 
            fontSize: '0.85rem', 
            border: '1px solid rgba(239, 68, 68, 0.2)',
            fontWeight: 500, 
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group" style={{ marginBottom: '1.5rem' }}>
            <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={14} /> Email Address
            </label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="e.g. name@emsi-edu.ma"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div className="input-group" style={{ marginBottom: '2rem' }}>
            <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={14} /> Password
            </label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ 
              width: '100%', 
              padding: '1rem', 
              fontSize: '1rem', 
              fontWeight: 700, 
              display: 'flex', 
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(91, 141, 255, 0.3)'
            }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                Sign In <ArrowRight size={18} />
              </div>
            )}
          </button>
        </form>
        
        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            EMSI PORTAL © 2026. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
