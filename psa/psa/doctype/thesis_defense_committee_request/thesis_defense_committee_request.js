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


        // if (frappe.user.has_role("Supervisor")) {
        //     // قم بإضافة فلتر ديناميكي على الطالب حسب المشرف الحالي
        //     frm.set_query("student", function() {
        //         return {
        //             query: "psa.api.psa_utils.get_students_by_supervisor"
        //         };
        //     });
        // }

        frappe.call({
            method: 'psa.api.psa_utils.get_students_by_supervisor',
            callback: function(r) {
                if (r.message) {
                    let student_names = r.message.map(student => student.name);
                    
                    // Set the filter on the 'student' field
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
            return {
                filters: {
                    'faculty': row.faculty,
                    'academic_rank': row.academic_rank,
                    // 'from_another_university': ['', null],
                    // 'contract_status': 1
                }
            };
        };


        frm.fields_dict['member_of_external_selected_committee'].grid.get_field('faculty_member').get_query = function (doc, cdt, cdn) {
            const row = locals[cdt][cdn];
            return {
                filters: {
                    'from_another_university': row.university,
                    'external_faculty': row.external_faculty,
                    'academic_rank': row.academic_rank,
                    // 'from_another_university': ['', null],
                    // 'contract_status': 1
                }
            };
        };


        frm.fields_dict['member_of_external_selected_committee'].grid.get_field('external_faculty').get_query = function (doc, cdt, cdn) {
            let row = locals[cdt][cdn];
            return {
                filters: {
                    'university': row.university
                }
            };
        };


        if (frm.doc.student && frm.doc.program_enrollment) {
            psa_utils.set_program_enrollment_information(frm, "information", frm.doc.student, frm.doc.program_enrollment);
        }

        override_add_row_button(frm, 'member_of_internal_selected_committee');
        override_add_row_button(frm, 'member_of_external_selected_committee');
    },



    onload(frm) {
        // الحصول على الإعدادات من دوكتايب PSA Settings
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

                // إعادة تعريف وظيفة زر "Add Row" الافتراضي في الجدول الفرعي
                override_add_row_button(frm, 'member_of_internal_selected_committee');
                override_add_row_button(frm, 'member_of_external_selected_committee');
            }
        });
        // Set query for suggested_supervisors and external_suggested_supervisors

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

    // program_enrollment(frm) {
    //     if (frm.doc.student) {
    //         psa_utils.set_student_supervisor_for_student_and_program_enrollment(frm, "student_supervisor", frm.doc.student, frm.doc.program_enrollment);
    //         psa_utils.set_student_research_for_student_and_program_enrollment(frm, "research_title", frm.doc.student, frm.doc.program_enrollment);
    //     }
    //     else {
    //         frm.set_value("student_supervisor", "");
    //         refresh_field("student_supervisor");

    //         frm.set_value("research_title", "");
    //         refresh_field("research_title");
    //     }
    // },





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





            // psa_utils.get_program_enrollment(frm.doc.program_enrollment, function (status, enrollment_date, student, academic_program) {
            //     psa_utils.get_student(student, function (full_name_arabic, full_name_english) {
            //         psa_utils.get_academic_program(academic_program, function (program_abbreviation, faculty, faculty_department) {
            //             var array_of_label = [__("Full Name Arabic"), __("Full Name English"), __("Enrollment Date"), __("Academic Program")];
            //             var array_of_value = [full_name_arabic, full_name_english, enrollment_date, academic_program];
            //             psa_utils.format_multi_html_field(frm, "information", array_of_label, array_of_value);

            //             // var array_of_label = [__("Program Abbreviation"), __("Faculty"), __("Faculty Department"), __("Status")];
            //             // var array_of_value = [program_abbreviation, faculty, faculty_department, status];
            //             // psa_utils.format_multi_html_field(frm, "student_html2", array_of_label, array_of_value);


            //             psa_utils.check_program_enrollment_status(frm.doc.program_enrollment, ['Continued'], ['Suspended', 'Withdrawn', 'Graduated', 'Transferred'],
            //                 function (program_enrollment_status) {
            //                     if (!program_enrollment_status[0]) {
            //                         frm.set_intro((__("Can't add a thesis defense committee request, because current status is {0}!", [program_enrollment_status[1]])), 'red');
            //                     }
            //                     else if (program_enrollment_status[0]) {
            //                         frappe.db.get_single_value('PSA Settings', 'check_active_requests_before_insert').then((check_active_requests_before_insert) => {
            //                             if (check_active_requests_before_insert) {
            //                                 psa_utils.check_active_request(frm.doc.student, frm.doc.program_enrollment, ['Thesis Defense Committee Request', 'Change Research Main Supervisor Request', 'Suspend Enrollment Request', 'Continue Enrollment Request', 'Withdrawal Request'],
            //                                     function (active_request) {
            //                                         if (active_request) {
            //                                             var url_of_active_request = `<a href="/app/${active_request[0].toLowerCase().replace(/\s+/g, "-")}/${active_request[1]['name']}" title="${__("Click here to show request details")}"> ${active_request[1]['name']} </a>`;
            //                                             frm.set_intro((__(`Can't add a thesis defense committee request, because you have an active {0} ({1}) that is {2}!`, [active_request[0], url_of_active_request, active_request[1]['status']])), 'red');
            //                                         }
            //                                         else {
            //                                             frm.set_intro((__(`Current status is {0}.`, [program_enrollment_status[1]])), 'green');
            //                                         }
            //                                     }
            //                                 );
            //                             }
            //                             else {
            //                                 frm.set_intro((__(`Current status is {0}.`, [program_enrollment_status[1]])), 'green');
            //                             }
            //                         });
            //                     }
            //                 }
            //             );
            //         });
            //     });
            // });





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


frappe.ui.form.on("member_of_internal_selected_committee", {
    faculty: function (frm, cdt, cdn) {
        const row = locals[cdt][cdn];
        frm.fields_dict['member_of_internal_selected_committee'].grid.get_field('faculty_member').get_query = function (doc, cdt, cdn) {
            return {
                filters: {
                    'faculty': row.faculty,
                    'academic_rank': row.academic_rank,
                    // 'from_another_university': ['', null],
                    // 'contract_status': 1
                }
            };
        };

        // frm.fields_dict['member_of_internal_selected_committee'].grid.get_field('faculty_member').refresh();
    },


    academic_rank: function (frm, cdt, cdn) {
        const row = locals[cdt][cdn];
        frm.fields_dict['member_of_internal_selected_committee'].grid.get_field('faculty_member').get_query = function (doc, cdt, cdn) {
            return {
                filters: {
                    'faculty': row.faculty,
                    'academic_rank': row.academic_rank,
                    // 'from_another_university': ['', null],
                    // 'contract_status': 1
                }
            };
        };

        // frm.fields_dict['member_of_internal_selected_committee'].grid.get_field('faculty_member').refresh();
    }
});



frappe.ui.form.on("member_of_external_selected_committee", {
    university: function (frm, cdt, cdn) {
        const row = locals[cdt][cdn];
        frm.fields_dict['member_of_external_selected_committee'].grid.get_field('faculty_member').get_query = function (doc, cdt, cdn) {
            return {
                filters: {
                    'from_another_university': row.university,
                    'external_faculty': row.external_faculty,
                    'academic_rank': row.academic_rank,
                    // 'from_another_university': ['', null],
                    // 'contract_status': 1
                }
            };
        };

        // frm.fields_dict['member_of_internal_selected_committee'].grid.get_field('faculty_member').refresh();
    },


    academic_rank: function (frm, cdt, cdn) {
        const row = locals[cdt][cdn];
        frm.fields_dict['member_of_external_selected_committee'].grid.get_field('faculty_member').get_query = function (doc, cdt, cdn) {
            return {
                filters: {
                    'from_another_university': row.university,
                    'external_faculty': row.external_faculty,
                    'academic_rank': row.academic_rank,
                    // 'from_another_university': ['', null],
                    // 'contract_status': 1
                }
            };
        };

        // frm.fields_dict['member_of_internal_selected_committee'].grid.get_field('faculty_member').refresh();
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
        return true; // لا توجد حدود
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
        return false; // منع إضافة الصف الجديد
    }
    return true;
}


function check_minimum_supervisor_limit(frm) {

    // set_a_limit_on_the_number_of_suggested_committee_members = frappe.db.get_single_value('PSA Settings', 'set_a_limit_on_the_number_of_suggested_committee_members');
    // if (!set_a_limit_on_the_number_of_suggested_committee_members) {
    //     console.log("No limit set for the number of members.");
    //     return true; // لا توجد حدود
    // }


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