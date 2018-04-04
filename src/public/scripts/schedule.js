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

    $("#course1").mouseup(function() {
        selected_value = $("input[name='course1']:checked").val();
        if (selected_value) {
            times = selected_value.split("-");
            $("#" + times[0] + times[1].split(":")[0] + times[1].split(":")[1]).remove();
        }
    }).change(function() {
        selected_value = $("input[name='course1']:checked").val();
        if (selected_value) {
            times = selected_value.split("-");
            addEvent(times[0], times[1], times[2], "Course 1", "3");
        }
    });
    
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
});