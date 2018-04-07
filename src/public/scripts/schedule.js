//Code modified from https://github.com/CodyHouse/schedule-template

jQuery(document).ready(function($){
    var timeLineStart = 0;
    var EventSlotHeight = 0;
    var TimeLineUnitDuration = 0;


	var transitionEnd = 'webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend';
	var transitionsSupported = ( $('.csstransitions').length > 0 );
	//if browser does not support transitions - use a different event to trigger them
	if( !transitionsSupported ) transitionEnd = 'noTransition';
	
	//should add a loding while the events are organized 

	function SchedulePlan( element ) {
		this.element = element;
		this.timeline = this.element.find('.timeline');
		this.timelineItems = this.timeline.find('li');
		this.timelineItemsNumber = this.timelineItems.length;
        this.timelineStart = getScheduleTimestamp(this.timelineItems.eq(0).text());
        timeLineStart = this.timelineStart;
		//need to store delta (in our case half hour) timestamp
		this.timelineUnitDuration = getScheduleTimestamp(this.timelineItems.eq(1).text()) - getScheduleTimestamp(this.timelineItems.eq(0).text());

        TimeLineUnitDuration = this.timelineUnitDuration;

		this.eventsWrapper = this.element.find('.events');
		this.eventsGroup = this.eventsWrapper.find('.events-group');
		this.singleEvents = this.eventsGroup.find('.single-event');
        this.eventSlotHeight = this.eventsGroup.eq(0).children('.top-info').outerHeight();
        
        EventSlotHeight = this.eventSlotHeight;

		this.modal = this.element.find('.event-modal');
		this.modalHeader = this.modal.find('.header');
		this.modalHeaderBg = this.modal.find('.header-bg');
		this.modalBody = this.modal.find('.body'); 
		this.modalBodyBg = this.modal.find('.body-bg'); 
		this.modalMaxWidth = 800;
		this.modalMaxHeight = 480;

		this.animating = false;

    }
	var schedules = $('.cd-schedule');
	var objSchedulesPlan = [],
		windowResize = false;
	
	if( schedules.length > 0 ) {
		schedules.each(function(){
			//create SchedulePlan objects
			objSchedulesPlan.push(new SchedulePlan($(this)));
		});
    }

    
    $("#testbutton").click(function() { 
        addEvent("monday", "11:10", "12:30", "Hello", "5");
        addEvent("wednesday", "15:40", "17:00", "Class", "1");
    });

    $("#testbutton2").click(function() { 
        $("#monday1110").remove();
    });
    function addEvent(day, starttime, endtime, msg, type) {
        var currentString = $("#" + day).html();

        var start = getScheduleTimestamp(starttime),
            duration = getScheduleTimestamp(endtime) - start;

        var top = EventSlotHeight * (start - timeLineStart) / TimeLineUnitDuration,
            height = EventSlotHeight * duration / TimeLineUnitDuration;

        currentString += '<li id="' + (day + starttime.split(":")[0] + starttime.split(":")[1]) + '" class="single-event" data-event="event-' + type + '"';
        currentString += ' style="top: ' + (top - 1) + 'px; height: ' + (height - 1) + 'px;">';
        currentString += '<a href="#0"><span class="event-date">' + starttime + ' - ' + endtime + '</span>';
        currentString += '<em class="event-name">' + msg + '</em></a></li>';

        $("#" + day).html(currentString); 
    }

	function getScheduleTimestamp(time) {
		//accepts hh:mm format - convert hh:mm to timestamp
		time = time.replace(/ /g,'');
		var timeArray = time.split(':');
		var timeStamp = parseInt(timeArray[0])*60 + parseInt(timeArray[1]);
		return timeStamp;
	}

	function transformElement(element, value) {
		element.css({
		    '-moz-transform': value,
		    '-webkit-transform': value,
			'-ms-transform': value,
			'-o-transform': value,
			'transform': value
		});
	}

	dropdown = $("#dropdown");
    dropdownhtml = dropdown.html();

    dropdownhtml += '<div class="btn-group">';
    dropdownhtml += '<div>';
    dropdownhtml += '<button class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown">CSCI2050';
    dropdownhtml += '<span class="caret"></span></button>';
    dropdownhtml += '<ul class="dropdown-menu">';
    dropdownhtml += '<li class="dropdown-submenu">';
    dropdownhtml += '<a class="test" tabindex="-1" href="#">Lecture <span class="caret"></span></a>';
    
    dropdownhtml += '<ul class="dropdown-submenu">';
    dropdownhtml += '<li><a type="lecture" day="monday" time="8:10-9:40" tabindex="-1" href="#">Monday 8:10-9:40</a></li>';
    dropdownhtml += '<li><a type="lecture" day="tuesday" time="11:10-12:30" tabindex="-1" href="#">Tuesday 11:10-12:30</a></li>';
    dropdownhtml += '</ul></li>';

    dropdownhtml += '<li class="dropdown-submenu">';
    dropdownhtml += '<a class="test" tabindex="-1" href="#">Lab <span class="caret"></span></a>';
    
    dropdownhtml += '<ul class="dropdown-submenu">';
    dropdownhtml += '<li><a type="lab" day="wednesday" time="8:10-9:40" tabindex="-1" href="#">Wednesday 8:10-9:40</a></li>';
    dropdownhtml += '<li><a type="lab" day="thursday" time="11:10-12:30" tabindex="-1" href="#">Thursday 11:10-12:30</a></li>';
    dropdownhtml += '</ul></li>';

    dropdownhtml += '<li class="dropdown-submenu">';
    dropdownhtml += '<a class="test" tabindex="-1" href="#">Tutorial <span class="caret"></span></a>';
    
    dropdownhtml += '<ul class="dropdown-submenu">';
    dropdownhtml += '<li><a type="tutorial" day="friday" time="8:10-9:40" tabindex="-1" href="#">Friday 8:10-9:40</a></li>';
    dropdownhtml += '<li><a type="tutorial" day="monday" time="11:10-12:30" tabindex="-1" href="#">Monday 11:10-12:30</a></li>';
    dropdownhtml += '</ul></li>';
    dropdownhtml += '</ul>'
    dropdownhtml += '</div>';

    dropdown.html(dropdownhtml);


    $('.dropdown-submenu').on("click", function(e){
        $(this).next('ul').toggle();
        e.stopPropagation();
        e.preventDefault();
      });

	  $('.dropdown-submenu a').on("click", function(e){
		var day = $(this).attr("day");
		var time = $(this).attr("time");
		var type = $(this).attr("type");

		if(day && time) {
			var text = $(this).text();
			if (text.indexOf("x") != -1) {
				$("#" + day + time.split("-")[0].split(":")[0] + time.split("-")[0].split(":")[1]).remove();
				$(this).text($(this).text().replace("x", ""));
				console.log("exists!");
			} else {
				addEvent(day, time.split("-")[0], time.split("-")[1], type, "5");
				$(this).text($(this).text() + " x");
			}
        	//addEvent("wednesday", "15:40", "17:00", "Class", "1");
    
		}
      });
});