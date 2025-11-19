
// ----------------------------------------------------
//  Add new methods to String/Element etc...
// ----------------------------------------------------

/** 
 * Convenient method used to generate namespace 
 * for a given string/separator (http://thinkweb2.com/projects/prototype/namespacing-made-easy/))
 *
 * Usage:
 * 'foo.bar.baz.quux'._namespace({
 *   say: function(){ alert('Hello World !');) }
 * }); 
 *
 * @param separator the namespace separator (default is '.')
 * @return An object tree for the given namespace
 */
String.prototype._namespace = function(source) {
  Object.extend(this.split('.').inject(window, function(parent, child) {
    return (parent[child] = parent[child] || { });
  }), source || { });
}

String.prototype.fastStrip = function() {
  var str = this.replace(/^\s\s*/, ''),
       ws = /\s/,
       i  = str.length;
  while (ws.test(str.charAt(--i)));
  return str.slice(0, i + 1);
}
// Fix missing String.trim() for IE <= 8 
// http://blog.stevenlevithan.com/archives/faster-trim-javascript
if (typeof String.prototype.trim !== 'function') {
  String.prototype.trim = function() {
    return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
  }
}

Array.prototype.addAll = function() {
    for (var a = 0;  a < arguments.length;  a++) {
        var arr = arguments[a];
        for (var i = 0;  i < arr.length;  i++) {
            this.push(arr[i]);
        }
    }
}

Object.extend(Element, (function() {

  function _fastMatch(elm, tags, className) {
    if (tags && tags.indexOf(elm.tagName) == -1) {
      return false;
    }
    if (className && (!elm.className || elm.className.indexOf(className) < 0)) { // fast match
      return false;
    }
    
    if (className && !$(elm).hasClassName(className)){
      return false;
    }
    return elm;
  }
  
  return {
    _fastMatch: _fastMatch
  }
})());

Element.addMethods({

  /**
   * Retrieves the ID of the JCMS Data bound to this element by looking
   * in this element's classname, using syntax "ID_{dataId}".
   * @param pfx the prefix (optional default is ID_)
   */
  getJcmsId : function(element, pfx) {
    var pfx = pfx ? pfx : 'ID_';
    var len = pfx.length;
    var idClass = $w(element.className).find(function(elm){ 
      return elm.startsWith(pfx);
    });
    return idClass && idClass.substring(len);
  },
  
  /**
   * Retrieves the ID of the JCMS Data bound to this element by looking
   * in this element's classname, using syntax "ID_{dataId}".
   * @param pfx the prefix (optional default is ID_)
   */
  getJcmsIds : function(element, pfx) {
    var pfx = pfx ? pfx : 'ID_';
    var len = pfx.length;
    var ids = $w(element.className).findAll(function(str){ 
      return str.startsWith(pfx);
    }).collect(function(str){
      return str.substring(len);
    });
    return ids;
  },
  
  /**
   * Retrieves the ID of the JCMS Data bound to this element by looking
   * in this element's classname or parent elements, using syntax "ID_{dataId}".
   */
  findJcmsId: function(element){
    
    var jcmsId = element.getJcmsId();
    if (jcmsId){
      return jcmsId;
    }
    
    var parentNode = element.parentNode;
    return parentNode && $(parentNode).findJcmsId();
  },
  
  /**
   * Looks for an element matching the specified type (and optionnal classname)
   * in the DOM parent hierarchy of this element.
   *
   * @param tagName the tag type to look for, eg. 'A', 'UL', 'TABLE', ...
   * can be an array of tags e.g ['A', 'UL']
   * @param classname the classname the element must match in order to be returned
   * @param checkThis a boolean indicating whether to include this element in the search
   * @param max the maximum number of node to ride up to find a matching node, default is 100
   * @return the element matching tagName and className or undefined if no element
   *         could be found.
   */
  fastUp : function(element, tagName, className, checkThis, max) {
    var tags = (!tagName || Object.isArray(tagName)) ? tagName : [ tagName ];
    max = max || 100;
    for (var elm = checkThis ? element : element.parentNode; elm; elm = elm.parentNode) {
      if (max <= 0) { return; } max--;
      if (Element._fastMatch(elm, tags, className)){ return $(elm); }
    }
  },
  
  fastNext: function(element, tagName, className, checkThis, max) {
    var tags = (!tagName || Object.isArray(tagName)) ? tagName : [ tagName ];
    max = max || 100;
    for (var elm = checkThis ? element : element.nextSibling; elm; elm = elm.nextSibling) {
      if (elm.nodeType != 1){ continue; }
      if (max <= 0) { return; } max--;
      if (Element._fastMatch(elm, tags, className)){ return $(elm); }
    }
  },
  
  fastPrevious: function(element, tagName, className, checkThis, max) {
    var tags = (!tagName || Object.isArray(tagName)) ? tagName : [ tagName ];
    max = max || 100;
    for (var elm = checkThis ? element : element.previousSibling; elm; elm = elm.previousSibling) {
      if (elm.nodeType != 1){ continue; }
      if (max <= 0) { return; } max--;
      if (Element._fastMatch(elm, tags, className)){ return $(elm); }
    }
  },
  
  fastLastChild: function(element, tagName, className) {
    return Element.fastChild(element, tagName, className,100000);
  },
  
  fastChild: function(element, tagName, className, count) {
    var tags = (!tagName || Object.isArray(tagName)) ? tagName : [ tagName ];
    var last = false; var showLast = count == 100000; /* fastLastChild() */ 
    var count = count || 0;    
    for (var child = element.firstChild; child; child = child.nextSibling){
      if (child.nodeType != 1){ continue; }
      if (Element._fastMatch(child, tags, className)){ count--; last = child; }
      if (count < 0){ return $(child); }
    }
    if (last && showLast){ return $(last); }
  },
  
  fastSiblings: function(element, tagName, className, func){
    return Element.fastEach(element.parentNode, tagName, className, func, element);
  },
  
  fastEach: function(element, tagName, className, func, _skip) {
    var tags = (!tagName || Object.isArray(tagName)) ? tagName : [ tagName ];
    var idx = 0;
    var result = $A([]);
    for (var child = element.firstChild; child; child = child.nextSibling){
      if (child.nodeType != 1){ continue; }
      if (_skip && child == _skip){ continue; }
      if (Element._fastMatch(child, tags, className)){ 
        result.push(func($(child),++idx));
      }
    }
    return result;
  },
  
  // Inspired by JQuery. Works on all browsers
  fastVisible : function(element) {
    return element.offsetWidth > 0 || element.offsetHeight > 0;
  },
  
  fastClassMatch: function(element, regexp, group){
    var group = group || 1;
    if (!element.className){ return false; }
    var match = element.className.match(regexp);
    if (!match){ return false; }
    if (match.length <= group){ return false; }
    return match[group];
  }
});


// ----------------------------------------------------
//  AJAX COMMON JSON-OBJECT PACKAGE
// ----------------------------------------------------

/**
 * Usage:
 * -----
 * 
 * // Init Json Request
 * var jcmsRequest = new JcmsAjaxRequest();
 * 
 * // Init RPC with jcmsRequest callback
 * var funcRPC = function(){
 *   // Do stuff  
 *   jcmsRequest.asyncJsonCallBack(value);
 * 
 *   // Or call JSON method
 *   JcmsJsContext.getJsonRPC().callRPCMethod(jcmsRequest.asyncJsonCallBack(value).bind(jcmsRequest), param1, param2);
 * }
 * 
 * // Init CallBack
 * var funcCallBack = function(returnValue, returnEffect){ 
 *   // Do stuff
 * }
 * 
 * // Init Effect (Optional)
 * var functEffect = function(){
 *   // Do Stuff
 *   jcmsRequest.asyncEffectCallBack(effect);
 * }
 * 
 * jcmsRequest.rpc      = funcRPC;
 * jcmsRequest.callback = funcCallBack;
 * jcmsRequest.effect   = functEffect;
 * jcmsRequest.asyncJsonCall();
 * 
 * Note: 
 * - jcmsRequest.exception = funcException;   // Handle custom rpc exception.
 * - jcmsRequest.waitState = false;           // Do not display wait state
 * - jcmsRequest.asyncJsonCallPeriodical(10); // Periodical RPC
 * - jcmsRequest.timeout = 10000;             // Request timeout
 * - jcmsRequest.quiet = true;                // Will not display alerts on error. Default is false.
 */

JcmsAjaxRequest = Class.create();
JcmsAjaxRequest.prototype = {
  initialize: function(elm) {
    this.elm         = elm;
    this.effect      = null;
    this.exception   = null;
    this.callback    = null;
    this.rpc         = null;
    this._periodexec = null; 
    this.waitState   = true; // Display wait state
    this.timeout     = 20000;
    this.quiet       = false;
    
    this.isOk        = false;
    this.isDone      = false;
    this.isUpdate    = false;
    this.isEffect    = false;
    this.isTimeout   = false;
  },
  
  asyncJsonCall: function(){

     // Init request status
     this.isOk       = false;
     this.isDone     = false;
     this.isUpdate   = false;
     this.isEffect   = false;
     this.isTimeout  = false;
    
     // Set browser to waiting mode
     if (this.waitState){
       Ajax.setWaitState(true,this.elm);
     }
     
     try{
       // Call Effect
       if (this.effect)
         this.effect();
       else
         this.isEffect = true;
     
       // Call Timeout
       if (this._timeoutFunc){
         clearTimeout(this._timeoutFunc);
       }
       this._timeoutFunc = setTimeout(function(){  
         this.isTimeout = true;
         this._asyncResponseCallBack();
       }.bind(this),this.timeout);
     
       // Call Json
       if (this.rpc)
         this.rpc();
     }
     catch(ex){
       this._handleException(ex);
    }
  },
  
  asyncJsonCallPeriodical: function(frequency){
    // Todo: Should check if PeriodicalExecuter is running twice ?
    var func = function(){
      if (this.isDone)
        return;
      
      if (JcmsJsContext && !JcmsJsContext.hasFocus)
        return;
      
      this.asyncJsonCall.bind(this).defer();
    };
    
    this._periodexec = new PeriodicalExecuter(func.bind(this), frequency);
  },
    
  stopPeriodical: function(){
    if (this._periodexec){
      this._periodexec.stop();
    }
    this.dispose();
  },
  
  /**
   * Must be Called by given function JSON
   * @param value the return value
   */
  asyncJsonCallBack: function(value, exception){
    if (value){ 
      this.returnValue = value;
    }
    else{
      this.isOk = true;
    }

    // Handle server exception
    if (exception){
      this.returnException = exception;
    }
    
    // Response is done
    this.isDone = true;
    
    // Call response callback
    this._asyncResponseCallBack();
    
    if (this._periodexec){
      // Reset response for PeriodicalUpdater
      this.isDone = false;
    }
  },
  
  /**
   * Must be Called by given function Effect
   * @param effect the running effect
   */
  asyncEffectCallBack: function(effect){
    // Effect is finished
    this.isEffect      = true;
    this.workingEffect = effect;
    
    // Call response callback
    this._asyncResponseCallBack();
  },
  
  /**
   * Called by both Effect or JSON to do the
   * real callbaack
   */
  _asyncResponseCallBack: function(){
    
    // Handle Timeout
    if (this.isTimeout){
      if (!this._timeoutFunc){
        return;
      }

      this._handleException();
      return;
    }
    
    
    if (!this.isDone)
      return;
      
    if (this.isUpdate)
      return;
      
    if (!this.isEffect)
      return;
      
    // Handle Exception
    if (this.returnException){
      JcmsLogger.error('JcmsAjaxRequest', this.returnException.message, ' Error: ['+this.returnException.code+']', 
                                          this.returnException.name , '\n'+this.returnException.javaStack);
      this._handleException();
      return;
    }
      
      
    if (this._timeoutFunc)
      clearTimeout(this._timeoutFunc);  
      
    this.isUpdate = true;
    
    // Call callback
    try {
      if (this.callback){
        this.callback(this.returnValue, this.workingEffect);
      }
    }
    catch (ex){ 
      /* Trap CallBack error to clean jcmsRequest */ 
      JcmsLogger.error('JcmsAjaxRequest',ex);
    }
    
    this._disposeResponse();
  },
  
  _disposeResponse: function(){
    // Remove browser from waiting mode
    if (this.waitState){
      Ajax.setWaitState(false,this.elm);
    }
    
    // Clean stuff
    if (!this._periodexec){
      this.dispose();
    }
  },
  
  _handleException: function(ex){
    if (!this.quiet){
      alert(I18N.glp('warn.json.sessiontimeout'));
      
      var params = '';
      Object.keys(ex).each(function(key) {
        params += key +': '+ ex[key]+'; ';
      });
      JcmsLogger.warn('JcmsAjaxRequest',params);
    }
    if (this.exception){
      this.exception(this.returnException);
    }
    this._disposeResponse();
  },
  
  /**
   * Clean pointer to reduce memory leaks
   * and helps Garbage Collector
   */
  dispose: function(){
    this.elm         = null;
    this.effect      = null;
    this.exception   = null;
    this.callback    = null;
    this.rpc         = null;
    this._timeoutFunc= null;
    this._periodexec = null; 
    this.timeout     = 20000;
    this.quiet       = false;
  }
};

JcmsJsonRequest = Class.create();
Object.extend(JcmsJsonRequest.prototype, JcmsAjaxRequest.prototype);


// ----------------------------------------------------
//  AJAX COMMON PACKAGE
// ----------------------------------------------------

if (!window.Ajax) {
  var Ajax = new Object();
}

Object.extend(Ajax,{
    // ----------------------------
    //  Common usefull AJAX Method
    // ----------------------------
    
    setWaitState: function(wait, elm){
     jQuery.jalios.Ajax.wait(wait, elm);
    },
    
    /**
     * Convenient method building a JcmsAjaxRequest to call a given url
     * @param uri the url to call (or url with params that will be splited)
     * @param params the url parameters
     * @param callback the callback to call at the end of the request
     */
    performAjaxRequest: function(uri, params, callback){
      
      var url    = uri;
      var pos    = url.indexOf('?');
      
      if (pos >= 0){
        uri  = url.substr(0,pos);
        params = url.substr(pos+1);
      }
      
      // Init Json Request
      var jcmsRequest = new JcmsAjaxRequest();
      
      // Init RPC with jcmsRequest callback
      var funcRPC = function(){
        new Ajax.Request(uri, {
          parameters:  params,
          onComplete:  jcmsRequest.asyncJsonCallBack.bind(jcmsRequest),
          onException: jcmsRequest._handleException.bind(jcmsRequest),
          onFailure:   jcmsRequest._handleException.bind(jcmsRequest)
        });
      }
      
      // Init CallBack
      var funcCallBack = callback || function(returnValue, returnEffect){  /* nothing */  }
  
      jcmsRequest.rpc      = funcRPC;
      jcmsRequest.callback = funcCallBack;
      jcmsRequest.asyncJsonCall();
    },
    
  _styleSheetsAdded : $H(),
  _javaScriptsAdded : $H(),

  /**
   * Load a StyleSheet file from its relative path.
   * @param path the CSS path (absolute or relative)
   * @param media an optionnal media for this CSS (default to all)
   * @param version an optionnal version of this file, as defined through JCMS property channel.packer.version
   */
  loadStyleSheet : function (path, media, version) {
    var media = media ? media : 'all';
    if (Ajax._styleSheetsAdded.get(path) === true) {
      JcmsLogger.debug('Ajax', 'StyleSheet already imported: ', path);
      return;
    }
    JcmsLogger.info('Ajax', 'Import StyleSheet', path, version);
    Ajax.markStyleSheetLoaded(path);
    
    var headID = document.getElementsByTagName("head")[0];         
    var cssNode = document.createElement('link');
    cssNode.type = 'text/css';
    cssNode.rel = 'stylesheet';
    cssNode.media = media;
    cssNode.href = path + (version ? ('?v=' + version) : '');
    headID.appendChild(cssNode);
    
    if (Prototype.Browser.IE) {
      var deferedFunc = function() {
        $(document.body).toggleClassName("fixIERenderingBugOnDynamicCssLoad");
      };
      deferedFunc.defer();
    }
  },
  
  /**
   * Indicates that the specified StyleSheet file has been loaded.
   */  
  markStyleSheetLoaded : function (path) {
    JcmsLogger.debug('Ajax', 'Mark StyleSheet loaded: ', path);
    Ajax._styleSheetsAdded.set(path, true);
  },
  
  /**
   * Indicates that the specified StyleSheets files have been loaded.
   */  
  markStyleSheetsLoaded : function () {
    $A(arguments).each(function(path) { Ajax.markStyleSheetLoaded(path); } );
  },
  
  /**
   * Load a javascript file from its relative path.
   * @param path the JavaScript file path (absolute or relative)
   * @param version an optionnal version of this file, as defined through JCMS property channel.packer.version
   */
  loadJavaScript : function (path, version) {
    if (Ajax._javaScriptsAdded.get(path) === true) {
      JcmsLogger.debug('Ajax', 'JavaScript already imported: ', path);
      return;
    }
    JcmsLogger.info('Ajax', 'Import JavaScript', path, version);
    Ajax.markJavaScriptLoaded(path);
    
    var headID = document.getElementsByTagName("head")[0];
    var newScript = document.createElement('script');
    newScript.type = 'text/javascript';
    newScript.src = path + (version ? ('?v=' + version) : '');
    headID.appendChild(newScript);
  },
  
  /**
   * Indicates that the specified JavaScript file has been loaded.
   */  
  markJavaScriptLoaded : function (path) {
    JcmsLogger.debug('Ajax', 'Mark JavaScript loaded: ', path);
    Ajax._javaScriptsAdded.set(path, true);
  },
  
  /**
   * Indicates that the specified JavaScript files have been loaded.
   */  
  markJavaScriptsLoaded : function () {
    $A(arguments).each(function(path) { Ajax.markJavaScriptLoaded(path); } );
  }
  
});

/**
 * Register AJAX Responder to handle Prototype AJAX Error Requests
 */
Ajax.Responders.register({
  onException: function(transport, ex) {
    alert(I18N.glp('warn.json.sessiontimeout'));
  }
});


// ----------------------------------------------------
//  INPUT UTIL
// ----------------------------------------------------

if (!window.InputUtil) {
  var InputUtil = new Object();
}

Object.extend(InputUtil,{
  
  /**
   * Focus the given Input and set the caret at the end of 
   * the input text (to be compliant between IE and FF)
   * @param input the input
   */
  focus: function(input){
    if (input.type && input.type.toLowerCase() == 'file')
      return;
    
    if (input.focus){
      try { input.focus(); } catch(e){}
    }
    
    if (input.value){
      input.value = input.value;
    }
  },
  
  blur: function(input){
    if (input.type && input.type.toLowerCase() == 'file')
      return;
    
    if (input.blur){
      try { input.blur(); } catch(e){}
    }
  },
  
  getMeasurer: function(textarea){
    
    // Create  Measurer
    var measurer = $('tx-measurer');
    if (!measurer){
      measurer = new Element('div', {'id': 'tx-measurer'});
      InputUtil._measurer = measurer;
    }
    
    // Setup Measurer
    textarea.parentNode.appendChild(measurer);
    measurer.style.width      = textarea.getWidth()  + 'px';
    measurer.style.height     = textarea.getHeight() + 'px';
    measurer.style.overflow   = 'auto';
    measurer.style.whiteSpace = 'normal';
    measurer.style.position   = 'absolute';
    
    var styles = Util.getCSS(textarea,['font-family','font-size','margin','padding']);

    measurer.setStyle({
      'visibility': 'hidden',
      'fontFamily': styles['fontFamily'],
      'fontSize':   styles['fontSize'],
      'margin':      styles['margin'],
      'padding':     styles['padding']
    });
    
    measurer.style.marginTop    = '-' + (textarea.getHeight()+24) + 'px';
    measurer.style.marginBottom = '24px';
    
    return $(InputUtil._measurer);
  },
  
  htmlEncode: function ( str ) {
    return document.createElement( 'a' ).appendChild( document.createTextNode( str ) ).parentNode.innerHTML;
  }, 
  
  getCharacterCoords: function(textarea, offset){
    var measurer  = InputUtil.getMeasurer(textarea);
    var value     = InputUtil.htmlEncode(textarea.value);
    var html      = value.substring(0,offset)+'<i>|</i>';
    
    html = (html || '').replace(/\r\n/g, '\n').replace(/\n\r/g, '\n').split('\n').join("<br />");
    measurer.innerHTML = html;
    
    var beacon = measurer.down('I');
    var position = beacon.positionedOffset();
    return { left: position.left - (textarea.scrollLeft||0), top:  position.top - (textarea.scrollTop||0)}
  },
  
  
  /**
   * Return an object reprensenting a cross-browser selection
   * @param input the working input
   * @param trim indicate to trim or not selection
   */
  getSelection: function(input, trim){
    var inputSelection = new Object();
    inputSelection.input = input;
    // Gecko browser
    if (input.setSelectionRange) {
      inputSelection.start      = input.selectionStart;
      inputSelection.end        = input.selectionEnd;
      inputSelection.value      = input.value.substring(input.selectionStart, input.selectionEnd);
      inputSelection.gecko      = true;
      inputSelection.scrolltop  = input.scrollTop;
      inputSelection.scrollleft = input.scrollLeft;
    }
    // Internet Explorer
    else if (input.createTextRange) {
      if (! input.ownerDocument) { input.ownerDocument = document; }
      var selection = input.ownerDocument.selection.createRange();
      
      if ( selection.parentElement().tagName!="TEXTAREA" ) {
        inputSelection.start = 0;
        inputSelection.end = 0;
      }
      // Insert a text to find caret position
      else if (selection.text.length == 0) {
        
        var backup = input.value;
        var bookmark = "~JCMSwiki~";
        selection.text = bookmark ;
        
        
        var value = input.value;
        var index = value.indexOf(bookmark);
        input.value = backup ;
        
        var lines   = value.substr(0,index).replace(/\r\n/g, '\n').replace(/\n\r/g, '\n').split('\n').length-1;
      
        inputSelection.value = "";
        InputUtil._setSelection(inputSelection,index,index);
        inputSelection.start = index;
        inputSelection.end   = index;
      } 
      // Check selected text
      else {
        var bookmark       = selection.getBookmark();
        var range          = input.createTextRange();
        var selectionRange = input.createTextRange();
        var fulltext       = range.text;
          
        // Select and retrieve selected text
        selectionRange.moveToBookmark(bookmark);
        var text           = selectionRange.text;
          
        // Retrieve text before selection
        range.setEndPoint('EndToStart', selectionRange);
        var start          = range.text.length;
        
        // Find the real location of text
        var index          = fulltext.indexOf(text,start);
         
        // Find the end location of text
        var end            = index + text.length;
          
        // Count \n in text before index
        var startLines     = fulltext.substring(0,index).replace(/\r\n/g, '\n').replace(/\n\r/g, '\n').split('\n').length-1;
         
        // Count \n in text before ends of selection
        var endLines       = startLines + text.replace(/\r\n/g, '\n').replace(/\n\r/g, '\n').split('\n').length - 1;
          
        // Update start and end postion
        start  = index;
        end    = end;
        
        // Backup selection
        inputSelection.start = start;
        inputSelection.end   = end;
        inputSelection.value = selectionRange.text;
        
        // Reset selection
        InputUtil._setSelection(inputSelection, start, end);
      }
    }
    // Logger
    if (JcmsLogger.isDebug && JcmsLogger.InputUtil){
      JcmsLogger.debug('InputUtil',"getSelection: "+inputSelection.start+","+inputSelection.end+": "+inputSelection.value+"("+inputSelection.scrolltop+","+inputSelection.scrollleft+")");
    }
    return trim ? InputUtil._trimSelection(inputSelection) : inputSelection;
  },
  
  /**
   * Replace the current selection by the given string.
   * If called by internal method the third parameter is selection (avoid to compute twice)
   * @param input the working input
   * @param replace the text to replace
   * @param trim indicate to trim or not selection
   * @param selection the object return by getSelection() set by internal method call
   */
  replaceSelection: function(input, replace, trim, selection, delta){
    input.focus();
    delta = (delta == undefined) ? 0 : delta; 
    var selection  = selection || InputUtil.getSelection(input,trim);
    var inputValue = input.value;
    if (selection.gecko){
      input.value = inputValue.substring(0, selection.start+delta) + replace + inputValue.substring(selection.end);
      var len = selection.value ? selection.value.length : 0;
      InputUtil._setSelection(selection, selection.start+delta, selection.end + (replace.length + delta - len));
    }
    else {
      var range     = input.ownerDocument.selection.createRange();
      var isCollapsed = (range.text.length == 0);
      
      range.moveStart('character', delta);
      range.text = replace;
      range.moveStart('character', -replace.length + delta);
      range.moveEnd('character', delta);
      range.select();
    }
  },
  
  /**
   * Check the current selection if it match "match" then
   * replace it by "replace" otherwise replace it by "backward"
   * @param input the working input
   * @param match a regular expression to check
   * @param backward the txt to replace if regexp doesn't match (work on .+)
   * @param replace the txt to replace if regexp match
   * @param trim  true to trim selection
   * @param caret true to work even if there is no selection (use backward without $1)
   * @param selection the object return by getSelection() set by internal method call
   */
  replaceRegexp: function(input, match, replace, backward, trim, caret, selection){
    
    var selection  = selection || InputUtil.getSelection(input,trim);
    
    
    var selectText = selection.value;
    if (!selectText && !caret) return;
    
    var replaceText = selectText;
    if (!selectText){
      replaceText = backward.replace(/\$1/g,'');
    }
    else if (selectText.match(match)){ 
      replaceText = selectText.replace(match,replace);
    }
    else {
      replaceText = selectText.replace(/\s*([\S ]+)(\s*)/g,backward+"$2");
    }
    
    if (replaceText == selectText) return;
    InputUtil.replaceSelection(input, replaceText, trim, selection);
  },
  
  /**
   * Selects the selection from start to end
   * @param selection the object return by getSelection() set by internal method call
   * @param start the new selection start point
   * @param end the new selection end point
   */
  _setSelection: function(selection, start, end){
    
    selection.input.focus();
    
    if (selection.gecko){
      // Fix Scrollbar
      if (selection.scrollleft){
        selection.input.scrollLeft = selection.scrollleft;
      }
      if (selection.scrolltop){
        selection.input.scrollTop = selection.scrolltop;
      }
      else {// Fake event 'esc' key to set scroll
        Element.fire(selection.input,'keypress'); /* Fix for Chrome */
      }
      
      //Set the cursor to the end of what has been replaced
      selection.input.setSelectionRange(end, end);
    }
    else if (selection.input.createTextRange){
      var range   = selection.input.createTextRange();
      var text    = selection.input.value;
      
      var lines1 = text.substring(0,start).replace(/\r\n/g, '\n').replace(/\n\r/g, '\n').split('\n').length-1;
      var lines2 = text.substring(start,end).replace(/\r\n/g, '\n').replace(/\n\r/g, '\n').split('\n').length-1;
      
      range.move('character', start-lines1);
      range.moveEnd('character', end-start);
      range.select();
    }
    
    selection.value = selection.input.value.substring(start, end);
    selection.start = start;
    selection.end   = end;
  },
  
  /**
   * Trims white space in selection 
   * and adjsute to new size 
   * @param selection the object return by getSelection() set by internal method call
   */
  _trimSelection: function(selection){
    if (selection.start >= selection.end || !selection.value){
      return selection;
    }
    // Trim spaces
    var start = 0;
    var end   = 0;
    while (selection.value.charAt(start) == " ") { start++; }
    while (selection.value.charAt(selection.value.length-end-1) == " ") { end++; }
    
    if ((start ==0) && (end ==0)){
      return selection;
    }
    
    // Adjuste new selection area
    InputUtil._setSelection(selection, selection.start+start, selection.end-end);
    return selection;
  }
});


// ----------------------------------------------------
//  STYLESHEET UTIL
// ----------------------------------------------------

/** 
 * Notes:
 * - Do not put @import
 * - Do not put expr, expr, expr{}
 */

'JCMS.util.StyleSheet'._namespace({

  _ss : false,
  
  _getStyleSheet: function(){
    var ss = JCMS.util.StyleSheet._ss;
    if (ss){ return ss; }
    
    if (document.createStyleSheet){ // IE
      JCMS.util.StyleSheet._ss = document.createStyleSheet();
    } 
    else {
      var head  = document.getElementsByTagName('head')[0];
      var style = document.createElement('style');
      style.type = 'text/css';
      head.appendChild(style);
      JCMS.util.StyleSheet._ss = style.sheet;
    }
    return JCMS.util.StyleSheet._ss;
  },

  _addRule: function(expr, rule){
    var ss = JCMS.util.StyleSheet._getStyleSheet();
  
    if (ss.addRule){ // IE
      ss.addRule(expr, rule);
    } else { 
      ss.insertRule(expr + '{' +  rule  + '}',ss.cssRules.length);
    }
  },
  
  putRule: function(expr, rule){
  
    var ss    = JCMS.util.StyleSheet._getStyleSheet();
    var rules = $A(ss.rules || ss.cssRules);
    var match = rules.find(function(ru, idx){
      if (ru.selectorText != expr){ return false; }
      
      // Remove
      if (!rule){
        if (ss.deleteRule) { ss.deleteRule(idx); }
        else { ss.removeRule(idx); }
        return true;
      }
      
      // IE
      if (ru.style.cssText){ ru.style.cssText = rule; } 
      
      // CSS2
      else { ru.cssText = rule; }
      
      return true;
    });
    
    if (!match && rule){
      JCMS.util.StyleSheet._addRule(expr, rule);
    }
  },
  
  removeRule: function(expr){
    JCMS.util.StyleSheet.putRule(expr, false);
  }
});


// ----------------------------------------------------
//  FORM UTIL
// ----------------------------------------------------

if (!window.FormUtil) {
  var FormUtil = new Object();
}

Object.extend(FormUtil,{

  /** 
   * disable or enable all the input of the given array, by finding them in the
   * given form name according to the boolean
   */
  toggleInputs: function(formName, inputsArray, enable) {
    $A(inputsArray).each(function(str, idx) {
      Form.getInputs(formName, false, str).each(function(element) {
        element.disabled = !enable;
      });
    });
  },
  
  /**
   * Sets some values of text input in the given form, 
   * using a map of key/value (key being the input name, value
   * the new value for the input)
   */ 
  setInputValues: function(formName, inputToValueMap) {
    Form.getInputs(formName, 'text', false).each(function(element) {
      var newValue = inputToValueMap[element.name];
      if (newValue != undefined) {
        element.value = newValue;
      }
    });
  },
  
  /** 
   * Cause maxLength is not available on textarea, emule the behaviour
   */
  imposeMaxLength: function(element, maxLength) {
    if (element.value.length < maxLength) {
      return true;
    } else if (element.value.length > maxLength) {
      element.value = '';
      return false; 
    } else {
      element.value = element.value.substr(0, maxLength-1); 
      return false;
    }
  },
  
  /**
   * Convenient lazy refactoring of widget.js : simpleSubmitForm()
   * - Submit() and onSubmit() a given form
   * - Retrieve Form from INPUT or Links
   * - Create/Update INPUT named 'action' to simulate click
   * 
   * TODO: Add support to anchor
   * TODO: Add support to confirm / modal
   * 
   * @param elm a FORM, INPUT or HTMLElement
   * @return true if the real submit has been performed (false for ajax-refresh)
   */
  submit: function(elm){
    var elm   = $(elm);
    var form  = false;
    var value = false; 
    
    // Trigger Ajax-Refresh
    if (elm.hasClassName('ajax-refresh')){ // Should we simulate jcms:click ?
      JCMS.ajax.Refresh.refreshFromElement(elm);
      return false;
    }
    
    // Find FORM DOM Element
    if (elm.tagName == 'FORM'){
      form = elm;
    } else if (elm.form) {
      form  = $(elm.form);
      if (elm.type == 'submit'){
        value = ''+elm.value;
      }
    } else {
      form = elm.fastUp('FORM');
      if (!form){ return false; }
    }
    
    // Setup INPUT Hidden Action
    if (!value.blank()){
      var action = form.elements['action'];
      if (action){
        $(action).name = value;
      } else {
        var action = $(document.createElement('INPUT'));
        action.name  = value;
        action.value = 'true';
        action.type  = 'hidden';
        form.appendChild(action);
      }
    }
    
    // Trigger onSubmit()
    if (form.onsubmit){
      form.onsubmit();
    }
    
    // Trigger submit()
    form.submit();
    return true;
  },
  
  clearFields: function(event){ 
    var elm = Event.element(event);
    if (!elm){ return; }
    elm.previousSiblings ().findAll(function(item){ return item.clear; }).invoke('clear');
  },
  
  getCheckedValues: function(formName , widgetName){
    var form   = $(document.forms[formName]);
	if( ! form ){
		return null
	}
    var inputs = form.getInputs('checkbox', widgetName).concat(form.getInputs('radio', widgetName));
        inputs = inputs.findAll(function(elm) { return elm.checked; });
         
    return inputs.pluck('value').compact();
  },
  
  /**
   * Extract from http://xavisys.com/using-prototype-javascript-to-get-the-value-of-a-radio-group/
  * Returns the value of the selected radio button in the radio group, null if
  * none are selected, and false if the button group doesn't exist
  *
  * @param {radio Object} or {radio id} el
  * OR
  * @param {form Object} or {form id} el
  * @param {radio group name} radioGroup
  */
  getRadioValue : function (el, radioGroup) {
      if($(el).type && $(el).type.toLowerCase() == 'radio') {
          var radioGroup = $(el).name;
          var el = $(el).form;
      } else if ($(el).tagName.toLowerCase() != 'form') {
          return false;
      }
      var checked = $(el).getInputs('radio', radioGroup).find(
          function(re) {return re.checked;}
      );
      return (checked) ? $F(checked) : null;
  },
  /**
   *  extract from http://www.beyondstandards.com/archives/input-placeholders/
   *  
   *  manage placeholder before HTML 5
   */
  activatePlaceholders:function() {
	  var detect = navigator.userAgent.toLowerCase(); 
	  if (detect.indexOf("safari") > 0){
		  return false;
	  }
	  var inputs = document.getElementsByTagName("input");
	  for (var i=0;i<inputs.length;i++) {
		  FormUtil.activatePlaceholderWithoutBrowserCheck(inputs[i]);
	  }
  },
  /**
   *  extract from http://www.beyondstandards.com/archives/input-placeholders/
   *  
   *  mange placeholder before HTML 5
   */
  activatePlaceholder:function(inputElement) {
	  var detect = navigator.userAgent.toLowerCase(); 
	  if (detect.indexOf("safari") > 0){ 
		  return false;
	  }
	  FormUtil.activatePlaceholderWithoutBrowserCheck(inputElement);
  },
  /**
   *  extract from http://www.beyondstandards.com/archives/input-placeholders/
   *  
   *  manage placeholder before HTML 5
   */
  activatePlaceholderWithoutBrowserCheck :function(inputElement) {
	inputElement= $(inputElement);
    if (inputElement.readAttribute("type") == "text") {
     if (inputElement.readAttribute("placeholder") && inputElement.readAttribute("placeholder").length > 0) {
    	 if(inputElement.value == ""){
    		 inputElement.value = inputElement.readAttribute("placeholder");
    	 }
    	 inputElement.onclick = function() {
    		 if (this.value == this.readAttribute("placeholder")) {
    			 this.value = "";
    			 this.removeClassName("inactivePlaceHolder");
    		 }
    		 return false;
    	 }
      inputElement.onblur = function() {
       if (this.value.length < 1) {
        this.value = this.readAttribute("placeholder");
        this.addClassName("inactivePlaceHolder");
       }
      }
     }
    }
  },
  
  /**
   * retrieve a boolean value from a boolean widget
   * @param form the form
   * @param widgetName the name of the widget
   */
  retrieveBooleanValue : function(form, widgetName) {
	var nodeList = $(form).getInputs(null,widgetName);
	var tmpArray = $A(nodeList);
	for ( var index = 0; index < tmpArray.length; ++index) {
	  var item = tmpArray[index];
	  if (item.checked == true) {
		return item.value;
	  }
	}
	return false;
  }
  
});

// ----------------------------------------------------
//  UTIL OBJECT
// ----------------------------------------------------

// Util 'static Class'
if (!window.Util) {
  var Util = new Object();
}

Object.extend(Util,{
  
  /**
   * Check if the current window is in an iframe or not.
   */
  isInIFrame: function() {
    jQuery.jalios.DOM.isInIFrame();
  },
  
  /**
   * Fix IE rendering bug
   * Warning slow IE6 ! Use instead CSS (position: relative; zoom:1)
   */
  shakeIE: function(){
    if (Prototype.Browser.IE) {
      $(document.body).toggleClassName("fixIERenderingBug");
      JcmsLogger.debug('ShakeIE','Warning slow IE6 ! Use instead CSS (position: relative; zoom:1)');
    }
  },
  
  isIE78: function(){
    var body = $(document.body);
    if (!body) return false;
    
    if (body.hasClassName('browser-IE7')) return true;
    if (body.hasClassName('browser-IE8')) return true;
    
    return false;
  },
  
  /**
   * Remove all child nodes under the given element.
   * Current implementation call: removeChild() recursively.
   * 
   * @param elm the root element to work with
   * @param deep should this method called recursively
   * @param filter String optional classname of element branch to remove
   */
  cleanDOMElements: function(elm, deep, filter,_status){
    var removed = $A([]);
    for (var child = elm.firstChild; child; child = child.nextSibling){
      if (child.nodeType != 1){ continue; }
      
      var remove = _status || !filter || child.className.indexOf(filter) >= 0;
      if (deep){ Util.cleanDOMElements(child,deep,filter, remove); }
      
      var child = $(child);
      child.removeAttribute('id');
      child.stopObserving();
      
      if (remove){ 
        child.removeAttribute('onclick');
        removed.push(child);
      }
    }
    removed.each(function(child, idx){ elm.removeChild(child); });
  },
  
  /**
   * Convenient wrapper that returns true if it is a left click (or IE)
   * @param event Mouse Event
   */
  isLeftClick: function(event){
    return JcmsJsContext.isIE || Event.isLeftClick(event);
  },
  
  /**
   * This is much faster than using (el.innerHTML = str) when there are many
   * existing descendants, because in some browsers, innerHTML spends much longer
   * removing existing elements than it does creating new ones.
   * http://ajaxian.com/archives/replacehtml-for-when-innerhtml-dogs-you-down
   */
  replaceHtml : function(el, html) {
    var oldEl = (typeof el === "string" ? document.getElementById(el) : el);
    var newEl = document.createElement(oldEl.nodeName);

    // Preserve the element's id and class (other properties are lost)
    newEl.id = oldEl.id;
    newEl.className = oldEl.className;
    // Replace the old with the new
    newEl.innerHTML = html;
    oldEl.parentNode.replaceChild(newEl, oldEl);
    /* Since we just removed the old element from the DOM, return a reference
    to the new element, which can be used to restore variable references. */
    return newEl;
  },
  

  /**
   * Retrieves "position" and "dimension" of the given window's
   * viewport (or the current window if no window argument is given).
   * 
   * returns an object containing the following value :
   *   obj.x      = viewport X position in the screen
   *   obj.y      = viewport Y position in the screen
   *   obj.width  = viewport width
   *   obj.height = viewport height
   * 
   * Warning: the position returned in internet explorer is the position
   * of the window not the viewport (i.e. the viewport position being the
   * position of the window + title and toolbars offset)
   * 
   * cf. http://www.quirksmode.org/viewport/compatibility.html
   */
  getViewportBounds: function(win) {
    var vpWidth = 0; 
    var vpHeight = 0;
    var vpXposInScreen = 0;
    var vpYposInScreen = 0;
    
    if (!win) {
      win = self;
    }
    var doc = win.document;
    
    // 1. Viewport Position

    // all but mozilla
    if (win.screenTop){
      vpXposInScreen = win.screenLeft;
      vpYposInScreen = win.screenTop;
    }
    // mozilla
    else if (win.screenX){
      vpXposInScreen = win.screenX;
      vpYposInScreen = win.screenY;
    }
    
    // 2. Viewport Dimension
    
    //   all except Explorer
    if (win.innerHeight) {
      vpWidth = win.innerWidth;
      vpHeight = win.innerHeight;
    }
    //   Explorer 6 Strict Mode
    else if (doc.documentElement && win.document.documentElement.clientHeight) {
      vpWidth = doc.documentElement.clientWidth;
      vpHeight = doc.documentElement.clientHeight;
    }
    //   other Explorers
    else if (document.body) {
      vpWidth = doc.body.clientWidth;
      vpHeight = doc.body.clientHeight;
    }
    
    return { x: vpXposInScreen,
             y: vpYposInScreen,
             width: vpWidth,
             height: vpHeight };
  },
  
  /**
   * Observe event (click) on document then call callback. This method delegate on Prototype EventObserver.
   * The callback MUST be bindAsEventListener.
   *
   * @param eventName the Event name
   * @param callback the function MUST be bindAsEventListener
   */
  observeDocument: function(eventName, callback){
    if (Prototype.Browser.IE || Prototype.Browser.Chrome){
      Event.observe(document, eventName , callback); // InternetExplorer or Google Chrome
    } else {
      Event.observe(window,   eventName , callback); // FireFox
    }
  },

  observeFocus: function(focusInHandler, focusOutHandler){
    if (document.addEventListener){
      document.addEventListener("focus", focusInHandler, true);
      document.addEventListener("blur", focusOutHandler, true);
    } else {
      document.observe("focusin", focusInHandler);
      document.observe("focusout", focusOutHandler);
    }
  },

  _classToCallBack : $H(), // classname => function
  _tagToCallBack   : $H(), // tagname   => function
  _focusToCallBack : $H(), // classname   => function
  
  _onLoadCB: function() {
    var method = Util._onClickCB.bindAsEventListener(this);
    Util.observeDocument('click', method);
    Util.observeDocument('jcms:click', method);
    
    var methodfIn  = Util._onFocusCB.bindAsEventListener(this,'focus:in');
    var methodfOut = Util._onFocusCB.bindAsEventListener(this,'focus:out');
    Util.observeFocus(methodfIn, methodfOut);
  },
  
   _onFocusCB: function(event, eventName) {
     var elm = Event.element(event);
     if (!elm || !elm.fastUp) { return; }
     
     var elm = elm.fastUp(['INPUT', 'TEXTAREA', 'SELECT'], null, true, 2);
     if (!elm) { return; }
     
     if (elm.type && elm.type == 'hidden') { return; }
     
     // Call Init
     if(!elm._init){
       elm._init = true;
       document.fire('jcms:init-focus', { elmId: elm.identify() });
     }
     
     // Call CallBack bind to each classname
     var classNames = $w(elm.className);
     classNames.each(function(className,idx) {
       var cb = Util._focusToCallBack.get(className);
       if (Object.isFunction(cb)) {
         cb(event, elm, className, eventName);
       }
     }.bind(this));
   },
  
  _onClickCB: function(event) {
    if (!(event.eventName === 'jcms:click' || Util.isLeftClick(event))){
      return;
    }
    var elm = Event.element(event);
    if (!elm || !elm.fastUp) { return; }
    
    // Check images
    if (elm.tagName == 'IMG'){
      if (Util._onClickDispatch(elm, event)){
        return;
      }
    }

    elm = elm.fastUp(['A', 'LABEL', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'], null, true, 2);
    if (!elm) { return; }
    
    Util._onClickDispatch(elm, event);
  },
  
  _onClickDispatch: function(elm, event){
    // Call Init
    if(!elm._init){
      elm._init = true;
      document.fire('jcms:init', { elmId: elm.identify() });
    }
    
    // Call CallBack bind to each classname
    var done = false;
    var classNames = $w(elm.className);
    classNames.each(function(className,idx) {
      var cb = Util._classToCallBack.get(className);
      if (Object.isFunction(cb)) {
        cb(event, elm, className);
        done = true;
      }
    }.bind(this));
    
    return done;
  },
  
  /**
   * Register a new listener to be invoked on a click event happening on
   * A, BUTTON, INPUT, TEXTAREA, SELECT element having the specified classname.
   * The event listener callback will be invoked with the following parameters : 
   * 1 event
   * 2 the element on which the mathing classname was found
   * 3 the matching classname
   */
  observeClass: function(className, callback) {
    Util._classToCallBack.set(className, callback);
  },
  
  observeFocusClass: function(className, callback) {
    Util._focusToCallBack.set(className, callback);
  },
  
  getCSS: function(elem, name, force_computed) {
    var cs, result = {}, n, name_camel, is_array = name instanceof Array;
    var use_w3c = document.defaultView && document.defaultView.getComputedStyle;
    var rnumpx = /^-?\d+(?:px)?$/i,
      rnum = /^-?\d(?:\.\d+)?/,
      rsuf = /\d$/,
      ret,
      suffix;
  
    var _name = is_array ? name : [name];
    for (var i = 0, il = _name.length; i < il; i++) {
      n = _name[i];
      name_camel = n.camelize();
  
      // If the property exists in style[], then it's been set
      // recently (and is current)
      if (!force_computed && elem.style[name_camel]) {
        result[n] = result[name_camel] = elem.style[name_camel];
      }
      // Or the W3C's method, if it exists
      else if (use_w3c) {
        if (!cs)
          cs = window.getComputedStyle(elem, "");
        result[n] = result[name_camel] = cs && cs.getPropertyValue(n);
      } else if ( elem.currentStyle ) {
        ret = elem.currentStyle[n] || elem.currentStyle[name_camel];
        var style = elem.style || elem;
        
        // From the awesome hack by Dean Edwards
        // http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291
  
        // If we're not dealing with a regular pixel number
        // but a number that has a weird ending, we need to convert it to pixels
        if ( !rnumpx.test( ret ) && rnum.test( ret ) ) {
          // Remember the original values
          var left = style.left, rsLeft = elem.runtimeStyle.left;
  
          // Put in the new values to get a computed value out
          elem.runtimeStyle.left = elem.currentStyle.left;
          suffix = rsuf.test(ret) ? 'em' : '';
          var tmp = (name_camel === "fontSize") ? "1em" : (ret + suffix || 0)
          try { style.left = tmp; } catch(e){}
          ret = style.pixelLeft + "px";
  
          // Revert the changed values
          style.left = left;
          elem.runtimeStyle.left = rsLeft;
        }
  
        result[n] = result[name_camel] = ret;
      }
    }

    return is_array ? result : result[name.camelize()];
  }
  
});

Event.observe(window,   "load",           Util._onLoadCB);

// ----------------------------------------------------
//  NOTIFIER
// ----------------------------------------------------

var Notifier = Class.create({
    
    _events: [[document, 'mousemove'], [document, 'keydown']],
    _timer: null,
    _idleTime: null,
    active: false,
    
    /**
     * Constructor of Notifier
     * 
     * @param time The idle time to wait
     * @param eventName the name of the event to throw (eg xxx:idle and xxx:active)
     * @param active true to fire active event (sometimes is not usefull)
     * @param className fire event only on element with given classname (this implementation do not fastUp())
     */
    initialize: function(time, eventName, active, className) {
      this.time = time;
      this.eventName = eventName || 'state';
      this.active = active || false;
      this.className = $A(className);
        
      this.initObservers();
      this.setTimer();
      this._lastIdle = false;
    },
    
    initObservers: function() {
      this._events.each(function(e) {
          Event.observe(e[0], e[1], this.onInterrupt.bindAsEventListener(this));
      }.bind(this));
    },
    
    onInterrupt: function(event) {
      var target = Event.element(event);
      var eX     = Event.pointerX(event);
      var eY     = Event.pointerY(event);
      
      clearTimeout(this._timer);
      if (this._lastIdle != target){
        this._lastIdle = false;
      }
      
      if (!this._matchClassName(target) && (target.parentNode && !this._matchClassName(target.parentNode))){
        return;
      }
      
      if (this.active){
        var iTime = new Date() - this._idleTime
        if (iTime > 200){
          document.fire(this.eventName+':active', { idleTime: iTime, target: target, eX: eX, eY: eY });
        }
      }
      this.setTimer(target, eX, eY);
    },
    
    setTimer: function(target, eX, eY) {
      // Reset idle time
      this._idleTime = new Date();
      
      // Create timeout
      this._timer = setTimeout(function() {
        if (this._lastIdle == target){ return; }
        document.fire(this.eventName+':idle', { target: target, eX: eX, eY: eY});
        this._lastIdle = target;
      }.bind(this), this.time)
    },
    
    _matchClassName: function(target){
      if (!this.className  || !target || !this.className.any) { return true;  }
      if (!target.className || !target.className.indexOf)      { return false; }
      
      return this.className.any(function(str){  return target.className.indexOf(str) >= 0; });
    }
})

// ----------------------------------------------------
//  LOGGER
// ----------------------------------------------------

var JcmsLogger = {
  
  // Debug levels used by info(), debug(), warn()
  LEVEL_INFO:  "info",
  LEVEL_DEBUG: "debug",
  LEVEL_WARN:  "warn",
  LEVEL_ERROR: "error",
  
  // Debug status for each scope
  isDebug: true && window.console && window.console["debug"],
  
  // Component debug status
  Ajax:                 false,
  CtxMenuManager:       false,
  CtxMenu:              false,
  CtxMenuTrace:         false,
  WikiToolbar:          false,
  InputUtil:            false,
  Autochooser:          false,
  JcmsJsContext:        false,
  Table:                false,
  DocChooser:           false,
  TreeCat:              false,
  Modal:                false,
  JcmsAjaxRequest:      false,
  AjaxRefresh:          false,
  ShakeIE:              true,
  Widget:               false,
  Plupload:             true,
  EditFriendlyURL:      false,
  
  // --------------------
  //  INTERNAL
  // --------------------
  
  /**
   * A generic function to log message in Firebug console
   * http://www.joehewitt.com/software/firebug/docs.php
   * 
   * @param level the message level (default is DEBUG)
   */
  _log: function(level,args){
    
    var scope = args[0];
    var msg   = args[1];
    
    if (!window.console && document.URL.indexOf('debug=true') > 0  && level == JcmsLogger.LEVEL_INFO){ alert($A(args).inspect()); }
    
    if (!JcmsLogger._checkScope(level, scope, msg))
      return;
    
    // Default on DEBUG level
    level = (typeof(level) == "undefined") ? JcmsLogger.LEVEL_DEBUG : level;
    
    // The message to log
    args[1]  = "["+level+"]["+scope+"] "+msg;
    args = $A(args).slice(1,args.length);
    
    // The function call
    if (window.console && level && window.console[level] && typeof(window.console[level].apply)!="unknown")
      window.console[level].apply(window.console,args);
  },
  _checkScope: function(level, scope, msg){
    // General check scope
    if ((!msg) || !JcmsLogger.isDebug)
      return false;
    
    // Default on DEBUG level
    level = (typeof(level) == "undefined") ? JcmsLogger.LEVEL_DEBUG : level;
    
    // Check scope
    if ((!scope) || (!JcmsLogger[scope] && level==JcmsLogger.LEVEL_DEBUG))
      return false;
      
    return true;
  },
  
  // --------------------
  //  FUNCTIONS
  // --------------------

  info: function(scope, msg){
    JcmsLogger._log(JcmsLogger.LEVEL_INFO,arguments);
  },
  debug: function(scope, msg){
    JcmsLogger._log(JcmsLogger.LEVEL_DEBUG,arguments);
  },
  warn: function(scope, msg){
    JcmsLogger._log(JcmsLogger.LEVEL_WARN,arguments);
  },
  error: function(scope, msg){
    JcmsLogger._log(JcmsLogger.LEVEL_ERROR,arguments);
  }
};





// ----------------------------------------------------
//  CONVENIENT
// ----------------------------------------------------

document.getElementsBySelector = function(selector) {
  return $$(selector);
}

//----------------------------------------------------
// Cross Browser Split implementation
//----------------------------------------------------

/* Cross-Browser Split 1.0.1
(c) Steven Levithan <stevenlevithan.com>; MIT License
An ECMA-compliant, uniform cross-browser split method */

var cbSplit;

// avoid running twice, which would break `cbSplit._nativeSplit`'s reference to the native `split`
if (!cbSplit) {

cbSplit = function (str, separator, limit) {
    // if `separator` is not a regex, use the native `split`
    if (Object.prototype.toString.call(separator) !== "[object RegExp]") {
        return cbSplit._nativeSplit.call(str, separator, limit);
    }

    var output = [],
        lastLastIndex = 0,
        flags = (separator.ignoreCase ? "i" : "") +
                (separator.multiline  ? "m" : "") +
                (separator.sticky     ? "y" : ""),
        separator = RegExp(separator.source, flags + "g"), // make `global` and avoid `lastIndex` issues by working with a copy
        separator2, match, lastIndex, lastLength;

    str = str + ""; // type conversion
    if (!cbSplit._compliantExecNpcg) {
        separator2 = RegExp("^" + separator.source + "$(?!\\s)", flags); // doesn't need /g or /y, but they don't hurt
    }

    /* behavior for `limit`: if it's...
    - `undefined`: no limit.
    - `NaN` or zero: return an empty array.
    - a positive number: use `Math.floor(limit)`.
    - a negative number: no limit.
    - other: type-convert, then use the above rules. */
    if (limit === undefined || +limit < 0) {
        limit = Infinity;
    } else {
        limit = Math.floor(+limit);
        if (!limit) {
            return [];
        }
    }

    while (match = separator.exec(str)) {
        lastIndex = match.index + match[0].length; // `separator.lastIndex` is not reliable cross-browser

        if (lastIndex > lastLastIndex) {
            output.push(str.slice(lastLastIndex, match.index));

            // fix browsers whose `exec` methods don't consistently return `undefined` for nonparticipating capturing groups
            if (!cbSplit._compliantExecNpcg && match.length > 1) {
                match[0].replace(separator2, function () {
                    for (var i = 1; i < arguments.length - 2; i++) {
                        if (arguments[i] === undefined) {
                            match[i] = undefined;
                        }
                    }
                });
            }

            if (match.length > 1 && match.index < str.length) {
                Array.prototype.push.apply(output, match.slice(1));
            }

            lastLength = match[0].length;
            lastLastIndex = lastIndex;

            if (output.length >= limit) {
                break;
            }
        }

        if (separator.lastIndex === match.index) {
            separator.lastIndex++; // avoid an infinite loop
        }
    }

    if (lastLastIndex === str.length) {
        if (lastLength || !separator.test("")) {
            output.push("");
        }
    } else {
        output.push(str.slice(lastLastIndex));
    }

    return output.length > limit ? output.slice(0, limit) : output;
};

cbSplit._compliantExecNpcg = /()??/.exec("")[1] === undefined; // NPCG: nonparticipating capturing group
cbSplit._nativeSplit = String.prototype.split;

} // end `if (!cbSplit)`

// for convenience...
String.prototype.split = function (separator, limit) {
    return cbSplit(this, separator, limit);
};
