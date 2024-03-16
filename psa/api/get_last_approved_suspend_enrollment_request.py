import frappe
from frappe import _

@frappe.whitelist(allow_guest=True)
def get_last_approved_suspend_enrollment_request(program_enrollment):
    # Query to fetch the last document with status containing "Approved" and matching program_enrollment
    docs = frappe.get_all("Suspend Enrollment Request",
        fields=["*"],
        filters={
            "status": ["like", "%Approved%"],
            "program_enrollment": program_enrollment
        },
        order_by="modified DESC",
        limit_page_length=1
    )
    return docs[0] if docs else None