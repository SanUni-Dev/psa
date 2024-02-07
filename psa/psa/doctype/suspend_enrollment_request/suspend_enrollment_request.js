// Copyright (c) 2024, Sana'a university and contributors
// For license information, please see license.txt

// Custom functions
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
        callback: function(response) {
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
        callback: function(response) {
            var full_name_arabic = response.message.full_name_arabic;
            var full_name_english = response.message.full_name_english;

            get_program(program, function(college, department, specialization) {
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
        callback: function(response) {
            var creation_date = response.message.creation;
            var student_name = response.message.student;
            var program = response.message.program;

            get_psa_student(creation_date, student_name, program, function(full_name_arabic, full_name_english, creation_date, program, college, department, specialization) {
                callback(creation_date, full_name_arabic, full_name_english, program, college, department, specialization);
            });
        }
    });
}


frappe.ui.form.on("Suspend Enrollment Request", {
    refresh(frm) {

    },

    program_enrollment(frm) {
        if (frm.doc.program_enrollment) {
            get_year_of_enrollment(frm, function(creation_date, full_name_arabic, full_name_english, program, college, department, specialization) {
                var year_of_enrollment = new Date(creation_date).getFullYear();
                $(frm.fields_dict["student_html"].wrapper).html('<span style="color: black;">' +
                __("Full Name Arabic") + ': ' + full_name_arabic + '<br>' +
                __("Full Name English") + ': ' + full_name_english + '<br>' +
                __("Year of Enrollment") + ': ' + year_of_enrollment + '<br>' +
                __("Program") + ': ' + program + '<br>' +
                __("College") + ': ' + college + '<br>' +
                __("Department") + ': ' + department + '<br>' +
                __("Specialization") + ': ' + specialization + '</span>');
            });
        }
        else {
            $(frm.fields_dict["student_html"].wrapper).html('');
        }
    },
});
