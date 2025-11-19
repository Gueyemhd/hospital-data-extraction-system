!function ($) {

  var register = function(){
    // Lazy initialisation of sortable on focusin (used by list textfields)
    $(document).on('focusin', '.sortable-lazy :input', function() {
      var $lazy = $(this).closest('.sortable-lazy');
      
      // Build sortable
      $.jalios.Sortable.buildSortable($lazy);
      
      // Record previous position for update()
      $lazy.children().each(function(idx) {
        $(this).data('jalios.sortable', idx);
      });
    });
    
    $(document).on("jalios:sortable", callback);
  }
  
  var callback = function(event) {

    var sortable = $.jalios.Event.match(event, 'sortable');
    if (!sortable){ return; }
    
    var $container = $(sortable.container);
    if (!$container || !$container.hasClass('tab-group-list')){ return; }

    // This is the LI element
    var $item  = sortable.ui.item;
    
    var idx = $container.children('.tab-group-list-item').index($item);

    // This is the A element in the LI
    var $tabLink = $item.children();
    var fieldGroup = $tabLink.data('jalios-fieldgroup');
    $(fieldGroup ? 'A[data-jalios-fieldgroup=' + fieldGroup + ']': $tabLink).each(function() {
      var $this = $(this);
      var $tabPaneLang = $this.closest('.tab-pane.wdglang');
      var $wrapper = $tabPaneLang.exists() ? $tabPaneLang : $.jalios.ui.Widget.getWidget($this);
      
      /* REORDER */
      
      // Sort tabs
      var $tabList = $wrapper.find('.tab-group-list');
      var $tabListItem = $this.closest('.tab-group-list-item');
      var $tabListItems = $tabList.find('.tab-group-list-item');
      var currentItem = $tabListItems.get(idx);
      if(currentItem !== $tabListItem[0]) {
        if($tabListItems.index($tabListItem) > idx) { // Move down
          $tabListItem.insertBefore(currentItem);
        } else { // Move up
          $tabListItem.insertAfter(currentItem);
        }
      }
      
      // Sort inputs
      var $inputList = $wrapper.find('.input-group-list');
      var $inputListItem = $inputList.find($this.attr("href"));
      var $inputListItems = $inputList.find('.input-group-list-item');
      var currentInputItem = $inputListItems.get(idx);
      if(currentInputItem !== $inputListItem[0]) {
        
        // Check if there is a wysiwyg editor -> Moving the editor will break it. It needs to be removed and readded when the move is finished
        $inputListItem.find('.form-control').each(function() {
          var $this = $(this);
          if($this.hasClass('control-wysiwyg')) {
            $this.removeWysiwyg();
          }
        });
        
        if($inputListItems.index($inputListItem) > idx) { // Move down
          $inputListItem.insertBefore(currentInputItem);
        } else { // Move up
          $inputListItem.insertAfter(currentInputItem);
        }
        
        // Check if there is a wysiwyg editor -> readded after move
        $inputListItem.find('.form-control').each(function() {
          var $this = $(this);
          if($this.hasClass('control-wysiwyg')) {
            $this.initWysiwyg();
          };
        });
      }
      
      /* RENUMBER */
      
      // Renumber in tab elements
      var $tabListItems = $tabList.find('.tab-group-list-item').each(function(index) {
        var $this = $(this);

        // href attribute
        var $link = $this.children();
        var href = $link.attr('href'); // JsChecker.authorize(".attr('href')")
        var newId = href.substring(0, href.lastIndexOf('_') + 1) + index;
        $link.attr('href', newId).html(index + 1);

        // 'data-jalios-fieldgroup' attribute
        var fieldGroup = $link.data('jalios-fieldgroup');
        if(fieldGroup) {
          var fieldGroupId = fieldGroup.substring(0, fieldGroup.lastIndexOf('_') + 1) + index;
          $link.data('jalios-fieldgroup', fieldGroupId);
          $link.attr('data-jalios-fieldgroup', fieldGroupId);
        }
      });

      // Renumber in input list
      var $inputListItems = $inputList.find('.input-group-list-item').each(function(index) {
        var $this = $(this);
        var id = $this.attr('id');
        var newId = id.substring(0, id.lastIndexOf('_') + 1) + index;
        $this.attr('id', newId);
      });
    });
  }
  
  // Plugin initialization on DOM ready
  $(document).ready(function($) {
    register();
  });
  
}(window.jQuery);