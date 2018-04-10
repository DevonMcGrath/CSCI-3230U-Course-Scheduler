jQuery(document).ready(function($){
    //Variables used within select courses
    var usercourses = $("#usercourses");
    var addcourses = $("#useraddcourses");
    var table = $("#selectedcourses");
    var results = $("#results");


    // ============= Functions ===============

    // Convert the number semester into a legible value
    function convertSemeseter(input) {
        year = input.slice(0, 4);
        semester = (input.slice(4) == '01') ? "Winter" : (input.slice(4) == '05') ? "Summer" : "Fall";
        return semester + " " + year;
    }


    //Refresh the select-courses table by removing old values and repopulating it
    function refreshTable() {
        $("#selectedcourses > tbody > tr").remove();
            $.each(user.courses, function(count, course) {
                table.append('<tr><td>' + convertSemeseter(course["term"]) + '</td><td>' + course["subject"] + '</td><td>' + course["code"] + '</td><td><button class="btn" id="delete">Delete!</button></td></tr>');
            });
    }


    // ============= Waiting for JavaScript to Load ==========

    //Wait 2 seconds for javascript to load and once that is loaded
    // the user object is accessible
    setTimeout(function() {
        refreshTable();
        if (user.term) {
            $("#term").append('<option value="' + user.term + '">' + user.term + '</option>');
        } else {
            results.html("<h2>Term not selected!</h2>");
        }
    }, 2000);



    // ================= Listenters ==================
    addAddCourseListener(function(data, err) {
        refreshTable();
    });

    addRemoveCourseListener(function(data, err) {
        refreshTable();
        results.html("<h2>Successfully removed the course!</h2>");
    });

    addSetTermListener(function(data, err) {
        $("#term > option").remove();
        $("#term").append('<option value="' + user.term + '">' + user.term + '</option>');
    });

    $("#selectedcourses").on('click', '#delete', function() {
        var item = $(this).closest("tr"), tds = item.find("td");
        var courseinfo = [];
        $.each(tds, function() {
            courseinfo.push($(this).text());
        })
        
        var localterm = courseinfo[0].split(" ")[1] + ((courseinfo[0].split(" ")[1] == "Winter") ? "01" : courseinfo[0].split(" ")[1] == "Summer" ? "05" : "09");
        removeCourse(localterm, courseinfo[1], courseinfo[2], function(data, err) {
            results.html("<h2>Successfully Removed Course!</h2>");
            refreshTable();
        });
    });

    $("#submit").click(function() {
        //Get Values on Submit
        var semester = $("#term option:selected").text();
        var subject = $("#subject option:selected").text().split("-")[0];
        subject = $.trim(subject);
        var code = $("#code").val();
        $("#code").val('');

        //That the code is ####
        var codetester = new RegExp('^[0-9]+$');
        if(codetester.test(code) && code.length == 4) {
            code = code + "U";
            addCourse(semester, subject, code, function(val, err) {
                if (val.length > 1) {
                    results.html("<h2> Successfully Added the Course!</h2>");
                    refreshTable()
                } else {
                    results.html("<h2> Unable to add course! Did you make sure the code is correct or maybe it already exists?</h2>");
                }
            });
        } else {
            results.html("<h2> Improper Course Code</h2>");
        }
    });
});

$(document).keypress(function(e) {
    if(e.which == 13) {
        $('#submit').trigger('click');
    }
});