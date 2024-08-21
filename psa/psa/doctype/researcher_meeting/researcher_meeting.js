// Copyright (c) 2024, Sana'a university and contributors
// For license information, please see license.txt


frappe.ui.form.on('Researcher Meeting', {
    setup: function (frm) {
        frm.set_query("student_supervisor", "meeting_with", function (doc, cdt, cdn) {
            return {
                "filters": {
                    "program_enrollment": frm.doc.program_enrollment,
                    "student": frm.doc.student,
                    "status": "Active",
                    "enabled": 1
                }
            };
        });
    },

    refresh(frm) {
        $(frm.fields_dict["information"].wrapper).html("");

        if (frm.doc.student && frm.doc.program_enrollment) {
            psa_utils.set_program_enrollment_information(frm, "information", frm.doc.student, frm.doc.program_enrollment);
        }
    },

    onload(frm) {
        if (frm.is_new() && frappe.user_roles.includes("Student")) {
            psa_utils.set_student_for_current_user(frm, "student", function () {
                psa_utils.set_program_enrollment_for_current_user(frm, "program_enrollment", function() {
                    psa_utils.set_student_research_for_student_and_program_enrollment(frm, "student_research", frm.doc.student, frm.doc.program_enrollment);
                });
            });
        }
    },

    program_enrollment(frm) {
        frm.set_intro('');
        frm.set_value("student_research", "");
        refresh_field("student_research");
        
        if (frm.doc.program_enrollment) {
            psa_utils.set_program_enrollment_information(frm, "information", frm.doc.student, frm.doc.program_enrollment);
            psa_utils.set_student_research_for_student_and_program_enrollment(frm, "student_research", frm.doc.student, frm.doc.program_enrollment);

            psa_utils.check_program_enrollment_status(frm.doc.program_enrollment, ['Continued'], ['Suspended', 'Withdrawn', 'Graduated', 'Transferred'],
                function (program_enrollment_status) {
                    if (!program_enrollment_status[0]) {
                        frm.set_intro('');
                        frm.set_intro((__("Can't add a researcher meeting, because current status is {0}!", [program_enrollment_status[1]])), 'red');
                    }
                    else if (program_enrollment_status[0]) {
                        psa_utils.get_single_value('PSA Settings', 'check_active_requests_before_insert', function (check_active_requests_before_insert) {
                            if (check_active_requests_before_insert) {
                                psa_utils.check_active_request(frm.doc.student, frm.doc.program_enrollment, ['Suspend Enrollment Request', 'Continue Enrollment Request', 'Withdrawal Request'],
                                    function (active_request) {
                                        if (active_request) {
                                            frm.set_intro('');
                                            var url_of_active_request = `<a href="/app/${active_request[0].toLowerCase().replace(/\s+/g, "-")}/${active_request[1]['name']}" title="${__("Click here to show request details")}"> ${active_request[1]['name']} </a>`;
                                            frm.set_intro((__(`Can't add a researcher meeting, because you have an active {0} ({1}) that is {2}!`, [active_request[0], url_of_active_request, active_request[1]['status']])), 'red');
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
                    }
                }
            );
        }
        else {
            $(frm.fields_dict["information"].wrapper).html("");
            frm.set_value("student_research", "");
            refresh_field("student_research");
            frm.set_value("meeting_with", null);
            refresh_field("meeting_with");
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


frappe.ui.form.on('Meeting with', {
    student_supervisor: function(frm, cdt, cdn) {
        var d = locals[cdt][cdn];
        $.each(frm.doc.meeting_with, function(i, row) {
            if (row.student_supervisor === d.student_supervisor && row.name != d.name) {
               frappe.msgprint(__("Duplicated Rows!<br><br>Can't add a student supervisor more than once."));
               frappe.model.remove_from_locals(cdt, cdn);
               frm.refresh_field('meeting_with');
               return false;
            }
        });
    }
});
