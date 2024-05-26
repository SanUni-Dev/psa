// Copyright (c) 2024, Sana'a university and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Formation Discussion Committee", {
// 	refresh(frm) {

// 	},
// });

// Copyright (c) 2024, Sana'a university and contributors
// For license information, please see license.txt

frappe.ui.form.on("Formation Discussion Committee", {
    onload: function(frm) {
         
        frm.fields_dict['member_of_internal_selected_committee'].grid.get_field('faculty_member').get_query = function(doc, cdt, cdn) {
            return {
                filters: {
                    'contract_status': 1     
                }
            };
        };

         
        frm.fields_dict['member_of_external_selected_committee'].grid.get_field('faculty_member').get_query = function(doc, cdt, cdn) {
            return {
                filters: {
                    'contract_status': 0  , 
                    'university': frm.doc.university,   
                    'city': frm.doc.city
                }
            };
        };
    }
});
