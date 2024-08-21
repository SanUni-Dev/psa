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
        $(frm.fields_dict["transaction_information"].wrapper).html("");

        if (frm.doc.student && frm.doc.program_enrollment) {
            psa_utils.set_program_enrollment_information(frm, "information", frm.doc.student, frm.doc.program_enrollment);
        }

        if (frm.doc.docstatus == 1) {
            // frm.set_df_property("modified_request_date", "label", __("Transaction Creation Date"));
            // frm.doc.modified_request_date = frm.doc.modified.split(" ")[0] + " " + (frm.doc.modified.split(" ")[1]).split(".")[0];
            // frm.refresh_field('modified_request_date');
            
            // $(frm.fields_dict["transaction_information"].wrapper).html("");
            psa_utils.set_transaction_information(frm, "transaction_information", frm.doc.doctype, frm.doc.name);
            
            var temp_condition = True;
            if (temp_condition) {
                frm.add_custom_button(__('Create Thesis Defense Committee'), function() {
                    var new_doc = frappe.model.get_new_doc('Thesis Defense Committee');
                    
                    new_doc.student = frm.doc.student;
                    new_doc.program_enrollment = frm.doc.program_enrollment;
                    new_doc.research_title = frm.doc.research_title;
                    new_doc.student_supervisor = frm.doc.student_supervisor;
                    new_doc.reference_doctype = frm.doc.doctype;
                    new_doc.document_name = frm.doc.name;
                    
                    new_doc.member_of_internal_selected_committee = [];
                    frm.doc.member_of_internal_selected_committee.forEach(function(row) {
                        var new_row = frappe.model.add_child(new_doc, 'Member of Internal Selected Committee', 'member_of_internal_selected_committee');
                        new_row.faculty = row.faculty;
                        new_row.academic_rank = row.academic_rank;
                        new_row.faculty_member = row.faculty_member;
                    });
            
                    new_doc.member_of_external_selected_committee = [];
                    frm.doc.member_of_external_selected_committee.forEach(function(row) {
                        var new_row = frappe.model.add_child(new_doc, 'Member of External Selected Committee', 'member_of_external_selected_committee');
                        new_row.university = row.university;
                        new_row.external_faculty = row.external_faculty;
                        new_row.academic_rank = row.academic_rank;
                        new_row.faculty_member = row.faculty_member;
                    });
            
                    frappe.db.insert(new_doc).then(function(response) {
                        frappe.set_route('Form', response.doctype, response.name);
                    });
                });
            }
        }

        get_students_by_supervisor(frm);
        
        filter_internal(frm);
        filter_external(frm);

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
                    // console.log("PSA Settings loaded:", frm.psa_settings);

                }
                override_add_row_button(frm, 'member_of_internal_selected_committee');
                override_add_row_button(frm, 'member_of_external_selected_committee');
            }
        });
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
                        frm.set_intro((__("Can't add a thesis defense committee request, because current status of student is {0}!", [program_enrollment_status[1]])), 'red');
                    }
                    else if (program_enrollment_status[0]) {
                        psa_utils.get_single_value('PSA Settings', 'check_active_requests_before_insert', function(check_active_requests_before_insert) {
                            if (check_active_requests_before_insert) {
                                psa_utils.check_active_request(frm.doc.student, frm.doc.program_enrollment, ['Suspend Enrollment Request', 'Continue Enrollment Request', 'Withdrawal Request'],
                                    function (active_request) {
                                        if (active_request) {
                                            var url_of_active_request = `<a href="/app/${active_request[0].toLowerCase().replace(/\s+/g, "-")}/${active_request[1]['name']}" title="${__("Click here to show request details")}"> ${active_request[1]['name']} </a>`;
                                            frm.set_intro((__(`Can't add a thesis defense committee request, because student has an active {0} ({1}) that is {2}!`, [active_request[0], url_of_active_request, active_request[1]['status']])), 'red');
                                        }
                                        else {
                                            frm.set_intro((__(`Current status of student is {0}.`, [program_enrollment_status[1]])), 'green');
                                        }
                                    }
                                );
                            }
                            else {
                                frm.set_intro((__(`Current status of student is {0}.`, [program_enrollment_status[1]])), 'green');
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


    student(frm) {
        if (frm.doc.student) {
            psa_utils.set_program_enrollment_for_student(frm, "program_enrollment", frm.doc.student);
        }
        else {
            frm.set_value("program_enrollment", "");
            refresh_field("program_enrollment");
        }
    }
});


frappe.ui.form.on("Internal Discussion Committee", {
    faculty: function (frm, cdt, cdn) {
        const row = locals[cdt][cdn];
        
        frappe.model.set_value(cdt, cdn, 'faculty_member', '');
        frm.fields_dict['member_of_internal_selected_committee'].grid.refresh(); // Ensure the grid is refreshed
        
        filter_internal(frm);
        
        // frm.fields_dict['member_of_internal_selected_committee'].grid.get_field('faculty_member').get_query = function (doc, cdt, cdn) {
        //     return {
        //         filters: {
        //             'faculty': row.faculty,
        //             'academic_rank': row.academic_rank,
        //         }
        //     };
        // };
    },


    academic_rank: function (frm, cdt, cdn) {
        const row = locals[cdt][cdn];
        
        // Clear the faculty_member field
        frappe.model.set_value(cdt, cdn, 'faculty_member', '');
        
        // Refresh the grid and update the field query
        frm.fields_dict['member_of_internal_selected_committee'].grid.refresh(); // Ensure the grid is refreshed

        filter_internal(frm);

        // frm.fields_dict['member_of_internal_selected_committee'].grid.get_field('faculty_member').get_query = function (doc, cdt, cdn) {
        //     return {
        //         filters: {
        //             'faculty': row.faculty,
        //             'academic_rank': row.academic_rank,
        //         }
        //     };
        // };
    },


    faculty_member: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        let duplicate = frm.doc.member_of_internal_selected_committee.some((r) => r.faculty === row.faculty && r.academic_rank === row.academic_rank && r.faculty_member === row.faculty_member && r.idx !== row.idx);

        if (duplicate) {
            frappe.msgprint(__('This Faculty Member is already selected. Please choose a different one.'));
            frappe.model.set_value(cdt, cdn, 'faculty_member', '');
        }
    }
});


frappe.ui.form.on("External Discussion Committee", {
    university: function (frm, cdt, cdn) {
        const row = locals[cdt][cdn];
        // console.log("Selected university:", row.university); // Print the selected university
        
        // Clear the faculty_member field
        frappe.model.set_value(cdt, cdn, 'faculty_member', '');
        frappe.model.set_value(cdt, cdn, 'external_faculty', '');
        
        // Refresh the grid and update the field query
        frm.fields_dict['member_of_external_selected_committee'].grid.refresh(); // Ensure the grid is refreshed
        // frm.fields_dict['member_of_external_selected_committee'].grid.get_field('faculty_member').get_query = function (doc, cdt, cdn) {
        //     return {
        //         filters: {
        //             'from_another_university': row.university,
        //             'external_faculty': row.external_faculty,
        //             'academic_rank': row.academic_rank,
        //         }
        //     };
        // };
        filter_external(frm);
    },


    academic_rank: function (frm, cdt, cdn) {
        const row = locals[cdt][cdn];
        // console.log("Selected academic rank:", row.academic_rank); // Print the selected academic rank
        
        // Clear the faculty_member field
        frappe.model.set_value(cdt, cdn, 'faculty_member', '');
        
        // Refresh the grid and update the field query
        frm.fields_dict['member_of_external_selected_committee'].grid.refresh(); // Ensure the grid is refreshed
        // frm.fields_dict['member_of_external_selected_committee'].grid.get_field('faculty_member').get_query = function (doc, cdt, cdn) {
        //     return {
        //         filters: {
        //             'from_another_university': row.university,
        //             'external_faculty': row.external_faculty,
        //             'academic_rank': row.academic_rank,
        //         }
        //     };
        // };
        filter_external(frm);
    },


    external_faculty: function (frm, cdt, cdn) {
        const row = locals[cdt][cdn];
        // console.log("Selected external faculty:", row.external_faculty); // Print the selected external faculty
        
        // Clear the faculty_member field
        frappe.model.set_value(cdt, cdn, 'faculty_member', '');
        
        // Refresh the grid and update the field query
        frm.fields_dict['member_of_external_selected_committee'].grid.refresh(); // Ensure the grid is refreshed
        // frm.fields_dict['member_of_external_selected_committee'].grid.get_field('faculty_member').get_query = function (doc, cdt, cdn) {
        //     return {
        //         filters: {
        //             'from_another_university': row.university,
        //             'external_faculty': row.external_faculty,
        //             'academic_rank': row.academic_rank,
        //         }
        //     };
        // };
        filter_external(frm);
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


function filter_internal(frm) {
    frm.fields_dict['member_of_internal_selected_committee'].grid.get_field('faculty_member').get_query = function (doc, cdt, cdn) {
        const row = locals[cdt][cdn];
        if (row.faculty && row.academic_rank) {
            return {
                filters: {
                    'faculty': row.faculty,
                    'academic_rank': row.academic_rank,
                    'from_another_university': "",
                    'external_faculty': ""
                }
            };
        }
        else if (row.faculty == null && row.academic_rank == null) {
            return {
                filters: {
                    'from_another_university': "",
                    'external_faculty': ""
                }
            };
        }
        else if (row.faculty && row.academic_rank == null) {
            return {
                filters: {
                    'faculty': row.faculty,
                    'from_another_university': "",
                    'external_faculty': ""
                }
            };
        }
        else if (row.faculty == null && row.academic_rank) {
            return {
                filters: {
                    'academic_rank': row.academic_rank,
                    'from_another_university': "",
                    'external_faculty': ""
                }
            };
        }      
    };
}


function filter_external(frm) {
    frm.fields_dict['member_of_external_selected_committee'].grid.get_field('faculty_member').get_query = function (doc, cdt, cdn) {
        const row = locals[cdt][cdn];
        let filters = {};

        if (row.university) {
            filters['from_another_university'] = row.university;
        } else {
            filters['from_another_university'] = ['!=', ''];
        }

        if (row.external_faculty) {
            filters['external_faculty'] = row.external_faculty;
        } else {
            filters['external_faculty'] = ['!=', ''];
        }

        if (row.academic_rank) {
            filters['academic_rank'] = row.academic_rank;
        }

        return { filters: filters };
    };

    frm.fields_dict['member_of_external_selected_committee'].grid.get_field('external_faculty').get_query = function (doc, cdt, cdn) {
        let row = locals[cdt][cdn];
        let filters = {};

        if (row.university) {
            filters['university'] = row.university;
        }

        return { filters: filters };
    };
}


function get_students_by_supervisor(frm) {
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
}
