from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL

class CalendarEvent(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    event_type = models.CharField(max_length=100)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_events')
    professor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_events', limit_choices_to={'role': 'teacher'})
    target_classes = models.CharField(max_length=200, blank=True, null=True, default='All Classes', help_text="Comma separated list of classes, e.g. '1A_IIR, 2A_IIR' or 'All Classes'")

    def __str__(self):
        return self.title

class Notification(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    date_envoi = models.DateTimeField(auto_now_add=True)
    type_notif = models.CharField(max_length=50)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_notifications')
    recipients = models.ManyToManyField(User, related_name='received_notifications')

    def __str__(self):
        return self.title

class ReportCard(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='report_cards')
    academic_year = models.CharField(max_length=20)
    semester = models.CharField(max_length=20)
    general_average = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"{self.student.username} - {self.academic_year} {self.semester}"

class Grade(models.Model):
    report_card = models.ForeignKey(ReportCard, on_delete=models.CASCADE, related_name='grades')
    subject = models.CharField(max_length=100)
    evaluation_type = models.CharField(max_length=50)
    value = models.FloatField()
    is_rattrapage = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.subject}: {self.value}"

class Absence(models.Model):
    STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('Validated', 'Validated'),
        ('Rejected', 'Rejected'),
    )
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='absences')
    teacher = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='marked_absences')
    subject = models.CharField(max_length=100)
    date_seance = models.DateField()
    is_present = models.BooleanField(default=True)
    justification_text = models.TextField(blank=True, null=True)
    justification_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')

    def __str__(self):
        return f"{self.student.username} - {self.subject} ({'Present' if self.is_present else 'Absent'})"

class DocumentRequest(models.Model):
    DOC_TYPES = (
        ('Scolarite', 'Attestation de Scolarité'),
        ('Reussite', 'Attestation de Réussite'),
    )
    STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('Validated', 'Validated'),
        ('Rejected', 'Rejected'),
    )
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='document_requests')
    document_type = models.CharField(max_length=50, choices=DOC_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.username} - {self.document_type} ({self.status})"

class ClassSchedule(models.Model):
    target_class = models.CharField(max_length=50, unique=True)
    schedule_data = models.JSONField(default=list)

    def __str__(self):
        return f"Schedule for {self.target_class}"


class Course(models.Model):
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=50, blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_courses')

    def __str__(self):
        return self.name


class Session(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='sessions')
    teacher = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='sessions', limit_choices_to={'role': 'teacher'})
    target_class = models.CharField(max_length=200, blank=True, null=True, default='All Classes')
    date = models.DateField()
    start_time = models.TimeField(blank=True, null=True)
    end_time = models.TimeField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_sessions')

    def __str__(self):
        return f"{self.course.name} on {self.date}"


class Attendance(models.Model):
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='attendances')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attendances')
    present = models.BooleanField(default=False)

    class Meta:
        unique_together = ('session', 'student')

    def __str__(self):
        status = 'Present' if self.present else 'Absent'
        return f"{self.student.username} - {status} for {self.session}"
