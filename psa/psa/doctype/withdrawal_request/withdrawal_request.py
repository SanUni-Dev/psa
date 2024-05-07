# Copyright (c) 2024, Sana'a university and contributors
# For license information, please see license.txt

import frappe, json
from frappe.model.document import Document
from frappe import _
from psa.api.psa_utils import get_active_request

class WithdrawalRequest(Document):
    def on_submit(self):
        program_enrollment = frappe.get_doc('Program Enrollment', self.program_enrollment)
        if program_enrollment.status == "Continued" or program_enrollment.status == "Suspended":
            if "Rejected" in self.status:
                if not self.rejection_reason:
                    frappe.throw(_("Please enter reason of rejection!"))
            else:
                program_enrollment.status = "Withdrawn"
                program_enrollment.save()


    def before_insert(self):
        program_enrollment_status = frappe.get_doc('Program Enrollment', self.program_enrollment)

        if program_enrollment_status.status ==" Withdrawn":
            frappe.throw(_("Can't add a withdrawal  request, because current status is withdrawn!"))
        
        else:
            active_suspend = get_active_request("Suspend Enrollment Request", self.program_enrollment)
            active_continue = get_active_request("Continue Enrollment Request", self.program_enrollment)
            active_withdrawal = get_active_request("Withdrawal Request", self.program_enrollment)

            if active_suspend:
                url_of_active_suspend_request = '<a href="/app/suspend-enrollment-request/{0}" title="{1}">{2}</a>'.format(active_suspend.name, _("Click here to show request details"), active_suspend.name)
                frappe.throw(
                    _("Can't add a withdrawal request, because you have an active suspend enrollment request (") +
                    url_of_active_suspend_request +
                    _(") that is {0}!").format(active_suspend.status)
                )

            elif active_continue:
                url_of_active_continue_request = '<a href="/app/continue-enrollment-request/{0}" title="{1}">{2}</a>'.format(active_continue.name, _("Click here to show request details"), active_continue.name)
                frappe.throw(
                    _("Can't add a withdrawal request, because you have an active continue enrollment request (") +
                    url_of_active_continue_request +
                    _(") that is {0}!").format(active_continue.status)
                )
            
            elif active_withdrawal:
                url_of_active_withdrawal_request = '<a href="/app/withdrawal-request/{0}" title="{1}">{2}</a>'.format(active_withdrawal.name, _("Click here to show request details"), active_withdrawal.name)
                frappe.throw(
                    _("Can't add a withdrawal request, because you have an active withdrawal request (") +
                    url_of_active_withdrawal_request +
                    _(") that is {0}!").format(active_withdrawal.status)
                )
                
