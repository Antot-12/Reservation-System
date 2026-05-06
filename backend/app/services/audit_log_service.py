from sqlalchemy.orm import Session
from app.models.models import AuditLog
from datetime import datetime
from typing import Optional, Dict, Any


class AuditLogService:
    """Service for managing audit logs"""

    @staticmethod
    def log_action(
        db: Session,
        admin_phone: str,
        action: str,
        entity_type: str,
        entity_id: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ):
        """Create an audit log entry"""
        audit_log = AuditLog(
            admin_phone=admin_phone,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
            timestamp=datetime.utcnow()
        )
        db.add(audit_log)
        db.commit()
        return audit_log

    @staticmethod
    def log_appointment_update(
        db: Session,
        admin_phone: str,
        appointment_id: int,
        changes: Dict[str, Any],
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ):
        """Log appointment update action"""
        return AuditLogService.log_action(
            db=db,
            admin_phone=admin_phone,
            action="update_appointment",
            entity_type="appointment",
            entity_id=appointment_id,
            details={"changes": changes},
            ip_address=ip_address,
            user_agent=user_agent
        )

    @staticmethod
    def log_appointment_cancel(
        db: Session,
        admin_phone: str,
        appointment_id: int,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ):
        """Log appointment cancellation"""
        return AuditLogService.log_action(
            db=db,
            admin_phone=admin_phone,
            action="cancel_appointment",
            entity_type="appointment",
            entity_id=appointment_id,
            ip_address=ip_address,
            user_agent=user_agent
        )

    @staticmethod
    def log_user_blacklist(
        db: Session,
        admin_phone: str,
        user_id: int,
        is_blacklisted: bool,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ):
        """Log user blacklist action"""
        action = "blacklist_user" if is_blacklisted else "unblacklist_user"
        return AuditLogService.log_action(
            db=db,
            admin_phone=admin_phone,
            action=action,
            entity_type="user",
            entity_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent
        )

    @staticmethod
    def log_schedule_update(
        db: Session,
        admin_phone: str,
        schedule_data: Dict[str, Any],
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ):
        """Log schedule configuration update"""
        return AuditLogService.log_action(
            db=db,
            admin_phone=admin_phone,
            action="update_schedule",
            entity_type="schedule",
            details={"schedule": schedule_data},
            ip_address=ip_address,
            user_agent=user_agent
        )

    @staticmethod
    def log_admin_login(
        db: Session,
        admin_phone: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ):
        """Log admin login"""
        return AuditLogService.log_action(
            db=db,
            admin_phone=admin_phone,
            action="admin_login",
            entity_type="auth",
            ip_address=ip_address,
            user_agent=user_agent
        )

    @staticmethod
    def log_report_export(
        db: Session,
        admin_phone: str,
        export_type: str,
        date_range: Dict[str, str],
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ):
        """Log report export"""
        return AuditLogService.log_action(
            db=db,
            admin_phone=admin_phone,
            action=f"export_report_{export_type}",
            entity_type="report",
            details={"date_range": date_range, "type": export_type},
            ip_address=ip_address,
            user_agent=user_agent
        )


audit_log_service = AuditLogService()
