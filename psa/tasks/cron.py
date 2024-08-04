import frappe
from datetime import datetime, timedelta
from frappe.utils import get_datetime, now_datetime
from dateutil.relativedelta import relativedelta
from frappe.utils.pdf import get_pdf
from frappe.utils.file_manager import save_file
from frappe.utils import get_url_to_form
from frappe import get_all, get_doc, DoesNotExistError


def add_minutes(datetime_str, minutes):
    """إضافة دقائق إلى تاريخ معين"""
    datetime_obj = get_datetime(datetime_str)
    return datetime_obj + timedelta(minutes=minutes)

def add_months(source_date, months):
    # استخدام relativedelta لإضافة الأشهر مع التعامل مع تجاوز السنة
    return source_date + relativedelta(months=+months)

#دالة اشعار للطالب كتذكير بفتح قيد عند قرب انتهاء مدة وقف القيد 
def send_suspend_enrollment_notification():
    suspend_requests = frappe.get_all("Suspend Enrollment Request", 
                                      filters={'status': ['not like', '%Reject%'], 'docstatus': 1},
                                      fields=["name", "student", "creation"])

    for request in suspend_requests:
        student_name = frappe.db.get_value("Student", request.student, "first_name")   
        user_id = frappe.db.get_value("Student", request.student, "user_id")
        user_email = frappe.db.get_value("User", user_id, "email")
        target_date = add_minutes(request.creation, 2)

        if target_date <= now_datetime():
            if user_email:
                subject = "Reminder to Resume Enrollment."
                message = f"Dear ({student_name}),<br><br>Your suspension period is about to end in 5 days. Please take the necessary actions to resume your enrollment."

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
 

#دالة انشاء تقرير انجاز للطالب من النظام 
def create_progress_report_and_notify():
    try:
        print("Fetching progress report settings...")
        progress_report_settings = frappe.get_all(
            'Progress Report Settings Child Table',
            filters={'parent': 'PSA Settings', 'parenttype': 'PSA Settings', 'parentfield': 'program_progress_reports'},
            fields=['program_degrees', 'number_of_progress_reports_per_a_program', 'first_progress_report_date_day', 'first_progress_report_date_month']
        )

        today = datetime.today()         

        for setting in progress_report_settings:
            program_degree = setting.get('program_degrees')
            report_dates = []
            day = setting.get('first_progress_report_date_day')
            month = setting.get('first_progress_report_date_month')
            start_date = datetime(today.year, month, day)

            for i in range(int(setting.get('number_of_progress_reports_per_a_program'))):
                report_dates.append(add_months(start_date, i * int(12 / int(setting.get('number_of_progress_reports_per_a_program')))))

            print(f"Report dates calculated: {report_dates}")

            student_supervisors = frappe.get_all('Student Supervisor', filters={'enabled': 1}, fields=['name', 'student', 'program_enrollment', 'supervisor'])
            program_enrollments = frappe.get_all('Program Enrollment', filters={'name': ['in', [ss['program_enrollment'] for ss in student_supervisors]]}, fields=['name', 'program'])
            academic_programs = frappe.get_all('Program Specification', filters={'name': ['in', [pe['program'] for pe in program_enrollments]], 'program_degree': program_degree}, fields=['name'])

            for ss in student_supervisors:
                print(f"Checking supervisor: {ss['supervisor']} for student: {ss['student']}")

                if ss['program_enrollment'] in [pe['name'] for pe in program_enrollments if pe['program'] in [ap['name'] for ap in academic_programs]]:
                    student = frappe.get_doc('Student', ss['student'])
                    user_id = student.user_id
                    user_email = frappe.db.get_value("User", user_id, "email")

                    supervisor_name = ss['supervisor']
                    supervisor_exists = frappe.db.exists('Faculty Member', supervisor_name)
                    print(f"Supervisor exists: {supervisor_exists}")

                    if not supervisor_exists:
                        print(f"Error: Could not find Faculty Member: {supervisor_name}")
                        continue

                    
                    faculty_member = frappe.get_doc('Faculty Member', supervisor_name)
                    supervisor_full_name = f"{faculty_member.faculty_member_name}"
                    print(f"Supervisor Name: {supervisor_full_name}")

                    for report_date in report_dates:
                        if today.date() == report_date.date():
                            print(f"Creating progress report for student: {student.name}, Supervisor: {supervisor_full_name}")
                            progress_report = frappe.get_doc({
                                "doctype": "Progress Report",
                                "student": student.name,
                                "program_enrollment": ss['program_enrollment'],
                                "supervisor": ss['name'],  
                                "supervisor_name": supervisor_full_name, 
                                "student_report_period":"text",
                                "report_date": today,
                                "from_date": today - timedelta(days=90),
                                "to_date": today,
                                "status": "Unsatisfied"
                            })
                            progress_report.insert(ignore_permissions=True)
                            print(f"Progress report created: {progress_report.name}")

                            if user_email:
                                subject = "New Progress Report Created"
                                message = f"Dear {student.first_name},<br><br>A new progress report has been created. Please fill it by the end of the period.<br>Report Link: {frappe.utils.get_url_to_form('Progress Report', progress_report.name)}"
                                print(f"Sending email to {user_email} with subject: {subject}")
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
                                print(f"Notification log created for user: {user_id}")

        frappe.db.commit()
        print("All changes committed successfully.")

    except Exception as e:
        frappe.log_error(f"Failed to create notification log for progress report: {str(e)}")
        print(f"Error: {str(e)}")


#دالة لإشعار المشرف اذا لم يرسل الطالب له بالتقرير بالمدة المحددة
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
        academic_programs = frappe.get_all('Program Specification', filters={'name': ['in', [pe['program'] for pe in program_enrollments]], 'program_degree': program_degree}, fields=['name'])

        # الطلاب الذين يطابقون الفلترة
        filtered_student_supervisors = [ss for ss in student_supervisors if ss['program_enrollment'] in [pe['name'] for pe in program_enrollments if pe['program'] in [ap['name'] for ap in academic_programs]]]
        filtered_student_names = [ss['student'] for ss in filtered_student_supervisors]

        students = frappe.get_all('Student', filters={'name': ['in', filtered_student_names]}, fields=['name', 'user_id', 'first_name'])

        for student in students:
            student_name = student['name']
            user_id = student['user_id']
            student_doc_first_name = student['first_name']
            
            # نفلتر المشرف من قائمة Student Supervisor المرتبط بالطالب
            supervisor_info = next((ss for ss in filtered_student_supervisors if ss['student'] == student_name), None)
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
def get_supervisor_for_student(student,program_enrollment):
    supervisor = frappe.db.get_value("Student Supervisor", {"student": student,"program_enrollment" :program_enrollment, "enabled": 1, "type": "Main Supervisor"}, "supervisor")
    if supervisor:
        supervisor_name = frappe.db.get_value("Faculty Member", supervisor, "name")
        return supervisor_name
    return None




def on_submit(doc, method):
    send_report_to_supervisor(doc.name)

#دالة لارسال التقرير للمشرف 
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
    supervisor_first_name = frappe.db.get_value('Employee', employee_id, 'first_name')
    supervisor_email = frappe.db.get_value('User', supervisor_user_id, 'email')

    if not supervisor_email:
        frappe.throw('Supervisor does not have a valid email address.')

    pdf_content = get_pdf(frappe.get_print('Progress Report', report_name, print_format='Custom Progress Report'))
    filename = f'{report_name}.pdf'
    filedoc = save_file(filename, pdf_content, 'Progress Report', report_name, is_private=1)

    student_first_name = frappe.db.get_value('Student', report.student, 'first_name')

    subject = f'Progress Report for {student_first_name}'
    message = f'Dear {supervisor_first_name },<br><br>Please find the attached progress report for the student {student_first_name}.<br><br><a href="{get_url_to_form("Progress Report", report_name)}">View Report</a>'

    frappe.sendmail(
        recipients=[supervisor_email],
        subject=subject,
        message=message,
        attachments=[{'fname': filename, 'fcontent': pdf_content}],
        now=True
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



def on_update_after_submit(doc, method):
    print("on_update_after_submit called for Progress Report:", doc.name)
    if doc.satisfaction_status == 'Unsatisfied':
        print("Satisfaction status is Unsatisfied")
        notify_student_unsatisfied(doc)

    else:
         print("Satisfaction status is satisfied")
         notify_student_satisfied(doc)

#تتنفذ اذا كان المشرف غير راضي عن تقرير الانجاز للطالب
def notify_student_unsatisfied(report):
    
    student = frappe.get_doc('Student', report.student)
    user_id = student.user_id
    user_email = frappe.db.get_value("User", user_id, "email")
    
    print(f"Preparing to send notification to {student.first_name} ({user_email})")

    
    if user_email:
        subject = "Supervisor is not satisfied with your progress report"
        message = f"Dear {student.first_name},<br><br>Your supervisor is not satisfied with your recent progress report. Please review the feedback and take the necessary actions.<br>Report Link: {get_url_to_form('Progress Report', report.name)}"
        
        frappe.sendmail(recipients=[user_email], subject=subject, message=message, now=True)
        
        notification_doc = frappe.get_doc({
            "doctype": "Notification Log",
            "subject": subject,
            "email_content": message,
            "type": "Alert",
            "document_type": "Progress Report",
            "document_name": report.name,
            "from_user": frappe.session.user,
            "for_user": user_id,
        })
        notification_doc.insert(ignore_permissions=True)
        print(f"Notification sent to student: {student.first_name} for report: {report.name}")
    else:
        print(f"No email found for student: {student.first_name}")


#تتنفذ لتخبر الطالب اذا كان المشرف راضي عن تقرير الانجاز
def notify_student_satisfied(report):
    
    student = frappe.get_doc('Student', report.student)
    user_id = student.user_id
    user_email = frappe.db.get_value("User", user_id, "email")
    
    print(f"Preparing to send notification to {student.first_name} ({user_email})")

    
    if user_email:
        subject = "Supervisor is satisfied with your progress report"
        message = f"Dear {student.first_name},<br><br>Your supervisor is  satisfied with your recent progress report. Please review the feedback and take the necessary actions.<br>Report Link: {get_url_to_form('Progress Report', report.name)}"
        
        frappe.sendmail(recipients=[user_email], subject=subject, message=message, now=True)
        
        notification_doc = frappe.get_doc({
            "doctype": "Notification Log",
            "subject": subject,
            "email_content": message,
            "type": "Alert",
            "document_type": "Progress Report",
            "document_name": report.name,
            "from_user": frappe.session.user,
            "for_user": user_id,
        })
        notification_doc.insert(ignore_permissions=True)
        print(f"Notification sent to student: {student.first_name} for report: {report.name}")
    else:
        print(f"No email found for student: {student.first_name}")



 

#تتنفذ عند تغيير مشرف رئيسي او مساعد 
@frappe.whitelist()
def notify_on_supervisor_change(doc, method):
    try:
        # تحقق من قيمة الحقل reference_doctype
        if doc.reference_doctype not in ["Change Research Co Supervisor Request", "Change Research Main Supervisor Request"]:
            return 

        student = doc.student
        program_enrollment = doc.program_enrollment

        new_supervisor_id = frappe.db.get_value(
            "Student Supervisor",
            {"student": student, "program_enrollment": program_enrollment, "enabled": 1},
            "supervisor"
        )
        if not new_supervisor_id:
            raise ValueError("No new supervisor found.")
        print(f"New Supervisor ID: {new_supervisor_id}")

        previous_supervisor_id = doc.pervious_supervisor
        print(f"Previous Supervisor ID: {previous_supervisor_id}")

        student_doc = frappe.get_doc('Student', student)
        student_user_id = student_doc.user_id
        student_email = frappe.db.get_value("User", student_user_id, "email")
        student_name = student_doc.first_name

        print(f"Student Email: {student_email}")

        if new_supervisor_id:
            employee_id = frappe.db.get_value('Faculty Member', new_supervisor_id, 'employee')
            new_supervisor_user_id = frappe.db.get_value('Employee', employee_id, 'user_id')
            new_supervisor_name = frappe.db.get_value('Employee', employee_id, 'first_name')
            new_supervisor_email = frappe.db.get_value('User', new_supervisor_user_id, 'email')

            print(f"New Supervisor Name: {new_supervisor_name}")
            print(f"New Supervisor Email: {new_supervisor_email}")

        if previous_supervisor_id:
            previous_supervisor_doc = frappe.get_doc("Student Supervisor", previous_supervisor_id)
            previous_supervisor = previous_supervisor_doc.supervisor
            if not previous_supervisor:
                raise ValueError("No supervisor found for previous supervisor ID.")
            previous_employee_id = frappe.db.get_value('Faculty Member', previous_supervisor, 'employee')
            previous_supervisor_user_id = frappe.db.get_value('Employee', previous_employee_id, 'user_id')
            previous_supervisor_name = frappe.db.get_value('Employee', previous_employee_id, 'first_name')
            previous_supervisor_email = frappe.db.get_value('User', previous_supervisor_user_id, 'email')

            print(f"Previous Supervisor Name: {previous_supervisor_name}")
            print(f"Previous Supervisor Email: {previous_supervisor_email}")

            if previous_supervisor_email:
                previous_supervisor_subject = "Change of Supervision"
                previous_supervisor_message = f"Dear {previous_supervisor_name},<br><br>You have been removed as the supervisor for student {student_name}.<br>Best regards,<br>PSA Administration"
                
                frappe.sendmail(recipients=[previous_supervisor_email],
                                subject=previous_supervisor_subject,
                                message=previous_supervisor_message,
                                now=True)
                
                previous_supervisor_notification = frappe.get_doc({
                    "doctype": "Notification Log",
                    "subject": previous_supervisor_subject,
                    "email_content": previous_supervisor_message,
                    "type": "Alert",
                    "document_type": "Student Supervisor",
                    "document_name": doc.name,
                    "from_user": frappe.session.user,
                    "for_user": previous_supervisor_user_id,
                })
                previous_supervisor_notification.insert(ignore_permissions=True)
            else:
                print("Previous Supervisor Email is missing.")
        else:
            print("Previous Supervisor ID is missing.")

        if student_email:
            student_subject = "Approval of Supervisor Change"
            student_message = f"Dear {student_name},<br><br>Your request to change supervisor has been approved. Your new supervisor is {new_supervisor_name}.<br>Best regards,<br>PSA Administration"
            
            frappe.sendmail(recipients=[student_email],
                            subject=student_subject,
                            message=student_message,
                            now=True)
            
            student_notification = frappe.get_doc({
                "doctype": "Notification Log",
                "subject": student_subject,
                "email_content": student_message,
                "type": "Alert",
                "document_type": "Student Supervisor",
                "document_name": doc.name,
                "from_user": frappe.session.user,
                "for_user": student_user_id,
            })
            student_notification.insert(ignore_permissions=True)

        if new_supervisor_email:
            new_supervisor_subject = "New Supervision Assignment"
            new_supervisor_message = f"Dear {new_supervisor_name},<br><br>You have been assigned as the supervisor for student {student_name}.<br>Best regards,<br>PSA Administration"
            
            frappe.sendmail(recipients=[new_supervisor_email],
                            subject=new_supervisor_subject,
                            message=new_supervisor_message,
                            now=True)
            
            new_supervisor_notification = frappe.get_doc({
                "doctype": "Notification Log",
                "subject": new_supervisor_subject,
                "email_content": new_supervisor_message,
                "type": "Alert",
                "document_type": "Student Supervisor",
                "document_name": doc.name,
                "from_user": frappe.session.user,
                "for_user": new_supervisor_user_id,
            })
            new_supervisor_notification.insert(ignore_permissions=True)

        frappe.db.commit()
        print("Notifications sent successfully.")

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "notify_on_supervisor_change Error")
        print(f"Error: {e}")



#تتنفذ عند تغيير العنوان 
@frappe.whitelist()
def notify_student_on_research_title_change(doc,method=None):
    try:
        if isinstance(doc, str):
            research_doc = frappe.get_doc("Student Research", doc)
        else:
            research_doc = doc

        # تحقق من قيمة الحقل reference_doctype
        if research_doc.reference_doctype != "Change Research Title Request":
            return   

        student_id = research_doc.student
        student_doc = frappe.get_doc('Student', student_id)
        student_user_id = student_doc.user_id
        student_email = frappe.db.get_value("User", student_user_id, "email")
        student_name = student_doc.first_name

        previous_proposal_id = research_doc.pervious_proposal
        previous_proposal_title_english = None
        previous_proposal_title_arabic = None
        if previous_proposal_id:
            previous_proposal_doc = frappe.get_doc("Student Research", previous_proposal_id)
            previous_proposal_title_english = previous_proposal_doc.research_title_english
            previous_proposal_title_arabic = previous_proposal_doc.research_title_arabic

        new_research_title_english = research_doc.research_title_english
        new_research_title_arabic = research_doc.research_title_arabic

        if student_email:
            subject = "Approval of Research Title Change"
            message = f"""Dear {student_name},<br><br>
                          Your request to change the research title has been approved.<br>
                          Previous Research Title (English): {previous_proposal_title_english if previous_proposal_title_english else "N/A"}<br>
                          Previous Research Title (Arabic): {previous_proposal_title_arabic if previous_proposal_title_arabic else "N/A"}<br>
                          New Research Title (English): {new_research_title_english}<br>
                          New Research Title (Arabic): {new_research_title_arabic}<br><br>
                          Best regards,<br>
                          PSA Administration"""

            frappe.sendmail(recipients=[student_email],
                            subject=subject,
                            message=message,
                            now=True)

            notification_log = frappe.get_doc({
                "doctype": "Notification Log",
                "subject": subject,
                "email_content": message,
                "type": "Alert",
                "document_type": "Student Research",
                "document_name": doc_name,
                "from_user": frappe.session.user,
                "for_user": student_user_id,
            })
            notification_log.insert(ignore_permissions=True)

        frappe.db.commit()
        print("Notification sent successfully.")

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "notify_student_on_research_title_change Error")
        print(f"Error: {e}")



 
#دالة للتحقق من النصاب للمشرف الرئيسي 
@frappe.whitelist()
def get_supervisor_main_workload():
    faculty_members_data = {}
    supervisor_limit_exceeded = []

    supervisor_docs = get_all(
        'Student Supervisor', 
        filters={'enabled': 1, 'status': 'Active', 'type': 'Main Supervisor'}, 
        fields=['supervisor', 'program_enrollment', 'student']
    )

    for supervisor_doc in supervisor_docs:
        supervisor_id = supervisor_doc.get('supervisor')
        student_name = supervisor_doc.get('student')

        if not supervisor_id:
            print(f"Warning: No supervisor ID found for document with student {student_name}")
            continue

        # هنا نحاول اخذ بيانات الفاكيوليتي ممبر من حقه الدوكتايب
        try:
            faculty_member_doc = get_doc('Faculty Member', supervisor_id)
        except DoesNotExistError:
            print(f"Warning: No faculty member document found for ID {supervisor_id}")
            continue

        supervisor_name = getattr(faculty_member_doc, 'faculty_member_name', None)

        if not supervisor_name:
            print(f"Warning: No faculty member name found for ID {supervisor_id}")
            continue

        if supervisor_id not in faculty_members_data:
            faculty_members_data[supervisor_id] = {
                'name': supervisor_name,
                'student_count': 0,
                'students': set()  # استخدام set() لضمان عدم تكرار أسماء الطلاب
            }

        faculty_members_data[supervisor_id]['student_count'] += 1
        faculty_members_data[supervisor_id]['students'].add(student_name)

    settings = get_doc('PSA Settings', 'PSA Settings')
    number_of_researches_main = settings.number_of_researches_main
    set_limit_on_number_researches = settings.set_limit_on_number_researches_faculty_member_co_supervisor

    if set_limit_on_number_researches:
        for supervisor_id, data in faculty_members_data.items():
            if data['student_count'] >= number_of_researches_main:
                supervisor_limit_exceeded.append(supervisor_id)

    result = []
    for supervisor_id, data in faculty_members_data.items():
        if not set_limit_on_number_researches or supervisor_id not in supervisor_limit_exceeded:
            result.append({
                'supervisor_id': supervisor_id,
                'supervisor_name': data['name'],
                'student_count': data['student_count'],
                'students': list(data['students'])
            })

    return result, supervisor_limit_exceeded


#دالة للتحقق من النصاب للمشرف المساعد
@frappe.whitelist()
def get_supervisor_co_workload():
    faculty_members_data = {}
    supervisor_limit_exceeded = []

    supervisor_docs = get_all(
        'Student Supervisor', 
        filters={'enabled': 1, 'status': 'Active', 'type': 'Co-Supervisor'}, 
        fields=['supervisor', 'program_enrollment', 'student']
    )

    for supervisor_doc in supervisor_docs:
        supervisor_id = supervisor_doc.get('supervisor')
        student_name = supervisor_doc.get('student')

        if not supervisor_id:
            print(f"Warning: No supervisor ID found for document with student {student_name}")
            continue

        # هنا نحاول اخذ بيانات الفاكيوليتي ممبر من حقه الدوكتايب
        try:
            faculty_member_doc = get_doc('Faculty Member', supervisor_id)
        except DoesNotExistError:
            print(f"Warning: No faculty member document found for ID {supervisor_id}")
            continue

        supervisor_name = getattr(faculty_member_doc, 'faculty_member_name', None)

        if not supervisor_name:
            print(f"Warning: No faculty member name found for ID {supervisor_id}")
            continue

        if supervisor_id not in faculty_members_data:
            faculty_members_data[supervisor_id] = {
                'name': supervisor_name,
                'student_count': 0,
                'students': set()  # استخدام set() لضمان عدم تكرار أسماء الطلاب
            }

        faculty_members_data[supervisor_id]['student_count'] += 1
        faculty_members_data[supervisor_id]['students'].add(student_name)

    settings = get_doc('PSA Settings', 'PSA Settings')
    number_of_researches_co = settings.number_of_researches_co
    set_limit_on_number_researches = settings.set_limit_on_number_researches_faculty_member_main_supervisor

    if set_limit_on_number_researches:
        for supervisor_id, data in faculty_members_data.items():
            if data['student_count'] >= number_of_researches_co:
                supervisor_limit_exceeded.append(supervisor_id)

    result = []
    for supervisor_id, data in faculty_members_data.items():
        if not set_limit_on_number_researches or supervisor_id not in supervisor_limit_exceeded:
            result.append({
                'supervisor_id': supervisor_id,
                'supervisor_name': data['name'],
                'student_count': data['student_count'],
                'students': list(data['students'])
            })

    return result, supervisor_limit_exceeded
