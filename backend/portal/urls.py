from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CalendarEventViewSet, NotificationViewSet, ReportCardViewSet, GradeViewSet, CourseViewSet, SessionViewSet, AttendanceViewSet, AbsenceViewSet, DocumentRequestViewSet, ClassScheduleViewSet

router = DefaultRouter()
router.register(r'calendar', CalendarEventViewSet, basename='calendarevent')
router.register(r'notifications', NotificationViewSet)
router.register(r'report-cards', ReportCardViewSet, basename='reportcard')
router.register(r'grades', GradeViewSet)
router.register(r'courses', CourseViewSet)
router.register(r'sessions', SessionViewSet)
router.register(r'attendances', AttendanceViewSet)
router.register(r'absences', AbsenceViewSet, basename='absence')
router.register(r'document-requests', DocumentRequestViewSet, basename='documentrequest')
router.register(r'schedules', ClassScheduleViewSet, basename='schedules')

urlpatterns = [
    path('', include(router.urls)),
]
