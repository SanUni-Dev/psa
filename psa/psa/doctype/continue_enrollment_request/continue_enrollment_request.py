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
		count_of_allowed_requests = 2
		program_enrollment_status = frappe.get_doc('Program Enrollment', self.program_enrollment)
		if(program_enrollment_status.status == "Continued"):
			url_of_suspend_enrollment_request = frappe.utils.get_url_to_list('Suspend Enrollment Request')
			frappe.throw(_("You can't add a continue enrollment request, because you are continued!") + "<br><br><a href='" + url_of_suspend_enrollment_request + "'>" + _('Do you want to add a suspend enrollment request?') + "</a>")
		elif(program_enrollment_status.status == "Withdrawn"):
			frappe.throw(_("You can't add a continue enrollment request, because you are withdrawn!"))
		student_program_continue_requests = frappe.get_all('Continue Enrollment Request', filters={'program_enrollment': self.program_enrollment}, fields=['*'])
		count_of_rejected = 0
		for request in student_program_continue_requests:
			if(
				request.status == "Approved by Department Head"
			):
				frappe.throw(_("You can't add a continue enrollment request, because you have been continued!"))
			elif(
				request.status == "Rejected by Vice Dean for GSA" or
				request.status == "Rejected by Department Head"
			):
				count_of_rejected = count_of_rejected + 1
				if(count_of_rejected >= count_of_allowed_requests):
					frappe.throw(_("You can't add a continue enrollment request, because you requested more than limit(") + str(count_of_allowed_requests) + _(") requests!"))
			elif(
				request.status != "Approval Pending by Vice Dean for GSA" or
				request.status != "Approval Pending by Department Head"
			):
				frappe.throw(_("You can't add a continue enrollment request, because you have active request that is pending approval!"))

	@frappe.whitelist(allow_guest=True)
	def get_last_approved_suspend_enrollment_request(self, program_enrollment):
		# Query to fetch the last document with status containing "Approved" and matching program_enrollment
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