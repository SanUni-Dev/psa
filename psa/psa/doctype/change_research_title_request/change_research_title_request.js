// Copyright (c) 2024, Sana'a university and contributors
// For license information, please see license.txt
frappe.ui.form.on("Change Research Title Request", {
    refresh(frm) {
        $(frm.fields_dict["information"].wrapper).html("");
        $(frm.fields_dict["transaction_information"].wrapper).html("");


        setTimeout(() => {
            frm.page.actions.find(`[data-label='Help']`).parent().parent().remove();
        }, 500);


        function hide_change_title_button() {
            let $btn = frm.page.actions.find(`[data-label='${__('Change Title')}']`);
            if ($btn.length) {
                $btn.parent().parent().remove(); // Remove button from the UI
            }
        }
        if (frm.doc.docstatus == 1) {

            psa_utils.set_transaction_information(frm, "transaction_information", frm.doc.doctype, frm.doc.name);
            if (!frappe.user_roles.includes("Student") && !frappe.user_roles.includes("Supervisor")) {

                frm.add_custom_button(__('Change Title'), function() {
                frappe.new_doc('Student Research', {
                    student: frm.doc.student,
                    program_enrollment: frm.doc.program_enrollment,
                    reference_doctype: frm.doc.doctype,
                    document_name: frm.doc.name,
                    status: "Active",
                    enabled: "true",
                    pervious_proposal: frm.doc.student_research,
                }, function(new_doc) {
                    frappe.model.set_value(new_doc.doctype, new_doc.name, 'research_title_arabic', frm.doc.new_research_title_arabic);
                    frappe.model.set_value(new_doc.doctype, new_doc.name, 'research_title_english', frm.doc.new_research_title_english);
                    frappe.model.set_value(new_doc.doctype, new_doc.name, 'date_of_approval_of_the_research_title', frm.doc.date_of_approval_of_the_research_title);

                    frappe.set_route('Form', new_doc.doctype, new_doc.name).then(() => {
                        let doc = locals[new_doc.doctype][new_doc.name];
                        doc.research_title_arabic = frm.doc.new_research_title_arabic;
                        doc.research_title_english = frm.doc.new_research_title_english;
                        cur_frm.refresh_fields(['research_title_arabic', 'research_title_english','date_of_approval_of_the_research_title']);
                    });
                });
            });

        }
        else{
            // Hide the button if the user is a Student or Supervisor
            hide_change_title_button();
        }
        }
        frm.trigger('check_and_set_approval_date');

        if (frm.doc.student && frm.doc.program_enrollment) {
            psa_utils.set_program_enrollment_information(frm, "information", frm.doc.student, frm.doc.program_enrollment);
        }

   //////////////////
   if (!frm.is_new() && frm.doc.docstatus === 0 && frappe.user_roles.includes("Student")) {
    console.log("Condition met: Document is not new, docstatus is 0, and user is a Student");

    if (frm.doc.status === "Draft") {
        console.log("Document status is Draft");

        frm.page.clear_primary_action();

        frm.page.set_primary_action(__('Confirm'), function() {
            frappe.confirm(__('Are you sure you want to Confirm this request?'), function() {
                frm.set_value('status', 'Pending Supervisor Approval');  // Set status
                frm.save().then(() => {
                    frappe.msgprint(__('Request has been sent for supervisor approval.'));
                    frm.refresh();  // Refresh the form to update UI

                   frm.page.clear_primary_action();  // Remove the Confirm button
    

                   frm.set_df_property('status', 'read_only', 1);
                   
                   frm.set_read_only();
                });
            });
        }, 'octicon octicon-check');
    } else {
        console.log("Document status is not Draft");
        frm.page.clear_primary_action();   
    }
}
   
    },
    validate(frm) {
        if (frm.doc.status === 'Pending Supervisor Approval' && frappe.user_roles.includes("Student")) {
            frappe.msgprint(__('You cannot make changes to this document as it is pending supervisor approval.'));
            frappe.validated = false;   
        }
    },

    check_and_set_approval_date: function(frm) {
        if (frm.doc.docstatus==1 && !frm.doc.date_of_approval_of_the_research_title) {
            frm.set_value('date_of_approval_of_the_research_title', frappe.datetime.get_today());
        }
    },

    before_save: function(frm) {
        if (frm.doc.date_of_approval_of_the_research_title) {
            frm.set_df_property('date_of_approval_of_the_research_title', 'read_only', 1);
        } 
    },

    

    onload(frm) {
        if (frm.is_new() && frappe.user_roles.includes("Student")) {
            psa_utils.set_student_for_current_user(frm, "student", function () {
                psa_utils.set_program_enrollment_for_current_user(frm, "program_enrollment", function () {
                    load_student_supervisor_and_research(frm);
                });
            });
        }
    },

    student(frm) {
        if (frm.doc.student) {
            psa_utils.set_program_enrollment_for_student(frm, "program_enrollment", frm.doc.student, function() {
                load_student_supervisor_and_research(frm);
            });
        } else {
            frm.set_value("program_enrollment", "");
            refresh_field("program_enrollment");
        }
    },

    program_enrollment(frm) {
        frm.set_intro('');
        if (frm.doc.program_enrollment) {
            psa_utils.set_program_enrollment_information(frm, "information", frm.doc.student, frm.doc.program_enrollment);

            psa_utils.check_program_enrollment_status(frm.doc.program_enrollment, ['Continued'], ['Suspended', 'Withdrawn', 'Graduated', 'Transferred'], function (program_enrollment_status) {
                if (!program_enrollment_status[0]) {
                    frm.set_intro((__("Can't add a change research title request, because current status is {0}!", [program_enrollment_status[1]])), 'red');
                } else if (program_enrollment_status[0]) {
                    frappe.db.get_single_value('PSA Settings', 'check_active_requests_before_insert').then((check_active_requests_before_insert) => {
                        if (check_active_requests_before_insert) {
                            psa_utils.check_active_request(frm.doc.student, frm.doc.program_enrollment, ['Change Research Title Request', 'Suspend Enrollment Request', 'Continue Enrollment Request', 'Withdrawal Request'], function (active_request) {
                                if (active_request) {
                                    var url_of_active_request = `<a href="/app/${active_request[0].toLowerCase().replace(/\s+/g, "-")}/${active_request[1]['name']}" title="${__("Click here to show request details")}"> ${active_request[1]['name']} </a>`;
                                    frm.set_intro((__(`Can't add a change research title request, because you have an active {0} ({1}) that is {2}!`, [active_request[0], url_of_active_request, active_request[1]['status']])), 'red');
                                } else {
                                    frm.set_intro((__(`Current status is {0}.`, [program_enrollment_status[1]])), 'green');
                                }
                            });
                        } else {
                            frm.set_intro((__(`Current status is {0}.`, [program_enrollment_status[1]])), 'green');
                        }
                    });
                }
            });
           load_student_supervisor_and_research (frm);
        }
        else {
            $(frm.fields_dict["information"].wrapper).html("");
        }
    
    },
});

function load_student_supervisor_and_research(frm) {
    if (frm.doc.student && frm.doc.program_enrollment) {
        // Set student research
        psa_utils.set_student_research_for_student_and_program_enrollment(frm, "student_research", frm.doc.student, frm.doc.program_enrollment, function() {
            frm.refresh_field("student_research");
        });

        // Set student supervisor
        psa_utils.set_student_supervisor_for_student_and_program_enrollment(frm, "student_supervisor", frm.doc.student, frm.doc.program_enrollment, function() {
            frm.refresh_field("student_supervisor");
        });

    } else {
        frm.set_value("student_research", "");
        frm.set_value("student_supervisor", "");
        frm.refresh_field("student_research");
        frm.refresh_field("student_supervisor");
    }
}


