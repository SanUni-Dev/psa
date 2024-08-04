# Copyright (c) 2024, Sana'a university and contributors
# For license information, please see license.txt


import frappe, json
from frappe.model.document import Document
from frappe import _
from psa.api.psa_utils import check_active_request, check_program_enrollment_status, create_psa_transaction


class ThesisDefenseCommitteeRequest(Document):
	def before_insert(self):
		program_enrollment_status = check_program_enrollment_status(self.program_enrollment, ['Continued'], ['Suspended', 'Withdrawn', 'Graduated', 'Transferred'])
		if not program_enrollment_status[0]:
			frappe.throw(_("Can't add a thesis defense committee request, because current status of the student is {0}!").format(program_enrollment_status[1]))
		elif program_enrollment_status[0]:
			set_a_limit_on_the_number_of_suggested_committee_members = frappe.db.get_single_value('PSA Settings', 'set_a_limit_on_the_number_of_suggested_committee_members')
			maximum_number_of_suggested_committee_members = frappe.db.get_single_value('PSA Settings', 'maximum_number_of_suggested_committee_members')
			minimum_number_of_suggested_committee_members = frappe.db.get_single_value('PSA Settings', 'minimum_number_of_suggested_committee_members')

			if set_a_limit_on_the_number_of_suggested_committee_members:
				# Check the number of rows in the child tables
				internal_rows_count = len(self.get('member_of_internal_selected_committee', []))
				external_rows_count = len(self.get('member_of_external_selected_committee', []))
				total_rows_count = internal_rows_count + external_rows_count

				if total_rows_count < minimum_number_of_suggested_committee_members or total_rows_count > maximum_number_of_suggested_committee_members:
					frappe.throw(_("The total number of rows in 'Internal and External Suggested Members of Committee' must be between {0} and {1}.").format(minimum_number_of_suggested_committee_members, maximum_number_of_suggested_committee_members))

			check_active_requests_before_insert = frappe.db.get_single_value('PSA Settings', 'check_active_requests_before_insert')
			if check_active_requests_before_insert:
				active_request = check_active_request(self.student, self.program_enrollment, ["Suspend Enrollment Request", "Continue Enrollment Request", "Withdrawal Request"])
				if active_request:
					url_of_active_request = '<a href="/app/{0}/{1}" title="{2}">{3}</a>'.format((active_request[0]).lower().replace(" ", "-"), active_request[1]['name'], _("Click here to show request details"), active_request[1]['name'])
					frappe.throw(
						_("Can't add a thesis defense committee request, because student has an active {0} ({1}) that is {2}!").format(active_request[0], url_of_active_request, active_request[1]['status'])
					)


	def on_submit(self):
		program_enrollment = frappe.get_doc('Program Enrollment', self.program_enrollment)
		if program_enrollment.status != "Continued":
			frappe.throw(_("Failed! Student is {0}!".format(program_enrollment.status)))

		################ Creating a New Transaction ################
        # applicants = [
        #     {'applicant_type': "Student", 'applicant': self.student, 'applicant_name': "إسماعيل"},
        #     {'applicant_type': "Employee", 'applicant': "HR-EMP-00001", 'applicant_name': "Ahmed"}
        # ]
		applicants = []
		transaction_id = create_psa_transaction(self.doctype, self.name, applicants)
		if 'error' in transaction_id:
			frappe.throw(transaction_id['error'])
		else:
			frappe.msgprint(_('Transaction created successfully with ID: {0}<br><br><br><a onclick="psa_utils.scroll_to_transaction_information(cur_frm, `transaction_information`)"><i>Show Transaction Details</i></a>').format(transaction_id['transaction_id']))
        ############################################################
