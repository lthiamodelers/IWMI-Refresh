/*jslint node:true*/
/*global $, jQuery, require*/
var $ = jQuery = require('jquery');
require('lib/papaparse.js');

function myMap(text) {
  var data = Papa.parse(text);
  console.log(data);
  var center = {
    lat: 39.7684
    , lng: -86.1581
  };
  var content = '<h1>This is my home</h1><p>That\'s all I have to say about it</p>';
  var infoWindow = new google.maps.InfoWindow({
    content: content
    , maxWidth: 400
  });
  var mapCanvas = document.getElementById("map");
  var mapOptions = {
    center: center
    , zoom: 8
  };
  var map = new google.maps.Map(mapCanvas, mapOptions);
  var marker = new google.maps.Marker({
    position: home
    , map: map
    , title: "Home"
  });
  marker.addListener('click', function () {
    infoWindow.open(map, marker);
  });
}
$(document).ready(function () {
  $.ajax({
    type: "GET"
    , url: "res/inwater.csv"
    , dataType: "text"
    , success: function (data) {
      myMap(data);
    }
  })
});