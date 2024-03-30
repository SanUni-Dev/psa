import frappe

@frappe.whitelist()
def get_url_to_new_form(doctype_name):
    return frappe.utils.get_url_to_form(doctype_name, "new")