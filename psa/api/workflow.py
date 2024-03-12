import frappe, json

@frappe.whitelist()
def before_transition():
    doc = frappe._dict(json.loads(frappe.form_dict.doc))
    transition = frappe._dict(json.loads(frappe.form_dict.transition))
    return True