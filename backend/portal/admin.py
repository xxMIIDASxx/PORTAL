from django.contrib import admin
from .models import CalendarEvent, Notification, ReportCard, Grade, Absence, DocumentRequest, ClassSchedule, Course, Session, Attendance

admin.site.register(CalendarEvent)
admin.site.register(Notification)
admin.site.register(ReportCard)
admin.site.register(Grade)
admin.site.register(Absence)
admin.site.register(DocumentRequest)
admin.site.register(ClassSchedule)
admin.site.register(Course)
admin.site.register(Session)
admin.site.register(Attendance)
