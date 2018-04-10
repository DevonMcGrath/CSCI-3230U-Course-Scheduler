jQuery(document).ready(function($){
	//Variables needed for the project

	//Dropdown Menu Variables
	var dropdown = $("#dropdown");				//The Dropdown Div Object
	var dropdownhtml = dropdown.html();			//Current HTML To store
	var courseColours = {};						//Course Colours, based on "coursetime":n, where n is a number from 1-x 
	var inSchedule = {};						//Keeping track of which courses are in the schedule to remove them if selected again

	//Global variables for time slot blocks
    var timeLineStart = 0;
    var EventSlotHeight = 0;
    var TimeLineUnitDuration = 0;


	// =======================================================================================================================================================
	// This code is utilized and heavily modified from to get the basic idea of a schedule. The addition of events
	//     and dynamic allocations are not seen within the source while they are added here to ensure functionality
	//	   works for our project.
	// Source: https://github.com/CodyHouse/schedule-template
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
	var objSchedulesPlan = []; 
	if( schedules.length > 0 ) {
		schedules.each(function(){
			//create SchedulePlan objects
			objSchedulesPlan.push(new SchedulePlan($(this)));
		});
	}
	
	function getScheduleTimestamp(time) {
		//accepts hh:mm format - convert hh:mm to timestamp
		time = time.replace(/ /g,'');
		var timeArray = time.split(':');
		var timeStamp = parseInt(timeArray[0])*60 + parseInt(timeArray[1]);
		return timeStamp;
	}
	// =======================================================================================================================================================




	// Dynamic adding of events 
	// Params:
	// day 			= Monday,Tuesday,Wednesday,Thursday,Friday
	// starttime 	= hh:mm
	// endtime		= hh:mm
	// msg			= Message to fill in the box
	// type			= Colour type, from 1 - n, current n is 5 as this is found in css
    function addEvent(day, starttime, endtime, msg, type) {
		//Add the event into inSchedule to keep track of the event
		inSchedule[day + starttime.split(":")[0] + starttime.split(":")[1]] = 1;

		//Get the li from the html to add events to it
		var currentString = $("#" + day).html();

		// Convert the start time to a timestamp and get the duration, needed to find the length of the box
		var start = getScheduleTimestamp(starttime),
			duration = getScheduleTimestamp(endtime) - start;

		// Calculate pixel lengths of where to start and how tall the box is
		var top = EventSlotHeight * (start - timeLineStart) / TimeLineUnitDuration,
			height = EventSlotHeight * duration / TimeLineUnitDuration;

		//Add the box events
		//	Format is											v Colour      v Size of box
		//	<li id="start-end" class="single-event" data-event="event-n" style="top: px; height: px">
		//		<a href="#0">
		//			<span class="event-date">The time in the top of the box</span>
		//			<em class="event-name"> Text Inside Box</em>
		//		</a>
		//	</li>
		currentString += '<li id="' + (day + starttime.split(":")[0] + starttime.split(":")[1]) + '" class="single-event" data-event="event-' + type + '"';
		currentString += ' style="top: ' + (top - 1) + 'px; height: ' + (height - 1) + 'px;">';
		currentString += '<a href="#0"><span class="event-date">' + starttime + ' - ' + endtime + '</span>';
		currentString += '<em class="event-name">' + msg + '</em></a></li>';

		//Append to the list
		$("#" + day).html(currentString); 
    }


	//Function to convert minutes to hh:mm as the values are scraped in minutes
	function convertTohhmm(minutes) {
		var hours = ''+Math.floor(minutes / 60);
		if (hours.length == 1) {
			hours = '0' + hours;
		}
		var minutes = '' + (minutes % 60);
		if (minutes.length == 1) {
			minutes = '0' + minutes;
		}
		return (hours + ":" + minutes);
	}


	addSetTermListener(function(data, err) {
		clearTable();
		$("#dropdown div").empty();
		loadCourses();
	});

	function loadCourses() {
		usercourses = user.courses;
		dropdownhtml = "<h2>Select your courses here!</h2>";
		$.each(usercourses, function(count, course) {
			if (course.term == user.term) {
				//Make divs for each lecture/lab/tutorial to attach to.
				courseColours[course["code"]] = count + 1;
				dropdownhtml += "<div>";
				dropdownhtml += "Course: " + course["subject"] + course["code"];
				dropdownhtml += 'Lecture: <select id="' + course["subject"] + course["code"] + 'lecture"></select>';
				dropdownhtml += 'Laboratory: <select id="' + course["subject"] + course["code"] + 'laboratory"></select>';
				dropdownhtml += 'Tutorial: <select id="' + course["subject"] + course["code"] + 'tutorial"></select>';
				dropdownhtml += "</div>";
				count++;
			}

		});
		dropdown.html(dropdownhtml);


		//Fill in each lecture/lab/tutorial
		$.each(usercourses, function(count, course) {
			getSections(course["term"], course["subject"], course["code"], function(data, err) {
				//Get each HTML Object to append to
				var lecture = $("#" + course["subject"] + course["code"] + 'lecture');
				var laboratory = $("#" + course["subject"] + course["code"] + 'laboratory');
				var tutorial = $("#" + course["subject"] + course["code"] + 'tutorial');

				//Append Empty Objects to allow first item to be selected
				lecture.append("<option> </option>");
				laboratory.append("<option> </option>");
				tutorial.append("<option> </option>");

				//Cycle through each "data" that we got from getSections to parse and append to the proper HTML Object
				$.each(data, function(key, courses) {
					// The way each element is appended is to store each cruicial piece of information in the "Value" which in thise case is COURSE:STARTTIME:ENDTIME
					//		then print it out for the user to select it
					if(courses["times"][0]["scheduleType"] == "Laboratory"){
						laboratory.append('<option value="' + course["code"] + ":" +courses["times"][0]["day"] + ":" + convertTohhmm(courses["times"][0]["start"]) + "-" + convertTohhmm(courses["times"][0]["end"]) + ':Laboratory:'+ courses["crn"] + '">' + courses["times"][0]["day"]+ ":" + convertTohhmm(courses["times"][0]["start"]) + "-" + convertTohhmm(courses["times"][0]["end"]) + "</option>");
					} 
					if(courses["times"][0]["scheduleType"] == "Tutorial"){
						tutorial.append('<option value="' + course["code"] + ":" + courses["times"][0]["day"] + ":" + convertTohhmm(courses["times"][0]["start"]) + "-" + convertTohhmm(courses["times"][0]["end"]) + ':Tutorial:' + courses["crn"] + '">' + courses["times"][0]["day"] + ":" + convertTohhmm(courses["times"][0]["start"]) + "-" + convertTohhmm(courses["times"][0]["end"]) + "</option>");
					} 
					if(courses["times"][0]["scheduleType"] == "Lecture"){
						//Lecture needs to be modified, as there's 2 times commonly per 1 selection
						var times = "";
						$.each(courses["times"], function(amt, time) {
							times += time["day"] + ":" + convertTohhmm(time["start"]) + "-" + convertTohhmm(time["end"]) + ":";
						});
						lecture.append('<option value="' + course["code"] + ":" + times + 'Lecture:' + courses["crn"] + '">' + times + '</option>');
					} 
				});
			});
		});
		
		// A listener on the "select" change
		$('select').on('change', function(e) {
			
			// Since we have an "empty" value intiailized, we need to make sure we work if it doesn't select the empty value
			if(this.value) {
				var valueSelected = this.value.split(":");
				var day;

				//Convert number into word
				
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
				
				//Lectures have double times, so we add events twice
				if (valueSelected.length > 7) {
					//Parse the Time Values
					startTime = valueSelected[2] + ":" + valueSelected[3].split("-")[0];
					endTime = valueSelected[3].split("-")[1] + ":" + valueSelected[4];

					// Check if the
					if (inSchedule[day + startTime.split(":")[0] +startTime.split(":")[1]] == 1) {
						$("#" + day + startTime.split(":")[0] +startTime.split(":")[1]).remove();
					inSchedule[day + startTime.split(":")[0] +startTime.split(":")[1]] = 0;
					} else {
						addEvent(day, startTime, endTime, valueSelected[0] + " " + valueSelected[9] + "<br />CRN:" + valueSelected[10], courseColours[valueSelected[0]]);
					}

					//Second Time Slot
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
						alert("Time Conflict! Removing the time slot. Please reselect");
						$("#" + day + startTime.split(":")[0] +startTime.split(":")[1]).remove();
						inSchedule[day + startTime.split(":")[0] +startTime.split(":")[1]] = 0;
					} else {
						addEvent(day, startTime, endTime, valueSelected[0] + " " + valueSelected[9] + "<br />CRN:" + valueSelected[10], courseColours[valueSelected[0]]);
					}

				//Else a Lab/Tutorial
				} else {
					startTime = valueSelected[2] + ":" + valueSelected[3].split("-")[0];
					endTime = valueSelected[3].split("-")[1] + ":" + valueSelected[4];
					if (inSchedule[day + startTime.split(":")[0] +startTime.split(":")[1]] == 1) {
						$("#" + day + startTime.split(":")[0] +startTime.split(":")[1]).remove();
						inSchedule[day + startTime.split(":")[0] +startTime.split(":")[1]] =  0;
					} else {
						addEvent(day, startTime, endTime, valueSelected[0] + " " + valueSelected[5] + "<br />CRN:" +valueSelected[6], courseColours[valueSelected[0]]);
					}
				}
			}});
	}

	//Open
	$('[data-popup-open]').on('click', function(e) {
		//Hide the background table
		$(".cd-schedule").hide();
		$("#crns > p").remove();

		courseinfo = [];
		//Get all the CRN Info
		$.each(inSchedule, function(data) {
			html = $("#" + data + " em").html();
			course = html.split("<br>")[0]
			crn = html.split("<br>")[1];
			courseinfo.push(course + ": " + crn.split(":")[1]);
			console.log(course + ": " + crn.split(":")[1]);
		});

		courseinfo = jQuery.unique(courseinfo);
		var fileData = '';
		
		$.each(courseinfo, function(data) {
			$("#crns").append("<p>" + courseinfo[data] + "</p>");
			fileData += courseinfo[data] + '\r\n';
		});
		if (fileData.length > 0) {
			download('crns-' + user.term, fileData);
		}

		var target = $(this).attr('data-popup-open');
		$('[data-popup="' + target + '"]').fadeIn(350);
		e.preventDefault();
	})

	$('[data-popup-close]').on('click', function(e) {
		$(".cd-schedule").show();
		var target = $(this).attr('data-popup-close');
		$('[data-popup="' + target + '"]').fadeOut(350);
		e.preventDefault();
	})

	function clearTable() {
		$.each(inSchedule, function(data) {
			$("#" + data).remove();
		});
	}

	//Filling in the select options, waiting 2 seconds on load to ensure everythings loaded in properly
	setTimeout(function() {
		loadCourses();
	}, 2000);
});