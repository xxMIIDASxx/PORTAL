import React from 'react';
import { Calendar, Bell, FileText, UserCheck, ShieldAlert, GraduationCap, LayoutDashboard, FileArchive, UserPlus } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

function Sidebar({ user, currentRole, activeTab, setActiveTab }) {
  const { t } = useLanguage();
  
  const getNavItems = () => {
    switch(currentRole) {
      case 'student':
        return [
          { id: 'dashboard', label: t('overview'), icon: <LayoutDashboard size={19} /> },
          { id: 'calendar', label: t('timetable'), icon: <Calendar size={19} /> },
          { id: 'notifications', label: t('inbox'), icon: <Bell size={19} /> },
          { id: 'attendance', label: t('presence'), icon: <UserCheck size={19} /> },
          { id: 'grades', label: t('report_cards'), icon: <GraduationCap size={19} /> },
          { id: 'absences', label: t('absences'), icon: <ShieldAlert size={19} /> },
          { id: 'documents', label: t('documents'), icon: <FileText size={19} /> },
        ];
      case 'teacher':
        return [
          { id: 'dashboard', label: t('overview'), icon: <LayoutDashboard size={19} /> },
          { id: 'calendar', label: t('timetable'), icon: <Calendar size={19} /> },
          { id: 'notifications', label: t('broadcast'), icon: <Bell size={19} /> },
          { id: 'attendance', label: t('mark_presence'), icon: <UserCheck size={19} /> },
          { id: 'grades', label: t('grading'), icon: <FileArchive size={19} /> },
          { id: 'tutorat', label: t('tutorat') || 'Tutorat', icon: <GraduationCap size={19} /> },
        ];
      case 'admin':
        return [
          { id: 'dashboard', label: t('overview'), icon: <LayoutDashboard size={19} /> },
          { id: 'calendar', label: t('calendar_control'), icon: <Calendar size={19} /> },
          { id: 'notifications', label: t('broadcast'), icon: <Bell size={19} /> },
          { id: 'users', label: t('directory'), icon: <UserCheck size={19} /> },
          { id: 'create_user', label: t('create_user'), icon: <UserPlus size={19} /> },
          { id: 'courses', label: t('academic_master'), icon: <GraduationCap size={19} /> },
          { id: 'validations', label: t('approval_queue'), icon: <ShieldAlert size={19} /> },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();
  const userName = user ? `${user.first_name} ${user.last_name}` : currentRole;

  return (
    <div className="sidebar">
      {/* User profile card */}
      <div style={{ padding: '0 1.25rem 1.25rem', marginBottom: '0.5rem' }}>
        <div style={{ 
          background: 'var(--gradient-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.15rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ position: 'relative', marginBottom: '0.65rem' }}>
            {user?.profile_picture ? (
              <img 
                src={user.profile_picture.startsWith('http') ? user.profile_picture : `http://127.0.0.1:8000${user.profile_picture}`} 
                alt="Profile" 
                style={{ 
                  width: '56px', 
                  height: '56px', 
                  borderRadius: '50%', 
                  objectFit: 'cover', 
                  border: '3px solid var(--border)', 
                  boxShadow: 'var(--shadow-sm)' 
                }} 
              />
            ) : (
              <div style={{ 
                width: '56px', 
                height: '56px', 
                borderRadius: '50%', 
                background: 'var(--gradient-primary)', 
                color: 'white',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '1.2rem', 
                fontWeight: 800, 
                border: '3px solid var(--border)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                {((user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')).toUpperCase()}
              </div>
            )}
            {/* Online indicator */}
            <div style={{ 
              position: 'absolute', 
              bottom: '1px', 
              right: '1px', 
              width: '11px', 
              height: '11px', 
              background: 'var(--success)', 
              borderRadius: '50%', 
              border: '2px solid var(--surface)' 
            }} />
          </div>
          <p style={{ 
            fontWeight: 700, 
            fontSize: '0.88rem', 
            color: 'var(--text-main)', 
            marginBottom: '0.2rem',
            lineHeight: 1.2
          }}>
            {userName}
          </p>
          <span 
            className="badge badge-info" 
            style={{ 
              fontSize: '0.6rem', 
              padding: '0.2rem 0.5rem', 
              textTransform: 'uppercase' 
            }}
          >
            {t(currentRole)}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0.35rem' }}>
        <p style={{ 
          padding: '0 1.15rem 0.5rem', 
          fontSize: '0.65rem', 
          fontWeight: 700, 
          color: 'var(--text-muted)', 
          textTransform: 'uppercase', 
          letterSpacing: '0.06em' 
        }}>
          {t('menu')}
        </p>
        {navItems.map(item => (
          <div
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            {item.icon}
            <span style={{ fontSize: '0.88rem' }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: '1.15rem 1.25rem',
        borderTop: '1px solid var(--border)',
        fontSize: '0.72rem',
        color: 'var(--text-muted)',
        background: 'var(--surface-alt)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          marginBottom: '0.65rem', 
          color: 'var(--text-main)', 
          fontWeight: 700,
          fontSize: '0.72rem'
        }}>
          <div style={{ 
            width: '7px', 
            height: '7px', 
            background: 'var(--primary)', 
            borderRadius: '50%' 
          }} />
          PORTAL Absence Management Platform
        </div>
        <p style={{ lineHeight: 1.5, opacity: 0.7, fontSize: '0.68rem' }}>
          Made by : Owais BAKKALI, Amjad AHRRAR, Amine HABZ, Bachar DOUKHANA, Bilal MESBAHI.
        </p>
        <div style={{ 
          marginTop: '0.65rem', 
          fontSize: '0.6rem', 
          borderTop: '1px solid var(--border)', 
          paddingTop: '0.6rem', 
          opacity: 0.45 
        }}>
          &copy; 2026 PORTAL Team. v2.4.0
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
