// JavaScript Document
(function($) {

	//$(document).ready(function($){
	Drupal.behaviors.myBehavior = {
	  attach: function (context, settings) {

			// Link #Backtotop : appears under div 'direct access bottom'
	  	$('html', context).once(function () {
				$(window).scroll(function() {
					var scrolled_val = $(document).scrollTop().valueOf();
					//console.log(scrolled_val+ ' = scroll value');

					// Flèche retour en haut
					if(scrolled_val >= 500) {
						$('#backtotop').fadeIn('slow');
					} else $('#backtotop').fadeOut();
				});
			});


			/* Accès direct bas pour version mobile => Dropdown */
			servicesFakeDropDown();


	  	// DIRECT ACCESS LEFT : POSITION FIXED
	  	if( $(window).width() > 940 ) { // NORMAL & WIDE
		  	$('html', context).once(function () {

					$(window).scroll(function() {
						var scrolled_val = $(document).scrollTop().valueOf();
						//console.log(scrolled_val+ ' = scroll value');

						//SET MENU FIXED
						if(scrolled_val >= 220 ){
							$('.l-floating-bar').addClass('fixed');
							$('.flecheaccessright').addClass('fixed');
						} else {
							$('.l-floating-bar').removeClass('fixed');
							$('.flecheaccessright').removeClass('fixed');
						}

						// Flèche retour en haut
						// if(scrolled_val >= 500) {
						// 	$('#backtotop').fadeIn('slow');
						// } else $('#backtotop').fadeOut();
					});
				});
		  }
		  else {
			  $('html', context).once(function () {
				  $('.flecheaccessright').removeClass('icon-left');
				  $('.flecheaccessright').addClass('icon-right');
					$(window).scroll(function() {
						var scrolled_val = $(document).scrollTop().valueOf();
						//console.log(scrolled_val+ ' = scroll value');

						//SET MENU FIXED
						if(scrolled_val >= 178 ){
							$('.l-floating-bar').addClass('fixed');
							$('.flecheaccessright').addClass('fixed');
						} else {
							$('.l-floating-bar').removeClass('fixed');
							$('.flecheaccessright').removeClass('fixed');
						}

					});
				});
		  }
		  

		  // SWIPERS HOMEPAGE ===============================
		  if($('body').hasClass('front')) {

 				var mySwiper = new Swiper('.view-id-listeactualites.view-display-id-block_3 .swiper-container', {
   				// pagination: '.pagination',
    			loop: true,
					autoplay: 5000,
					// autoHeight: true,
					// grabCursor: true,
					// paginationClickable: true
  			})

			  $('.view-id-listeactualites.view-display-id-block_3 .arrow-left').on('click', function(e) {
			    e.preventDefault()
			    mySwiper.swipePrev()
			  })

			  $('.view-id-listeactualites.view-display-id-block_3 .arrow-right').on('click', function(e) {
			    e.preventDefault()
			    mySwiper.swipeNext()
			  })

  
  			var leftpos = $('.flecheaccessright').offset().left;
				
				if (leftpos < 10) {			
					$('.flecheaccessright').removeClass('icon-left');
					$('.flecheaccessright').addClass('icon-right');
				}
  
  
			  var mySwiper2 = new Swiper('.view-miseEnAvantHomePage .swiper-container', {
			    // pagination: '.pagination',
			    loop: true,
					autoplay: 5000,
					// autoHeight: true,
					// grabCursor: true,
					// paginationClickable: true
			  })

			  $('.view-miseEnAvantHomePage .arrow-left').on('click', function(e){
			    e.preventDefault()
			    mySwiper2.swipePrev()
			  })

			  $('.view-miseEnAvantHomePage .arrow-right').on('click', function(e){
			    e.preventDefault()
			    mySwiper2.swipeNext()
			  })


				/* HAUTEUR DES SWIPERS */
				$( window ).resize(function() {
					swiperListeActuHeight(); // swiper 1
					swiperZoomSurHeight(); // swiper 2
				});

				$( window ).load(function() {    
				  swiperListeActuHeight(); // swiper 1
				  swiperZoomSurHeight(); // swiper 2
				});


				/* Slider controls (previous and next)
				   => Hide text content and display arrows icons */
				if($(".views-slideshow-controls-text").length > 0) {

					// wrap content into span.element-invisible
					$(".views-slideshow-controls-text span a").wrapInner('<span class="element-invisible"></span>');

					// display arrows PREVIOUS icon and NEXT icon
					$(".views-slideshow-controls-text-previous").addClass("icon-left");
					$(".views-slideshow-controls-text-next").addClass("icon-right");
				}


				$('.view-miseEnAvantHomePage.view-display-id-block_2 .views-slideshow-swiper-main-frame-row-item').click(function(){
					var url = $(this).find('.txt-accroche a').attr('href');
					location.replace(url);
				});
  		} // END SWIPERS HOMEPAGE ===============================


  		if ($('.pane-ebiz-search-highlight').length) {
			  var positionSearch = $('.pane-ebiz-search-highlight').offset().top;
			  var theWidth = 0;
		  
			  //console.log('block top: '+positionSearch);
			  $(window).scroll(function() {
				  //console.log($(window).scrollTop());
			    if($(window).scrollTop() > positionSearch ) {
			      $('.pane-ebiz-search-highlight').addClass('scrolled');

				    if(theWidth == 0) {
					    theWidth = $('.layout84-region--right').width() - 96;
					    $('.pane-ebiz-search-highlight').width(theWidth);
				    }
			    } 
			    else {
			      $('.pane-ebiz-search-highlight').removeClass('scrolled');			
			    }
				});
			}



			
			
			// Floating bar arrow
			$('.flecheaccessright').click(function() {
				checkArrowFloatingBar();
			});

			$(window).resize(function(){
			//	checkArrowFloatingBar();
				checkArrowFloatingBarOnlyOpenClose();
				servicesFakeDropDown();
			});

			
			//Dropdown select : rotate arrow
			if($('.form-select').length > 0) {
				$('.form-select').blur(function(){
					$(this).parent('.form-type-select').removeClass('clicked');
				});
				$('.form-select').click(function(){
					$(this).parent('.form-type-select').toggleClass('clicked');
				});
			}

			
			$('#menulang select').change(function() {
				var url = $(this).val();
				location.replace(url);
			});


  	} //close attach	
	}; //close behavior


	// Check if the floating bar arrow has to be left or right
	function checkArrowFloatingBar() {
		var leftpos = $('.flecheaccessright').offset().left;
		
		console.log("leftpos" + leftpos);
		if (leftpos > 10) {
			console.log("SETTING THE COOKIE TO UNSEET - BECOSE IT IS CLOSED");
			setCookie('openaccessdirect', "unset", 7);
		  $(".l-floating-bar").animate({left: '-72px'}, "slow");
		  $(".flecheaccessright").animate({left: '8px'}, "slow", function() {
				$(this).removeClass('icon-left');
				$(this).addClass('icon-right');
			});
		}
		else {
			setCookie('openaccessdirect', "set", 7);
			console.log("SETTING THE COOKIE TO SET - BECOSE IT IS OPEN");
		  $(".l-floating-bar").animate({left: '0'}, "slow");
		  $(".flecheaccessright").animate({left: '80px'}, "slow", function() {
				// Animation complete.
			  $(this).addClass('icon-left');
		    $(this).removeClass('icon-right');
			});
		}
	}
	
	function checkArrowFloatingBarOnlyOpenClose() {
		var m = $(".l-floating-bar").css('left');
		console.log('l-floating-bar '+m);
		
		//opened
		if (m == '0px') {
			$('.flecheaccessright').addClass('icon-left');
			$('.flecheaccessright').removeClass('icon-right');
			
		}
		// closed
		else {
			$('.flecheaccessright').addClass('icon-right');
			$('.flecheaccessright').removeClass('icon-left');

		}
		
	}


	function servicesFakeDropDown() {
		if( $('#block-views-access-direct-bas-block').length > 0 ) {
		
			if( $(window).width() < 940 ) {
		
				$('#block-views-access-direct-bas-block #dropdownName').unbind();
				$('#block-views-access-direct-bas-block #dropdownName').click(function() {
			
					$(this).parent().toggleClass('opened');				
				});
			}
		}
	}

	// Calcul de la hauteur du premier swiper de la page d'accueil en fonction de la largeur de la fenêtre
	function swiperListeActuHeight() {
		var width1 = $('#block-views-listeactualites-block-3 .swiper-container').width();
		var idealHeight = width1 / 3.39;

	  var titleHeight = $('.view-listeactualites .swiper-slide .views-field-title .content-overlay').outerHeight();
	  var containerHeight = idealHeight;

	  if( $(window).width() < 940 ) { // mobile + tab
	  	containerHeight += titleHeight;
		}

		//var height1 = $('#block-views-listeactualites-block-3 .swiper-container').height();	  
	  //console.log("The width is: " + width1 + " The height is " + height1 + " The height shld be" +  idealHeight);
	  //console.log("title height : " + titleHeight);
	  $('#block-views-listeactualites-block-3 .swiper-container').css('height', containerHeight + 'px');
	  $('#block-views-listeactualites-block-3 .swiper-slide').css('height', idealHeight + 'px');
	  $('#block-views-listeactualites-block-3 .swiper-slide-container').css('height', idealHeight + 'px');
	}


	// Calcul de la hauteur du second swiper de la page d'accueil en fonction de la largeur de la fenêtre
	function swiperZoomSurHeight() {
		var width1 = $('.pane-views-miseenavanthomepage-block-2 .swiper-container').width();
	  var idealHeight = width1 / 1.552;

	  //var heigth1 = $('.pane-views-miseenavanthomepage-block-2 .swiper-container').height();
	  //console.log("The width is: " + width1 + " The height is " + height1 + " The height shld be" +  idealHeight);
	  $('.pane-views-miseenavanthomepage-block-2 .swiper-container').css('height', idealHeight + 'px');
	  $('.pane-views-miseenavanthomepage-block-2 .swiper-slide').css('height', idealHeight + 'px');
	  $('.pane-views-miseenavanthomepage-block-2 .swiper-slide-container').css('height', idealHeight + 'px');
	}


	$(document).ready(function(){
		$("#selecthop").change(function(){
			window.location.href = $( this ).val();		
		});
		var docwidth = jQuery(window).width();
		console.log(docwidth);
			if (docwidth < 940) {
				//check the cookie to open the document 
				var cookie_value = checkCookie('openaccessdirect');
				
				if (cookie_value == 'set') {
					setTimeout(function() { 
						cookie_value = checkCookie('openaccessdirect');
						if (cookie_value == 'set' && jQuery('.flecheaccessright').hasClass('icon-right')) checkArrowFloatingBar(); 
						}, 5000);
				}
				
				console.log("THE VALUE IS: " + cookie_value);
		}
	});
	



	Drupal.behaviors.targetBrowsersOS = {
	  attach: function (context, settings) {
	    // Check to see which operating system we're using.
	    if (navigator.appVersion.indexOf("Mac")!=-1) {
	      $('html').addClass('nav-mac');
	    }
	    else {
	      $('html').addClass('nav-pc');
	    }
	    // Check to see if the browser is Safari and doublecheck that it is not Chrome.
	    if (navigator.userAgent.indexOf('Chrome') > -1) {
	      $('html').addClass('nav-chrome');
	    }
	    if (navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1) {
	      $('html').addClass('nav-safari');
	    }
	    if (navigator.userAgent.indexOf('Firefox') > -1) {
	      $('html').addClass('nav-firefox');
	    }
	    if (navigator.userAgent.indexOf('MSIE') > -1) {
	      $('html').addClass('nav-ie');
	      
	      if (navigator.userAgent.indexOf('MSIE 9') > -1) {
			$('html').addClass('nav-ie9');
	      }
	    }else $('html').addClass('not-ie');
	  }
	}

})(jQuery);


function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function checkCookie(cookiename) {
    var cookievalue = getCookie(cookiename);
    if (cookievalue != "") {
       console.log('cookie '+cookiename + 'is set' );
      
    } else {

    	
            setCookie(cookiename, "set", 7);
           
       
    }
    return getCookie(cookiename);
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}