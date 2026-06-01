import React, { useState, useEffect } from 'react';
import api from '../api';
import { useLanguage } from '../context/LanguageContext';
import { Users, Calendar as CalendarIcon, Bell, UserCheck, FileArchive, ShieldAlert, GraduationCap, LayoutDashboard, CheckCircle, XCircle, FileText, Trash2, Send, Plus, BookOpen, UserPlus } from 'lucide-react';

function AdminDashboard({ activeTab, demoUser }) {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [documentRequests, setDocumentRequests] = useState([]);
  const [students, setStudents] = useState([]);
  const [calendar, setCalendar] = useState([]);
  const [courses, setCourses] = useState([]);

  // Calendar form
  const [newEvent, setNewEvent] = useState({ title: '', description: '', start_time: '', end_time: '', event_type: 'Cours', target_classes: 'All Classes' });
  const [eventSuccess, setEventSuccess] = useState(false);

  // Notification form
  const [newNotif, setNewNotif] = useState({ title: '', content: '' });
  const [notifSuccess, setNotifSuccess] = useState(false);

  // Course form
  const [newCourse, setNewCourse] = useState({ name: '', code: '', teacher: '' });
  const [courseSuccess, setCourseSuccess] = useState(false);

  // Create user form
  const [newUser, setNewUser] = useState({ first_name: '', last_name: '', role: 'student', gender: 'M', sector: 'IIR', grade: 1, subSector: 'IA', departement: '', matiere: '', classes: '', service: '', tutor_name: '' });
  const [createUserSuccess, setCreateUserSuccess] = useState('');
  const [createUserError, setCreateUserError] = useState('');

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

  const deriveClass = (sector, grade, subSector) => {
    if ((grade === 1 || grade === 2) && (sector === 'IIR' || sector === 'GI' || sector === 'GE' || sector === 'GC' || sector === 'GF')) {
      return `${grade}AP`;
    }
    if ((grade === 4 || grade === 5) && sector === 'IIR') {
      return `${grade}${subSector || 'IA'}`;
    }
    return `${grade}${sector}`;
  };

  const fetchData = () => {
    api.get('/portal/notifications/').then(res => setNotifications(res.data));
    api.get('/portal/absences/').then(res => setAbsences(res.data));
    api.get('/portal/document-requests/').then(res => setDocumentRequests(res.data));
    api.get('/accounts/users/').then(res => setStudents(res.data));
    api.get('/portal/calendar/').then(res => setCalendar(res.data));
    api.get('/portal/courses/').then(res => setCourses(res.data));
  };

  const handleValidation = (type, id, status) => {
    const endpoint = type === 'absence' ? `/portal/absences/${id}/` : `/portal/document-requests/${id}/`;
    const payload = type === 'absence' ? { justification_status: status } : { status };
    api.patch(endpoint, payload).then(() => fetchData());
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
    }).catch(err => console.error('Error adding event:', err));
  };

  const handleDeleteEvent = (id) => {
    if (window.confirm('Delete this event?')) {
      api.delete(`/portal/calendar/${id}/`).then(() => fetchData());
    }
  };

  const handleSendNotif = (e) => {
    e.preventDefault();
    if (!demoUser) return;
    const recipientIds = students.map(s => s.id);
    if (recipientIds.length === 0) return;

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
    }).catch(err => console.error('Error sending notification:', err));
  };

  const handleAddCourse = (e) => {
    e.preventDefault();
    api.post('/portal/courses/', {
      ...newCourse,
      teacher: newCourse.teacher || null,
      created_by: demoUser?.id
    }).then(() => {
      setNewCourse({ name: '', code: '', teacher: '' });
      setCourseSuccess(true);
      setTimeout(() => setCourseSuccess(false), 3000);
      fetchData();
    }).catch(err => console.error('Error adding course:', err));
  };

  const handleDeleteCourse = (id) => {
    if (window.confirm('Delete this course?')) {
      api.delete(`/portal/courses/${id}/`).then(() => fetchData());
    }
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

  /* ─────────── OVERVIEW ─────────── */
  const renderOverview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            width: '120px', height: '120px', borderRadius: '50%',
            background: 'var(--gradient-primary)', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '3px solid var(--border)', flexShrink: 0, boxShadow: 'var(--shadow-md)'
          }}>
            {demoUser?.profile_picture ? (
              <img src={demoUser.profile_picture.startsWith('http') ? demoUser.profile_picture : `http://127.0.0.1:8000${demoUser.profile_picture}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white' }}>
                {((demoUser?.first_name?.[0] || '') + (demoUser?.last_name?.[0] || '')).toUpperCase()}
              </span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <div style={{ marginBottom: '1.15rem' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.3rem', lineHeight: 1.2 }}>
                {demoUser ? `${demoUser.first_name} ${demoUser.last_name}` : 'Admin Control Center'}
              </h2>
              <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                <span className="badge badge-info" style={{ background: 'var(--primary)', color: 'white', border: 'none' }}>{t('admin')}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{demoUser?.email}</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
              {[
                { label: t('matricule'), value: demoUser?.matricule },
                { label: t('department'), value: demoUser?.admin_profile?.service || 'Administration' },
                { label: t('history'), value: t('full_control') },
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
          <div className="stat-info"><h3>{t('users')}</h3><p>{students.length}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}><CalendarIcon size={22} /></div>
          <div className="stat-info"><h3>{t('events_count')}</h3><p>{calendar.length}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}><FileText size={22} /></div>
          <div className="stat-info"><h3>{t('approval_queue')}</h3><p>{documentRequests.filter(r => r.status === 'Pending').length}</p></div>
        </div>
      </div>
    </div>
  );

  /* ─────────── CALENDAR CONTROL ─────────── */
  const renderCalendar = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Add event form */}
      <div className="glass-panel">
        <h2 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '1.35rem', fontWeight: 800 }}>
          <Plus size={22} className="text-primary" /> {t('add_event')}
        </h2>
        {eventSuccess && <div style={{ color: 'var(--success)', fontWeight: 700, marginBottom: '1rem', fontSize: '0.88rem' }}>{t('add_event')} ✓</div>}
        <form onSubmit={handleAddEvent}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">{t('event_title')}</label>
              <input type="text" className="input-field" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} required />
            </div>
            <div className="input-group">
              <label className="input-label">{t('event_type')}</label>
              <select className="input-field" value={newEvent.event_type} onChange={e => setNewEvent({ ...newEvent, event_type: e.target.value })}>
                <option value="Cours">Cours</option>
                <option value="Examen">Examen</option>
                <option value="Reunion">Reunion</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">{t('event_date')} ({t('event_title')} start)</label>
              <input type="datetime-local" className="input-field" value={newEvent.start_time} onChange={e => setNewEvent({ ...newEvent, start_time: e.target.value })} required />
            </div>
            <div className="input-group">
              <label className="input-label">{t('event_date')} (end)</label>
              <input type="datetime-local" className="input-field" value={newEvent.end_time} onChange={e => setNewEvent({ ...newEvent, end_time: e.target.value })} required />
            </div>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">{t('event_classes')}</label>
              <input type="text" className="input-field" placeholder="All Classes" value={newEvent.target_classes} onChange={e => setNewEvent({ ...newEvent, target_classes: e.target.value })} />
            </div>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">{t('event_description')}</label>
              <textarea className="input-field" rows={3} value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '0.75rem' }}>
            <Plus size={16} /> {t('add_event')}
          </button>
        </form>
      </div>

      {/* Events list */}
      <div className="glass-panel">
        <h2 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '1.35rem', fontWeight: 800 }}>
          <CalendarIcon size={22} className="text-primary" /> {t('calendar_control')}
        </h2>
        {calendar.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>{t('no_events')}</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>{t('event_title')}</th><th>{t('event_type')}</th><th>{t('event_date')}</th><th>{t('event_classes')}</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {calendar.map(ev => (
                  <tr key={ev.id}>
                    <td style={{ fontWeight: 600 }}>{ev.title}</td>
                    <td><span className="badge badge-info">{ev.event_type}</span></td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(ev.start_time).toLocaleString()}</td>
                    <td style={{ fontSize: '0.85rem' }}>{ev.target_classes}</td>
                    <td>
                      <button
                        onClick={() => handleDeleteEvent(ev.id)}
                        style={{ background: 'var(--danger-light)', border: '1px solid var(--danger-border)', padding: '0.35rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="glass-panel" style={{ marginTop: '1rem', background: 'var(--surface)' }}>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--secondary)' }}>Weekly Timetable Management</h2>
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
              <button className="btn btn-primary" onClick={handleSaveTimetable}>Save Timetable for {selectedClassForTimetable}</button>
              {timetableSuccess && <span style={{ color: 'var(--success)', fontWeight: 600 }}>Timetable saved successfully!</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  /* ─────────── BROADCAST ─────────── */
  const renderNotifications = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Send form */}
      <div className="glass-panel">
        <h2 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '1.35rem', fontWeight: 800 }}>
          <Send size={22} className="text-primary" /> {t('send_notification')}
        </h2>
        {notifSuccess && <div style={{ color: 'var(--success)', fontWeight: 700, marginBottom: '1rem', fontSize: '0.88rem' }}>{t('notif_sent_success')}</div>}
        <form onSubmit={handleSendNotif}>
          <div className="input-group">
            <label className="input-label">{t('notif_title')}</label>
            <input type="text" className="input-field" value={newNotif.title} onChange={e => setNewNotif({ ...newNotif, title: e.target.value })} required />
          </div>
          <div className="input-group">
            <label className="input-label">{t('notif_content')}</label>
            <textarea className="input-field" rows={4} value={newNotif.content} onChange={e => setNewNotif({ ...newNotif, content: e.target.value })} required />
          </div>
          <button type="submit" className="btn btn-primary">
            <Send size={16} /> {t('send')}
          </button>
        </form>
      </div>

      {/* History */}
      <div className="glass-panel">
        <h2 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '1.35rem', fontWeight: 800 }}>
          <Bell size={22} className="text-primary" /> {t('history')}
        </h2>
        {notifications.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>{t('no_notifications')}</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>{t('notif_title')}</th><th>{t('notif_content')}</th><th>{t('notif_date')}</th></tr>
              </thead>
              <tbody>
                {notifications.map(n => (
                  <tr key={n.id}>
                    <td style={{ fontWeight: 600 }}>{n.title}</td>
                    <td style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.content}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(n.date_envoi).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  /* ─────────── DIRECTORY ─────────── */
  const renderUsers = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="glass-panel" style={{ marginTop: '1.5rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Assign Modules to Professors</h2>
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
              {moduleSaveSuccess && <span style={{ color: 'var(--success)', fontWeight: 600 }}>Successfully saved!</span>}
            </div>
          </div>
        )}
      </div>

      <div className="glass-panel">
        <h2 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '1.35rem', fontWeight: 800 }}>
          <Users size={22} className="text-primary" /> {t('directory')}
        </h2>
        <div className="table-container">
          <table>
            <thead>
              <tr><th>{t('matricule')}</th><th>{t('student_name')}</th><th>Email</th><th>Role</th><th>Assignments</th></tr>
            </thead>
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
                    <td><span className="badge badge-info">{t(s.role)}</span></td>
                    <td><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.role === 'teacher' ? assignStr : s.role === 'student' ? s.student_profile?.filiere : 'Admin'}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  /* ─────────── ACADEMIC MASTER (Courses) ─────────── */
  const renderCourses = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Add course form */}
      <div className="glass-panel">
        <h2 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '1.35rem', fontWeight: 800 }}>
          <Plus size={22} className="text-primary" /> {t('add_course')}
        </h2>
        {courseSuccess && <div style={{ color: 'var(--success)', fontWeight: 700, marginBottom: '1rem', fontSize: '0.88rem' }}>{t('course_added')}</div>}
        <form onSubmit={handleAddCourse}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">{t('course_name')}</label>
              <input type="text" className="input-field" value={newCourse.name} onChange={e => setNewCourse({ ...newCourse, name: e.target.value })} required />
            </div>
            <div className="input-group">
              <label className="input-label">{t('course_code')}</label>
              <input type="text" className="input-field" value={newCourse.code} onChange={e => setNewCourse({ ...newCourse, code: e.target.value })} />
            </div>
            <div className="input-group">
              <label className="input-label">{t('assigned_teacher') || 'Assign Teacher'}</label>
              <select className="input-field" value={newCourse.teacher} onChange={e => setNewCourse({ ...newCourse, teacher: e.target.value })}>
                <option value="">-- None --</option>
                {students.filter(s => s.role === 'teacher').map(t => (
                  <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '0.75rem' }}>
            <Plus size={16} /> {t('add_course')}
          </button>
        </form>
      </div>

      {/* Courses list */}
      <div className="glass-panel">
        <h2 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '1.35rem', fontWeight: 800 }}>
          <BookOpen size={22} className="text-primary" /> {t('academic_master')}
        </h2>
        {courses.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>{t('no_courses')}</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>{t('course_name')}</th><th>{t('course_code')}</th><th>{t('assigned_teacher') || 'Teacher'}</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {courses.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td><span className="badge badge-info">{c.code || '—'}</span></td>
                    <td>{c.teacher_name || <span className="text-muted" style={{ opacity: 0.6 }}>Unassigned</span>}</td>
                    <td>
                      <button
                        onClick={() => handleDeleteCourse(c.id)}
                        style={{ background: 'var(--danger-light)', border: '1px solid var(--danger-border)', padding: '0.35rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  /* ─────────── APPROVAL QUEUE ─────────── */
  const renderValidations = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass-panel">
        <h2 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '1.35rem', fontWeight: 800 }}>
          <FileText size={22} className="text-primary" /> {t('documents')}
        </h2>
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Student</th><th>Type</th><th>{t('status')}</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {documentRequests.map(req => (
                <tr key={req.id}>
                  <td>{req.student_details?.first_name} {req.student_details?.last_name}</td>
                  <td>{req.document_type}</td>
                  <td><span className={`badge ${req.status === 'Validated' ? 'badge-success' : req.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>{req.status}</span></td>
                  <td>
                    {req.status === 'Pending' && (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn btn-success" style={{ padding: '0.3rem 0.65rem', minWidth: 'auto', fontSize: '0.82rem' }} onClick={() => handleValidation('doc', req.id, 'Validated')}><CheckCircle size={14} /></button>
                        <button className="btn btn-danger" style={{ padding: '0.3rem 0.65rem', minWidth: 'auto', fontSize: '0.82rem' }} onClick={() => handleValidation('doc', req.id, 'Rejected')}><XCircle size={14} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-panel">
        <h2 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '1.35rem', fontWeight: 800 }}>
          <ShieldAlert size={22} className="text-primary" /> Absence Justifications
        </h2>
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Student</th><th>Date / Subject</th><th>Justification</th><th>{t('status')}</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {absences.filter(a => a.justification_text).map(a => (
                <tr key={a.id}>
                  <td>{a.student_details?.first_name} {a.student_details?.last_name}</td>
                  <td>{a.date_seance} - {a.subject}</td>
                  <td style={{ maxWidth: '250px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.88rem' }}>{a.justification_text}</td>
                  <td><span className={`badge ${a.justification_status === 'Validated' ? 'badge-success' : a.justification_status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>{a.justification_status}</span></td>
                  <td>
                    {a.justification_status === 'Pending' && (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn btn-success" style={{ padding: '0.3rem 0.65rem', minWidth: 'auto', fontSize: '0.82rem' }} onClick={() => handleValidation('absence', a.id, 'Validated')}><CheckCircle size={14} /></button>
                        <button className="btn btn-danger" style={{ padding: '0.3rem 0.65rem', minWidth: 'auto', fontSize: '0.82rem' }} onClick={() => handleValidation('absence', a.id, 'Rejected')}><XCircle size={14} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {absences.filter(a => a.justification_text).length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No absence justifications pending.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateUserError('');
    setCreateUserSuccess('');

    const payload = {
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      role: newUser.role,
      gender: newUser.gender,
    };

    if (newUser.role === 'student') {
      payload.filiere = deriveClass(newUser.sector, newUser.grade, newUser.subSector);
      payload.annee_etude = newUser.grade;
      payload.tutor_name = newUser.tutor_name;
    } else if (newUser.role === 'teacher') {
      payload.departement = newUser.departement || 'General';
      payload.matiere = newUser.matiere ? newUser.matiere.split(',').map(s => s.trim()).filter(Boolean) : [];
      payload.classes = newUser.classes ? newUser.classes.split(',').map(s => s.trim()).filter(Boolean) : [];
    } else if (newUser.role === 'admin') {
      payload.service = newUser.service || 'General';
    }

    try {
      const res = await api.post('/accounts/users/create_user/', payload);
      setCreateUserSuccess(`${t('user_created')} (${res.data.email})`);
      setNewUser({ first_name: '', last_name: '', role: 'student', gender: 'M', filiere: '', annee_etude: 1, departement: '', matiere: '', classes: '', service: '', tutor_name: '' });
      fetchData();
    } catch (err) {
      setCreateUserError(err.response?.data?.error || 'Error creating user');
    }
  };

  /* ─────────── CREATE USER ─────────── */
  const renderCreateUser = () => (
    <div className="glass-panel">
      <h2 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '1.35rem', fontWeight: 800 }}>
        <UserPlus size={22} className="text-primary" /> {t('create_user')}
      </h2>

      {createUserSuccess && (
        <div style={{ background: 'var(--success-light)', border: '1px solid var(--success-border)', color: 'var(--success)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.88rem', fontWeight: 600 }}>
          {createUserSuccess}
        </div>
      )}
      {createUserError && (
        <div style={{ background: 'var(--danger-light)', border: '1px solid var(--danger-border)', color: 'var(--danger)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.88rem', fontWeight: 600 }}>
          {createUserError}
        </div>
      )}

      <div style={{ background: 'var(--primary-light)', border: '1px solid var(--primary-border)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600 }}>
        {t('default_password_notice')}
      </div>

      <form onSubmit={handleCreateUser}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* First Name */}
          <div className="input-group">
            <label className="input-label">{t('first_name')}</label>
            <input type="text" className="input-field" value={newUser.first_name} onChange={e => setNewUser({ ...newUser, first_name: e.target.value })} required />
          </div>
          {/* Last Name */}
          <div className="input-group">
            <label className="input-label">{t('last_name')}</label>
            <input type="text" className="input-field" value={newUser.last_name} onChange={e => setNewUser({ ...newUser, last_name: e.target.value })} required />
          </div>
          {/* Role */}
          <div className="input-group">
            <label className="input-label">{t('role')}</label>
            <select className="input-field" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
              <option value="student">{t('student')}</option>
              <option value="teacher">{t('teacher')}</option>
              <option value="admin">{t('admin')}</option>
            </select>
          </div>
          {/* Gender */}
          <div className="input-group">
            <label className="input-label">{t('gender_label')}</label>
            <select className="input-field" value={newUser.gender} onChange={e => setNewUser({ ...newUser, gender: e.target.value })}>
              <option value="M">{t('male')}</option>
              <option value="F">{t('female')}</option>
            </select>
          </div>
        </div>

        {/* ── Student-specific fields ── */}
        {newUser.role === 'student' && (
          <div style={{ marginTop: '1rem', padding: '1.25rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', gridColumn: '1 / -1' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>{t('student')} — {t('details')}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                <input type="text" className="input-field" value={deriveClass(newUser.sector, newUser.grade, newUser.subSector)} disabled style={{ background: 'var(--surface)', color: 'var(--primary)', fontWeight: 600 }} />
              </div>
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="input-label">Tutor (Optional)</label>
                <select className="input-field" value={newUser.tutor_name || ''} onChange={e => setNewUser({...newUser, tutor_name: e.target.value})}>
                  <option value="">-- Select Tutor --</option>
                  {students.filter(s => s.role === 'teacher').map(t => (
                    <option key={t.id} value={`${t.first_name} ${t.last_name}`}>{t.first_name} {t.last_name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── Teacher-specific fields ── */}
        {newUser.role === 'teacher' && (
          <div style={{ marginTop: '1rem', padding: '1.25rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>{t('teacher')} — {t('details')}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">{t('departement')}</label>
                <input type="text" className="input-field" placeholder="e.g. Informatique" value={newUser.departement} onChange={e => setNewUser({ ...newUser, departement: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">{t('modules')}</label>
                <input type="text" className="input-field" placeholder="e.g. Java, Python, DevOps" value={newUser.matiere} onChange={e => setNewUser({ ...newUser, matiere: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">{t('classes')}</label>
                <input type="text" className="input-field" placeholder="e.g. 3A_IIR, 2A_GC" value={newUser.classes} onChange={e => setNewUser({ ...newUser, classes: e.target.value })} />
              </div>
            </div>
          </div>
        )}

        {/* ── Admin-specific fields ── */}
        {newUser.role === 'admin' && (
          <div style={{ marginTop: '1rem', padding: '1.25rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>{t('admin')} — {t('details')}</p>
            <div className="input-group">
              <label className="input-label">{t('admin_service')}</label>
              <input type="text" className="input-field" placeholder="e.g. Scolarité" value={newUser.service} onChange={e => setNewUser({ ...newUser, service: e.target.value })} />
            </div>
          </div>
        )}

        <button type="submit" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
          <UserPlus size={16} /> {t('create')}
        </button>
      </form>
    </div>
  );

  /* ─────────── TAB ROUTER ─────────── */
  switch (activeTab) {
    case 'calendar': return renderCalendar();
    case 'notifications': return renderNotifications();
    case 'users': return renderUsers();
    case 'create_user': return renderCreateUser();
    case 'courses': return renderCourses();
    case 'validations': return renderValidations();
    default: return renderOverview();
  }
}

export default AdminDashboard;
