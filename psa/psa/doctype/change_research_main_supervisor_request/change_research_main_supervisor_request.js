// Copyright (c) 2024, Sana'a university and contributors
// For license information, please see license.txt

frappe.ui.form.on("Change Research Main Supervisor Request", {
    refresh(frm) {
        setTimeout(() => {
            frm.page.actions.find(`[data-label='Help']`).parent().parent().remove();
        }, 500);
        if (frm.doc.status === "Approved by College Dean") {
            frm.add_custom_button(__('change supervisor'), function() {
                frappe.new_doc('Student Supervisor', {
                    student: frm.doc.student,
                    program_enrollment: frm.doc.program_enrollment,
                    supervisor:"",//يتم ادخال القيمة يدويا هنا 
                    type: "Main Supervisor",
                    reference_doctype: frm.doc.doctype,
                    document_name: frm.doc.name,
                    status:"Active",
                    enabled:"true",
                    pervious_supervisor: frm.doc.current_supervisor
                }, function(new_doc) {                     
                    frappe.set_route('Form', 'Student Supervisor', new_doc.name);
                });

            });
        }
    },






    

    onload(frm) {
        // if (frm.is_new() && frappe.user_roles.includes("Student")) {
        //     psa_utils.set_student_for_current_user(frm, "student", function () {
        //         psa_utils.set_program_enrollment_for_current_user(frm, "program_enrollment");
        //     });
        // }
        if (frm.is_new() && frappe.user_roles.includes("Student")) {
            psa_utils.set_student_for_current_user(frm, "student", function () {
                psa_utils.set_program_enrollment_for_current_user(frm, "program_enrollment", function () {
                    psa_utils.set_student_supervisor_for_student_and_program_enrollment(frm, "current_supervisor", frm.doc.student, frm.doc.program_enrollment);
                });
            });
        }
    },

    program_enrollment(frm) {
        frm.set_intro('');
        frm.set_value("current_supervisor", "");
        refresh_field("current_supervisor");
        if (frm.doc.program_enrollment) {
            psa_utils.set_student_supervisor_for_student_and_program_enrollment(frm, "current_supervisor", frm.doc.student, frm.doc.program_enrollment);
            
            psa_utils.check_program_enrollment_status(frm.doc.program_enrollment, ['Continued'], ['Suspended', 'Withdrawn', 'Graduated', 'Transferred'],
                function (program_enrollment_status) {
                    if (!program_enrollment_status[0]) {
                        frm.set_intro((__("Can't add a change research main supervisor request, because current status is {0}!", [program_enrollment_status[1]])), 'red');
                    }
                    else if (program_enrollment_status[0]) {
                        frappe.db.get_single_value('PSA Settings', 'check_active_requests_before_insert').then((check_active_requests_before_insert) => {
                            if (check_active_requests_before_insert) {
                                psa_utils.check_active_request(frm.doc.student, frm.doc.program_enrollment, ['Change Research Main Supervisor Request', 'Suspend Enrollment Request', 'Continue Enrollment Request', 'Withdrawal Request'],
                                    function (active_request) {
                                        if (active_request) {
                                            var url_of_active_request = `<a href="/app/${active_request[0].toLowerCase().replace(/\s+/g, "-")}/${active_request[1]['name']}" title="${__("Click here to show request details")}"> ${active_request[1]['name']} </a>`;
                                            frm.set_intro((__(`Can't add a change research main supervisor request, because you have an active {0} ({1}) that is {2}!`, [active_request[0], url_of_active_request, active_request[1]['status']])), 'red');
                                        }
                                        else {
                                            frm.set_intro((__(`Current status is {0}.`, [program_enrollment_status[1]])), 'green');
                                        }
                                    }
                                );
                            }
                            else {
                                frm.set_intro((__(`Current status is {0}.`, [program_enrollment_status[1]])), 'green');
                            }
                        });
                    }
                }
            );
        }
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
});







//     scientific_degree: function(frm, cdt, cdn) {
//         var d = locals[cdt][cdn];
//         frappe.db.get_all("Faculty Member Scientific Qualification",
//             filters={
//                 "parenttype": "Faculty Member", "parentfield": "faculty_member_scientific_qualification", "scientific_degree": d.scientific_degree
//             },
//             fields=["parent"],
//             function(scientific_degree_list){
//                 // d.faculty_member = '';
//                 // d.scientific_degree = '';
//                 cur_frm.refresh_field('suggested_supervisors');

//                 var faculty_member_list =[];

//                 // frm.set_query('scientific_degree', function() {
//                 // 	return {
//                 // 		filters: {
//                 // 			'name':  ["in", ll]
//                 // 		}
//                 // 	};
//                 // });
//             }
//         );
//     }
// });
