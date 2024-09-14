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

frappe.ui.form.on("Seminar Discussion Faculty Member Report", {
    onload: function(frm) {
        // Fetch the user's Employee record using their email ID
        frappe.call({
            method: "frappe.client.get_list",
            args: {
                doctype: "Employee",
                filters: {
                    user_id: frappe.session.user
                },
                fields: ["first_name"]
            },
            callback: function(r) {
                if (r.message && r.message.length > 0) {
                    // Set the 'doctor' field with the fetched user's first name
                    frm.set_value('doctor', r.message[0].first_name);
                } else {
                    // Handle case where user is not found
                    frappe.msgprint(__('No Employee record found for the current user.'));
                }
            },
            error: function(error) {
                // Handle any errors during the call
                frappe.msgprint(__('Error fetching user data: ' + error.message));
            }
        });
        
    },
    student:function(frm){
        frappe.call({
            method: "frappe.client.get_list",
            args: {
              doctype: "Program Enrollment",
              fields: ["name"],
              filters: {
                student:frm.doc.student,
                status:"Continued"
              }
            },
            callback: function(s) {
        frm.set_value('program_enrollment', s.message[0].name);
              
      
            }
          });
    }
  });