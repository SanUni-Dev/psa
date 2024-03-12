class workflow_overide extends frappe.ui.form.States {
  show_actions() {
    var added = false;
    var me = this;

    // if the loaded doc is dirty, don't show workflow buttons
    if (this.frm.doc.__unsaved === 1) {
      return;
    }

    function has_approval_access(transition) {
      let approval_access = false;
      const user = frappe.session.user;
      if (
        user === "Administrator" ||
        transition.allow_self_approval ||
        user !== me.frm.doc.owner
      ) {
        approval_access = true;
      }
      return approval_access;
    }

    frappe.workflow.get_transitions(this.frm.doc).then((transitions) => {
      this.frm.page.clear_actions_menu();
      transitions.forEach((d) => {
        if (frappe.user_roles.includes(d.allowed) && has_approval_access(d)) {
          added = true;
          me.frm.page.add_action_item(__(d.action), function () {
            // console.log("Action: ", d.action);
            // console.log("Current Transaction: ", me.frm.doc);
            if (d.action.includes("Reject")) {
              frappe.warn(
                __("Are you sure you want to proceed?"),
                `<div>
                    <p><label for="reason">${__(
                  "Enter reason of reject "
                )} <span class="text-danger">*</span></label></p>
                    <p><textarea id="reason" name="reason" class="form-control" rows="4" required></textarea></p>
                </div>`,
                () => {
                  // Retrieve the value of the reason field and trim any leading/trailing whitespace
                  const reason = document.getElementById("reason").value.trim();

                  // Check if the reason field is empty
                  if (!reason) {
                    // If the reason field is empty, display a validation error message
                    frappe.msgprint({
                      title: __("Validation Error"),
                      message: __("Please enter a reason."),
                      indicator: "red",
                    });
                    return; // Exit the function early if validation fails
                  }

                  // Set the value of the reason variable to the rejection_reason field in the current doctype
                  me.frm.doc.rejection_reason = reason;

                  // Save the document to ensureme rejection_reason is saved
                  frappe.call({
                    method: "frappe.client.save",
                    args: {
                      doc: me.frm.doc,
                    },
                    callback: function (response) {
                      if (!response.exc) {
                        // Document saved successfully
                        // Proceed with the action using the reason provided...
                        frappe.dom.freeze();
                        frappe
                          // api url
                          .xcall("psa.api.workflow.before_transition", {
                            doc: me.frm.doc,
                            transition: d,
                          })
                          .then((response) => {
                            // console.log(response);
                            if (response == true) {
                              // transition start
                              // set the workflow_action for use in form scripts

                              me.frm.selected_workflow_action = d.action;
                              me.frm.script_manager
                                .trigger("before_workflow_action")
                                .then(() => {
                                  frappe
                                    .xcall(
                                      "frappe.model.workflow.apply_workflow",
                                      {
                                        doc: me.frm.doc,
                                        action: d.action,
                                      }
                                    )
                                    .then((doc) => {
                                      frappe.model.sync(doc);
                                      me.frm.refresh();
                                      me.frm.selected_workflow_action = null;
                                      me.frm.script_manager.trigger(
                                        "after_workflow_action"
                                      );

                                      // Show a success message indicating that the workflow action was successfully executed
                                      frappe.show_alert(
                                        {
                                          message: __(`Successfully rejected.`),
                                          indicator: "green",
                                        },
                                        5
                                      );

                                      // // Clear any existing error messages
                                      // const errorMessages = document.querySelectorAll('.msgprint');
                                      // errorMessages.forEach(message => message.remove());

                                      // // Reset the value of the reason field
                                      // document.getElementById("reason").value = "";

                                      // window.refresh();
                                      location.reload();
                                    })
                                    .finally(() => {
                                      frappe.dom.unfreeze();
                                    });
                                });
                              // transition end
                            } else {
                              // set the workflow_action for use in form scripts
                              frappe.dom.unfreeze();
                              frappe.msgprint(
                                __("OOPS, We could not proceed!")
                              );
                            }
                          });
                      } else {
                        // Error occurred while saving the document
                        frappe.msgprint({
                          title: __("Error"),
                          message: __(
                            "An error occurred while saving the document."
                          ),
                          indicator: "red",
                        });
                      }
                    },
                  });
                },
                "Continue"
              );
            }
            else {
              if (d.action.includes("Confirm") && (me.frm.doc.fees_status === "Not Paid")) {
                frappe.throw(__("Please pay fees first!"));
              }
              else {
                frappe.confirm(
                  __(`Are you sure you want to <b>${d.action}</b>`),
                  () => {
                    // action to perform if Yes is selected
                    // before transition start
                    frappe.dom.freeze();
                    frappe
                      // api url
                      .xcall("psa.api.workflow.before_transition", {
                        doc: me.frm.doc,
                        transition: d,
                      })
                      .then((response) => {
                        // console.log(response);
                        if (response == true) {
                          // transition start
                          // set the workflow_action for use in form scripts
  
                          me.frm.selected_workflow_action = d.action;
                          me.frm.script_manager
                            .trigger("before_workflow_action")
                            .then(() => {
                              frappe
                                .xcall("frappe.model.workflow.apply_workflow", {
                                  doc: me.frm.doc,
                                  action: d.action,
                                })
                                .then((doc) => {
                                  frappe.model.sync(doc);
                                  me.frm.refresh();
                                  me.frm.selected_workflow_action = null;
                                  me.frm.script_manager.trigger(
                                    "after_workflow_action"
                                  );
  
                                  // Show a success message indicating that the workflow action was successfully executed
                                  frappe.show_alert(
                                    {
                                      message: __(
                                        `Successfully sent to ${d.action}.`
                                      ),
                                      indicator: "green",
                                    },
                                    5
                                  );
                                })
                                .finally(() => {
                                  frappe.dom.unfreeze();
                                });
                            });
                          // transition end
                        } else {
                          // set the workflow_action for use in form scripts
                          frappe.dom.unfreeze();
                          frappe.msgprint(__("OOPS, We could not proceed!"));
                        }
                      });
  
                    // before transition end
                  },
                  () => {
                    // action to perform if No is selected
                  }
                );
              }
            }
          });
        }
      });

      this.setup_btn(added);
    });
  }
}

frappe.ui.form.States = workflow_overide;
