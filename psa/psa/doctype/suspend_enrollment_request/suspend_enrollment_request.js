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
        callback: function (response) {
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
        callback: function (response) {
            var full_name_arabic = response.message.full_name_arabic;
            var full_name_english = response.message.full_name_english;

            get_program(program, function (college, department, specialization) {
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
        callback: function (response) {
            var creation_date = response.message.creation;
            var student_name = response.message.student;
            var program = response.message.program;

            get_psa_student(creation_date, student_name, program, function (full_name_arabic, full_name_english, creation_date, program, college, department, specialization) {
                callback(creation_date, full_name_arabic, full_name_english, program, college, department, specialization);
            });
        }
    });
}


function get_program_enrollment_status(frm, callback) {
    frappe.call({
        method: 'frappe.client.get_value',
        args: {
            doctype: 'Program Enrollment',
            filters: {
                name: frm.doc.program_enrollment
            },
            fieldname: ['status']
        },
        callback: function (response) {
            var status = response.message.status;
            callback(status);
        }
    });
}


frappe.ui.form.on("Suspend Enrollment Request", {
    refresh(frm) {

    },

    // before_save(frm) {
    //         get_program_enrollment_status(frm, function (status) {
    //             if (status != "Continued") {
    //                 frappe.throw(__("You can't add a suspend enrollment request, because"));
    //             }
    //         });
    // },

    program_enrollment(frm) {
        if (frm.doc.program_enrollment) {
            get_program_enrollment_status(frm, function (status) {
                if (status == "Continued") {
                    get_year_of_enrollment(frm, function (creation_date, full_name_arabic, full_name_english, program, college, department, specialization) {
                        var year_of_enrollment = new Date(creation_date).getFullYear();
                        $(frm.fields_dict["student_html"].wrapper).html('<span style="color: black;"><table><tr><th>' +
                            __("Full Name Arabic") + ': </th><td>' + full_name_arabic + '</td></tr><tr><th>' +
                            __("Full Name English") + ': </th><td>' + full_name_english + '</td></tr><th>' +
                            __("Year of Enrollment") + ': </th><td>' + year_of_enrollment + '</td></tr><tr><th>' +
                            __("Program") + ': </th><td>' + program + '</td></tr><tr><th>' +
                            __("College") + ': </th><td>' + college + '</td></tr><tr><th>' +
                            __("Department") + ': </th><td>' + department + '</td></tr><tr><th>' +
                            __("Specialization") + ': </th><td>' + specialization + '</td></tr></table></span>');
                    });
                }
                else {
                    $(frm.fields_dict["student_html"].wrapper).html('');
                    frappe.throw(__("You can't add a suspend enrollment request"));
                }
            });
        }
        else {
            $(frm.fields_dict["student_html"].wrapper).html('');
        }
    },
});
