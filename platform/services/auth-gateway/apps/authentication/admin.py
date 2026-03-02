"""
Django admin registrations for the authentication app.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import MeshLogIQUser, UserProfile


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = "Profile"
    fields = ("timezone", "language", "theme", "notifications_enabled", "tenant_id")


@admin.register(MeshLogIQUser)
class MeshLogIQUserAdmin(UserAdmin):
    """Admin configuration for the custom user model."""

    inlines = (UserProfileInline,)

    list_display = (
        "email",
        "username",
        "first_name",
        "last_name",
        "is_active",
        "is_staff",
        "is_service_account",
        "created_at",
    )
    list_filter = ("is_active", "is_staff", "is_superuser", "is_service_account")
    search_fields = ("email", "username", "first_name", "last_name", "keycloak_user_id")
    ordering = ("-created_at",)
    readonly_fields = ("id", "created_at", "last_login_at", "keycloak_user_id")

    fieldsets = (
        (None, {"fields": ("id", "username", "password")}),
        (
            "Personal info",
            {"fields": ("first_name", "last_name", "email")},
        ),
        (
            "Keycloak",
            {"fields": ("keycloak_user_id", "is_service_account")},
        ),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        (
            "Important dates",
            {"fields": ("created_at", "last_login_at", "last_login")},
        ),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "username", "password1", "password2"),
            },
        ),
    )
