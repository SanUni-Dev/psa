// Copyright (c) 2024, Sana'a university and contributors
// For license information, please see license.txt


frappe.ui.form.on("Thesis Defense Committee Request", {
    onload: function (frm) {

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
                    'academic_rank': row.academic_rank,
                    // 'from_another_university': ['', null],
                    // 'contract_status': 1
                }
            };
        };
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
        if (frm.doc.student) {
            psa_utils.set_student_supervisor_for_student_and_program_enrollment(frm, "student_supervisor", frm.doc.student, frm.doc.program_enrollment);
            psa_utils.set_student_research_for_student_and_program_enrollment(frm, "research_title", frm.doc.student, frm.doc.program_enrollment);
        }
        else {
            frm.set_value("student_supervisor", "");
            refresh_field("student_supervisor");

            frm.set_value("research_title", "");
            refresh_field("research_title");
        }
    }

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
                    'academic_rank': row.academic_rank,
                    // 'from_another_university': ['', null],
                    // 'contract_status': 1
                }
            };
        };

        // frm.fields_dict['member_of_internal_selected_committee'].grid.get_field('faculty_member').refresh();
    }
});