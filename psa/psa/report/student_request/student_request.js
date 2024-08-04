// Copyright (c) 2024, Sana'a university and contributors
// For license information, please see license.txt

frappe.query_reports["Student Request"] = {
    "filters": [
        {
            fieldname: "student",
            label: __("Student"),
            fieldtype: "Link",
            options: "Student",
            reqd: 1,
        },
        {
            fieldname: "program_enrollment",
            label: __("Program Enrollment"),
            fieldtype: "Link",
            options: "Program Enrollment",
            reqd: 1,
            get_query: function() {
                let student = frappe.query_report.get_filter_value('student');
                if (!student) {
                    return {
                        filters: {
                            'student': null
                        }
                    };
                }
                return {
                    filters: {
                        'student': student
                    }
                };
            }
        },
        {
            fieldname: "from_date",
            label: __("From Date"),
            fieldtype: "Date",
            default: frappe.defaults.get_user_default("year_start_date")
        },
        {
            fieldname: "to_date",
            label: __("To Date"),
            fieldtype: "Date",
            default: frappe.defaults.get_user_default("year_end_date")
        }
    ]
};
