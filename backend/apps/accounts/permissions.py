from rest_framework.permissions import BasePermission


class IsSuperAdmin(BasePermission):
    """Faqat superadmin uchun"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_superuser or request.user.has_role('superadmin')
        )


class IsRegionDirectorOrAbove(BasePermission):
    """Viloyat direktori va yuqori lavozimlar"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser or request.user.has_role('superadmin'):
            return True
        return request.user.has_role('region_director')


class IsDistrictDirectorOrAbove(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser or request.user.has_role('superadmin'):
            return True
        return request.user.has_role('region_director') or request.user.has_role('district_director')


class IsSchoolDirectorOrAbove(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser or request.user.has_role('superadmin'):
            return True
        return any(request.user.has_role(r) for r in [
            'region_director', 'district_director', 'school_director'
        ])


class IsOperatorOrAbove(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser or request.user.has_role('superadmin'):
            return True
        return any(request.user.has_role(r) for r in [
            'region_director', 'district_director', 'school_director', 'operator'
        ])


class IsTeacherOrAbove(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return any(request.user.has_role(r) for r in [
            'superadmin', 'region_director', 'district_director',
            'school_director', 'operator', 'teacher'
        ]) or request.user.is_superuser


class IsParent(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_role('parent')


class IsTeacherOrParentOrAbove(BasePermission):
    """O'qituvchi, ota-ona va yuqori lavozimlar (read-only uchun)"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return any(request.user.has_role(r) for r in [
            'superadmin', 'region_director', 'district_director',
            'school_director', 'operator', 'teacher', 'parent'
        ]) or request.user.is_superuser


class IsBotRequest(BasePermission):
    """Telegram bot uchun maxsus ruxsat"""
    def has_permission(self, request, view):
        from django.conf import settings
        bot_secret = request.headers.get('X-Bot-Secret', '')
        return bot_secret == settings.BOT_SECRET


class IsAuthenticatedOrBot(BasePermission):
    """Autentifikatsiyalangan foydalanuvchi YOKI bot"""
    def has_permission(self, request, view):
        from django.conf import settings
        if request.headers.get('X-Bot-Secret', '') == settings.BOT_SECRET:
            return True
        return bool(request.user and request.user.is_authenticated)
