# Copyright (c) 2023, jojo and contributors
# For license information, please see license.txt

import frappe
from frappe import _

def execute(filters=None):
    columns, data = [], []
    columns = get_columns(filters=filters)
    
    student = filters.get('student')
    program_enrollment = filters.get('program_enrollment')
    from_date = filters.get('from_date')
    to_date = filters.get('to_date')

    
    request_types = [
        "Suspend Enrollment Request",
        "Continue Enrollment Request",
        "Change Research Title Request",
        "Change Research Co Supervisor Request",
        "Change Research Main Supervisor Request",
        "Withdrawal Request"
    ]

    for request_type in request_types:
        try:
            request_data = frappe.get_all(
                request_type,
                filters={
                    "student": student,
                    "program_enrollment": program_enrollment,
                    "creation": ["between", [from_date, to_date]]
                },
                fields=["student", "program_enrollment", "name as request_id", "status", "creation"]
            )
        except Exception as e:
            frappe.log_error(message=str(e), title="Query Error")
            continue

        for request in request_data:
            # status = request.get("docstatus")
            # status_label = "Other"
            # if status == 1:
            #     status_label = "Submitted"
            # elif status == 0:
            #     status_label = "Draft"
            
            row = {
                "student": request["student"],
                "program_enrollment": request["program_enrollment"],
                "request_type": request_type,  # Doctype name as request_type
                # "status": status_label
                "status": request["status"],
                "creation": request["creation"]
            }
            data.append(row)

    return columns, data

def get_columns(filters=None):
    columns = [
        {"fieldname": "student", "label": _("Student"), "fieldtype": "Link", "options": "Student"},
        {"fieldname": "program_enrollment", "label": _("Program Enrollment"), "fieldtype": "Link", "options": "Program Enrollment"},
        {"fieldname": "request_type", "label": _("Request Type"), "fieldtype": "Data"},
        {"fieldname": "status", "label": _("Request Status"), "fieldtype": "Data"},
        {"fieldname": "creation", "label": _("Request Date"), "fieldtype": "Date"},
    ]

    return columns
