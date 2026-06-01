from rest_framework import serializers
from .models import CalendarEvent, Notification, ReportCard, Grade, Absence, DocumentRequest, ClassSchedule, Course, Session, Attendance
from accounts.serializers import UserSerializer

class CalendarEventSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    professor_name = serializers.SerializerMethodField()

    class Meta:
        model = CalendarEvent
        fields = '__all__'

    def get_created_by_name(self, obj):
        return f"{obj.created_by.first_name} {obj.created_by.last_name}"
        
    def get_professor_name(self, obj):
        if obj.professor:
            return f"{obj.professor.first_name} {obj.professor.last_name}"
        return None

class NotificationSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_role = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = '__all__'

    def get_sender_name(self, obj):
        return f"{obj.sender.first_name} {obj.sender.last_name}"

    def get_sender_role(self, obj):
        return obj.sender.role

class GradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = '__all__'

class ReportCardSerializer(serializers.ModelSerializer):
    grades = GradeSerializer(many=True, read_only=True)
    student_details = UserSerializer(source='student', read_only=True)
    
    class Meta:
        model = ReportCard
        fields = '__all__'

class AbsenceSerializer(serializers.ModelSerializer):
    student_details = UserSerializer(source='student', read_only=True)
    
    class Meta:
        model = Absence
        fields = '__all__'

class DocumentRequestSerializer(serializers.ModelSerializer):
    student_details = UserSerializer(source='student', read_only=True)

    class Meta:
        model = DocumentRequest
        fields = '__all__'

class ClassScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassSchedule
        fields = '__all__'


class CourseSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = '__all__'

    def get_teacher_name(self, obj):
        if obj.teacher:
            return f"{obj.teacher.first_name} {obj.teacher.last_name}"
        return None


class SessionSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    teacher_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Session
        fields = '__all__'

    def get_teacher_name(self, obj):
        if obj.teacher:
            return f"{obj.teacher.first_name} {obj.teacher.last_name}"
        return None

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}"
        return None


class AttendanceSerializer(serializers.ModelSerializer):
    session_details = SessionSerializer(source='session', read_only=True)
    student_details = UserSerializer(source='student', read_only=True)

    class Meta:
        model = Attendance
        fields = '__all__'
