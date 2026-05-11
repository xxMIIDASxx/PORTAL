import React from 'react';
import { Calendar, Bell, FileText, UserCheck, ShieldAlert, GraduationCap, LayoutDashboard, FileArchive, Settings, LogOut } from 'lucide-react';

function Sidebar({ user, currentRole, activeTab, setActiveTab }) {
  const getNavItems = () => {
    switch(currentRole) {
      case 'student':
        return [
          { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard size={20} /> },
          { id: 'calendar', label: 'My Schedule', icon: <Calendar size={20} /> },
          { id: 'notifications', label: 'Inbox', icon: <Bell size={20} /> },
          { id: 'attendance', label: 'Presence', icon: <UserCheck size={20} /> },
          { id: 'grades', label: 'Report Cards', icon: <GraduationCap size={20} /> },
          { id: 'absences', label: 'Absences', icon: <ShieldAlert size={20} /> },
          { id: 'documents', label: 'Documents', icon: <FileText size={20} /> },
        ];
      case 'teacher':
        return [
          { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard size={20} /> },
          { id: 'calendar', label: 'Timetable', icon: <Calendar size={20} /> },
          { id: 'notifications', label: 'Broadcast', icon: <Bell size={20} /> },
          { id: 'attendance', label: 'Mark Presence', icon: <UserCheck size={20} /> },
          { id: 'grades', label: 'Grading', icon: <FileArchive size={20} /> },
        ];
      case 'admin':
        return [
          { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard size={20} /> },
          { id: 'calendar', label: 'Calendar Control', icon: <Calendar size={20} /> },
          { id: 'notifications', label: 'Global News', icon: <Bell size={20} /> },
          { id: 'users', label: 'Directory', icon: <UserCheck size={20} /> },
          { id: 'courses', label: 'Academic Master', icon: <GraduationCap size={20} /> },
          { id: 'validations', label: 'Approval Queue', icon: <ShieldAlert size={20} /> },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();
  const userName = user ? `${user.first_name} ${user.last_name}` : currentRole;

  return (
    <div className="sidebar">
      <div style={{ padding: '0 1.5rem 1.5rem', marginBottom: '1rem' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, var(--surface-alt), var(--surface-hover))',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
            {user?.profile_picture ? (
              <img 
                src={user.profile_picture.startsWith('http') ? user.profile_picture : `http://127.0.0.1:8000${user.profile_picture}`} 
                alt="Profile" 
                style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '3px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
              />
            ) : (
              <div style={{ 
                width: '64px', height: '64px', borderRadius: '50%', 
                background: 'var(--primary)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', fontWeight: 800, border: '3px solid white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                {((user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')).toUpperCase()}
              </div>
            )}
            <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '12px', height: '12px', background: '#22c55e', borderRadius: '50%', border: '2px solid white' }} />
          </div>
          <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.15rem' }}>{userName}</p>
          <span className="badge badge-info" style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem' }}>{currentRole}</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0.5rem' }}>
        <p style={{ padding: '0 1.25rem 0.5rem', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Menu</p>
        {navItems.map(item => (
          <div
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            {item.icon}
            <span style={{ fontSize: '0.9rem' }}>{item.label}</span>
          </div>
        ))}
      </div>

      <div style={{
        padding: '1.5rem',
        borderTop: '1px solid var(--border)',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        background: 'var(--surface-alt)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-main)', fontWeight: 700 }}>
          <div style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%' }}></div>
          PORTAL Absence Management Platform
        </div>
        <p style={{ lineHeight: 1.5, opacity: 0.8 }}>
          Made by : Owais BAKKALI, Amjad AHRRAR, Amine HABZ, Bachar DOUKHANA, Bilal MESBAHI.
        </p>
        <div style={{ marginTop: '1rem', fontSize: '0.65rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', opacity: 0.5 }}>
          © 2026 PORTAL Team. v2.4.0
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
