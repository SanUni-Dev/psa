# Copyright (c) 2024, Sana'a university and contributors
# For license information, please see license.txt

import frappe, json
from frappe.model.document import Document
from frappe import _


class SuspendEnrollmentRequest(Document):

	def on_submit(self):
		program_enrollment = frappe.get_doc('Program Enrollment', self.program_enrollment)
		if(program_enrollment.status == "Continued"):
			if("Rejected" in self.status):
				if(not self.rejection_reason):
					frappe.throw(_("Please enter reason of rejection!"))
			else:
				program_enrollment.status = "Suspended"
				program_enrollment.save()

	def before_insert(self):
		set_a_limit_of_rejected_suspend_requests = frappe.db.get_single_value('PSA Settings', 'set_a_limit_of_rejected_suspend_requests')
		number_of_rejected_suspend_requests = frappe.db.get_single_value('PSA Settings', 'number_of_rejected_suspend_requests')

		set_a_limit_of_suspend_requests = frappe.db.get_single_value('PSA Settings', 'set_a_limit_of_suspend_requests')
		number_of_suspend_requests = frappe.db.get_single_value('PSA Settings', 'number_of_suspend_requests')
		
		
		program_enrollment_status = frappe.get_doc('Program Enrollment', self.program_enrollment)

		if(program_enrollment_status.status == "Suspended"):
			url_of_continue_enrollment_request = frappe.utils.get_url_to_list('Continue Enrollment Request')
			frappe.throw(_("You can't add a suspend enrollment request, because you are suspended!") + "<br><br><a href='" + url_of_continue_enrollment_request + "'>" + _('Do you want to add a continue enrollment request?') + "</a>")
		
		elif(program_enrollment_status.status == "Withdrawn"):
			frappe.throw(_("You can't add a suspend enrollment request, because you are withdrawn!"))
		
		student_program_suspend_requests = frappe.get_all('Suspend Enrollment Request', filters={'program_enrollment': self.program_enrollment}, fields=['*'])
		count_of_allowed = 0
		count_of_rejected = 0

		for request in student_program_suspend_requests:
			if(
				request.status == "Approved by College Council" or
				request.status == "Approved by College Dean"
			):
				if(set_a_limit_of_suspend_requests):
					count_of_allowed = count_of_allowed + 1
					if(count_of_allowed >= number_of_suspend_requests):
						frappe.throw(_("You can't add a suspend enrollment request, because you have been suspended! (Max of allowed suspend enrollment requests = ") + str(number_of_suspend_requests) + ")")
			elif(
				request.status == "Rejected by Vice Dean for GSA" or
				request.status == "Rejected by Department Head" or
				request.status == "Rejected by Department Council" or
				request.status == "Rejected by College Dean" or
				request.status == "Rejected by College Council"
			):
				if(set_a_limit_of_rejected_suspend_requests):
					count_of_rejected = count_of_rejected + 1
					if(count_of_rejected >= number_of_rejected_suspend_requests):
						frappe.throw(_("You can't add a suspend enrollment request, because you requested more than limit: ") + str(number_of_rejected_suspend_requests) + _(" requests!"))
			elif(
				request.status != "Approval Pending by Vice Dean for GSA" or
				request.status != "Approval Pending by Department Head" or
				request.status != "Approval Pending by Department Council" or
				request.status != "Approval Pending by College Dean" or
				request.status != "Approval Pending by College Council"
			):
				frappe.throw(_("You can't add a suspend enrollment request, because you have active request that is pending approval!"))



	# @frappe.whitelist()
	# def set_multiple_status(names, status):
	# 	names = json.loads(names)
	# 	for name in names:
	# 		sus = frappe.get_doc("Suspend Enrollment Request", name)
	# 		sus.status = status
	# 		sus.save()
