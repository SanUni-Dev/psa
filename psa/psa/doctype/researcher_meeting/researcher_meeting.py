# Copyright (c) 2024, Sana'a university and contributors
# For license information, please see license.txt

import frappe, json
from frappe.model.document import Document
from frappe import _
from psa.api.psa_utils import check_active_request, check_program_enrollment_status

class ResearcherMeeting(Document):
    def before_save(self):
        meeting_with_rows = [row.student_supervisor for row in self.meeting_with]
        if len(meeting_with_rows) != len(set(meeting_with_rows)):
            frappe.throw(_("Duplicated Rows!<br><br>Can't add a student supervisor more than once."))


    def before_insert(self):
        program_enrollment_status = check_program_enrollment_status(self.program_enrollment, ['Continued'], ['Suspended', 'Withdrawn', 'Graduated', 'Transferred'])
        if not program_enrollment_status[0]:
            frappe.throw(_("Can't add a researcher meeting, because current status is {0}!").format(program_enrollment_status[1]))
        elif program_enrollment_status[0]:
            set_a_limit_on_the_number_of_researcher_meetings = frappe.db.get_single_value('PSA Settings', 'set_a_limit_on_the_number_of_researcher_meetings')
            
            if set_a_limit_on_the_number_of_researcher_meetings :
                number_of_meetings = frappe.db.get_single_value('PSA Settings', 'number_of_meetings')
                student_program_meetings = frappe.get_all(
                    'Researcher Meeting', 
                    filters={'program_enrollment' : self.program_enrollment ,
                        'student' : self.student,
                        'docstatus': 0},
                    fields=['*']
                )
                count_of_meetings = 0
                for meeting in student_program_meetings:
                    count_of_meetings += 1
                    if count_of_meetings >= number_of_meetings:
                        frappe.throw(_("Can't add a researcher meeting, because you have reached the maximum allowed number of researcher meetings (Max allowed = {0})".format(str(number_of_meetings))))

            check_active_requests_before_insert = frappe.db.get_single_value('PSA Settings', 'check_active_requests_before_insert')
            if check_active_requests_before_insert:
                active_request = check_active_request(self.student, self.program_enrollment, ["Suspend Enrollment Request", "Continue Enrollment Request", "Withdrawal Request"])
                if active_request:
                    url_of_active_request = '<a href="/app/{0}/{1}" title="{2}">{3}</a>'.format((active_request[0]).lower().replace(" ", "-"), active_request[1]['name'], _("Click here to show request details"), active_request[1]['name'])
                    frappe.throw(
						_("Can't add a researcher meeting, because you have an active {0} ({1}) that is {2}!").format(active_request[0], url_of_active_request, active_request[1]['status'])
					)
  