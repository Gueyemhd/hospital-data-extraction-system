function equalHeight(group) {
	var tallest = 0;
	group.each(function() {
		var thisHeight = jQuery(this).height();
		if (thisHeight > tallest) {
			tallest = thisHeight;
		}
	});
	group.height(tallest);
}

jQuery( window ).load(function() { 

  if (jQuery('.bloc_voirplus .bloc_content').length) {
    equalHeight(jQuery('.bloc_voirplus .bloc_content'));
  }

  if (jQuery('.pane-node-field-menu-du-mini-site').length) {
    jQuery( ".pane-node-field-menu-du-mini-site").clone().prependTo( ".layout84-region--main" );
  }
  

    if (jQuery('.pane-node-field-menu-du-mini-site .pane-content .menu').length) {
      jQuery('.pane-node-field-menu-du-mini-site .pane-content > .menu').before('<label class="menu-icon"><span class="navicon_responsive"></span></label>');
      jQuery('.pane-node-field-menu-du-mini-site .pane-content .pane-title').on('click', function() {
        jQuery(this).parent().find('.menu').toggle();
      });
    }
     
    if (jQuery('.pane-node-field-menu-du-mini-site .pane-content .field--name-field-menu-du-mini-site').length) {
      jQuery('.pane-node-field-menu-du-mini-site .pane-content .field--name-field-menu-du-mini-site').parent().parent().find('h2').before('<label class="menu-icon menu-icon-title"><span class="navicon_responsive"></span></label>');
      jQuery('.pane-node-field-menu-du-mini-site .pane-title').on('click', function() {
        jQuery(this).parent().find('.field--name-field-menu-du-mini-site').toggle();
      });
    }

    if (jQuery('.pane-ebiz-patager-aphm').length) {
      if (jQuery('.pane-ebiz-patager-aphm').parent().parent().hasClass('panel-pane')) {
        jQuery('.pane-ebiz-patager-aphm').parent().parent().addClass('pane-ebiz-patager-aphm-parent');
      }
    }

    // SWIPERS MINI SITE ===============================
    if(jQuery('body').hasClass('node-type-mini-site-pleine-largeur')) {

      var mySwiper = new Swiper('.view-id-listeactualites.view-display-id-block_3 .swiper-container', {
       loop: false,
       autoHeight: true,
       autoplay: 5000,
     })

     jQuery('.view-id-listeactualites.view-display-id-block_3 .arrow-left').on('click', function(e) {
       e.preventDefault()
       mySwiper.swipePrev()
     })
     jQuery('.view-id-listeactualites.view-display-id-block_3 .arrow-right').on('click', function(e) {
       e.preventDefault()
       mySwiper.swipeNext()
     })

     var leftpos = jQuery('.flecheaccessright').offset().left;
     
     if (leftpos < 10) {			
       jQuery('.flecheaccessright').removeClass('icon-left');
       jQuery('.flecheaccessright').addClass('icon-right');
     }

      jQuery( window ).resize(function() {
        swiperMinisiteHeight(); // swiper 1
      });
      swiperMinisiteHeight();

     if(jQuery(".views-slideshow-controls-text").length > 0) {
       jQuery(".views-slideshow-controls-text span a").wrapInner('<span class="element-invisible"></span>');
       jQuery(".views-slideshow-controls-text-previous").addClass("icon-left");
       jQuery(".views-slideshow-controls-text-next").addClass("icon-right");
     }
   }

  var acc = document.getElementsByClassName("accordion");
  var i;

  for (i = 0; i < acc.length; i++) {
    acc[i].addEventListener("click", function() {
      this.classList.toggle("active");
      var panel = this.nextElementSibling;
      if (panel.style.display === "block") {
        panel.style.display = "none";
      } else {
        panel.style.display = "block";
      }
    });
  } 

  jQuery('.tabs_glossaire a.lettre').on('click', function(e) {
    e.preventDefault();
    var lettre = jQuery(this).attr('data-lettre');
    jQuery('.tabs_glossaire a').removeClass('active');
    jQuery(this).addClass('active');
    jQuery('.tab_glossaire').hide();
    jQuery('#tabs-' + lettre).show();
  });

  jQuery('.bloc_carousel .blocs_content').slick({
    infinite: false,
    slidesToShow: 3,
    slidesToScroll: 3,
    responsive: [
      {
        breakpoint: 900,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2
        }
      },
      {
        breakpoint: 500,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }
    ]
  });

  jQuery('#menu-btn').on('change', function(e) {
    if (jQuery(this).is(':checked')) {
      jQuery('.main-navigation-minisite').addClass('opened');
    } else {
      jQuery('.main-navigation-minisite').removeClass('opened');
    }
  });

  jQuery('.main-navigation-minisite > .menu > li.expanded > a').append('<span class="fleche"></span>');

  jQuery('.fleche').on('click', function(e) {
    e.preventDefault();
    if (jQuery(this).parent().parent().hasClass('opened')) {
      jQuery(this).parent().parent().removeClass('opened');
    } else {
      jQuery(this).parent().parent().addClass('opened');
    }
  });
  
    
});


function swiperMinisiteHeight() {
  var width1 = jQuery('.view-listeactualites .swiper-container').width();
  var idealHeight = width1 / 3.39;
  var containerHeight = idealHeight;
  jQuery('.view-listeactualites .swiper-container').css('height', containerHeight + 'px');
  jQuery('.view-listeactualites .swiper-slide').css('height', idealHeight + 'px');
  jQuery('.view-listeactualites .swiper-slide-container').css('height', idealHeight + 'px');
}