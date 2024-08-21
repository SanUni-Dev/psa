# Copyright (c) 2024, Sana'a university and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class StudentResearch(Document):
	def on_submit(self):
		sup_record = frappe.get_doc('Student Research', self.pervious_proposal)
		sup_record.status = 'Changed'
		sup_record.enabled = 0
		sup_record.save()
