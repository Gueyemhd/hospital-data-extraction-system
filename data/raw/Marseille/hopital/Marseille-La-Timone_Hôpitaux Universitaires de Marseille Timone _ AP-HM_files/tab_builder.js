/**
 * @file: tab_builder.js
 * 
 * take the html markup for tabbed/accordion body
 * content and convert to the desired presentation.
 * 
 * we'll have to rework the markup structure first and then,
 * we can apply the toggle event elements for the user interaction
 * bits.
 */

(function ($){
	
	Drupal.behaviors.wysiwyg_tools_plus_theme_createTabs = {
		attach:function (context) {
			//tabbed elements first
			// for each of the div's apply an id to each
			$('.ready-tabber', context).each(function (index) {

				// a couple of opening set-ups for first run.
				if (index == 0) {
					//create the ul that our headers can be added to for the tabs row plus id's to link to content
					$(this).before('<ul class="ready-tabs"></ul>');
				}
				// add an indexed id to the div
				$(this).attr('id', 'content-' + index);

				//wrap the tab header as an anchor and li
				$(this).children('.ready-tabber-header').wrap('<li class="ready-tab"><a id="tab-' + index + '" href="javascript:void(0);"></a></li>');

				// move the header element to the ul as a li
				$(this).children('li').appendTo('ul.ready-tabs');
			});
			$('.ready-tabs', context).after('<br clear="all" />');
		}
	}
	
	Drupal.behaviors.wysiwyg_tools_plus_theme_createAccordions = {
		attach:function (context) {
			$('.ready-accordion').each(function (index) {
				$(this).attr('id', 'acc-' + index);
				$(this).children('.ready-accordion-header').wrap('<a class="acc-head" id="acc-head-' + index + '" href="javascript:void(0);"></a>');
				$(this).children('a').insertBefore(jQuery(this));

        // awful hack: apply .last to the accordion heads which appear to be last
        if ($(this).next().length == 0 || !$(this).next().hasClass("ready-accordion")) {
          $(this).prev().addClass("last");
        }
			});

		}
	}
	
	Drupal.behaviors.wysiwyg_tools_plus_theme_initPage = {
		attach:function (context) {
			$('.ready-accordion', context).hide();
			$('.acc-head', context).children('span').addClass('collapsed');
			// set the click events
			$('.ready-tabs a', context).click(function (event) {
				idClicked = this.id;
				wysiwyg_tools_plus_theme_toggleTabContent(idClicked);
			});

			$('.acc-head', context).click(function (event) {
				idClicked = this.id;
				wysiwyg_tools_plus_theme_toggleAccordionContent(idClicked);

        // attach an active class to active accordion heads
        if ($(this).children('span').hasClass("expanded")) {
          $(this).children('span').removeClass("expanded");
					$(this).children('span').addClass("collapsed");
        } else {
          $(this).children('span').addClass("expanded");
					$(this).children('span').removeClass("collapsed");
        }

			});
			wysiwyg_tools_plus_theme_toggleTabContent('tab-0');
		}
	}	
	
	/**
	 * Toggle the visibility of the tab content and set active link
	 */
	function wysiwyg_tools_plus_theme_toggleTabContent (eventId) {
		eventId = eventId.substring(eventId.length-1, eventId.length);
		$('.ready-tabber').each(function (index) {
			if (this.id == "content-" + eventId) {
				// set the link as active
				$('.ready-tabs #tab-' + eventId).parent('li').addClass('active');
				// expose active content
				$(this).show();
			}
			else {
				//unset active class from non-event links
				$('.ready-tabs #tab-' + index).parent('li').removeClass('active');
				//hide unactive content
				$(this).hide();
			}
		});
	}
	
	/**
	 * Toggle the visibility of the accordion content
	 */
	function wysiwyg_tools_plus_theme_toggleAccordionContent(eventId) {
		eventId = eventId.substring(eventId.lastIndexOf('-')+1, eventId.length);
		$('#acc-' + eventId).toggle('fast');
	}
	
}(jQuery));
