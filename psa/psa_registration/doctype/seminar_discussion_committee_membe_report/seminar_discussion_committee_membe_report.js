// Copyright (c) 2024, Sana'a university and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Seminar Discussion Committee Membe Report", {
// 	refresh(frm) {

// 	},
// });
frappe.ui.form.on("Seminar Discussion Committee Membe Report", {
	student: function(frm) { 
        frappe.call({
            method: "frappe.client.get_list",
            args: {
              doctype: "Seminar Discussion Faculty Member Report",
              fields: ["*"],
              filters: {
                student:frm.doc.student
                
              }
            },
            callback: function(r) {
              frm.clear_table("committee_report");

              // Loop through the data and add to child table
              r.message.forEach(function(row) {
                  var child = frm.add_child("committee_report");
                  child.doctor = row.doctor; 
                  child.research_title_english = row.research_title_english; 
                  child.research_title_arabic = row.research_title_arabic;  
                  child.description = row.description;
                  child.statues = row.statues;  
                  
              });

              // Refresh the form to reflect changes
              frm.refresh_field("committee_report");
              
      
            }
          });
          frappe.call({
            method: "frappe.client.get_list",
            args: {
              doctype: "Program Enrollment",
              fields: ["program"],
              filters: {
                student:frm.doc.student,
                status:"Active"
              }
            },
            callback: function(s) {
				frm.set_value('program_enrollment', s.message[0].program);
              
      
            }
          });

       }
    
});