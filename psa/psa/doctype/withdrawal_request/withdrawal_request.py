# Copyright (c) 2024, Sana'a university and contributors
# For license information, please see license.txt


import frappe
from frappe.model.document import Document
from frappe import _
from psa.api.psa_utils import check_active_request, check_program_enrollment_status, create_psa_transaction


class WithdrawalRequest(Document):
    def before_insert(self):
        program_enrollment_status = check_program_enrollment_status(self.program_enrollment, ['Suspended', 'Continued'], ['Withdrawn', 'Graduated', 'Transferred'])
        if not program_enrollment_status[0]:
            frappe.throw(_("Can't add a withdrawal request, because current status is {0}!").format(program_enrollment_status[1]))
        elif program_enrollment_status[0]:
            check_active_requests_before_insert = frappe.db.get_single_value('PSA Settings', 'check_active_requests_before_insert')
            if check_active_requests_before_insert:
                active_request = check_active_request(self.student, self.program_enrollment, ["Withdrawal Request", "Suspend Enrollment Request", "Continue Enrollment Request"])
                if active_request:
                    url_of_active_request = '<a href="/app/{0}/{1}" title="{2}">{3}</a>'.format((active_request[0]).lower().replace(" ", "-"), active_request[1]['name'], _("Click here to show request details"), active_request[1]['name'])
                    frappe.throw(
                        _("Can't add a withdrawal request, because you have an active {0} ({1}) that is {2}!").format(active_request[0], url_of_active_request, active_request[1]['status'])
                    )


    def on_submit(self):
        if not self.request_attachment:
            frappe.throw(_("Please upload your attachments!"))

        if not self.library_eviction:
            frappe.throw(_("Please upload your library eviction!"))

        if self.fees_status != "Paid":
            frappe.throw(_("You have to pay fees of request before submit it!"))
        
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


    # def on_update(self):
    #     if self.status == "The File Delivered by Archivist":
    #         try:
    #             program_enrollment = frappe.get_doc('Program Enrollment', self.program_enrollment)
    #             if program_enrollment.status in ["Continued", "Suspended"]:
    #                 if "Rejected" in self.status:
    #                     if not self.rejection_reason:
    #                         frappe.throw(_("Please enter reason of rejection!"))
    #                 else:
    #                     program_enrollment.status = "Withdrawn"
    #                     program_enrollment.enabled = 0
    #                     program_enrollment.save()
    #             elif program_enrollment.status == "Withdrawn":
    #                 frappe.throw(_("Failed! Student is already {0}!").format(program_enrollment.status))
    #             else:
    #                 frappe.throw(_("Failed! Student is {0}!").format(program_enrollment.status))
    #         except Exception as e:
    #             frappe.throw(f"An error occurred: {str(e)}")
