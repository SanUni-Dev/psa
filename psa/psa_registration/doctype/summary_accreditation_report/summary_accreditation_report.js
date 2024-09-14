// Copyright (c) 2024, Sana'a university and contributors
// For license information, please see license.txt

frappe.ui.form.on("summary Accreditation Report", {
	appoint_supervisor_and_defense: function(frm) { 
        frappe.call({
            method: "frappe.client.get_list",
            args: {
              doctype: "Accreditation Report",
              fields: ["*"],
              filters: {
                appoint_supervisor_and_defense:frm.doc.appoint_supervisor_and_defense
                
              }
            },
            callback: function(r) {
              frm.clear_table("accreditation_report");

              // Loop through the data and add to child table
              r.message.forEach(function(row) {
                  var child = frm.add_child("accreditation_report");
                  child.council = row.council; 
                  child.record_number = row.record_number; 
                  child.decision = row.decision;  
                  child.description = row.description;
                  
              });

              // Refresh the form to reflect changes
              frm.refresh_field("accreditation_report");
              
      
            }
          });
         

       }
});
