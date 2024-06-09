
var psa_utils = {};

psa_utils.get_supervisor = function (student, callback) {
    frappe.call({
        method: 'frappe.client.get_value',
        args: {
            doctype: 'Student Supervisor',
            filters: {
                student: student,
                enabled: 1,
                type: 'Main Supervisor'
            },
            fieldname: ['supervisor']
        },
        callback: function (response) {
            if (response.message) {
                var supervisor = response.message.supervisor;
                frappe.call({
                    method: 'frappe.client.get_value',
                    args: {
                        doctype: 'Faculty Member',
                        filters: {
                            name: supervisor
                        },
                        fieldname: ['employee']
                    },
                    callback: function (response) {
                        if (response.message) {
                            var employee = response.message.employee;
                            callback(employee);
                        } else {
                            callback(null);
                        }
                    }
                });
            } else {
                callback(null);
            }
        }
    });
}




psa_utils.set_supervisor_for_student = function (frm, field_name, student) {
    frappe.call({
        method: 'psa.tasks.cron.get_supervisor_for_student',
        args: {
            "student": student
        },
        callback: function(response) {
            if (response.message) {
                frm.set_value(field_name, response.message);
                refresh_field(field_name);
            } else {
                frappe.msgprint(__('لم يتم العثور على مشرف.'));
            }
        }
    });
}
