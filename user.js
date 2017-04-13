/**
 * Created by Ben Scholer on 3/20/2017.
 */
var locations;
var users;
var userLoggedIn;
var agencyTypes = ["Cities and towns (except drinking water)", "Counties", "Drinking water", "Federal and regional agencies", "Non-governmental organizations", "Private sector", "State agencies", "Universities", "Volunteers", "Watershed organizations"];

users.forEach(function (user) {
	if (user.name === localStorage.getItem("name")) {
		userLoggedIn = user;
	}
});

function parseUsers(data) {
	users = JSON.parse(data);
	var userTab = document.getElementById("userTab");
	var settingsHeader = document.getElementById("settingsHeader");
	settingsHeader.textContent = 'Settings - ' + localStorage.getItem("name");
	userTab.textContent = localStorage.getItem("name");
	userTab.visibility = "visible";
}

function parseLocations(data) {
	//locations = JSON.parse(data);
}

function logOut() {
	console.log("I'm getting called");
	localStorage.setItem("email", null);
	localStorage.setItem("name", null);
	//window.location.replace("/IWMI/index.html");
}

document.getElementById("logout").addEventListener("click", logOut);

$(document).ready(function () {
	$.ajax({
		type: "GET",
		url: "res/inwater.csv",
		dataType: "text",
		success: function (data) {
			parseLocations(data);
		}
	});

	$.ajax({
		type: "GET",
		url: "res/.users.json",
		dataType: "text",
		success: function (data) {
			parseUsers(data);
		}
	});
});
