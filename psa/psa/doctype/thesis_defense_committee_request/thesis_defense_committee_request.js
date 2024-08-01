// Copyright (c) 2024, Sana'a university and contributors
// For license information, please see license.txt


frappe.ui.form.on("Thesis Defense Committee Request", {
    validate(frm) {
        if (!check_minimum_supervisor_limit(frm)) {
            frappe.validated = false;
        }
    },

    refresh(frm) {
        $(frm.fields_dict["information"].wrapper).html("");

        frappe.call({
            method: 'psa.api.psa_utils.get_students_by_supervisor',
            callback: function(r) {
                if (r.message) {
                    let student_names = r.message.map(student => student.name);
                    
                    frm.set_query('student', function() {
                        return {
                            filters: {
                                'name': ['in', student_names]
                            }
                        };
                    });

                    console.log('Filtered students:', student_names);
                } else {
                    console.log('No students found.');
                }
            }
        });
        

        frm.fields_dict['member_of_internal_selected_committee'].grid.get_field('faculty_member').get_query = function (doc, cdt, cdn) {
            const row = locals[cdt][cdn];
            if (row.faculty == null || row.academic_rank == null) {
                return {
                    filters: {
                        'faculty': null,
                        'academic_rank': null,
                        // 'from_another_university': ['', null],
                        // 'contract_status': 1
                    }
                };
            }
            else {
                return {
                    filters: {
                        'faculty': row.faculty,
                        'academic_rank': row.academic_rank,
                        // 'from_another_university': ['', null],
                        // 'contract_status': 1
                    }
                };
            }
            
        };


        frm.fields_dict['member_of_external_selected_committee'].grid.get_field('faculty_member').get_query = function (doc, cdt, cdn) {
            const row = locals[cdt][cdn];
            if (row.university == null || row.external_faculty == null || row.academic_rank == null) {
                return {
                    filters: {
                        'from_another_university': null,
                        'external_faculty': null,
                        'academic_rank': null,
                        // 'from_another_university': ['', null],
                        // 'contract_status': 1
                    }
                };
            }
            else {
                return {
                    filters: {
                        'from_another_university': row.university,
                        'external_faculty': row.external_faculty,
                        'academic_rank': row.academic_rank,
                        // 'from_another_university': ['', null],
                        // 'contract_status': 1
                    }
                };
            }
        };


        frm.fields_dict['member_of_external_selected_committee'].grid.get_field('external_faculty').get_query = function (doc, cdt, cdn) {
            let row = locals[cdt][cdn];
            if (row.university == null) {
                return {
                    filters: {
                        'university': null
                    }
                };
            }
            else {
                return {
                    filters: {
                        'university': row.university
                    }
                };
            }
        };


        if (frm.doc.student && frm.doc.program_enrollment) {
            psa_utils.set_program_enrollment_information(frm, "information", frm.doc.student, frm.doc.program_enrollment);
        }

        override_add_row_button(frm, 'member_of_internal_selected_committee');
        override_add_row_button(frm, 'member_of_external_selected_committee');
    },



    onload(frm) {
        frappe.call({
            method: "frappe.client.get",
            args: {
                doctype: "PSA Settings",
                name: "PSA Settings"
            },
            callback: function (response) {
                if (response.message) {
                    frm.psa_settings = response.message;
                    console.log("PSA Settings loaded:", frm.psa_settings);

                }

                override_add_row_button(frm, 'member_of_internal_selected_committee');
                override_add_row_button(frm, 'member_of_external_selected_committee');
            }
        });

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

    program_enrollment(frm) {
        frm.set_intro('');
        if (frm.doc.program_enrollment) {
            psa_utils.set_student_research_for_student_and_program_enrollment(frm, "research_title", frm.doc.student, frm.doc.program_enrollment);
            psa_utils.set_student_supervisor_for_student_and_program_enrollment(frm, "student_supervisor", frm.doc.student, frm.doc.program_enrollment);

            psa_utils.set_program_enrollment_information(frm, "information", frm.doc.student, frm.doc.program_enrollment);
            psa_utils.check_program_enrollment_status(frm.doc.program_enrollment, ['Continued'], ['Suspended', 'Withdrawn', 'Graduated', 'Transferred'],
                function (program_enrollment_status) {
                    if (!program_enrollment_status[0]) {
                        frm.set_intro((__("Can't add a thesis defense committee request, because current status is {0}!", [program_enrollment_status[1]])), 'red');
                    }
                    else if (program_enrollment_status[0]) {
                        frappe.db.get_single_value('PSA Settings', 'check_active_requests_before_insert').then((check_active_requests_before_insert) => {
                            if (check_active_requests_before_insert) {
                                psa_utils.check_active_request(frm.doc.student, frm.doc.program_enrollment, ['Thesis Defense Committee Request', 'Change Research Main Supervisor Request', 'Suspend Enrollment Request', 'Continue Enrollment Request', 'Withdrawal Request'],
                                    function (active_request) {
                                        if (active_request) {
                                            var url_of_active_request = `<a href="/app/${active_request[0].toLowerCase().replace(/\s+/g, "-")}/${active_request[1]['name']}" title="${__("Click here to show request details")}"> ${active_request[1]['name']} </a>`;
                                            frm.set_intro((__(`Can't add a thesis defense committee request, because you have an active {0} ({1}) that is {2}!`, [active_request[0], url_of_active_request, active_request[1]['status']])), 'red');
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
        else {
            $(frm.fields_dict["information"].wrapper).html("");

            frm.set_value("student_supervisor", "");
            refresh_field("student_supervisor");

            frm.set_value("research_title", "");
            refresh_field("research_title");
        }
    },

});


frappe.ui.form.on("Internal Discussion Committee", {
    faculty: function (frm, cdt, cdn) {
        const row = locals[cdt][cdn];
        console.log("Selected faculty:", row.faculty);
        
        frappe.model.set_value(cdt, cdn, 'faculty_member', '');
        
        frm.fields_dict['member_of_internal_selected_committee'].grid.refresh(); // Ensure the grid is refreshed
        frm.fields_dict['member_of_internal_selected_committee'].grid.get_field('faculty_member').get_query = function (doc, cdt, cdn) {
            return {
                filters: {
                    'faculty': row.faculty,
                    'academic_rank': row.academic_rank,
                }
            };
        };
    },

    academic_rank: function (frm, cdt, cdn) {
        const row = locals[cdt][cdn];
        console.log("Selected academic rank:", row.academic_rank); // Print the selected academic rank
        
        // Clear the faculty_member field
        frappe.model.set_value(cdt, cdn, 'faculty_member', '');
        
        // Refresh the grid and update the field query
        frm.fields_dict['member_of_internal_selected_committee'].grid.refresh(); // Ensure the grid is refreshed
        frm.fields_dict['member_of_internal_selected_committee'].grid.get_field('faculty_member').get_query = function (doc, cdt, cdn) {
            return {
                filters: {
                    'faculty': row.faculty,
                    'academic_rank': row.academic_rank,
                }
            };
        };
    },


    faculty_member: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        let duplicate = frm.doc.member_of_internal_selected_committee.some((r) => r.faculty === row.faculty && r.academic_rank === row.academic_rank && r.faculty_member === row.faculty_member && r.idx !== row.idx);

        if (duplicate) {
            frappe.msgprint(__('This Faculty Member with the same faculty and academic rank is already selected. Please choose a different one.'));
            frappe.model.set_value(cdt, cdn, 'faculty_member', '');
        }
    }
});


frappe.ui.form.on("External Discussion Committee", {
    university: function (frm, cdt, cdn) {
        const row = locals[cdt][cdn];
        console.log("Selected university:", row.university); // Print the selected university
        
        // Clear the faculty_member field
        frappe.model.set_value(cdt, cdn, 'faculty_member', '');
        frappe.model.set_value(cdt, cdn, 'external_faculty', '');
        
        // Refresh the grid and update the field query
        frm.fields_dict['member_of_external_selected_committee'].grid.refresh(); // Ensure the grid is refreshed
        frm.fields_dict['member_of_external_selected_committee'].grid.get_field('faculty_member').get_query = function (doc, cdt, cdn) {
            return {
                filters: {
                    'from_another_university': row.university,
                    'external_faculty': row.external_faculty,
                    'academic_rank': row.academic_rank,
                }
            };
        };
    },

    academic_rank: function (frm, cdt, cdn) {
        const row = locals[cdt][cdn];
        console.log("Selected academic rank:", row.academic_rank); // Print the selected academic rank
        
        // Clear the faculty_member field
        frappe.model.set_value(cdt, cdn, 'faculty_member', '');
        
        // Refresh the grid and update the field query
        frm.fields_dict['member_of_external_selected_committee'].grid.refresh(); // Ensure the grid is refreshed
        frm.fields_dict['member_of_external_selected_committee'].grid.get_field('faculty_member').get_query = function (doc, cdt, cdn) {
            return {
                filters: {
                    'from_another_university': row.university,
                    'external_faculty': row.external_faculty,
                    'academic_rank': row.academic_rank,
                }
            };
        };
    },

    external_faculty: function (frm, cdt, cdn) {
        const row = locals[cdt][cdn];
        console.log("Selected external faculty:", row.external_faculty); // Print the selected external faculty
        
        // Clear the faculty_member field
        frappe.model.set_value(cdt, cdn, 'faculty_member', '');
        
        // Refresh the grid and update the field query
        frm.fields_dict['member_of_external_selected_committee'].grid.refresh(); // Ensure the grid is refreshed
        frm.fields_dict['member_of_external_selected_committee'].grid.get_field('faculty_member').get_query = function (doc, cdt, cdn) {
            return {
                filters: {
                    'from_another_university': row.university,
                    'external_faculty': row.external_faculty,
                    'academic_rank': row.academic_rank,
                }
            };
        };
    },


    faculty_member: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        let duplicate = frm.doc.member_of_external_selected_committee.some((r) => r.university === row.university && r.external_faculty === row.external_faculty  && r.academic_rank === row.academic_rank && r.faculty_member === row.faculty_member && r.idx !== row.idx);

        if (duplicate) {
            frappe.msgprint(__('This Faculty Member with the same university, external faculty, and academic rank is already selected. Please choose a different one.'));
            frappe.model.set_value(cdt, cdn, 'faculty_member', '');
        }
    }
});



function override_add_row_button(frm, fieldname) {
    frm.fields_dict[fieldname].grid.wrapper.find('.grid-add-row').off('click').on('click', function () {
        if (check_supervisor_limit(frm)) {
            frm.fields_dict[fieldname].grid.add_new_row();
        } else {
            frappe.msgprint(__('Cannot add more members. Limit reached.'));
        }
    });
}


function check_supervisor_limit(frm) {
    set_a_limit_on_the_number_of_suggested_committee_members = frm.psa_settings.set_a_limit_on_the_number_of_suggested_committee_members;
    if (!set_a_limit_on_the_number_of_suggested_committee_members) {
        console.log("No limit set for the number of members.");
        return true;
    }

    let max_member = frm.psa_settings.maximum_number_of_suggested_committee_members;
    let internal_count = frm.doc.member_of_internal_selected_committee ? frm.doc.member_of_internal_selected_committee.length : 0;
    let external_count = frm.doc.member_of_external_selected_committee ? frm.doc.member_of_external_selected_committee.length : 0;

    console.log("Max members allowed:", max_member);
    console.log("Current suggested supervisors count:", internal_count);
    console.log("Current external suggested supervisors count:", external_count);

    if ((internal_count + external_count) >= max_member) {
        frappe.msgprint(__('You have reached the maximum number of members.'));
        console.log("Cannot add more members. Limit reached.");
        return false;
    }
    return true;
}


function check_minimum_supervisor_limit(frm) {

    let min_members = frm.psa_settings.minimum_number_of_suggested_committee_members;
    let internal_count = frm.doc.member_of_internal_selected_committee ? frm.doc.member_of_internal_selected_committee.length : 0;
    let external_count = frm.doc.member_of_external_selected_committee ? frm.doc.member_of_external_selected_committee.length : 0;

    console.log("Min supervisors required:", min_members);
    console.log("Current suggested supervisors count:", internal_count);
    console.log("Current external suggested supervisors count:", external_count);

    if ((internal_count + external_count) < min_members) {
        frappe.msgprint(__('You must have at least {0} members.', [min_members]));
        console.log("Cannot save the document. Minimum members not met.");
        return false;
    }
    return true;
}