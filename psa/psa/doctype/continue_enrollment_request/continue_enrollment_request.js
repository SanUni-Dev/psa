// Copyright (c) 2024, Sana'a university and contributors
// For license information, please see license.txt


// Declare Variables for Timeline
var current_role_of_workflow_action = "";
var status_of_before_workflow_action = "";
var action_of_workflow = "";
var modified_of_before_workflow_action = "";
var current_user_of_workflow_action = "";
var status_of_after_workflow_action = "";
var modified_of_after_workflow_action = "";


frappe.ui.form.on("Continue Enrollment Request", {
    refresh(frm) {
        setTimeout(() => {
            frm.page.actions.find(`[data-label='Help']`).parent().parent().remove();
        }, 500);


        $(frm.fields_dict["timeline_html"].wrapper).html("");
        frm.set_df_property("timeline_section", "hidden", true);


        if (!frm.is_new()) {
            // if (frappe.user_roles.includes("Student")) {
            //   setTimeout(() => {
            //     var fees_status = frm.doc.fees_status;
            //     if (fees_status === "Not Paid") {
            //       frm.add_custom_button(__("Get Code for Fee Payment"), () => {
            //         frappe.msgprint(__("Payment code for '{0}' is: #########", [frm.doc.name]));
            //       });
            //     }
            //   }, 500);
            // }


            psa_utils.format_timeline_html(frm, "timeline_html", frm.doc.timeline_child_table);

            if (frm.doc.fees_status == "Not Paid") {
                frm.set_intro("");
                frm.set_intro((__(`You have to pay fees of request before confirm it!`)), 'red');
            }


            var creation_date = frm.doc.creation;
            var formatted_creation_date = creation_date.split(" ")[0] + " " + (creation_date.split(" ")[1]).split(".")[0];

            var modified_date = frm.doc.modified;
            var formatted_modified_date = modified_date.split(" ")[0] + " " + (modified_date.split(" ")[1]).split(".")[0];

            psa_utils.format_single_html_field(frm, "request_date_html", __('Request Date'), formatted_creation_date);

            if (frm.doc.status == "Approved by Department Head") {
                psa_utils.format_single_html_field(frm, "modified_request_date_html", __('Approval Date'), formatted_modified_date);
            }
            else if (frm.doc.status == "Rejected by Vice Dean for GSA" ||
                frm.doc.status == "Rejected by Department Head") {
                psa_utils.format_single_html_field(frm, "modified_request_date_html", __('Rejection Date'), formatted_modified_date);
            }
            else {
                $(frm.fields_dict["modified_request_date_html"].wrapper).html('');
            }
        }
        else {
            $(frm.fields_dict["request_date_html"].wrapper).html('');
            $(frm.fields_dict["modified_request_date_html"].wrapper).html('');
        }

        if (frm.doc.program_enrollment) {
            psa_utils.get_program_enrollment(frm.doc.program_enrollment, function (status, enrollment_date, student, academic_program) {
                psa_utils.get_student(student, function (full_name_arabic, full_name_english) {
                    psa_utils.get_academic_program(academic_program, function (program_abbreviation, faculty, faculty_department) {
                        var array_of_label = [__("Full Name Arabic"), __("Full Name English"), __("Enrollment Date"), __("Academic Program")];
                        var array_of_value = [full_name_arabic, full_name_english, enrollment_date, academic_program];
                        psa_utils.format_multi_html_field(frm, "student_html1", array_of_label, array_of_value);

                        var array_of_label = [__("Program Abbreviation"), __("Faculty"), __("Faculty Department"), __("Status")];
                        var array_of_value = [program_abbreviation, faculty, faculty_department, status];
                        psa_utils.format_multi_html_field(frm, "student_html2", array_of_label, array_of_value);
                    });
                });


                if (frm.doc.suspend_enrollment_request) {
                    frappe.call({
                        method: 'frappe.client.get_value',
                        args: {
                            doctype: 'Suspend Enrollment Request',
                            filters: {
                                name: frm.doc.suspend_enrollment_request
                            },
                            fieldname: ['creation', 'modified', 'status', 'suspend_period']
                        },
                        callback: function (response) {
                            if (response.message) {
                                var creation_date = response.message.creation;
                                var formatted_creation_date = creation_date.split(" ")[0];
                                var modified_date = response.message.modified;
                                var formatted_modified_date = modified_date.split(" ")[0];

                                var array_of_label = [__("Request Date"), __("Approval Date"), __("Status"), __("Suspend Period")];
                                var array_of_value = [formatted_creation_date, formatted_modified_date, response.message.status, response.message.suspend_period];
                                psa_utils.format_multi_html_field(frm, "suspended_request_details_html", array_of_label, array_of_value);
                            }
                            else {
                                $(frm.fields_dict["suspended_request_details_html"].wrapper).html('There is no approved suspend enrollment request!');
                            }
                        }
                    });
                }
                else {
                    $(frm.fields_dict["suspended_request_details_html"].wrapper).html('There is no approved suspend enrollment request!');
                }
            });
        }
        else {
            $(frm.fields_dict["student_html1"].wrapper).html('');
            $(frm.fields_dict["student_html2"].wrapper).html('');
            $(frm.fields_dict["suspended_request_details_html"].wrapper).html('');
        }
    },

    onload(frm) {
        if (frm.is_new() && frappe.user_roles.includes("Student")) {
            psa_utils.set_student_for_current_user(frm, "student", function () {
                psa_utils.set_program_enrollment_for_current_user(frm, "program_enrollment");
            });
        }
    },

    before_workflow_action(frm) {
        status_of_before_workflow_action = frm.doc.status;
        action_of_workflow = frm.selected_workflow_action;
        modified_of_before_workflow_action = frm.doc.modified.split(" ")[0] + " " + (frm.doc.modified.split(" ")[1]).split(".")[0];
    },

    after_workflow_action(frm) {
        current_user_of_workflow_action = frappe.session.user_fullname;
        status_of_after_workflow_action = frm.doc.status;
        modified_of_after_workflow_action = frm.doc.modified.split(" ")[0] + " " + (frm.doc.modified.split(" ")[1]).split(".")[0];

        psa_utils.get_current_workflow_role(
            "Continue Enrollment Request Workflow",
            status_of_before_workflow_action,
            function (current_workflow_role) {
                current_role_of_workflow_action = current_workflow_role;
                psa_utils.insert_new_timeline_child_table(
                    "Continue Enrollment Request",
                    frm.doc.name,
                    "timeline_child_table",
                    {
                        "position": current_role_of_workflow_action,
                        "full_name": current_user_of_workflow_action,
                        "previous_status": status_of_before_workflow_action,
                        "received_date": modified_of_before_workflow_action,
                        "action": action_of_workflow,
                        "next_status": status_of_after_workflow_action,
                        "action_date": modified_of_after_workflow_action
                    }
                );

                window.location.reload();
            }
        );
    },

    program_enrollment(frm) {
        frm.set_intro('');
        if (frm.doc.program_enrollment) {
            psa_utils.get_program_enrollment(frm.doc.program_enrollment, function (status, enrollment_date, student, academic_program) {
                psa_utils.get_student(student, function (full_name_arabic, full_name_english) {
                    psa_utils.get_academic_program(academic_program, function (program_abbreviation, faculty, faculty_department) {
                        var array_of_label = [__("Full Name Arabic"), __("Full Name English"), __("Enrollment Date"), __("Academic Program")];
                        var array_of_value = [full_name_arabic, full_name_english, enrollment_date, academic_program];
                        psa_utils.format_multi_html_field(frm, "student_html1", array_of_label, array_of_value);

                        var array_of_label = [__("Program Abbreviation"), __("Faculty"), __("Faculty Department"), __("Status")];
                        var array_of_value = [program_abbreviation, faculty, faculty_department, status];
                        psa_utils.format_multi_html_field(frm, "student_html2", array_of_label, array_of_value);

                        psa_utils.check_program_enrollment_status(frm.doc.program_enrollment, ['Suspended'], ['Continued', 'Withdrawn', 'Graduated', 'Transferred'],
                            function (program_enrollment_status) {
                                if (!program_enrollment_status[0]) {
                                    if (program_enrollment_status[1] == "Continued") {
                                        psa_utils.get_url_to_new_form('Suspend Enrollment Request',
                                            function (url_of_suspend_enrollment_request) {
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
                                        frm.set_intro((__("Can't add a continue enrollment request, because current status is {0}!", [program_enrollment_status[1]])), 'red');
                                    }
                                }
                                else if (program_enrollment_status[0]) {
                                    psa_utils.check_active_request(frm.doc.student, frm.doc.program_enrollment, ['Continue Enrollment Request', 'Suspend Enrollment Request', 'Withdrawal Request'],
                                        function (active_request) {
                                            if (active_request) {
                                                var url_of_active_request = `<a href="/app/${active_request[0].toLowerCase().replace(/\s+/g, "-")}/${active_request[1]['name']}" title="${__("Click here to show request details")}"> ${active_request[1]['name']} </a>`;
                                                frm.set_intro((__(`Can't add a continue enrollment request, because you have an active {0} ({1}) that is {2}!`, [active_request[0], url_of_active_request, active_request[1]['status']])), 'red');
                                            }
                                            else {
                                                frm.set_intro((__(`Current status is {0}.`, [program_enrollment_status[1]])), 'green');
                                            }
                                        }
                                    );

                                    // implement the condition after prepearing the period in academia
                                    frappe.db.get_single_value('PSA Settings', 'allow_before_end_of_period').then((allow_before_end_of_period) => {
                                        if (!allow_before_end_of_period) {
                                            var condition = true;
                                            if (!condition) {
                                                frm.set_intro((__("Can't add a continue enrollment request, because your suspend period has not expired!")), 'red');
                                            }
                                            else {
                                                frm.set_intro((__(`Current status is {0}.`, [program_enrollment_status[1]])), 'green');
                                            }
                                        }
                                        else {
                                            frm.set_intro((__(`Current status is {0}.`, [program_enrollment_status[1]])), 'green');
                                        }
                                    });

                                    frappe.call({
                                        method: "get_last_approved_suspend_enrollment_request",
                                        doc: frm.doc,
                                        args: {
                                            program_enrollment: frm.doc.program_enrollment,
                                            student: frm.doc.student
                                        },
                                        callback: function (response) {
                                            if (response.message) {
                                                var creation_date = response.message.creation;
                                                var formatted_creation_date = creation_date.split(" ")[0];
                                                var modified_date = response.message.modified;
                                                var formatted_modified_date = modified_date.split(" ")[0];
                        
                                                frm.set_value("suspend_enrollment_request", response.message.name);
                        
                                                var array_of_label = [__("Request Date"), __("Approval Date"), __("Status"), __("Suspend Period")];
                                                var array_of_value = [formatted_creation_date, formatted_modified_date, response.message.status, response.message.suspend_period];
                                                psa_utils.format_multi_html_field(frm, "suspended_request_details_html", array_of_label, array_of_value);
                                            }
                                            else {
                                                frm.set_value("suspend_enrollment_request", "");
                                                $(frm.fields_dict["suspended_request_details_html"].wrapper).html('There is no approved suspend enrollment request!');
                                            }
                                        },
                                    });
                                }
                            }
                        );
                    });
                });
            });
        }
        else {
            $(frm.fields_dict["student_html1"].wrapper).html('');
            $(frm.fields_dict["student_html2"].wrapper).html('');

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


// Variable and two trigger functions to save timeline child table rows to a variable then save them (before fixing it by check "In List View" in Timeline Child Table's fields)
// var timeline_child_table_list = null;

// before_save(frm) {
//     timeline_child_table_list = null;
//     if ((!frm.is_new()) && (frm.is_dirty()) && frm.doc.timeline_child_table) {
//         timeline_child_table_list = frm.doc.timeline_child_table;
//     }
// },

// after_save(frm) {
//     if (timeline_child_table_list[0]) {
//         psa_utils.save_timeline_child_table(
//             "Continue Enrollment Request",
//             frm.doc.name,
//             "timeline_child_table",
//             timeline_child_table_list,
//             function (response) {
//                 if (response.message) {
//                     window.location.reload();
//                 }
//             }
//         );
//     }
// },
