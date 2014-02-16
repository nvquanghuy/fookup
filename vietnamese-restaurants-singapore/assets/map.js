var defaultLat = 1.349134;
var defaultLng = 103.817711;

var map;
var infowindow = null;
var gmarkers = [];
var highestZIndex = 0;
var agent = "default";
var zoomControl = true;
var markers = [];

var FoodCtrl = function ($scope, $http) {
  $scope.restaurants = [];
  $scope.markerTitles = [];

  $scope.init = function () {
    map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions());
    infowindow = new google.maps.InfoWindow({ content: "holding..." });
    showMarkerOnlyWhenZoomed(map);
    loadRestaurants(map);
    loadLocateBox(map);
  };

  var loadLocateBox = function (map) {
    var input = $('#locate')[0];
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

    var searchBox = new google.maps.places.SearchBox(input);
    var circle = null;

    google.maps.event.addListener(searchBox, 'places_changed', function () {
      mixpanel.track('Search by Location', {'Location': $('#locate').val()});

      var place = searchBox.getPlaces()[0];
      if (place === undefined) return;
      if (circle !== null && circle !== undefined) circle.setMap(null);

      var bounds = new google.maps.LatLngBounds();
      var image = {
        url: place.icon,
        size: new google.maps.Size(71, 71),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(25, 25)
      };

      var populationOptions = {
        strokeColor: '#FF0000',
        strokeOpacity: 0.2,
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0.15,
        map: map,
        center: place.geometry.location,
        radius: 1400
      };
      circle = new google.maps.Circle(populationOptions);

      bounds.extend(place.geometry.location);
      map.fitBounds(bounds); map.setZoom(15);
    });
  };

  showMarkerOnlyWhenZoomed = function (map) {
    // only show marker labels if zoomed in
    google.maps.event.addListener(map, 'zoom_changed', function () {
      if (map.getZoom() <= 15) {
        $(".marker_label").css("display", "none");
      } else {
        $(".marker_label").css("display", "inline");
      }
    });
  };

  loadRestaurants = function (map) {
    var jsonUrl = 'https://spreadsheets.google.com/feeds/list/0AhOYW86nDMmBdDdaUXdhV1dSX0dWNG9TR0twbElEUVE/od6/public/values?alt=json-in-script&callback=JSON_CALLBACK';
    $http.jsonp(jsonUrl).success(function (response) {
      $.each(response.feed.entry, function (i, record) {
        var place = {
          id: i,
          title: gsGet(record, 'name'),
          addr: gsGet(record, 'address'),
          lat: gsGet(record, 'lat'),
          lng: gsGet(record, 'lng'),
          description: gsGet(record, 'description'),
          imageUrl: gsGet(record, 'imageurl'),
          uri: gsGet(record, 'websiteurl')
        };
        $scope.restaurants.push(place);
        $scope.markerTitles.push(place.title);
      });

      $scope.processMarkers(map, $scope.restaurants);
    });
  }

  $scope.processMarkers = function (map, markers) {
    // add markers
    $.each(markers, function (i, val) {
      infowindow = new google.maps.InfoWindow({
        content: ""
      });

      // offset latlong ever so slightly to prevent marker overlap
      rand_x = Math.random();
      rand_y = Math.random();
      val.lat = parseFloat(val.lat) + parseFloat(parseFloat(rand_x) / 6000);
      val.lng = parseFloat(val.lng) + parseFloat(parseFloat(rand_y) / 6000);

      // show smaller marker icons on mobile
      if (agent == "iphone") {
        var iconSize = new google.maps.Size(16, 19);
      } else {
        iconSize = null;
      }

      // build this marker
      var markerImage = new google.maps.MarkerImage("./assets/img/pin-restaurant.png", null, null, null, iconSize);
      var marker = new google.maps.Marker({
        position: new google.maps.LatLng(val.lat, val.lng),
        map: map,
        title: '',
        clickable: true,
        infoWindowHtml: '',
        zIndex: 10 + i,
        icon: markerImage
      });
      gmarkers.push(marker);

      // add marker hover events (if not viewing on mobile)
      if (agent == "default") {
        google.maps.event.addListener(marker, "mouseover", function () {
          this.old_ZIndex = this.getZIndex();
          this.setZIndex(9999);
          var markerElement = $('#marker' + i);
          markerElement.css("display", "inline");
          markerElement.css("z-index", "99999");
        });
        google.maps.event.addListener(marker, "mouseout", function () {
          if (this.old_ZIndex && map.getZoom() <= 15) {
            this.setZIndex(this.old_ZIndex);
            $("#marker" + i).css("display", "none");
          }
        });
      }

      // format marker URI for display and linking
      var markerURI = val.uri || '';
      if (markerURI.substr(0, 7) != "http://") {
        markerURI = "http://" + markerURI;
      }
      var shortUri = markerURI.replace("http://", "");
      if (shortUri.length > 30) {
        shortUri = shortUri.substr(0, 30) + "...";
      }

      // add marker click effects (open infowindow)
      google.maps.event.addListener(marker, 'click', function () {
        mixpanel.track('Restaurant Click', {'Restaurant': val.title});

        var imageHtml = "";
        if (val.imageUrl) {
          imageHtml = "<img width='200' src='" + val.imageUrl + "'/>";
        }
        // TODO: replace with handlebars
        var html =
          "<div class='marker-wrapper'>" +
          "<div class='marker_title'>" + val.title + "</div>" + imageHtml +
            "<div class='marker_uri'>" +
            "<a target='_blank' href='" + markerURI + "'>" + shortUri + "</a>" +
            "</div>" +
            "<div class='marker_desc'>" + val.description + "</div>" +
            "<div class='marker_address'>" + val.addr + " </div>" +
          "</div>";
        infowindow.setContent(html);
        infowindow.open(map, this);
      });

      // add marker label
      var latLng = new google.maps.LatLng(val.lat, val.lng);
      var label = new Label({
        map: map,
        id: i
      });
      label.bindTo('position', marker);
      label.set("text", val.title);
      label.bindTo('visible', marker);
      label.bindTo('clickable', marker);
      label.bindTo('zIndex', marker);
    });
  }

  $scope.filterMatch = function(term, title) {
    return title.toLowerCase().indexOf(term) != -1;
  }

  $scope.isFiltering = function() {
    return (!!$scope.filterTerm) && ($scope.filterTerm.length > 0)
  }

} // end controller

// detect browser agent
$(document).ready(function () {
  if (navigator.userAgent.toLowerCase().indexOf("iphone") > -1 || navigator.userAgent.toLowerCase().indexOf("ipod") > -1) {
    agent = "iphone";
    zoomControl = false;
  }
  if (navigator.userAgent.toLowerCase().indexOf("ipad") > -1) {
    agent = "ipad";
    zoomControl = false;
  }


});

$(function() {
  resizeList();
  $(window).resize(resizeList);

  setTimeout(function() {
    $('#share_modal').modal('show');
  }, 30000);

  mixpanel.track('Map Load');

  $('#share_modal')
    .on('show.bs.modal', function (e) { mixpanel.track('Share Dialog Open'); })
    .on('hide.bs.modal', function (e) { mixpanel.track('Share Dialog Close'); });

  $('#modal_info')
    .on('show.bs.modal', function (e) { mixpanel.track('About Dialog Open'); })
    .on('hide.bs.modal', function (e) { mixpanel.track('About Dialog Close'); });

});


// resize marker list to fit window
function resizeList() {
  newHeight = $('html').height() - $('#topbar').height();
  $('#list').css('height', newHeight + "px");
  $('#menu').css('margin-top', $('#topbar').height());
}

// set map styles
var mapStyles = [
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [
      { hue: "#8800ff" },
      { lightness: 50 }
    ]
  },
  {
    featureType: "road",
    stylers: [
      { visibility: "on" },
      { hue: "#91ff00" },
      { saturation: -62 },
      { gamma: 1.98 },
      { lightness: 10 }
    ]
  },
  {
    featureType: "water",
    stylers: [
      { hue: "#005eff" },
      { gamma: 0.72 },
      { lightness: 42 }
    ]
  },
  {
    featureType: "transit.line",
    stylers: [
      { visibility: "off" }
    ]
  },
  {
    featureType: "administrative.locality",
    stylers: [
      { visibility: "on" }
    ]
  },
  {
    featureType: "administrative.neighborhood",
    elementType: "geometry",
    stylers: [
      { visibility: "simplified" }
    ]
  },
  {
    featureType: "landscape",
    stylers: [
      { visibility: "on" },
      { gamma: 0.41 },
      { lightness: 46 }
    ]
  },
  {
    featureType: "administrative.neighborhood",
    elementType: "labels.text",
    stylers: [
      { visibility: "on" },
      { saturation: 33 },
      { lightness: 20 }
    ]
  }
];

mapOptions = function() {
  return {
    zoom: 12,
    center: new google.maps.LatLng(defaultLat, defaultLng),
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    streetViewControl: false,
    mapTypeControl: false,
    panControl: false,
    zoomControl: zoomControl,
    styles: mapStyles,
    zoomControlOptions: {
      style: google.maps.ZoomControlStyle.SMALL,
      position: google.maps.ControlPosition.LEFT_CENTER
    }
  };
}

// zoom to specific marker
function goToMarker(marker_id) {
  if (marker_id) {
    map.panTo(gmarkers[marker_id].getPosition());
    map.setZoom(15);
    google.maps.event.trigger(gmarkers[marker_id], 'click');
  }
}

// hover on list item
function markerListMouseOver(marker_id) {
  $("#marker" + marker_id).css("display", "inline");
}
function markerListMouseOut(marker_id) {
  $("#marker" + marker_id).css("display", "none");
}

function gsGet(record, key) {
  return record[('gsx$' + key)]['$t'];
}
