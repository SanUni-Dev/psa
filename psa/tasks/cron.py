import frappe
from datetime import datetime, timedelta
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
        target_date = add_minutes(request.creation, 60)

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



 
 


def create_progress_report_and_notify():
    progress_report_settings = frappe.db.get_single_value('PSA Settings', 'table_ynaa')
    today = datetime.today()

    for setting in progress_report_settings:
        report_dates = []
        day = setting.first_progress_report_date_day
        month = setting.first_progress_report_date_month

        for i in range(int(setting.count_of_progress_reports_per_a_program)):
            report_dates.append(datetime(today.year, month, day))
            month += 3  #  لو نشتي نغير مدة اشهر كل فترة نغير هنا عدد الاشهر

        students = frappe.get_all("Student", filters={"program_degree": setting.program_degrees})

        for student in students:
            user_id = frappe.db.get_value("Student", student.name, "user_id")
            user_email = frappe.db.get_value("User", user_id, "email")

            for report_date in report_dates:
                if today.date() == report_date.date():
                    # ننشئ التقرير للطالب في كل فترة لكي يقوم بتعبئته
                    progress_report = frappe.get_doc({
                        "doctype": "Progress Report",
                        "student": student.name,
                        "program_enrollment": frappe.db.get_value("Student", student.name, "program_enrollment"),
                        "report_date": today,
                        "from_date": today - timedelta(days=90),
                        "to_date": today,
                        "status": "Unsatisfied"
                    })
                    progress_report.insert(ignore_permissions=True)

                     
                    if user_email:
                        subject = "New Progress Report Created"
                        message = f"Dear {frappe.db.get_value('Student', student.name, 'first_name')},<br><br>A new progress report has been created. Please fill it by the end of the period.<br>Report Link: {frappe.utils.get_url_to_form('Progress Report', progress_report.name)}"
                        frappe.sendmail(recipients=[user_email], subject=subject, message=message , now= True)

                        notification_doc = frappe.get_doc({
                            "doctype": "Notification Log",
                            "subject": subject,
                            "email_content": message,
                            "type": "Alert",
                            "document_type": "Progress Report",
                            "document_name": progress_report.name,
                            "from_user": frappe.session.user,
                            "for_user": user_id,
                        })
                        notification_doc.insert(ignore_permissions=True)

def notify_supervisor_if_no_progress_report():
    progress_report_settings = frappe.db.get_single_value('PSA Settings', 'table_ynaa')
    today = datetime.today()

    for setting in progress_report_settings:
        students = frappe.get_all("Student", filters={"program_degree": setting.program_degrees})

        for student in students:
            user_id = frappe.db.get_value("Student", student.name, "user_id")
            student_doc_first_name = frappe.db.get_value("Student", student.name, "first_name")
            program_enrollment = frappe.db.get_value("Student", student.name, "program_enrollment")
            supervisor = frappe.db.get_value("Student Supervisor", {
                "student": student.name,
                "program_enrollment": frappe.db.get_value("Student", student.name, "program_enrollment"),
                "enabled": 1,
                "type": "Main Supervisor"
            }, "supervisor")
            
            supervisor_user_id = frappe.db.get_value("Faculty Member", supervisor, "user_id")
            supervisor_email = frappe.db.get_value("User", supervisor_user_id, "email")

               # نحسب تاريخ اخر تقرير متوقع
            day = setting.first_progress_report_date_day
            month = setting.first_progress_report_date_month
            last_report_date = datetime(today.year, month, day)
            for i in range(int(setting.count_of_progress_reports_per_a_program)):
                last_report_date = last_report_date + timedelta(days=90)

             # هنا نتحقق اذا تم تعبئة التقرير في المدة المحددة
            progress_reports = frappe.get_all("Progress Report", filters={
                "student": student.name,
                "report_date": ["between", [last_report_date - timedelta(days=90), last_report_date]]
            })

            if not progress_reports:
                 
                if supervisor_email:
                    subject = "Student has not filled Progress Report"
                    message = f"Dear {supervisor},<br><br>The student {student_doc_first_name} has not filled the progress report for the current period. Please follow up."
                    frappe.sendmail(recipients=[supervisor_email], subject=subject, message=message , now=True)

                    notification_doc = frappe.get_doc({
                        "doctype": "Notification Log",
                        "subject": subject,
                        "email_content": message,
                        "type": "Alert",
                        "document_type": "Progress Report",
                        "document_name": student.name,
                        "from_user": frappe.session.user,
                        "for_user": supervisor_user_id,
                    })
                    notification_doc.insert(ignore_permissions=True)