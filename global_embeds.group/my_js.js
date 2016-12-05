/*
 * My JS
 * Nicholas Cappo / Kean Mattingly
 * Last updated: 160825
 */
 
 /* Gallery fetch ajax */
$('.btn-gallery').click(function(event) {
	var df = String($(this).attr("data-fetch"));
    var c = String($(this).attr("data-cache"));
	if ( String($('#gallery').attr("data-displaying")) == df) return; // Check if desired gallery is already loaded into modal
    cacheGallery($("#gallery > div > .modal-content > div"));
    fetchGallery(df,c);
});

function cacheGallery(data){
	var c = String(data.attr("data-cache"));
    if (data == "No data" || c == "") return; // No gallery has been loaded yet
	data.attr("id", ""); // So next buttons dont have to cycle through x number of cached galleries
    $("#gallery-cache").append(data);
}

function fetchGallery(df,c){
    /* First, check to see if gallery is already cached */
    var cache = $('div[data-cache="'+c+'"]');
    var gm = $('#gallery > .modal-dialog > .modal-content');
    if (cache.html() != undefined){
    	cache.attr("id", "image-gallery"); // return the gallery id so buttons will work
    	gm.html(cache);
    } else {
      /* If not, do an ajax call on the data-fetch */
      gm.html('<h3 class="text-center"><i class="fa fa-refresh fa-spin"></i> Loading</h3>');
      $.ajax({
          url: df,
          success: function(data) {
              gm.html(data);
          },
          error: function(){
              gm.html('<h3 class="text-center"><i class="fa fa-exclamation-circle"></i> Failed<br><small>Please try again later.</small></h3>');
          },
          statusCode: {
    		  404: function() {
      		  	  gm.html('<div data-cache="'+c+'"><h3 class="text-center"><i class="fa fa-exclamation-circle"></i> Failed<br><small>Gallery does not exist or has been removed.</small></h3></div>');
    		  }
  		  }
      });
    }
    $('#gallery').attr("data-displaying", df);
}

function goToTab() {
  // Javascript to enable link to tab
  var hash = document.location.hash;
  var prefix = "tab_";
  if (hash) {
      $('.nav-tabs a[href='+hash.replace(prefix,"")+']').tab('show');
  } 
  
  // Change hash for page-reload
  //$('.nav-tabs a').on('shown.bs.tab', function (e) {
  //    window.location.hash = e.target.hash.replace("#", "#" + prefix);
  //});
}

goToTab();


// gets the scrollbar's width in pixels
function getScrollerWidth() { // Found: http://www.fleegix.org/articles/2006/05/30/getting-the-scrollbar-width-in-pixels
  var scr = null;
  var inn = null;
  var wNoScroll = 0;
  var wScroll = 0;

  scr = document.createElement('div');
  scr.style.position = 'absolute';
  scr.style.top = '-1000px';
  scr.style.left = '-1000px';
  scr.style.width = '100px';
  scr.style.height = '50px';
  scr.style.overflow = 'hidden';

  inn = document.createElement('div');
  inn.style.width = '100%';
  inn.style.height = '200px';

  scr.appendChild(inn);
  document.body.appendChild(scr);

  wNoScroll = inn.offsetWidth;
  scr.style.overflow = 'auto';
  wScroll = inn.offsetWidth;

  document.body.removeChild(
  document.body.lastChild);

  return (wNoScroll - wScroll);
}

// various responsive functions, checks the width of the window and adds or removes classes and affixes
var checkWidth = function(){
	var windowsize = $(window).innerWidth();
	if(windowsize >= 768 - getScrollerWidth()){ // Don't want this to happen at xs screen sizes because the header is hidden.
		$('#nav').removeClass('navbar-fixed-top'); // This line in case resizing from xs
		$('#nav-wrapper').height($("#nav").height());
		$('#nav').affix({
			offset: {
                top: function() { return ($('#header').offset().top + $('#header').outerHeight())}
            }
		});
        $("ul#recent-posts > li.media > a").addClass("pull-left");
	} else { // Want to make the navbar fixed to top right off the bat if there is no header to wait for
			$("#nav").addClass("navbar-fixed-top");
           $("ul#recent-posts > li.media > a").removeClass("pull-left");
	}
}

// used on the reserve a space page when prompted to give location and date
function go(){ // grabs variables from the reserve form and shoots the user to that day
	var url="/facilities/reserve/"
		+ $("#room option:selected").val() + "/"
		+ $("#year option:selected").val() + "/"
		+ $("#month option:selected").val() + "/";
       // + $("#day option:selected").val();
		
    window.location = url;
    return false;
}

// Makes image maps responsive
$('img[usemap]').rwdImageMaps();

//$('#world-map').maphilight();

// call checkWdith and also call it when resizing the window
$(checkWidth);
$(window).resize(checkWidth);

//$("[data-toggle=popover]").popover().click(function(e) {e.preventDefault();});
$("#login-link").removeAttr('href');
  
$(window).on("hashchange", function () {
	window.scrollTo(window.scrollX, window.scrollY - 100);
});

/* Uses JQuery plugin .hoverIntent so that the carousel doesn't switch on a simple mouse enter event making it look more stable
$('.carousel-indicators-2 > div').hoverIntent(function(){  
    $(this).trigger('click');  
});
*/
$('.nav > .dropdown > .dropdown-toggle').hoverIntent(function(){
    $(this).dropdown('toggle');
}, function(){
	return 0;
});

$('.nav > .dropdown > .dropdown-toggle').on("click", function(){
	window.location.href = $(this).attr('href');
});


//Fixes the navbar not going to things
$('a:has(h4)').on("click", function(){
	window.location.href = $(this).attr('href');
});

// There was a login error, open modal and focus on login
if( $('.login-error').length ){
	$('#loginModal').modal('show');
    $('a[href="#login"]').tab('show');
}

// there was a registration error, open modal and focus on register
if( $('.register-error').length ){
	$('#loginModal').modal('show');
    $('a[href="#register"]').tab('show');
}

// if mouse leaves the dropdown menu, collapse it
$('.dropdown > .dropdown-menu').on('mouseleave', function(){
	var p = $(this).parent();
    p.dropdown('toggle');
	p.children('a').blur();
});

// Convert images with a title (found in stories) to figures with figcaption versions of the title
function figify(){
    $('#event-content img[alt].give-caption, #news_listing img[alt].give-caption').each( function(i, val){
        $(this).css("height", "");
        if($(this).css("margin-top") == "0px"){
        	$(this).css("margin-top", "5px");
            $(this).css("margin-bottom", "5px");
        }
    	var fig = $("<figure style='" + $(this).attr("style") + "'></figure>").insertAfter($(this));
      	$(this).addClass('img-responsive');
      	$(this).removeAttr('style');
      	$(this).appendTo(fig);
      	$("<figcaption>" + $(this).attr('alt') + "</figcaption>").appendTo(fig);
    });
}
figify();

//Convert embeded iframes (found in stories) like YouTube videos into responsive players
function iframe_responsify(){
	var iframe = $('iframe[src*=youtube], iframe[src*=google], iframe[src*=slideshare], iframe[src*=interlude]');
    if(iframe.width() > iframe.height()){
        iframe.wrap("<div class='embed-responsive embed-responsive-16by9'></div>");
        iframe.addClass('embed-responsive-item');
    } else {
    	iframe.wrap("<div class='embed-responsive embed-responsive-16by9-vertical'></div>");
        iframe.addClass('embed-responsive-item');
    }
}
iframe_responsify();

//Convert tables into responsive tables using our bootstrap
function table_responsify(){
	var table = $('table');
    table.addClass('table');
    table.wrap("<div class='table-responsive'></div>");
}
table_responsify();

$('.preview-img').on('click', function() {
    index = $(this).attr('data-slide-to');
    $("#image-gallery").carousel(parseInt(index));
});

//When attempting to reserve a date, make sure that the date being reserved occurs after the current date
var checked = 0;
function check_event_date() {
	var date = new Date(), currentMonth = date.getMonth(), currentYear = date.getFullYear();//+1 because it starts at index 0
    var selectedMonth = parseInt(document.getElementById("month").value, 10);
    var selectedYear = parseInt(document.getElementById("year").value, 10);
    
    if (currentYear == selectedYear && currentMonth >= selectedMonth) {
		if (!checked) {
			$("<br><p>That date has already passed!</p>").appendTo(document.getElementById("selectForm"));
	        checked = 1;
        }
        return false;
    }
    else {
    	go();
        return false;
    }
}

//This sends an email via AJAX to the person reserving a room. It's long, it's grody, and it's working (currently)
var clicked = 0;
$(function() {
	$("#submit").click(function(e) {//Activates when the submit button is clicked
    	if (!clicked) {
	    	e.preventDefault();//Stop the default action (submitting the form) from occurring
            clicked = 1;//Lets the function know to run go() the next time it is run
            e.returnValue = false;//don't submit the form
            
            //BEGIN VARIABLE COLLECTION PROCESS
			var name = $("#name").val();
            var email = $("#from").val();
            
            var room211 = "";
            if ($("#rooms0").is(':checked'))
            	room211 = "Room 211\n";
            
            var room200B = "";
            if ($("#rooms1").is(':checked'))
            	room200B = "Spencer Room 200B\n";
            
            var room200A = "";
            if ($("#rooms2").is(':checked'))
            	room200A = "Lambert Room 200A\n";
                
            var room100A = "";
            if ($("#rooms3").is(':checked'))
            	room100A = "Palmer Room 100A\n";
                
            var room200 = "";
            if ($("#rooms4").is(':checked'))
            	room200 = "Smith Forum 200\n";
            
            var meetingStart = $("#startTime").val();
            var meetingEnd = $("#endTime").val();
            var setupTime = $("#setupTime").val();
            var cleanupTime = $("#cleanupTime").val();
            var phoneNumber = $("#phoneNumber").val();
            var organization = $("#organization").val();
            var eventName = $("#eventName").val();
            var people = $("#people").val();
            var description = $("#message").val();
            var food = "";
            if ($("#foodYes").is(':checked'))
            	food = "I will be serving food at this event and will obtain a temporary food permit.\n"
            var alcohol = "";
            if ($("#alcYes").is(':checked'))
            	alcohol = "I will be serving alcohol at this event and will obtain a temporary use of alcoholic beverages permit.\n";
            //END VARIABLE COLLECTION PROCESS
            
            //package up some json for the AJAX call
            var data = {
            	subject: $("#subject").val(),
                message: "Thank you for submitting an RJI room reservation request. We will be in contact with you within three business days to confirm. \n\n\nName:\n" + name + "\n\nEmail:\n" + email + "\n\nOther Rooms Needed:\n" + room211 + room200B + room200A + room100A + room200 + "\nMeeting Start Time:\n" + meetingStart + "\n\nMeeting End Time:\n" + meetingEnd + "\n\nSetup Time:\n" + setupTime + "\n\nCleanup Time:\n" + cleanupTime + "\n\nPhone Number:\n" + phoneNumber + "\n\nOrganization:\n" + organization + "\n\nEvent Name:\n" + eventName + "\n\nPeople:\n" + people + "\n\nDescription:\n" + description + "\n\n\nNote:\n" + food + alcohol + "I have read and understand the RJI Room Reservation Policies.",
            	email: $("#from").val()
            };

			//make the ajax call
            $.ajax({
                type: "POST",
                url: "/php_scripts/email.php",
                data: data,
                complete: function() {
                    $("#submit").trigger("click");
                }
            });
        }
    })
});

//Google analytics JS
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-23407755-1', 'auto');
  ga('send', 'pageview');