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

    def recalculate_average(self):
        from collections import defaultdict
        
        grades = self.grades.all()
        if not grades.exists():
            self.general_average = None
            self.save(update_fields=['general_average'])
            return

        # Group grades by subject
        subject_grades = defaultdict(list)
        for g in grades:
            subject_grades[g.subject].append(g)

        subject_averages = []
        for subject, g_list in subject_grades.items():
            cc_vals = []
            exam_vals = []
            other_vals = []
            
            for g in g_list:
                eval_lower = g.evaluation_type.lower()
                if 'cc' in eval_lower or 'controle' in eval_lower or 'contrôle' in eval_lower:
                    cc_vals.append(g.value)
                elif 'examen' in eval_lower or 'ef' in eval_lower or 'exam' in eval_lower or 'final' in eval_lower:
                    exam_vals.append(g.value)
                else:
                    other_vals.append(g.value)
            
            if cc_vals and exam_vals:
                cc_avg = sum(cc_vals) / len(cc_vals)
                exam_avg = sum(exam_vals) / len(exam_vals)
                sub_avg = cc_avg * 0.3 + exam_avg * 0.7
            elif cc_vals:
                sub_avg = sum(cc_vals) / len(cc_vals)
            elif exam_vals:
                sub_avg = sum(exam_vals) / len(exam_vals)
            elif other_vals:
                sub_avg = sum(other_vals) / len(other_vals)
            else:
                continue
                
            subject_averages.append(sub_avg)
            
        if subject_averages:
            self.general_average = round(sum(subject_averages) / len(subject_averages), 2)
        else:
            self.general_average = 0.0
            
        self.save(update_fields=['general_average'])

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
    teacher = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_courses', limit_choices_to={'role': 'teacher'})

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


from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

@receiver(post_save, sender=Grade)
def update_report_card_average_on_save(sender, instance, **kwargs):
    if instance.report_card:
        instance.report_card.recalculate_average()

@receiver(post_delete, sender=Grade)
def update_report_card_average_on_delete(sender, instance, **kwargs):
    if instance.report_card:
        instance.report_card.recalculate_average()
