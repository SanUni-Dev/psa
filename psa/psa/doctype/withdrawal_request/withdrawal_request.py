# Copyright (c) 2024, Sana'a university and contributors
# For license information, please see license.txt

import frappe, json
from frappe.model.document import Document
from frappe import _


class WithdrawalRequest(Document):
	def on_submit(self):
		program_enrollment = frappe.get_doc('Program Enrollment', self.program_enrollment)
		if(program_enrollment.status == "Continued" or program_enrollment.status == "Suspended"):
			if("Rejected" in self.status):
				if(not self.rejection_reason):
					frappe.throw(_("Please enter reason of rejection!"))
			else:
				program_enrollment.status = "Withdrawn"
				program_enrollment.save()


	def before_insert(self):
		program_enrollment_status = frappe.get_doc('Program Enrollment', self.program_enrollment)

		if(program_enrollment_status.status == "Withdrawn"):
			frappe.throw(_("Can't add a withdrawal enrollment request, because current status is withdrawn!"))
		
		student_program_withdrawal_requests = frappe.get_all('Withdrawal Request', filters={'program_enrollment': self.program_enrollment}, fields=['*'])

		for request in student_program_withdrawal_requests:
			if(
				request.status == "Approval Pending by Finance Officer" or
				request.status == "Approval Pending by Director of Graduate Studies" or
				request.status == "The File Pending Delivery by the Archivist"
			):
				frappe.throw(_("Can\'t add a withdrawal request, because you have active request that is '{}'!".format(request.status)))

	# @frappe.whitelist()
	# def set_multiple_status(names, status):
	# 	names = json.loads(names)
	# 	for name in names:
	# 		sus = frappe.get_doc("Withdrawal Request", name)
	# 		sus.status = status
	# 		sus.save()
