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
              doctype: "Program Enrollment",
              fields: ["name"],
              filters: {
                student:frm.doc.student,
                status:"Continued"
              }
            },
            callback: function(s) {
				      frm.set_value('program_enrollment', s.message[0].name);
              frappe.call({
                method: "frappe.client.get_list",
                args: {
                  doctype: "Seminar Discussion Faculty Member Report",
                  fields: ["*"],
                  filters: {
                    student:frm.doc.student,
                    program_enrollment:s.message[0].name
                    
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
              
              
            }
          });
          frappe.call({
            method: "frappe.client.get_list",
            args: {
              doctype: "Student Supervisor",
              fields: ["supervisor_name"],
              filters: {
                student:frm.doc.student,
                status:"Active",
                type:"Main Supervisor"
              }
            },
            callback: function(s) {
				frm.set_value('supervisor', s.message[0].supervisor_name);
              
      
            },
          });
          

       }
    
});

frappe.ui.form.on("Seminar Discussion Committee Membe Report", {
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
  }
});