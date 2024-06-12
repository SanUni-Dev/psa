import frappe, json


@frappe.whitelist()
def get_student_for_current_user():
    user = frappe.session.user
    student = frappe.get_value("Student", {"user_id": user}, "name")
    return student


@frappe.whitelist()
def get_program_enrollment_for_current_user():
    student = get_student_for_current_user()
    program_enrollment = frappe.get_value("Program Enrollment", {"student": student, "enabled": 1}, "name")
    return program_enrollment


@frappe.whitelist()
def get_program_enrollment_for_student(student):
    program_enrollment = frappe.get_value("Program Enrollment", {"student": student, "enabled": 1}, "name")
    return program_enrollment


@frappe.whitelist()
def get_url_to_new_form(doctype_name):
    return frappe.utils.get_url_to_form(doctype_name, "new")


@frappe.whitelist()
def get_current_workflow_role(doctype_workflow_name, current_status):
	doc = frappe.get_doc('Workflow', doctype_workflow_name)
	states = doc.states
	for state in states:
		if state.state == current_status:
			return state.allow_edit


@frappe.whitelist()
def insert_new_timeline_child_table(doctype_name, doc_name, timeline_child_table_name, dictionary_of_values):
	try:
		if dictionary_of_values:
			dictionary = json.loads(dictionary_of_values)
			
			doc = frappe.get_doc(doctype_name, doc_name)
			new_row = doc.append(timeline_child_table_name, {})

			new_row.position = dictionary['position']
			new_row.full_name = dictionary['full_name']
			new_row.previous_status = dictionary['previous_status']
			new_row.received_date = dictionary['received_date']
			new_row.action = dictionary['action']
			new_row.next_status = dictionary['next_status']
			new_row.action_date = dictionary['action_date']

			doc.save()
			return True
		else:
			frappe.throw("Error: dictionary_of_values is empty!")
	except Exception as e:
		frappe.throw(f"An error occurred: {str(e)}")


@frappe.whitelist()
def get_active_request(doctype_name, program_enrollment):
	query = """
       SELECT *
       FROM `tab{0}`
       WHERE (`status` LIKE %s OR `status` LIKE %s)
           AND `program_enrollment` = %s
       ORDER BY modified DESC
       LIMIT 1
       """.format(doctype_name)
	docs = frappe.db.sql(query, ("%Pending%", "%Draft%", program_enrollment), as_dict=True)
	return docs[0] if docs else None


@frappe.whitelist()
def get_program_enrollment_status(program_enrollment):
    program_enrollment_status = frappe.get_value("Program Enrollment", {"name": program_enrollment}, "status")
    return program_enrollment_status


@frappe.whitelist()
def check_program_enrollment_status(program_enrollment, accepted_status_list, rejected_status_list):
	status = get_program_enrollment_status(program_enrollment)
	if status in accepted_status_list:
		return True
	elif status in rejected_status_list:
		return False
	else:
		return False


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


@frappe.whitelist()
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
			for doctype in json.loads(doctype_list):
				if doctype in doctype_names:
					active_request_doc = active_request(doctype_name=doctype, student=student, program_enrollment=program_enrollment, docstatus_list=doctype_docstatuses[doctype], status_list=doctype_statuses[doctype])
					if active_request_doc:
						return [doctype, active_request_doc]
					else:
						continue
				else:
					continue

		elif isinstance(doctype_list, list):
			for doctype in json.loads(json.dumps(doctype_list)):
				if doctype in doctype_names:
					active_request_doc = active_request(doctype_name=doctype, student=student, program_enrollment=program_enrollment, docstatus_list=doctype_docstatuses[doctype], status_list=doctype_statuses[doctype])
					if active_request_doc:
						return [doctype, active_request_doc]
					else:
						continue
				else:
					continue

	except Exception as e:
		frappe.throw(f"An error occurred: {str(e)}")


@frappe.whitelist()
def get_active_change_request(doctype_name, program_enrollment):
	query = """
       SELECT *
       FROM `tab{0}`
       WHERE (`docstatus` = 0)
           AND `program_enrollment` = %s
       ORDER BY modified DESC
       LIMIT 1
       """.format(doctype_name)
	docs = frappe.db.sql(query, (program_enrollment), as_dict=True)
	return docs[0] if docs else None



@frappe.whitelist()
def get_scientific_degree(scientific_degree):
	query = """
	select fm.name from
		`tabFaculty Member Scientific Qualification` as fmsq
		join `tabFaculty Member` as fm
		on fmsq.parent = fm.name
		where fmsq.scientific_degree = %s;
	"""
	docs = frappe.db.sql(query, (scientific_degree), as_dict=True)
	return docs if docs else None


# Function to save timeline child table rows (before fixing it by check "In List View" in Timeline Child Table's fields)
# @frappe.whitelist()
# def save_timeline_child_table(doctype_name, doc_name, timeline_child_table_name, timeline_child_table_list):
# 	try:
# 		if timeline_child_table_list:
# 			doc = frappe.get_doc(doctype_name, doc_name)

# 			formated_timeline_child_table_list = json.loads(timeline_child_table_list)
			
# 			for row in formated_timeline_child_table_list:
# 				new_row = doc.append(timeline_child_table_name, {})
				
# 				new_row.position = row['position']
# 				new_row.full_name = row['full_name']
# 				new_row.previous_status = row['previous_status']
# 				new_row.received_date = row['received_date']
# 				new_row.action = row['action']
# 				new_row.next_status = row['next_status']
# 				new_row.action_date = row['action_date']

# 			doc.save()
# 			return True
# 		else:
# 			frappe.throw("Error: timeline_child_table_list is empty!")
# 	except Exception as e:
# 		frappe.throw(f"An error occurred: {str(e)}")
