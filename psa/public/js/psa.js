//declare namespace 'psa'
var psa = {};


psa.set_program_enrollment_for_current_user = function (frm, field_name) {
    frappe.call({
        method: 'psa.api.psa_utils.get_program_enrollment_for_current_user',
        callback: function(response) {
            if (response.message) {
                frm.set_value(field_name, response.message);
                refresh_field(field_name);
            }
        }
    });
}
