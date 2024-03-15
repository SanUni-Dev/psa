// Copyright (c) 2024, Sana'a university and contributors
// For license information, please see license.txt

frappe.ui.form.on("Continue Enrollment Request", {
  refresh(frm) {
    setTimeout(() => {
      frm.page.actions.find(`[data-label='Help']`).parent().parent().remove();
    }, 500);

    $(frm.fields_dict["student_html"].wrapper).html("");
  },

  onload(frm) {
    if (frappe.user_roles.includes("Student")) {
      setTimeout(() => {
        var fees_status = frm.doc.fees_status;
        if (fees_status === "Not Paid") {
          frm.add_custom_button(__("Get Clipboard Number"), () => {
            frappe.msgprint(
              __("Clipboard Number for '") +
                frm.doc.name +
                __("' is: #########")
            );
          });
        }
      }, 500);
    }
  },

  // before_workflow_action(frm) {
  //     if (frm.selected_workflow_action.includes("Confirm")) {
  //         if (frm.doc.fees_status === "Not Paid") {
  //             frappe.throw(__("Please pay fees first!"));
  //             frappe.validated = false;
  //         }
  //     }

  //     // var selected_workflow_action = frm.selected_workflow_action;
  //     // if (selected_workflow_action.includes("Reject")) {
  //     //     frappe.msgprint(selected_workflow_action);

  //     //     frappe.warn(__("Are you sure you want to continue?"),
  //     //         `<div>
  //     //             <p>
  //     //                 <label for="reason">
  //     //                     ${__("Enter reason of reject ")}
  //     //                     <span class="text-danger">*</span>
  //     //                 </label>
  //     //             </p>
  //     //             <p>
  //     //                 <textarea id="reason" name="reason" class="form-control" rows="4" required></textarea>
  //     //             </p>
  //     //         </div>`,
  //     //         () => {
  //     //             // Retrieve the value of the reason field and trim any leading/trailing whitespace
  //     //             const reason = document.getElementById("reason").value.trim();

  //     //             // Check if the reason field is empty
  //     //             if (!reason) {
  //     //                 // If the reason field is empty, display a validation error message
  //     //                 frappe.msgprint({
  //     //                     title: __("Error"),
  //     //                     message: __("Please enter a reason"),
  //     //                     indicator: "red",
  //     //                 });
  //     //                 return; // Exit the function early if validation fails
  //     //             }

  //     //             // Set the value of the reason variable to the rejection_reason field in the current doctype
  //     //             frm.doc.rejection_reason = reason;

  //     //             frappe.show_alert(
  //     //                 {
  //     //                     message: __(`Successfully rejected.`),
  //     //                     indicator: "green",
  //     //                 },
  //     //                 5
  //     //             );
  //     //         },
  //     //         "Continue"
  //     //     );

  //     // }
  //     // else {
  //     //     frappe.msgprint(selected_workflow_action);
  //     //     frappe.confirm(
  //     //         (__(`Are you sure you want to `) + `<b>${selected_workflow_action}</b>?`),
  //     //         () => {
  //     //             frappe.show_alert(
  //     //                 {
  //     //                     message: __(
  //     //                         __(`Action '`) + selected_workflow_action + __(`' completed successfully.`)
  //     //                     ),
  //     //                     indicator: "green",
  //     //                 },
  //     //                 5
  //     //             );
  //     //         },
  //     //         () => {
  //     //             // action to perform if No is selected
  //     //         }
  //     //     );
  //     // }
  // },

  // after_workflow_action(frm) {
  //     frappe.msgprint("after_workflow_action");
  // },

  // status(frm) {
  //     frappe.msgprint("status");
  // },

  program_enrollment(frm) {
    frm.set_intro("", "blue");
    if (frm.doc.program_enrollment) {
      get_program_enrollment_status(frm, function (status) {
        if (status == "Suspended") {
          frm.set_intro(__(`You are ${status}.`), "green");
          get_year_of_enrollment(
            frm,
            function (
              creation_date,
              full_name_arabic,
              full_name_english,
              program,
              college,
              department,
              specialization
            ) {
              var year_of_enrollment = new Date(creation_date).getFullYear();
              $(frm.fields_dict["student_html"].wrapper).html(
                '<span style="color: black;"><table><tr><th>' +
                  __("Full Name Arabic") +
                  ": </th><td>" +
                  full_name_arabic +
                  "</td></tr><tr><th>" +
                  __("Full Name English") +
                  ": </th><td>" +
                  full_name_english +
                  "</td></tr><th>" +
                  __("Year of Enrollment") +
                  ": </th><td>" +
                  year_of_enrollment +
                  "</td></tr><tr><th>" +
                  __("Program") +
                  ": </th><td>" +
                  program +
                  "</td></tr><tr><th>" +
                  __("College") +
                  ": </th><td>" +
                  college +
                  "</td></tr><tr><th>" +
                  __("Department") +
                  ": </th><td>" +
                  department +
                  "</td></tr><tr><th>" +
                  __("Specialization") +
                  ": </th><td>" +
                  specialization +
                  "</td></tr></table></span>"
              );
            }
          );
        } else if (status == "Continued") {
          frm.add_custom_button(
            __("Go to Suspend Enrollment Request List"),
            () => {
              frappe.set_route("List", "Suspend Enrollment Request");
            }
          );
          frm.set_intro(
            __(
              `You can't add a continue enrollment request, because you are ${status}!`
            ),
            "red"
          );
          $(frm.fields_dict["student_html"].wrapper).html("");
        } else {
          frm.set_intro(
            __(
              `You can't add a continue enrollment request, because you are ${status}!`
            ),
            "red"
          );
          $(frm.fields_dict["student_html"].wrapper).html("");
        }
      });
    } else {
      $(frm.fields_dict["student_html"].wrapper).html("");
    }

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
  },
});

// Custom functions
function get_program(program, callback) {
  frappe.call({
    method: "frappe.client.get_value",
    args: {
      doctype: "Program",
      filters: {
        name: program,
      },
      fieldname: ["college", "department", "specialization"],
    },
    callback: function (response) {
      var college = response.message.college;
      var department = response.message.department;
      var specialization = response.message.specialization;
      callback(college, department, specialization);
    },
  });
}

function get_psa_student(creation_date, student_name, program, callback) {
  frappe.call({
    method: "frappe.client.get_value",
    args: {
      doctype: "PSA Student",
      filters: {
        name: student_name,
      },
      fieldname: ["full_name_arabic", "full_name_english"],
    },
    callback: function (response) {
      var full_name_arabic = response.message.full_name_arabic;
      var full_name_english = response.message.full_name_english;

      get_program(program, function (college, department, specialization) {
        callback(
          full_name_arabic,
          full_name_english,
          creation_date,
          program,
          college,
          department,
          specialization
        );
      });
    },
  });
}

function get_year_of_enrollment(frm, callback) {
  frappe.call({
    method: "frappe.client.get_value",
    args: {
      doctype: "Program Enrollment",
      filters: {
        name: frm.doc.program_enrollment,
      },
      fieldname: ["creation", "program", "student"],
    },
    callback: function (response) {
      var creation_date = response.message.creation;
      var student_name = response.message.student;
      var program = response.message.program;

      get_psa_student(
        creation_date,
        student_name,
        program,
        function (
          full_name_arabic,
          full_name_english,
          creation_date,
          program,
          college,
          department,
          specialization
        ) {
          callback(
            creation_date,
            full_name_arabic,
            full_name_english,
            program,
            college,
            department,
            specialization
          );
        }
      );
    },
  });
}

function get_program_enrollment_status(frm, callback) {
  frappe.call({
    method: "frappe.client.get_value",
    args: {
      doctype: "Program Enrollment",
      filters: {
        name: frm.doc.program_enrollment,
      },
      fieldname: ["status"],
    },
    callback: function (response) {
      var status = response.message.status;
      callback(status);
    },
  });
}
