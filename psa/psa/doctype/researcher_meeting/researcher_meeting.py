# Copyright (c) 2024, Sana'a university and contributors
# For license information, please see license.txt

import frappe
from console import console
from frappe.model.document import Document
from frappe import _

class ResearcherMeeting(Document):
    def before_insert(self):
        set_a_limit_of_meeting = frappe.db.get_single_value('PSA Settings', 'set_a_limit_on_the_number_of_researcher_meetings')
        number_of_meeting = frappe.db.get_single_value('PSA Settings', 'number_of_meetings') 
        
        if set_a_limit_of_meeting :
            student_program_meeting = frappe.get_all(
                        'Researcher Meeting', 
                        filters={'program_enrollment' : self.program_enrollment ,
                            'student' : self.student,
                            'docstatus': 0}, 
                        fields=['*']
                )
            count_of_meeting = 0         
            for  Meeting in student_program_meeting:
                count_of_meeting += 1
                if count_of_meeting >= number_of_meeting:
                    frappe.throw(_("Can't add a Researcher Meeting, because you have reached the maximum allowed number of Researcher Meetings (Max allowed = ") + str(number_of_meeting) + ")")


 

    
        
        
        