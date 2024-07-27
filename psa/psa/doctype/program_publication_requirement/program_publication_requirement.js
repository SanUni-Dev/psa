// Copyright (c) 2024, Sana'a university and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Program Publication Requirement", {
// 	refresh(frm) {

// 	},
// });


frappe.ui.form.on("Publication Condition", {
    journal_type(frm, cdt, cdn) {
        // let row = locals[cdt][cdn];
        frappe.model.set_value(cdt, cdn, "journal", null);
        frappe.model.set_value(cdt, cdn, "requirement", "");
        frm.refresh_field("conditions");
	},
});
