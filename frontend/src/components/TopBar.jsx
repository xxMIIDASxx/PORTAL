import React, { useState, useRef } from 'react';
import { Moon, Sun, LogOut, Key, X, Upload, User, Settings } from 'lucide-react';
import logo from '../assets/logo.png';
import api from '../api';

function TopBar({ user, onLogout, theme, setTheme }) {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    setLoading(true);

    try {
      await api.post('/accounts/users/change_password/', {
        email: user.email,
        old_password: oldPassword,
        new_password: newPassword
      });
      setPasswordSuccess('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setPasswordError(err.response.data.error);
      } else {
        setPasswordError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadError('');
    setUploadSuccess('');
    setLoading(true);

    const formData = new FormData();
    formData.append('email', user.email);
    formData.append('profile_picture', file);

    try {
      const res = await api.post('/accounts/users/upload_profile_picture/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadSuccess('Profile picture updated successfully!');
      // Update local storage and force reload or pass a callback to update user
      localStorage.setItem('user', JSON.stringify(res.data));
      window.location.reload(); // Simple way to reflect changes globally
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setUploadError(err.response.data.error);
      } else {
        setUploadError('Failed to upload picture.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getProfilePicUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `http://127.0.0.1:8000${url}`;
  };

  return (
    <div className="demo-topbar">
      <div className="demo-brand" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ 
          height: '85px',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center'
        }}>
          <img src={logo} alt="EMSI" style={{ height: '85px', objectFit: 'contain' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontWeight: 900, fontSize: '1.85rem', letterSpacing: '-0.5px', color: 'var(--text-main)', lineHeight: 1 }}>
            PORTAL
          </span>
          <span style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'none', marginTop: '4px' }}>
            Absence Management Platform
          </span>
        </div>
      </div>
      
      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {user && (
          <div style={{ 
            display: 'flex', gap: '1rem', alignItems: 'center', 
            padding: '0.6rem 1rem 0.6rem 0.6rem',
            background: 'var(--surface-alt)',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border)'
          }}>
            {user.profile_picture ? (
              <img 
                src={user.profile_picture.startsWith('http') ? user.profile_picture : `http://127.0.0.1:8000${user.profile_picture}`} 
                alt="Profile" 
                style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid white' }} 
              />
            ) : (
              <div style={{ 
                width: '42px', height: '42px', borderRadius: '50%', 
                background: 'var(--primary)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.9rem', fontWeight: 800, border: '2px solid white'
              }}>
                {((user.first_name?.[0] || '') + (user.last_name?.[0] || '')).toUpperCase()}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{user.first_name} {user.last_name}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>{user.role}</span>
            </div>
            
            <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 0.25rem' }} />
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                onClick={() => setShowSettingsModal(true)} 
                style={{ 
                  background: 'var(--background)', border: '1px solid var(--border)', 
                  padding: '0.6rem', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  color: 'var(--text-muted)', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                className="role-btn"
                title="Settings"
              >
                <Settings size={18} />
              </button>
              <button 
                onClick={onLogout} 
                style={{ 
                  background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', 
                  padding: '0.6rem', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  color: 'var(--danger)', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                className="role-btn"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        )}
        
        <button 
          onClick={toggleTheme} 
          className="role-btn" 
          style={{ 
            width: '48px', height: '48px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            borderRadius: '50%', background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>

      {showSettingsModal && (
        <div style={{
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh',
          background: 'rgba(0,0,0,0.7)', 
          zIndex: 9999,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backdropFilter: 'blur(10px)',
          padding: '2rem'
        }}>
          <div className="glass-panel" style={{ 
            width: '100%', 
            maxWidth: '450px', 
            padding: 0, 
            position: 'relative', 
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
            {/* Modal Header */}
            <div style={{ 
              background: 'linear-gradient(135deg, var(--primary) 0%, #3D62E4 100%)', 
              padding: '1.5rem 2rem', 
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Change Password</h2>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', opacity: 0.8 }}>Update your account security</p>
              </div>
              <button 
                onClick={() => setShowSettingsModal(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', display: 'flex' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                  <Upload size={16} /> Profile Picture
                </h3>
                {uploadError && <div style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.875rem' }}>{uploadError}</div>}
                {uploadSuccess && <div style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '0.875rem' }}>{uploadSuccess}</div>}
                <input 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  ref={fileInputRef} 
                  onChange={handleProfilePicUpload} 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="btn btn-secondary" 
                  style={{ width: '100%', justifyContent: 'center' }}
                  disabled={loading}
                >
                  {loading ? 'Uploading...' : 'Upload New Picture'}
                </button>
              </div>

              <div>
                {passwordError && <div style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.875rem' }}>{passwordError}</div>}
                {passwordSuccess && <div style={{ color: 'var(--success)', marginBottom: '1rem', fontSize: '0.875rem' }}>{passwordSuccess}</div>}
                
                <form onSubmit={handleChangePassword}>
                  <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="input-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Password</label>
                    <input 
                      type="password" 
                      className="input-field" 
                      placeholder="••••••••"
                      value={oldPassword} 
                      onChange={(e) => setOldPassword(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="input-group" style={{ marginBottom: '2rem' }}>
                    <label className="input-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Password</label>
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
                    style={{ width: '100%', padding: '1rem', fontSize: '1rem', fontWeight: 700, justifyContent: 'center' }}
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Password'}
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
