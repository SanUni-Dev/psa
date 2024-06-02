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
