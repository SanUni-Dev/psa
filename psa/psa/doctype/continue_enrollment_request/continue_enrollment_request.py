# Copyright (c) 2024, Sana'a university and contributors
# For license information, please see license.txt

import frappe, json
from frappe.model.document import Document
from frappe import _
from psa.api.psa_utils import check_active_request, check_program_enrollment_status

class ContinueEnrollmentRequest(Document):
	def on_submit(self):
		program_enrollment = frappe.get_doc('Program Enrollment', self.program_enrollment)
		if program_enrollment.status in ["Suspended"]:
			if "Rejected" in self.status:
				if not self.rejection_reason:
					frappe.throw(_("Please enter reason of rejection!"))
			else:
				program_enrollment.status = "Continued"
				program_enrollment.enabled = 0
				program_enrollment.save()
		elif program_enrollment.status == "Continued":
			frappe.throw(_("Failed! Student is already {0}!").format(program_enrollment.status))
		else:
			frappe.throw(_("Failed! Student is {0}!").format(program_enrollment.status))
		

	def before_insert(self):
		program_enrollment_status = check_program_enrollment_status(self.program_enrollment, ['Suspended'], ['Continued', 'Withdrawn', 'Graduated', 'Transferred'])
		if not program_enrollment_status[0]:
			if program_enrollment_status[1] == "Continued":
				url_of_suspend_enrollment_request = frappe.utils.get_url_to_form('Suspend Enrollment Request', "new")
				frappe.throw(_("Can't add a continue enrollment request, because current status is {0}!").format(program_enrollment_status[1]) + "<br><br><a href='" + url_of_suspend_enrollment_request + "'>" + _('Do you want to add a suspend enrollment request?') + "</a>")
			else:
				frappe.throw(_("Can't add a continue enrollment request, because current status is {0}!").format(program_enrollment_status[1]))
		elif program_enrollment_status[0]:
			# If we need setting for limit of requests, add fields to settings then uncomment the code below:#
			# continue_set_a_limit_on_the_number_of_requests = frappe.db.get_single_value('PSA Settings', 'continue_set_a_limit_on_the_number_of_requests')
			# continue_number_of_requests = frappe.db.get_single_value('PSA Settings', 'continue_number_of_requests')
			
			# continue_set_a_limit_on_the_number_of_rejected_requests = frappe.db.get_single_value('PSA Settings', 'continue_set_a_limit_on_the_number_of_rejected_requests')
			# continue_number_of_rejected_requests = frappe.db.get_single_value('PSA Settings', 'continue_number_of_rejected_requests')
			
			# if continue_set_a_limit_on_the_number_of_requests or continue_set_a_limit_on_the_number_of_rejected_requests:
			# 	student_program_continue_requests = frappe.get_all('Continue Enrollment Request', filters={'program_enrollment': self.program_enrollment, 'student': self.student}, fields=['*'])
			# 	count_of_allowed = 0
			# 	count_of_rejected = 0
				
			# 	for request in student_program_continue_requests:
			# 		if "Approved by" in request.status and continue_set_a_limit_on_the_number_of_requests:
			# 			count_of_allowed += 1
			# 			if count_of_allowed >= continue_number_of_requests:
			# 				frappe.throw(_("Can't add a continue enrollment request, because you have been continued! (Max of allowed continue enrollment requests = {0})").format(str(continue_number_of_requests)))
			# 		elif "Rejected by" in request.status and continue_set_a_limit_on_the_number_of_rejected_requests:
			# 			count_of_rejected += 1
			# 			if count_of_rejected >= continue_number_of_rejected_requests:
			# 				frappe.throw(_("Can't add a continue enrollment request, because you requested more than limit: {0} requests!").format(str(continue_number_of_rejected_requests)))
							
			active_request = check_active_request(self.student, self.program_enrollment, ["Continue Enrollment Request", "Suspend Enrollment Request", "Withdrawal Request"])
			if active_request:
				url_of_active_request = '<a href="/app/{0}/{1}" title="{2}">{3}</a>'.format((active_request[0]).lower().replace(" ", "-"), active_request[1]['name'], _("Click here to show request details"), active_request[1]['name'])
				frappe.throw(
                    _("Can't add a continue enrollment request, because you have an active {0} ({1}) that is {2}!").format(active_request[0], url_of_active_request, active_request[1]['status'])
                )

			# Implement the condition after prepearing the period in academia
			allow_before_end_of_period = frappe.db.get_single_value('PSA Settings', 'allow_before_end_of_period')
			if not allow_before_end_of_period:
				condition = True
				if not condition:
					frappe.throw(
						_("Can't add a continue enrollment request, because your suspend period has not expired!")
					)


	@frappe.whitelist()
	def get_last_approved_suspend_enrollment_request(self, program_enrollment, student):
		docs = frappe.get_all("Suspend Enrollment Request",
			fields=["*"],
			filters={
				"status": ["like", "%Approved%"],
				"program_enrollment": program_enrollment,
				"student": student
			},
			order_by="modified DESC",
			limit_page_length=1
		)
		return docs[0] if docs else None
