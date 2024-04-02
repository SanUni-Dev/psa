import frappe


@frappe.whitelist()
def get_program_enrollment_for_current_user():
    user = frappe.session.user

    psa_student = frappe.get_value("PSA Student", {"user": user}, "name")
    program_enrollment = frappe.get_value("Program Enrollment", {"student": psa_student}, "name")

    return program_enrollment


@frappe.whitelist()
def get_url_to_new_form(doctype_name):
    return frappe.utils.get_url_to_form(doctype_name, "new")
