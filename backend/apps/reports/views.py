"""
Analytics and Reports Views
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q, Avg
from datetime import date, timedelta
from calendar import monthrange
from typing import Any

from apps.attendance.models import AttendanceRecord
from apps.students.models import Student
from apps.devices.models import Device
from apps.organizations.models import School, Region, District
from apps.accounts.permissions import IsTeacherOrAbove, IsBotRequest, IsAuthenticatedOrBot, IsTeacherOrParentOrAbove


class DailyReportView(APIView):
    permission_classes = [IsTeacherOrParentOrAbove]

    def get(self, request):
        report_date = request.query_params.get('date', str(date.today()))
        school_id = request.query_params.get('school')
        class_id = request.query_params.get('class_ref')

        qs = AttendanceRecord.objects.filter(date=report_date)
        if school_id:
            qs = qs.filter(student__school_id=school_id)
        if class_id:
            qs = qs.filter(student__class_ref_id=class_id)

        stats = qs.aggregate(
            total=Count('id'),
            present=Count('id', filter=Q(status='present')),
            late=Count('id', filter=Q(status='late')),
            absent=Count('id', filter=Q(status='absent')),
            excused=Count('id', filter=Q(status='excused')),
        )
        total = stats['total'] or 1
        stats['attendance_rate'] = round(((stats['present'] + stats['late']) / total) * 100, 1)
        stats['date'] = report_date

        # Class breakdown
        class_breakdown = qs.values(
            'student__class_ref__name'
        ).annotate(
            total=Count('id'),
            present=Count('id', filter=Q(status='present')),
            late=Count('id', filter=Q(status='late')),
            absent=Count('id', filter=Q(status='absent')),
        ).order_by('student__class_ref__grade')

        stats['class_breakdown'] = list(class_breakdown)
        return Response(stats)


class WeeklyReportView(APIView):
    permission_classes = [IsTeacherOrParentOrAbove]

    def get(self, request):
        today = date.today()
        start_date = request.query_params.get('start_date', str(today - timedelta(days=6)))
        end_date = request.query_params.get('end_date', str(today))
        school_id = request.query_params.get('school')

        qs = AttendanceRecord.objects.filter(date__range=[start_date, end_date])
        if school_id:
            qs = qs.filter(student__school_id=school_id)

        # Daily breakdown
        daily = {}
        delta = date.fromisoformat(end_date) - date.fromisoformat(start_date)
        for i in range(delta.days + 1):
            d = date.fromisoformat(start_date) + timedelta(days=i)
            day_qs = qs.filter(date=d)
            day_stats = day_qs.aggregate(
                total=Count('id'),
                present=Count('id', filter=Q(status='present')),
                late=Count('id', filter=Q(status='late')),
                absent=Count('id', filter=Q(status='absent')),
            )
            t = day_stats['total'] or 1
            daily[str(d)] = {
                **day_stats,
                'attendance_rate': round(((day_stats['present'] + day_stats['late']) / t) * 100, 1)
            }

        # Overall stats
        overall = qs.aggregate(
            total=Count('id'),
            present=Count('id', filter=Q(status='present')),
            late=Count('id', filter=Q(status='late')),
            absent=Count('id', filter=Q(status='absent')),
        )
        t = overall['total'] or 1
        overall['attendance_rate'] = round(((overall['present'] + overall['late']) / t) * 100, 1)

        return Response({
            'start_date': start_date,
            'end_date': end_date,
            'overall': overall,
            'daily': daily,
        })


class MonthlyReportView(APIView):
    permission_classes = [IsTeacherOrParentOrAbove]

    def get(self, request):
        year = int(request.query_params.get('year', date.today().year))
        month = int(request.query_params.get('month', date.today().month))
        school_id = request.query_params.get('school')

        _, last_day = monthrange(year, month)
        start_date = date(year, month, 1)
        end_date = date(year, month, last_day)

        qs = AttendanceRecord.objects.filter(date__range=[start_date, end_date])
        if school_id:
            qs = qs.filter(student__school_id=school_id)

        stats = qs.aggregate(
            total=Count('id'),
            present=Count('id', filter=Q(status='present')),
            late=Count('id', filter=Q(status='late')),
            absent=Count('id', filter=Q(status='absent')),
        )
        t = stats['total'] or 1
        stats['attendance_rate'] = round(((stats['present'] + stats['late']) / t) * 100, 1)
        stats['year'] = year
        stats['month'] = month

        # Class breakdown for the month
        class_breakdown = qs.values(
            'student__class_ref__name',
            'student__class_ref__grade',
        ).annotate(
            total=Count('id'),
            present=Count('id', filter=Q(status='present')),
            late=Count('id', filter=Q(status='late')),
            absent=Count('id', filter=Q(status='absent')),
        ).order_by('student__class_ref__grade')
        stats['class_breakdown'] = list(class_breakdown)

        return Response(stats)


class StudentReportView(APIView):
    permission_classes = [IsTeacherOrParentOrAbove]

    def get(self, request, student_id):
        from apps.attendance.serializers import AttendanceRecordSerializer
        user = request.user
        try:
            student = Student.objects.get(id=student_id, is_active=True)
        except Student.DoesNotExist:
            return Response({'detail': 'O\'quvchi topilmadi'}, status=404)

        # Scope check: non-superadmins can only view students in their scope
        if not (user.is_superuser or user.has_role('superadmin')):
            if user.has_role('parent'):
                # Parents can only see their own children
                try:
                    parent = user.parent_profile
                    linked_ids = list(parent.student_links.filter(status='active').values_list('student_id', flat=True))
                    if student.id not in linked_ids:
                        return Response({'detail': 'Ruxsat yo\'q'}, status=403)
                except Exception:
                    return Response({'detail': 'Ruxsat yo\'q'}, status=403)
            elif user.has_role('region_director'):
                region_ids = list(user.user_roles.filter(role__name='region_director', is_active=True).values_list('region_id', flat=True))
                if student.school.district.region_id not in region_ids:
                    return Response({'detail': 'Ruxsat yo\'q'}, status=403)
            elif user.has_role('district_director'):
                district_ids = list(user.user_roles.filter(role__name='district_director', is_active=True).values_list('district_id', flat=True))
                if student.school.district_id not in district_ids:
                    return Response({'detail': 'Ruxsat yo\'q'}, status=403)
            else:
                allowed_school_ids = list(user.user_roles.filter(
                    role__name__in=['school_director', 'operator', 'teacher'],
                    is_active=True, school__isnull=False
                ).values_list('school_id', flat=True))
                if student.school_id not in allowed_school_ids:
                    return Response({'detail': 'Ruxsat yo\'q'}, status=403)

        records = AttendanceRecord.objects.filter(student=student).order_by('-date')[:30]
        stats = AttendanceRecord.objects.filter(student=student).aggregate(
            total=Count('id'),
            present=Count('id', filter=Q(status='present')),
            late=Count('id', filter=Q(status='late')),
            absent=Count('id', filter=Q(status='absent')),
        )
        t = stats['total'] or 1
        stats['attendance_rate'] = round(((stats['present'] + stats['late']) / t) * 100, 1)

        return Response({
            'student': {
                'id': str(student.id),
                'name': student.full_name,
                'class': student.class_ref.name if student.class_ref else '',
                'student_id': student.student_id,
            },
            'statistics': stats,
            'recent_records': AttendanceRecordSerializer(records, many=True, context={'request': request}).data,
        })


class AnalyticsView(APIView):
    permission_classes = [IsTeacherOrParentOrAbove]

    def _date_range(self, period, date_from, date_to):
        today = date.today()
        if period == 'today' or not period:
            return today, today
        if period == 'week':
            return today - timedelta(days=6), today
        if period == 'month':
            from calendar import monthrange
            _, last = monthrange(today.year, today.month)
            return date(today.year, today.month, 1), date(today.year, today.month, last)
        if period == 'custom' and date_from and date_to:
            try:
                return date.fromisoformat(date_from), date.fromisoformat(date_to)
            except ValueError:
                pass
        return today, today

    def _stats(self, qs):
        s = qs.aggregate(
            total=Count('id'),
            present=Count('id', filter=Q(status='present')),
            late=Count('id', filter=Q(status='late')),
            absent=Count('id', filter=Q(status='absent')),
        )
        t = s['total'] or 1
        s['rate'] = round(((s['present'] + s['late']) / t) * 100, 1)
        return s

    def get(self, request):
        from apps.organizations.models import Class

        region_id = request.query_params.get('region')
        district_id = request.query_params.get('district')
        school_id = request.query_params.get('school')
        period = request.query_params.get('period', 'today')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        start, end = self._date_range(period, date_from, date_to)

        # Base queryset scoped to user permissions
        user = request.user
        base = AttendanceRecord.objects.filter(date__range=[start, end])
        if not (user.is_superuser or user.has_role('superadmin')):
            if user.has_role('region_director'):
                rids = user.user_roles.filter(role__name='region_director', is_active=True).values_list('region_id', flat=True)
                base = base.filter(student__school__district__region_id__in=rids)
            elif user.has_role('district_director'):
                dids = user.user_roles.filter(role__name='district_director', is_active=True).values_list('district_id', flat=True)
                base = base.filter(student__school__district_id__in=dids)
            elif user.has_role('parent'):
                try:
                    parent = user.parent_profile
                    student_ids = parent.student_links.filter(status='active').values_list('student_id', flat=True)
                    base = base.filter(student_id__in=student_ids)
                except Exception:
                    base = base.none()
            else:
                sids = user.user_roles.filter(
                    role__name__in=['school_director', 'operator', 'teacher'],
                    is_active=True, school__isnull=False
                ).values_list('school_id', flat=True)
                base = base.filter(student__school_id__in=sids)

        # Apply filters
        if school_id:
            base = base.filter(student__school_id=school_id)
        elif district_id:
            base = base.filter(student__school__district_id=district_id)
        elif region_id:
            base = base.filter(student__school__district__region_id=region_id)

        overall = self._stats(base)
        overall['start_date'] = str(start)
        overall['end_date'] = str(end)
        overall['period'] = period

        # Breakdown level
        breakdown: list[dict[str, Any]] = []
        if school_id:
            # class breakdown
            for cls in Class.objects.filter(school_id=school_id, is_active=True).order_by('grade', 'section'):
                qs = base.filter(student__class_ref_id=cls.id)
                s = self._stats(qs)
                if s['total'] > 0:
                    breakdown.append({
                        'id': cls.id, 'name': cls.name,
                        'type': 'class', **s
                    })
        elif district_id:
            # school breakdown
            for sch in School.objects.filter(district_id=district_id, is_active=True).order_by('name'):
                qs = base.filter(student__school_id=sch.id)
                s = self._stats(qs)
                breakdown.append({
                    'id': sch.id, 'name': sch.name,
                    'type': 'school', **s
                })
        elif region_id:
            # district breakdown
            for dis in District.objects.filter(region_id=region_id, is_active=True).order_by('name'):
                qs = base.filter(student__school__district_id=dis.id)
                s = self._stats(qs)
                breakdown.append({
                    'id': dis.id, 'name': dis.name,
                    'type': 'district', **s
                })
        else:
            # region breakdown (superadmin/all)
            for reg in Region.objects.filter(is_active=True).order_by('name'):
                qs = base.filter(student__school__district__region_id=reg.id)
                s = self._stats(qs)
                if s['total'] > 0:
                    breakdown.append({
                        'id': reg.id, 'name': reg.name,
                        'type': 'region', **s
                    })

        level = 'class' if school_id else 'school' if district_id else 'district' if region_id else 'region'
        return Response({
            'overall': overall,
            'breakdown': breakdown,
            'level': level,
        })


class OverviewView(APIView):
    """Dashboard uchun umumiy statistika"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        user = request.user

        # Get accessible schools
        if user.is_superuser or user.has_role('superadmin'):
            schools = School.objects.filter(is_active=True)
        elif user.has_role('region_director'):
            region_ids = user.user_roles.filter(role__name='region_director', is_active=True).values_list('region_id', flat=True)
            schools = School.objects.filter(district__region_id__in=region_ids, is_active=True)
        elif user.has_role('district_director'):
            district_ids = user.user_roles.filter(role__name='district_director', is_active=True).values_list('district_id', flat=True)
            schools = School.objects.filter(district_id__in=district_ids, is_active=True)
        elif user.has_role('parent'):
            try:
                parent = user.parent_profile
                student_ids = parent.student_links.filter(status='active').values_list('student_id', flat=True)
                child_school_ids = Student.objects.filter(id__in=student_ids).values_list('school_id', flat=True)
                schools = School.objects.filter(id__in=child_school_ids, is_active=True)
            except Exception:
                schools = School.objects.none()
        else:
            school_ids = user.user_roles.filter(
                role__name__in=['school_director', 'operator', 'teacher'],
                is_active=True, school__isnull=False
            ).values_list('school_id', flat=True)
            schools = School.objects.filter(id__in=school_ids, is_active=True)

        school_ids = list(schools.values_list('id', flat=True))

        students_count = Student.objects.filter(school_id__in=school_ids, is_active=True).count()
        devices = Device.objects.filter(school_id__in=school_ids, is_active=True)
        devices_online = devices.filter(status='online').count()
        devices_total = devices.count()

        today_records = AttendanceRecord.objects.filter(
            date=today, student__school_id__in=school_ids
        )
        today_stats = today_records.aggregate(
            present=Count('id', filter=Q(status='present')),
            late=Count('id', filter=Q(status='late')),
            absent=Count('id', filter=Q(status='absent')),
            total=Count('id'),
        )
        t = today_stats['total'] or 1
        today_stats['attendance_rate'] = round(((today_stats['present'] + today_stats['late']) / t) * 100, 1)

        # Weekly trend
        weekly = []
        for i in range(6, -1, -1):
            d = today - timedelta(days=i)
            day_qs = AttendanceRecord.objects.filter(date=d, student__school_id__in=school_ids)
            day_stats = day_qs.aggregate(
                present=Count('id', filter=Q(status='present')),
                late=Count('id', filter=Q(status='late')),
                total=Count('id'),
            )
            dt = day_stats['total'] or 1
            weekly.append({
                'date': str(d),
                'attendance_rate': round(((day_stats['present'] + day_stats['late']) / dt) * 100, 1),
                'present': day_stats['present'],
                'late': day_stats['late'],
            })

        return Response({
            'summary': {
                'schools_count': len(school_ids),
                'students_count': students_count,
                'devices_total': devices_total,
                'devices_online': devices_online,
            },
            'today': today_stats,
            'weekly_trend': weekly,
        })
