import React, { useState, useEffect } from 'react';
import api from '../api';

function AdminDashboard({ activeTab, demoUser }) {
  const [notifications, setNotifications] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [documentRequests, setDocumentRequests] = useState([]);
  const [students, setStudents] = useState([]);
  const [calendar, setCalendar] = useState([]);
  const [courses, setCourses] = useState([]);
  const [newCourse, setNewCourse] = useState({ name: '', code: '' });
  
  // Calendar Edit State
  const [editingEvent, setEditingEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', start_time: '', end_time: '', event_type: 'Cours', target_classes: 'All Classes', professor: '' });
  const [eventSuccess, setEventSuccess] = useState(false);
  
  const [newNotif, setNewNotif] = useState({ title: '', content: '' });
  const [notifSuccess, setNotifSuccess] = useState(false);

  // Module Assignment State
  const [selectedTeacherForModules, setSelectedTeacherForModules] = useState('');
  const [teacherModules, setTeacherModules] = useState([]);
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [moduleSaveSuccess, setModuleSaveSuccess] = useState(false);

  // Timetable State
  const [selectedClassForTimetable, setSelectedClassForTimetable] = useState('');
  const [timetableId, setTimetableId] = useState(null);
  const [timetableData, setTimetableData] = useState([[], [], [], [], []]);
  const [timetableSuccess, setTimetableSuccess] = useState(false);
  const [newSlot, setNewSlot] = useState({ dayIdx: 0, time: '', subject: '', teacher: '' });

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (selectedTeacherForModules) {
      const teacher = students.find(s => s.id === parseInt(selectedTeacherForModules));
      if (teacher && teacher.teacher_profile) {
        try {
          const parsedM = JSON.parse(teacher.teacher_profile.matiere);
          setTeacherModules(Array.isArray(parsedM) ? parsedM : [teacher.teacher_profile.matiere].filter(Boolean));
        } catch {
          setTeacherModules(teacher.teacher_profile.matiere ? [teacher.teacher_profile.matiere] : []);
        }
        try {
          const parsedC = JSON.parse(teacher.teacher_profile.classes);
          setTeacherClasses(Array.isArray(parsedC) ? parsedC : [teacher.teacher_profile.classes].filter(Boolean));
        } catch {
          setTeacherClasses(teacher.teacher_profile.classes ? [teacher.teacher_profile.classes] : []);
        }
      } else {
        setTeacherModules([]);
        setTeacherClasses([]);
      }
    } else {
      setTeacherModules([]);
      setTeacherClasses([]);
    }
  }, [selectedTeacherForModules, students]);

  useEffect(() => {
    if (selectedClassForTimetable) {
      api.get(`/portal/schedules/?target_class=${selectedClassForTimetable}`).then(res => {
        if (res.data.length > 0) {
          setTimetableId(res.data[0].id);
          const data = res.data[0].schedule_data;
          setTimetableData(Array.isArray(data) && data.length === 5 ? data : [[], [], [], [], []]);
        } else {
          setTimetableId(null);
          setTimetableData([[], [], [], [], []]);
        }
      });
    } else {
      setTimetableId(null);
      setTimetableData([[], [], [], [], []]);
    }
  }, [selectedClassForTimetable]);

  const fetchData = () => {
    api.get('/portal/notifications/').then(res => setNotifications(res.data));
    api.get('/portal/absences/').then(res => setAbsences(res.data));
    api.get('/portal/document-requests/').then(res => setDocumentRequests(res.data));
    api.get('/accounts/users/').then(res => setStudents(res.data));
    api.get('/portal/calendar/').then(res => setCalendar(res.data));
    api.get('/portal/courses/').then(res => setCourses(res.data));
  };

  const handleSendNotif = (e) => {
    e.preventDefault();
    if (!demoUser) return;
    const recipientIds = students.filter(s => s.role === 'student').map(s => s.id);
    if (recipientIds.length === 0) { alert('No students found.'); return; }

    api.post('/portal/notifications/', {
      ...newNotif,
      type_notif: 'Urgent',
      sender: demoUser.id,
      recipients: recipientIds
    }).then(() => {
      setNewNotif({ title: '', content: '' });
      setNotifSuccess(true);
      setTimeout(() => setNotifSuccess(false), 3000);
      fetchData();
    }).catch(err => console.error('Notification error:', err));
  };

  const handleDeleteStudent = (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      api.delete(`/accounts/users/${id}/`).then(() => fetchData());
    }
  };

  const handleCreateCourse = (e) => {
    e.preventDefault();
    if (!newCourse.name) {
      alert('Please enter a course name.');
      return;
    }
    api.post('/portal/courses/', newCourse).then(() => {
      setNewCourse({ name: '', code: '' });
      fetchData();
    }).catch(err => {
      console.error('Error creating course', err);
      alert('Unable to create course.');
    });
  };

  const handleValidation = (type, id, status) => {
    const endpoint = type === 'absence' ? `/portal/absences/${id}/` : `/portal/document-requests/${id}/`;
    const payload = type === 'absence' ? { justification_status: status } : { status };
    api.patch(endpoint, payload).then(() => fetchData());
  };

  const handleDeleteEvent = (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      api.delete(`/portal/calendar/${id}/`).then(() => fetchData());
    }
  };

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!demoUser) return;
    
    // professor field can be empty or ID
    const payload = {
      ...newEvent,
      created_by: demoUser.id,
    };
    if (!payload.professor) delete payload.professor;

    api.post('/portal/calendar/', payload).then(() => {
      setNewEvent({ title: '', description: '', start_time: '', end_time: '', event_type: 'Cours', target_classes: 'All Classes', professor: '' });
      setEventSuccess(true);
      setTimeout(() => setEventSuccess(false), 3000);
      fetchData();
    }).catch(err => console.error("Error adding event:", err));
  };

  const handleUpdateEvent = (e) => {
    e.preventDefault();
    const payload = { ...editingEvent };
    if (!payload.professor) payload.professor = null;
    
    api.patch(`/portal/calendar/${editingEvent.id}/`, payload).then(() => {
      setEditingEvent(null);
      fetchData();
    }).catch(err => console.error("Error updating event:", err));
  };

  const handleSaveTimetable = () => {
    if (!selectedClassForTimetable) return;
    const payload = { target_class: selectedClassForTimetable, schedule_data: timetableData };
    if (timetableId) {
      api.patch(`/portal/schedules/${timetableId}/`, payload).then(() => {
        setTimetableSuccess(true);
        setTimeout(() => setTimetableSuccess(false), 3000);
      });
    } else {
      api.post(`/portal/schedules/`, payload).then(res => {
        setTimetableId(res.data.id);
        setTimetableSuccess(true);
        setTimeout(() => setTimetableSuccess(false), 3000);
      });
    }
  };

  const handleAddSlot = (e) => {
    e.preventDefault();
    if (!newSlot.time || !newSlot.subject) return;
    const displayName = newSlot.teacher ? `${newSlot.subject} (${newSlot.teacher})` : newSlot.subject;
    setTimetableData(prev => {
      const updated = [...prev];
      updated[newSlot.dayIdx] = [...(updated[newSlot.dayIdx] || []), { time: newSlot.time, name: displayName }];
      updated[newSlot.dayIdx].sort((a,b) => a.time.localeCompare(b.time));
      return updated;
    });
    setNewSlot({ dayIdx: 0, time: '', subject: '', teacher: '' });
  };

  const handleRemoveSlot = (dayIdx, slotIdx) => {
    setTimetableData(prev => {
      const updated = [...prev];
      updated[dayIdx] = updated[dayIdx].filter((_, i) => i !== slotIdx);
      return updated;
    });
  };

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
                  {demoUser ? `${demoUser.first_name} ${demoUser.last_name}` : 'Admin Control Center'}
                </h2>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span className="badge badge-info" style={{ background: 'var(--primary)', color: 'white' }}>Administrator</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{demoUser?.email}</span>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {[
                { label: 'Matricule', value: demoUser?.matricule, icon: '🆔' },
                { label: 'Department / Service', value: demoUser?.admin_profile?.service || 'Administration', icon: '🏢' },
                { label: 'Platform Access', value: 'Full Control', icon: '⚡' },
              ].map(({ label, value, icon }) => (
                <div key={label} style={{ padding: '1.25rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: 700 }}>{icon} {label}</p>
                  <p style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem' }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(91, 141, 255, 0.1)', color: 'var(--primary)' }}>👥</div>
          <div className="stat-info">
            <h3>Total Users</h3>
            <p>{students.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>📄</div>
          <div className="stat-info">
            <h3>Docs Pending</h3>
            <p>{documentRequests.filter(r => r.status === 'Pending').length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>📋</div>
          <div className="stat-info">
            <h3>Absences Pending</h3>
            <p>{absences.filter(a => a.justification_status === 'Pending').length}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotifications = () => {
    const sentByMe = notifications.filter(n => demoUser && n.sender === demoUser.id);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
        <div className="glass-panel">
          <h2 style={{ marginBottom: '0.5rem' }}>📢 Global Announcement</h2>
          {notifSuccess && <div style={{ padding: '0.875rem', background: 'rgba(37,99,235,0.1)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', color: 'var(--primary)' }}>✅ Announcement sent!</div>}
          <form onSubmit={handleSendNotif}>
            <div className="input-group"><label className="input-label">Title</label><input type="text" className="input-field" value={newNotif.title} onChange={e => setNewNotif({ ...newNotif, title: e.target.value })} required /></div>
            <div className="input-group"><label className="input-label">Content</label><textarea className="input-field" rows={4} value={newNotif.content} onChange={e => setNewNotif({ ...newNotif, content: e.target.value })} required></textarea></div>
            <button type="submit" className="btn btn-primary">🔔 Broadcast to All Students</button>
          </form>
        </div>
        <div className="glass-panel">
          <h2>📬 Sent Announcements</h2>
          {sentByMe.map(n => (
            <div key={n.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
              <h4>{n.title}</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{n.content}</p>
              <small>{new Date(n.date_envoi).toLocaleString()}</small>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCalendar = () => (
    <div className="glass-panel">
      <h2 style={{ marginBottom: '1.5rem' }}>📅 Global Calendar Management</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>As an Administrator, you can modify or delete any event scheduled by teachers.</p>
      
      {editingEvent ? (
        <div style={{ padding: '1.5rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary)', marginBottom: '2rem' }}>
          <h3>Edit Event</h3>
          <form onSubmit={handleUpdateEvent} style={{ marginTop: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group"><label className="input-label">Title</label><input type="text" className="input-field" value={editingEvent.title} onChange={e => setEditingEvent({...editingEvent, title: e.target.value})} /></div>
              <div className="input-group"><label className="input-label">Description</label><input type="text" className="input-field" value={editingEvent.description} onChange={e => setEditingEvent({...editingEvent, description: e.target.value})} /></div>
              <div className="input-group"><label className="input-label">Type</label><select className="input-field" value={editingEvent.event_type} onChange={e => setEditingEvent({...editingEvent, event_type: e.target.value})}><option value="Cours">Cours</option><option value="TD">TD</option><option value="Examen">Examen</option></select></div>
              <div className="input-group"><label className="input-label">Target Class(es)</label><input type="text" className="input-field" value={editingEvent.target_classes || ''} onChange={e => setEditingEvent({...editingEvent, target_classes: e.target.value})} /></div>
              <div className="input-group"><label className="input-label">Professor</label>
                <select className="input-field" value={editingEvent.professor || ''} onChange={e => setEditingEvent({...editingEvent, professor: e.target.value})}>
                  <option value="">None / Admin</option>
                  {students.filter(s => s.role === 'teacher').map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div className="input-group"><label className="input-label">Start</label><input type="datetime-local" className="input-field" value={editingEvent.start_time.slice(0, 16)} onChange={e => setEditingEvent({...editingEvent, start_time: e.target.value})} /></div>
              <div className="input-group"><label className="input-label">End</label><input type="datetime-local" className="input-field" value={editingEvent.end_time.slice(0, 16)} onChange={e => setEditingEvent({...editingEvent, end_time: e.target.value})} /></div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary">Update Event</button>
              <button type="button" className="btn btn-secondary" onClick={() => setEditingEvent(null)}>Cancel</button>
            </div>
          </form>
        </div>
      ) : null}

      <div style={{ padding: '1.5rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)', marginBottom: '2rem' }}>
        <h3>➕ Add New Event</h3>
        {eventSuccess && <div style={{ padding: '0.875rem', background: 'rgba(37,99,235,0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(37,99,235,0.3)', marginBottom: '1rem', color: 'var(--primary)' }}>✅ Event added successfully!</div>}
        <form onSubmit={handleAddEvent} style={{ marginTop: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}><label className="input-label">Title</label><input type="text" className="input-field" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} required /></div>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}><label className="input-label">Description</label><input type="text" className="input-field" value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} /></div>
            <div className="input-group"><label className="input-label">Type</label><select className="input-field" value={newEvent.event_type} onChange={e => setNewEvent({ ...newEvent, event_type: e.target.value })}><option value="Cours">Cours</option><option value="TD">TD</option><option value="Examen">Examen</option></select></div>
            <div className="input-group"><label className="input-label">Target Class(es)</label><input type="text" className="input-field" placeholder="e.g. 1A_IIR or All Classes" value={newEvent.target_classes} onChange={e => setNewEvent({ ...newEvent, target_classes: e.target.value })} /></div>
            <div className="input-group"><label className="input-label">Professor</label>
              <select className="input-field" value={newEvent.professor} onChange={e => setNewEvent({ ...newEvent, professor: e.target.value })}>
                <option value="">None / Admin</option>
                {students.filter(s => s.role === 'teacher').map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
              </select>
            </div>
            <div className="input-group"><label className="input-label">Start</label><input type="datetime-local" className="input-field" value={newEvent.start_time} onChange={e => setNewEvent({ ...newEvent, start_time: e.target.value })} required /></div>
            <div className="input-group"><label className="input-label">End</label><input type="datetime-local" className="input-field" value={newEvent.end_time} onChange={e => setNewEvent({ ...newEvent, end_time: e.target.value })} required /></div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Add Event</button>
        </form>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr><th>Title</th><th>Type / Class</th><th>Start</th><th>Professor</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {calendar.map(ev => (
              <tr key={ev.id}>
                <td><strong>{ev.title}</strong><br/><small style={{color:'var(--text-muted)'}}>{ev.description}</small></td>
                <td>
                  <span className="badge badge-info">{ev.event_type}</span><br/>
                  <small style={{color:'var(--text-muted)', marginTop: '0.2rem', display: 'inline-block'}}>{ev.target_classes}</small>
                </td>
                <td>{new Date(ev.start_time).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                <td>{ev.professor_name || ev.created_by_name}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setEditingEvent(ev)}>Edit</button>
                    <button className="btn btn-danger" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleDeleteEvent(ev.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="glass-panel" style={{ marginTop: '3rem', background: 'var(--surface)' }}>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--secondary)' }}>🏫 Weekly Timetable Management</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Select a class to view, edit, or create its 5-day schedule.</p>
        
        <div className="input-group" style={{ marginBottom: '2rem' }}>
          <label className="input-label">Select Target Class</label>
          <select className="input-field" value={selectedClassForTimetable} onChange={e => setSelectedClassForTimetable(e.target.value)}>
            <option value="">-- Choose a Class --</option>
            {['1AP', '2AP', '1GC', '1GF', '2GC', '2GF', '3IIR', '3GI', '3GE', '3GC', '3GF', '4IA', '4DD', '4CIR', '4GI', '4GE', '4GC', '4GF', '5IA', '5DD', '5CIR', '5GI', '5GE', '5GC', '5GF'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {selectedClassForTimetable && (
          <div>
            <form onSubmit={handleAddSlot} style={{ padding: '1.5rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)', marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Add New Slot</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 1.5fr', gap: '1rem', alignItems: 'end' }}>
                <div className="input-group">
                  <label className="input-label">Day</label>
                  <select className="input-field" value={newSlot.dayIdx} onChange={e => setNewSlot({...newSlot, dayIdx: parseInt(e.target.value)})}>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Time Range</label>
                  <input type="text" className="input-field" placeholder="e.g. 08:30-10:15" value={newSlot.time} onChange={e => setNewSlot({...newSlot, time: e.target.value})} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Subject</label>
                  <input type="text" className="input-field" placeholder="e.g. Algorithmique" value={newSlot.subject} onChange={e => setNewSlot({...newSlot, subject: e.target.value})} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Teacher</label>
                  <select className="input-field" value={newSlot.teacher} onChange={e => setNewSlot({...newSlot, teacher: e.target.value})}>
                    <option value="">-- Select Teacher --</option>
                    {students.filter(s => s.role === 'teacher').map(t => (
                      <option key={t.id} value={`${t.first_name} ${t.last_name}`}>
                        {t.first_name} {t.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-secondary" style={{ marginTop: '1rem' }}>+ Add Slot to {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][newSlot.dayIdx]}</button>
            </form>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, idx) => (
                <div key={day} style={{ border: `1px solid var(--border)`, borderTop: `3px solid var(--secondary)`, borderRadius: 'var(--radius-md)', padding: '1rem', background: 'var(--background)', minHeight: '150px' }}>
                  <h4 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>{day}</h4>
                  {timetableData[idx] && timetableData[idx].map((s, i) => (
                    <div key={i} style={{ padding: '0.5rem', background: 'var(--surface)', marginBottom: '0.5rem', borderRadius: '4px', borderLeft: '3px solid var(--secondary)', position: 'relative' }}>
                      <button type="button" onClick={() => handleRemoveSlot(idx, i)} style={{ position: 'absolute', top: '0.1rem', right: '0.1rem', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}>&times;</button>
                      <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--secondary)' }}>{s.time}</p>
                      <p style={{ fontSize: '0.75rem', marginTop: '0.2rem', color: 'var(--text-main)', paddingRight: '0.5rem' }}>{s.name}</p>
                    </div>
                  ))}
                  {(!timetableData[idx] || timetableData[idx].length === 0) && <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>No slots</p>}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button className="btn btn-primary" onClick={handleSaveTimetable}>💾 Save Timetable for {selectedClassForTimetable}</button>
              {timetableSuccess && <span style={{ color: 'var(--success)', fontWeight: 600 }}>✅ Timetable saved successfully!</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const [newUser, setNewUser] = useState({ first_name: '', last_name: '', role: 'student', gender: 'M', sector: 'IIR', grade: 1, subSector: 'IA' });
  const [userCreationStatus, setUserCreationStatus] = useState('');

  const deriveClass = (sector, grade, subSector) => {
    if ((grade === 1 || grade === 2) && (sector === 'IIR' || sector === 'GI' || sector === 'GE')) {
      return `${grade}AP`;
    }
    if ((grade === 4 || grade === 5) && sector === 'IIR') {
      return `${grade}${subSector || 'IA'}`;
    }
    return `${grade}${sector}`;
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    const payload = { ...newUser };
    if (payload.role === 'student') {
      payload.filiere = deriveClass(payload.sector, payload.grade, payload.subSector);
      payload.annee_etude = payload.grade;
    }

    api.post('/accounts/users/create_user/', payload)
      .then((res) => {
        setUserCreationStatus(`User created successfully with email: ${res.data.email}`);
        setNewUser({ first_name: '', last_name: '', role: 'student', gender: 'M', sector: 'IIR', grade: 1, subSector: 'IA' });
        setTimeout(() => setUserCreationStatus(''), 5000);
        // Refresh users list if needed, currently we just fetch students, let's fetch all
        api.get('/accounts/users/').then(r => setStudents(r.data)); 
      })
      .catch((err) => {
        setUserCreationStatus(err.response?.data?.error || 'Error creating user');
        setTimeout(() => setUserCreationStatus(''), 5000);
      });
  };

  const handleToggleModule = (moduleName) => {
    setTeacherModules(prev => 
      prev.includes(moduleName) 
        ? prev.filter(m => m !== moduleName)
        : [...prev, moduleName]
    );
  };

  const handleToggleClass = (className) => {
    setTeacherClasses(prev => 
      prev.includes(className) 
        ? prev.filter(c => c !== className)
        : [...prev, className]
    );
  };

  const handleSaveModules = () => {
    if (!selectedTeacherForModules) return;
    api.patch(`/accounts/users/${selectedTeacherForModules}/assign_modules/`, { modules: teacherModules, classes: teacherClasses })
      .then(() => {
        setModuleSaveSuccess(true);
        setTimeout(() => setModuleSaveSuccess(false), 3000);
        fetchData();
      })
      .catch(err => alert("Error saving modules/classes: " + err));
  };

  const EMSI_MODULES = {
    "Cycle Préparatoire (Années 1 & 2)": {
      "1ère Année: Fondamentaux Scientifiques": {
        "Mathématiques": ["Analyse (suites, intégrales)", "Algèbre linéaire", "Mathématiques discrètes"],
        "Sciences Physiques": ["Thermodynamique", "Optique géométrique", "Chimie générale"],
        "Informatique": ["Logique", "Algorithmique", "Initiation au langage C"],
        "Sciences de l'Ingénieur": ["Circuits électriques", "Électronique numérique", "Systèmes séquentiels"],
        "Langues et Soft Skills": ["Français des affaires", "Anglais professionnel", "Macro/Microéconomie"]
      },
      "2ème Année: Transition Vers l'Ingénierie": {
        "Mathématiques Avancées": ["Probabilités", "Statistiques", "Analyse numérique"],
        "Développement Logiciel": ["Structures de données", "Java/C++", "Développement Web (HTML/CSS)"],
        "Systèmes et Bases de Données": ["Gestion SQL", "Systèmes d'exploitation (Linux)"],
        "Ingénierie Appliquée": ["Microprocesseurs", "Programmation Arduino", "Capteurs et Instrumentation"],
        "Gestion et Droit": ["Comptabilité générale", "Droit commercial", "Mathématiques financières"],
        "Projets": ["Projet de Fin d'Année (PFA)"]
      }
    },
    "Cycle Ingénieur: Spécialisations (Années 3, 4 & 5)": {
      "Ingénierie Informatique et Réseaux (IIR)": {
        "Développement digital et SI (DD)": ["Développement Mobile (Android/iOS)", "Développement Full-Stack", "Développement DevOps", "Cloud Computing"],
        "Cybersecurité et infrastructures réseaux (CIR)": ["Ethical Hacking", "Cryptographie", "Sécurité Réseaux", "Blockchain"],
        "Intelligence Artificielle et sciences de données (IA)": ["Machine Learning", "Big Data", "Deep Learning", "IA Générative"],
        "Outils & Infrastructures": ["AWS", "Azure", "Docker", "Kubernetes", "Jenkins"]
      },
      "Génie Civil, BTP et Géotechnique": {
        "Structures": ["Béton armé", "Béton précontraint", "Charpente métallique"],
        "Études Techniques": ["Hydraulique", "Géotechnique", "Infrastructures routières et ponts"],
        "Management": ["Gestion de chantier", "Métré et étude de prix", "Pathologie du bâtiment"],
        "Logiciels": ["Revit (BIM)", "AutoCAD", "Robot Structural Analysis (RSA)"]
      },
      "Génie Industriel": {
        "Opérations": ["Gestion de production (GPAO)", "Supply Chain & Logistique", "Lean Manufacturing"],
        "Maintenance": ["GMAO", "Fiabilité", "Contrôle Qualité (Six Sigma)"],
        "Automatisation": ["Robotique industrielle", "Automates (API)", "IoT industriel (IIoT)"],
        "Logiciels": ["Systèmes ERP (SAP/Odoo)", "Simulation ARENA"]
      },
      "Génie Électrique et Systèmes Intelligents": {
        "Énergie": ["Smart Grids", "Énergies renouvelables (Solaire/Éolien)", "Électronique de puissance"],
        "Automatique": ["Systèmes de commande", "TIA Portal", "Supervision industrielle"],
        "Systèmes": ["Systèmes embarqués", "Traitement du signal", "Instrumentation"],
        "Logiciels": ["Matlab/Simulink", "PVsyst", "Proteus"]
      },
      "Ingénierie Financière et Audit": {
        "Analyse": ["Finance d'entreprise", "Finance de marché", "Audit financier", "Banque"],
        "Gestion des Risques": ["Gestion de portefeuille", "Actuariat", "FinTech"],
        "Data": ["Économétrie", "Modélisation de données financières", "Programmation SAS/R"]
      }
    },
    "Modules Transversaux (Communs à tous)": {
      "Tronc Commun": {
        "Stages et Projets": ["Stage technique (3A)", "Stage ingénieur (4A)", "Projet de Fin d'Études - PFE (5A)"],
        "Certifications": ["Partenariats Cisco (CCNA)", "Siemens", "Microsoft", "Oracle"],
        "Soft Skills": ["Leadership", "Prise de parole", "Management", "Entrepreneuriat"]
      }
    }
  };

  const renderUsers = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
      <div className="glass-panel">
        <h2 style={{ marginBottom: '1.5rem' }}>➕ Create New User</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>The email will be auto-generated based on the role. Default password is <strong>password123</strong>.</p>
        
        {userCreationStatus && (
          <div style={{ padding: '0.875rem', background: userCreationStatus.includes('successfully') ? 'rgba(37,99,235,0.1)' : 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-md)', border: `1px solid ${userCreationStatus.includes('successfully') ? 'rgba(37,99,235,0.3)' : 'rgba(239,68,68,0.3)'}`, marginBottom: '1.5rem', color: userCreationStatus.includes('successfully') ? 'var(--primary)' : 'var(--danger)' }}>
            {userCreationStatus}
          </div>
        )}

        <form onSubmit={handleCreateUser}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="input-group">
              <label className="input-label">First Name</label>
              <input type="text" className="input-field" value={newUser.first_name} onChange={e => setNewUser({...newUser, first_name: e.target.value})} required />
            </div>
            <div className="input-group">
              <label className="input-label">Last Name</label>
              <input type="text" className="input-field" value={newUser.last_name} onChange={e => setNewUser({...newUser, last_name: e.target.value})} required />
            </div>
            <div className="input-group">
              <label className="input-label">Role</label>
              <select className="input-field" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                <option value="student">Student (@emsi-edu.ma)</option>
                <option value="teacher">Teacher (@emsi-prof.ma)</option>
                <option value="admin">Admin (@emsi.ma)</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Gender</label>
              <select className="input-field" value={newUser.gender} onChange={e => setNewUser({...newUser, gender: e.target.value})}>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
            {newUser.role === 'student' && (
              <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div className="input-group">
                  <label className="input-label">Sector</label>
                  <select className="input-field" value={newUser.sector} onChange={e => setNewUser({...newUser, sector: e.target.value})}>
                    <option value="IIR">Ingénierie Informatique et Réseaux</option>
                    <option value="GI">Ingénierie Industrielle</option>
                    <option value="GE">Ingénierie Électrique et Systèmes Intelligents</option>
                    <option value="GC">Ingénierie Civil</option>
                    <option value="GF">Ingénierie Financière</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Grade</label>
                  <select className="input-field" value={newUser.grade} onChange={e => setNewUser({...newUser, grade: parseInt(e.target.value)})}>
                    {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>{y} Year</option>)}
                  </select>
                </div>
                {(newUser.sector === 'IIR' && (newUser.grade === 4 || newUser.grade === 5)) && (
                  <div className="input-group">
                    <label className="input-label">Option / Spécialité</label>
                    <select className="input-field" value={newUser.subSector || 'IA'} onChange={e => setNewUser({...newUser, subSector: e.target.value})}>
                      <option value="IA">Intelligence Artificielle et sciences de données (IA)</option>
                      <option value="DD">Développement digital et SI (DD)</option>
                      <option value="CIR">Cybersecurité et infrastructures réseaux (CIR)</option>
                    </select>
                  </div>
                )}
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Derived Class</label>
                  <input type="text" className="input-field" value={deriveClass(newUser.sector, newUser.grade, newUser.subSector)} disabled style={{ background: 'var(--background)', color: 'var(--primary)', fontWeight: 600 }} />
                </div>
              </div>
            )}
          </div>
          
          <div style={{ padding: '1rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Email Preview:</p>
            <p style={{ fontWeight: 600 }}>
              {(newUser.first_name || 'first').toLowerCase().replace(/\s+/g, '')}.{(newUser.last_name || 'last').toLowerCase().replace(/\s+/g, '')}
              {newUser.role === 'admin' ? '@emsi.ma' : newUser.role === 'teacher' ? '@emsi-prof.ma' : '@emsi-edu.ma'}
            </p>
          </div>

          <button type="submit" className="btn btn-primary">Create User</button>
        </form>
      </div>

      <div className="glass-panel">
        <h2 style={{ marginBottom: '1.5rem' }}>📚 Assign Modules to Professors</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="input-group">
            <label className="input-label">Select Professor</label>
            <select className="input-field" value={selectedTeacherForModules} onChange={e => setSelectedTeacherForModules(e.target.value)}>
              <option value="">-- Select a Professor --</option>
              {students.filter(s => s.role === 'teacher').map(t => (
                <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedTeacherForModules && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>1. Select Modules</h3>
              <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '1rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                {Object.entries(EMSI_MODULES).map(([mainCategory, sectors]) => (
                  <div key={mainCategory} style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ color: 'var(--primary)', marginBottom: '0.75rem', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', fontSize: '1rem' }}>{mainCategory}</h3>
                    {Object.entries(sectors).map(([sector, options]) => (
                      <div key={sector} style={{ marginBottom: '1rem', marginLeft: '0.5rem' }}>
                        <h4 style={{ color: 'var(--text-main)', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', background: 'var(--surface)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>{sector}</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginLeft: '0.5rem' }}>
                          {Object.entries(options).map(([option, modules]) => (
                            <div key={option}>
                              <h5 style={{ color: 'var(--secondary)', marginBottom: '0.25rem', fontSize: '0.85rem' }}>{option}</h5>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.25rem', marginLeft: '0.5rem' }}>
                                {modules.map(mod => {
                                  const modId = `${mod}`;
                                  return (
                                    <label key={modId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                                      <input 
                                        type="checkbox" 
                                        checked={teacherModules.includes(modId)}
                                        onChange={() => handleToggleModule(modId)}
                                      />
                                      {mod}
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>2. Select Classes</h3>
              <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '1rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                {Object.entries({
                  "Année Préparatoire (IIR, GI & GE)": ['1AP', '2AP'],
                  "1ère & 2ème Année (GC & GF)": ['1GC', '1GF', '2GC', '2GF'],
                  "3ème Année": ['3IIR', '3GI', '3GE', '3GC', '3GF'],
                  "4ème Année": ['4IA', '4DD', '4CIR', '4GI', '4GE', '4GC', '4GF'],
                  "5ème Année": ['5IA', '5DD', '5CIR', '5GI', '5GE', '5GC', '5GF']
                }).map(([level, bases]) => (
                  <div key={level} style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ color: 'var(--secondary)', marginBottom: '0.75rem', borderBottom: '2px solid var(--secondary)', paddingBottom: '0.5rem', fontSize: '1rem' }}>{level}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem' }}>
                      {bases.map(cls => (
                        <label key={cls} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                          <input 
                            type="checkbox" 
                            checked={teacherClasses.includes(cls)}
                            onChange={() => handleToggleClass(cls)}
                          />
                          {cls}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button className="btn btn-primary" onClick={handleSaveModules}>Save Assignments</button>
              {moduleSaveSuccess && <span style={{ color: 'var(--success)', fontWeight: 600 }}>✅ Successfully saved!</span>}
            </div>
          </div>
        )}
      </div>

      <div className="glass-panel">
        <h2 style={{ marginBottom: '1.5rem' }}>👥 User Directory</h2>
        <div className="table-container">
          <table>
            <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Assignments</th><th>Actions</th></tr></thead>
            <tbody>
              {students.map(s => {
                let assignStr = 'N/A';
                if (s.role === 'teacher' && s.teacher_profile) {
                  let mCount = 0;
                  let cCount = 0;
                  try { mCount = Array.isArray(JSON.parse(s.teacher_profile.matiere)) ? JSON.parse(s.teacher_profile.matiere).length : 0; } catch {}
                  try { cCount = Array.isArray(JSON.parse(s.teacher_profile.classes)) ? JSON.parse(s.teacher_profile.classes).length : 0; } catch {}
                  assignStr = `${mCount} Module(s), ${cCount} Class(es)`;
                }
                return (
                  <tr key={s.id}>
                    <td>{s.matricule}</td>
                    <td>{s.first_name} {s.last_name}</td>
                    <td>{s.email}</td>
                    <td><span style={{ padding: '0.2rem 0.5rem', background: 'var(--surface-hover)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', textTransform: 'capitalize' }}>{s.role}</span></td>
                    <td><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.role === 'teacher' ? assignStr : s.role === 'student' ? s.student_profile?.filiere : 'Admin'}</span></td>
                    <td><button className="btn btn-danger" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleDeleteStudent(s.id)}>Delete</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCourses = () => (
    <div className="glass-panel">
      <h2 style={{ marginBottom: '1rem' }}>📘 Manage Courses</h2>
      <form onSubmit={handleCreateCourse} style={{ marginBottom: '1.5rem' }}>
        <div className="input-group">
          <label className="input-label">Course Name</label>
          <input type="text" className="input-field" value={newCourse.name} onChange={e => setNewCourse({ ...newCourse, name: e.target.value })} required />
        </div>
        <div className="input-group">
          <label className="input-label">Course Code</label>
          <input type="text" className="input-field" value={newCourse.code} onChange={e => setNewCourse({ ...newCourse, code: e.target.value })} />
        </div>
        <button type="submit" className="btn btn-primary">Create Course</button>
      </form>
      {courses.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No courses have been created yet.</p>
      ) : (
        <div className="table-container">
          <table>
            <thead><tr><th>Name</th><th>Code</th></tr></thead>
            <tbody>
              {courses.map(course => (
                <tr key={course.id}>
                  <td>{course.name}</td>
                  <td>{course.code || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderValidations = () => (
    <div className="grid-cards">
      <div className="glass-panel">
        <h2 style={{ marginBottom: '1.5rem' }}>📋 Absence Justifications</h2>
        {absences.filter(a => a.justification_status === 'Pending' && a.justification_text).map(a => (
          <div key={a.id} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
            <p><strong>Student:</strong> {a.student_details?.first_name} {a.student_details?.last_name}</p>
            <p><strong>Date:</strong> {a.date_seance} | <strong>Subject:</strong> {a.subject}</p>
            <p style={{ margin: '0.5rem 0', padding: '0.5rem', background: 'var(--background)', borderRadius: 'var(--radius-sm)' }}>"{a.justification_text}"</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-success" style={{ padding: '0.3rem 0.6rem' }} onClick={() => handleValidation('absence', a.id, 'Validated')}>Approve</button>
              <button className="btn btn-danger" style={{ padding: '0.3rem 0.6rem' }} onClick={() => handleValidation('absence', a.id, 'Rejected')}>Reject</button>
            </div>
          </div>
        ))}
      </div>
      <div className="glass-panel">
        <h2 style={{ marginBottom: '1.5rem' }}>📄 Document Requests</h2>
        {documentRequests.filter(r => r.status === 'Pending').map(req => (
          <div key={req.id} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
            <p><strong>Student:</strong> {req.student_details?.first_name} {req.student_details?.last_name}</p>
            <p><strong>Document:</strong> {req.document_type === 'Scolarite' ? 'Attestation de Scolarité' : 'Attestation de Réussite'}</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button className="btn btn-success" style={{ padding: '0.3rem 0.6rem' }} onClick={() => handleValidation('document', req.id, 'Validated')}>Approve</button>
              <button className="btn btn-danger" style={{ padding: '0.3rem 0.6rem' }} onClick={() => handleValidation('document', req.id, 'Rejected')}>Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  switch (activeTab) {
    case 'calendar': return renderCalendar();
    case 'notifications': return renderNotifications();
    case 'courses': return renderCourses();
    case 'users': return renderUsers();
    case 'validations': return renderValidations();
    default: return renderOverview();
  }
}

export default AdminDashboard;

