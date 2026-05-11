import React, { useState, useEffect } from 'react';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (user.role) {
      case 'student':
        return <StudentDashboard activeTab={activeTab} demoUser={user} />;
      case 'teacher':
        return <TeacherDashboard activeTab={activeTab} demoUser={user} />;
      case 'admin':
        return <AdminDashboard activeTab={activeTab} demoUser={user} />;
      default:
        return <div>Select a role</div>;
    }
  };

  return (
    <div className="app-container">
      <TopBar 
        user={user} 
        onLogout={handleLogout}
        theme={theme} 
        setTheme={setTheme}
      />
      <Sidebar 
        user={user} 
        currentRole={user.role} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
      />
      
      <main className="main-content">
        <div className="animate-fade-in" key={`${user.role}-${activeTab}`}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
