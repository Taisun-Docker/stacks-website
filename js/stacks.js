// Taisun Stacks Javascript logic
var stackurl = 'https://api.taisun.io/stacks';
var converter = new showdown.Converter({parseImgDimensions: true});
// On first page load render the main page
$(document).ready(
  function(){
    checklogin()
    if (typeof getUrlParams('stack') === 'string' ){
      renderstack(getUrlParams('stack'));
    }
    else{
      rendermain();
    }
    // We need to listen for the enter key on the seach box
    document.getElementById("stacksearch").addEventListener("keydown", function (e) {
      if (e.keyCode === 13) {
        stacksearch(1);
      }
    });
  }
)

// Check is the user has Strings set for their login
function checklogin(){
  $('#addstack').hide();
  var user = getUrlParams('user');
  var apikey = getUrlParams('apikey');
  if ((typeof user === 'string' || user instanceof String) && (typeof apikey === 'string' || apikey instanceof String)){
    $('#userinfo').empty();
    $('#userinfo').append('<button onclick="location.href=\'/\';" class="btn btn-outline-primary my-2 my-sm-0">'
    + user +
    ' <i class="fa fa-sign-out"></i></button>');
    $('#addstack').show();
  }
}

// Render the main page
function rendermain(){
  var Init = { method:'GET',headers:{'Access-Control-Allow-Origin':'*'},mode:'cors'};
  fetch(stackurl,Init)
  .then((resp) => resp.json())
  .then((data) => {
    renderpage(data)
  });
}

// Search for a stack by name
function stacksearch(page){
  $('#taisunstacks').empty();
  $('#taisunstacks').append('<i class="fa fa-refresh fa-spin" style="font-size:36px"></i>');
  var search = $('#stacksearch').val();
  var searchurl = stackurl + '?search=' + search + '&page=' + page
  var Init = { method:'GET',headers:{'Access-Control-Allow-Origin':'*'},mode:'cors'};
  fetch(searchurl,Init)
  .then((resp) => resp.json())
  .then((data) => {
    renderpage(data)
  });
}

// Render Stack page
function renderstack(stackguid){
  $('#taisunstacks').empty();
  var file = '/templates/' + stackguid;
  var fullurl = 'https://stacks.taisun.io' + file;
  $.get(file).done(function (data) {
    var template = jsyaml.load(data);
    var markdown = template.description;
    var name = template.name;
    $('#taisunstacks').append('\
      <div class="card mb-3">\
        <div class="card-header">\
          <i class="fa fa-link"></i>\
            <a href="' + fullurl +'" target="_blank">' + fullurl + '</a>\
        </div>\
        <div class="card-body">\
          ' + converter.makeHtml(markdown) + '\
        </div>\
      </div>\
      <div class="card mb-3">\
        <div class="card-header">\
          <i class="fa fa-info-circle"></i>\
            Full Template\
        </div>\
        <div class="card-body">\
          <div id="editor" style="height: 500px; width: 100%"></div>\
        </div>\
      </div>\
    ');
    // Ace editor
    var editor = ace.edit("editor");
    editor.setTheme("ace/theme/chrome");
    editor.session.setMode("ace/mode/yaml");
    editor.$blockScrolling = Infinity;
    editor.setOptions({
      readOnly: true,
    });
    editor.setValue(data,-1);
  });
}

// Build the Stacks table based on api return
function renderpage(data){
  $('#taisunstacks').empty();
  // If the file is invalid show error
  if (data.stacktemplates == null || data.stacktemplates == undefined){
    $('#taisunstacks').append('<center><h2>No Stacks</h2></center>');
  }
  else {
    // Create table for taisun results
    $('#taisunstacks').append('\
      <table style="width:100%" class="table table-bordered table-hover">\
        <thead>\
          <tr>\
            <th></th>\
            <th>Name</th>\
            <th>Description</th>\
            <th>Downloads</th>\
          </tr>\
        </thead>\
        <tbody id="stackstable"></tbody>\
      </table>');
    // Draw table
    for (i = 0; i < data.stacktemplates.length; i++){
      var name = data.stacktemplates[i].name;
      var guid = data.stacktemplates[i].guid;
      var description = data.stacktemplates[i].description;
      var iconurl = data.stacktemplates[i].icon;
      var dataurl = data.stacktemplates[i].stackdata;
      var downloads = data.stacktemplates[i].downloads;
      var user = data.stacktemplates[i].user;
      // Use short description on mobile
      if ($(window).width() < 500){
        var description = description.substring(0, 35) + '...'
      }
      if (user == getUrlParams('user')){
        var deletebutton = '<button type="button" data-toggle="modal" data-target="#modal" style="cursor:pointer;" class="btn btn-danger btn-sm confirmdelete" value="' + guid + '|' + name + '">Delete <i class="fa fa-trash-o"></i></button>';
        var editbutton = '<button type="button" data-toggle="modal" data-target="#modal" style="cursor:pointer;" class="btn btn-primary btn-sm editstack" value="' + dataurl + '|' + name + '|' + guid + '">Edit <i class="fa fa-pencil-square-o"></i></button>'
        var clickthrough = '';
      }
      else{
        var deletebutton = '';
        var editbutton = '';
        var clickthrough = 'style="cursor:pointer;" onclick="location.href=\'/?stack=' + dataurl.replace('https://stacks.taisun.io/templates/','') + '\';"'
      }
      $('#stackstable').append('\
        <tr height="130" ' + clickthrough + '>\
          <td><center><img src="' + iconurl + '"></center></td>\
          <td>' + name + '<br>' + deletebutton + '<br>' + editbutton + '</td>\
          <td style="word-wrap: break-word">' + description + '</td>\
          <td>' + downloads + '</td>\
        </tr>')
    }
    // Pagination logic show +2 and -2 pages at the bottom of the table
    $('#taisunstacks').append('<ul id="stackpages" class="pagination"></ul>');
    for (i = -2; i < 3; i++){
      var pagenumber = parseInt(data.page.page) + i;
      // If negative page number do not display
      if ( pagenumber <= 0){
      }
      // If current page highlight current
      else if ( pagenumber == data.page.page){
        $('#stackpages').append('<li class="page-item active"><a class="page-link" onclick="stacksearch(' + pagenumber + ')">' + pagenumber + '</a></li>');
      }
      // If not current page
      else if (parseInt(data.page.num_pages) - pagenumber >= 0){
        $('#stackpages').append('<li class="page-item"><a class="page-link" onclick="stacksearch(' + pagenumber + ')">' + pagenumber + '</a></li>');
      }
    }
  }
}

// Upload Yaml Modal
$('body').on('click', '.addstack', function(){
  modalpurge();
  $('#modaltitle').append('Add Stack');
  $('#modalbody').show();
  $('#modalbody').append('\
    <p>Please see documentation <a href="https://gitlab.com/thelamer/taisun/wikis/Development/Templates" target="_blank">here</a> for writing Stack Templates</p>\
    <div class="form-group row">\
      <label for="stackname" class="col-sm-2 control-label">Stack Name</label>\
      <div class="col-sm-10">\
        <input type="text" class="form-control" id="stackname">\
      </div>\
    </div>\
    <div class="form-group row">\
      <label class="col-sm-2 control-label">Description</label>\
      <div class="col-sm-10">\
        <textarea data-label="description" class="form-control" id="description" rows="3"></textarea>\
      </div>\
    </div>\
    <div class="form-group row">\
      <label class="col-sm-2 control-label">Icon</label>\
      <div class="col-sm-10">\
        <input type="file" class="form-control stackicon" id="stackicon">\
        <img id="icondisplay" style="color:red;" src="#" alt=""/>\
      </div>\
    </div>\
    <p>Template Editor:</p><br>\
    <div id="editor" style="height: 500px; width: 100%"></div>\
  ');
  // Ace editor
  var editor = ace.edit("editor");
  editor.setTheme("ace/theme/chrome");
  editor.session.setMode("ace/mode/yaml");
  editor.session.setOptions({
      tabSize: 2
  });
  $('#modalfooter').show();
  $('#modalfooter').append('\
  <button type="button" class="btn btn-danger" data-dismiss="modal">Cancel</button>\
  <button type="button" class="btn btn-success" onclick="uploadstack()">Add</button>\
  ');
});

// Check the image uploaded to the form and display it if valid
$('body').on('change', '.stackicon', function(){
  $('#icondisplay').attr('src', '#');
  $('#icondisplay').attr('alt', '');
  displayimage(this);
});
function displayimage(input) {
  if (input.files && input.files[0]) {
    var reader = new FileReader();
    reader.readAsDataURL(input.files[0]);
    reader.onload = function(file) {
      var image = new Image();
      var filetype = input.files[0]['type'];
      image.src = file.target.result;
      image.onload = function() {
        if (image.width == 128 && image.height == 128 && filetype == 'image/png'){
          $('#icondisplay').attr('src', this.src);
        }
        else{
          var fileinput = $('#stackicon');
          fileinput.replaceWith(fileinput.val('').clone(true));
          $('#icondisplay').attr('alt', 'Image must be 128x128 PNG !');
        }
      };
    }
  }
}

// Take the form input and encode it to upload to stacks api
function uploadstack(){
  var reader = new FileReader();
  var icondata = $('#stackicon');
  var editor = ace.edit("editor");
  var yaml64 = btoa(editor.getValue());
  var name = $('#stackname').val();
  var apikey = getUrlParams('apikey');
  var description64 = btoa($('#description').val());
  // Basic Form Validation
  if (name == ''){
    window.alert("Stack Name Cannot be empty");
  }
  else if (description64 == ''){
    window.alert("Description Cannot be empty");
  }
  else if (yaml64 == ''){
    window.alert("Stack Template Cannot be empty");
  }
  else{
    if (icondata[0].files && icondata[0].files[0]) {
      reader.readAsDataURL(icondata[0].files[0]);
      reader.onload = function(file) {
        var icon64 = file.target.result.split(',')[1];
        sendstack(name,apikey,description64,yaml64,icon64);
      };
    }
    else{
      window.alert("Your stack needs an icon");
    }
  }
}
function sendstack(name,apikey,description64,yaml64,icon64){
  var body = {};
  modalpurge();
  $('#modalloading').show();
  $('#modaltitle').append('Uploading Stack' + name);
  body['name'] = name;
  body['apikey'] = apikey;
  body['description64'] = description64;
  body['yaml64'] = yaml64;
  body['icon64'] = icon64;
  body['request'] = 'upload';
  // Post data to remote upload API
  var Init = { method:'POST',headers:{'Access-Control-Allow-Origin':'*'},mode:'cors',body: JSON.stringify(body)};
  fetch(stackurl,Init)
  .then((resp) => resp.json())
  .then((data) => {
    modalpurge();
    $('#modaltitle').append('Upload complete');
    $('#modalbody').show();
    $('#modalbody').append(data.message);
  });
}

// Edit stack
$('body').on('click', '.editstack', function(){
  var buttondata = $(this).attr("value").split('|');
  var stackurl = buttondata[0];
  var stackname = buttondata[1];
  var guid = buttondata[2];
  modalpurge();
  $('#modaltitle').append('Edit ' + stackname);
  var file = stackurl.replace('https://stacks.taisun.io','');
  $.get(file).done(function (data) {
    $('#modalbody').show();
    $('#modalbody').append('\
    <p>Template Editor:</p><br>\
    <div id="editor" style="height: 500px; width: 100%"></div>\
    ');
    // Ace editor
    var editor = ace.edit("editor");
    editor.setTheme("ace/theme/chrome");
    editor.session.setMode("ace/mode/yaml");
    editor.$blockScrolling = Infinity;
    editor.setValue(data,-1);
  });
  $('#modalfooter').show();
  $('#modalfooter').append('\
  <button type="button" class="btn btn-danger" data-dismiss="modal">Cancel</button>\
  <button type="button" class="btn btn-success editstackbutton" value="' + guid  + '">Submit</button>\
  ');
});
// Take the form input and encode it to upload to stacks api
$('body').on('click', '.editstackbutton', function(){
  var guid = $(this).attr("value");
  var editor = ace.edit("editor");
  var yaml64 = btoa(editor.getValue());
  var apikey = getUrlParams('apikey');
  // Basic Form Validation
  if (yaml64 == ''){
    window.alert("Stack Template Cannot be empty");
  }
  else{
    editstack(guid,yaml64,apikey);
  }
});
function editstack(guid,yaml64,apikey){
  var body = {};
  modalpurge();
  $('#modalloading').show();
  $('#modaltitle').append('Uploading Stack' + name);
  body['guid'] = guid;
  body['apikey'] = apikey;
  body['yaml64'] = yaml64;
  body['request'] = 'edit';
  // Post data to remote upload API
  var Init = { method:'POST',headers:{'Access-Control-Allow-Origin':'*'},mode:'cors',body: JSON.stringify(body)};
  fetch(stackurl,Init)
  .then((resp) => resp.json())
  .then((data) => {
    modalpurge();
    $('#modaltitle').append('Upload complete');
    $('#modalbody').show();
    $('#modalbody').append(data.message);
  });
}

// Delete Stack
$('body').on('click', '.confirmdelete', function(){
  var buttondata = $(this).attr("value");
  var guid = buttondata.split('|')[0];
  var name = buttondata.split('|')[1];
  modalpurge();
  $('#modaltitle').append('Delete Stack');
  $('#modalbody').show();
  $('#modalbody').append('\
  <center>\
    <h2>Are you sure you want to delete ' + name + ' ?</h2>\
    <button type="button" style="cursor:pointer;" class="btn btn-danger deletestack" value="' + guid + '">Delete <i class="fa fa-trash-o"></i></button>\
  </center>\
  ');
});
$('body').on('click', '.deletestack', function(){
  var guid = $(this).attr("value");
  var apikey = getUrlParams('apikey');
  deletestack(guid,apikey);
});
function deletestack(guid,apikey){
  var body = {};
  modalpurge();
  $('#modalloading').show();
  $('#modaltitle').append('Deleting Stack ' + guid);
  body['guid'] = guid;
  body['apikey'] = apikey;
  body['request'] = 'delete';
  // Post data to remote upload API
  var Init = { method:'POST',headers:{'Access-Control-Allow-Origin':'*'},mode:'cors',body: JSON.stringify(body)};
  fetch(stackurl,Init)
  .then((resp) => resp.json())
  .then((data) => {
    modalpurge();
    $('#modaltitle').append('Delete complete');
    $('#modalbody').show();
    $('#modalbody').append(data.message);
  });
}



// Purge the modal of data
function modalpurge(){
  $('#modaltitle').empty();
  $('#modalbody').empty();
  $('#modalconsole').empty();
  $('#modalfooter').empty();
  $('#modalloading').hide();
  $('#modalbody').hide();
  $('#modalconsole').hide();
  $('#modalfooter').hide();
}


// Get URL Params
function getUrlParams( prop ) {
  var params = {};
  var search = decodeURIComponent( window.location.href.slice( window.location.href.indexOf( '?' ) + 1 ) );
  var definitions = search.split( '&' );
  definitions.forEach( function( val, key ) {
    var parts = val.split( '=', 2 );
    params[ parts[ 0 ] ] = parts[ 1 ];
  } );
  return ( prop && prop in params ) ? params[ prop ] : params;
}
