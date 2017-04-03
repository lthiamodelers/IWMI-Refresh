/**
 * Created by Ben Scholer on 3/20/2017.
 */

var users;
var locations;

/* SAMPLE USER JS OBJECT:
 User:
 Name
 Password
 Email
 URL
 Publicly availible (boolean)
 Datasets [id]
 */

document.getElementById("signIn").addEventListener("click", signIn);

function signIn() {
	var email = document.getElementById("inputEmail");
	var password = document.getElementById("inputPassword");

	var found = false;

	for (var i = 0; i < users.length; i++) {
		user = users[i];
		if (user.email === email.value && user.password === password.value) {
			found = true;
			localStorage.setItem("email", user.email);
			localStorage.setItem("name", user.name);
		}
	}

	if (localStorage.getItem("email")) {
		window.location.replace("/IWMI/management.html");

	} else {
		alert("Incorrect email/password");
	}
}

function parseUsers(data) {
	users = JSON.parse(data);
}

function parseLocations(data) {
	//locations = JSON.parse(data);
}

//Load in the csv, and call myMap with it.
$(document).ready(function() {
	$.ajax({
		type: "GET",
		url: "res/.users.json",
		dataType: "text",
		success: function(data) {
			parseUsers(data);
		}
	})

	$.ajax({
		type: "GET",
		url: "res/inwater.csv",
		dataType: "text",
		success: function(data) {
			parseLocations(data);
		}
	})
});
