// Copyright (c) 2024, Sana'a university and contributors
// For license information, please see license.txt

frappe.ui.form.on("Student Supervisor", {
	refresh(frm) {
        // psa_utils.format_single_html_field(frm, "research_details_html", __('My Name'), "azoz");


        if (frm.doc.program_enrollment) {
            psa_utils.get_program_enrollment(frm.doc.program_enrollment, function (status, enrollment_date, student, academic_program) {
                psa_utils.get_student(student, function (full_name_arabic, full_name_english) {
                    psa_utils.get_academic_program(academic_program, function (program_abbreviation, faculty, faculty_department) {
                        var array_of_label = [__("Full Name Arabic"), __("Full Name English"), __("Enrollment Date"), __("Academic Program"), __("Program Abbreviation"), __("Faculty"), __("Faculty Department"), __("Status")];
                        var array_of_value = [full_name_arabic, full_name_english, enrollment_date, academic_program, program_abbreviation, faculty, faculty_department, status];
                        psa_utils.format_multi_html_field(frm, "research_details_html", array_of_label, array_of_value);

                        // var array_of_label = [__("Program Abbreviation"), __("Faculty"), __("Faculty Department"), __("Status")];
                        // var array_of_value = [program_abbreviation, faculty, faculty_department, status];
                        // psa_utils.format_multi_html_field(frm, "student_html2", array_of_label, array_of_value);
                    });
                });
            });
        }
        else {
            $(frm.fields_dict["research_details_html"].wrapper).html('');
            // $(frm.fields_dict["student_html2"].wrapper).html('');
        }
	},
});
