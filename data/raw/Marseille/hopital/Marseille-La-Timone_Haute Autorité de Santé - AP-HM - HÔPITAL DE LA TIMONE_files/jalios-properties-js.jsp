
var JCMS_Properties = {

  'ajax\-refresh\-setup': { /* Functional */  trigger:    false, /* The trigger element's id of the ajax-refresh */ nohistory:  false, /* Do not store history. Also require a trigger to replay the refresh */ nofocus:    false, /* Do not scroll to wrapper position */ noscroll:   false, /* see nofocus */ noerror:    false, /* Do not fire alert() errors */ noresponse: false, /* Do not refresh target area */ isform:     false, /* Submit wrapping form */ periodical: false, callback:   false, /* called after 'refresh after' with $target as parameter */ inner:      false, /* A sub query to refresh instead of ajax-refresh-div */ append:     false, /* A boolean indicating HTML should be append to target instead of replacing */ waiting:    false,   /* Display a gray area with an animated gif */ /* Technical */ method:     undefined, params:     {}, cache:      false,  /* Do not use browser cache */ timeout:    60000 },
  'autocomplete\-chooser\-timeout': 500,
  'autocomplete\-min\-chars': 2,
  'data\-chooser.calendarResource.width': 1200,
  'image\-regex': /^.*\.(jpg|gif|png|jpeg|tif|tiff|svg|ico)(\:(small|orig|large))?(\?[^\?]*)?$/i,
  'lightbox.light\-gallery.licence\-key': "BD440384-29974A81-9AB973FC-4FC893E7",
  'member.edit.auto\-convert\-address': true,
  'plupload\-filters': { 'images' : { extensions : "jpg,gif,png,jpeg,tif,tiff,svg,ico,raw,cr2,nef,rw2,arw,raf,pef,dng,webp" }, 'videos' : { extensions : "avi,mp4,mpeg,mpg,mov,m4v,flv,swf,wmv,ogv,webm,mkv,mk3d,mpd,m3u8" }, 'sounds' : { extensions : "mp3,wav,aac,m4a,ogg,oga,mka" }, 'zip'    : { extensions : "zip" }, 'media'  : { extensions : "jpg,gif,png,jpeg,tif,tiff,svg,ico,raw,cr2,nef,rw2,arw,raf,pef,dng,webp,avi,mp4,mpeg,mpg,mov,m4v,flv,swf,wmv,ogv,webm,mp3,wav,aac,m4a,ogg,oga,zip" }},
  'twemoji.base': 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/',
  'twemoji.use\-cdn': true,
  'wysiwyg.path': 'frontlib\/tinymce\/js\/tinymce',

  loaded : true
};
