import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Sun, Moon } from 'lucide-react';
import api from '../api';
import logo from '../assets/logo.png';
import { useLanguage } from '../context/LanguageContext';

function Login({ onLogin }) {
  const { lang, setLang, t } = useLanguage();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleLang = () => {
    setLang(lang === 'fr' ? 'en' : 'fr');
  };

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
      setError(t('login_error'));
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
      {/* Decorative gradients */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        right: '-10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, var(--primary-light) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        left: '-8%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, var(--accent-light) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      {/* Controls */}
      <div style={{ 
        position: 'absolute', 
        top: '1.5rem', 
        right: '1.5rem', 
        zIndex: 100, 
        display: 'flex', 
        gap: '0.6rem' 
      }}>
        <button 
          onClick={toggleLang}
          style={{ 
            padding: '0 0.9rem', 
            height: '40px', 
            borderRadius: 'var(--radius-md)', 
            background: 'var(--surface)', 
            border: '1px solid var(--border)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            cursor: 'pointer', 
            boxShadow: 'var(--shadow-sm)',
            color: 'var(--text-main)', 
            fontWeight: 700,
            fontSize: '0.82rem',
            fontFamily: 'inherit',
            transition: 'all 0.2s ease'
          }}
        >
          {lang.toUpperCase()}
        </button>
        <button 
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
          style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%', 
            background: 'var(--surface)', 
            border: '1px solid var(--border)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            cursor: 'pointer', 
            boxShadow: 'var(--shadow-sm)',
            color: 'var(--text-main)',
            transition: 'all 0.2s ease'
          }}
          title={t('theme')}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>

      {/* Login Card */}
      <div className="glass-panel animate-fade-in" style={{ 
        width: '100%', 
        maxWidth: '420px', 
        padding: '3rem 2.25rem',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            marginBottom: '1.25rem',
          }}>
            <img 
              src={logo} 
              alt="Portal Logo" 
              style={{ 
                height: '90px', 
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.08))'
              }} 
            />
          </div>
          <h1 style={{ 
            fontSize: '1.75rem', 
            fontWeight: 900, 
            marginBottom: '0.35rem', 
            color: 'var(--text-main)', 
            letterSpacing: '-0.5px' 
          }}>
            {t('login_title')}
          </h1>
          <p style={{ 
            color: 'var(--text-muted)', 
            fontSize: '0.88rem', 
            fontWeight: 500 
          }}>
            {t('login_subtitle')}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{ 
            background: 'var(--danger-light)', 
            color: 'var(--danger)', 
            padding: '0.85rem 1rem', 
            borderRadius: 'var(--radius-md)', 
            marginBottom: '1.25rem', 
            fontSize: '0.82rem', 
            border: '1px solid var(--danger-border)',
            fontWeight: 600, 
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="input-group" style={{ marginBottom: '1.25rem' }}>
            <label className="input-label" style={{ 
              fontWeight: 700, 
              fontSize: '0.72rem', 
              color: 'var(--text-muted)', 
              marginBottom: '0.35rem', 
              textTransform: 'uppercase', 
              letterSpacing: '0.06em', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem' 
            }}>
              <Mail size={13} /> {t('email_label')}
            </label>
            <input 
              type="email" 
              className="input-field" 
              placeholder={t('email_placeholder')}
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              id="login-email"
            />
          </div>

          <div className="input-group" style={{ marginBottom: '1.75rem' }}>
            <label className="input-label" style={{ 
              fontWeight: 700, 
              fontSize: '0.72rem', 
              color: 'var(--text-muted)', 
              marginBottom: '0.35rem', 
              textTransform: 'uppercase', 
              letterSpacing: '0.06em', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem' 
            }}>
              <Lock size={13} /> {t('password_label')}
            </label>
            <input 
              type="password" 
              className="input-field" 
              placeholder={t('password_placeholder')}
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              id="login-password"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ 
              width: '100%', 
              padding: '0.9rem', 
              fontSize: '0.95rem', 
              fontWeight: 700, 
              display: 'flex', 
              justifyContent: 'center'
            }}
            disabled={loading}
            id="login-submit"
          >
            {loading ? t('authenticating') : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                {t('signin_btn')} <ArrowRight size={17} />
              </div>
            )}
          </button>
        </form>
        
        {/* Footer */}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p style={{ 
            fontSize: '0.78rem', 
            color: 'var(--text-muted)',
            opacity: 0.7
          }}>
            EMSI PORTAL &copy; 2026. {t('rights_reserved')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
