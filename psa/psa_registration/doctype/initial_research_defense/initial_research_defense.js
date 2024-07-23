// Copyright (c) 2024, Sana'a university and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Initial Research Defense", {
// 	refresh(frm) {

// 	},
// });
frappe.ui.form.on("Initial Research Defense", {
   
   
    // Fetch data from the Doctype
    onload: function(frm) {
        frappe.call({
            method: 'psa.psa_registration.doctype.student_research.student_research.get_temporary_data',
            callback: function(response) {
                let data = response.message;
                console.log("Received data from server:", data);  // Debug statement

                // Set the values in the new form
                frm.set_value('research_title_english', data.research_title_english);
                frm.set_value('research_title_arabic', data.research_title_arabic);

                // Refresh the fields to show the updated values
                frm.refresh_field('research_title_english');
                frm.refresh_field('research_title_arabic');
            }
        });






        frappe.call({
            method: "frappe.client.get_list",
            args: {
              doctype: "Student",
              fields: ["name"],
              filters: {
                  user_id:frappe.session.user_email
              }
            },
            callback: function(r) {
              frm.set_value('student', r.message[0].name);
              
              frappe.call({
                  method: "frappe.client.get_list",
                  args: {
                    doctype: "Program Enrollment",
                    fields: ["program"],
                    filters: {
                      student:r.message[0].name,
                      status:"Active"
                    }
                  },
                  callback: function(s) {
                      frm.set_value('program_enrollment', s.message[0].program);
                    
            
                  }
                });
            }
          });
    }
   
   });
