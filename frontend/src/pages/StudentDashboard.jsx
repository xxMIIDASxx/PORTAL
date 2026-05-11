import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import api from '../api';

function StudentDashboard({ activeTab, demoUser }) {
  const [calendar, setCalendar] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [reportCards, setReportCards] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [documentRequests, setDocumentRequests] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [justificationText, setJustificationText] = useState('');
  const [selectedAbsence, setSelectedAbsence] = useState(null);
  const [docType, setDocType] = useState('Scolarite');
  const [studentSchedule, setStudentSchedule] = useState([[], [], [], [], []]);

  useEffect(() => {
    api.get('/portal/calendar/').then(res => setCalendar(res.data));
    api.get('/portal/notifications/').then(res => setNotifications(res.data));
    api.get('/portal/report-cards/').then(res => setReportCards(res.data));
    api.get('/portal/absences/').then(res => setAbsences(res.data));
    api.get('/portal/document-requests/').then(res => setDocumentRequests(res.data));
    api.get('/portal/attendances/', { params: { student: demoUser?.id } }).then(res => setAttendances(res.data));
    
    if (demoUser?.student_profile?.filiere) {
      api.get(`/portal/schedules/?target_class=${demoUser.student_profile.filiere}`).then(res => {
        if (res.data.length > 0) {
          const data = res.data[0].schedule_data;
          setStudentSchedule(Array.isArray(data) && data.length === 5 ? data : [[], [], [], [], []]);
        }
      }).catch(() => {});
    }
  }, [demoUser]);

  useEffect(() => {
    if (reportCards.length > 0) {
      const years = [...new Set(reportCards.map(rc => rc.academic_year))].sort().reverse();
      if (!selectedYear) setSelectedYear(years[0]);
    }
  }, [reportCards]);

  useEffect(() => {
    if (selectedYear) {
      const sems = reportCards.filter(rc => rc.academic_year === selectedYear).map(rc => rc.semester);
      if (sems.length > 0 && !sems.includes(selectedSemester)) setSelectedSemester(sems[0]);
    }
  }, [selectedYear, reportCards]);

  const handleDeleteNotification = (id) => {
    api.delete(`/portal/notifications/${id}/`).then(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }).catch(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    });
  };

  const handleClearAllNotifications = () => setNotifications([]);

  const handleJustifyAbsence = (e) => {
    e.preventDefault();
    if (!selectedAbsence) return;
    api.patch(`/portal/absences/${selectedAbsence}/`, {
      justification_text: justificationText,
      justification_status: 'Pending'
    }).then(() => {
      setJustificationText('');
      setSelectedAbsence(null);
      api.get('/portal/absences/').then(res => setAbsences(res.data));
    });
  };

  const handleDocRequest = (e) => {
    e.preventDefault();
    if (!demoUser) return;
    api.post('/portal/document-requests/', {
      student: demoUser.id,
      document_type: docType,
      status: 'Pending'
    }).then(() => {
      api.get('/portal/document-requests/').then(res => setDocumentRequests(res.data));
    });
  };

  const renderAttendance = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass-panel">
        <h2 style={{ marginBottom: '1rem' }}>📍 My Attendance Records</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Review session presence information and see which classes were marked present or absent.</p>
        {attendances.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No attendance records are available yet.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Session</th><th>Course</th><th>Class</th><th>Date</th><th>Status</th></tr>
              </thead>
              <tbody>
                {attendances.map(att => (
                  <tr key={att.id}>
                    <td>{att.session_details?.id || 'N/A'}</td>
                    <td>{att.session_details?.course_name || 'N/A'}</td>
                    <td>{att.session_details?.target_class || 'All Classes'}</td>
                    <td>{att.session_details?.date || 'N/A'}</td>
                    <td style={{ color: att.present ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>{att.present ? 'Present' : 'Absent'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderOverview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
      <div className="glass-panel" style={{ padding: '2.5rem' }}>
        <div style={{ display: 'flex', gap: '3rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            width: '180px', height: '180px', borderRadius: '50%',
            background: 'var(--primary)', 
            overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '4px solid white', flexShrink: 0,
            boxShadow: 'var(--shadow-lg)'
          }}>
            {demoUser?.profile_picture ? (
              <img 
                src={demoUser.profile_picture.startsWith('http') ? demoUser.profile_picture : `http://127.0.0.1:8000${demoUser.profile_picture}`} 
                alt="Profile" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              <span style={{ fontSize: '4rem', fontWeight: 900, color: 'white', letterSpacing: '2px' }}>
                {((demoUser?.first_name?.[0] || '') + (demoUser?.last_name?.[0] || '')).toUpperCase()}
              </span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  {demoUser ? `${demoUser.first_name} ${demoUser.last_name}` : 'Student Profile'}
                </h2>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span className="badge badge-info">Student</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{demoUser?.email}</span>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              {[
                { label: 'Matricule', value: demoUser?.matricule, icon: '🆔' },
                { label: 'Major / Class', value: demoUser?.student_profile?.filiere, icon: '🎓' },
                { label: 'Academic Year', value: `Year ${demoUser?.student_profile?.annee_etude}`, icon: '📅' },
                { label: 'Tutor', value: demoUser?.student_profile?.tutor_name || 'N/A', icon: '👨‍🏫' },
              ].map(({ label, value, icon }) => (
                <div key={label} style={{ padding: '1rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: 700 }}>{icon} {label}</p>
                  <p style={{ fontWeight: 700, color: 'var(--text-main)' }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>⚠️</div>
          <div className="stat-info">
            <h3>Total Absences</h3>
            <p>{absences.filter(a => !a.is_present).length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(91, 141, 255, 0.1)', color: 'var(--primary)' }}>🔔</div>
          <div className="stat-info">
            <h3>Notifications</h3>
            <p>{notifications.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>📄</div>
          <div className="stat-info">
            <h3>Doc Requests</h3>
            <p>{documentRequests.length}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCalendar = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const dayColors = ['rgba(91,141,255,0.16)', 'rgba(16,185,129,0.16)', 'rgba(239,68,68,0.16)', 'rgba(92,145,255,0.16)', 'rgba(168,85,247,0.16)'];
    const dayBorders = ['#5B8DEF', '#10B981', '#EF4444', '#3D62E4', '#A855F7'];
    const hasSchedule = studentSchedule.some(day => day.length > 0);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="glass-panel">
          <h2 style={{ marginBottom: '1.5rem' }}>📅 My Weekly Schedule</h2>
          {hasSchedule ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
              {days.map((day, idx) => (
                <div key={day} style={{ border: `1px solid ${dayBorders[idx]}30`, borderTop: `3px solid ${dayBorders[idx]}`, borderRadius: 'var(--radius-md)', padding: '1rem', background: dayColors[idx], minHeight: '140px' }}>
                  <h4 style={{ textAlign: 'center', marginBottom: '1rem', color: dayBorders[idx], fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{day}</h4>
                  {studentSchedule[idx] && studentSchedule[idx].map((s, i) => (
                    <div key={i} style={{ padding: '0.5rem', background: 'var(--surface)', marginBottom: '0.5rem', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderLeft: `3px solid ${dayBorders[idx]}` }}>
                      <p style={{ fontSize: '0.7rem', fontWeight: 700, color: dayBorders[idx] }}>{s.time}</p>
                      <p style={{ fontSize: '0.78rem', marginTop: '0.15rem', color: 'var(--text-main)' }}>{s.name}</p>
                    </div>
                  ))}
                  {(!studentSchedule[idx] || studentSchedule[idx].length === 0) && <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>No slots</p>}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)' }}>
              <p style={{ color: 'var(--text-muted)' }}>No timetable has been published for your class yet.</p>
            </div>
          )}
        </div>

        {/* Events added by teacher */}
        <div className="glass-panel">
          <h2 style={{ marginBottom: '1.5rem' }}>📋 Upcoming Events & Announcements</h2>
          {calendar.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No events scheduled.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {calendar.map(ev => (
                <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: ev.event_type === 'Examen' ? 'rgba(239,68,68,0.1)' : 'rgba(91,141,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                    {ev.event_type === 'Examen' ? '📝' : ev.event_type === 'TD' ? '🔬' : '📚'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600 }}>{ev.title} <span style={{ fontSize: '0.75rem', fontWeight: 400, marginLeft: '0.5rem', background: 'var(--surface-hover)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{ev.target_classes}</span></p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      {ev.description} {ev.professor_name || ev.created_by_name ? <span>· Added by {ev.professor_name || ev.created_by_name}</span> : null}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600 }}>{new Date(ev.start_time).toLocaleDateString('fr-FR', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(ev.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <span style={{ padding: '0.25rem 0.625rem', borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: 700, background: ev.event_type === 'Examen' ? 'rgba(239,68,68,0.1)' : 'rgba(91,141,255,0.12)', color: ev.event_type === 'Examen' ? '#EF4444' : '#5B8DEF', flexShrink: 0 }}>
                    {ev.event_type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderNotifications = () => (
    <div className="glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>🔔 Notifications</h2>
        {notifications.length > 0 && (
          <button className="btn btn-secondary" onClick={handleClearAllNotifications}>Clear All</button>
        )}
      </div>
      {notifications.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No new notifications.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {notifications.map(n => (
            <div key={n.id} style={{ padding: '1rem 1.25rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', borderLeft: '3px solid var(--primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ marginBottom: '0.35rem' }}>{n.title}</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{n.content}</p>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {n.sender_name && (
                      <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: n.sender_role === 'teacher' ? 'rgba(91,141,255,0.14)' : 'rgba(16,185,129,0.14)', color: n.sender_role === 'teacher' ? '#5B8DEF' : '#10B981', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>
                        {n.sender_role === 'teacher' ? '👨‍🏫' : '🏢'} {n.sender_name} · {n.sender_role === 'teacher' ? 'Teacher' : 'Administration'}
                      </span>
                    )}
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{new Date(n.date_envoi).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</small>
                  </div>
                </div>
                <button onClick={() => handleDeleteNotification(n.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.2rem', flexShrink: 0 }} title="Delete">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderGrades = () => {
    const years = [...new Set(reportCards.map(rc => rc.academic_year))].sort().reverse();
    const yearTabs = ['Global Transcript', ...years];
    
    // All possible semesters
    const allSemesters = ['S1', 'S2'];
    const availableSemesters = reportCards.filter(rc => rc.academic_year === selectedYear).map(rc => rc.semester);
    const activeRc = reportCards.find(rc => rc.academic_year === selectedYear && rc.semester === selectedSemester);
    const isUnavailable = selectedSemester && !availableSemesters.includes(selectedSemester);

    const handleSemesterChange = (sem) => {
      const exists = reportCards.find(rc => rc.academic_year === selectedYear && rc.semester === sem);
      if (!exists) {
        const msg = `No report card found for ${selectedYear} – ${sem}.\n\nThis semester was either not attended or records are unavailable.`;
        window.alert(msg);
        return;
      }
      setSelectedSemester(sem);
    };

    const formatSubject = (subjectStr) => {
      try {
        const parsed = JSON.parse(subjectStr);
        if (Array.isArray(parsed)) return parsed.join(', ');
      } catch {}
      return subjectStr;
    };

    return (
      <div className="glass-panel">
        <h2 style={{ marginBottom: '1.5rem' }}>🎓 Report Cards</h2>
        {reportCards.length > 0 ? (
          <div>
            {/* Year tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {yearTabs.map(y => (
                <button key={y} onClick={() => { setSelectedYear(y); setSelectedSemester(y === 'Global Transcript' ? '' : 'S1'); }}
                  style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)', background: selectedYear === y ? (y === 'Global Transcript' ? 'linear-gradient(135deg, #4F46E5, #7C3AED)' : 'var(--primary)') : 'var(--background)', color: selectedYear === y ? 'white' : 'var(--text-main)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s', boxShadow: selectedYear === y && y === 'Global Transcript' ? '0 4px 10px rgba(79, 70, 229, 0.3)' : 'none' }}>
                  {y === 'Global Transcript' ? '📜 ' + y : y}
                </button>
              ))}
            </div>

            {selectedYear === 'Global Transcript' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '1.5rem' }}>
                {years.map(y => {
                  const yearRcs = reportCards.filter(rc => rc.academic_year === y).sort((a,b) => a.semester.localeCompare(b.semester));
                  if (yearRcs.length === 0) return null;
                  return (
                    <div key={y} style={{ border: '1px solid var(--border)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', background: 'var(--surface)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                      <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '2px solid rgba(79, 70, 229, 0.1)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        🎓 Academic Year: {y}
                      </h3>
                      {yearRcs.map(rc => (
                        <div key={rc.id} style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: `1px solid ${rc.general_average >= 10 ? 'rgba(37,99,235,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <h4 style={{ color: 'var(--text-main)', margin: 0 }}>Semester {rc.semester}</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--surface)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                              <p style={{ fontWeight: 600, margin: 0 }}>Average: <span style={{ color: rc.general_average >= 10 ? 'var(--success)' : 'var(--danger)', fontSize: '1.1rem' }}>{rc.general_average}/20</span></p>
                              <span style={{ padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', background: rc.general_average >= 10 ? 'rgba(37,99,235,0.1)' : 'rgba(239,68,68,0.1)', color: rc.general_average >= 10 ? 'var(--success)' : 'var(--danger)', fontWeight: 700, fontSize: '0.75rem' }}>
                                {rc.general_average >= 10 ? '✓ Passed' : '✗ Failed'}
                              </span>
                            </div>
                          </div>
                          <div className="table-container">
                            <table>
                              <thead><tr><th>Subject</th><th>Type</th><th>Grade</th><th>Rattrapage</th></tr></thead>
                              <tbody>
                                {rc.grades.map(g => (
                                  <tr key={g.id}>
                                    <td>{formatSubject(g.subject)}</td>
                                    <td>{g.evaluation_type}</td>
                                    <td style={{ color: g.value >= 10 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>{g.value}/20</td>
                                    <td>{g.is_rattrapage ? <span className="badge badge-warning">Yes</span> : 'No'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
                {/* Semester tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {allSemesters.map(s => {
                const exists = reportCards.find(rc => rc.academic_year === selectedYear && rc.semester === s);
                return (
                  <button key={s} onClick={() => handleSemesterChange(s)}
                    style={{ padding: '0.4rem 0.875rem', borderRadius: 'var(--radius-full)', border: `1px solid ${exists ? 'var(--primary)' : 'var(--border)'}`, background: selectedSemester === s ? 'var(--primary)' : exists ? 'rgba(37,99,235,0.08)' : 'var(--background)', color: selectedSemester === s ? 'white' : exists ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, opacity: exists ? 1 : 0.6, transition: 'all 0.2s' }}>
                    {s} {!exists && '⚠️'}
                  </button>
                );
              })}
            </div>

                {activeRc ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: activeRc.general_average >= 10 ? 'rgba(37,99,235,0.08)' : 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: `1px solid ${activeRc.general_average >= 10 ? 'rgba(37,99,235,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                      <div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>General Average</p>
                        <p style={{ fontSize: '2rem', fontWeight: 700, color: activeRc.general_average >= 10 ? 'var(--success)' : 'var(--danger)' }}>{activeRc.general_average}<span style={{ fontSize: '1rem', fontWeight: 400 }}>/20</span></p>
                      </div>
                      <span style={{ marginLeft: 'auto', padding: '0.4rem 0.875rem', borderRadius: 'var(--radius-full)', background: activeRc.general_average >= 10 ? 'rgba(37,99,235,0.2)' : 'rgba(239,68,68,0.2)', color: activeRc.general_average >= 10 ? 'var(--success)' : 'var(--danger)', fontWeight: 700, fontSize: '0.85rem' }}>
                        {activeRc.general_average >= 10 ? '✓ Passed' : '✗ Failed'}
                      </span>
                    </div>
                    <div className="table-container">
                      <table>
                        <thead><tr><th>Subject</th><th>Type</th><th>Grade</th><th>Rattrapage</th></tr></thead>
                        <tbody>
                          {activeRc.grades.map(g => (
                            <tr key={g.id}>
                              <td>{formatSubject(g.subject)}</td>
                              <td>{g.evaluation_type}</td>
                              <td style={{ color: g.value >= 10 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>{g.value}/20</td>
                              <td>{g.is_rattrapage ? <span className="badge badge-warning">Yes</span> : 'No'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  !isUnavailable && <p style={{ color: 'var(--text-muted)' }}>Select a semester to view grades.</p>
                )}
              </>
            )}
          </div>
        ) : <p>No report cards available.</p>}
      </div>
    );
  };

  const renderAbsences = () => {
    const formatSubject = (subjectStr) => {
      try {
        const parsed = JSON.parse(subjectStr);
        if (Array.isArray(parsed)) return parsed.join(', ');
      } catch {}
      return subjectStr;
    };

    return (
      <div className="glass-panel">
        <h2 style={{ marginBottom: '1.5rem' }}>📋 Absences</h2>
        <div className="table-container">
          <table>
            <thead><tr><th>Date</th><th>Subject</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {absences.filter(a => !a.is_present).map(a => (
                <tr key={a.id}>
                  <td>{a.date_seance}</td>
                  <td>{formatSubject(a.subject)}</td>
                  <td><span className={`badge ${a.justification_status === 'Validated' ? 'badge-success' : a.justification_status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>{a.justification_status}</span></td>
                  <td>{!a.justification_text && <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setSelectedAbsence(a.id)}>Justify</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {selectedAbsence && (
          <form onSubmit={handleJustifyAbsence} style={{ marginTop: '2rem', padding: '1rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <h4 style={{ marginBottom: '1rem' }}>Submit Justification</h4>
            <div className="input-group">
              <label className="input-label">Reason / Notes</label>
              <textarea className="input-field" value={justificationText} onChange={e => setJustificationText(e.target.value)} required rows={3}></textarea>
            </div>
            <button type="submit" className="btn btn-primary">Submit</button>
            <button type="button" className="btn btn-secondary" style={{ marginLeft: '0.5rem' }} onClick={() => setSelectedAbsence(null)}>Cancel</button>
          </form>
        )}
      </div>
    );
  };

  const renderDocuments = () => (
    <div className="grid-cards">
      <div className="glass-panel">
        <h2 style={{ marginBottom: '1.5rem' }}>📄 Request Document</h2>
        <form onSubmit={handleDocRequest}>
          <div className="input-group">
            <label className="input-label">Document Type</label>
            <select className="input-field" value={docType} onChange={e => setDocType(e.target.value)}>
              <option value="Scolarite">Attestation de Scolarité</option>
              <option value="Reussite">Attestation de Réussite</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary">Submit Request</button>
        </form>
      </div>
      <div className="glass-panel">
        <h2 style={{ marginBottom: '1.5rem' }}>📁 My Requests</h2>
        {documentRequests.map(req => (
          <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--border)' }}>
            <div>
              <strong>{req.document_type === 'Scolarite' ? 'Attestation de Scolarité' : 'Attestation de Réussite'}</strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(req.created_at).toLocaleDateString()}</p>
            </div>
            <span className={`badge ${req.status === 'Validated' ? 'badge-success' : req.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>{req.status}</span>
          </div>
        ))}
      </div>
    </div>
  );

  switch (activeTab) {
    case 'calendar': return renderCalendar();
    case 'notifications': return renderNotifications();
    case 'grades': return renderGrades();
    case 'attendance': return renderAttendance();
    case 'absences': return renderAbsences();
    case 'documents': return renderDocuments();
    default: return renderOverview();
  }
}

export default StudentDashboard;

