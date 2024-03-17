// Copyright (c) 2024, Sana'a university and contributors
// For license information, please see license.txt

frappe.ui.form.on("Continue Enrollment Request", {
  refresh(frm) {
    setTimeout(() => {
      frm.page.actions.find(`[data-label='Help']`).parent().parent().remove();
    }, 500);
    if (!frm.is_new()) {
      $(frm.fields_dict["request_date_html"].wrapper).html(__('Request Date: ') + frm.doc.creation + "<br>");
      if (frm.doc.status == "Approved by Department Head") {
          $(frm.fields_dict["modified_request_date_html"].wrapper).html(__('Approval Date: ') + frm.doc.modified);
      }
      else if (frm.doc.status == "Rejected by Vice Dean for GSA" ||
          frm.doc.status == "Rejected by Department Head") {
          $(frm.fields_dict["modified_request_date_html"].wrapper).html(__('Rejection Date: ') + frm.doc.modified);
      }
  }
  else {
      $(frm.fields_dict["request_date_html"].wrapper).html('');
      $(frm.fields_dict["modified_request_date_html"].wrapper).html('');
  }
  },

  onload(frm) {
    if (!frm.is_new()) {
      if (frappe.user_roles.includes("Student")) {
        setTimeout(() => {
          var fees_status = frm.doc.fees_status;
          if (fees_status === "Not Paid") {
            frm.add_custom_button(__("Get Clipboard Number"), () => {
              frappe.msgprint(__("Clipboard Number for '") + frm.doc.name + __("' is: #########"));
            });
          }
        }, 500);
      }
    }
    if (frm.doc.program_enrollment) {
      get_program_enrollment_status(frm, function (status) {
        get_year_of_enrollment(frm, function (creation_date, full_name_arabic, full_name_english, program, college, department, specialization) {
          var year_of_enrollment = new Date(creation_date).getFullYear();
          $(frm.fields_dict["student_html"].wrapper).html('<div><table><tr><th>' +
            __("Full Name Arabic") + ': </th><td>' + full_name_arabic + '</td></tr><tr><th>' +
            __("Full Name English") + ': </th><td>' + full_name_english + '</td></tr><th>' +
            __("Year of Enrollment") + ': </th><td>' + year_of_enrollment + '</td></tr><tr><th>' +
            __("Program") + ': </th><td>' + program + '</td></tr><tr><th>' +
            __("College") + ': </th><td>' + college + '</td></tr><tr><th>' +
            __("Department") + ': </th><td>' + department + '</td></tr><tr><th>' +
            __("Specialization") + ': </th><td>' + specialization + '</td></tr><tr><th>' +
            __("Status") + ': </th><td>' + status + '</td></tr></table></div>');
        });
      });
    }
    else {
      $(frm.fields_dict["student_html"].wrapper).html('');
    }
  },

  // before_workflow_action(frm) {
  //     if (frm.selected_workflow_action.includes("Confirm")) {
  //         if (frm.doc.fees_status === "Not Paid") {
  //             frappe.throw(__("Please pay fees first!"));
  //             frappe.validated = false;
  //         }
  //     }
  // },

  // after_workflow_action(frm) {
  //     frappe.msgprint("after_workflow_action");
  // },

  program_enrollment(frm) {
    frm.set_intro('', 'blue');
    if (frm.doc.program_enrollment) {
      get_program_enrollment_status(frm, function (status) {
        get_year_of_enrollment(frm, function (creation_date, full_name_arabic, full_name_english, program, college, department, specialization) {
          var year_of_enrollment = new Date(creation_date).getFullYear();
          $(frm.fields_dict["student_html"].wrapper).html('<div><table><tr><th>' +
            __("Full Name Arabic") + ': </th><td>' + full_name_arabic + '</td></tr><tr><th>' +
            __("Full Name English") + ': </th><td>' + full_name_english + '</td></tr><th>' +
            __("Year of Enrollment") + ': </th><td>' + year_of_enrollment + '</td></tr><tr><th>' +
            __("Program") + ': </th><td>' + program + '</td></tr><tr><th>' +
            __("College") + ': </th><td>' + college + '</td></tr><tr><th>' +
            __("Department") + ': </th><td>' + department + '</td></tr><tr><th>' +
            __("Specialization") + ': </th><td>' + specialization + '</td></tr><tr><th>' +
            __("Status") + ': </th><td>' + status + '</td></tr></table></div>');
        });
        if (status == "Suspended") {
          frm.set_intro((__(`Current status is ${status}.`)), 'green');
          frm.remove_custom_button(__("Go to Suspend Enrollment Request List"));
        }
        else if (status == "Continued") {
          frm.set_intro((__(`Can't add a continue enrollment request, because current status is ${status}!`)), 'red');
          frm.add_custom_button(__("Go to Suspend Enrollment Request List"), () => {
            frappe.set_route("List", "Suspend Enrollment Request");
          });
        }
        else {
          frm.set_intro((__(`Can't add a continue enrollment request, because current status is ${status}!`)), 'red');
          frm.remove_custom_button(__("Go to Suspend Enrollment Request List"));
        }
      });


      frappe.call({
        method:
          "psa.api.get_last_approved_suspend_enrollment_request.get_last_approved_suspend_enrollment_request",
        args: {
          program_enrollment: frm.doc.program_enrollment,
        },
        callback: function (response) {
          frm.set_value("suspended_request_number", response.message.name);

          var modified_date = response.message.modified;

          var formatted_date = modified_date.split(" ")[0];

          frm.set_value("suspended_date", formatted_date);

          frm.set_value("suspended_period", response.message.suspend_period);
        },
      });
    }
    else {
      $(frm.fields_dict["student_html"].wrapper).html('');
      frm.remove_custom_button(__("Go to Suspend Enrollment Request List"));
    }
  },
});



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
