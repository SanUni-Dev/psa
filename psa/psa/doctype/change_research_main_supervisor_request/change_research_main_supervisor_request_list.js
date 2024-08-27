frappe.listview_settings["Change Research Main Supervisor Request"] = {
    onload(listview) {
        listview.page.add_inner_button(__("Documentation"), function() {
        window.location.href = "/psa-ar/طلب-تغيير-المشرف-الرئيسي";
      });
    }
};
