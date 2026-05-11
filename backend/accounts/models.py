from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('admin', 'Administration'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    matricule = models.CharField(max_length=20, blank=True, null=True, unique=True)
    gender = models.CharField(max_length=10, choices=(('M', 'Male'), ('F', 'Female')), default='M')
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.matricule or self.username})"

class StudentProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='student_profile')
    filiere = models.CharField(max_length=100)
    annee_etude = models.IntegerField(default=1)
    numero_etudiant = models.CharField(max_length=50)
    tutor_name = models.CharField(max_length=150, blank=True, null=True)

    def __str__(self):
        return f"Student: {self.user.username}"

class TeacherProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='teacher_profile')
    departement = models.CharField(max_length=100)
    matiere = models.TextField(blank=True, null=True)
    classes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Teacher: {self.user.username}"

class AdminProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='admin_profile')
    service = models.CharField(max_length=100)

    def __str__(self):
        return f"Admin: {self.user.username}"
