# api.py
import frappe
from frappe import _
from frappe import auth
import json



@frappe.whitelist(allow_guest=True)
def login_and_get_session(user, password):
    # Perform login
    try:
        frappe.local.login_manager.authenticate(user, password)
        frappe.local.login_manager.post_login()
        
        # Retrieve session information
        session_id = frappe.local.session.sid
        user_info = {
            'user': frappe.local.session.user,
            'full_name': frappe.get_value('User', frappe.local.session.user, 'full_name'),
            'email': frappe.get_value('User', frappe.local.session.user, 'email'),
            'session_id': session_id
        }
        return {"status": "success", "session_info": user_info}
    except Exception as e:
        return {"status": "error", "message": str(e)}




@frappe.whitelist(allow_guest=False)
def get_student_for_current_user():
    user = frappe.session.user
    student_id = frappe.get_value('Student', {'user_id': user}, 'name')
    return {"message": student_id}




@frappe.whitelist(allow_guest=True)
def login(usr, pwd):
    try:
        login_manager = frappe.auth.LoginManager()
        login_manager.authenticate(user=usr, pwd=pwd)
        login_manager.post_login()
    except frappe.exceptions.AuthenticationError:
        frappe.clear_messages()
        frappe.local.response["message"] = {
            "success_key": 0,
            "message": "Authentication Error!"
        }
        return

    api_generate = generate_keys(frappe.session.user)
    user = frappe.get_doc('User', frappe.session.user)

    # الحصول على معرف الطالب المرتبط باليوزر
    student_id = frappe.get_value('Student', {'user_id': frappe.session.user}, 'name')
    program_enrollment = frappe.get_value("Program Enrollment", {"student": student_id, "enabled": 1}, "name")

    # طباعة معرف الطالب في الكونسول
    if student_id:
        print(f"Student ID: {student_id}")
    else:
        print("No student ID associated with this user.")

    frappe.response["message"] = {
        "success_key": 1,
        "message": "Authentication success",
        "sid": frappe.session.sid,
        "api_key": user.api_key,
        "api_secret": api_generate,
        "username": user.full_name,
        "email": user.email,
        "student_id": student_id,  #   إضافة معرف الطالب    
        "program_enrollment":program_enrollment
    }

def generate_keys(user):
    user_details = frappe.get_doc('User', user)
    api_secret = frappe.generate_hash(length=15)

    if not user_details.api_key:
        api_key = frappe.generate_hash(length=15)
        user_details.api_key = api_key

    user_details.api_secret = api_secret
    user_details.save()

    return api_secret




@frappe.whitelist(allow_guest=True)
def get_program_enrollment_for_student(student):
    program_enrollment = frappe.get_value("Program Enrollment", {"student": student, "enabled": 1}, "name")
    return program_enrollment





@frappe.whitelist()
def get_program_enrollment_status(program_enrollment):
    program_enrollment_status = frappe.get_value("Program Enrollment", {"name": program_enrollment}, "status")
    return program_enrollment_status


@frappe.whitelist()
def check_program_enrollment_status(program_enrollment, accepted_status_list, rejected_status_list):
	status = get_program_enrollment_status(program_enrollment)
	if status in accepted_status_list:
		return [True, status]
	elif status in rejected_status_list:
		return [False, status]
	else:
		return [False, status]




@frappe.whitelist()
def active_request(doctype_name, student, program_enrollment, docstatus_list, status_list):
	try:
		fields = "SELECT {0} ".format("*")
		doctype = "FROM `tab{0}` ".format(doctype_name)
		where = "WHERE `student` = '{0}' AND `program_enrollment` = '{1}' ".format(student, program_enrollment)
		if docstatus_list:
			where_docstatus = ""
			for docstatus in docstatus_list:
				if where_docstatus != "":
					where_docstatus = where_docstatus + " OR `docstatus` = " + str(docstatus)
				else:
					where_docstatus = "`docstatus` = " + str(docstatus)
			where = where + "AND ({0}) ".format(where_docstatus)
		if status_list:
			where_status = ""
			for status in status_list:
				if where_status:
					where_status += " OR `status` LIKE '%{0}%'".format(status)
				else:
					where_status += "`status` LIKE '%{0}%'".format(status)
			where += "AND ({0}) ".format(where_status)
		query = fields + doctype + where + "ORDER BY modified DESC LIMIT 1"
		docs = frappe.db.sql(query, as_dict=True)
		return docs[0] if docs else None
	except Exception as e:
		frappe.throw(f"An error occurred: {str(e)}")


 

@frappe.whitelist(allow_guest=True)
def check_active_request(student, program_enrollment, doctype_list):
    try:
        doctype_names = [
            "Suspend Enrollment Request",
            "Continue Enrollment Request",
            "Withdrawal Request",
            "Change Research Title Request",
            "Change Research Main Supervisor Request",
            "Change Research Co Supervisor Request",
            "Initial Discussion Request",
            "Extension Request"
        ]

        doctype_docstatuses = {
            "Suspend Enrollment Request": [0],
            "Continue Enrollment Request": [0],
            "Withdrawal Request": [0],
            "Change Research Title Request": [0],
            "Change Research Main Supervisor Request": [0],
            "Change Research Co Supervisor Request": [0],
            "Initial Discussion Request": [0],
            "Extension Request": [0]
        }

        doctype_statuses = {
            "Suspend Enrollment Request": ["Draft", "Pending"],
            "Continue Enrollment Request": ["Draft", "Pending"],
            "Withdrawal Request": ["Draft", "Pending"],
            "Change Research Title Request": ["Draft", "Pending"],
            "Change Research Main Supervisor Request": ["Draft", "Pending"],
            "Change Research Co Supervisor Request": ["Draft", "Pending"],
            "Initial Discussion Request": ["Draft", "Pending"],
            "Extension Request": ["Draft", "Pending"]
        }

        if isinstance(doctype_list, str):
            doctype_list = json.loads(doctype_list)
        
        results = []
        if isinstance(doctype_list, list):
            for doctype in doctype_list:
                if doctype in doctype_names:
                    active_request_doc = active_request(doctype_name=doctype, student=student, program_enrollment=program_enrollment, docstatus_list=doctype_docstatuses[doctype], status_list=doctype_statuses[doctype])
                    if active_request_doc:
                        results.append([doctype, active_request_doc])
        
        return results

    except Exception as e:
        frappe.log_error(f"An error occurred: {str(e)}", "Check Active Request Error")
        return {"error": str(e)}
