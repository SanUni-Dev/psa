// Copyright (c) 2024, Sana'a university and contributors
// For license information, please see license.txt

frappe.ui.form.on("Student Supervisor", {
    refresh(frm){
       
    },
    student:function(frm) {
        
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
            callback: function(r) {
              frm.set_value('program_enrollment', r.message[0].name);
              
             
            }
          });
    
},
	// student:function(frm) {
    //     var student = frm.doc.student;
    //     if(student){
    //         frappe.call({
    //             method: "frappe.client.get_list",
    //             args: {
    //             doctype: "Program Enrollment",
    //             fields: ["name"],
    //             filters: {
    //                 student:student,
    //                 status:'Continued'
    //             }
    //             },
    //             callback: function(r) {
                    
    //                 frm.set_value('program_enrollment', r.message[0].name);
                        
    //             }
    //         });
    //     }
	// },
});
