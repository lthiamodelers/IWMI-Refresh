/**
 * Created by Ben Scholer on 3/20/2017.
 */
var locations;
var users;

//USE getElementById().getElementsByClassName("class");

console.log(document.getElementById("locationTable").getElementsByClassName("agencyType")[0].getElementsByClassName('agencyTypeDropdown')[0].value);

function parseUsers(data) {
	users = JSON.parse(data);
	var userTab = document.getElementById("userTab");
	userTab.textContent = localStorage.getItem("name");
	userTab.visibility = "visible";
}

function parseLocations(data) {
	//locations = JSON.parse(data);
}

$(document).ready(function() {
	$.ajax({
		type: "GET",
		url: "res/inwater.csv",
		dataType: "text",
		success: function(data) {
			parseLocations(data);
		}
	});

	$.ajax({
		type: "GET",
		url: "res/.users.json",
		dataType: "text",
		success: function(data) {
			parseUsers(data);
		}
	});
});