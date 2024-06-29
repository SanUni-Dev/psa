//declare namespace 'psa_utils'
var psa_utils = {};


psa_utils.set_student_for_current_user = function (frm, field_name, callback) {
    frappe.call({
        method: 'psa.api.psa_utils.get_student_for_current_user',
        callback: function(response) {
            if (response.message) {
                frm.set_value(field_name, response.message);
                refresh_field(field_name);
                callback();
            }
        }
    });
}


psa_utils.set_program_enrollment_for_current_user = function (frm, field_name) {
    frappe.call({
        method: 'psa.api.psa_utils.get_program_enrollment_for_current_user',
        callback: function(response) {
            if (response.message) {
                frm.set_value(field_name, response.message);
                refresh_field(field_name);
            }
        }
    });
}


psa_utils.set_program_enrollment_for_student = function (frm, field_name, student) {
    frappe.call({
        method: 'psa.api.psa_utils.get_program_enrollment_for_student',
        args: {
            "student": student
        },
        callback: function(response) {
            if (response.message) {
                frm.set_value(field_name, response.message);
                refresh_field(field_name);
            }
        }
    });
}


psa_utils.get_url_to_new_form = function (doctype_name, callback) {
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


psa_utils.format_single_html_field = function (frm, html_field_name, field_label, field_value) {
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


psa_utils.format_multi_html_field = function (frm, html_field_name, array_of_label, array_of_value) {
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


psa_utils.format_timeline_html = function (frm, html_field_name, timeline_child_table_name) {
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


psa_utils.get_current_workflow_role = function (doctype_workflow_name, current_status, callback) {
    frappe.call({
        method: 'psa.api.psa_utils.get_current_workflow_role',
        args: {
            "doctype_workflow_name": doctype_workflow_name,
            "current_status": current_status
        },
        callback: function (response) {
            if (response.message) {
                var current_workflow_role = response.message;
                callback(current_workflow_role);
            }
            else {
                var current_workflow_role = "";
                callback(current_workflow_role);
            }
        }
    });
}


psa_utils.insert_new_timeline_child_table = function (doctype_name, doc_name, timeline_child_table_name, dictionary_of_values) {
    frappe.call({
        method: "psa.api.psa_utils.insert_new_timeline_child_table",
        args: {
            "doctype_name": doctype_name,
            "doc_name": doc_name,
            "timeline_child_table_name": timeline_child_table_name,
            "dictionary_of_values": dictionary_of_values
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


psa_utils.get_program_enrollment_status = function (program_enrollment, callback) {
    frappe.call({
        method: 'psa.api.psa_utils.get_program_enrollment_status',
        args: {
            "program_enrollment": program_enrollment
        },
        callback: function (response) {
            callback(response.message);
        }
    });
}


psa_utils.check_program_enrollment_status = function (program_enrollment, accepted_status_list, rejected_status_list, callback) {
    frappe.call({
        method: 'psa.api.psa_utils.check_program_enrollment_status',
        args: {
            "program_enrollment": program_enrollment,
            "accepted_status_list": accepted_status_list,
            "rejected_status_list": rejected_status_list
        },
        callback: function (response) {
            callback(response.message);
        }
    });
}


psa_utils.active_request = function (doctype_name, student, program_enrollment, docstatus_list, status_list, callback) {
    frappe.call({
        method: 'psa.api.psa_utils.active_request',
        args: {
            "doctype_name": doctype_name,
            "student": student,
            "program_enrollment": program_enrollment,
            "docstatus_list": docstatus_list,
            "status_list": status_list
        },
        callback: function (response) {
            callback(response.message);
        }
    });
}


psa_utils.check_active_request = function (student, program_enrollment, doctype_list, callback) {
    frappe.call({
        method: 'psa.api.psa_utils.check_active_request',
        args: {
            "student": student,
            "program_enrollment": program_enrollment,
            "doctype_list": doctype_list
        },
        callback: function (response) {
            callback(response.message);
        }
    });
}


psa_utils.get_program_enrollment = function (program_enrollment, callback) {
    frappe.call({
        method: 'frappe.client.get_value',
        args: {
            doctype: 'Program Enrollment',
            filters: {
                name: program_enrollment
            },
            fieldname: ['status', 'enrollment_date', 'program', 'student']
        },
        callback: function (response) {
            var status = response.message.status;
            var enrollment_date = response.message.enrollment_date;
            var student = response.message.student;
            var academic_program = response.message.program;
            
            callback(status, enrollment_date, student, academic_program);
        }
    });
}


psa_utils.get_academic_program = function (academic_program, callback) {
    frappe.call({
        method: 'frappe.client.get_value',
        args: {
            doctype: 'Academic Program',
            filters: {
                name: academic_program
            },
            fieldname: ['program_abbreviation', 'faculty', 'faculty_department']
        },
        callback: function (response) {
            var program_abbreviation = response.message.program_abbreviation;
            var faculty = response.message.faculty;
            var faculty_department = response.message.faculty_department;

            callback(program_abbreviation, faculty, faculty_department);
        }
    });
}


psa_utils.get_student = function (student, callback) {
    frappe.call({
        method: 'frappe.client.get_value',
        args: {
            doctype: 'Student',
            filters: {
                name: student
            },
            fieldname: ['first_name', 'middle_name', 'last_name', 'first_name_en', 'middle_name_en', 'last_name_en']
        },
        callback: function (response) {
            var full_name_arabic = response.message.first_name + " " + response.message.middle_name + " " + response.message.last_name;
            var full_name_english = response.message.first_name_en + " " + response.message.middle_name_en + " " + response.message.last_name_en;

            callback(full_name_arabic, full_name_english);
        }
    });
}


psa_utils.get_supervisor = function (student, callback) {
    frappe.call({
        method: 'frappe.client.get_value',
        args: {
            doctype: 'Student Supervisor',
            filters: {
                student: student,
                enabled: 1,
                type: 'Main Supervisor'
            },
            fieldname: ['supervisor']
        },
        callback: function (response) {
            if (response.message) {
                var supervisor = response.message.supervisor;
                frappe.call({
                    method: 'frappe.client.get_value',
                    args: {
                        doctype: 'Faculty Member',
                        filters: {
                            name: supervisor
                        },
                        fieldname: ['employee']
                    },
                    callback: function (response) {
                        if (response.message) {
                            var employee = response.message.employee;
                            callback(employee);
                        } else {
                            callback(null);
                        }
                    }
                });
            } else {
                callback(null);
            }
        }
    });
}


psa_utils.set_supervisor_for_student = function (frm, field_name, student) {
    frappe.call({
        method: 'psa.tasks.cron.get_supervisor_for_student',
        args: {
            "student": student
        },
        callback: function(response) {
            if (response.message) {
                frm.set_value(field_name, response.message);
                refresh_field(field_name);
            } else {
                frappe.msgprint(__('لم يتم العثور على مشرف.'));
            }
        }
    });
}


// Function to save timeline child table rows (before fixing it by check "In List View" in Timeline Child Table's fields)
// psa_utils.save_timeline_child_table = function (doctype_name, doc_name, timeline_child_table_name, timeline_child_table_list, callback) {
//     frappe.call({
//         method: "psa.api.psa_utils.save_timeline_child_table",
//         args: {
//             "doctype_name": doctype_name,
//             "doc_name": doc_name,
//             "timeline_child_table_name": timeline_child_table_name,
//             "timeline_child_table_list": timeline_child_table_list
//         },
//         callback: function (response) {
//             callback(response);
//         }
//     });
// }
