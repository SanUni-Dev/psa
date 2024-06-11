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


frappe.ui.form.on("Suspend Enrollment Request", {
    refresh(frm) {
        setTimeout(() => {
            frm.page.actions.find(`[data-label='Help']`).parent().parent().remove();
        }, 500);

        $(frm.fields_dict["timeline_html"].wrapper).html("");
        frm.set_df_property("timeline_section", "hidden", true);


        if (!frm.is_new()) {
            // if (frappe.user_roles.includes("Student")) {
            //     setTimeout(() => {
            //         var fees_status = frm.doc.fees_status;
            //         if (fees_status === "Not Paid") {
            //             frm.add_custom_button(__("Get Code for Fee Payment"), () => {
            //                 frappe.msgprint(__("Payment code for '") + frm.doc.name + __("' is: #########"));
            //             });
            //         }
            //     }, 500);
            // }
            
            psa_utils.format_timeline_html(frm, "timeline_html", frm.doc.timeline_child_table);
            
            if (frm.doc.fees_status == "Not Paid") {
                frm.set_intro("");
                frm.set_intro((__(`You have to pay fees of request before confirm it!`)), 'red');
            }
            
            if (frm.doc.docstatus == 0) {
                frm.set_df_property("request_attachment", "reqd", 1);
            }
            else {
                frm.set_df_property("request_attachment", "reqd", 0);
            }
            
            frm.set_df_property("attachment_section", "hidden", false);
            if (frm.doc.request_attachment) {
                frm.set_df_property("request_attachment", "description", "");
            }
            else {
                frm.set_df_property("request_attachment", "description", __("You can attach only pdf file"));
            }

            var creation_date = frm.doc.creation;
            var formatted_creation_date = creation_date.split(" ")[0] + " " + (creation_date.split(" ")[1]).split(".")[0];

            var modified_date = frm.doc.modified;
            var formatted_modified_date = modified_date.split(" ")[0] + " " + (modified_date.split(" ")[1]).split(".")[0];

            psa_utils.format_single_html_field(frm, "request_date_html", __('Request Date'), formatted_creation_date);

            if (frm.doc.status.includes("Approved by")) {
                psa_utils.format_single_html_field(frm, "modified_request_date_html", __('Approval Date'), formatted_modified_date);
            }
            else if (frm.doc.status.includes("Rejected by")) {
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
            });
        }
        else {
            $(frm.fields_dict["student_html1"].wrapper).html('');
            $(frm.fields_dict["student_html2"].wrapper).html('');
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
            "Suspend Enrollment Request Workflow",
            status_of_before_workflow_action,
            function (current_workflow_role) {
                current_role_of_workflow_action = current_workflow_role;
                psa_utils.insert_new_timeline_child_table(
                    "Suspend Enrollment Request",
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
                    });
                });

                if (status == "Suspended") {
                    psa_utils.get_url_to_new_form("Continue Enrollment Request", function (url) {
                        frm.set_intro((
                            `<div class="container">
                                    <div class="row">
                                        <div class="col-auto me-auto">` +
                            __(`Can't add a suspend enrollment request, because current status is ${status}!` +
                                `</div>
                                        <div class="col-auto me-auto">
                                            <a href="${url}">` +
                                __(`Do you want to add a continue enrollment request?`) +
                                `</a>
                                        </div>
                                    </div>
                                </div>`
                            )), 'red');
                    });
                }

                else if (status == "Withdrawn") {
                    frm.set_intro((__(`Can't add a suspend enrollment request, because current status is ${status}!`)), 'red');
                }

                else {
                    psa_utils.get_active_request("Suspend Enrollment Request", frm.doc.program_enrollment, function (doc) {
                        if (doc) {
                            frm.set_intro('');
                            var url_of_active_request = `<a href="/app/suspend-enrollment-request/${doc.name}" title="${__("Click here to show request details")}"> ${doc.name} </a>`;
                            frm.set_intro((__(`Can't add a suspend enrollment request, because you have an active suspend enrollment request (`) + url_of_active_request + __(`) that is ${doc.status}!`)), 'red');
                        }
                        else {
                            psa_utils.get_active_request("Continue Enrollment Request", frm.doc.program_enrollment, function (doc) {
                                if (doc) {
                                    frm.set_intro('');
                                    var url_of_active_request = `<a href="/app/continue-enrollment-request/${doc.name}" title="${__("Click here to show request details")}"> ${doc.name} </a>`;
                                    frm.set_intro((__(`Can't add a suspend enrollment request, because you have an active continue enrollment request (`) + url_of_active_request + __(`) that is ${doc.status}!`)), 'red');
                                }
                                else {
                                    psa_utils.get_active_request("Withdrawal Request", frm.doc.program_enrollment, function (doc) {
                                        if (doc) {
                                            frm.set_intro('');
                                            var url_of_active_request = `<a href="/app/withdrawal-request/${doc.name}" title="${__("Click here to show request details")}"> ${doc.name} </a>`;
                                            frm.set_intro((__(`Can't add a suspend enrollment request, because you have an active withdrawal request (`) + url_of_active_request + __(`) that is ${doc.status}!`)), 'red');
                                        }
                                        else if (status == "Continued") {
                                            frm.set_intro((__(`Current status is ${status}.`)), 'green');
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
        else {
            $(frm.fields_dict["student_html1"].wrapper).html('');
            $(frm.fields_dict["student_html2"].wrapper).html('');
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
//             "Suspend Enrollment Request",
//             frm.doc.name,
//             "timeline_child_table",
//             timeline_child_table_list,
//             function(response) {
//                 if (response.message) {
//                     window.location.reload();
//                   }
//             }
//         );
//     }
// },
