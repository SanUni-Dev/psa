// Copyright (c) 2024, Sana'a university and contributors
// For license information, please see license.txt

frappe.ui.form.on('Researcher Meeting',  {
    setup: function(frm) {
        frm.set_query("student_supervisor", "meeting_with", function (doc, cdt, cdn) {
          return {
            "filters" : {
                "program_enrollment" : frm.doc.program_enrollment,
                "student" : frm.doc.student
            }
          };
        });
      
    }
});
