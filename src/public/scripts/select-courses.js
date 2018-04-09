jQuery(document).ready(function($){
    var usercourses = $("#usercourses");
    var addcourses = $("#useraddcourses");
    var table = $("#selectedcourses");
    var results = $("#results");



    setTimeout(function() {
        $.each(user.courses, function(count, course) {
            table.append('<tr><td>' + course["term"] + '</td><td>' + course["subject"] + '</td><td>' + course["code"] + '</td><td><button class="btn" id="delete">Delete!</button></td></tr>');
        });
    }, 2000);



    $("#selectedcourses").on('click', '#delete', function() {
        var item = $(this).closest("tr"), tds = item.find("td");

        var courseinfo = [];
        $.each(tds, function() {
            courseinfo.push($(this).text());
        })

        removeCourse(courseinfo[0], courseinfo[1], courseinfo[2], function(data, err) {
            results.html("<h2>Successfully Removed Course!</h2>");
            $("#selectedcourses > tbody > tr").remove();
            $.each(user.courses, function(count, course) {
                table.append('<tr><td>' + course["term"] + '</td><td>' + course["subject"] + '</td><td>' + course["code"] + '</td><td><button class="btn" id="delete">Delete!</button></td></tr>');
            });
        });
    });

    $("#submit").click(function() {
        //Get Values on Submit
        var semester = $("#term option:selected").text();
        var subject = $("#subject option:selected").text().split("-")[0];
        subject = $.trim(subject);
        var code = $("#code").val();

        console.log(semester + subject + code);

        //That the code is ####
        var codetester = new RegExp('^[0-9]+$');
        if(codetester.test(code) && code.length == 4) {
            code = code + "U";
            // If semester is not the same, set the semester to the changed one
            if (user.term != semester) {
                setTerm(semester);

                //TODO: Clear current list, since aren't offered the same in different semesters
            }

            //Add Course
            addCourse(semester, subject, code, function(val, err) {
                console.log("Data: " + val);
                console.log("Err: " + err);
                if (val.length > 1) {
                    results.html("<h2> Successfully Added the Course!</h2>");
                    $("#selectedcourses > tbody > tr").remove();
                    $.each(user.courses, function(count, course) {
                        table.append('<tr><td>' + course["term"] + '</td><td>' + course["subject"] + '</td><td>' + course["code"] + '</td><td><button class="btn" id="delete">Delete!</button></td></tr>');
                    });
                } else {
                    results.html("<h2> Unable to add course! Did you make sure the code is correct?</h2>");
                }
            });
        } else {
            //TODO: Make this better
            results.html("<h2> Improper Course Code");
        }
    });






});