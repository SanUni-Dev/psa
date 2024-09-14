// Copyright (c) 2024, Sana'a university and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Request Co-Supervisor", {
// 	refresh(frm) {

// 	},
// });
frappe.ui.form.on('Request Co-Supervisor', {
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

frappe.ui.form.on("Request Co-Supervisor",{
   
  onload(frm){
    frm.clear_table("supervisors");
     frm.add_child("supervisors");
     frm.add_child("supervisors");
     frm.add_child("supervisors");
     frm.refresh_field("supervisors");
      // Fetch data from the Doctype
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
        frm.set_value('student_name', r.message[0].name);
        
        frappe.call({
            method: "frappe.client.get_list",
            args: {
              doctype: "Program Enrollment",
              fields: ["name"],
              filters: {
                student:r.message[0].name,
                status:"Continued"
              }
            },
            callback: function(p) {
				frm.set_value('program_enrollment', p.message[0].name);
              
      
            }
          });
          frappe.call({
            method: "frappe.client.get_list",
            args: {
              doctype: "Student Supervisor",
              fields: ["supervisor_name"],
              filters: {
                student:r.message[0].name,
                status:"Active",
                type:"Main Supervisor"
              }
            },
            callback: function(s) {
				frm.set_value('supervisor', s.message[0].supervisor_name);
              
      
            }
          });
      }
    }
    );

    }

   
   });
  
 

