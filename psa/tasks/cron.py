import frappe
from datetime import datetime, timedelta
from frappe.utils import get_datetime, now_datetime
from dateutil.relativedelta import relativedelta
from frappe.utils.pdf import get_pdf
from frappe.utils.file_manager import save_file
from frappe.utils import get_url_to_form

def add_minutes(datetime_str, minutes):
    """إضافة دقائق إلى تاريخ معين"""
    datetime_obj = get_datetime(datetime_str)
    return datetime_obj + timedelta(minutes=minutes)

def add_months(source_date, months):
    # استخدام relativedelta لإضافة الأشهر مع التعامل مع تجاوز السنة
    return source_date + relativedelta(months=+months)

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
                subject = "Reminder to Resume Enrollment."
                message = f"Dear {request.student},<br><br>Your suspension period is about to end in 5 days. Please take the necessary actions to resume your enrollment."

                frappe.sendmail(recipients=[user_email],
                                subject=subject,
                                message=message, now=True)

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
    progress_report_settings = frappe.get_all(
        'Progress Report Settings Child Table',
        filters={'parent': 'PSA Settings', 'parenttype': 'PSA Settings', 'parentfield': 'program_progress_reports'},
        fields=['program_degrees', 'number_of_progress_reports_per_a_program', 'first_progress_report_date_day', 'first_progress_report_date_month']
    )
    
    today = datetime.today()

    for setting in progress_report_settings:
        program_degree = setting['program_degrees']
        report_dates = []
        day = setting['first_progress_report_date_day']
        month = setting['first_progress_report_date_month']
        start_date = datetime(today.year, month, day)

        # حساب تواريخ تقارير التقدم
        for i in range(int(setting['number_of_progress_reports_per_a_program'])):
            report_dates.append(add_months(start_date, i * int(12 / int(setting['number_of_progress_reports_per_a_program']))))  # تقسيم  التقارير على السنة كلها كعدد صحيح

        student_supervisors = frappe.get_all('Student Supervisor', filters={'enabled': 1}, fields=['student', 'program_enrollment'])
        program_enrollments = frappe.get_all('Program Enrollment', filters={'name': ['in', [ss['program_enrollment'] for ss in student_supervisors]]}, fields=['name', 'program'])
        academic_programs = frappe.get_all('Academic Program', filters={'name': ['in', [pe['program'] for pe in program_enrollments]], 'program_degree': program_degree}, fields=['name'])

        filtered_student_names = [ss['student'] for ss in student_supervisors if ss['program_enrollment'] in [pe['name'] for pe in program_enrollments if pe['program'] in [ap['name'] for ap in academic_programs]]]

        students = frappe.get_all('Student', filters={'name': ['in', filtered_student_names]}, fields=['name'])

        for student in students:
            user_id = frappe.db.get_value("Student", student['name'], "user_id")
            user_email = frappe.db.get_value("User", user_id, "email")
            student_supervisor = get_supervisor_for_student(student['name'])

            for report_date in report_dates:
                if today.date() == report_date.date(): #لما نشتي يرتسل التقرير بالوقت المحدد نفتح هذا التعليق 
                #if True:  # تنفذ بدون تحقق من التاريخ
                    print("Creating progress report for student:", student['name'], student_supervisor)
                    #pro= frappe.db.get_value("Program Enrollment", filters= {'student':student['name']}, "student")
                    progress_report = frappe.get_doc({
                        "doctype": "Progress Report",
                        "student": student['name'],
                        "program_enrollment": program_enrollments, #frappe.db.get_value("Student", student['name'], "program_enrollment"),
                        "supervisor":  "PSA-Std-Sup-24-06-0001",# student_supervisor, #
                        "report_date": today,
                        "from_date": today - timedelta(days=90),
                        "to_date": today,
                        "status": "Unsatisfied"
                    })
                    progress_report.insert()
                    frappe.db.commit()

                    if user_email:
                        subject = "New Progress Report Created"
                        message = f"Dear {frappe.db.get_value('Student', student['name'], 'first_name')},<br><br>A new progress report has been created. Please fill it by the end of the period.<br>Report Link: {frappe.utils.get_url_to_form('Progress Report', progress_report.name)}"
                        frappe.sendmail(recipients=[user_email], subject=subject, message=message, now=True)

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
                        frappe.db.commit()

def notify_supervisor_if_no_progress_report():
    progress_report_settings = frappe.get_all(
        'Progress Report Settings Child Table',
        filters={'parent': 'PSA Settings', 'parenttype': 'PSA Settings', 'parentfield': 'program_progress_reports'},
        fields=['program_degrees', 'number_of_progress_reports_per_a_program', 'first_progress_report_date_day', 'first_progress_report_date_month']
    )
    
    today = datetime.today()

    for setting in progress_report_settings:
        program_degree = setting['program_degrees']

        student_supervisors = frappe.get_all('Student Supervisor', filters={'enabled': 1, 'type': 'Main Supervisor'}, fields=['student', 'program_enrollment', 'supervisor'])
        program_enrollments = frappe.get_all('Program Enrollment', filters={'name': ['in', [ss['program_enrollment'] for ss in student_supervisors]]}, fields=['name', 'program'])
        academic_programs = frappe.get_all('Academic Program', filters={'name': ['in', [pe['program'] for pe in program_enrollments]], 'program_degree': program_degree}, fields=['name'])

        #  الطلاب الذين يطابقون الفلترة
        filtered_student_supervisors = [ss for ss in student_supervisors if ss['program_enrollment'] in [pe['name'] for pe in program_enrollments if pe['program'] in [ap['name'] for ap in academic_programs]]]
        filtered_student_names = [ss['student'] for ss in filtered_student_supervisors]

        students = frappe.get_all('Student', filters={'name': ['in', filtered_student_names]}, fields=['name', 'user_id', 'first_name'])

        for student in students:
            student_name = student['name']
            user_id = student['user_id']
            student_doc_first_name = student['first_name']
            
            # نفلتر المشرف من قائمة Student Supervisor المرتبط بالطالب
            supervisor_info = next((ss for ss in filtered_student_supervisors if ss['student'] == student_name ), None)
            if supervisor_info:
                supervisor = supervisor_info['supervisor']
                employee_id = frappe.db.get_value('Faculty Member', supervisor, 'employee')
                supervisor_user_id = frappe.db.get_value('Employee', employee_id, 'user_id')
                supervisor_first_name = frappe.db.get_value('Employee', employee_id, 'first_name')
                supervisor_email = frappe.db.get_value('User', supervisor_user_id, 'email')

                # حساب تاريخ اخر تقرير متوقع
                day = setting['first_progress_report_date_day']
                month = setting['first_progress_report_date_month']
                last_report_date = datetime(today.year, month, day)
                for i in range(int(setting['number_of_progress_reports_per_a_program'])):
                    last_report_date += timedelta(days=90)

                # التحقق من وجود تقارير الانجاز في المدة المحددة
                progress_reports = frappe.get_all('Progress Report', filters={
                    'student': student_name,
                    'report_date': ['between', (last_report_date - timedelta(days=90)), last_report_date]
                })

                if not progress_reports and supervisor_email:
                    print('Supervisor Email:', supervisor_email)
                    print('Supervisor name:', supervisor_first_name)

                    subject = 'Student has not filled Progress Report'
                message = f'Dear {supervisor_first_name},<br><br>The student {student_doc_first_name} has not filled the progress report for the current period. Please follow up.'
                frappe.sendmail(recipients=[supervisor_email], subject=subject, message=message, now=True)

                notification_doc = frappe.get_doc({
                    'doctype': 'Notification Log',
                    'subject': subject,
                    'email_content': message,
                    'type': 'Alert',
                    'document_type': 'Progress Report',
                    'document_name': student_name,
                    'from_user': frappe.session.user,
                    'for_user': supervisor_user_id,
                })
                notification_doc.insert(ignore_permissions=True)
                frappe.db.commit()


@frappe.whitelist()
def get_supervisor_for_student(student):
    supervisor = frappe.get_value("Student Supervisor", {"student": student, "enabled": 1, "type": "Main Supervisor"}, "supervisor")
    if supervisor:
        supervisor_name = frappe.get_value("Faculty Member", supervisor, "name")
        return supervisor_name
    return None

def on_submit(doc, method):
    send_report_to_supervisor(doc.name)

@frappe.whitelist()
def send_report_to_supervisor(report_name):
    report = frappe.get_doc('Progress Report', report_name)
    if report.docstatus != 1:
        frappe.throw('The report must be submitted before sending to the supervisor.')

    supervisor = frappe.get_value('Student Supervisor', {'student': report.student, 'enabled': 1, 'type': 'Main Supervisor'}, 'supervisor')
    if not supervisor:
        frappe.throw('No supervisor found for the student.')

    employee_id = frappe.db.get_value('Faculty Member', supervisor, 'employee')
    supervisor_user_id = frappe.db.get_value('Employee', employee_id, 'user_id')
    supervisor_email = frappe.db.get_value('User', supervisor_user_id, 'email')

    if not supervisor_email:
        frappe.throw('Supervisor does not have a valid email address.')

    pdf_content = get_pdf(frappe.get_print('Progress Report', report_name, print_format='Custom Progress Report'))
    filename = f'{report_name}.pdf'
    filedoc = save_file(filename, pdf_content, 'Progress Report', report_name, is_private=1)

    student_first_name = frappe.db.get_value('Student', report.student, 'first_name')

    subject = f'Progress Report for {report.student}'
    message = f'Dear {supervisor},<br><br>Please find the attached progress report for the student {student_first_name}.<br><br><a href="{get_url_to_form("Progress Report", report_name)}">View Report</a>'

    frappe.sendmail(
        recipients=[supervisor_email],
        subject=subject,
        message=message,
        attachments=[{'fname': filename, 'fcontent': pdf_content}]
    )

    notification_doc = frappe.get_doc({
        'doctype': 'Notification Log',
        'subject': subject,
        'email_content': message,
        'type': 'Alert',
        'document_type': 'Progress Report',
        'document_name': report_name,
        'from_user': frappe.session.user,
        'for_user': supervisor_user_id,
    })
    notification_doc.insert(ignore_permissions=True)
    frappe.db.commit()
