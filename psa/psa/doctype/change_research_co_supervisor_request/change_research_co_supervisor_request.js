// Copyright (c) 2024, Sana'a university and contributors
// For license information, please see license.txt

frappe.ui.form.on("Change Research Co Supervisor Request", {
	refresh(frm) {

	},


    program_enrollment(frm) {
        frm.set_intro('');
        if (frm.doc.program_enrollment) {
            psa_utils.get_program_enrollment(frm.doc.program_enrollment, function (status, enrollment_date, student, academic_program) {
                if (status == "fb5a6fd301") { // Suspended
                    psa_utils.get_url_to_new_form("Continue Enrollment Request", function (url) {
                        frm.set_intro((
                            `<div class="container">
                                    <div class="row">
                                        <div class="col-auto me-auto">` +
                            __(`Can't add a change research co-supervisor request, because current status is ${status}!` +
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

                else if (status == "e1cc273bf5") { // Withdrawn
                    frm.set_intro((__(`Can't add a change research co-supervisor request, because current status is ${status}!`)), 'red');
                }

                else {


                    // psa_utils.get_active_change_request("Change Research Main Supervisor Request", frm.doc.program_enrollment, function (doc) {
                    //     if (doc) {
                    //         frm.set_intro('');
                    //         var url_of_active_request = `<a href="/app/change-research-main-supervisor-request/${doc.name}" title="${__("Click here to show request details")}"> ${doc.name} </a>`;
                    //         frm.set_intro((__(`Can't add a change research main supervisor request, because you have an active change research main supervisor request (`) + url_of_active_request + __(`) that is ${doc.status}!`)), 'red');
                    //     }
                    //     else {
                    //         psa_utils.get_active_request("Suspend Enrollment Request", frm.doc.program_enrollment, function (doc) {
                    //             if (doc) {
                    //                 frm.set_intro('');
                    //                 var url_of_active_request = `<a href="/app/suspend-enrollment-request/${doc.name}" title="${__("Click here to show request details")}"> ${doc.name} </a>`;
                    //                 frm.set_intro((__(`Can't add a change research main supervisor request, because you have an active suspend enrollment request (`) + url_of_active_request + __(`) that is ${doc.status}!`)), 'red');
                    //             }
                    //             else {
                    //                 psa_utils.get_active_request("Continue Enrollment Request", frm.doc.program_enrollment, function (doc) {
                    //                     if (doc) {
                    //                         frm.set_intro('');
                    //                         var url_of_active_request = `<a href="/app/continue-enrollment-request/${doc.name}" title="${__("Click here to show request details")}"> ${doc.name} </a>`;
                    //                         frm.set_intro((__(`Can't add a change research main supervisor request, because you have an active continue enrollment request (`) + url_of_active_request + __(`) that is ${doc.status}!`)), 'red');
                    //                     }
                    //                     else {
                    //                         psa_utils.get_active_request("Withdrawal Request", frm.doc.program_enrollment, function (doc) {
                    //                             if (doc) {
                    //                                 frm.set_intro('');
                    //                                 var url_of_active_request = `<a href="/app/withdrawal-request/${doc.name}" title="${__("Click here to show request details")}"> ${doc.name} </a>`;
                    //                                 frm.set_intro((__(`Can't add a change research main supervisor request, because you have an active withdrawal request (`) + url_of_active_request + __(`) that is ${doc.status}!`)), 'red');
                    //                             }
                    //                             else if (status == "489ea39789") { // Continued
                    //                                 frm.set_intro((__(`Current status is ${status}.`)), 'green');
                    //                             }
                    //                         });
                    //                     }
                    //                 });
                    //             }
                    //         });
                    //     }
                    // });
                    

                    psa_utils.get_active_request("Suspend Enrollment Request", frm.doc.program_enrollment, function (doc) {
                        if (doc) {
                            frm.set_intro('');
                            var url_of_active_request = `<a href="/app/suspend-enrollment-request/${doc.name}" title="${__("Click here to show request details")}"> ${doc.name} </a>`;
                            frm.set_intro((__(`Can't add a change research co-supervisor request, because you have an active suspend enrollment request (`) + url_of_active_request + __(`) that is ${doc.status}!`)), 'red');
                        }
                        else {
                            psa_utils.get_active_request("Continue Enrollment Request", frm.doc.program_enrollment, function (doc) {
                                if (doc) {
                                    frm.set_intro('');
                                    var url_of_active_request = `<a href="/app/continue-enrollment-request/${doc.name}" title="${__("Click here to show request details")}"> ${doc.name} </a>`;
                                    frm.set_intro((__(`Can't add a change research co-supervisor request, because you have an active continue enrollment request (`) + url_of_active_request + __(`) that is ${doc.status}!`)), 'red');
                                }
                                else {
                                    psa_utils.get_active_request("Withdrawal Request", frm.doc.program_enrollment, function (doc) {
                                        if (doc) {
                                            frm.set_intro('');
                                            var url_of_active_request = `<a href="/app/withdrawal-request/${doc.name}" title="${__("Click here to show request details")}"> ${doc.name} </a>`;
                                            frm.set_intro((__(`Can't add a change research co-supervisor request, because you have an active withdrawal request (`) + url_of_active_request + __(`) that is ${doc.status}!`)), 'red');
                                        }
                                        else if (status == "489ea39789") { // Continued
                                            frm.set_intro((__(`Current status is ${status}.`)), 'green');
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    },
});
