import React, { useState, useEffect } from 'react';
import api from '../api';
import { useLanguage } from '../context/LanguageContext';
import { Users, Calendar as CalendarIcon, Bell, UserCheck, FileArchive, Search, Clock, MapPin, CheckCircle, XCircle } from 'lucide-react';

function TeacherDashboard({ activeTab, demoUser }) {
  const { t } = useLanguage();
  const [calendar, setCalendar] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [reportCards, setReportCards] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [attendanceSuccess, setAttendanceSuccess] = useState(false);
  const [newSession, setNewSession] = useState({ course: '', target_class: '', date: '', start_time: '', end_time: '' });
  
  // Grade Editing State
  const [editingRc, setEditingRc] = useState(null);
  const [editGrades, setEditGrades] = useState([]);

  // Class Grading State
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('S1');
  const [selectedEvalType, setSelectedEvalType] = useState('CC');
  const [selectedModule, setSelectedModule] = useState('');
  const [classGrades, setClassGrades] = useState({});
  const [bulkSuccess, setBulkSuccess] = useState(false);

  const teacherModules = React.useMemo(() => {
    if (!demoUser?.teacher_profile?.matiere) return [];
    try {
      const parsed = JSON.parse(demoUser.teacher_profile.matiere);
      return Array.isArray(parsed) ? parsed : [demoUser.teacher_profile.matiere];
    } catch {
      return [demoUser.teacher_profile.matiere];
    }
  }, [demoUser]);

  const teacherClasses = React.useMemo(() => {
    if (!demoUser?.teacher_profile?.classes) return [];
    try {
      const parsed = JSON.parse(demoUser.teacher_profile.classes);
      return Array.isArray(parsed) ? parsed : [demoUser.teacher_profile.classes];
    } catch {
      return [demoUser.teacher_profile.classes];
    }
  }, [demoUser]);

  useEffect(() => {
    if (teacherModules.length > 0 && !selectedModule) {
      setSelectedModule(teacherModules[0]);
    }
  }, [teacherModules, selectedModule]);

  // Load existing grades when filters change
  useEffect(() => {
    if (selectedClass && selectedModule && selectedSemester && selectedEvalType) {
      const initialGrades = {};
      const studentsInClass = students.filter(s => s.student_profile?.filiere === selectedClass);
      
      studentsInClass.forEach(student => {
        // Find the report card for this student and semester
        const rc = reportCards.find(
          r => r.student === student.id && r.semester === selectedSemester
        );
        if (rc && rc.grades) {
          // Find the grade for this module and evaluation type
          const grade = rc.grades.find(
            g => g.subject === selectedModule && g.evaluation_type === selectedEvalType
          );
          if (grade && grade.value !== undefined && grade.value !== null) {
            initialGrades[student.id] = grade.value;
          } else {
            initialGrades[student.id] = '';
          }
        } else {
          initialGrades[student.id] = '';
        }
      });
      
      setClassGrades(initialGrades);
    } else {
      setClassGrades({});
    }
  }, [selectedClass, selectedModule, selectedSemester, selectedEvalType, reportCards, students]);

  const [selectedTimetableClass, setSelectedTimetableClass] = useState('');
  const [classSchedule, setClassSchedule] = useState([[], [], [], [], []]);

  useEffect(() => {
    if (teacherClasses.length > 0 && !selectedTimetableClass) {
      setSelectedTimetableClass(teacherClasses[0]);
    }
  }, [teacherClasses, selectedTimetableClass]);

  useEffect(() => {
    if (selectedTimetableClass) {
      api.get(`/portal/schedules/?target_class=${selectedTimetableClass}`).then(res => {
        if (res.data.length > 0) {
          const data = res.data[0].schedule_data;
          setClassSchedule(Array.isArray(data) && data.length === 5 ? data : [[], [], [], [], []]);
        } else {
          setClassSchedule([[], [], [], [], []]);
        }
      }).catch(() => {});
    }
  }, [selectedTimetableClass]);

  // Forms
  const [newEvent, setNewEvent] = useState({ title: '', description: '', start_time: '', end_time: '', event_type: 'Cours', target_classes: 'All Classes' });
  const [editingEvent, setEditingEvent] = useState(null);
  const [newNotif, setNewNotif] = useState({ title: '', content: '' });
  const [notifSuccess, setNotifSuccess] = useState(false);
  const [eventSuccess, setEventSuccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    api.get('/portal/calendar/', { params: { role: demoUser?.role, user_id: demoUser?.id, filiere: demoUser?.student_profile?.filiere } }).then(res => setCalendar(res.data));
    api.get('/portal/notifications/').then(res => setNotifications(res.data));
    api.get('/portal/absences/').then(res => setAbsences(res.data));
    api.get('/portal/report-cards/').then(res => setReportCards(res.data));
    api.get('/accounts/users/').then(res => {
      setStudents(res.data.filter(u => u.role === 'student'));
    });
    api.get('/portal/courses/').then(res => setCourses(res.data));
    api.get('/portal/sessions/', { params: { teacher: demoUser?.id } }).then(res => {
      setSessions(res.data);
      if (res.data.length > 0 && !selectedSession) {
        setSelectedSession(res.data[0]);
      }
    });
  };

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!demoUser) return;

    api.post('/portal/calendar/', {
      ...newEvent,
      created_by: demoUser.id,
      professor: demoUser.id
    }).then(() => {
      setNewEvent({ title: '', description: '', start_time: '', end_time: '', event_type: 'Cours', target_classes: 'All Classes' });
      setEventSuccess(true);
      setTimeout(() => setEventSuccess(false), 3000);
      fetchData();
    });
  };

  const handleDeleteEvent = (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      api.delete(`/portal/calendar/${id}/`).then(() => fetchData());
    }
  };

  const handleUpdateEvent = (e) => {
    e.preventDefault();
    api.patch(`/portal/calendar/${editingEvent.id}/`, editingEvent).then(() => {
      setEditingEvent(null);
      fetchData();
    });
  };

  const handleSendNotif = (e) => {
    e.preventDefault();
    if (!demoUser) return;

    const recipientIds = students.map(s => s.id);
    if (recipientIds.length === 0) {
      alert('No students found to notify.');
      return;
    }

    api.post('/portal/notifications/', {
      ...newNotif,
      type_notif: 'Info',
      sender: demoUser.id,
      recipients: recipientIds
    }).then(() => {
      setNewNotif({ title: '', content: '' });
      setNotifSuccess(true);
      setTimeout(() => setNotifSuccess(false), 3000);
      fetchData();
    }).catch(err => {
      console.error('Error sending notification:', err);
    });
  };

  const startEditingGrades = (rc) => {
    setEditingRc(rc);
    setEditGrades(rc.grades.map(g => ({ ...g })));
  };

  const handleGradeChange = (index, value) => {
    let val = parseFloat(value) || 0;
    if (val < 0) val = 0;
    if (val > 20) val = 20;
    const updated = [...editGrades];
    updated[index].value = val;
    setEditGrades(updated);
  };

  const saveGrades = () => {
    if (!editingRc) return;
    const promises = editGrades.map(g => api.patch(`/portal/grades/${g.id}/`, { value: g.value }));
    Promise.all(promises).then(() => {
      // Group editGrades by subject to compute weighted average
      const subjectGrades = {};
      editGrades.forEach(g => {
        if (!subjectGrades[g.subject]) {
          subjectGrades[g.subject] = [];
        }
        subjectGrades[g.subject].push(g);
      });

      const subjectAverages = [];
      Object.keys(subjectGrades).forEach(subj => {
        const gradesList = subjectGrades[subj];
        const ccVals = [];
        const examVals = [];
        const otherVals = [];

        gradesList.forEach(g => {
          const evalLower = g.evaluation_type.toLowerCase();
          const val = parseFloat(g.value);
          if (isNaN(val)) return;

          if (evalLower.includes('cc') || evalLower.includes('controle') || evalLower.includes('contrôle')) {
            ccVals.push(val);
          } else if (evalLower.includes('examen') || evalLower.includes('ef') || evalLower.includes('exam') || evalLower.includes('final')) {
            examVals.push(val);
          } else {
            otherVals.push(val);
          }
        });

        let subAvg = 0;
        if (ccVals.length > 0 && examVals.length > 0) {
          const ccAvg = ccVals.reduce((a, b) => a + b, 0) / ccVals.length;
          const examAvg = examVals.reduce((a, b) => a + b, 0) / examVals.length;
          subAvg = ccAvg * 0.3 + examAvg * 0.7;
        } else if (ccVals.length > 0) {
          subAvg = ccVals.reduce((a, b) => a + b, 0) / ccVals.length;
        } else if (examVals.length > 0) {
          subAvg = examVals.reduce((a, b) => a + b, 0) / examVals.length;
        } else if (otherVals.length > 0) {
          subAvg = otherVals.reduce((a, b) => a + b, 0) / otherVals.length;
        } else {
          return;
        }
        subjectAverages.push(subAvg);
      });

      const avg = subjectAverages.length > 0 
        ? (subjectAverages.reduce((a, b) => a + b, 0) / subjectAverages.length).toFixed(2)
        : "0.00";

      api.patch(`/portal/report-cards/${editingRc.id}/`, { general_average: avg }).then(() => {
        setEditingRc(null);
        fetchData();
      });
    }).catch(err => alert("Error saving grades: " + err));
  };

  const handleCreateSession = (e) => {
    e.preventDefault();
    if (!demoUser) return;
    if (!newSession.course || !newSession.date || !newSession.target_class) {
      alert('Please select a course, date and a class.');
      return;
    }

    api.post('/portal/sessions/', {
      course: newSession.course,
      teacher: demoUser.id,
      created_by: demoUser.id,
      target_class: newSession.target_class,
      date: newSession.date,
      start_time: newSession.start_time,
      end_time: newSession.end_time,
    }).then(() => {
      setNewSession({ course: '', target_class: '', date: '', start_time: '', end_time: '' });
      fetchData();
    }).catch(err => {
      console.error('Unable to create session', err);
      alert('Unable to create session.');
    });
  };

  const handleSelectSession = (sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    setSelectedSession(session || null);
    if (session) {
      api.get('/portal/attendances/', { params: { session: sessionId } }).then(res => {
        const records = {};
        res.data.forEach(item => {
          records[item.student] = item.present;
        });
        setAttendanceRecords(records);
      }).catch(() => {
        setAttendanceRecords({});
      });
    } else {
      setAttendanceRecords({});
    }
  };

  const toggleAttendance = (studentId, value) => {
    setAttendanceRecords(prev => ({ ...prev, [studentId]: value }));
  };

  const saveAttendance = () => {
    if (!selectedSession) {
      alert('Select a session first.');
      return;
    }

    const studentList = students.filter(s => {
      if (!selectedSession.target_class || selectedSession.target_class === 'All Classes') return true;
      return s.student_profile?.filiere === selectedSession.target_class;
    });

    const records = studentList.map(student => ({
      session_id: selectedSession.id,
      student_id: student.id,
      present: Boolean(attendanceRecords[student.id]),
    }));

    api.post('/portal/attendances/bulk_create/', { records }).then(() => {
      setAttendanceSuccess(true);
      setTimeout(() => setAttendanceSuccess(false), 3000);
      if (selectedSession) {
        handleSelectSession(selectedSession.id);
      }
    }).catch(err => {
      console.error('Unable to record attendance', err);
      alert('Unable to save attendance.');
    });
  };

  const handleClassGradeChange = (studentId, value) => {
    if (value === '') {
      setClassGrades(prev => ({ ...prev, [studentId]: '' }));
      return;
    }

    if (value === '.' || value === '-') {
      setClassGrades(prev => ({ ...prev, [studentId]: value }));
      return;
    }

    let val = parseFloat(value);
    if (!isNaN(val)) {
      if (val > 20) {
        val = 20;
      } else if (val < 0) {
        val = 0;
      }

      if (value.endsWith('.') || (value.includes('.') && value.endsWith('0'))) {
        setClassGrades(prev => ({ ...prev, [studentId]: value }));
      } else {
        setClassGrades(prev => ({ ...prev, [studentId]: val }));
      }
    } else {
      setClassGrades(prev => ({ ...prev, [studentId]: value }));
    }
  };

  const submitClassGrades = () => {
    if (!selectedClass || !selectedModule) {
      alert('Please select a class and a module.');
      return;
    }
    const gradesArray = Object.keys(classGrades).map(id => ({
      student_id: parseInt(id),
      value: classGrades[id]
    })).filter(g => g.value !== '' && g.value !== undefined && g.value !== null);

    if (gradesArray.length === 0) return;

    const payload = {
      module: selectedModule,
      academic_year: '2025-2026',
      semester: selectedSemester,
      subject: selectedModule,
      evaluation_type: selectedEvalType,
      grades: gradesArray
    };

    api.post('/portal/grades/bulk_submit_grades/', payload).then(() => {
      setBulkSuccess(true);
      setTimeout(() => setBulkSuccess(false), 3000);
      fetchData();
    }).catch(err => alert('Error submitting grades: ' + err));
  };

  const renderOverview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            width: '120px', height: '120px', borderRadius: '50%',
            background: 'var(--gradient-primary)', 
            overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '3px solid var(--border)', flexShrink: 0,
            boxShadow: 'var(--shadow-md)'
          }}>
            {demoUser?.profile_picture ? (
              <img
                src={demoUser.profile_picture.startsWith('http') ? demoUser.profile_picture : `http://127.0.0.1:8000${demoUser.profile_picture}`}
                alt="Profile"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', letterSpacing: '2px' }}>
                {((demoUser?.first_name?.[0] || '') + (demoUser?.last_name?.[0] || '')).toUpperCase()}
              </span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <div style={{ marginBottom: '1.15rem' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.3rem', lineHeight: 1.2 }}>
                {demoUser ? `${demoUser.first_name} ${demoUser.last_name}` : 'Teacher Profile'}
              </h2>
              <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                <span className="badge badge-info">{t('teacher')}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{demoUser?.email}</span>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
              {[
                { label: t('matricule'), value: demoUser?.matricule },
                { label: t('department'), value: demoUser?.teacher_profile?.departement },
                { label: t('assigned_modules'), value: teacherModules.length > 0 ? teacherModules.join(', ') : 'None' },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding: '0.85rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.15rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>{label}</p>
                  <p style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.92rem' }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}><Users size={22} /></div>
          <div className="stat-info">
            <h3>{t('students_count')}</h3>
            <p>{students.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}><CalendarIcon size={22} /></div>
          <div className="stat-info">
            <h3>{t('events_count')}</h3>
            <p>{calendar.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}><Bell size={22} /></div>
          <div className="stat-info">
            <h3>{t('history')}</h3>
            <p>{notifications.filter(n => demoUser && n.sender === demoUser.id).length}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCalendar = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const dayColors = [
      'var(--primary-light)',
      'var(--success-light)',
      'var(--danger-light)',
      'var(--warning-light)',
      'var(--accent-light)'
    ];
    const dayBorders = [
      'var(--primary)',
      'var(--success)',
      'var(--danger)',
      'var(--warning)',
      'var(--accent)'
    ];
    const dayPanelBorders = [
      'var(--primary-border)',
      'var(--success-border)',
      'var(--danger-border)',
      'var(--warning-border)',
      'var(--accent-border)'
    ];
    const hasSchedule = classSchedule.some(day => day.length > 0);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0 }}>📅 {t('timetable')}</h2>
            {teacherClasses.length > 0 && (
              <select className="input-field" style={{ width: 'auto' }} value={selectedTimetableClass} onChange={e => setSelectedTimetableClass(e.target.value)}>
                {teacherClasses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>
          
          {teacherClasses.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)' }}>
              <p style={{ color: 'var(--text-muted)' }}>You have no classes assigned.</p>
            </div>
          ) : hasSchedule ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
              {days.map((day, idx) => (
                <div key={day} style={{ border: `1px solid ${dayPanelBorders[idx]}`, borderTop: `3px solid ${dayBorders[idx]}`, borderRadius: 'var(--radius-md)', padding: '1rem', background: dayColors[idx], minHeight: '150px' }}>
                  <h4 style={{ textAlign: 'center', marginBottom: '1rem', color: dayBorders[idx], fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{day}</h4>
                  {classSchedule[idx] && classSchedule[idx].map((s, i) => (
                    <div key={i} style={{ padding: '0.5rem', background: 'var(--surface)', marginBottom: '0.5rem', borderRadius: '6px', boxShadow: 'var(--shadow-sm)', borderLeft: `3px solid ${dayBorders[idx]}` }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: dayBorders[idx] }}>{s.time}</p>
                      <p style={{ fontSize: '0.8rem', marginTop: '0.2rem', color: 'var(--text-main)' }}>{s.name}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)' }}>
              <p style={{ color: 'var(--text-muted)' }}>No timetable found for {selectedTimetableClass}.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderNotifications = () => {
    const sentByMe = notifications.filter(n => demoUser && n.sender === demoUser.id);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="glass-panel">
          <h2>📢 {t('broadcast')}</h2>
          <form onSubmit={handleSendNotif}>
            <div className="input-group"><label className="input-label">Title</label><input type="text" className="input-field" value={newNotif.title} onChange={e => setNewNotif({ ...newNotif, title: e.target.value })} required /></div>
            <div className="input-group"><label className="input-label">Message</label><textarea className="input-field" rows={4} value={newNotif.content} onChange={e => setNewNotif({ ...newNotif, content: e.target.value })} required></textarea></div>
            <button type="submit" className="btn btn-primary">Send</button>
          </form>
        </div>
      </div>
    );
  };

  const renderAttendance = () => {
    const studentList = students.filter(s => {
      if (!selectedSession || !selectedSession.target_class || selectedSession.target_class === 'All Classes') return true;
      return s.student_profile?.filiere === selectedSession.target_class;
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            📅 Create a New Session
          </h2>
          <form onSubmit={handleCreateSession} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
            <div className="input-group">
              <label className="input-label">Assigned Course</label>
              <select className="input-field" value={newSession.course} onChange={e => setNewSession({ ...newSession, course: e.target.value })} required>
                <option value="">-- Select Course --</option>
                {courses.filter(c => c.teacher === demoUser?.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Target Class</label>
              <select className="input-field" value={newSession.target_class} onChange={e => setNewSession({ ...newSession, target_class: e.target.value })} required>
                <option value="">-- Select Class --</option>
                {teacherClasses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Date</label>
              <input type="date" className="input-field" value={newSession.date} onChange={e => setNewSession({ ...newSession, date: e.target.value })} required />
            </div>
            <div className="input-group">
              <label className="input-label">Start Time</label>
              <input type="time" className="input-field" value={newSession.start_time} onChange={e => setNewSession({ ...newSession, start_time: e.target.value })} required />
            </div>
            <div className="input-group">
              <label className="input-label">End Time</label>
              <input type="time" className="input-field" value={newSession.end_time} onChange={e => setNewSession({ ...newSession, end_time: e.target.value })} required />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="btn btn-primary">Create Session</button>
            </div>
          </form>
        </div>

        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <UserCheck size={28} className="text-primary" /> {t('mark_presence')}
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            <div className="input-group">
              <label className="input-label">{t('select_module')}</label>
              <select className="input-field" value={selectedSession?.id || ''} onChange={e => handleSelectSession(parseInt(e.target.value))}>
                <option value="">-- {t('select_module')} --</option>
                {sessions.map(s => <option key={s.id} value={s.id}>{s.course_name} - {s.date}</option>)}
              </select>
            </div>
          </div>

          {selectedSession && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>{t('student_name')}</th><th>{t('status')}</th></tr>
                  </thead>
                  <tbody>
                    {studentList.map(student => (
                      <tr key={student.id}>
                        <td>{student.first_name} {student.last_name}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '1rem' }}>
                            <button 
                              onClick={() => toggleAttendance(student.id, true)}
                              style={{ 
                                padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid var(--border)',
                                background: attendanceRecords[student.id] ? 'var(--success)' : 'var(--surface)',
                                color: attendanceRecords[student.id] ? 'white' : 'var(--text-main)',
                                cursor: 'pointer', flex: 1
                              }}
                            >
                              {t('present')}
                            </button>
                            <button 
                              onClick={() => toggleAttendance(student.id, false)}
                              style={{ 
                                padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid var(--border)',
                                background: attendanceRecords[student.id] === false ? 'var(--danger)' : 'var(--surface)',
                                color: attendanceRecords[student.id] === false ? 'white' : 'var(--text-main)',
                                cursor: 'pointer', flex: 1
                              }}
                            >
                              {t('absent')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button className="btn btn-primary" onClick={saveAttendance}>{t('submit_attendance')}</button>
              {attendanceSuccess && <p style={{ color: 'var(--success)', fontWeight: 700 }}>{t('attendance_success')}</p>}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderGrades = () => {
    const uniqueClasses = [...new Set(students.map(s => s.student_profile?.filiere).filter(Boolean))];
    const studentsInClass = students.filter(s => s.student_profile?.filiere === selectedClass);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '2rem' }}>
            <FileArchive size={28} className="text-primary" /> {t('grading')}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
            <div className="input-group">
              <label className="input-label">{t('select_class')}</label>
              <select className="input-field" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                <option value="">-- {t('select_class')} --</option>
                {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">{t('select_module')}</label>
              <select className="input-field" value={selectedModule} onChange={e => setSelectedModule(e.target.value)}>
                {teacherModules.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">{t('semester')}</label>
              <select className="input-field" value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)}>
                <option value="S1">{t('s1')}</option>
                <option value="S2">{t('s2')}</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">{t('evaluation_type')}</label>
              <select className="input-field" value={selectedEvalType} onChange={e => setSelectedEvalType(e.target.value)}>
                <option value="CC">{t('cc')}</option>
                <option value="Examen">{t('examen')}</option>
                <option value="TP">{t('tp')}</option>
              </select>
            </div>
          </div>

          {selectedClass ? (
            studentsInClass.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)' }}>
                <p style={{ color: 'var(--text-muted)' }}>No students found in class {selectedClass}.</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>{t('student_name')}</th>
                      <th>{t('grading')} (/20)</th>
                      <th>{t('status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsInClass.map(student => {
                      const gradeVal = classGrades[student.id];
                      const numGrade = parseFloat(gradeVal);
                      const isValidated = !isNaN(numGrade) && numGrade >= 10;
                      const isPending = gradeVal === '' || gradeVal === undefined || isNaN(numGrade);

                      return (
                        <tr key={student.id}>
                          <td>{student.first_name} {student.last_name}</td>
                          <td>
                            <input 
                              type="number" 
                              className="input-field" 
                              style={{ width: '120px' }} 
                              value={gradeVal !== undefined ? gradeVal : ''} 
                              min="0"
                              max="20"
                              step="0.25"
                              placeholder="--"
                              onChange={e => handleClassGradeChange(student.id, e.target.value)} 
                            />
                          </td>
                          <td>
                            {isPending ? (
                              <span className="badge" style={{ 
                                background: 'var(--muted-light)', 
                                color: 'var(--text-muted)', 
                                border: '1px solid var(--muted-border)',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem'
                              }}>
                                <Clock size={14} /> {t('not_entered')}
                              </span>
                            ) : isValidated ? (
                              <span className="badge" style={{ 
                                background: 'var(--success-light)', 
                                color: 'var(--success)', 
                                border: '1px solid var(--success-border)',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem'
                              }}>
                                <CheckCircle size={14} /> {t('validated')}
                              </span>
                            ) : (
                              <span className="badge" style={{ 
                                background: 'var(--danger-light)', 
                                color: 'var(--danger)', 
                                border: '1px solid var(--danger-border)',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem'
                              }}>
                                <XCircle size={14} /> {t('not_validated')}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                  <button className="btn btn-primary" onClick={submitClassGrades}>{t('save')}</button>
                  {bulkSuccess && <p style={{ color: 'var(--success)', fontWeight: 700, margin: 0 }}>{t('save_success')}</p>}
                </div>
              </div>
            )
          ) : (
            <div style={{ padding: '2.5rem', textAlign: 'center', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)' }}>
              <p style={{ color: 'var(--text-muted)' }}>{t('select_class_to_grade') || 'Please select a class to load the student list.'}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTutorat = () => {
    const tutoredStudents = students.filter(s => s.student_profile?.tutor_name === `${demoUser?.first_name} ${demoUser?.last_name}`);
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '2rem' }}>
            <Users size={28} className="text-primary" /> {t('tutorat') || 'Tutoring Management'}
          </h2>
          
          {editingRc ? (
            <div>
              <h3 style={{ marginBottom: '1rem' }}>Editing Grades for {students.find(s => s.id === editingRc.student)?.first_name}</h3>
              <div className="table-container" style={{ marginBottom: '1.5rem' }}>
                <table>
                  <thead>
                    <tr><th>Subject</th><th>Evaluation</th><th>Value</th></tr>
                  </thead>
                  <tbody>
                    {editGrades.map((g, index) => (
                      <tr key={g.id}>
                        <td>{g.subject}</td>
                        <td>{g.evaluation_type}</td>
                        <td>
                          <input 
                            type="number" 
                            className="input-field" 
                            value={g.value} 
                            min="0" max="20" step="0.25"
                            onChange={e => handleGradeChange(index, e.target.value)} 
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn btn-primary" onClick={saveGrades}>Save Grades & Recalculate Average</button>
                <button className="btn btn-secondary" onClick={() => setEditingRc(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            tutoredStudents.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)' }}>
                <p style={{ color: 'var(--text-muted)' }}>You have no tutored students assigned.</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>{t('student_name')}</th>
                      <th>Class / Year</th>
                      <th>Report Cards</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tutoredStudents.map(student => {
                      const rcs = reportCards.filter(r => r.student === student.id);
                      return (
                        <tr key={student.id}>
                          <td>{student.first_name} {student.last_name}</td>
                          <td>{student.student_profile?.filiere} (Year {student.student_profile?.annee_etude})</td>
                          <td>
                            {rcs.length === 0 ? <span className="text-muted">No report cards</span> : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {rcs.map(rc => (
                                  <div key={rc.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--surface-hover)', padding: '0.5rem', borderRadius: '4px' }}>
                                    <span style={{ fontWeight: 600 }}>{rc.academic_year} - {rc.semester}</span>
                                    <span className={`badge ${rc.general_average >= 10 ? 'badge-success' : 'badge-danger'}`}>
                                      Avg: {rc.general_average !== null ? rc.general_average : 'N/A'}
                                    </span>
                                    <button 
                                      className="btn btn-secondary" 
                                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', minWidth: 'auto' }}
                                      onClick={() => startEditingGrades(rc)}
                                    >
                                      Edit Grades
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    );
  };

  switch (activeTab) {
    case 'calendar': return renderCalendar();
    case 'notifications': return renderNotifications();
    case 'attendance': return renderAttendance();
    case 'grades': return renderGrades();
    case 'tutorat': return renderTutorat();
    default: return renderOverview();
  }
}

export default TeacherDashboard;
