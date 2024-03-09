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
   

              // prompt for single value of any type
              frappe.prompt(
                {
                  label: "Reason",
                  fieldname: "reason",
                  fieldtype: "Small Text",
                  reqd: 1,
                },
                (values) => {
                  console.log(values.reason);
                }
              );
            } else {
              frappe.confirm(
                __(`Are you sure you want to <b>${d.action}</b>`),
                () => {
                  // action to perform if Yes is selected
                  // before transition start
                  frappe.dom.freeze();
                  frappe
                    // api url
                    .xcall("psa.api.v1.workflow.before_transition", {
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
          });
        }
      });

      this.setup_btn(added);
    });
  }
}

frappe.ui.form.States = workflow_overide;
