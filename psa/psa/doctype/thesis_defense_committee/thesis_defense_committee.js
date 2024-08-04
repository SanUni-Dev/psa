// Copyright (c) 2024, Sana'a university and contributors
// For license information, please see license.txt

frappe.ui.form.on("Thesis Defense Committee", {
        refresh(frm) {
                if (frm.doc.student && frm.doc.program_enrollment) {
                        psa_utils.set_program_enrollment_information(frm, "information", frm.doc.student, frm.doc.program_enrollment);
                }
        },
});
