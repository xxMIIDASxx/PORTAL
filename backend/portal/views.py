from django.db import models
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from accounts.models import CustomUser
from .models import CalendarEvent, Notification, ReportCard, Grade, Absence, DocumentRequest, ClassSchedule, Course, Session, Attendance
from .serializers import CalendarEventSerializer, NotificationSerializer, ReportCardSerializer, GradeSerializer, AbsenceSerializer, DocumentRequestSerializer, ClassScheduleSerializer, CourseSerializer, SessionSerializer, AttendanceSerializer

class CalendarEventViewSet(viewsets.ModelViewSet):
    serializer_class = CalendarEventSerializer
    
    def get_queryset(self):
        queryset = CalendarEvent.objects.all().order_by('start_time')
        role = self.request.query_params.get('role')
        user_id = self.request.query_params.get('user_id')
        user = None

        if not role and self.request.user.is_authenticated:
            role = getattr(self.request.user, 'role', None)
            user = self.request.user

        if user_id:
            try:
                user = CustomUser.objects.get(pk=user_id)
                role = role or getattr(user, 'role', None)
            except CustomUser.DoesNotExist:
                user = None

        if role == 'admin':
            return queryset
        elif role == 'teacher' and user is not None:
            return queryset.filter(models.Q(professor=user) | models.Q(created_by=user))
        elif role == 'student':
            if user is not None and hasattr(user, 'student_profile'):
                filiere = user.student_profile.filiere
            else:
                filiere = self.request.query_params.get('filiere')

            if filiere:
                return queryset.filter(models.Q(target_classes='All Classes') | models.Q(target_classes__icontains=filiere))
            return queryset.filter(target_classes='All Classes')

        return queryset

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all().order_by('-date_envoi')
    serializer_class = NotificationSerializer

class ReportCardViewSet(viewsets.ModelViewSet):
    serializer_class = ReportCardSerializer

    def get_queryset(self):
        queryset = ReportCard.objects.all()
        student_id = self.request.query_params.get('student')
        if student_id:
            queryset = queryset.filter(student__id=student_id)
        elif self.request.user.is_authenticated and self.request.user.role == 'student':
            queryset = queryset.filter(student=self.request.user)
        return queryset

class GradeViewSet(viewsets.ModelViewSet):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer

    @action(detail=False, methods=['post'])
    def bulk_submit_grades(self, request):
        academic_year = request.data.get('academic_year', '2023-2024')
        semester = request.data.get('semester', 'S1')
        subject = request.data.get('subject')
        evaluation_type = request.data.get('evaluation_type', 'Examen')
        grades_data = request.data.get('grades', [])

        if not subject:
            return Response({'error': 'Subject is required'}, status=status.HTTP_400_BAD_REQUEST)

        updated_count = 0
        for grade_entry in grades_data:
            student_id = grade_entry.get('student_id')
            value = grade_entry.get('value')
            
            if student_id is None or value is None:
                continue
                
            try:
                val = float(value)
            except ValueError:
                continue

            # Get or create ReportCard for this student, year, and semester
            rc, created = ReportCard.objects.get_or_create(
                student_id=student_id,
                academic_year=academic_year,
                semester=semester
            )
            
            # Update or create the Grade
            Grade.objects.update_or_create(
                report_card=rc,
                subject=subject,
                evaluation_type=evaluation_type,
                defaults={'value': val}
            )
            
            # Recalculate average for the report card using weighted logic
            rc.recalculate_average()
            
            updated_count += 1

        return Response({'message': f'Successfully updated {updated_count} grades'}, status=status.HTTP_200_OK)

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all().order_by('name')
    serializer_class = CourseSerializer

class SessionViewSet(viewsets.ModelViewSet):
    queryset = Session.objects.all().order_by('date')
    serializer_class = SessionSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        teacher_id = self.request.query_params.get('teacher')
        target_class = self.request.query_params.get('target_class')
        course_id = self.request.query_params.get('course')

        if teacher_id:
            queryset = queryset.filter(teacher__id=teacher_id)
        if target_class:
            queryset = queryset.filter(target_class=target_class)
        if course_id:
            queryset = queryset.filter(course__id=course_id)

        return queryset

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all().order_by('session__date')
    serializer_class = AttendanceSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        session_id = self.request.query_params.get('session')
        student_id = self.request.query_params.get('student')
        teacher_id = self.request.query_params.get('teacher')

        if session_id:
            queryset = queryset.filter(session__id=session_id)
        if student_id:
            queryset = queryset.filter(student__id=student_id)
        if teacher_id:
            queryset = queryset.filter(session__teacher__id=teacher_id)

        return queryset

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        records = request.data.get('records', [])
        updated_count = 0

        for record in records:
            session_id = record.get('session_id')
            student_id = record.get('student_id')
            present = record.get('present', False)
            if session_id is None or student_id is None:
                continue

            attendance, created = Attendance.objects.update_or_create(
                session_id=session_id,
                student_id=student_id,
                defaults={'present': present}
            )

            try:
                session = Session.objects.get(id=session_id)
                if not present:
                    Absence.objects.update_or_create(
                        student_id=student_id,
                        subject=session.course.name,
                        date_seance=session.date,
                        defaults={'is_present': False}
                    )
                else:
                    Absence.objects.filter(
                        student_id=student_id,
                        subject=session.course.name,
                        date_seance=session.date
                    ).delete()
            except Session.DoesNotExist:
                pass

            updated_count += 1

        return Response({'message': f'Successfully recorded {updated_count} attendance records'}, status=status.HTTP_200_OK)

class AbsenceViewSet(viewsets.ModelViewSet):
    serializer_class = AbsenceSerializer

    def get_queryset(self):
        queryset = Absence.objects.all().order_by('-date_seance')
        student_id = self.request.query_params.get('student')
        if student_id:
            queryset = queryset.filter(student__id=student_id)
        elif self.request.user.is_authenticated and self.request.user.role == 'student':
            queryset = queryset.filter(student=self.request.user)
        return queryset

class DocumentRequestViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentRequestSerializer

    def get_queryset(self):
        queryset = DocumentRequest.objects.all().order_by('-created_at')
        student_id = self.request.query_params.get('student')
        if student_id:
            queryset = queryset.filter(student__id=student_id)
        elif self.request.user.is_authenticated and self.request.user.role == 'student':
            queryset = queryset.filter(student=self.request.user)
        return queryset

class ClassScheduleViewSet(viewsets.ModelViewSet):
    queryset = ClassSchedule.objects.all()
    serializer_class = ClassScheduleSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        target_class = self.request.query_params.get('target_class', None)
        if target_class:
            queryset = queryset.filter(target_class=target_class)
        return queryset
