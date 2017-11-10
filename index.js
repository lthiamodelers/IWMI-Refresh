var infowindow;
var map;
var agencyNames = [];
var agencyTypes = [];
var datasetNames = [];
var locations = [];
var oldType = "Select Agency Type";
var userLoggedIn;
var users;
var markers = [];
//This variable needs to be assigned dynamically.
var parameterTypes = ["Aquatic Plants/Algal Biomass", "Bacteriology/Microbiology", "Fish", "Flow/Stage", "General Chemistry", "Groundwater Level", "Groundwater Quality", "Habitat", "Lake Clarity", "Macroinvertebrates", "Metals", "Nutrients", "Organics/Pesticides", "Radiological", "Hoosier Riverwatch"];
//Google search "Indianapolis, IN lat long". Will be used as the center point.
var center = {
    lat: 39.7684,
    lng: -86.1581
};
var declusterZoom = 9;
var cluster;

parameterTypes.sort();

function Location(oldLocation, marker) {
    this.FID = oldLocation.FID;
    this.GID = oldLocation.GID;
    this.type = oldLocation.type;
    this.organization = oldLocation.organization;
    this.name = oldLocation.name;
    this.siteNo = oldLocation.siteNo;
    this.description = oldLocation.description;
    this.parameterType = oldLocation.parameterType;
    this.parameter = oldLocation.parameter;
    this.frequency = oldLocation.frequency;
    this.publiclyAvailible = oldLocation.publiclyAvailible;
    this.startDate = oldLocation.startDate;
    this.endDate = oldLocation.endDate;
    this.contactURL = oldLocation.contactURL;
    this.id = oldLocation.id;
    this.quality = oldLocation.quality;
    this.email = oldLocation.email;
    this.huc8 = oldLocation.huc8;
    this.huc10 = oldLocation.huc10;
    this.huc12 = oldLocation.huc12;
    this.lat = oldLocation.lat;
    this.lng = oldLocation.lng;
    this.marker = marker;
}

function BasicLocation(FID, GID, type, organization, name, siteNo, description, parameterType, parameter, frequency, publiclyAvailible, startDate, endDate, contactURL, id, quality, email, huc8, huc10, huc12, lat, lng) {
    this.FID = FID;
    this.GID = GID;
    this.type = type;
    this.organization = organization;
    this.name = name;
    this.siteNo = siteNo;
    this.description = description;
    this.parameterType = parameterType;
    this.parameter = parameter;
    this.frequency = frequency;
    this.publiclyAvailible = publiclyAvailible;
    this.startDate = startDate;
    this.endDate = endDate;
    this.contactURL = contactURL;
    this.id = id;
    this.quality = quality;
    this.email = email;
    this.huc8 = huc8;
    this.huc10 = huc10;
    this.huc12 = huc12;
    this.lat = lat;
    this.lng = lng;
}

function populateAgencyType() {
    var agencyTypeSelect = document.getElementById("agencyTypeSelect");

    for (var i = 0; i < agencyTypes.length - 1; i++) {
        var type = agencyTypes[i];
        var el = document.createElement("option");
        el.textContent = type;
        el.value = type;
        agencyTypeSelect.appendChild(el);
    }
}

function addAgencyType() {
    var tempAgencyTypes = alasql('SELECT DISTINCT type FROM ?', [locations]);
    for (var i = 0; i < tempAgencyTypes.length; i++) {
        agencyTypes.push(tempAgencyTypes[i].type);
    }
    agencyTypes.sort();
}

function addDatasetName(loc) {
    var tempDatasetNames = alasql('SELECT DISTINCT name FROM ?', [locations]);
    for (var i = 0; i < tempDatasetNames.length; i++) {
        datasetNames.push(tempDatasetNames[i].name);
    }
    datasetNames.sort();
}

//THIS NEEDS FIXED
//		function addParameterType(loc) {
//			if (!parameterTypes.includes(loc.parameter)) {
//				parameterTypes.push(loc.parameter);
//			}
//		}

function createMarker(loc) {
    var lat = parseFloat(loc.lat);
    var lng = parseFloat(loc.lng);

    var marker = new google.maps.Marker({
        position: {
            lat: lat,
            lng: lng
        },
        title: loc.name
    });

    marker.setMap(map);

    var content = '<h5><a href="' + loc.contactURL + '">' + loc.name + '</a></h5><p><b>Agency:</b> ' +
        loc.organization + '<br><b>Location:</b> ' + loc.description + '<br><b>Site Number:</b> ' +
        loc.siteNo + '<br><b>Parameter(s) sampled:</b> ' + loc.parameter + '<br><b>Parameter Type:</b> ' +
        loc.parameterType + '<br><b>Monitoring Frequency:</b> ' + loc.frequency +
        '<br><b>Publicly Availible?:</b> ' + loc.publiclyAvailible + '<br><b>Data Quality Information:</b> ' +
        loc.quality + '<br><b>Date of record:</b> ' + loc.startDate + ' to ' + loc.endDate +
        '<br><b>HUC12:</b> ' + loc.huc12 + '</p>';

    var infowindow = new google.maps.InfoWindow({
        content: content,
        maxWidth: 400
    });

    //Add the on click listener to the marker.
    marker.addListener('click', function () {
        //An attempt to close the previously opened window.
        if (infowindow) infowindow.close();
        infowindow.open(map, marker);
    });
    return marker;
}

function parse(text) {
    var jsonVersion = JSON.parse(text);
    var data = jsonVersion.rows;
    for (var i = 0; i < data.length; i++) {
        var a = data[i];

        var loc = new BasicLocation(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11],
            a[12], a[13], a[14], a[15], a[16], a[17], a[18], a[19], a[20], a[21]);

        locations.push(loc);
    }
    myMap();
}

function myMap() {


    //Create the map with refrence to the #map element.
    var mapCanvas = document.getElementById("map");
    var mapOptions = {
        center: center,
        zoom: 7
    };

    //Base URL for the circle icon used as a marker.
    var iconBase = 'https://maps.google.com/mapfiles/kml/shapes/';
    map = new google.maps.Map(mapCanvas, mapOptions);

    addAgencyType();
    addDatasetName();
    console.log("hello");

    for (var i = 0; i < locations.length; i++) {
        markers.push(createMarker(locations[i]));
    }

    agencyTypes.sort();

    populateAgencyType();
    populateDatasetName();
    populateParameterTypes();

    var items = JSON.parse(localStorage.getItem("locations"));
    if (items === null || items.length < 100) {
        var oldLocations = [];
        locations.forEach(function (loc) {
            oldLocations.push(loc.oldLocation);
        });
        localStorage.setItem("locations", JSON.stringify(oldLocations));
    }

}

//click function for search
function searchCity() {

    var geocoder = new google.maps.Geocoder();
    var input = document.getElementById("city");
    var cityAndState = input.value + ", IN";

    if (input.value === null || input.value === "") {
        var center = {
            lat: 39.7684,
            lng: -86.1581
        };

        var mapOptions = {
            center: center,
            zoom: 7
        };
        map.setOptions(mapOptions);
    } else {

        geocoder.geocode({
            'address': cityAndState
        }, function (results, status) {

            if (status == google.maps.GeocoderStatus.OK) {

                map.setCenter(new google.maps.LatLng(results[0].geometry.location.lat(), results[0].geometry.location.lng()));
                map.setZoom(13);
            }
        });


    }

}

Array.prototype.unique = function () {
    var a = this.concat();
    for (var i = 0; i < a.length; ++i) {
        for (var j = i + 1; j < a.length; ++j) {
            if (a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
};

function removeOptions(selectbox) {
    var i;
    for (i = selectbox.options.length - 1; i >= 0; i--) {
        selectbox.remove(i);
    }
}

function populateParameterTypes() {
    var select = document.getElementById("parameterSelect");
    var datasetSelect = document.getElementById("datasetSelect");

    removeOptions(select);

    //Add in all the possible ones to all
    var all = [];
    //If a dataset name is selected, only populate the select element with that dataset name's possible parameter types.
    var val = datasetSelect.value;
    locations.forEach(function (loc) {
        if ((loc.name === val) && loc.parameterType !== null) {
            var pars = loc.parameterType.split(", ");
            pars.forEach(function (par) {
                all.push(par);
            });
        }
    });

    //Delete duplicates, and sort
    all = all.filter(function (item, index, inputArray) {
        return inputArray.indexOf(item) === index;
    });
    all.sort();

    //Add Select Parameter Type to the top
    var el = document.createElement("option");
    el.textContent = "Select Parameter Type";
    el.value = "Select Parameter Type";
    select.appendChild(el);

    //Add Show all
    var el = document.createElement("option");
    el.textContent = "Show all";
    el.value = "Show all";
    select.appendChild(el);

    //Stick the types in all into the select as options
    for (var i = 0; i < all.length; i++) {
        var el = document.createElement("option");
        el.textContent = all[i];
        el.value = all[i];
        select.appendChild(el);
    }
}

function filterHUC() {
    var huc = document.getElementById("hucSearch");

    map.clearOverlays();
    var bounds = new google.maps.LatLngBounds();
    markers = [];

    if (huc.value.length === 8) {
        //Use HUC8
        locations.forEach(function (loc) {
            if ("0" + loc.huc8 === "" + huc.value) {
                var marker = createMarker(loc);
                markers.push(marker);
                bounds.extend(marker.position);
            }
        });
    } else if (huc.value.length === 10) {
        //Use HUC10
        locations.forEach(function (loc) {
            if ("0" + loc.huc10 === "" + huc.value) {
                var marker = createMarker(loc);
                markers.push(marker);
                bounds.extend(marker.position);
            }
        });
    } else if (huc.value.length === 12) {
        //Use HUC12
        locations.forEach(function (loc) {
            if ("0" + loc.huc12 === "" + huc.value) {
                var marker = createMarker(loc);
                markers.push(marker);
                bounds.extend(marker.position);
            }
        });
    } else if (huc.value.length === 0) {
        locations.forEach(function (loc) {
            var marker = createMarker(loc);
            markers.push(marker);
        });
        var div = document.getElementById("hucForm");
        removeClass(div, "has-error");
    }

    if (huc.value.length === 8 || huc.value.length === 10 || huc.value.length === 12) {
        map.fitBounds(bounds);
        if (map.getZoom() > 13) {
            map.setZoom(13);
        }
        var div = document.getElementById("hucForm");
        removeClass(div, "has-error");

    } else {
        map.setCenter(center);
        map.setZoom(7);
        if (huc.value.length >= 7) {
            var div = document.getElementById("hucForm");
            addClass(div, "has-error");
        }
    }
    if (markers.length === 0) {
        map.setCenter(center);
        map.setZoom(7);
        var div = document.getElementById("hucForm");
        addClass(div, "has-error");
    }
}

function hasClass(el, className) {
    if (el.classList)
        return el.classList.contains(className)
    else
        return !!el.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'))
}

function addClass(el, className) {
    if (el.classList)
        el.classList.add(className)
    else if (!hasClass(el, className)) el.className += " " + className
}

function removeClass(el, className) {
    if (el.classList)
        el.classList.remove(className)
    else if (hasClass(el, className)) {
        var reg = new RegExp('(\\s|^)' + className + '(\\s|$)')
        el.className = el.className.replace(reg, ' ')
    }
}

google.maps.Map.prototype.clearOverlays = function () {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers.length = 0;
}

function filterParameterTypes() {
    var select = document.getElementById("parameterSelect");
    var datasetSelect = document.getElementById("datasetSelect");
    var val = select.value;

    if (val !== "Select Parameter Type") {
        var bounds = new google.maps.LatLngBounds();

        map.clearOverlays();
        markers = [];

        locations.forEach(function (loc) {
            if (loc.parameterType !== null && loc.name === datasetSelect.value) {
                //Add all of the locations for the given dataset name to the map
                if (val === "Show all") {

                    loc.marker.setVisible(true);
                    markers.push(loc.marker);
                    bounds.extend(loc.marker.position);

                    //Search to see if parameterType contains val.
                } else if (loc.parameterType.split(", ").indexOf(val) !== -1 && loc.parameterType !== undefined) {

                    loc.marker.setVisible(true);
                    markers.push(loc.marker);
                    bounds.extend(loc.marker.position);
                }
            }
        });

        map.fitBounds(bounds);
        if (map.getZoom() > 13) {
            map.setZoom(13);
        }

        cluster = new MarkerClusterer(map, markers, {
            imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
            maxZoom: 15 //An arbitrary value that seems to work well.
        });

    }
}

function populateDatasetName() {
    var datasetSelect = document.getElementById("datasetSelect");
    datasetNames.forEach(function (name) {
        var el = document.createElement("option");
        el.textContent = name;
        el.value = name;
        datasetSelect.appendChild(el);
    });
}

function filterDatasetNames() {
    var agencySelect = document.getElementById("agencySelect");
    var agencyTypeSelect = document.getElementById("agencyTypeSelect");

    agencySelect.value = "Select Agency";
    agencyTypeSelect.value = "Select Agency Type";
    agencySelect.disabled = true;

    var select = document.getElementById("datasetSelect");
    var parSelect = document.getElementById("parameterSelect");
    var val = select.value;


    if (val !== "Select Dataset Name") {
        parSelect.disabled = false;
        populateParameterTypes();
        var bounds = new google.maps.LatLngBounds();

        markers = [];

        locations.forEach(function (loc) {

            if (val === "Show all") {
                loc.marker.setVisible(true);
                markers.push(loc.marker);
            } else if (loc.name === val) {

                loc.marker.setVisible(true);
                markers.push(loc.marker);
                bounds.extend(loc.marker.position);
            }
        });
        if (val !== "Show all") {
            map.fitBounds(bounds);
            if (map.getZoom() > 13) {
                map.setZoom(13);
            }
        } else {
            map.setCenter(center);
            map.setZoom(7);
        }
    } else {
        parSelect.disabled = true;
    }
}

function filterAgencyTypes() {
    console.log("I'm being called.");
    var dataSelect = document.getElementById("datasetSelect");
    var parSelect = document.getElementById("parameterSelect");

    dataSelect.value = "Select Dataset Name";
    parSelect.value = "Select Parameter Type";
    parSelect.disabled = true;

    var select = document.getElementById("agencyTypeSelect");
    var agencySelect = document.getElementById("agencySelect");
    var val = select.value;

    if (val !== "Select Agency Type") {
        for (var i = 2; i < agencySelect.options.length; i++) {
            agencySelect.options[i] = null;
        }

        if (val !== oldType) {
            var bounds = new google.maps.LatLngBounds();
            map.clearOverlays();
            var sqlReturn = [];
            if (val === "Show all") {
                sqlReturn = alasql('SELECT * FROM ?', [locations]);
            } else {
                sqlReturn = alasql('SELECT * FROM ? WHERE type=\'' + val + '\'', [locations])
            }
            sqlReturn.forEach(function (loc) {
                var marker = createMarker(loc);
                markers.push(marker);
                bounds.extend(marker.position);
            });
            if (val !== "Show all") {
                map.fitBounds(bounds);
                if (map.getZoom() > 13) {
                    map.setZoom(13);
                }
            }
        }
        if (val !== "Show all") {
            populateAgencies(val);
        } else {
            map.setCenter(center);
            map.setZoom(7);
        }
    } else {
        agencySelect.disabled = true;
    }

    if (val === "Show all") {
        agencySelect.disabled = true;
    }
    oldType = val;
}

function findAgencies(type) {
    var tempAgencyNames = alasql('SELECT DISTINCT organization FROM ? WHERE type = \'' + type + '\'', [locations]);
    for (var i = 0; i < tempAgencyNames.length; i++) {
        agencyNames.push(tempAgencyNames[i].type);
    }
    agencyNames.sort();
    populateAgencies();
}

function filterAgencies() {

    var typeSelect = document.getElementById("agencyTypeSelect");
    var select = document.getElementById("agencySelect");
    var val = select.value;
    var bounds = new google.maps.LatLngBounds();

    if (val !== "Select Agency") {
        findAgencies();

        cluster.clearMarkers();
        cluster = null;
        markers = [];

        locations.forEach(function (loc) {

            if (loc.type === typeSelect.value && loc.organization === val) {
                var marker = createMarker(loc);

                markers.push(marker);
            } else if (val === "Show all") {
                if (loc.type === typeSelect.value) {
                    var marker = createMarker(loc);
                    markers.push(marker);
                }
            }
        });

        markers.forEach(function (mark) {
            bounds.extend(mark.position);
        });

        cluster = new MarkerClusterer(map, markers, {
            imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
            maxZoom: 15 //An arbitrary value that seems to work well.
        });

        map.fitBounds(bounds);
        if (map.getZoom() > 13) {
            map.setZoom(13);
        }
    }
}

function populateAgencies(type) {
    var agencySelect = document.getElementById("agencySelect");

    for (var i = 2; i < agencySelect.options.length; i++) {

        agencySelect.options[i] = null;
    }

    agencyNames.forEach(function (name) {
        if (type === "Show all") {
            for (i = 1; i < name.length; i++) {
                var el = document.createElement("option");
                el.textContent = name[i];
                el.value = name[i];
                agencySelect.appendChild(el);
            }
        } else if (name[0] === type) {
            for (i = 1; i < name.length; i++) {
                var el = document.createElement("option");
                el.textContent = name[i];
                el.value = name[i];
                agencySelect.appendChild(el);
            }
        }
    });
    agencySelect.disabled = false;
}

document.getElementById("city").addEventListener("keyup", searchCity);
document.getElementById("agencyTypeSelect").addEventListener("click", filterAgencyTypes);
document.getElementById("agencySelect").addEventListener("click", filterAgencies);
document.getElementById("datasetSelect").addEventListener("click", filterDatasetNames);
document.getElementById("parameterSelect").addEventListener("click", filterParameterTypes);
document.getElementById("hucSearch").addEventListener("keyup", filterHUC);

//Load in the csv, and call myMap with it.
$(document).ready(function () {
    $.ajax({
        type: "POST",
        url: "https://www.googleapis.com/fusiontables/v2/query?sql=SELECT%20*%20FROM%201urVQf1MWtRf2XavqoR9a6l_CsdE7IVdpNVNTbNrp&pli&key=AIzaSyASiSo-iDClClxEHgAGFYGvz55dAXIYJWw",
        dataType: "text",
        success: function (data) {
            parse(data);
        }
    });
});
