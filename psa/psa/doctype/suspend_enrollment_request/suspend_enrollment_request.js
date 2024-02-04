// Copyright (c) 2024, Sana'a university and contributors
// For license information, please see license.txt

// Custom functions
function get_psa_student(student_name, callback) {
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
            callback(full_name_arabic, full_name_english);
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
            fieldname: ['creation', 'student']
        },
        callback: function(response) {
            var creation_date = response.message.creation;
            var student_name = response.message.student;

            get_psa_student(student_name, function(full_name_arabic, full_name_english) {
                callback(creation_date, full_name_arabic, full_name_english);
            });
        }
    });
}



frappe.ui.form.on("Suspend Enrollment Request", {
    refresh(frm) {

    },

    program_enrollment(frm) {
        if (frm.doc.program_enrollment) {
            get_year_of_enrollment(frm, function(creation_date, full_name_arabic, full_name_english) {
                var year_of_enrollment = new Date(creation_date).getFullYear();

                $(frm.fields_dict["student_html"].wrapper).html('<span style="color: black;">Year of Enrollment: ' + year_of_enrollment + '<br>' + full_name_arabic + '<br>' + full_name_english + '</span>');
            });
        }
    },
});
