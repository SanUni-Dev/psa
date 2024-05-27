import frappe
from datetime import timedelta
from frappe.utils import get_datetime, now_datetime

def add_minutes(datetime_str, minutes):
    """إضافة دقائق إلى تاريخ معين"""
    datetime_obj = get_datetime(datetime_str)
    return datetime_obj + timedelta(minutes=minutes)

def send_suspend_enrollment_notification():
    suspend_requests = frappe.get_all("Suspend Enrollment Request", 
                                      filters={'status': ['not like', '%Reject%'], 'docstatus': 1},
                                      fields=["name", "student", "creation"])

    for request in suspend_requests:
        user_id = frappe.db.get_value("Student", request.student, "user_id")
        user_email = frappe.db.get_value("User", user_id, "email")
        target_date = add_minutes(request.creation, 2)

        if target_date <= now_datetime():
            if user_email:
                subject = "Reminder to Resume Enrollment"
                message = f"Dear {request.student},<br><br>Your suspension period is about to end in 5 days. Please take the necessary actions to resume your enrollment."

                frappe.sendmail(recipients=[user_email],
                                subject=subject,
                                message=message,
                                now=True)

                 
                notification_doc = frappe.get_doc({
                    "doctype": "Notification Log",
                    "subject": subject,
                    "email_content": message,
                    "type": "Alert",
                    "document_type": "Suspend Enrollment Request",
                    "document_name": request.name,
                    "from_user": frappe.session.user,
                    "for_user": user_id,
                })
                notification_doc.insert(ignore_permissions=True)
