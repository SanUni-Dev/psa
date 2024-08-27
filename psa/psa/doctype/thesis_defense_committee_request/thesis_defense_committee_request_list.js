frappe.listview_settings["Thesis Defense Committee Request"] = {
    onload(listview) {
        listview.page.add_inner_button(__("Documentation"), function() {
        window.location.href = "/psa-ar/طلب-تشكيل-لجنة-مناقشة-نهائية";
      });
    }
};
