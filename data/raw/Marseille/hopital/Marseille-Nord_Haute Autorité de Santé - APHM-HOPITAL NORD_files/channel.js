// TODO: Should replace all calls to is* and use those available in JcmsJsContext
var isIE = document.all?true:false;
var isNN4 = document.layers?true:false;
var isNN7 = (document.all && document.getElementById)?true:false;
var isOPERA = (navigator.userAgent.indexOf("Opera") != -1 && document.getElementById)?true:false;
var isSafari = (navigator.userAgent.indexOf("Safari") != -1);

// ---------------------------------------
// Jcms Javascript Context
// ---------------------------------------

var JcmsJsContext = {
  _contextPath : null,
  _baseUrl : null,
  _jsonRPC : null,
  
  /**
   * Returns the current context path retrieved from java.
   * Given by JcmsJspContext through "channel.js" script parameters.
   */
  getContextPath: function() { 
    if (!this._contextPath) { this._init(); }
    return this._contextPath;
  },

  /**
   * Returns the current base URL retrieved from java.
   * Retrieved through the html <base> head tag.
   */
  getBaseUrl: function() {
    if (!this._baseUrl) { this._init(); }
    return this._baseUrl;
  },
 
  /**
   * Returns the secured base URL retrieved from java.
   * Retrieved through the html <base> head tag.
   */
  getSecuredBaseUrl: function() {
    if (!this._securedBaseUrl) { this._init(); }
    return this._securedBaseUrl;
  },
  
  /**
   * Returns the JSONRpcClient instance to use for AJAX communication.
   */
	getJsonRPC: function() {
	  // Fix DEVJCMS-435: JSONRpcClient is not up to date
      // if (!this._jsonRPC) {
	    this._jsonRPC = new JSONRpcClient(JcmsJsContext.getContextPath() + "/JSON-RPC");
	  // }
	  return this._jsonRPC;
	},
	
  /**
   * Redirect the current document to the specified URL.
   * - Prefix relative URL with current base URL. 
   * - Adds CSRF prevention parameters if possible.
   */
  redirect: function(url) {
    if (url) { 
      url = (url.indexOf("http") == 0) ? url : (JcmsJsContext.getBaseUrl() + url);
      document.location = JCMS.Security.getUrlWithCSRFToken(url);
      return true;
    }
    return false;
  },
  
  //////////////////////////////////////////////////////////////////
  // Private methods
  
  _init: function() {
    // Read baseUrl from <base > tag
    
    if (!this._baseUrl) {
      JcmsJsContext._baseUrl = document.getElementsByTagName('base')[0].href;
    }

    if (!this._securedBaseUrl) {
      JcmsJsContext._securedBaseUrl = document.getElementsByTagName('base')[0].getAttribute("data-secured-href") || JcmsJsContext._baseUrl;
      JcmsLogger.debug('JcmsJsContext', JcmsJsContext._securedBaseUrl);
    }
    
    // Read contextPath from channel.js params
    if (!this._contextPath) {
      JcmsJsContext._contextPath = document._contextPath;
    }
  },
  
  _handleAjaxCreate: function(request, xhr){
    request.options.requestHeaders = request.options.requestHeaders || {};
    
    var ajaxId = document.body.id;
    if (ajaxId) {
      request.options.requestHeaders['X-Jcms-Ajax-Id'] = ajaxId; 
    }

    // Ajax-Deflate : Keep Ajax request working even after session expiration
    var ajaxCtxtDeflat = $('AjaxCtxtDeflate');
    if (ajaxCtxtDeflat && !Prototype.Browser.MobileSafari) {
      request.options.requestHeaders['X-Jcms-Ajax-Deflate'] = ajaxCtxtDeflat.innerHTML;
    }
    
    // CSRF Prevention
    var csrfTokenElm = $('CSRFTokenElm');
    if (csrfTokenElm) {
      request.options.requestHeaders[JCMS.Security.CSRF_TOKEN_HEADER_NAME] = csrfTokenElm.innerHTML;
    }
  },
  
  _205Sync: false,
  _handleAjax205: function(request, xhr){ 
    if (205 != request.transport.status || JcmsJsContext._205Sync){ return; }
    JcmsJsContext._205Sync = true;
    alert(I18N.glp('warn.json.sessiontimeout.205'));
    document.location = document.location;
  },
  
  isIE:  Prototype.Browser.IE,
  isNN4: document.layers ? true : false,
  isNN7: (document.all && document.getElementById) ? true : false,
  isOPERA: Prototype.Browser.Opera,
  isWebKit: Prototype.Browser.WebKit,
  isIE8: document.body.className.indexOf('browser-IE8') >= 0,
  isIE7: document.body.className.indexOf('browser-IE7') >= 0,
  isIE6: document.body.className.indexOf('browser-IE6') >= 0,
  isFirefox: document.body.className.indexOf('browser-Firefox') >= 0,
  
  hasFocus: true,
  handleFocusInCB:  function(event){ JcmsJsContext.handleFocus(event,true);  },
  handleFocusOutCB: function(event){ JcmsJsContext.handleFocus(event,false); },
  handleFocus:      function(event, inout){ JcmsJsContext.hasFocus = inout;  document.fire('page:focus',{ focus:inout }); }
}

// Register
Ajax.Responders.register({ 
  onCreate:   JcmsJsContext._handleAjaxCreate,
  onComplete: JcmsJsContext._handleAjax205
});


// ---------------------------------------
// Form Action Functions |||||||||||||||||
// ---------------------------------------

function getFormElementPos(form, name){

  // Get all elements
  elms = form.elements;
 
  // Find out the (first) current element
  for (var i = 0 ; i < elms.length ; i++){
    if (elms[i].name == name){
      return i;
    }
  }
  return -1;
}

function updateOptionMenu(index, tgtOptions, group){
  for (m = tgtOptions.length-1; m > 0; m--) {
    tgtOptions[m]=null
  }
  for (i = 0; i < group[index].length; i++){
    tgtOptions[i]=new Option(group[index][i].text, group[index][i].value)
  }
  tgtOptions[0].selected=true
}

function setField(field, value) {
  if (field != null) {
    field.value = value;
  }
}

function clearField(e1, e2, e3, e4) {
    if (e1 != null) {
      e1.value = "";
      if (e1.selectedIndex)
        e1.selectedIndex = 0;
    }
    if (e2 != null) {
      e2.value = "";
      if (e2.selectedIndex)
        e2.selectedIndex = 0;
    }
    if (e3 != null) {
      e3.value = "";
      if (e3.selectedIndex)
        e3.selectedIndex = 0;
    }
    if (e4 != null) {
      e4.value = "";
      if (e4.selectedIndex)
        e4.selectedIndex = 0;
    }
}

function blankField(e1, e2, e3, e4) {
    if (e1 != null) {
      e1.value = " ";
    }
    if (e2 != null) {
      e2.value = " ";
    }
    if (e3 != null) {
      e3.value = " ";
    }
    if (e4 != null) {
      e4.value = " ";
    }
}


function uncheckElement(form, i1, i2, i3) {
  if (i1 != null && i1 >= 0) {
    form.elements[i1].checked = false;
  }
  if (i2 != null && i2 >= 0) {
    form.elements[i2].checked = false;
  }
  if (i3 != null && i3 >= 0) {
    form.elements[i3].checked = false;
  }
}

function uncheckAll(form, name, checkbox) {
  if (name != null) {
    var elements = form.elements[name];
    for(i = 0; i < elements.length; i++) {
      if (elements[i] != checkbox) {
        elements[i].checked = false;
      }
    }
  }
}

function checkAll(form, name, checkbox) {
  checkAllwithId(form, name, checkbox, null, null);
}

function checkAllwithId(form, name, checkbox, id) {
  _checkAllwithId(form.elements, name, checkbox, id);
}

function checkAllwithParentId(parentId, name, checkbox, id) {
  
  var elms = $$("#"+parentId+" INPUT[type=checkbox]");
  if (elms){
    _checkAllwithId(elms.toArray(), name, checkbox, id);
  }
}

function _checkAllwithId(elms, name, checkbox, id) {
 
  // Find out the (first) current check
  for (var i = 0 ; i < elms.length ; i++){
    if (elms[i].name != name)
      continue;
    
    if (id != null && elms[i].id.indexOf(id) < 0)
      continue;
      
    checkIt = !elms[i].checked;
    break;
  }

  // Check all in the toggle state
  for (var i = 0 ; i < elms.length ; i++){
    if (elms[i].name != name)
      continue;
    if (id != null && elms[i].id.indexOf(id) < 0)
      continue;
    elms[i].checked = checkIt;
  }
  checkbox.checked = checkIt;
}


function selectAll(form, name){
 selectAllwithId(form, name,null);
}

function selectAllwithId(form, name, id) {

  // Get all elements
  elms = form.elements;
 
  // Find out the (first) current value
  for (var i = 0 ; i < elms.length ; i++){
    if (elms[i].name != name)
      continue;
    
    if (id != null && elms[i].id.indexOf(id) < 0)
      continue;
      
    selectIt = elms[i].selectedIndex;
    break;
  }

  // Check all in the toggle state
  for (var i = 0 ; i < elms.length ; i++){
    if (elms[i].name != name)
      continue;
    if (id != null && elms[i].id.indexOf(id) < 0)
      continue;
    elms[i].selectedIndex = selectIt;
  }
}

// DEPRECATED should be removed
function checkAndSubmitForm(form, field1, field2, error1, error2) {
   
  if (field1 && field1.value == ""){
    alert(error1);
    return;
  }
  
  if (field2 && field2.value == ""){
    alert(error2);
    return;
  }
  
  if (form.onsubmit)
    form.onsubmit();
  form.submit();
}

// ---------------------------------------
// Move Form Functions |||||||||||||||||||
// ---------------------------------------

// Move up/down or delete selected option of a list of select
function moveFormOption(form, pos, op, first, last) {
  array = form.elements;

  // Move Up
  if (op == "up") {
    if (pos > first) { 
      tmp = array[pos].selectedIndex;
      array[pos].selectedIndex = array[pos - 1].selectedIndex;
      array[pos - 1].selectedIndex = tmp;
    } else {
      tmp = array[first].selectedIndex;
      for(i = first; i < last; i++) {
        array[i].selectedIndex = array[i + 1].selectedIndex;
      }
      array[last].selectedIndex = tmp;
    }
  } 
  // Move Down
  else if (op == "down") {
    if (pos < last) {
      tmp = array[pos].selectedIndex;
      array[pos].selectedIndex = array[pos + 1].selectedIndex;
      array[pos + 1].selectedIndex = tmp;
    } else {
      tmp = array[last].selectedIndex;
      for(i = last; i >= first; i--) {
        array[i].selectedIndex = array[i - 1].selectedIndex;
      }
      array[first].selectedIndex = tmp;
    }
  }
  // Remove Element
  else if (op == "remove") {
    for(i = pos; i < last; i++) {
      array[i].selectedIndex = array[i + 1].selectedIndex;
    }
    array[last].selectedIndex = 0;

  }
}

// Move up/down or delete value of list of input
function moveFormElement(form, pos, op, first, last) {
  array = form.elements;

  // Move Up
  if (op == "up") {
    if (pos > first) { 
      tmp = array[pos].value;
      array[pos].value = array[pos - 1].value;
      array[pos - 1].value = tmp;
    } else {
      tmp = array[first].value;
      for(i = first; i < last; i++) {
        array[i].value = array[i + 1].value;
      }
      array[last].value = tmp;
    }
  } 
  // Move Down
  else if (op == "down") {
    if (pos < last) {
      tmp = array[pos].value;
      array[pos].value = array[pos + 1].value;
      array[pos + 1].value = tmp;
    } else {
      tmp = array[last].value;
      for(i = last; i >= first; i--) {
        array[i].value = array[i - 1].value;
      }
      array[first].value = tmp;
    }
  }
  // Remove Element
  else if (op == "remove") {
    for(i = pos; i < last; i++) {
      array[i].value = array[i + 1].value;
    }
    array[last].value = "";

  }
}

// Move up/down or delete value of list of couple of input
function move2FormElement(form, pos, op, first, last) {
  array = form.elements;

  // Move Up
  if (op == "up") {
    if (pos > (first + 1)) { 
      tmp = array[pos].value;
      array[pos].value = array[pos - 2].value;
      array[pos - 2].value = tmp;

      tmp = array[pos - 1].value;
      array[pos - 1].value = array[pos - 3].value;
      array[pos - 3].value = tmp;
    } else {
      tmp1 = array[first].value;
      tmp2 = array[first + 1].value;
      for(i = first ; i < last; i++) {
        array[i].value = array[i + 2].value;
      }
      array[last - 1].value = tmp1;
      array[last].value = tmp2;
    }
  } 
  // Move Down
  else if (op == "down") {
    if (pos < last) {
      tmp = array[pos].value;
      array[pos].value = array[pos + 2].value;
      array[pos + 2].value = tmp;

      tmp = array[pos - 1].value;
      array[pos - 1].value = array[pos + 1].value;
      array[pos + 1].value = tmp;
    } else {
      tmp1 = array[last].value;
      tmp2 = array[last - 1].value;
      for(i = last; i >= first; i--) {
        array[i].value = array[i - 2].value;
      }
      array[first + 1].value = tmp1;
      array[first].value = tmp2;
    }
  }
  // Remove Element
  else if (op == "remove") {
    for(i = pos - 1; i < last; i++) {
      array[i].value = array[i + 2].value;
    }
    array[last - 1].value = "";
    array[last].value = "";

  }
}

// ---------------------------------------
// Change URL Functions ||||||||||||||||||
// ---------------------------------------

function getUrlWithUpdatedParam(url,param,value){
  var targeturl = url.toString();
      
  re1 = new RegExp("([^\?]*\\?.*)("+param+"=[^&]*&?)(.*)","i");
  re2 = new RegExp("([^\?]*\\?)(.*)","i");
  re3 = new RegExp("([^\?]*)","i");
  
  if (targeturl.search(re1) != -1){
    if (value)
      targeturl = targeturl.replace(re1,"$1"+param+"="+value+"&$3");
    else
      targeturl = targeturl.replace(re1,"$1"+"$3");
  }
  else if (targeturl.search(re2) != -1){ 
    if (value)
      targeturl = targeturl.replace(re2,"$1"+param+"="+value+"&$2");
    else
      targeturl = targeturl.replace(re2,"$1"+"$2");
  }
  else { 
    if (value)
      targeturl = targeturl.replace(re3,"$1?"+param+"="+value);
    else
      targeturl = targeturl.replace(re3,"$1");
  }
  
  return targeturl;
}

// ---------------------------------------
// Prompt and Confirm Functions ||||||||||
// ---------------------------------------

function popupWindow(url, title, w, h, status, resizable, scrollbars, reuse, winOpener){
  Popup.popupWindow(url, title, w, h, status, resizable, scrollbars, reuse, winOpener);
}


/**
 * This function will not return until (at least)
 * the specified number of milliseconds have passed.
 * It does a busy-wait loop.
 */
function pause(numberMillis) {
    var now = new Date();
    var exitTime = now.getTime() + numberMillis;
    while (true) {
        now = new Date();
        if (now.getTime() > exitTime)
            return;
    }
}


// ---------------------------------------
// ThumbnailTag Functions ||||||||||||||||
// ---------------------------------------

'JCMS.Thumbnail'._namespace({

  /** 
   * Method used by Thumbnail tag to delay thumbnail creation using AJAX call.
   * Calls the Java static method ThumbnailTag.createThumbnailFromSessionAttribute(String)
   * which will look inside the session for the given attribute name in order to
   * create the thumbnail using the params stored in session.
   */ 
  load: function(sessionAttrName) {
    try {
      JcmsJsContext.getJsonRPC().ThumbnailTag.createThumbnailFromSessionAttribute( 
      // Anonymous callback called when the Ajax JSONRPC
      // call has been treated on the serverside
      // @param result the result returned by static method
      //        ThumbnailTag.createThumbnailFromSessionAttribute(), that is,
      //        the new thumbnail path, or null if thumbnail creation failed
  		function (result, exception) {
  		  if (exception) {
  		    //alert(exception.message);
  		    return;
  		  }
        if (result) {
  	      var img = $(sessionAttrName);
  	      if (img) {
    	      img.hide();
    	      img.src = result;
    	      img.show();
    	    }
        }
  		},
      sessionAttrName);
    } catch(ex) { }
  }

});

//---------------------------------------
//Security Functions ||||||||||||||||||||
//---------------------------------------

'JCMS.Security'._namespace({
  // See HttpUtil constants
  CSRF_TOKEN_HEADER_NAME : "X-Jcms-CSRF-Token", // For Ajax-Refresh
  CSRF_TOKEN_PARAMETER_NAME : "csrftoken", // For forms
  currentToken: null,
  
  init : function() {
	  var csrfElm = $('CSRFTokenElm'); // From doEmptyFooter.jsp
	  if (!csrfElm) {
  	  return;
	  }
    JcmsLogger.info('Channel', 'Init CSRF prevention token');
	  this.currentToken = csrfElm.innerHTML;
	  
	  // Add token to all forms
	  this._addCSRFTokenToAllForms();
	  
	  // Add token to all new forms loaded after ajax-refresh requests
    Event.observe(document, 'refresh:after', function() { JCMS.Security._addCSRFTokenToAllForms.defer(); });
  },
  
  _addCSRFTokenToAllForms: function() {
	  var formsCollection = document.getElementsByTagName("form");
	  for(var i=0;i<formsCollection.length;i++) {
		  var form = formsCollection[i];
		  // Skip RSH form
		  if (form.id === 'rshStorageForm') {
			  continue;
		  }
		  // Skip non POST form
      var formMethod = form.getAttribute("method");
		  var isPostForm = formMethod && formMethod.toUpperCase() === 'POST';
		  if (!isPostForm) {
			  continue;
		  }
      // Skip form whose action is not on current server (since JCMS-7920)
		  var formAction = form.getAttribute("action");
      var isOtherSite = formAction && formAction.match("^(https?:)?//.*$") && !formAction.startsWith(JcmsJsContext.getBaseUrl()) && !formAction.startsWith(JcmsJsContext.getSecuredBaseUrl());
      if (isOtherSite) {
        continue;
      }
		  JCMS.Security._addCSRFToken(form);
	  }
  },
  
  _addCSRFToken: function(form) {
	  if (!form) {
		  return;
	  }
	  var input = $(form).getInputs('hidden', JCMS.Security.CSRF_TOKEN_PARAMETER_NAME);
	  if (input.length > 0) {
		  return;
	  }
	  // JcmsLogger.info('Channel', 'Add CSRF token to form "' + form.name + '".');
	  input = document.createElement('input');
	  input.type = 'hidden';
	  input.name = JCMS.Security.CSRF_TOKEN_PARAMETER_NAME;
	  input.value = JCMS.Security.currentToken;
	  form.appendChild(input);
  },
  
  /**
   * Add the current CSRF token (if any) to the specified URL.
   */
  getUrlWithCSRFToken: function(url) {
    if (!JCMS.Security.currentToken) {
      return url;
    }
  
    var updatedUrl = url + ((url.indexOf('?') == -1) ? '?':'&') + JCMS.Security.CSRF_TOKEN_PARAMETER_NAME + '=' + encodeURIComponent(JCMS.Security.currentToken);
    return updatedUrl;
  }
  
});

// ---------------------------------------
// On Load Functions |||||||||||||||||||||
// ---------------------------------------


function doOnLoad(){
  
  // Delay for wysiwyg to be setup before (weird)
  //setupAllTabs();
  // popup resizing must occurs after layout (of tabs) has been done
  var popupEditionDiv = $('popupEdition');
  // A test popupEditionDiv.id == 'popupEdition' is added because of a bug in prototype
  // dollar that returns under IE 6.0 and 7.0 the element with name 'popupEdition' instead
  // of a missing element with ID 'popupEdition'  
  if (popupEditionDiv && popupEditionDiv.id == 'popupEdition') {
    Popup.autoResize(popupEditionDiv, jQuery("#edit-topbar").height() + 18*4); // add offset based on top header and something ?? but whattt
  }
  
  // Register FocusIn/FocusOut (compatible wih util.js IE6/7/FF/Chrome)
  if (JcmsJsContext.isIE) { // check for Internet Explorer
    document.onfocusin = JcmsJsContext.handleFocusInCB;
    document.onfocusout = JcmsJsContext.handleFocusOutCB;
  } else {
    window.onfocus = JcmsJsContext.handleFocusInCB;
    window.onblur = JcmsJsContext.handleFocusOutCB;
  }
}

if (document.loaded) {
  JCMS.Security.init();
} else {
  Event.observe(document, 'dom:loaded', function() {  JCMS.Security.init(); });
}

//Initialization hook up
Event.observe(window, 'load', function() {  if (window.setupAllTabs) { setupAllTabs(); } doOnLoad.defer(); });


