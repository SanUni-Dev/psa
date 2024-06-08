// Copyright (c) 2024, Sana'a university and contributors
// For license information, please see license.txt

frappe.ui.form.on("Change Research Main Supervisor Request", {
    refresh(frm) {

    },


    program_enrollment(frm) {
        frm.set_intro('');
        if (frm.doc.program_enrollment) {
            psa_utils.get_program_enrollment(frm.doc.program_enrollment, function (status, enrollment_date, student, academic_program) {
                if (status == "Suspended") {
                    psa_utils.get_url_to_new_form("Continue Enrollment Request", function (url) {
                        frm.set_intro((
                            `<div class="container">
                                    <div class="row">
                                        <div class="col-auto me-auto">` +
                            __(`Can't add a change research main supervisor request, because current status is ${status}!` +
                                `</div>
                                        <div class="col-auto me-auto">
                                            <a href="${url}">` +
                                __(`Do you want to add a continue enrollment request?`) +
                                `</a>
                                        </div>
                                    </div>
                                </div>`
                            )), 'red');
                    });
                }

                else if (status == "Withdrawn") {
                    frm.set_intro((__(`Can't add a change research main supervisor request, because current status is ${status}!`)), 'red');
                }

                else {
                    psa_utils.get_active_change_request("Change Research Main Supervisor Request", frm.doc.program_enrollment, function (doc) {
                        if (doc) {
                            frm.set_intro('');
                            var url_of_active_request = `<a href="/app/change-research-main-supervisor-request/${doc.name}" title="${__("Click here to show request details")}"> ${doc.name} </a>`;
                            frm.set_intro((__(`Can't add a change research main supervisor request, because you have an active change research main supervisor request (`) + url_of_active_request + __(`) that is ${doc.status}!`)), 'red');
                        }
                        else {
                            psa_utils.get_active_request("Suspend Enrollment Request", frm.doc.program_enrollment, function (doc) {
                                if (doc) {
                                    frm.set_intro('');
                                    var url_of_active_request = `<a href="/app/suspend-enrollment-request/${doc.name}" title="${__("Click here to show request details")}"> ${doc.name} </a>`;
                                    frm.set_intro((__(`Can't add a change research main supervisor request, because you have an active suspend enrollment request (`) + url_of_active_request + __(`) that is ${doc.status}!`)), 'red');
                                }
                                else {
                                    psa_utils.get_active_request("Continue Enrollment Request", frm.doc.program_enrollment, function (doc) {
                                        if (doc) {
                                            frm.set_intro('');
                                            var url_of_active_request = `<a href="/app/continue-enrollment-request/${doc.name}" title="${__("Click here to show request details")}"> ${doc.name} </a>`;
                                            frm.set_intro((__(`Can't add a change research main supervisor request, because you have an active continue enrollment request (`) + url_of_active_request + __(`) that is ${doc.status}!`)), 'red');
                                        }
                                        else {
                                            psa_utils.get_active_request("Withdrawal Request", frm.doc.program_enrollment, function (doc) {
                                                if (doc) {
                                                    frm.set_intro('');
                                                    var url_of_active_request = `<a href="/app/withdrawal-request/${doc.name}" title="${__("Click here to show request details")}"> ${doc.name} </a>`;
                                                    frm.set_intro((__(`Can't add a change research main supervisor request, because you have an active withdrawal request (`) + url_of_active_request + __(`) that is ${doc.status}!`)), 'red');
                                                }
                                                else if (status == "Continued") { 
                                                    frm.set_intro((__(`Current status is ${status}.`)), 'green');
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                    

                    // psa_utils.get_active_request("Suspend Enrollment Request", frm.doc.program_enrollment, function (doc) {
                    //     if (doc) {
                    //         frm.set_intro('');
                    //         var url_of_active_request = `<a href="/app/suspend-enrollment-request/${doc.name}" title="${__("Click here to show request details")}"> ${doc.name} </a>`;
                    //         frm.set_intro((__(`Can't add a change research main supervisor request, because you have an active suspend enrollment request (`) + url_of_active_request + __(`) that is ${doc.status}!`)), 'red');
                    //     }
                    //     else {
                    //         psa_utils.get_active_request("Continue Enrollment Request", frm.doc.program_enrollment, function (doc) {
                    //             if (doc) {
                    //                 frm.set_intro('');
                    //                 var url_of_active_request = `<a href="/app/continue-enrollment-request/${doc.name}" title="${__("Click here to show request details")}"> ${doc.name} </a>`;
                    //                 frm.set_intro((__(`Can't add a change research main supervisor request, because you have an active continue enrollment request (`) + url_of_active_request + __(`) that is ${doc.status}!`)), 'red');
                    //             }
                    //             else {
                    //                 psa_utils.get_active_request("Withdrawal Request", frm.doc.program_enrollment, function (doc) {
                    //                     if (doc) {
                    //                         frm.set_intro('');
                    //                         var url_of_active_request = `<a href="/app/withdrawal-request/${doc.name}" title="${__("Click here to show request details")}"> ${doc.name} </a>`;
                    //                         frm.set_intro((__(`Can't add a change research main supervisor request, because you have an active withdrawal request (`) + url_of_active_request + __(`) that is ${doc.status}!`)), 'red');
                    //                     }
                    //                     else if (status == "489ea39789") { // Continued
                    //                         frm.set_intro((__(`Current status is ${status}.`)), 'green');
                    //                     }
                    //                 });
                    //             }
                    //         });
                    //     }
                    // });
                }
            });
        }
    },
});

frappe.ui.form.on('Suggested Supervisor', {
    scientific_degree: function(frm, cdt, cdn) {
        var child =  locals[cdt][cdn];
        var values = child.scientific_degree;
        console.log(values);

        frappe.call({
            method: 'psa.api.psa_utils.get_scientific_degree',
            args: {
                "scientific_degree": values
            },
            callback: function (response) {
                console.log(response.message);
                frm.fields_dict.faculty_member.get_query = function(doc,cdt,cdn) {
                    return {
                        filters:[
                            ['name', '=', "ACAD-FM-00004"]
                        ]
                    }
                }
            }
        });
    },

    faculty: function(frm, cdt, cdn) {
        var d = locals[cdt][cdn];
        // d.faculty_member = '';
        // cur_frm.refresh_field('suggested_supervisors');
        // d.scientific_degree = '';

        frappe.db.get_value("Faculty", d.faculty, ["company"],
            function(value){
                console.log(value.company);
                frm.set_query("faculty_member", () => {
                    return {
                        filters: {
                            company: value.company,
                        },
                    };
                });
            }
        );
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
