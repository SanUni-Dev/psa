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
            format_timeline_html(frm, "timeline_html", frm.doc.timeline_child_table);

            if (frm.doc.fees_status == "Not Paid") {
                frm.set_intro((__(`You have to pay fees of request before confirm it!`)), 'red');
            }

            frm.set_df_property("attachment_section", "hidden", false);
            if (frm.doc.request_attachment) {
                frm.set_df_property("request_attachment", "description", "");
            }
            else {
                frm.set_df_property("request_attachment", "description", __("You can attach only pdf file"));
            }

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

            var creation_date = frm.doc.creation;
            var formatted_creation_date = creation_date.split(" ")[0] + " " + (creation_date.split(" ")[1]).split(".")[0];

            var modified_date = frm.doc.modified;
            var formatted_modified_date = modified_date.split(" ")[0] + " " + (modified_date.split(" ")[1]).split(".")[0];

            format_single_html_field(frm, "request_date_html", __('Request Date'), formatted_creation_date);

            if (frm.doc.status == "Approved by College Dean" ||
                frm.doc.status == "Approved by College Council") {
                format_single_html_field(frm, "modified_request_date_html", __('Approval Date'), formatted_modified_date);
            }
            else if (frm.doc.status == "Rejected by Vice Dean for GSA" ||
                frm.doc.status == "Rejected by Department Head" ||
                frm.doc.status == "Rejected by Department Council" ||
                frm.doc.status == "Rejected by College Dean" ||
                frm.doc.status == "Rejected by College Council") {
                format_single_html_field(frm, "modified_request_date_html", __('Rejection Date'), formatted_modified_date);
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
            get_program_enrollment_status(frm, function (status) {
                get_year_of_enrollment(frm, function (creation_date, full_name_arabic, full_name_english, program, college, department, specialization) {
                    var year_of_enrollment = new Date(creation_date).getFullYear();

                    var array_of_label = [__("Full Name Arabic"), __("Full Name English"), __("Year of Enrollment"), __("Program")];
                    var array_of_value = [full_name_arabic, full_name_english, year_of_enrollment, program];
                    format_multi_html_field(frm, "student_html1", array_of_label, array_of_value);

                    var array_of_label = [__("College"), __("Department"), __("Specialization"), __("Status")];
                    var array_of_value = [college, department, specialization, status];
                    format_multi_html_field(frm, "student_html2", array_of_label, array_of_value);
                });
            });
        }
        else {
            $(frm.fields_dict["student_html1"].wrapper).html('');
            $(frm.fields_dict["student_html2"].wrapper).html('');
        }
    },

    request_attachment(frm) {
        if (frm.doc.request_attachment) {
            frm.set_df_property("request_attachment", "description", "");
        }
        else {
            frm.set_df_property("request_attachment", "description", __("You can attach only pdf file"));
        }
    },

    onload(frm) {
        // Uncomment it
        // if (frm.is_new()) {
        //     psa.set_program_enrollment_for_current_user(frm, "program_enrollment");
        // }
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
        get_current_workflow_role_and_insert_new_timeline_child_table(frm);
    },

    program_enrollment(frm) {
        frm.set_intro('');
        if (frm.doc.program_enrollment) {
            get_program_enrollment_status(frm, function (status) {
                get_year_of_enrollment(frm, function (creation_date, full_name_arabic, full_name_english, program, college, department, specialization) {
                    var year_of_enrollment = new Date(creation_date).getFullYear();

                    var array_of_label = [__("Full Name Arabic"), __("Full Name English"), __("Year of Enrollment"), __("Program")];
                    var array_of_value = [full_name_arabic, full_name_english, year_of_enrollment, program];
                    format_multi_html_field(frm, "student_html1", array_of_label, array_of_value);

                    var array_of_label = [__("College"), __("Department"), __("Specialization"), __("Status")];
                    var array_of_value = [college, department, specialization, status];
                    format_multi_html_field(frm, "student_html2", array_of_label, array_of_value);
                });

                if (status == "Suspended") {
                    get_url_to_new_form("Continue Enrollment Request", function (url) {
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
                    get_active_request(frm, frm.doc.program_enrollment, "Suspend Enrollment Request", function (doc) {
                        if (doc) {
                            frm.set_intro('');
                            var url_of_active_request = `<a href="/app/suspend-enrollment-request/${doc.name}" title="${__("Click here to show request details")}"> ${doc.name} </a>`;
                            frm.set_intro((__(`Can't add a suspend enrollment request, because you have an active suspend enrollment request (`) + url_of_active_request + __(`) that is ${doc.status}!`)), 'red');
                        }
                        else {
                            get_active_request(frm, frm.doc.program_enrollment, "Continue Enrollment Request", function (doc) {
                                if (doc) {
                                    frm.set_intro('');
                                    var url_of_active_request = `<a href="/app/continue-enrollment-request/${doc.name}" title="${__("Click here to show request details")}"> ${doc.name} </a>`;
                                    frm.set_intro((__(`Can't add a suspend enrollment request, because you have an active continue enrollment request (`) + url_of_active_request + __(`) that is ${doc.status}!`)), 'red');
                                }
                                else {
                                    get_active_request(frm, frm.doc.program_enrollment, "Withdrawal Request", function (doc) {
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
});



// Custom functions
function get_active_request(frm, program_enrollment, doctype_name, callback) {
    frappe.call({
        method: 'get_active_request',
        doc: frm.doc,
        args: {
            "program_enrollment": program_enrollment,
            "doctype_name": doctype_name
        },
        callback: function (response) {
            callback(response.message);
        }
    });
}


function get_program(program, callback) {
    frappe.call({
        method: 'frappe.client.get_value',
        args: {
            doctype: 'Program',
            filters: {
                name: program
            },
            fieldname: ['college', 'department', 'specialization']
        },
        callback: function (response) {
            var college = response.message.college;
            var department = response.message.department;
            var specialization = response.message.specialization;
            callback(college, department, specialization);
        }
    });
}


function get_psa_student(creation_date, student_name, program, callback) {
    frappe.call({
        method: 'frappe.client.get_value',
        args: {
            doctype: 'PSA Student',
            filters: {
                name: student_name
            },
            fieldname: ['full_name_arabic', 'full_name_english']
        },
        callback: function (response) {
            var full_name_arabic = response.message.full_name_arabic;
            var full_name_english = response.message.full_name_english;

            get_program(program, function (college, department, specialization) {
                callback(full_name_arabic, full_name_english, creation_date, program, college, department, specialization);
            });
        }
    });
}


function get_year_of_enrollment(frm, callback) {
    frappe.call({
        method: 'frappe.client.get_value',
        args: {
            doctype: 'Program Enrollment',
            filters: {
                name: frm.doc.program_enrollment
            },
            fieldname: ['creation', 'program', 'student']
        },
        callback: function (response) {
            var creation_date = response.message.creation;
            var student_name = response.message.student;
            var program = response.message.program;

            get_psa_student(creation_date, student_name, program, function (full_name_arabic, full_name_english, creation_date, program, college, department, specialization) {
                callback(creation_date, full_name_arabic, full_name_english, program, college, department, specialization);
            });
        }
    });
}


function get_program_enrollment_status(frm, callback) {
    frappe.call({
        method: 'frappe.client.get_value',
        args: {
            doctype: 'Program Enrollment',
            filters: {
                name: frm.doc.program_enrollment
            },
            fieldname: ['status']
        },
        callback: function (response) {
            var status = response.message.status;
            callback(status);
        }
    });
}


function format_single_html_field(frm, html_field_name, field_label, field_value) {
    $(frm.fields_dict[html_field_name].wrapper).html(
        `<div class="form-group">
          <div class="clearfix">
            <label class="control-label" style="padding-right: 0px;">`
        + field_label +
        `</label>
          </div>
          <div class="control-input-wrapper">
            <div class="control-value like-disabled-input">`
        + field_value +
        `</div>
          </div>
        </div>`
    );
}


function format_multi_html_field(frm, html_field_name, array_of_label, array_of_value) {
    var html_content = "";

    for (let i = 0; i < array_of_label.length; i++) {
        const label = array_of_label[i];
        const value = array_of_value[i];

        html_content = html_content + `<div class="form-group">
          <div class="clearfix">
            <label class="control-label" style="padding-right: 0px;">`
            + label +
            `</label>
          </div>
          <div class="control-input-wrapper">
            <div class="control-value like-disabled-input">`
            + value +
            `</div>
          </div>
        </div>`;
    }

    $(frm.fields_dict[html_field_name].wrapper).html(html_content);
}


function format_timeline_html(frm, html_field_name, timeline_child_table_name) {
    if (timeline_child_table_name.length > 0) {
        var html_content = `<div class="new-timeline">
                            <div class="timeline-item activity-title">
                                <h4>${__('Activity')}</h4>
                            </div>
                            <div class="timeline-items">`;
        for (var i = 0; i < timeline_child_table_name.length; i++) {
            let record = timeline_child_table_name[i];
            html_content = html_content + `<div class="timeline-item">
                                            <div class="timeline-dot"></div>
                                            <div class="timeline-content ">
                                                <table>
                                                    <tr>
                                                        <th>Role:</th>
                                                        <td>${record.position}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>Name:</th>
                                                        <td>${record.full_name}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>Previous Status:</th>
                                                        <td>${record.previous_status}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>Action:</th>
                                                        <td>${record.action}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>Next Status:</th>
                                                        <td>${record.next_status}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>Recieved Date:</th>
                                                        <td>${record.received_date}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>Action Date:</th>
                                                        <td>${record.action_date}</td>
                                                    </tr>
                                                </table>
                                            </div>
                                        </div>`
        }
        html_content = html_content + "</div></div>"
        $(frm.fields_dict[html_field_name].wrapper).html(html_content);
        frm.set_df_property("timeline_section", "hidden", false);
    }
    else {
        $(frm.fields_dict[html_field_name].wrapper).html("");
        frm.set_df_property("timeline_section", "hidden", true);
    }
}


function get_url_to_new_form(doctype_name, callback) {
    frappe.call({
        method: 'psa.api.psa_utils.get_url_to_new_form',
        args: {
            "doctype_name": doctype_name
        },
        callback: function (response) {
            callback(response.message);
        }
    });
}


function get_current_workflow_role_and_insert_new_timeline_child_table(frm) {
    frappe.call({
        method: 'get_current_workflow_role',
        doc: frm.doc,
        args: {
            current_status: status_of_before_workflow_action
        },
        callback: function (response) {
            if (response.message) {
                current_role_of_workflow_action = response.message;
            }

            frappe.call({
                method: "insert_new_timeline_child_table",
                doc: frm.doc,
                args: {
                    "dictionary_of_values": {
                        "position": current_role_of_workflow_action,
                        "full_name": current_user_of_workflow_action,
                        "previous_status": status_of_before_workflow_action,
                        "received_date": modified_of_before_workflow_action,
                        "action": action_of_workflow,
                        "next_status": status_of_after_workflow_action,
                        "action_date": modified_of_after_workflow_action
                    }
                },
                callback: function (response) {
                    if (response.message) {
                        // location.reload();
                    }
                },
                error: function (xhr, textStatus, error) {
                    console.log("AJAX Error:", error);
                    frappe.msgprint("An error occurred during the AJAX request.");
                }
            });
        }
    });
}
