
// -----------------------------------------------------------------------------
//  CLASS
// -----------------------------------------------------------------------------


'JCMS.form.Widget'._namespace({
  init: function(){
    Util.observeFocusClass('formTextfield', JCMS.form.Widget._handleBlurFocus);
    Util.observeFocusClass('formTextarea', JCMS.form.Widget._handleBlurFocus);
    Util.observeDocument('click', JCMS.form.Widget._handleTagsClick);
  },
  
  /**
   * -----------------------------------------------------------------------------
   *  KeyWord
   * -----------------------------------------------------------------------------
   */

   _handleTagsClick: function(event){
   
     if (!(event.eventName === 'jcms:click' || Util.isLeftClick(event))){ return; }
     
     var elm = Event.element(event);
     if (!elm || !elm.fastUp) { return; }
      
     var ol = elm.fastUp('OL', 'wdg-list', true, 2);
     if (!ol) { return; }
      
     var div = ol.fastUp('DIV', 'keyword', true, 4);
     if (!div) { return; }
     
     // Add a new element
     var lastLI = ol.fastLastChild('LI');
     var last  = lastLI.hasClassName('placeholder') ? lastLI.fastPrevious('LI').fastChild('INPUT') : lastLI.fastChild('INPUT');
     if (!last || !last.value.blank()){
       JCMS.form.Widget.add(elm);
       return;
     }
     
     // Do job for each lang
     JCMS.form.Widget._list('_handlePlaceholder',elm);
   },

   _handlePlaceholder: function(list){
     var lastLI = list.fastLastChild('LI');
     var last  = lastLI.hasClassName('placeholder') ? lastLI.fastPrevious('LI').fastChild('INPUT') : lastLI.fastChild('INPUT');
     if (last && last.value.blank()){
       last.fastUp('LI').show();
       InputUtil.focus(last);
     }
   },

  /**
   * -----------------------------------------------------------------------------
   *  TEXTAREA RESIZER
   * -----------------------------------------------------------------------------
   */

  /**
   * Handle TextArea Resizer
   */
  _initResizer: function(event){
    var widget = $(event.memo.elmId);
    
    if (!widget || widget.tagName != 'TEXTAREA' || $(widget.parentNode).hasClassName('noresize')){ return; }
    
    JCMS.form.Widget.autoResize(widget);
    
    if (widget.retrieve("resizable",false)){ return; }
    
    widget.addClassName("resizable");
    widget.store("resizable",true);
    
    Event.observe(widget,"mousedown",JCMS.form.Widget.dragStart);
    Event.observe(widget,"keypress",function(event){
      var key = event.which || event.keyCode;
      if (!key || key != Event.KEY_RETURN){ return; }
      JCMS.form.Widget.autoResize(Event.element(event));
    });
  },
  
  _drag    : false,
  _dragX   : 0,
  _dragY   : 0,
  _dragW   : 0,
  _dragH   : 0,
  
  dragStart : function(event) {
    
    var elm = Event.element(event);
    if (elm.tagName != 'DIV' && elm.tagName != 'TEXTAREA'){ return; }
    
    var x   = Event.pointerX(event)-10; /* (10) is a Hack because of tab-page padding */
    var y   = Event.pointerY(event)-10; 
    var vp  = elm.cumulativeOffset();
    var ew  = elm.getWidth();
    var eh  = elm.getHeight();
    var ex  = vp.left;
    var ey  = vp.top;

    if ((x > ex+ew) || (y > ey+eh) || (x < ex+ew-32) || (y < ey+eh-32)){
      // alert(elm.tagName+' : '+(ex+ew-32)+'<'+x+'<'+(ex+ew) +' / '+ (ey+eh-32)+'<'+y+'<'+(ey+eh));
      return;
    }
    
    elm.style.cursor= 'se-resize';
    
    // Wiki Toolbar
    if (elm.hasClassName('wikitoolbar')){
      elm = elm.previous('TEXTAREA');
      ew  = elm.getWidth();
      eh  = elm.getHeight();
    }
    
    JCMS.form.Widget._drag  = elm.identify();
    JCMS.form.Widget._dragX = x;
    JCMS.form.Widget._dragY = y;
    JCMS.form.Widget._dragW = ew;
    JCMS.form.Widget._dragH = eh;
    
    Event.observe(document, "mousemove", JCMS.form.Widget.dragMove);
    Event.observe(document, "mouseup",   JCMS.form.Widget.dragEnd);
  },
  
  dragEnd : function(event) {
    var elm = $(JCMS.form.Widget._drag);
    if (!elm){ return; }
    
    elm.style.cursor= '';
    
    // Wiki Toolbar
    var tbar = elm.next('DIV.wikitoolbar');
    if (tbar){
      tbar.style.cursor= '';
    }
    
    JCMS.form.Widget._drag  = false;
    Event.stopObserving(document, "mousemove", JCMS.form.Widget.dragMove);
    Event.stopObserving(document, "mouseup",   JCMS.form.Widget.dragEnd);
  },

  dragMove : function(event) {
    var elm = $(JCMS.form.Widget._drag);
    var x   = Event.pointerX(event);
    var y   = Event.pointerY(event);
    var w   = JCMS.form.Widget._dragW + (x - JCMS.form.Widget._dragX);
    var h   = JCMS.form.Widget._dragH + (y - JCMS.form.Widget._dragY);
    
    if (w > 15) { elm.style.width  = w + "px"; }
    if (h > 15) { elm.style.height = h + "px"; }
    
    // Wiki Toolbar
    var tbar= elm.fastNext('DIV','wikitoolbar');
    if (w > 15 && tbar){ tbar.style.width  = w + 6 + "px"; }
    
    // Wiki Preview
    var tprev= elm.fastNext('DIV','wikipreview');
    if (w > 15 && tprev){ tprev.style.width  = (w-7) + "px"; }
    if (h > 15 && tprev){ tprev.style.marginTop = "-"+(h+6)+ "px"; }
    if (h > 15 && tprev){ tprev.style.height    = (h-5)+ "px"; }
  },

  autoResize : function(ta) {
    var lines = ta.value.split('\n');
    var rows = 1;
    for (i = 0; i < lines.length; i++) {
      if (lines[i].length >= ta.cols) { 
        rows += Math.floor(lines[i].length / ta.cols);
      }
    }
    rows += lines.length;
    if (rows > ta.rows) {
      ta.rows = Math.min(rows,20);
    }
  },


  /**
   * -----------------------------------------------------------------------------
   * BLUR / FOCUS
   * -----------------------------------------------------------------------------
   */
   
  _lastFocusId: false,
  
  _handleBlurFocus : function(event, elm, className, eventName){
     var elm = $(elm);
     if (eventName === 'focus:in'){
       JCMS.form.Widget.fireFocus.delay(0.1,event, elm, className);
     }
     else if (eventName === 'focus:out') {
      JCMS.form.Widget.fireBlur.delay(0.1,event, elm, className);
     }
   },

  fireBlur: function(event, input){
    var widget = JCMS.form.Widget.getWidget(input);
    if (!widget || widget.hasClassName("disabled")){ return; }
    
    /* Will blur on document click 
      var lastId = JCMS.form.Widget._lastFocusId;
      JCMS.form.Widget._focusClasses(false, $(lastId));
    */
    
    document.fire('jcms:blur',{ elmId: input.identify() });
  },
  
  fireFocus: function(event, input){
    var lastId = JCMS.form.Widget._lastFocusId;

    // Toggle Focus/Class
    if (!JCMS.form.Widget._focusClasses(input, $(lastId))){
      return;
    }
    
    // Fire event
    document.fire('jcms:focus',{ elmId: input.identify() , lastId: lastId });
  },
  
  _focusClasses: function(widget, lastFocus){
  
    // Do not fire twice on the same element
    if (widget == lastFocus){ return false; }
    
    var wrapper1 = JCMS.form.Widget.getWrapper(widget);
    var wrapper2 = JCMS.form.Widget.getWidget(widget);
    if (wrapper2 && wrapper2.hasClassName("disabled")){
      return false;
    }
    
    // Remove last focus
    JCMS.form.Widget.clearFocusClasses(lastFocus);
    
    if (!widget) {
      return false;
    }
    
    JCMS.form.Widget._lastFocusId = widget.identify();
    
    // Add new focus
    if (wrapper1 && !wrapper1.hasClassName('tab-page')){
      wrapper1.addClassName('focus-field');
    }
    
    if (wrapper2 && !wrapper2.hasClassName('tab-page')){
      wrapper2.addClassName('focus-widget');
    }
    
    return true;
  },
  
  clearFocusClasses: function(lastFocus){
    var lastFocus = lastFocus || $(JCMS.form.Widget._lastFocusId);
    if (!lastFocus){ return; }
    
    JCMS.form.Widget._lastFocusId = false;
    var lastWrapper1 = JCMS.form.Widget.getWrapper(lastFocus);
    if (lastWrapper1){
      lastWrapper1.removeClassName('focus-field');
    }
    
    var lastWrapper2 = JCMS.form.Widget.getWidget(lastFocus);
    if (lastWrapper2){
      lastWrapper2.removeClassName('focus-widget');
    }
  },
  
  /**
   * -----------------------------------------------------------------------------
   * UPLOAD FIELDS
   * -----------------------------------------------------------------------------
   */
  
  toggleUploadField: function(link){
    var link = $(link) || $(CtxMenuManager.latestElement);
    return JCMS.form.Widget._toggleUpload(link);
  },
  
  _toggleUpload: function(elm, showChooser){
    var wrapper = JCMS.form.Widget.getWrapper(elm);
    
    // Check upload context
    var upload  = wrapper.down('INPUT.formUploadfield');
    if (!upload || (upload.disabled && showChooser)){
      return; // Job already done
    }
    
    var lbl     = wrapper.down('INPUT.formChooserLabelfield');
    var chooser = wrapper.down('INPUT.formChooserfield');
    
    if (!upload.disabled){
      upload.disable(); upload.hide();
      lbl.show();       /*chooser.show();*/
      lbl.enable();     chooser.enable();
    } else {
      lbl.disable();    chooser.disable();
      lbl.hide();       chooser.hide();
      upload.show();    upload.enable();
    }
    return false;
  },
  
  
  /**
   * -----------------------------------------------------------------------------
   * WIDGET/FIELDS ACTIONS
   * -----------------------------------------------------------------------------
   */
   
   UI_EDITOR_COLORCHOOSER:        'F',
   UI_EDITOR_IMAGEPATH:           'I',
   UI_EDITOR_SIMPLEIMAGEPATH:     'I',
   UI_EDITOR_MEDIAPATH:           'M',
   UI_EDITOR_SIMPLEMEDIAPATH:     'M',
   UI_EDITOR_DATECHOOSER:         'V',
   
   UI_EDITOR_MEMBERCHOOSER:       'EHJY',
   UI_EDITOR_GROUPCHOOSER:        'EGY',
   UI_EDITOR_PUBLICATIONCHOOSER:  'ELXMSCcY',
   UI_EDITOR_PUBLICATIONSCHOOSER: 'ELXMSCcY',
   UI_EDITOR_CATEGORYCHOOSER:     'EZY',
   UI_EDITOR_CATEGORIESCHOOSER:   'EZY',
   UI_EDITOR_WORKSPACECHOOSER:    'EOY',
   UI_EDITOR_QUERYCHOOSER:        'QY',
   UI_EDITOR_ACLCHOOSER:          'Y',
   UI_EDITOR_SQLQUERY:            '',
   UI_EDITOR_DBRECORDCHOOSER:     '',

   getWidget: function(elm){
      var $elm = jQuery.jalios.ui.Widget.getWidget(elm);
     return $elm.exists() ? $($elm[0]) : false;
   },
   
   getWrapper: function(elm){
     var $elm = jQuery.jalios.ui.Widget.getWrapper(elm);
     return $elm.exists() ? $($elm[0]) : false;
   },
   
   /**
    * Return params to provide to the RPC method
    * 
    * 
    * E => EditTag.getEditIcon()
    * R => clear()
    * T => remove()
    * A => add()
    * U => up()
    * D => down()
    * F => openColorChooser()
    * I => openImageChooser()
    * M => openMediaChooser()
    * y => Multilang
    * - => insert a separator
    * 
    * @param link 
    * @param menu
    * @return String the link classes or false/null to stop action
    * @see com.jalios.jcms.ajax.WidgetCtxMenu.java
    */
  fillCtxMenuHook: function(link,menu){
    try {
    
      var link = $(link);
      var items   = '';
      var wrapper = JCMS.form.Widget.getWrapper(link);
      var widget  = JCMS.form.Widget.getWidget(link);
      var wdglang = link.fastUp(['DIV'],'wdglang',true,10);
      
      if (!wrapper){ return; }
      
      var lang    = wdglang && wdglang.className.match(/wdglang-(\S+)/);
      if (lang){ lang = lang[1]; }
               
      // Handle Widget Kinds
      if (widget && widget.className){ 
        $w(widget.className).each(function(cn){
          if (JCMS.form.Widget[cn]){
            items += JCMS.form.Widget[cn];
          }
        });
      }
        
      // Handle Multivalued
      if (wrapper.tagName == 'LI'){ // It is a List !
        items = (wrapper.parentNode.tagName == 'OL' && !widget.hasClassName("nodnd")) ? ('R'+items+'-ATUD-') : (items+'-AT-');
      } else {
        items = 'R' + items;
      }  
      
      // Handle Multilang
      if (widget.hasClassName('ml')){
        items += 'y';
      }
        
      // Handle Chooser's Hidden Input 
      var chooser = wrapper.down('INPUT.formChooserfield');
      if (!chooser){
        return items+"','"+lang+"','','";
      }

      var chooserId   = '';
      if (chooser.value){
        chooserId = chooser.value;
      }
      
      var chooserType = widget.className.match(/super_([\w\.]+)/);
      chooserType = (chooserType && chooserType.length > 1) ? chooserType[1] : '';
  
      return items+"t','"+lang+"','"+chooserType+"','"+chooserId;
    
    } catch(ex){
      alert(ex || ex.message);
    }
  }, 
  
  isInKeyword : function(elm){
    return jQuery.jalios.ui.Widget.Keyword.isInKeyword(elm);
  },

  /**
   * Display Chooser Id
   */
  showChooserId: function(link){
    var link     = $(link) || $(CtxMenuManager.latestElement);
    var wrapper  = JCMS.form.Widget.getWrapper(link);
    var input    = wrapper.down('INPUT');
    var next     = input.next('INPUT');
    
    JCMS.form.Widget._toggleUpload(link, true);
    next.toggle();
    
    return false;
  },
  
  _initKeypress: function(event){
    var elm = $(event.memo.elmId);
    
     // Is Input Text
    if(!elm || elm.type != 'text' || elm.retrieve('_keyField',false) || elm.hasClassName('autocomplete')){ return; }
    
    // Is List
    var wrapper  = JCMS.form.Widget.getWrapper(elm);
    if (!wrapper || wrapper.tagName != 'LI'){
      return;
    }
    
    elm.store('_keyField',true);
    Event.observe(elm,"keypress",function(event){
      var key = event.which || event.keyCode;
      
      if (!key || key != Event.KEY_RETURN){ return; }
      
      var input = Event.element(event); 
      if (!input.value){
        Event.stop(event);
        return; 
      }
      
      // Not for choosers
      if ($(input).hasClassName('formChooserLabelfield')){ return; } 
      
      if (JCMS.form.Widget.add(input)){
        Event.stop(event);
      }
    });
  },

  /*
   * POPUP CALLBACK (When there is no hope)
   */
  _popupCallback: function(event){ 
    if (!event.memo){ return }
    
    var link   = $(event.memo.linkId);
    if (!JCMS.form.Widget.getWidget(link)){ // Are we in a widget ?  
      link =  $(CtxMenuManager.latestElement); // Should find a better way
      if (!JCMS.form.Widget.getWidget(link)){  
        return;
      }
    }
    
    var wrapper = JCMS.form.Widget.getWrapper(link);
    var input   = wrapper.down('INPUT'); 
    var args    = [input.identify()].concat($A(event.memo.args));
    JCMS.form.Widget._chooserCallback.apply(this,args); // call function with (id,arg1,arg2,...)
    
    // Toggle upload
    JCMS.form.Widget._toggleUpload(input,true);
  },
  _chooserCallback: function(inputId, id, title, media, url){
    var input = $(inputId);
    var next = input.next('INPUT');
    if (next){
      next.value  = id || '';
      input.value = id ? title : '' ;
      input.fire("JCMS:widgetChange", {elmId : input.identify() });
    } else {
      input.value = url;
      input.fire("JCMS:widgetChange", {elmId : input.identify() });
    }
  },
  
  /* 
   * OPEN CHOOSERS
   */
  openColorChooser: function(link){
    var link     = $(link) || $(CtxMenuManager.latestElement);
    var wrapper  = JCMS.form.Widget.getWrapper(link);
    var input    = wrapper.down('INPUT');
    var chooser  = JcmsJsContext.getContextPath()+'/work/colorChooser.jsp?color='+input.value.slice(1);
     
    var inputId  = input.identify(); 
    var callback = function(value){ 
      var input = $(inputId);
      input.value = value;
      input.fire("JCMS:widgetChange", {elmId : input.identify() });
      input.style.backgroundColor = value;
    }
     
    return Popup.popupWindow(chooser, 'ColorChooser', 235, 220,'no','no','yes',false,false,callback);
  },
  
  /* Handle multiple fields*/
  openDocChooser:   function(link,isUpdate,docParam){ 
    
    var link     = $(link) || $(CtxMenuManager.latestElement);
    var widget   = JCMS.form.Widget.getWidget(link);
    var wsid     = Element.getJcmsId(document.body,'WS_');
    
    docParam = docParam ? docParam.replace("&amp;","&") : "";
    if (!widget){
      var chooser  = JcmsJsContext.getContextPath()+'/work/docChooser.jsp?nbElt=1&ws='+wsid+'&'+docParam;
      var callback = function(fdIDs, fdTitles){ Popup.reload(); };
      return Popup.popupWindow(chooser, 'DocChooser', 640, 600,'no','yes','yes',false,false,callback);
    }

    var wrapper  = JCMS.form.Widget.getWrapper(link);
    var input    = wrapper.down('INPUT.formChooserfield');
    var nbElt    = wrapper.hasClassName('wdglang') ? 1 : (wrapper.nextSiblings().size()+1);
    var chooser  = JcmsJsContext.getContextPath()+'/work/docChooser.jsp?nbElt='+nbElt+'&hideUnzip=true&ws='+wsid+'&'+docParam;
    if (isUpdate){
      chooser = JcmsJsContext.getContextPath()+'/work/docChooser.jsp?nbElt=1&hideUnzip=true&ws='+wsid+'&id='+input.value+'&'+docParam;
    }
    
    var wrapperId = wrapper.identify();
    var callback = function(fdIDs, fdTitles){
      fdIDs    = Object.isString(fdIDs)    ? [fdIDs] : fdIDs;
      fdTitles = Object.isString(fdTitles) ? [fdTitles] : fdTitles;

      var wrapper= $(wrapperId);
      var fields =  [wrapper].concat(wrapper.nextSiblings());
      fields.each(function(field, idx){
        if (idx >= fdIDs.size()){ return; }
        var lbl = field.down('INPUT.formChooserLabelfield');
        var val = field.down('INPUT.formChooserfield');
        lbl.value = fdTitles[idx];
        val.value = fdIDs[idx];
        
        // Toggle upload
        JCMS.form.Widget._toggleUpload(lbl,true);
      });
    }
    return Popup.popupWindow(chooser, 'DocChooser', 640, 600,'no','yes','yes',false,false,callback);
  },
  
  _closeDateChooser: function(input){
    var calDiv   = $('calendar-container');
    if (!calDiv || !calDiv.visible()){  return false; }
    if (input && input.identify && calDiv.inputId != input.identify()){ return false; }
    
    calDiv.hide();
    return true;
  },
  
  openDataChooser: function(window, ctxPath, form, widget, pos, jspPath, width, height){ // ctxPath must not end with '/', and jspPath must start with '/'
	  var formName   = getFormName(window.document, form);
	  var widgetPos  = getFormElementPos(form,widget)+pos;
	  var chooser    = ctxPath+jspPath+"targetInput=document."+formName+".elements["+widgetPos+"].value&targetLabel=document."+formName+".elements["+(widgetPos-1)+"].value";
	  popupWindow(chooser, 'DataChooser', width, height,'no','yes','yes',false);
  },
  

  /** 
   * ----------------------------------------------------------------------------- 
   *  MANIPULATE LIST (ML)
   * -----------------------------------------------------------------------------
   */
  
  toggle: function(){ return JCMS.form.Widget._list.apply(this,['_toggle'].concat($A(arguments))); },
  add:    function(){ return JCMS.form.Widget._list.apply(this,['_add'].concat($A(arguments)));    },
  remove: function(){ return JCMS.form.Widget._list.apply(this,['_remove'].concat($A(arguments))); },
  up:     function(){ return JCMS.form.Widget._list.apply(this,['_up'].concat($A(arguments)));     },
  down:   function(){ return JCMS.form.Widget._list.apply(this,['_down'].concat($A(arguments)));   },
  reorder:function(){ return JCMS.form.Widget._list.apply(this,['_reorder'].concat($A(arguments)));},
  
  _add:  function(list, idx, current){
    
    var li1  = $(list.childElements()[idx]);
    if (!li1){ return; }
    
    /* Blur before copy
    if (current){ // blur
      JCMS.form.Widget._blur.defer(li1);
    }*/
     
    // clone
    var li2  = li1.clone(true); jQuery(li2).find('*').off().removeData(); // JCMS-3485
    Util.cleanDOMElements(li2,true,'generated'); 
    li2.removeAttribute('id');
    
    /* Remove typeahead-menu autocomplete from the clone */
    var $typeaheadMenu = jQuery(".typeahead-menu",li2);
    if ($typeaheadMenu) {
      $typeaheadMenu.remove();
    }
    
    li2.stopObserving();
    Element.removeClassName(li2,'showPrev'); /* showPrev for wysiwyg popup */
    
    var next = li1.fastNext('LI');
    if (next){
      list.insertBefore(li2,next);
    } else {
      list.appendChild(li2);
    }
    
    // tweeks
    // Should remove generated elements with a given classname
    
    // clear
    jQuery.jalios.ui.Widget.clear(li2,true);
    
    // renumber
    JCMS.form.Widget._renumber(list,true,idx+1);
    JCMS.form.Widget._retoggle(list,idx+1,current);
    
    // refresh
    if (list.className.indexOf('wdg-tab-grp') < 0){ // Do not fire for tab
      document.fire('refresh:widget' ,{ wrapper: li2.identify() });
    }
    
    if (current){ // focus
      JCMS.form.Widget._focus.defer(li2);
    }
  },
   
  _remove: function(list, idx, current) {
    // Do not remove element in the list when the list is displayed with tabs (cf. list group) 
    if(list.hasClassName('tab-content')) {
      return;
    }
    
    var li = $(list.childElements()[idx]);
    
    var siblings = li.siblings(); 
    if (siblings.length <= 0) { jQuery.jalios.ui.Widget.clear(li,true); return; }
    if (siblings.length == 1 && siblings[0].hasClassName('placeholder')) { 
      jQuery.jalios.ui.Widget.clear(li,true);
      li.hide(); jQuery.jalios.ui.Widget.clearFocusClasses(li);
      return; 
    }
    
    var pos   = idx-1;
    var prev  = li.fastPrevious('LI');
    if (!prev) {
      prev = $(li.parentNode).firstDescendant();
      pos = 0
    }

    li.remove();
    
    // renumber
    JCMS.form.Widget._renumber(list,true,pos);
    JCMS.form.Widget._retoggle(list,pos,false);
    
    if (current) { // focus defer because of IE !
      JCMS.form.Widget._focus.defer(prev);
    }
  },
 
  _focus: function(elm){
    if (!elm){ return }
    var elm = $(elm);
    var down = elm.down('INPUT,TEXTAREA,SELECT'); // TODO: fastChild() ?
    if (down){ InputUtil.focus(down); }
  },
  
  _blur: function(elm){
    if (!elm){ return }
    var elm = $(elm);
    var down = elm.down('INPUT,TEXTAREA,SELECT'); // TODO: fastChild() ?
    if (down){ InputUtil.blur(down); }
  },
  
  _up: function(list, idx, current){
    
    var delta = $(list).hasClassName('wdg-tab') ? 2 : 1;
    var children = list.childElements();
    var li1 = children[idx];
    var li2 = idx-1 < 0 ? children[children.length-delta] : children[idx-1];
   
    list.insertBefore(li1,li2);
    if (idx-1 < 0){
      list.insertBefore(li2,li1);
    }
    
    // renumber
    JCMS.form.Widget._renumber(list,true);
  },
  
  _down: function(list, idx, current){
    var delta = $(list).hasClassName('wdg-tab') ? 1 : 0;
    var children = list.childElements();
    var li1 = $(children[idx]);
    var li2 = idx+1 >= children.length-delta ? children[0] : children[idx+1];
     
    if (idx+1 >= children.length-delta){
      list.insertBefore(li1,li2);
    } else {
      list.insertBefore(li2,li1);
    }
    
    // renumber
    JCMS.form.Widget._renumber(list,true);
  },

  _toggle: function(list, idx, current){
    
    JCMS.form.Widget._renumber(list,false,idx);
    JCMS.form.Widget._retoggle(list,idx,current);
  },
  
  _reorder: function(list, idx, current, order){ 
  
    if (list._skip){
      JCMS.form.Widget._renumber(list,true);
      return; 
    } // Already done by DnD
    
    var list     = $(list);
    var children = list.childElements();
    var items    = $A();

    // Push children in order 
    order.each(function(idx){
      items.push(children[idx]);
    });

    // Remove all items
    list.childElements().each(function(elm,idx){
      list.removeChild(elm);
      if (items.indexOf(elm) < 0){
        items.push(elm);
      }
    });

    // Add back items 
    items.each(function(elm,idx){
      if (!elm){ return; } // Case (+)
      list.appendChild(elm);
    });
    
    // renumber
    JCMS.form.Widget._renumber(list,true);
  },
  
  _renumber: function(list, number, overrided){
    if (!list.hasClassName('wdg-tab-grp')){ return; }
    var tabList = $(list);
    
    var index = 0;
    var idx   = 0;
    for (var li = tabList.firstChild; li; li = li.nextSibling){
      if (li.nodeType != 1){ continue; } 
      var li = $(li);
      if (number){
        var ahref = li.fastChild('A');
        if (ahref && ahref.innerHTML*1 != idx+1) { ahref.innerHTML = idx+1; }
      }
      
      if (li.className.indexOf('selected') >= 0){ 
        index = idx;
        li.removeClassName('selected'); 
      }
      
      idx++;
    }
    
    if (overrided != undefined){
      index = overrided;
    }
    
    var tab  = tabList.fastChild('LI',false,index);
    if (tab)  tab.addClassName('selected');
    
    return index;
  },
  
  _retoggle: function(list, overrided, current){
    if (!list.hasClassName('wdg-tabpane')){ return; }
    
    var kw = JCMS.form.Widget.isInKeyword(list);
    var paneList = $(list);
    var idx = 0;
    for (var li = paneList.firstChild; li; li = li.nextSibling){
      if (li.nodeType != 1){ continue; }
      if (kw){
        $(li).removeClassName('focus-field'); // Cludge for performance
      } else if (idx++ != overrided) { $(li).hide(); }
    }
  
    if (overrided != 'undefined'){
      index = overrided;
    }
    
    // Show index
    var pane = paneList.fastChild('LI',false,index);
    if (!pane) { return;}
    
    if (kw){
      pane.addClassName('focus-field');
      return;
    }
    
    pane.show();
    if (pane.fastVisible()) {
      document.fire('tabwdg:change', { tabPage: $(pane).identify() });  // Fire Event Tab Widget
    }
  },

  _list: function(func, link, options){ 
    var link  = $(link) || $(CtxMenuManager.latestElement);
    
    var widget= JCMS.form.Widget.getWidget(link);
    if (!widget){ return false; }
    
    var li    = link.fastUp('LI',null,true,10);
    if (!li){ li =  $(link.parentNode).down('.wdg-list > LI:last-child'); } // link is sibling
    if (!li){ return; }
    
    if (li.hasClassName('placeholder')){ li = li.fastPrevious('LI'); }
    if (!li){ return; }
    
    var ul    = $(li.parentNode);
    var idx   = ul.childElements().indexOf(li);
    
    // Skip wysiwyg
    // if (widget.hasClassName('UI_EDITOR_RICHTEXT')){ return true; }
    
    // Perform on widget Group and ML 
    if (widget.hasClassName('wdg-group')){
      JCMS.form.Widget._listGroup(func, widget, idx, options);
    }
    // Perform on widget ML
    else if (widget.hasClassName('ml')){
      JCMS.form.Widget._listML(func, ul, idx, options);
    }
    // Perform on widget
    else {
      // Always perform
      var next = ul.fastNext('OL','wdg-list'); // Chercher next et down dans la bonne langue
      if (next){ // Quick and Dirty
        JCMS.form.Widget[func](next, idx, true, options);
      }
      JCMS.form.Widget[func](ul, idx, true, options);
    }
    
    return true;
  },

  _listML: function(func, list, idx, options){
    
    if (list.tagName == 'UL'){
      var lang  = list.fastNext('DIV','wdglang',true,4);
      if (!lang){ return; }
      JCMS.form.Widget[func]($(list), idx, false, options); // Do it on UL
      list = lang;
    }
  
    var lang  = list.fastUp('DIV','wdglang',true,4);
    if (!lang){ return; }
    
    $(lang.parentNode).fastEach('DIV','wdglang', function(child){
      var ol = $(child).fastChild(['OL','UL']);
      if (!ol){ return; }
      JCMS.form.Widget[func](ol, idx, ol.fastVisible(), options);
    });
  },
  
  _listGroup: function(func, widget, idx, options){
    var group  = widget.className.match(/wdggrp-(\S+)/);
    var group0 = 'DIV.'+group[0];
    var form   = widget.fastUp('FORM',null,false,20);
    
    // Caching elements
    var cache  = form.retrieve(group0);
    if (!cache){
      cache = $A([]); form.store(group0,cache);
      form.select(group0).each(function(wdg){
        var list = wdg.select(['UL.wdg-list','OL.wdg-list']); // Order ! for renumber
        cache.addAll(list);
      });
    }
    
    // Iterate on cached list
    cache.each(function(list){
      var current = list.fastVisible() && JCMS.form.Widget.getWidget(list) == widget;
      JCMS.form.Widget[func](list, idx, current, options);
    });
  },
  
  _toggleKeyword: function(event){
    var input  = $(event.memo.elmId);
    JCMS.form.Widget.toggle(input);
  }
});


// -----------------------------------------------------------------------------
//  EVENTS
// -----------------------------------------------------------------------------

Event.observe(window,   'load' ,          function(){ JCMS.form.Widget.init.defer(); });

Event.observe(document, 'jcms:focus'    , JCMS.form.Widget._initResizer);
Event.observe(document, 'jcms:focus'    , JCMS.form.Widget._initKeypress);
Event.observe(document, 'jcms:focus'    , JCMS.form.Widget._closeDateChooser);
Event.observe(document, 'jcms:focus'    , JCMS.form.Widget._toggleKeyword);
Event.observe(document, 'jcms:blur'     , JCMS.form.Widget._formatDate);
Event.observe(document, 'popup:callback', JCMS.form.Widget._popupCallback);

// -----------------------------------------------------------------------------
// Fields 
// -----------------------------------------------------------------------------

function fillOpenerField(window, form, widget, pos, id, label){
  var widgetPos  = getFormElementPos(form,widget)+pos;
  form.elements[widgetPos].value   = id;
  form.elements[widgetPos-1].value = label;
  window.close();
}

// -----------------------------------------------------------------------------
// Form Element Access 
// -----------------------------------------------------------------------------

function getFormElementPos(form, name, id){
  // Get all elements
  var elms = form.elements;
 
  // Find out the (first) current element
  
  for (var i = 0 ; i < elms.length ; i++){
    if (elms[i].name != name) {
      continue;
    }      
    if (!id) {
      return i;
    }
    
    if ((elms[i].id == id) || (elms[i].id == id+'0') || (elms[i].id && elms[i].id.startsWith(id)) ){ // very ugly
      return i;
    }
  }
  return -1;
}

function getFormElementLastPos(form, name, first, id){
  // Get all elements
  var elms = form.elements;
 
  // Find out the (last) current element
  var last = -1;
  for (var i = 0 ; i < elms.length ; i++){

    if (elms[i].name != name){
      if (last > 0 && first)
        break;
      continue;
    }
      
    if (!id){
      last = i;
      continue;
    }
      
    if (elms[i].id.indexOf(id) > -1){
      last = i;
      continue;
    }
    
    if (last > 0 && first)
      break;
  }
  return last;
}


// -----------------------------------------------------------------------------
// Form 
// -----------------------------------------------------------------------------

/**
 * form should be like: window.document.editForm
 */ 
function simpleSubmitForm(window, fullform, actions, warn, anchorValue, actionValue) {

  if (anchorValue && fullform.anchor){
  	fullform.anchor.value = anchorValue;
  }
  
  var action = actions;
  if (jQuery.isArray(actions)){
   action = actions[0];
   for (var i = 1; i < actions.length; i++){
     var input = new Element('input', {'type' : 'hidden', 'name' : actions[1], 'value' : 'true'});
     fullform.appendChild(input);
   }
  }
  
  // Update the "action" hidden input 
  var inputAction = fullform.elements['action'];

  if (action && !inputAction){
  	inputAction = new Element('input', {'type' : 'hidden', 'name' : 'action', 'value' : 'true'});
  	fullform.appendChild(inputAction);
  }
  
  if (action && inputAction){
  	inputAction.name  = action;
    
    if (actionValue)
    	inputAction.value = actionValue;
  }
  
  jQuery(fullform).submit();
}

function confirmSubmitForm(window, fullform, action, msg, warn, anchorValue, actionValue) {
  if (top.confirm(msg)) {
    simpleSubmitForm(window, fullform, action, warn, anchorValue, actionValue);
  }
}
function confirmSubmitFormLightBox(window, fullform, action, msg, warn, anchorValue, actionValue) {
  JCMS.window.Modal.confirm(msg, function(ok) {
    if (ok) {
      simpleSubmitForm(window, fullform, action, warn, anchorValue, actionValue);
    }
  });
}

function getFormName(document, form){
  if (document.all){
    if (form.attributes){
      if (form.attributes.getNamedItem){
      	return form.attributes.getNamedItem("NAME").value;
      }
      else{
      	if (form.attributes["name"])
      	  return form.attributes["name"];
      	else if (form.attributes["NAME"])
      	  return form.attributes["NAME"];
      	else
      	  return 'editForm';
      }
    }
    else{
    	return 'editForm';
    }
  }
  else{
    return form.getAttribute("NAME");
  }
}

// -----------------------------------------------------------------------------
// EditPubFooter: DEPRECATED Should be removed or replaced
// -----------------------------------------------------------------------------
	
  function restrictToNumerics(input) {
   var re = new RegExp("[^0-9]");
   var value = input.value;
   var cleaned = value.replace(re, "");
   input.value = cleaned;
  }

	function submitForm(action, anchor, actionvalue) {  
	  simpleSubmitForm(window, window.document.editForm, action,'Error',anchor, actionvalue);
	}
	function confirmSubmit(msg, action, anchor, actionvalue) {
    confirmSubmitForm(window, window.document.editForm, action, msg, anchor, actionvalue)
	}
	function submitAction(action, value) {
	  simpleSubmitForm(window, window.document.editForm, action,'Error',null, value);
	}

