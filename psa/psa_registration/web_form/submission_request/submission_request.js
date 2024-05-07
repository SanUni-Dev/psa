frappe.requirefrappe.requirefrappe(function () {
	frappe.web_form.validate = function () {
		var phone = frappe.web_form.get_value('phone_number');
		var name = frappe.web_form.get_value('name1');
		var email = frappe.web_form.get_value('email');
		var gender = frappe.web_form.get_value('gender');

		if (!isValidPhone(phone)) {
			frappe.throw('phone', 'Invalid phone number. Please enter a valid phone number.');
			return false;
		}

		if (!isValidArabicName(name)) {
			frappe.throw('name', 'Invalid name. Please enter a valid Arabic name.');
			return false;
		}

		if (!isValidEmail(email)) {
			frappe.throw('email', 'Invalid email address. Please enter a valid email address.');
			return false;
		}
		if (!isValidGender(gender)) {
			frappe.throw('gender', 'Invalid gender selection. Please choose a valid option for gender.');
			return false;
		}

		// All validations passed
		return true;
	};
});

function isValidYemeniPhoneNumber(phoneNumber) {
	// Remove any non-digit characters from the phone number
	var cleanedPhoneNumber = phoneNumber.replace(/\D/g, '');

	// Yemeni phone numbers should be 10 digits long and start with 7
	var yemeniPhoneRegex = /^7\d{9}$/;

	return yemeniPhoneRegex.test(cleanedPhoneNumber);
}

function isValidArabicName(name) {
	// Make sure the name contains only Arabic characters
	var arabicRegex = /^[\u0600-\u06FF\s]+$/;
	return arabicRegex.test(name);
}

function isValidGender(gender) {
	var validGenders = ['Male', 'Female', 'Other']; // List of valid gender options

	return validGenders.includes(gender);
}

function isValidEmail(email) {
	// Use a regular expression to validate the email address format
	var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}


(function () {
	// bind events here


})

