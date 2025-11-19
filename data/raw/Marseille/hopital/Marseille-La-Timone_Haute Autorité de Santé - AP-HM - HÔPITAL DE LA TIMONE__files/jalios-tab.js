!function ($) {
  
  // Namespace
  if (!$.jalios)      { $.jalios    = {}; }
  if (!$.jalios.ui)   { $.jalios.ui = {}; }


  // ------------------------------------------
  //  PRIVATE
  // ------------------------------------------

  var register = function(){
      
    // Activate click on tabs
    $(document).on('click', '.nav-tabs > LI > A, .nav-tabs .tabdrop .dropdown-menu > LI > A', click);
    $(document).on('click', '.widget .nav-pills > LI > A, .widget .nav-pills .tabdrop .dropdown-menu > LI > A', clickFieldGroup);
    
    // Register on Ajax-Refresh
    $(document).on('jalios:refresh', refresh);
     
    // Upgrade old tabpane
    upgrade();
    
    // Select memorized tab
    select.delay(0.1);
  }

  /**
   * Perform upgrade with an Ajax-Refresh
   */
  var refresh = function(event){
      
    var refresh = $.jalios.Event.match(event, 'refresh', 'after')
    if (!refresh){ return; }
    if (!refresh.target){ return; }
    
    refresh.target.each(function(){
      upgrade(this);
      select.delay(0.1,this);
    });
  };
  
  /**
   * Handle click on tabpane
   */
  var click = function(evt){
    var $e  = $(evt.currentTarget);
    if ($e.attr('href') 
        && ($e.attr('href').indexOf('#') < 0 || $e.attr('href') === "#")){ // Should test base# ? 
      return;
    }
    

    if($e.is('button, [role=button]')){
      return;
    }
    
    // Handle nav-static
    var $nav = $e.closest('.nav-tabs');
    if ($nav.hasClass('nav-static')){
      return;
    }
        
    evt.preventDefault();
    $e.tab('show');
    
    // Store state in cookie
    var prefs = $nav.attr('data-jalios-prefs');
    if (prefs){
      var pos = $e.parent().index();
      $.jalios.Prefs.data(prefs, pos);
    }
    
    // Fast hack to retrieve target
    var selector = $e.attr('href'); // JsChecker.authorize(".attr('href')")
    selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
    
    // Fire an event
    var event = jQuery.Event("jalios:tab");
    event.tab  = {
      trigger : $e,
      pane    : $(selector)
    };      
    $(document).trigger(event);
  }
  
  /**
   * Handle click on fieldgroup tab
   */
  var clickFieldGroup = function(evt) {

    var $e = $(evt.currentTarget);
        
    evt.preventDefault();
    $e.tab('show');
    
    var fieldGroup = $e.data('jalios-fieldgroup');
    if(fieldGroup) {
      $('A[data-jalios-fieldgroup=' + fieldGroup + ']').tab('show');
    }
  }
  
  var select = function(context){
    $(context || document).find('.nav-tabs').each(function(){
      var $this = $(this);

      var prefs = $this.attr('data-jalios-prefs');
      if (!prefs){ return; }
      
      var pos = $.jalios.Prefs.data(prefs);
      if (!pos){ return }
      
      var $tab = $this.find('LI A').get(pos);
      $.jalios.DOM.follow($tab);
    });
  }
  
  /**
   * DuckTape for old tabpane
   */
  var upgrade = function(context){
    
    // Tabdrop
    $(context || document).find('.nav-pills, .nav-tabs').not('.no-tab-drop').tabdrop({'text' : '<span class="fa fa-bars"></span>'});
    
    // Replace old tab layout by bootstrap tabs
    $(context || document).find('.tab-pane').each(function(){

      var $this = $(this);
      
      // Retrieve all tabs
      var $tab = $(this).children('.tab-page').children('.tab');
      if (!$tab.exists()){ return; }
      
      // CSS: .tab-pane => .tab-content
      $this.addClass('tab-content').removeClass('tab-pane');
      
      // Set an id to each tabs
      $tab.each(function(idx){
      
        var active = idx == 0 ? ' active' : '';
         
        // CSS: .tab-page => .tab-pane + id
        var id = $(this).closest('.tab-page').addClass('tab-pane').addClass(active).removeClass('tab-page').identify().attr('id');
        
        // Wrap innerHTML into a link
        var html = '<a href="#'+id+'">'+this.innerHTML+'</a>';
        
        
        // Check if it has already link
        var $ahref = $(this).find('A').first();
        if ($ahref.exists()){
          $ahref.attr('href','#'+id);
          html = this.innerHTML;
        }
        
        // Convert to LI
        $(this).replaceWith($('<li class="tab'+active+'">'+html+'</li>'));
      });

      // Insert UL before component and append $tab
      if ($this.hasClass("tab-old-style")) {
        $tab = $('<ul class="nav nav-tabs br"></ul>').insertBefore($this).append($('.tab-pane > .tab', this));
      } else {
        $tab = $('<ul class="nav nav-tabs nav-tabs-underlined is-left-aligned br"></ul>').insertBefore($this).append($('.tab-pane > .tab', this));
      }
      
      // Hook: Insert into tab-pane-anchor the Ul of .mainTab
      if ($this.attr('id') == 'mainTab' && $('#tab-pane-anchor').exists()){
        $('#tab-pane-anchor').append($tab);
      }
    });
    
    // Add Bootstrap classes for inner-tabs
    $('.inner-tabs', context || document).each(function(){
      $(this).find('> UL').addClass('nav nav-tabs nav-static').find('LI').addClass('tab').filter('.enabled').removeClass('enabled').addClass('active');
    });
  }
  
  // ------------------------------------------
  //  PUBLIC
  // ------------------------------------------

 /**
  * <p>
  * Convenient library to transform 
  * <ul>
  *   <li>old Jalios Tabs (tabpane.js) to new Bootstrap tabs.</li>
  *   <li>old inner-tabs to new Bootstrap tabs.</li>
  * </ul>
  * Fires an event <code>jalios:tab</code> when a tab is opened.
  * </p>
  * 
  * <h5>Deprecated</h5>
  * 
  * The function setSelectedTab() is deprecated. Users should relies on Bootstrap functions:<br/>
  * <code>$('#id A:nth-child(2)').tab('show');</code>
  * 
  * @namespace $.jalios.ui.Tab
  * @copyright Jalios SA
  * 
  * @unittest js/tests/jalios/core/jalios-tab.html
  * 
  */
  $.jalios.ui.Tab = {
    
    /**
     * Upgrade old <code>tabpane</code> to new bootstrap tabs.
     * 
     * @param {element} context the page context to upgrade (optional) 
     */
    'upgrade': upgrade,
    
    /**
     * do select of the previous tab.
     */
    'select' : select
  };
  
  // Plugin initialization on DOM ready
  $(document).ready(function($) {
    register();
  });
  
}(window.jQuery);


// ------------------------------------------
//  DEPRECATED
// ------------------------------------------


// Backward compatibility with tabpane.js
// @param tabPaneId the tabpane id
// @param index the tab index
// 
// @deprecated use $selector.tab('show') instead

function setSelectedTab(tabPaneId, index) {
  var $elm = jQuery("#"+tabPaneId);
  var $navTabs;
  // manage old tab legacy
  if($elm.hasClass("tab-content")){
    $navTabs = $elm.parent().find('> UL.nav-tabs');
  }
  else{
    $navTabs = $elm.find('UL.nav-tabs')
  }
  if(!$navTabs.exists()){
    $navTabs = $elm.closest('FORM').find('UL.nav-tabs');
  }
  availableLi = $navTabs.find('>LI');
  availableLi.filter(function( tmpIndex ) {
      return !(jQuery(this).hasClass("dropdown"));
    }).filter(function( tmpIndex ) { 
      return tmpIndex===index;
    }).find('A').tab('show');
}

// Deprecated fallback for Prototype ajax-refresh
if (Event.observe){
  Event.observe(document, 'refresh:after', function(event){
    if (event && event.memo && event.memo.wrapper){
      var elm = document.getElementById(event.memo.wrapper);
      jQuery.jalios.ui.Tab.upgrade(elm);
    }
  })
}

// Deprecated fallback for Prototype tabpane:change
jQuery(document).on('jalios:tab', function(event){
  document.fire('tabpane:change', { tabPage: event.tab.trigger.identify().attr('id') });
});


