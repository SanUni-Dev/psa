frappe.listview_settings["Progress Report"] = {
    onload(listview) {
        listview.page.add_inner_button(__("Documentation"), function() {
        window.location.href = "/psa-ar/تقرير-الإنجاز";
      });
    }
};
