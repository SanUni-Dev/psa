frappe.listview_settings["Researcher Meeting"] = {
    onload(listview) {
        listview.page.add_inner_button(__("Documentation"), function() {
        window.location.href = "/psa-ar/استمارة-اجتماع-باحث";
      });
    }
};
