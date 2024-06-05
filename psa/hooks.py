app_name = "psa"
app_title = "Postgraduate Studies Administration"
app_publisher = "Sana\'a university"
app_description = "Postgraduate Studies Administration"
app_email = "sanaa-uni@gmail.com"
app_license = "mit"
required_apps = ["wiki", "academia"]


fixtures = [
    "Workflow",
    "Workflow State",
    "Workflow Action Master",
    "Notification",
    "Wiki Space",
    "Wiki Page",
    "Translation",
    "Email Account"
]


app_include_js = [
    "/assets/psa/js/workflow_override.js",
    "/assets/psa/js/psa_utils.js",
    ]


# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/psa/css/psa.css"
# app_include_js = [
#     "/assets/psa/js/psa.js",
#     ]

# include js, css files in header of web template
# web_include_css = "/assets/psa/css/psa.css"
# web_include_js = "/assets/psa/js/psa.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "psa/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"ToDo" : "public/js/todo.js"}
# doctype_list_js = {"ToDo" : "public/js/todo.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# fixtures = [
#     # export all records from the Category table
#     "Translation",
#     "ToDo"
# ]


# fixtures = [
#     export all records from the Category table
#     "Role"
# ]


# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "psa/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "psa.utils.jinja_methods",
# 	"filters": "psa.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "psa.install.before_install"
# after_install = "psa.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "psa.uninstall.before_uninstall"
# after_uninstall = "psa.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "psa.utils.before_app_install"
# after_app_install = "psa.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "psa.utils.before_app_uninstall"
# after_app_uninstall = "psa.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "psa.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
# 	}
# }

# Scheduled Tasks
# ---------------


#############################uncomment this scheduler##################################################################
# Cron Scheduler that be triggered everyday at 12:00:00 AM
# scheduler_events = {
# 	"cron":{
# 		"0 0 * * *": [
# 			"psa.tasks.cron.send_suspend_enrollment_notification",
# 			"psa.tasks.cron.create_progress_report_and_notify",
# 			"psa.tasks.cron.notify_supervisor_if_no_progress_report"
# 		]
# 	}
# }
#############################                          ###################################################################

# scheduler_events = {
# 	"all": [
# 		"psa.tasks.all"
# 	],
# 	"daily": [		 
#         "psa.tasks.daily"
# 	],
# 	"hourly": [
# 		"psa.tasks.hourly"
# 	],
# 	"weekly": [
# 		"psa.tasks.weekly"
# 	],
# 	"monthly": [
# 		"psa.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "psa.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "psa.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "psa.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["psa.utils.before_request"]
# after_request = ["psa.utils.after_request"]

# Job Events
# ----------
# before_job = ["psa.utils.before_job"]
# after_job = ["psa.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"psa.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

