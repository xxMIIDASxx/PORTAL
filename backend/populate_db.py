import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'emsight_backend.settings')
django.setup()

from accounts.models import CustomUser, StudentProfile, TeacherProfile, AdminProfile
from portal.models import CalendarEvent, Notification, ReportCard, Grade, Absence, DocumentRequest
from django.utils import timezone
from datetime import timedelta

# Clear old data
CustomUser.objects.all().delete()
CalendarEvent.objects.all().delete()
Notification.objects.all().delete()
Absence.objects.all().delete()
ReportCard.objects.all().delete()
DocumentRequest.objects.all().delete()

# Create Users — last names UPPERCASE, correct email formats, gender added
student = CustomUser.objects.create_user(
    username='student_nizar',
    email='nizar.elidrysy@emsi-edu.ma',
    password='password123',
    first_name='Nizar',
    last_name='EL IDRYSY',
    role='student',
    matricule='S-20221234',
    gender='M'
)

teacher = CustomUser.objects.create_user(
    username='teacher_hajar',
    email='hajar.chabli@emsi-prof.ma',
    password='password123',
    first_name='Hajar',
    last_name='CHABLI',
    role='teacher',
    matricule='T-2020-654321',
    gender='F'
)
TeacherProfile.objects.create(user=teacher, departement='Informatique', matiere='Développement Web')

# Link Nizar to Hajar as tutor
StudentProfile.objects.create(
    user=student,
    filiere='Ingénierie Informatique',
    annee_etude=4,
    numero_etudiant='E123456',
    tutor_name='Hajar CHABLI'   # matches the actual teacher
)

admin = CustomUser.objects.create_user(
    username='admin_main',
    email='admin@emsi.ma',
    password='admin123',
    first_name='Super',
    last_name='Admin',
    role='admin',
    matricule='D-2018-987654',
    gender='M'
)
AdminProfile.objects.create(user=admin, service='Scolarité')

# Add more users to test gender-suit avatars and matching tutors
student2 = CustomUser.objects.create_user(
    username='student_hajar2',
    email='hajar.benani@emsi-edu.ma',
    password='password123',
    first_name='Hajar',
    last_name='BENANI',
    role='student',
    matricule='S-20230000',
    gender='F'
)
StudentProfile.objects.create(
    user=student2,
    filiere='Ingénierie Informatique',
    annee_etude=3,
    numero_etudiant='E222333',
    tutor_name='Amjad AHRRAR' # Hack: using admin name as tutor for variety, but usually it's teachers. 
    # Let's add another teacher.
)

teacher2 = CustomUser.objects.create_user(
    username='teacher_amjad',
    email='amjad.alami@emsi-prof.ma',
    password='password123',
    first_name='Amjad',
    last_name='ALAMI',
    role='teacher',
    matricule='T-2021-999888',
    gender='M'
)
TeacherProfile.objects.create(user=teacher2, departement='Informatique', matiere='Base de Données')

# Calendar Events
now = timezone.now()
e1 = CalendarEvent.objects.create(title='Cours de Dev Web', description='React et Django REST Framework - Chapitre 4', start_time=now + timedelta(days=1, hours=10), end_time=now + timedelta(days=1, hours=12), event_type='Cours', created_by=teacher)
e2 = CalendarEvent.objects.create(title='Examen Final - Algorithmique', description='Salle 102 - Révision requise', start_time=now + timedelta(days=5, hours=9), end_time=now + timedelta(days=5, hours=11), event_type='Examen', created_by=teacher)
e3 = CalendarEvent.objects.create(title='TD Base de Données', description='TP 3 - Optimisation des requêtes', start_time=now + timedelta(days=3, hours=14), end_time=now + timedelta(days=3, hours=16), event_type='TD', created_by=teacher)
e4 = CalendarEvent.objects.create(title='Conférence Innovation IA', description='Amphithéâtre A - Intervenants externes', start_time=now + timedelta(days=7, hours=10), end_time=now + timedelta(days=7, hours=13), event_type='Cours', created_by=admin)

# Notifications
notif1 = Notification.objects.create(title='Rappel de Cours', content='Le cours de Dev Web est maintenu demain en salle 301. Préparez vos questions!', type_notif='Info', sender=teacher)
notif1.recipients.add(student)

notif2 = Notification.objects.create(title='Frais de scolarité', content='Veuillez régler la dernière tranche avant la fin du mois. Pour tout renseignement, contactez la scolarité.', type_notif='Urgent', sender=admin)
notif2.recipients.add(student)

notif3 = Notification.objects.create(title='Résultats Examen S1', content='Les résultats du semestre 1 sont maintenant disponibles dans votre espace portail.', type_notif='Info', sender=admin)
notif3.recipients.add(student)

# Report Cards — multiple years
report_2526_s1 = ReportCard.objects.create(student=student, academic_year='2025-2026', semester='S1', general_average=15.5)
Grade.objects.create(report_card=report_2526_s1, subject='Algorithmique', evaluation_type='Examen', value=16)
Grade.objects.create(report_card=report_2526_s1, subject='Base de données', evaluation_type='Controle', value=14)
Grade.objects.create(report_card=report_2526_s1, subject='Réseaux', evaluation_type='Examen', value=9, is_rattrapage=True)
Grade.objects.create(report_card=report_2526_s1, subject='Développement Web', evaluation_type='Controle', value=18)
Grade.objects.create(report_card=report_2526_s1, subject="Systèmes d'Exploitation", evaluation_type='Examen', value=12)

report_2425_s1 = ReportCard.objects.create(student=student, academic_year='2024-2025', semester='S1', general_average=13.8)
Grade.objects.create(report_card=report_2425_s1, subject='Mathématiques', evaluation_type='Examen', value=13)
Grade.objects.create(report_card=report_2425_s1, subject='Physique', evaluation_type='Examen', value=10)
Grade.objects.create(report_card=report_2425_s1, subject='Programmation C', evaluation_type='Controle', value=17)
Grade.objects.create(report_card=report_2425_s1, subject='Architecture', evaluation_type='Examen', value=11)

report_2425_s2 = ReportCard.objects.create(student=student, academic_year='2024-2025', semester='S2', general_average=14.2)
Grade.objects.create(report_card=report_2425_s2, subject='Algo Avancé', evaluation_type='Examen', value=15)
Grade.objects.create(report_card=report_2425_s2, subject='POO Java', evaluation_type='Controle', value=14)
Grade.objects.create(report_card=report_2425_s2, subject='Systèmes', evaluation_type='Examen', value=12)
Grade.objects.create(report_card=report_2425_s2, subject='Réseaux I', evaluation_type='Controle', value=16)

# Absences
Absence.objects.create(student=student, teacher=teacher, subject='Développement Web', date_seance=now.date() - timedelta(days=2), is_present=False, justification_status='Pending')
Absence.objects.create(student=student, teacher=teacher, subject='Développement Web', date_seance=now.date() - timedelta(days=7), is_present=False, justification_text='Certificat médical', justification_status='Validated')

# Document Requests
DocumentRequest.objects.create(student=student, document_type='Scolarite', status='Pending')

print("✅ Database successfully populated with demo data!")
