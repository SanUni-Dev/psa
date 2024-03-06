# Copyright (c) 2024, Sana'a university and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe import _


class SuspendEnrollmentRequest(Document):
	def before_insert(self):
		count_of_allowed_requests = 2
		program_enrollment_status = frappe.get_doc('Program Enrollment', self.program_enrollment)
		if(program_enrollment_status.status == "Suspended"):
			url_of_continue_enrollment_request = frappe.utils.get_url_to_list('Continue Enrollment Request')
			frappe.throw(_("You can't add a suspend enrollment request, because you are suspended!") + "<br><br><a href='" + url_of_continue_enrollment_request + "'>" + _('Do you want to add a continue enrollment request?') + "</a>")
		elif(program_enrollment_status.status == "Withdrawn"):
			frappe.throw(_("You can't add a suspend enrollment request, because you are withdrawn!"))
		student_program_suspend_requests = frappe.get_all('Suspend Enrollment Request', filters={'program_enrollment': self.program_enrollment}, fields=['*'])
		count_of_rejected = 0
		for request in student_program_suspend_requests:
			if(
				request.status == "Approved by College Council" or
				request.status == "Approved by College Dean"
			):
				frappe.throw(_("You can't add a suspend enrollment request, because you have been suspended!"))
			elif(
				request.status == "Rejected by Vice Dean for GSA" or
				request.status == "Rejected by Department Head" or
				request.status == "Rejected by Department Council" or
				request.status == "Rejected by College Dean" or
				request.status == "Rejected by College Council"
			):
				count_of_rejected = count_of_rejected + 1
				if(count_of_rejected >= count_of_allowed_requests):
					frappe.throw(_("You can't add a suspend enrollment request, because you requested more than limit(") + count_of_allowed_requests + _(") requests!"))
			elif(request.status != "Draft"):
				frappe.throw(_("You can't add a suspend enrollment request, because you have active request that is pending approval!"))

