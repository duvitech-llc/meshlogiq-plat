"""
Django admin registrations for the tenants app.
"""
from django.contrib import admin
from .models import Tenant, TenantUser, TenantSetting


class TenantUserInline(admin.TabularInline):
    model = TenantUser
    extra = 0
    readonly_fields = ("created_at",)
    fields = ("user", "role", "is_active", "invited_by", "created_at")
    raw_id_fields = ("user", "invited_by")


class TenantSettingInline(admin.TabularInline):
    model = TenantSetting
    extra = 0
    readonly_fields = ("created_at", "updated_at")
    fields = ("key", "value", "created_at", "updated_at")


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = (
        "org_name",
        "org_id",
        "subscription_plan",
        "status",
        "current_device_count",
        "max_devices",
        "current_storage_gb",
        "created_at",
    )
    list_filter = ("subscription_plan", "status")
    search_fields = ("org_name", "org_id", "billing_email")
    ordering = ("-created_at",)
    readonly_fields = ("id", "created_at", "upgraded_at", "downgraded_at")
    inlines = (TenantUserInline, TenantSettingInline)

    fieldsets = (
        (None, {"fields": ("id", "org_id", "org_name", "status")}),
        (
            "Subscription",
            {
                "fields": (
                    "subscription_plan",
                    "max_devices",
                    "storage_quota_gb",
                    "rate_limit_rpm",
                    "keycloak_realm",
                    "feature_flags",
                )
            },
        ),
        (
            "Usage",
            {"fields": ("current_device_count", "current_storage_gb")},
        ),
        (
            "Billing",
            {
                "fields": (
                    "billing_email",
                    "stripe_customer_id",
                    "stripe_subscription_id",
                )
            },
        ),
        (
            "Lifecycle",
            {"fields": ("created_at", "upgraded_at", "downgraded_at", "downgrade_effective_date")},
        ),
        ("Metadata", {"fields": ("metadata",), "classes": ("collapse",)}),
    )

    actions = ["suspend_tenants", "activate_tenants"]

    @admin.action(description="Suspend selected tenants")
    def suspend_tenants(self, request, queryset):
        updated = queryset.update(status="suspended")
        self.message_user(request, f"{updated} tenant(s) suspended.")

    @admin.action(description="Activate selected tenants")
    def activate_tenants(self, request, queryset):
        updated = queryset.update(status="active")
        self.message_user(request, f"{updated} tenant(s) activated.")


@admin.register(TenantUser)
class TenantUserAdmin(admin.ModelAdmin):
    list_display = ("user", "tenant", "role", "is_active", "created_at")
    list_filter = ("role", "is_active")
    search_fields = ("user__email", "tenant__org_name")
    raw_id_fields = ("user", "tenant", "invited_by")
    readonly_fields = ("id", "created_at")
