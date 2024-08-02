// Copyright (c) 2024, Sana'a university and contributors
// For license information, please see license.txt

frappe.ui.form.on("Change Research Main Supervisor Request", {
    refresh(frm) {
        $(frm.fields_dict["information"].wrapper).html("");

        setTimeout(() => {
            frm.page.actions.find(`[data-label='Help']`).parent().parent().remove();
        }, 500);
        if (frm.doc.status.includes("Approved by")) {
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
                    frappe.model.set_value(new_doc.doctype, new_doc.name, 'supervisor_appointment_date', frm.doc.supervisor_appointment_date);
               
                    frappe.set_route('Form', 'Student Supervisor', new_doc.name);
                });

            });
        }

                // لفلترة الفاكيوليتي ممبر الداخلي
                frm.fields_dict['suggested_supervisors'].grid.get_field('faculty_member').get_query = function(doc, cdt, cdn) {
                    let row = locals[cdt][cdn];
                    return {
                        filters: {
                            'faculty': row.faculty || ['!=', ''],
                            'academic_rank': row.academic_rank || ['!=', ''],
                            'external_faculty': row.external_faculty || ['=', ''],
                            'from_another_university': row.from_another_university || ['=', '']

                        }
                    };
                };   
                    
                // لفلترة حقل الفاكيوليتي ممبر الخارجي 
                frm.fields_dict['external_suggested_supervisors'].grid.get_field('faculty_member').get_query = function(doc, cdt, cdn) {
                    let row = locals[cdt][cdn];
                    return {
                        filters: {
                             'external_faculty': row.external_faculty || ['!=',''],
                            'academic_rank': row.academic_rank || ['!=', ''],
                            'from_another_university': row.university || ['!=','']
                        }
                    };
                };

                // لفلترة حقل ال external_faculty
                frm.fields_dict['external_suggested_supervisors'].grid.get_field('external_faculty').get_query = function(doc, cdt, cdn) {
                    let row = locals[cdt][cdn];
                    return {
                        filters: {
                            'university': row.university
                        }
                    };
                };

         override_add_row_button(frm, 'suggested_supervisors');
        override_add_row_button(frm, 'external_suggested_supervisors');


        frm.trigger('check_and_set_approval_date');

        if (frm.doc.student && frm.doc.program_enrollment) {
            psa_utils.set_program_enrollment_information(frm, "information", frm.doc.student, frm.doc.program_enrollment);
        }
    },

    check_and_set_approval_date: function(frm) {
        if (frm.doc.status && frm.doc.status.includes("Approved by") && !frm.doc.supervisor_appointment_date) {
            frm.set_value('supervisor_appointment_date', frappe.datetime.get_today());
        }
        else if (frm.doc.status && frm.doc.status.includes("approved by") && !frm.doc.supervisor_appointment_date) {
            frm.set_value('supervisor_appointment_date', frappe.datetime.get_today());
        }
    },

    before_save: function(frm) {
        if (frm.doc.supervisor_appointment_date) {
            frm.set_df_property('supervisor_appointment_date', 'read_only', 1);
        }
    },

    onload(frm) {
 
        if (frm.is_new() && frappe.user_roles.includes("Student")) {
            psa_utils.set_student_for_current_user(frm, "student", function () {
                psa_utils.set_program_enrollment_for_current_user(frm, "program_enrollment", function () {
                    load_student_supervisor_and_research(frm);
                 });
            });
        }

 

                // الحصول على الإعدادات من دوكتايب PSA Settings
                frappe.call({
                    method: "frappe.client.get",
                    args: {
                        doctype: "PSA Settings",
                        name: "PSA Settings"
                    },
                    callback: function(response) {
                        if (response.message) {
                            frm.psa_settings = response.message;
                            console.log("PSA Settings loaded:", frm.psa_settings);

                        }


         override_add_row_button(frm, 'suggested_supervisors');
        override_add_row_button(frm, 'external_suggested_supervisors');
                    }
                });
  

        
    },

    program_enrollment(frm) {
        frm.set_intro('');
        //frm.set_value("current_supervisor", "");
        //refresh_field("current_supervisor");
        if (frm.doc.program_enrollment) {
             psa_utils.set_program_enrollment_information(frm, "information", frm.doc.student, frm.doc.program_enrollment);

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
            load_student_supervisor_and_research (frm);
        }
        else {
            $(frm.fields_dict["information"].wrapper).html("");
        }
    },

    student(frm) {
        if (frm.doc.student) {
            psa_utils.set_program_enrollment_for_student(frm, "program_enrollment", frm.doc.student, function() {
                load_student_supervisor_and_research(frm);
            });

        }
        else {
            frm.set_value("program_enrollment", "");
            refresh_field("program_enrollment");
        }
    },

    validate(frm) {
        if (!check_minimum_supervisor_limit(frm)) {
            frappe.validated = false;
        }
    }


});

 
 
function override_add_row_button(frm, fieldname) {
    frm.fields_dict[fieldname].grid.wrapper.find('.grid-add-row').off('click').on('click', function() {
        if (check_supervisor_limit(frm)) {
            frm.fields_dict[fieldname].grid.add_new_row();
        } else {
            frappe.msgprint(__('Cannot add more supervisors. Limit reached.'));
        }
    });
}


function check_supervisor_limit(frm) {
    if (!frm.psa_settings.set_a_limit_on_the_number_of_suggested_supervisors) {
        console.log("No limit set for the number of suggested supervisors.");
        return true;  
    }

    let max_supervisors = frm.psa_settings.maximum_number_of_suggested_supervisors;
    let suggested_count = frm.doc.suggested_supervisors ? frm.doc.suggested_supervisors.length : 0;
    let external_count = frm.doc.external_suggested_supervisors ? frm.doc.external_suggested_supervisors.length : 0;

    console.log("Max supervisors allowed:", max_supervisors);
    console.log("Current suggested supervisors count:", suggested_count);
    console.log("Current external suggested supervisors count:", external_count);

    if ((suggested_count + external_count) >= max_supervisors) {
        frappe.msgprint(__('You have reached the maximum number of suggested supervisors.'));
        console.log("Cannot add more supervisors. Limit reached.");
        return false;  
    }
    return true;
}


function check_minimum_supervisor_limit(frm) {
    let min_supervisors = frm.psa_settings.minimum_number_of_suggested_supervisors;
    let suggested_count = frm.doc.suggested_supervisors ? frm.doc.suggested_supervisors.length : 0;
    let external_count = frm.doc.external_suggested_supervisors ? frm.doc.external_suggested_supervisors.length : 0;

    console.log("Min supervisors required:", min_supervisors);
    console.log("Current suggested supervisors count:", suggested_count);
    console.log("Current external suggested supervisors count:", external_count);

    if ((suggested_count + external_count) < min_supervisors) {
        frappe.msgprint(__('You must have at least {0} supervisors.', [min_supervisors]));
        console.log("Cannot save the document. Minimum supervisors not met.");
        return false;  
    }
    return true;
}

 

frappe.ui.form.on('Suggested Supervisor', {
    faculty: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        frappe.model.set_value(cdt, cdn, 'academic_rank', '');
        frappe.model.set_value(cdt, cdn, 'faculty_member', '');
        if (row.faculty) {
            frappe.call({
                method: "frappe.client.get_list",
                args: {
                    doctype: "Faculty Member",
                    filters: {
                        faculty: row.faculty,
                        academic_rank: row.academic_rank
                    },
                    fields: ["name", "faculty_member_name"]
                },
                callback: function(response) {
                    if (response.message) {
                        let faculty_members = response.message;

                         let options = faculty_members.map(member => ({
                            value: member.name,
                            label: member.faculty_member_name
                        }));

                         let field = frm.fields_dict['suggested_supervisors'].grid.get_field('faculty_member');
                        field.df.options = options;
                        frm.fields_dict['suggested_supervisors'].grid.refresh_field('faculty_member');
                    } else {
                        console.error("No data found for faculty members.");
                    }
                },
                error: function(error) {
                    console.error("Error in frappe.call:", error);
                }
            });
        }
    },



    academic_rank: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        frappe.model.set_value(cdt, cdn, 'faculty_member', '');
  
    },




faculty_member: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        let selected_faculty_member_id = row.faculty_member;
        checkFacultyMemberLimit(frm, cdt, cdn, selected_faculty_member_id);
    }     
     
    
    
    
    
    
   
});
 



frappe.ui.form.on('External Suggested Supervisor', {

    university: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];

         frappe.model.set_value(cdt, cdn, 'external_faculty', '');
        frappe.model.set_value(cdt, cdn, 'academic_rank', '');
        frappe.model.set_value(cdt, cdn, 'faculty_member', '');

        // Filter faculties based on selected university
        if (row.university) {
            frappe.call({
                method: "frappe.client.get_list",
                args: {
                    doctype: "External Faculty",
                    filters: {
                        university: row.university
                    },
                    fields: ["faculty"],
                    distinct: true
                },
                callback: function(response) {
                    if (response.message) {
                        let faculties = response.message.map(faculty => faculty.faculty);

                         let field = frm.fields_dict['external_suggested_supervisors'].grid.get_field('external_faculty');
                        field.df.options = faculties;
                        frm.fields_dict['external_suggested_supervisors'].grid.refresh_field('external_faculty');
                    } else {
                        console.error("No data found for faculties.");
                    }
                },
                error: function(error) {
                    console.error("Error in frappe.call:", error);
                }
            });
        }
    },

    external_faculty: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];

         frappe.model.set_value(cdt, cdn, 'academic_rank', '');
        frappe.model.set_value(cdt, cdn, 'faculty_member', '');

        // Filter academic ranks based on selected faculty
        if (row.university && row.external_faculty) {
            frappe.call({
                method: "frappe.client.get_list",
                args: {
                    doctype: "Faculty Member",
                    filters: {
                        from_another_university: row.university,
                        faculty: row.external_faculty
                    },
                    fields: ["academic_rank"],
                    distinct: true
                },
                callback: function(response) {
                    if (response.message) {
                        let ranks = response.message.map(member => member.academic_rank);

                         let field = frm.fields_dict['external_suggested_supervisors'].grid.get_field('academic_rank');
                        field.df.options = ranks;
                        frm.fields_dict['external_suggested_supervisors'].grid.refresh_field('academic_rank');
                    } else {
                        console.error("No data found for academic ranks.");
                    }
                },
                error: function(error) {
                    console.error("Error in frappe.call:", error);
                }
            });
        }
    },

    academic_rank: function(frm, cdt, cdn) {
        frappe.model.set_value(cdt, cdn, 'faculty_member', '');
    },

    faculty_member: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        let selected_faculty_member_id = row.faculty_member;
        checkFacultyMemberLimit(frm, cdt, cdn, selected_faculty_member_id);
    }
});



function load_student_supervisor_and_research(frm) {
    if (frm.doc.student && frm.doc.program_enrollment) {
        // Set student research
        psa_utils.set_student_research_for_student_and_program_enrollment(frm, "student_research", frm.doc.student, frm.doc.program_enrollment, function() {
            frm.refresh_field("student_research");
        });

          // Set student supervisor
        psa_utils.set_student_supervisor_for_student_and_program_enrollment(frm, "current_supervisor", frm.doc.student, frm.doc.program_enrollment, function() {
            frm.refresh_field("current_supervisor");
        });
    } else {
        frm.set_value("student_research", "");
        frm.set_value("current_supervisor", "");
        frm.refresh_field("student_research");
        frm.refresh_field("current_supervisor");
     }
}




function checkFacultyMemberLimit(frm, cdt, cdn, selected_faculty_member_id) {
    frappe.call({
        method: "frappe.client.get",
        args: {
            doctype: "PSA Settings",
            name: "PSA Settings"
        },
        callback: function(response) {
            if (response.message) {
                let psa_settings = response.message;
                let number_of_researches_main = psa_settings.number_of_researches_main;
                let set_limit_on_number_researches = psa_settings.set_limit_on_number_researches_faculty_member_main_supervisor;

                if (set_limit_on_number_researches) {
                    // نستعلم من الدالة للحصول على بيانات النصاب للمشرفين
                    frappe.call({
                        method: "psa.tasks.cron.get_supervisor_main_workload",
                        callback: function(workload_response) {
                            let [workload, supervisors_over_limit] = workload_response.message || [[], []];
                            
                            console.log('Supervisor Workload:', workload);
                            console.log('Supervisors Over Limit:', supervisors_over_limit);

                            if (supervisors_over_limit.includes(selected_faculty_member_id)) {
                                frappe.call({
                                    method: "frappe.client.get",
                                    args: {
                                        doctype: "Faculty Member",
                                        name: selected_faculty_member_id
                                    },
                                    callback: function(member_response) {
                                        let member_name = member_response.message ? member_response.message.faculty_member_name : selected_faculty_member_id;
                                        var message = frappe._(
                                            'The supervisor <strong>{0}</strong> has reached the maximum allowed number of research projects (<strong>{1}</strong>). Please choose a different one.',
                                            [member_name, number_of_researches_main]
                                        );                                    
                                        frappe.msgprint(`
                                            <div style="font-family: Arial, sans-serif; color: #333; background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px;">
                                                <p style="font-size: 16px; color: #721c24;">
                                                    ${message}
                                                </p>
                                            </div>
                                        `);
                                    
                                        frappe.model.set_value(cdt, cdn, 'faculty_member', '');
                                    },
                                    error: function(error) {
                                        console.error("Error in fetching Faculty Member details:", error);
                                    }
                                });
                            } else {
                                let duplicateInInternal = frm.doc.suggested_supervisors.some((r) => r.faculty_member === selected_faculty_member_id && r.idx !== locals[cdt][cdn].idx);
                                let duplicateInExternal = frm.doc.external_suggested_supervisors.some((r) => r.faculty_member === selected_faculty_member_id && r.academic_rank === locals[cdt][cdn].academic_rank && r.idx !== locals[cdt][cdn].idx);

                                if (duplicateInInternal ||duplicateInExternal) {
                                    frappe.call({
                                        method: "frappe.client.get",
                                        args: {
                                            doctype: "Faculty Member",   
                                            name: selected_faculty_member_id
                                        },
                                        callback: function(member_response) {
                                            let member_name = member_response.message ? member_response.message.faculty_member_name : selected_faculty_member_id;
                                            var duplicateMessage = frappe._(
                                                'The Faculty Member <strong>{0}</strong> is already selected. Please choose a different one.',
                                                [member_name]
                                            );
                                            frappe.msgprint(`
                                                <div style="font-family: Arial, sans-serif; color: #333; background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px;">
                                                    <p style="font-size: 16px; color: #721c24;">
                                                        ${duplicateMessage}
                                                    </p>
                                                </div>
                                            `);
                                            frappe.model.set_value(cdt, cdn, 'faculty_member', '');
                                        },
                                        error: function(error) {
                                            console.error("Error in fetching Faculty Member details:", error);
                                        }
                                    });
                                }
                            }
                        },
                        error: function(error) {
                            console.error("Error in fetching supervisor workload:", error);
                        }
                    });
                } else {
                    let duplicateInInternal = frm.doc.suggested_supervisors.some((r) => r.faculty_member === selected_faculty_member_id && r.idx !== locals[cdt][cdn].idx);
                    let duplicateInExternal = frm.doc.external_suggested_supervisors.some((r) => r.faculty_member === selected_faculty_member_id && r.academic_rank === locals[cdt][cdn].academic_rank && r.idx !== locals[cdt][cdn].idx);

                    if (duplicateInInternal ||duplicateInExternal) {
                        frappe.call({
                            method: "frappe.client.get",
                            args: {
                                doctype: "Faculty Member",  
                                name: selected_faculty_member_id
                            },
                            callback: function(member_response) {
                                let member_name = member_response.message ? member_response.message.faculty_member_name : selected_faculty_member_id;
                                var duplicateMessage = frappe._(
                                    'The Faculty Member <strong>{0}</strong> is already selected. Please choose a different one.',
                                    [member_name]
                                );
                                frappe.msgprint(`
                                    <div style="font-family: Arial, sans-serif; color: #333; background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px;">
                                        <p style="font-size: 16px; color: #721c24;">
                                            ${duplicateMessage}
                                        </p>
                                    </div>
                                `);
                                frappe.model.set_value(cdt, cdn, 'faculty_member', '');
                            },
                            error: function(error) {
                                console.error("Error in fetching Faculty Member details:", error);
                            }
                        });
                    }
                }
            } else {
                console.error("No PSA Settings found.");
            }
        },
        error: function(error) {
            console.error("Error in fetching PSA Settings:", error);
        }
    });
}


