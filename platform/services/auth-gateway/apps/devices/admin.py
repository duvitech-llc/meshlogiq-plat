"""
Django admin registrations for the devices app.
"""
from django.contrib import admin
from .models import Device, ProvisionToken, DeviceLog


class ProvisionTokenInline(admin.TabularInline):
    model = ProvisionToken
    extra = 0
    readonly_fields = ("id", "token", "created_at", "expires_at", "used_at")
    fields = ("token", "expires_at", "used_at", "created_at")
    can_delete = False


class DeviceLogInline(admin.TabularInline):
    model = DeviceLog
    extra = 0
    readonly_fields = ("id", "event_type", "message", "metadata", "created_at")
    fields = ("event_type", "message", "created_at")
    can_delete = False
    max_num = 20
    ordering = ("-created_at",)


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = (
        "device_name",
        "device_id",
        "device_type",
        "org_id",
        "status",
        "current_tier",
        "last_seen_at",
        "created_at",
    )
    list_filter = ("status", "current_tier", "device_type")
    search_fields = ("device_name", "device_id", "org_id", "hw_fingerprint")
    ordering = ("-created_at",)
    readonly_fields = (
        "id",
        "created_at",
        "provisioned_at",
        "last_seen_at",
        "cert_issued_at",
        "cert_expires_at",
        "cert_revoked_at",
    )
    inlines = (ProvisionTokenInline, DeviceLogInline)

    fieldsets = (
        (
            "Identity",
            {"fields": ("id", "device_id", "device_name", "device_type", "hw_fingerprint")},
        ),
        (
            "Tenant & Tier",
            {"fields": ("org_id", "tier_at_provision", "current_tier")},
        ),
        (
            "Certificate",
            {
                "fields": (
                    "cert_serial_number",
                    "cert_issued_at",
                    "cert_expires_at",
                    "cert_revoked_at",
                )
            },
        ),
        ("Status", {"fields": ("status", "created_at", "provisioned_at", "last_seen_at")}),
        ("Metadata", {"fields": ("metadata",), "classes": ("collapse",)}),
    )

    actions = ["activate_devices", "deactivate_devices", "revoke_devices"]

    @admin.action(description="Activate selected devices")
    def activate_devices(self, request, queryset):
        for device in queryset:
            device.activate()
        self.message_user(request, f"{queryset.count()} device(s) activated.")

    @admin.action(description="Deactivate selected devices")
    def deactivate_devices(self, request, queryset):
        for device in queryset:
            device.deactivate()
        self.message_user(request, f"{queryset.count()} device(s) deactivated.")

    @admin.action(description="Revoke selected devices")
    def revoke_devices(self, request, queryset):
        for device in queryset:
            device.revoke()
        self.message_user(request, f"{queryset.count()} device(s) revoked.")


@admin.register(ProvisionToken)
class ProvisionTokenAdmin(admin.ModelAdmin):
    list_display = ("device", "token", "expires_at", "used_at", "is_valid", "created_at")
    list_filter = ("used_at",)
    search_fields = ("device__device_id", "token")
    readonly_fields = ("id", "created_at")

    def is_valid(self, obj):
        return obj.is_valid()

    is_valid.boolean = True
    is_valid.short_description = "Valid?"


@admin.register(DeviceLog)
class DeviceLogAdmin(admin.ModelAdmin):
    list_display = ("device", "event_type", "message", "created_at")
    list_filter = ("event_type",)
    search_fields = ("device__device_id", "event_type", "message")
    readonly_fields = ("id", "device", "event_type", "message", "metadata", "created_at")
    ordering = ("-created_at",)
