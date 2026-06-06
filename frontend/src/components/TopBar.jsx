import React, { useState, useRef } from 'react';
import { Moon, Sun, LogOut, X, Settings } from 'lucide-react';
import logo from '../assets/logo.png';
import api from '../api';
import { useLanguage } from '../context/LanguageContext';

function TopBar({ user, onLogout, theme, setTheme }) {
  const { lang, setLang, t } = useLanguage();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const toggleLang = () => {
    setLang(lang === 'fr' ? 'en' : 'fr');
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    setLoading(true);

    try {
      await api.post('/accounts/users/change-password/', {
        old_password: oldPassword,
        new_password: newPassword
      });
      setPasswordSuccess(t('password_updated'));
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profile_picture', file);
    formData.append('email', user.email);
    setLoading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      const res = await api.post('/accounts/users/upload_profile_picture/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data) {
        localStorage.setItem('user', JSON.stringify(res.data));
      }
      
      setUploadSuccess(t('profile_picture_success'));
      window.location.reload();
    } catch (err) {
      setUploadError('Error uploading picture');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    setLoading(true);
    setUploadError('');
    setUploadSuccess('');
    
    try {
      const res = await api.post('/accounts/users/remove_profile_picture/', {
        email: user.email
      });
      if (res.data) {
        localStorage.setItem('user', JSON.stringify(res.data));
      }
      setUploadSuccess(t('picture_removed_success'));
      window.location.reload();
    } catch (err) {
      setUploadError('Error removing picture');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="demo-topbar">
      {/* Brand / Logo */}
      <div 
        className="logo-container" 
        onClick={() => window.location.href = '/'}
      >
        <img 
          src={logo} 
          alt="EMSI" 
          style={{ 
            height: '46px', 
            objectFit: 'contain',
            transition: 'transform 0.3s ease'
          }} 
        />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ 
            fontWeight: 800, 
            fontSize: '1.25rem', 
            letterSpacing: '-0.3px', 
            color: 'var(--text-main)', 
            lineHeight: 1.1 
          }}>
            {t('login_title')}
          </span>
          <span style={{ 
            fontSize: '0.72rem', 
            color: 'var(--text-muted)', 
            fontWeight: 500, 
            marginTop: '1px',
            letterSpacing: '0.01em'
          }}>
            {t('login_subtitle')}
          </span>
        </div>
      </div>
      
      <div style={{ flex: 1 }} />

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        {/* Language toggle */}
        <button 
          onClick={toggleLang}
          style={{ 
            background: 'var(--surface-alt)', 
            border: '1px solid var(--border)', 
            padding: '0.45rem 0.7rem', 
            borderRadius: 'var(--radius-md)', 
            cursor: 'pointer',
            color: 'var(--text-main)', 
            fontWeight: 700, 
            fontSize: '0.78rem',
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit'
          }}
          title={t('language')}
        >
          {lang.toUpperCase()}
        </button>

        {/* Theme toggle */}
        <button 
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
          style={{ 
            background: 'var(--surface-alt)', 
            border: '1px solid var(--border)', 
            padding: '0.45rem', 
            borderRadius: 'var(--radius-md)', 
            cursor: 'pointer',
            color: 'var(--text-muted)', 
            transition: 'all 0.2s ease',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center'
          }}
          title={t('theme')}
        >
          {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
        </button>

        {/* User pill */}
        {user && (
          <div style={{ 
            display: 'flex', 
            gap: '0.65rem', 
            alignItems: 'center', 
            padding: '0.4rem 0.75rem 0.4rem 0.4rem',
            background: 'var(--surface-alt)',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border)',
            marginLeft: '0.25rem'
          }}>
            {user.profile_picture ? (
              <img 
                src={user.profile_picture.startsWith('http') ? user.profile_picture : `http://127.0.0.1:8000${user.profile_picture}`} 
                alt="Profile" 
                style={{ 
                  width: '34px', 
                  height: '34px', 
                  borderRadius: '50%', 
                  objectFit: 'cover', 
                  border: '2px solid var(--border)' 
                }} 
              />
            ) : (
              <div style={{ 
                width: '34px', 
                height: '34px', 
                borderRadius: '50%', 
                background: 'var(--gradient-primary)', 
                color: 'white',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '0.75rem', 
                fontWeight: 800, 
                border: '2px solid var(--border)'
              }}>
                {((user.first_name?.[0] || '') + (user.last_name?.[0] || '')).toUpperCase()}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ 
                fontSize: '0.82rem', 
                fontWeight: 700, 
                color: 'var(--text-main)', 
                lineHeight: 1.2 
              }}>
                {user.first_name} {user.last_name}
              </span>
              <span style={{ 
                fontSize: '0.62rem', 
                color: 'var(--primary)', 
                fontWeight: 700, 
                textTransform: 'uppercase',
                letterSpacing: '0.03em'
              }}>
                {t(user.role)}
              </span>
            </div>
            
            <div style={{ 
              width: '1px', 
              height: '20px', 
              background: 'var(--border)', 
              margin: '0 0.15rem' 
            }} />
            
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button 
                onClick={() => setShowSettingsModal(true)} 
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  padding: '0.4rem', 
                  borderRadius: 'var(--radius-sm)', 
                  cursor: 'pointer',
                  color: 'var(--text-muted)', 
                  transition: 'all 0.2s ease',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center'
                }}
                title={t('settings')}
              >
                <Settings size={16} />
              </button>
              <button 
                onClick={onLogout} 
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  padding: '0.4rem', 
                  borderRadius: 'var(--radius-sm)', 
                  cursor: 'pointer',
                  color: 'var(--danger)', 
                  transition: 'all 0.2s ease',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center'
                }}
                title={t('logout')}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.6)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)', padding: '2rem'
        }}>
          <div className="glass-panel" style={{ 
            width: '100%', maxWidth: '500px', padding: 0, position: 'relative', overflow: 'hidden',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ 
              background: 'var(--gradient-primary)', 
              padding: '1.25rem 1.75rem', 
              color: 'white',
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{t('account_settings')}</h2>
              <button 
                onClick={() => setShowSettingsModal(false)}
                style={{ 
                  background: 'rgba(255,255,255,0.15)', 
                  border: 'none', 
                  color: 'white', 
                  cursor: 'pointer', 
                  padding: '0.4rem', 
                  borderRadius: '50%', 
                  display: 'flex',
                  transition: 'background 0.2s ease'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.75rem' }}>
              {/* Profile Picture Upload */}
              <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
                  {t('profile_picture')}
                </h3>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  accept="image/*"
                  onChange={handleProfileUpload} 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="btn btn-secondary" 
                  style={{ width: '100%', justifyContent: 'center' }}
                  disabled={loading}
                >
                  {loading ? '...' : t('upload_new')}
                </button>
                {user.profile_picture && (
                  <button 
                    onClick={handleRemoveProfilePicture} 
                    className="btn btn-danger" 
                    style={{ width: '100%', justifyContent: 'center', marginTop: '0.75rem', padding: '0.65rem' }}
                    disabled={loading}
                  >
                    {loading ? '...' : t('remove_picture')}
                  </button>
                )}
                {uploadError && <p style={{ color: 'var(--danger)', marginTop: '0.5rem', fontSize: '0.82rem' }}>{uploadError}</p>}
                {uploadSuccess && <p style={{ color: 'var(--success)', marginTop: '0.5rem', fontSize: '0.82rem' }}>{uploadSuccess}</p>}
              </div>

              {/* Password Update */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.75rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-main)' }}>
                  {t('update_password')}
                </h3>
                {passwordError && <div style={{ color: 'var(--danger)', marginBottom: '0.75rem', fontSize: '0.82rem' }}>{passwordError}</div>}
                {passwordSuccess && <div style={{ color: 'var(--success)', marginBottom: '0.75rem', fontSize: '0.82rem' }}>{passwordSuccess}</div>}
                
                <form onSubmit={handlePasswordUpdate}>
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {t('old_password')}
                    </label>
                    <input 
                      type="password" 
                      className="input-field" 
                      placeholder="••••••••"
                      value={oldPassword} 
                      onChange={(e) => setOldPassword(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="input-label" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {t('new_password')}
                    </label>
                    <input 
                      type="password" 
                      className="input-field" 
                      placeholder="••••••••"
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      required 
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ width: '100%', padding: '0.85rem', fontSize: '0.9rem', fontWeight: 700, justifyContent: 'center' }}
                    disabled={loading}
                  >
                    {loading ? '...' : t('update_password')}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TopBar;
