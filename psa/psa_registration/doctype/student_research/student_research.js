frappe.ui.form.on("Student Research", {
	refresh: function(frm) {
    if(frm.doc.docstatus === 1){
      if(!frm.doc.status){  
        frm.add_custom_button(__('Changed '), function() {   
          frappe.call({
                method: 'psa.psa_registration.doctype.student_research.student_research.select_data',
                args: {
                  condition_value: frm.doc.name,
                  status:"Changed"
              },  
            });
            frappe.show_alert({
              message: __('the statues was succsuful changed to Changed'),
              indicator: 'green'
            });
            frm.reload_doc();
            setTimeout(function() {
              frm.reload_doc();
          }, 1000);
        }, __('statues'));
      }  
      else if(frm.doc.status === "Changed"){
        frm.add_custom_button(__('active '), function() {   
          frappe.call({
                method: 'psa.psa_registration.doctype.student_research.student_research.select_data',
                args: {
                  condition_value: frm.doc.name,
                  status:"Active"
              },
                
            });
            frappe.show_alert({
              message: __('the statues was succsuful changed to Active'),
              indicator: 'green'
            });
            frm.reload_doc();
            setTimeout(function() {
              frm.reload_doc();
          }, 1000);
           
        }, __('statues'));
      }

       
      

    }
    
    }
    
});


frappe.listview_settings['Student Research'] = {
  add_fields: ['status', 'docstatus'],
  get_indicator: function(doc) {
      // Customize how indicators appear in the list view
      if (doc.status === 'Active') {
          return [__('Active'), 'green', 'docstatus,=,Active'];
      } else if (doc.status === 'Changed') {
          return [__('Changed'), 'red', 'docstatus,=,Changed'];
      } else {
          return [__('Pending'), 'orange', 'docstatus,=,Pending'];
      }
  }
};

frappe.ui.form.on("Student Research", "onload", function(frm) {
   
  
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
				frm.set_value('program__enrollment', s.message[0].program);
              
      
            }
          });
      }
    });
   });