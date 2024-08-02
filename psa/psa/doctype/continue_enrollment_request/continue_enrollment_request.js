// Copyright (c) 2024, Sana'a university and contributors
// For license information, please see license.txt


// Declare Variables for Timeline
// var current_role_of_workflow_action = "";
// var status_of_before_workflow_action = "";
// var action_of_workflow = "";
// var modified_of_before_workflow_action = "";
// var current_user_of_workflow_action = "";
// var status_of_after_workflow_action = "";
// var modified_of_after_workflow_action = "";


frappe.ui.form.on("Continue Enrollment Request", {
    refresh(frm) {
        $(frm.fields_dict["information"].wrapper).html("");
        $(frm.fields_dict["transaction_information"].wrapper).html("");
        $(frm.fields_dict["suspended_request_details_html"].wrapper).html('');

        // $(frm.fields_dict["timeline_html"].wrapper).html("");
        // frm.set_df_property("timeline_section", "hidden", true);

        if (frm.doc.student && frm.doc.program_enrollment) {
            psa_utils.set_program_enrollment_information(frm, "information", frm.doc.student, frm.doc.program_enrollment);
            
            if (frm.doc.suspend_enrollment_request) {
                set_suspended_request_details(frm);
            }
            else {
                $(frm.fields_dict["suspended_request_details_html"].wrapper).html('There is no approved suspend enrollment request!');
            }
        }

        if (!frm.is_new()) {
            // psa_utils.format_timeline_html(frm, "timeline_html", frm.doc.timeline_child_table);

            if (frm.doc.fees_status != "Paid") {
                frm.set_intro("");
                frm.set_intro((__(`You have to pay fees of request before submit it!`)), 'red');
            }
        }

        if (frm.doc.docstatus == 1) {
            frm.set_df_property("modified_request_date", "label", __("Transaction Creation Date"));
            frm.doc.modified_request_date = frm.doc.modified.split(" ")[0] + " " + (frm.doc.modified.split(" ")[1]).split(".")[0];
            frm.refresh_field('modified_request_date');

            $(frm.fields_dict["transaction_information"].wrapper).html("");
        }
    },

    onload(frm) {
        if (frm.is_new() && frappe.user_roles.includes("Student")) {
            psa_utils.set_student_for_current_user(frm, "student", function () {
                psa_utils.set_program_enrollment_for_current_user(frm, "program_enrollment");
            });
        }
    },

    // before_workflow_action(frm) {
    //     status_of_before_workflow_action = frm.doc.status;
    //     action_of_workflow = frm.selected_workflow_action;
    //     modified_of_before_workflow_action = frm.doc.modified.split(" ")[0] + " " + (frm.doc.modified.split(" ")[1]).split(".")[0];
    // },

    // after_workflow_action(frm) {
    //     current_user_of_workflow_action = frappe.session.user_fullname;
    //     status_of_after_workflow_action = frm.doc.status;
    //     modified_of_after_workflow_action = frm.doc.modified.split(" ")[0] + " " + (frm.doc.modified.split(" ")[1]).split(".")[0];

    //     psa_utils.get_current_workflow_role(
    //         "Continue Enrollment Request Workflow",
    //         status_of_before_workflow_action,
    //         function (current_workflow_role) {
    //             current_role_of_workflow_action = current_workflow_role;
    //             psa_utils.insert_new_timeline_child_table(
    //                 "Continue Enrollment Request",
    //                 frm.doc.name,
    //                 "timeline_child_table",
    //                 {
    //                     "position": current_role_of_workflow_action,
    //                     "full_name": current_user_of_workflow_action,
    //                     "previous_status": status_of_before_workflow_action,
    //                     "received_date": modified_of_before_workflow_action,
    //                     "action": action_of_workflow,
    //                     "next_status": status_of_after_workflow_action,
    //                     "action_date": modified_of_after_workflow_action
    //                 }
    //             );

    //             window.location.reload();
    //         }
    //     );
    // },

    program_enrollment(frm) {
        frm.set_intro('');
        if (frm.doc.program_enrollment) {
            psa_utils.set_program_enrollment_information(frm, "information", frm.doc.student, frm.doc.program_enrollment);

            psa_utils.check_program_enrollment_status(frm.doc.program_enrollment, ['Suspended'], ['Continued', 'Withdrawn', 'Graduated', 'Transferred'],
                function (program_enrollment_status) {
                    if (!program_enrollment_status[0]) {
                        if (program_enrollment_status[1] == "Continued") {
                            psa_utils.get_url_to_new_form('Suspend Enrollment Request',
                                function (url_of_suspend_enrollment_request) {
                                    frm.set_intro('');
                                    frm.set_intro((
                                        `<div class="container">
                                        <div class="row">
                                            <div class="col-auto me-auto">` +
                                        __(`Can't add a continue enrollment request, because current status is {0}!`, [program_enrollment_status[1]]) +
                                        `</div>
                                            <div class="col-auto me-auto">
                                                <a href="${url_of_suspend_enrollment_request}">` +
                                        __(`Do you want to add a suspend enrollment request?`) +
                                        `</a>
                                            </div>
                                        </div>
                                    </div>`
                                    ), 'red');
                                }
                            );
                        }
                        else {
                            frm.set_intro('');
                            frm.set_intro((__("Can't add a continue enrollment request, because current status is {0}!", [program_enrollment_status[1]])), 'red');
                        }
                    }
                    else if (program_enrollment_status[0]) {
                        if (frm.doc.suspend_enrollment_request) {
                            set_suspended_request_details(frm);
                        }
                        else {
                            $(frm.fields_dict["suspended_request_details_html"].wrapper).html('There is no approved suspend enrollment request!');
                        }

                        psa_utils.get_single_value('PSA Settings', 'check_active_requests_before_insert', function(check_active_requests_before_insert) {
                            if (check_active_requests_before_insert) {
                                psa_utils.check_active_request(frm.doc.student, frm.doc.program_enrollment, ['Continue Enrollment Request', 'Suspend Enrollment Request', 'Withdrawal Request'],
                                    function (active_request) {
                                        if (active_request) {
                                            frm.set_intro('');
                                            var url_of_active_request = `<a href="/app/${active_request[0].toLowerCase().replace(/\s+/g, "-")}/${active_request[1]['name']}" title="${__("Click here to show request details")}"> ${active_request[1]['name']} </a>`;
                                            frm.set_intro((__(`Can't add a continue enrollment request, because you have an active {0} ({1}) that is {2}!`, [active_request[0], url_of_active_request, active_request[1]['status']])), 'red');
                                        }
                                        else {
                                            frm.set_intro('');
                                            frm.set_intro((__(`Current status is {0}.`, [program_enrollment_status[1]])), 'green');
                                        }
                                    }
                                );
                            }
                            else {
                                frm.set_intro('');
                                frm.set_intro((__(`Current status is {0}.`, [program_enrollment_status[1]])), 'green');
                            }
                        });

                        // implement the condition after prepearing the period in academia
                        frappe.db.get_single_value('PSA Settings', 'allow_before_end_of_period').then((allow_before_end_of_period) => {
                            if (!allow_before_end_of_period) {
                                var condition = true;
                                if (!condition) {
                                    frm.set_intro('');
                                    frm.set_intro((__("Can't add a continue enrollment request, because your suspend period has not expired!")), 'red');
                                }
                                else {
                                    frm.set_intro('');
                                    frm.set_intro((__(`Current status is {0}.`, [program_enrollment_status[1]])), 'green');
                                }
                            }
                            else {
                                frm.set_intro('');
                                frm.set_intro((__(`Current status is {0}.`, [program_enrollment_status[1]])), 'green');
                            }
                        });

                        // get_last_approved_suspend_enrollment_request(frm);
                    }
                }
            );
        }
        else {
            $(frm.fields_dict["information"].wrapper).html("");

            frm.set_value("suspend_enrollment_request", "");
            $(frm.fields_dict["suspended_request_details_html"].wrapper).html('');
        }
    },

    student(frm) {
        if (frm.doc.student) {
            psa_utils.set_program_enrollment_for_student(frm, "program_enrollment", frm.doc.student);
        }
        else {
            frm.set_value("program_enrollment", "");
            refresh_field("program_enrollment");
        }
    },
});


function set_suspended_request_details(frm) {
    frappe.call({
        method: 'frappe.client.get_value',
        args: {
            doctype: 'Suspend Enrollment Request',
            filters: {
                name: frm.doc.suspend_enrollment_request
            },
            fieldname: ['creation', 'status', 'suspend_period']
        },
        callback: function (response) {
            if (response.message) {
                var creation_date = response.message.creation;
                var formatted_creation_date = creation_date.split(" ")[0];

                var array_of_label = [__("Request Date"), __("Status"), __("Suspend Period")];
                var array_of_value = [formatted_creation_date, response.message.status, response.message.suspend_period];
                psa_utils.format_multi_html_field(frm, "suspended_request_details_html", array_of_label, array_of_value);
            }
            else {
                $(frm.fields_dict["suspended_request_details_html"].wrapper).html('There is no approved suspend enrollment request!');
            }
        }
    });
}


// function get_last_approved_suspend_enrollment_request(frm) {
//     frappe.call({
//         method: "get_last_approved_suspend_enrollment_request",
//         doc: frm.doc,
//         args: {
//             program_enrollment: frm.doc.program_enrollment,
//             student: frm.doc.student
//         },
//         callback: function (response) {
//             if (response.message) {
//                 frm.set_value("suspend_enrollment_request", response.message.name);
//                 if (frm.doc.suspend_enrollment_request) {
//                     set_suspended_request_details(frm);
//                 }
//                 else {
//                     $(frm.fields_dict["suspended_request_details_html"].wrapper).html('There is no approved suspend enrollment request!');
//                 }
//             }
//             else {
//                 frm.set_value("suspend_enrollment_request", "");
//                 $(frm.fields_dict["suspended_request_details_html"].wrapper).html('There is no approved suspend enrollment request!');
//             }
//         },
//     });
// }
