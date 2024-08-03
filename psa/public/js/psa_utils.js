//declare namespace 'psa_utils'
var psa_utils = {};


psa_utils.set_student_for_current_user = function (frm, field_name, callback) {
    frappe.call({
        method: 'psa.api.psa_utils.get_student_for_current_user',
        callback: function(response) {
            if (response.message) {
                frm.set_value(field_name, response.message);
                refresh_field(field_name);
                if (typeof callback === 'function') {
                    callback();
                }
            }
        }
    });
}


psa_utils.set_program_enrollment_for_current_user = function (frm, field_name, callback) {
    frappe.call({
        method: 'psa.api.psa_utils.get_program_enrollment_for_current_user',
        callback: function(response) {
            if (response.message) {
                frm.set_value(field_name, response.message);
                refresh_field(field_name);
                if (typeof callback === 'function') {
                    callback();
                }
            }
        }
    });
}


psa_utils.set_program_enrollment_for_student = function (frm, field_name, student, callback) {
    frappe.call({
        method: 'psa.api.psa_utils.get_program_enrollment_for_student',
        args: {
            "student": student
        },
        callback: function(response) {
            if (response.message) {
                frm.set_value(field_name, response.message);
                refresh_field(field_name);
                if (typeof callback === 'function') {
                    callback();
                }
            }
        }
    });
}


psa_utils.set_student_supervisor_for_student_and_program_enrollment = function (frm, field_name, student, program_enrollment, callback) {
    frappe.call({
        method: 'psa.api.psa_utils.get_student_supervisor_for_student_and_program_enrollment',
        args: {
            "student": student,
            "program_enrollment": program_enrollment
        },
        callback: function(response) {
            if (response.message) {
                frm.set_value(field_name, response.message);
                refresh_field(field_name);
                if (typeof callback === 'function') {
                    callback();
                }
            }
        }
    });
}


psa_utils.set_student_research_for_student_and_program_enrollment = function (frm, field_name, student, program_enrollment, callback) {
    frappe.call({
        method: 'psa.api.psa_utils.get_student_research_for_student_and_program_enrollment',
        args: {
            "student": student,
            "program_enrollment": program_enrollment
        },
        callback: function(response) {
            if (response.message) {
                frm.set_value(field_name, response.message);
                refresh_field(field_name);
                if (typeof callback === 'function') {
                    callback();
                }
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
            doctype: 'Program Specification',
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


psa_utils.set_supervisor_for_student = function (frm, field_name, student, program_enrollment) {
    frappe.call({
        method: 'psa.tasks.cron.get_supervisor_for_student',
        args: {
            "student": student,
            "program_enrollment": program_enrollment
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


psa_utils.set_researcher_meetings = function (frm, field_name, student, program_enrollment, from_date, to_date) {
    frappe.call({
        method: 'psa.api.psa_utils.get_researcher_meetings',
        args: {
            student: student,
            program_enrollment: program_enrollment,
            from_date: from_date,
            to_date: to_date
        },
        callback: function (response) {
            for (let meeting of response.message) {
                var new_meeting = frm.add_child(field_name);
                new_meeting.meeting_id = meeting['name'];
                new_meeting.date = meeting['meeting_date'];
                frm.refresh_field(field_name);
            }
        }
    });
}


psa_utils.set_program_enrollment_information = function (frm, field_name, student, program_enrollment) {
    frappe.call({
        method: 'psa.api.psa_utils.get_program_enrollment_information',
        args: {
            student: student,
            program_enrollment: program_enrollment
        },
        callback: function (response) {
            var data = response.message || {};
            
            var full_name_arabic = data.full_name_arabic || "--";
            var full_name_english = data.full_name_english || "--";
            var enrollment_date = data.enrollment_date || "--";
            var program_enrollment_faculty = data.program_enrollment_faculty || "--";
            var program = data.program || "--";
            var status = data.status || "--";
            var program_name = data.program_name || "--";
            var program_faculty = data.program_faculty || "--";
            var program_faculty_department = data.program_faculty_department || "--";
            var program_degree = data.program_degree || "--";
            var research_title_arabic = data.research_title_arabic || "--";
            var research_title_english = data.research_title_english || "--";
            var date_of_approval_of_the_research_title = data.date_of_approval_of_the_research_title || "--";
            var main_student_supervisor_id = data.main_student_supervisor_id || "--";
            var main_supervisor_faculty_member = data.main_supervisor_faculty_member || "--";
            var main_supervisor_name_arabic = data.main_supervisor_name_arabic || "--";
            var main_supervisor_appointment_date = data.main_supervisor_appointment_date || "--";
            var main_supervisor_faculty_member_faculty = data.main_supervisor_faculty_member_faculty || "--";
            var main_supervisor_name_english = data.main_supervisor_name_english || "--";
            var main_supervisor_academic_rank = data.main_supervisor_academic_rank || "--";
            var co_supervisors = null;

            if (data.co_supervisors.length != 0) {
                co_supervisors =
                    `
                    <tr><td colspan="2"><strong>${__("Co-Supervisors:")}</strong></td></tr>
                    <tr><td colspan="2">
                        <table class="table table-striped table-bordered mt-0">
                            <tbody>
                                <tr><td>#</td><td>${__("Name (Arabic):")}</td><td>${__("Appointment Date:")}</td>
                    `;
                co_supervisors += (data.co_supervisors).map(function (co_supervisor, index) {
                    return `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${co_supervisor.name || "--"}</td>
                            <td>${co_supervisor.appointment_date || "--"}</td>
                        </tr>
                    `;
                }).join('');

                co_supervisors += 
                `
                            </tbody>
                        </table>
                    </td></tr>
                `;
            }
            else {
                co_supervisors = `<tr><td><p><strong>${__("Co-Supervisors:")}</strong></p></td><td>--</td></tr>`;
            }

            $(frm.fields_dict[field_name].wrapper).html(`
                <div id="program_enrollment_information" class="program-enrollment-information">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="info-section">
                                <h3>${__("Student Details:")}</h3>
                                <table class="table table-striped ml-2">
                                    <tbody>
                                        <tr><td><strong>${__("Full Name (Arabic):")}</strong></td><td>${full_name_arabic}</td></tr>
                                        <tr><td><strong>${__("Full Name (English):")}</strong></td><td>${full_name_english}</td></tr>
                                        <tr><td><strong>${__("Program Enrollment Date:")}</strong></td><td>${enrollment_date}</td></tr>
                                        <tr><td><strong>${__("Program Enrollment Status:")}</strong></td><td>${status}</td></tr>
                                        <tr><td><strong>${__("Program Name:")}</strong></td><td>${program_name}</td></tr>
                                        <tr><td><strong>${__("Student Faculty:")}</strong></td><td>${program_enrollment_faculty}</td></tr>
                                        <tr><td><strong>${__("Program Specification:")}</strong></td><td>${program}</td></tr>
                                        <tr><td><strong>${__("Program Faculty:")}</strong></td><td>${program_faculty}</td></tr>
                                        <tr><td><strong>${__("Faculty Department:")}</strong></td><td>${program_faculty_department}</td></tr>
                                        <tr><td><strong>${__("Program Degree:")}</strong></td><td>${program_degree}</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="info-section">
                                <h3>${__("Research Details:")}</h3>
                                <table class="table table-striped ml-2">
                                    <tbody>
                                        <tr><td><strong>${__("Research Title (Arabic):")}</strong></td><td>${research_title_arabic}</td></tr>
                                        <tr><td><strong>${__("Research Title (English):")}</strong></td><td>${research_title_english}</td></tr>
                                        <tr><td><strong>${__("Date of Approval:")}</strong></td><td>${date_of_approval_of_the_research_title}</td></tr>
                                        <tr><td><strong>${__("Main Supervisor Name (Arabic):")}</strong></td><td>${main_supervisor_name_arabic}</td></tr>
                                        <tr><td><strong>${__("Main Supervisor Name (English):")}</strong></td><td>${main_supervisor_name_english}</td></tr>
                                        <tr><td><strong>${__("Main Supervisor's Appointment Date:")}</strong></td><td>${main_supervisor_appointment_date}</td></tr>
                                        <tr><td><strong>${__("Main Supervisor's Academic Rank:")}</strong></td><td>${main_supervisor_academic_rank}</td></tr>
                                        <tr><td><strong>${__("Main Supervisor's Faculty:")}</strong></td><td>${main_supervisor_faculty_member_faculty}</td></tr>
                                        ${co_supervisors}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `);

            frm.refresh_field(field_name);
        },
        error: function (error) {
            $(frm.fields_dict[field_name].wrapper).html('<div class="alert alert-danger">' + __('Failed to retrieve program enrollment information.') + '</div>');
        }
    });
};


psa_utils.get_single_value = function(doctype_name, field, callback) {
    frappe.call({
        method: 'psa.api.psa_utils.get_single_value',
        args: {
            doctype_name: doctype_name,
            field: field
        },
        callback: function(r) {
            if (typeof callback === 'function') {
                callback(r.message);
            }
        }
    });
};


psa_utils.go_to_transaction = function(refrenced_transaction) {
    if (refrenced_transaction){
        frappe.set_route('Form', 'Transaction', refrenced_transaction);
    }
};


psa_utils.scroll_to_transaction_information = function(frm, field_name) {
    frm.scroll_to_field(field_name, focus = true);
};


psa_utils.set_transaction_information = function(frm, field_name, doctype_name, doc_name) {
    frappe.call({
        method: 'psa.api.psa_utils.get_transaction_information',
        args: {
            doctype_name: doctype_name,
            doc_name: doc_name
        },
        callback: function(response) {
            if(response.message) {
                var transaction_name = response.message.name;
                var transaction_date = response.message.date;
                var transaction_status = response.message.status;

                var transaction_actions = [];
                var transaction_timeline = ``;

                if (transaction_actions.length == 0) {
                    transaction_timeline = `
                        <tr><td><strong class="text-danger">${__("There is No Action")}</strong></td></tr>
                    `;
                }
                else {
                    transaction_timeline = `
                        <tr><td><strong class="text-danger">${__("There is No Action")}</strong></td></tr>
                    `;
                }
                
                $(frm.fields_dict[field_name].wrapper).html(`
                    <div id="transaction_information" class="transaction-information">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="info-section">
                                    <h3>${__("Transaction Details:")}</h3>
                                    <table class="table table-striped ml-2">
                                        <tbody>
                                            <tr><td><strong>${__("Transaction ID:")}</strong></td><td><u><a onclick="psa_utils.go_to_transaction('${transaction_name}')">${transaction_name}</a></u></td></tr>
                                            <tr><td><strong>${__("Transaction Date:")}</strong></td><td>${transaction_date}</td></tr>
                                            <tr><td><strong>${__("Transaction Status:")}</strong></td><td><p class="text-danger">${transaction_status}</p></td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="info-section">
                                    <h3>${__("Transaction Timeline:")}</h3>
                                    <table class="table table-striped ml-2">
                                        <tbody>
                                            ${transaction_timeline}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                `);

                frm.refresh_field(field_name);
            }
            else {
                $(frm.fields_dict[field_name].wrapper).html(`
                    <div id="transaction_information" class="transaction-information">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="info-section">
                                    <h3>${__("Transaction Details:")}</h3>
                                    <table class="table table-striped ml-2">
                                        <tbody>
                                            <tr><td><strong class="text-danger">${__("There is No Transaction")}</strong></td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                `);

                frm.refresh_field(field_name);
            }
        }
    });
};


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
