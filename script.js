function myMap() {
    
    var home = {lat: 39.9845431, lng: -86.102983};
    
    var content = '<h1>This is my home</h1>'+
        '<p>That\'s all I have to say about it</p>';
    
    var infoWindow = new google.maps.InfoWindow({
        content: content,
        maxWidth: 400
    });
    
    var mapCanvas = document.getElementById("map");
    
    var mapOptions = {
        center: home,
        zoom: 15
    };
    
    var map = new google.maps.Map(mapCanvas, mapOptions);
    
    var marker = new google.maps.Marker({position: home, map: map, title: "Home"});
    
    marker.addListener('click', function() {
      infoWindow.open(map, marker);
    });
}