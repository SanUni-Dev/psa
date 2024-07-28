// Copyright (c) 2024, Sana'a university and contributors
// For license information, please see license.txt

frappe.ui.form.on("Progress Report", {
    refresh(frm) {
        setTimeout(() => {
            frm.page.actions.find(`[data-label='Help']`).parent().parent().remove();
        }, 500);

        if (!frm.is_new()) {
            if (frm.doc.meetings.length == 0) {
                $(frm.fields_dict["meetings_status"].wrapper).html(`<p>${__("There is not any meeting in the period.")}</p>`);
            }
            else {
                $(frm.fields_dict["meetings_status"].wrapper).html(``);
            }
        }
    },

    onload(frm) {
        if (frm.is_new() && frappe.user_roles.includes("Student")) {
            psa_utils.set_student_for_current_user(frm, "student", function () {
                psa_utils.set_program_enrollment_for_current_user(frm, "program_enrollment", function () {
                    psa_utils.set_student_supervisor_for_student_and_program_enrollment(frm, "supervisor", frm.doc.student, frm.doc.program_enrollment, function () {
                        psa_utils.set_student_research_for_student_and_program_enrollment(frm, "research", frm.doc.student, frm.doc.program_enrollment);
                    });
                });
            });
        }
    },

    program_enrollment(frm) {
        frm.set_intro('');
        frm.set_value("supervisor", "");
        refresh_field("supervisor");
        frm.set_value("research", "");
        refresh_field("research");
        frm.set_value("meetings", null);
        refresh_field("meetings");

        if (frm.doc.program_enrollment) {
            psa_utils.set_student_supervisor_for_student_and_program_enrollment(frm, "supervisor", frm.doc.student, frm.doc.program_enrollment);
            psa_utils.set_student_research_for_student_and_program_enrollment(frm, "research", frm.doc.student, frm.doc.program_enrollment);
            
            if (frm.doc.student && frm.doc.program_enrollment && frm.doc.from_date && frm.doc.to_date) {
                psa_utils.set_researcher_meetings(frm, "meetings", frm.doc.student, frm.doc.program_enrollment, frm.doc.from_date, frm.doc.to_date);
            }
            
            psa_utils.check_program_enrollment_status(frm.doc.program_enrollment, ['Continued'], ['Suspended', 'Withdrawn', 'Graduated', 'Transferred'],
                function (program_enrollment_status) {
                    if (!program_enrollment_status[0]) {
                        frm.set_intro((__("Can't add a progress report, because current status is {0}!", [program_enrollment_status[1]])), 'red');
                    }
                    else if (program_enrollment_status[0]) {
                        frappe.db.get_single_value('PSA Settings', 'check_active_requests_before_insert').then((check_active_requests_before_insert) => {
                            if (check_active_requests_before_insert) {
                                psa_utils.check_active_request(frm.doc.student, frm.doc.program_enrollment, ['Suspend Enrollment Request', 'Continue Enrollment Request', 'Withdrawal Request'],
                                    function (active_request) {
                                        if (active_request) {
                                            var url_of_active_request = `<a href="/app/${active_request[0].toLowerCase().replace(/\s+/g, "-")}/${active_request[1]['name']}" title="${__("Click here to show request details")}"> ${active_request[1]['name']} </a>`;
                                            frm.set_intro((__(`Can't add a progress report, because you have an active {0} ({1}) that is {2}!`, [active_request[0], url_of_active_request, active_request[1]['status']])), 'red');
                                        }
                                        else {
                                            frm.set_intro((__(`Current status is {0}.`, [program_enrollment_status[1]])), 'green');
                                        }
                                    }
                                );
                            }
                            else {
                                frm.set_intro((__(`Current status is {0}.`, [program_enrollment_status[1]])), 'green');
                            }
                        });
                    }
                }
            );
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

    from_date(frm) {
        frm.set_value("meetings", null);

        if (frm.doc.student && frm.doc.program_enrollment && frm.doc.from_date && frm.doc.to_date) {
            psa_utils.set_researcher_meetings(frm, "meetings", frm.doc.student, frm.doc.program_enrollment, frm.doc.from_date, frm.doc.to_date);
        }
    },

    to_date(frm) {
        frm.set_value("meetings", null);

        if (frm.doc.student && frm.doc.program_enrollment && frm.doc.from_date && frm.doc.to_date) {
            psa_utils.set_researcher_meetings(frm, "meetings", frm.doc.student, frm.doc.program_enrollment, frm.doc.from_date, frm.doc.to_date);
        }
    },

    go_to_meetings(frm) {
        if(frm.doc.meetings) {
            frm.scroll_to_field("meetings", focus = true);
        }
    },
});
