// Copyright (c) 2024, smarko and contributors
// For license information, please see license.txt

frappe.ui.form.on("ToDo", {
	refresh(frm) {
        frappe.msgprint("hi");
        console.log(123);
	},
});
