// Copyright (c) 2024, Sana'a university and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Seminar Discussion Faculty Member Report", {
// 	refresh(frm) {

// 	},
// });
frappe.ui.form.on('Seminar Discussion Faculty Member Report', {
    validate: function(frm) {
        var research_title_english = frm.doc.research_title_english; // Replace 'letter' with the actual fieldname in your doctype
        var isEnglish = /^[A-Za-z\s]+$/.test(research_title_english); // Replace 'letter' with the actual fieldname in your doctype
        if (!isEnglish) {
            frappe.msgprint('The Research Title English should not be in English.');

            frappe.validated = false;
        }

        var research_title_arabic = frm.doc.research_title_arabic;
         
        var isArabic = /[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDCF\uFDF0-\uFDFF\uFE70-\uFEFF]/.test(research_title_arabic); // Replace 'letter' with the actual fieldname in your doctype
       
        if (isArabic) {
            frappe.msgprint('The Research Title Arabic should not be in Arabic.');

            frappe.validated = false;
        }
    }
});

frappe.ui.form.on('Seminar Discussion Faculty Member Report', {
	onload: function(frm) {
		frm.set_value('doctor', frappe.session.user_fullname);
	}
});
