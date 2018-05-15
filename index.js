var map;
var locations = [];
var markers = [];
var infowindows = [];
var locationListGlobal = [];
var agencySearch = "%";
var agencyNameSearch = "%";
var datasetNameSearch = "%";
var parameterTypeSearch = "%";
var nutrientSearch = "%";
var resetFlag = false;
var clusterMarkersFlag = false;
var clusterer;
var markerScale = 1/3;
//Google search "Indianapolis, IN lat long". Will be used as the center point.
var center = {
    lat: config.CENTER_LAT,
    lng: config.CENTER_LONG
};
var icons = [];

// This is the SQL code to search for nitrogen in the parameter field.
var nitrogenSQL =
    "parameter LIKE '%nh4%' OR " +
    "parameter LIKE '%no3%' OR " +
    "parameter LIKE '%nitrogen%' OR " +
    "parameter LIKE '%nitrate%' OR " +
    "parameter LIKE '%nitrite%' OR " +
    "parameter LIKE '%ammonia%' OR " +
    "parameter LIKE '%parameters%'";
// This is the SQL code to search for phosphorus in the parameter field.
var phosphorusSQL =
    "parameter LIKE '%po4%' OR " +
    "parameter LIKE '%srp%' OR " +
    "parameter LIKE '%phos%' OR " +
    "parameter LIKE '%parameters%'";
/*
Agency Type = type
Agency Name = organization
Dataset Name = name
Parameter Type = parameterType
 */

// This object is used to store location points from the Fusion Table
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
    this.huc12 = huc12 + '';
    this.lat = lat;
    this.lng = lng;
}

// This finds what to populate the various dropdowns with.
function searchDistinct(locationList) {
    var tempAgencyTypes, tempAgencyNames, tempDatasetNames, tempParameterTypes, tempNutrients;
    // These variables should be string arrays
    var agencyTypes = [], agencyNames = [], datasetNames = [], parameterTypes = [], nutrients = [];
    // Get the select elements
    var agencyTypeSelect = document.getElementById("agencyTypeSelect");
    var agencySelect = document.getElementById("agencySelect");
    var datasetSelect = document.getElementById("datasetSelect");
    var parameterSelect = document.getElementById("parameterSelect");
    var nutrientSelect = document.getElementById("nutrientSelect");

    // Search for the agencyTypes.
    tempAgencyTypes = alasql('SELECT DISTINCT type FROM ?', [locationList]);
    for (var i = 0; i < tempAgencyTypes.length; i++) {
        if (tempAgencyTypes[i].type !== "") {
            agencyTypes.push(tempAgencyTypes[i].type);
        }
    }
    agencyTypes.sort();

    tempAgencyNames = alasql('SELECT DISTINCT organization FROM ?', [locationList]);
    for (var i = 0; i < tempAgencyNames.length; i++) {
        if (tempAgencyNames[i].organization !== "") {
            agencyNames.push(tempAgencyNames[i].organization);
        }
    }
    agencyNames.sort();

    tempDatasetNames = alasql('SELECT DISTINCT name FROM ?', [locationList]);
    for (var i = 0; i < tempDatasetNames.length; i++) {
        if (tempDatasetNames[i].name !== "") {
            datasetNames.push(tempDatasetNames[i].name);
        }
    }
    datasetNames.sort();

    tempParameterTypes = alasql('SELECT DISTINCT parameterType FROM ?', [locationList]);
    for (var i = 0; i < tempParameterTypes.length; i++) {
        if (tempParameterTypes[i].parameterType !== "") {
            parameterTypes.push(tempParameterTypes[i].parameterType);
        }
    }
    var allParameters = [];
    // Split all the parameter types on the commas, and put them all in allParameters.
    parameterTypes.forEach(function (type) {
        var pars = type.split(", ");
        pars.forEach(function (par) {
            allParameters.push(par);
        });
    });
    // Remove duplicate parameter types from allParameters, and put the result in parameterTypes.
    parameterTypes = uniq(allParameters);
    parameterTypes.sort();

    //Check for Nitrogen
    tempNutrients = alasql("SELECT FID FROM ? WHERE " + nitrogenSQL, [locationList]);
    if (tempNutrients.length > 0) nutrients.push("Nitrogen, many forms");

    //Check for Phosphorous
    tempNutrients = alasql("SELECT FID FROM ? WHERE " + phosphorusSQL, [locationList]);
    if (tempNutrients.length > 0) nutrients.push("Phosphorous, many forms");

    // Populate the select elements with the results.
    populate(agencyTypeSelect, "Select Agency Type", agencyTypes);
    populate(agencySelect, "Select Agency", agencyNames);
    populate(datasetSelect, "Select Dataset Name", datasetNames);
    populate(parameterSelect, "Select Parameter Type", parameterTypes);
    populate(nutrientSelect, "Select Nutrient", nutrients);
    // Set the reset flag to false so the site doesn't reset.
    resetFlag = false;
}

// Sets the selected option of selectElement to be the one that matches value
function setOption(selectElement, value) {
    var options = selectElement.options;
    for (var i = 0, optionsLength = options.length; i < optionsLength; i++) {
        if (options[i].value === value) {
            selectElement.selectedIndex = i;
        }
    }
}

// Populates the provided select element with list, including firstDefault at the top.
function populate(select, firstDefault, list) {
    // Grab the previous value so we can set that to be the selected option later.
    var prevVal = select.value;
    if (resetFlag) prevVal = "";
    for (var i = 0; i < select.options.length; i++) {
        select.options[i] = null;
    }
    select.options.length = 0;

    // If there is only one option in the list, add it without "show all", and select it.
    if (list.length === 1) {
        select.disabled = true;
        var el = document.createElement("option");
        el.textContent = list[0];
        el.value = list[0];
        select.appendChild(el);
        setOption(select, list[0]);
        // If there aren't any options in the list, make it "No matches", and select it.
    } else if (list.length === 0) {
        select.disabled = true;
        var el = document.createElement("option");
        el.textContent = "No matches";
        el.value = "No matches";
        select.appendChild(el);
        setOption(select, "No matches");
    } else {
        select.disabled = false;
        //Add firstDefault to the top
        var el = document.createElement("option");
        el.textContent = firstDefault;
        el.value = firstDefault;
        select.appendChild(el);

        //Add Show all
        var el = document.createElement("option");
        el.textContent = "Show all";
        el.value = "Show all";
        select.appendChild(el);

        //Stick the types into the select as options
        for (var i = 0; i < list.length; i++) {
            var el = document.createElement("option");
            el.textContent = list[i];
            el.value = list[i];
            select.appendChild(el);
        }
        // Set the selected option of the select to the previous value
        setOption(select, prevVal);
    }
}

function search() {
    //Create variables for the search types.
    var agencyTypeSelect = document.getElementById("agencyTypeSelect");
    var agencySelect = document.getElementById("agencySelect");
    var datasetSelect = document.getElementById("datasetSelect");
    var parameterSelect = document.getElementById("parameterSelect");
    var nutrientSelect = document.getElementById("nutrientSelect");

    //Get the values to search with.
    var agencyType = agencyTypeSelect.value;
    var agency = agencySelect.value;
    var dataset = datasetSelect.value;
    var parameter = parameterSelect.value;
    var nutrient = nutrientSelect.value;

    //Check if the values are "Select ..." or "Show all", and make the search term a wildcard (%)
    if (!resetFlag) {
        if (agencyType === "Select Agency Type" || agencyType === "Show all") agencySearch = "%";
        else agencySearch = agencyType;

        if (agency === "Select Agency" || agency === "Show all") agencyNameSearch = "%";
        else agencyNameSearch = agency;

        if (dataset === "Select Dataset Name" || dataset === "Show all") datasetNameSearch = "%";
        else datasetNameSearch = dataset;

        if (parameter === "Select Parameter Type" || parameter === "Show all") parameterTypeSearch = "%";
        else parameterTypeSearch = parameter;

        if (nutrient === "Select Nutrient" || nutrient === "Show all") nutrientSearch = "%";
        else nutrientSearch = nutrient;
    }

    // Build the query
    var query = 'SELECT * FROM ? ' +
        'WHERE type LIKE \'' + agencySearch + '\' ' +
        'AND organization LIKE \'' + agencyNameSearch + '\' ' +
        'AND name LIKE \'' + datasetNameSearch + '\' ' +
        'AND parameterType LIKE \'%' + parameterTypeSearch + '%\'';
    // Execute the query, and put results in locationList
    var locationList = alasql(query, [locations]);

    // If searching for Nitrogen, select nitrogen form the search results
    if (nutrientSearch === "Nitrogen, many forms") {
        //Check for Nitrogen
        tempNutrients = alasql("SELECT * FROM ? WHERE " + nitrogenSQL, [locationList]);
    }

    // If searching for Phosphorus, select nitrogen form the search results
    if (nutrientSearch === "Phosphorous, many forms") {
        //Check for Phosphorous
        tempNutrients = alasql("SELECT FID FROM ? WHERE " + phosphorusSQL, [locationList]);
    }

    locationListGlobal = locationList;

    displayMarkers(locationList);
    searchDistinct(locationList);
}

// Use FileSaver script to save the currently selected locations using a blob.
function downloadList() {
    var csv = toCsv(locationListGlobal);
    var blob = new Blob([csv], {type: "text/plain;charset=utf-8"});
    saveAs(blob, "locations.csv");
}

// Create marker from a location.
function createMarker(loc) {
    // Get the lat long as floats
    var lat = parseFloat(loc.lat);
    var lng = parseFloat(loc.lng);

    // Find the correct pin image for the given location.
    // Use a red pin as default
    var pinImage = icons[0];
    icons.forEach(function (icon) {
        if (icon[0] === loc.type) {
            pinImage = icon[1];
        }
    });

    // Create the marker object
    var marker = new google.maps.Marker({
        position: {
            lat: lat,
            lng: lng
        },
        icon: pinImage,
        title: loc.name,
        size: 5
    });

    marker.setMap(map);

    // Create the infowindow for the marker.
    var infowindow = new google.maps.InfoWindow({
        content: generateInfoWindowContent(loc),
        maxWidth: 400
    });

    // No idea what's going on here
    infowindows.push(infowindow);

    //Add the on click listener to the marker.
    marker.addListener('click', function () {
        closeInfowindows();
        infowindow.open(map, marker);
    });
    return marker;
}

// Display the markers, turning unselected markers invisible
function displayMarkers(locationList) {
    if (map === undefined) return;
    var bounds = new google.maps.LatLngBounds();
    var FIDList = [];
    var indexList = [];
    var clusterMarkersList = [];
    // Get the FIDs for each selected location
    locationList.forEach(function (loc) {
        FIDList.push(parseInt(loc.FID));
    });
    // Get a list of markers to display?
    FIDList.forEach(function (fid) {
        indexList.push(markerSearch(fid));
    });

    for (var i = 0; i < markers.length; i++) {
        var index;
        // If there is a marker at the current location in the indexList, make it visible
        if (indexList.indexOf(i) !== -1) {
            markers[i][1].setVisible(true);
            bounds.extend(markers[i][1].position);
            clusterMarkersList.push(markers[i][1]);
            // Otherwise, make it invisible.
        } else {
            markers[i][1].setVisible(false);
        }
    }

    // If the cluster marker flag is on, cluster markers.
    if (clusterMarkersFlag) {
        clusterer = new MarkerClusterer(map, clusterMarkersList,
            {
                imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
                maxZoom: 11,
                minimumClusterSize: 5
            });
    }

    // If there are less than 1000 markers being displayed, add them to the bounds, and fit the map to it.
    if (locationList.length < 1000 && locationList.length !== 0) {
        map.fitBounds(bounds);
        if (map.getZoom() > 13) {
            map.setZoom(13);
        }
        // If there are 0, or more than 1000 locations, center the map in Indy.
    } else {
        map.setCenter(center);
        map.setZoom(7);
    }
    // Search for the city if the user has something in the box.
    if (document.getElementById("city").value !== "") {
        searchCity();
    }
}

// Search for the marker with the provided fid
function markerSearch(fid) {
    for (var i = 0; i < markers.length; i++) {
        if (markers[i][0] === fid) return i;
    }
    return -1;
}

// Parse all the locations. Called at the very beginning by jQuery.
function parse(text) {
    markerIcons();
    var jsonVersion = JSON.parse(text);
    var data = jsonVersion.rows;
    for (var i = 0; i < data.length; i++) {
        var a = data[i];

        var loc = new BasicLocation(i + 1, a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11],
            a[12], a[13], a[14], a[15], a[16], a[17], a[18], a[19], a[20], a[21]);

        locations.push(loc);
        locationListGlobal.push(loc);
    }

    searchDistinct(locations);
    myMap();
}

//Create the maps and stuff
function myMap() {
    //Create the map with reference to the #map element.
    var mapCanvas = document.getElementById("map");
    var mapOptions = {
        center: center,
        zoom: 7
    };

    map = new google.maps.Map(mapCanvas, mapOptions);

    for (var i = 0; i < locations.length; i++) {
        markers.push([parseInt(locations[i].FID), createMarker(locations[i])]);
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

function filterHUC() {
    var huc = document.getElementById("hucSearch");
    var locationList = locations;

    locationList = alasql("SELECT * FROM ? WHERE huc12 LIKE '" + huc.value + "%'", [locations]);

    displayMarkers(locationList);
}

function reset() {
    resetFlag = true;
    agencySearch = "%";
    agencyNameSearch = "%";
    datasetNameSearch = "%";
    parameterTypeSearch = "%";
    nutrientSearch = "%";
    closeInfowindows();
    document.getElementById("city").value = "";
    document.getElementById("hucSearch").value = "";
    search();
}

//Helper functions

// Generate the content for a marker's infowindow.
function generateInfoWindowContent(loc) {
    var content = '<div class="info-content"><h5><a href="' + loc.contactURL + '" target="_blank">' + loc.name +
        '</a></h5><p><b>Agency:</b> ' + loc.organization +
        '<br><b>Location:</b> ' + loc.description +
        '<br><b>Site Number:</b> ' + loc.siteNo +
        '<br><b>Parameter(s) sampled:</b> ' + loc.parameter +
        '<br><b>Parameter Type:</b> ' + loc.parameterType +
        '<br><b>Monitoring Frequency:</b> ' + loc.frequency +
        '<br><b>Publicly Availible?:</b> ' + (loc.publiclyAvailible ? "Yes" : "No") +
        '<br><b>Data Quality Information Available?:</b> ' + (loc.quality ? "Yes" : "No") +
        '<br><b>Date of record:</b> ' + loc.startDate + ' to ' + loc.endDate +
        '<br><b>HUC12:</b> ' + loc.huc12 + '</p>';
    if (loc.email !== "" || loc.email !== null) {
        content += "<br><a href='mailto:" + loc.email + "?subject=Water%20Data'>Email</a>"
    }
    content += '</div>';
    return content;
}

function markerIcons() {
    icons.push(["Federal and regional agencies", new google.maps.MarkerImage("http://www.googlemapsmarkers.com/v1/0000FF/")]);
    icons.push(["State agencies", new google.maps.MarkerImage("http://www.googlemapsmarkers.com/v1/10B2FF/")]);
    icons.push(["Cities and towns (except drinking water)", new google.maps.MarkerImage("http://www.googlemapsmarkers.com/v1/004184/")]);
    icons.push(["Non-governmental organizations", new google.maps.MarkerImage("http://www.googlemapsmarkers.com/v1/A50000/")]);
    icons.push(["Counties", new google.maps.MarkerImage("http://www.googlemapsmarkers.com/v1/840084/")]);
    icons.push(["Private sector", new google.maps.MarkerImage("http://www.googlemapsmarkers.com/v1/104121/")]);
    icons.push(["Universities", new google.maps.MarkerImage("http://www.googlemapsmarkers.com/v1/CEFF31/")]);
    icons.push(["Watershed organizations", new google.maps.MarkerImage("http://www.googlemapsmarkers.com/v1/FF00FF/")]);
    icons.push(["Drinking water", new google.maps.MarkerImage("http://www.googlemapsmarkers.com/v1/4282FF/")]);
    icons.push(["Volunteers", new google.maps.MarkerImage("http://www.googlemapsmarkers.com/v1/10D352/")]);
    icons.forEach(function (icon) {
        icon[1].scaledSize = new google.maps.Size(42 * markerScale, 68 * markerScale);
    });
}

function closeInfowindows() {
    infowindows.forEach(function (infowindow) {
        infowindow.close();
    });
}

function uniq(a) {
    return a.sort().filter(function (item, pos, ary) {
        return !pos || item !== ary[pos - 1];
    })
}

function hasClass(el, className) {
    if (el.classList)
        return el.classList.contains(className)
    else
        return !!el.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'))
}

function removeClass(el, className) {
    if (el.classList)
        el.classList.remove(className)
    else if (hasClass(el, className)) {
        var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
        el.className = el.className.replace(reg, ' ')
    }
}

function clusterMarkers() {
    var button = document.getElementById("clusterMarkers");
    if (clusterMarkersFlag === false) {
        button.innerHTML = "Un-cluster Markers (resets page)";
        clusterMarkersFlag = true;
    } else {
        location.reload();
    }
    search();
}

document.getElementById("city").addEventListener("keyup", searchCity);
document.getElementById("reset").addEventListener("click", reset);
document.getElementById("agencyTypeSelect").addEventListener("change", search);
document.getElementById("agencySelect").addEventListener("change", search);
document.getElementById("datasetSelect").addEventListener("change", search);
document.getElementById("parameterSelect").addEventListener("change", search);
document.getElementById("nutrientSelect").addEventListener("change", search);
document.getElementById("clusterMarkers").addEventListener("click", clusterMarkers);
document.getElementById("hucSearch").addEventListener("keyup", filterHUC);
document.getElementById("download").addEventListener("click", downloadList);

//Load in the csv, and call parse with it.
$(document).ready(function () {
    $.ajax({
        type: "POST",
        url: "https://www.googleapis.com/fusiontables/v2/query?sql=SELECT%20*%20FROM%20" + config.GOOGLE_FUSION_TABLE_ID + "&key=AIzaSyBss3canGF7OHkgWQ3pN6gmc5-KvW5l0wc",
        dataType: "text",
        success: function (data) {
            // document.getElementById('disclaimer').innerHTML = config.DISCLAIMER;
            parse(data);
        }
    });
});
