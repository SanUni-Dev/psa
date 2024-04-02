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
		elif(program_enrollment.status == "Suspended"):
			frappe.throw(_("Failed! Student is already suspended!"))
		elif(program_enrollment.status == "Withdrawn"):
			frappe.throw(_("Failed! Student is withdrawn!"))


	def before_insert(self):
		program_enrollment_status = frappe.get_doc('Program Enrollment', self.program_enrollment)

		if(program_enrollment_status.status == "Suspended"):
			url_of_continue_enrollment_request = frappe.utils.get_url_to_form('Continue Enrollment Request', "new")
			frappe.throw(_("Can't add a suspend enrollment request, because current status is suspended!") + "<br><br><a href='" + url_of_continue_enrollment_request + "'>" + _('Do you want to add a continue enrollment request?') + "</a>")
		
		elif(program_enrollment_status.status == "Withdrawn"):
			frappe.throw(_("Can't add a suspend enrollment request, because current status is withdrawn!"))

		else:
			set_a_limit_of_suspend_requests = frappe.db.get_single_value('PSA Settings', 'set_a_limit_of_suspend_requests')
			number_of_suspend_requests = frappe.db.get_single_value('PSA Settings', 'number_of_suspend_requests')

			set_a_limit_of_rejected_suspend_requests = frappe.db.get_single_value('PSA Settings', 'set_a_limit_of_rejected_suspend_requests')
			number_of_rejected_suspend_requests = frappe.db.get_single_value('PSA Settings', 'number_of_rejected_suspend_requests')
			
			if(set_a_limit_of_suspend_requests or set_a_limit_of_rejected_suspend_requests):
				student_program_suspend_requests = frappe.get_all('Suspend Enrollment Request', filters={'program_enrollment': self.program_enrollment}, fields=['*'])
				count_of_allowed = 0
				count_of_rejected = 0

				for request in student_program_suspend_requests:
					if(("Approved by" in request.status) and (set_a_limit_of_suspend_requests)):
						count_of_allowed = count_of_allowed + 1
						if(count_of_allowed >= number_of_suspend_requests):
							frappe.throw(_("Can't add a suspend enrollment request, because you have been suspended! (Max of allowed suspend enrollment requests = ") + str(number_of_suspend_requests) + ")")
					elif(("Rejected by" in request.status) and (set_a_limit_of_rejected_suspend_requests)):
						count_of_rejected = count_of_rejected + 1
						if(count_of_rejected >= number_of_rejected_suspend_requests):
							frappe.throw(_("Can't add a suspend enrollment request, because you requested more than limit: ") + str(number_of_rejected_suspend_requests) + _(" requests!"))
			
			active_suspend = self.get_active_request(self.program_enrollment, "Suspend Enrollment Request")
			active_continue = self.get_active_request(self.program_enrollment, "Continue Enrollment Request")
			active_withdrawal = self.get_active_request(self.program_enrollment, "Withdrawal Request")

			if active_suspend:
				url_of_active_suspend_request = '<a href="/app/suspend-enrollment-request/{0}" title="{1}">{2}</a>'.format(active_suspend.name, _("Click here to show request details"), active_suspend.name)
				frappe.throw(
					_("Can't add a suspend enrollment request, because you have an active suspend enrollment request (") +
					url_of_active_suspend_request +
					_(") that is {0}!").format(active_suspend.status)
				)

			elif active_continue:
				url_of_active_continue_request = '<a href="/app/continue-enrollment-request/{0}" title="{1}">{2}</a>'.format(active_continue.name, _("Click here to show request details"), active_continue.name)
				frappe.throw(
					_("Can't add a suspend enrollment request, because you have an active continue enrollment request (") +
					url_of_active_continue_request +
					_(") that is {0}!").format(active_continue.status)
				)
			
			elif active_withdrawal:
				url_of_active_withdrawal_request = '<a href="/app/withdrawal-request/{0}" title="{1}">{2}</a>'.format(active_withdrawal.name, _("Click here to show request details"), active_withdrawal.name)
				frappe.throw(
					_("Can't add a suspend enrollment request, because you have an active withdrawal request (") +
					url_of_active_withdrawal_request +
					_(") that is {0}!").format(active_withdrawal.status)
				)


	@frappe.whitelist()
	def get_active_request(self, program_enrollment, doctype_name):
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


	# @frappe.whitelist()
	# def set_multiple_status(names, status):
	# 	names = json.loads(names)
	# 	for name in names:
	# 		sus = frappe.get_doc("Suspend Enrollment Request", name)
	# 		sus.status = status
	# 		sus.save()
