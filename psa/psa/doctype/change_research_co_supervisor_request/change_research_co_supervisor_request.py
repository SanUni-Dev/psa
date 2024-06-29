# Copyright (c) 2024, Sana'a university and contributors
# For license information, please see license.txt

import frappe, json
from frappe.model.document import Document
from frappe import _
from psa.api.psa_utils import check_active_request, check_program_enrollment_status

class ChangeResearchCoSupervisorRequest(Document):
	def on_submit(self):
		program_enrollment = frappe.get_doc('Program Enrollment', self.program_enrollment)
		if program_enrollment.status != "Continued":
			frappe.throw(_("Failed! Student is {0}!".format(program_enrollment.status)))


	def before_insert(self):
		program_enrollment_status = check_program_enrollment_status(self.program_enrollment, ['Continued'], ['Suspended', 'Withdrawn', 'Graduated', 'Transferred'])
		if not program_enrollment_status[0]:
			frappe.throw(_("Can't add a change research co-supervisor request, because current status is {0}!").format(program_enrollment_status[1]))
		elif program_enrollment_status[0]:
			set_a_limit_on_the_number_of_change_co_supervisor_requests = frappe.db.get_single_value('PSA Settings', 'set_a_limit_on_the_number_of_change_co_supervisor_requests')
			change_co_number_of_requests = frappe.db.get_single_value('PSA Settings', 'change_co_number_of_requests')

			if set_a_limit_on_the_number_of_change_co_supervisor_requests:
				student_program_change_supervisor_requests = frappe.get_all('Change Research Co Supervisor Request', filters={'program_enrollment': self.program_enrollment}, fields=['*'])
				count_of_allowed = 0

				for request in student_program_change_supervisor_requests:
					if request.docstatus == 1:
						count_of_allowed += 1
						if count_of_allowed >= change_co_number_of_requests:
							frappe.throw(_("Can't add a change research co-supervisor request, because you have been Changed! (Max of allowed change research co-supervisor request = {0})").format(str(change_co_number_of_requests)))			

			check_active_requests_before_insert = frappe.db.get_single_value('PSA Settings', 'check_active_requests_before_insert')
			if check_active_requests_before_insert:
				active_request = check_active_request(self.student, self.program_enrollment, ["Change Research Co Supervisor Request", "Suspend Enrollment Request", "Continue Enrollment Request", "Withdrawal Request"])
				if active_request:
					url_of_active_request = '<a href="/app/{0}/{1}" title="{2}">{3}</a>'.format((active_request[0]).lower().replace(" ", "-"), active_request[1]['name'], _("Click here to show request details"), active_request[1]['name'])
					frappe.throw(
						_("Can't add a change research co-supervisor request, because you have an active {0} ({1}) that is {2}!").format(active_request[0], url_of_active_request, active_request[1]['status'])
					)
