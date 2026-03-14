from django.urls import path
from . import views

urlpatterns = [
    path('reports/daily/', views.DailyReportView.as_view(), name='report_daily'),
    path('reports/weekly/', views.WeeklyReportView.as_view(), name='report_weekly'),
    path('reports/monthly/', views.MonthlyReportView.as_view(), name='report_monthly'),
    path('reports/student/<uuid:student_id>/', views.StudentReportView.as_view(), name='report_student'),
    path('reports/overview/', views.OverviewView.as_view(), name='report_overview'),
    path('reports/analytics/', views.AnalyticsView.as_view(), name='report_analytics'),
]
