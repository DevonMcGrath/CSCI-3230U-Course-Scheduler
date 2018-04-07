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
	
	var inSchedule = {};

    function addEvent(day, starttime, endtime, msg, type) {
		inSchedule[day + starttime.split(":")[0] + starttime.split(":")[1]] = 1;
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

	function convertTohhmm(minutes) {
		var hours = Math.floor(minutes / 60);
		var minutes = minutes % 60;
		return (hours + ":" + minutes);
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
	var courseColours = {};

	setTimeout(function() {
		courses = user.courses;
		$.each(courses, function(count, course) {
			courseColours[course["code"]] = count + 1;
			dropdownhtml += "<div>";
			dropdownhtml += "Course: " + course["subject"] + course["code"];
			dropdownhtml += 'Lecture: <select id="' + course["subject"] + course["code"] + 'lecture"></select>';
			dropdownhtml += 'Laboratory: <select id="' + course["subject"] + course["code"] + 'laboratory"></select>';
			dropdownhtml += 'Tutorial: <select id="' + course["subject"] + course["code"] + 'tutorial"></select>';
			dropdownhtml += "</div>";
			count++;

		});
		
		dropdown.html(dropdownhtml);

		$.each(courses, function(count, course) {
			getSections(course["term"], course["subject"], course["code"], function(data, err) {
				var lecture = $("#" + course["subject"] + course["code"] + 'lecture');
				var laboratory = $("#" + course["subject"] + course["code"] + 'laboratory');
				var tutorial = $("#" + course["subject"] + course["code"] + 'tutorial');
				lecture.append("<option> </option>");
				laboratory.append("<option> </option>");
				tutorial.append("<option> </option>");
				$.each(data, function(key, courses) {
					if(courses["times"][0]["scheduleType"] == "Laboratory"){
						laboratory.append('<option value="' + course["code"] + ":" +courses["times"][0]["day"] + ":" + convertTohhmm(courses["times"][0]["start"]) + "-" + convertTohhmm(courses["times"][0]["end"]) + ':Laboratory:'+ courses["crn"] + '">' + courses["times"][0]["day"]+ ":" + convertTohhmm(courses["times"][0]["start"]) + "-" + convertTohhmm(courses["times"][0]["end"]) + "</option>");
					} 
					if(courses["times"][0]["scheduleType"] == "Tutorial"){
						laboratory.append('<option value="' + course["code"] + ":" + courses["times"][0]["day"] + ":" + convertTohhmm(courses["times"][0]["start"]) + "-" + convertTohhmm(courses["times"][0]["end"]) + ':Tutorial:' + courses["crn"] + '">' + courses["times"][0]["day"] + ":" + convertTohhmm(courses["times"][0]["start"]) + "-" + convertTohhmm(courses["times"][0]["end"]) + "</option>");
					} 
					if(courses["times"][0]["scheduleType"] == "Lecture"){
						var times = "";
						$.each(courses["times"], function(amt, time) {
							times += time["day"] + ":" + convertTohhmm(time["start"]) + "-" + convertTohhmm(time["end"]) + ":";
						});
						lecture.append('<option value="' + course["code"] + ":" + times + 'Lecture:' + courses["crn"] + '">' + times + '</option>');
					} 
				});
			});
		});
		$('select').on('change', function(e) {
			var optionSelected = $("option:selected", this);
			if(this.value) {
			var valueSelected = this.value.split(":");
			var day;
			switch (valueSelected[1]) {
				case "M":
					day = "monday";
					break;
				case "T":
					day = "tuesday";
					break;
				case "W":
					day = "wednesday";
					break;
				case "R":
					day = "thursday";
					break;
				case "F":
					day = "friday";
					break;
			}
			var startTime;
			var endTime;
			if (valueSelected.length > 7) {
				startTime = valueSelected[2] + ":" + valueSelected[3].split("-")[0];
				endTime = valueSelected[3].split("-")[1] + ":" + valueSelected[4];
				if (inSchedule[day + startTime.split(":")[0] +startTime.split(":")[1]] == 1) {
					$("#" + day + startTime.split(":")[0] +startTime.split(":")[1]).remove();
					inSchedule[day + startTime.split(":")[0] +startTime.split(":")[1]] = 0;
				} else {
					addEvent(day, startTime, endTime, valueSelected[0] + " " + valueSelected[9] + " CRN:" + valueSelected[10], courseColours[valueSelected[0]]);
				}
				switch (valueSelected[5]) {
					case "M":
						day = "monday";
						break;
					case "T":
						day = "tuesday";
						break;
					case "W":
						day = "wednesday";
						break;
					case "R":
						day = "thursday";
						break;
					case "F":
						day = "friday";
						break;
				}
				startTime = valueSelected[6] + ":" + valueSelected[7].split("-")[0];
				endTime = valueSelected[7].split("-")[1] + ":" + valueSelected[8];
				if (inSchedule[day + startTime.split(":")[0] +startTime.split(":")[1]] == 1) {
					$("#" + day + startTime.split(":")[0] +startTime.split(":")[1]).remove();
					inSchedule[day + startTime.split(":")[0] +startTime.split(":")[1]] = 0;
				} else {
					addEvent(day, startTime, endTime, valueSelected[0] + " " + valueSelected[9] + " CRN:" + valueSelected[10], courseColours[valueSelected[0]]);
				}
			} else {
				startTime = valueSelected[2] + ":" + valueSelected[3].split("-")[0];
				endTime = valueSelected[3].split("-")[1] + ":" + valueSelected[4];
				if (inSchedule[day + startTime.split(":")[0] +startTime.split(":")[1]] == 1) {
				
					$("#" + day + startTime.split(":")[0] +startTime.split(":")[1]).remove();
					inSchedule[day + startTime.split(":")[0] +startTime.split(":")[1]] =  0;
				} else {
					addEvent(day, startTime, endTime, valueSelected[0] + " " + valueSelected[5] + " CRN:" +valueSelected[6], courseColours[valueSelected[0]]);
				}
			}
		}

		});
	}, 2000);






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