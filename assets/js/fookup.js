$("#menu-close").click(function (e) {
  e.preventDefault();
  $("#sidebar-wrapper").toggleClass("active");
});

$("#menu-toggle").click(function (e) {
  e.preventDefault();
  $("#sidebar-wrapper").toggleClass("active");
});

$(function () {
  $('a[href*=#]:not([href=#])').click(function () {
    if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '')
      || location.hostname == this.hostname) {

      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
      if (target.length) {
        $('html,body').animate({
          scrollTop: target.offset().top
        }, 1000);
        return false;
      }
    }
  });
});

// Load the classic theme
Galleria.loadTheme('assets/js/galleria/themes/classic/galleria.classic.min.js');

// Initialize Galleria
Galleria.run('#galleria', {

    // search flickr for "galleria"
    flickr: 'set:72157649455672316',
    
    flickrOptions: {
        // sort by interestingness
        sort: 'interestingness-desc'
    }
});
