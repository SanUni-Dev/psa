# Copyright (c) 2024, Sana'a university and contributors
# For license information, please see license.txt

import frappe, json
from frappe.model.document import Document
from frappe import _


class ContinueEnrollmentRequest(Document):
	def on_submit(self):
		program_enrollment = frappe.get_doc('Program Enrollment', self.program_enrollment)
		if(program_enrollment.status == "Suspended"):
			if("Rejected" in self.status):
				if(not self.rejection_reason):
					frappe.throw(_("Please enter reason of rejection!"))
			else:
				program_enrollment.status = "Continued"
				program_enrollment.save()


	def before_insert(self):
		program_enrollment_status = frappe.get_doc('Program Enrollment', self.program_enrollment)
		if(program_enrollment_status.status == "Continued"):
			url_of_suspend_enrollment_request = frappe.utils.get_url_to_form('Suspend Enrollment Request', "new")
			frappe.throw(_("Can't add a continue enrollment request, because current status is continued!") + "<br><br><a href='" + url_of_suspend_enrollment_request + "'>" + _('Do you want to add a suspend enrollment request?') + "</a>")
		elif(program_enrollment_status.status == "Withdrawn"):
			frappe.throw(_("Can't add a continue enrollment request, because current status is withdrawn!"))
		# last_approved_suspend_enrollment_request = frappe.get_doc("Suspend Enrollment Request", self.suspended_request_number)


	@frappe.whitelist(allow_guest=True)
	def get_last_approved_suspend_enrollment_request(self, program_enrollment):
		docs = frappe.get_all("Suspend Enrollment Request",
			fields=["*"],
			filters={
				"status": ["like", "%Approved%"],
				"program_enrollment": program_enrollment
			},
			order_by="modified DESC",
			limit_page_length=1
		)
		return docs[0] if docs else None


	# @frappe.whitelist()
	# def set_multiple_status(names, status):
	# 	names = json.loads(names)
	# 	for name in names:
	# 		sus = frappe.get_doc("Suspend Enrollment Request", name)
	# 		sus.status = status
	# 		sus.save()