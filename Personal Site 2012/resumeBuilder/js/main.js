/* Arthur Chang: arthurc
 * Elizabeth Keller: eakeller
 */
var currStep = 0;
var steps =['welcome', 'nameInput', 'contact', 'education', 'experience', 'projects', 'skills', 'signature', 'done'];


window.onload = function(){
    canvas = document.getElementById('sig');
    ctx = canvas.getContext('2d');

    ctx.fillStyle='#f1f1f1';
    ctx.fillRect(0, 0, 300, 100);

    var defaultsSet = false;
    var transitioning = false;

    var resume = $('#resume');
    var header = $('#header');

    var maxStep = steps.length - 1;

    $('#back').hide();

    $('#next').click(function () {
        if (transitioning === true)
            return;


        switch(steps[currStep]) {
            case 'nameInput':
                var name = $('#name').val();
                if (name !== '') {
                    if ($('#fullName').length == 0) {
                        header.append('<div id="fullName">' + name + '</div>');
                    } else {
                        $('#fullName').html(name);
                    }
                }
                break;
            case 'contact':
                var num = $('#phoneNum').val();
                var email = $('#email').val();
                var addr = $('#address').val();
                if ($('#cInfo').length == 0) {
                    header.append('<div id="cInfo"></div>');
                } else {
                    $('#cInfo').html('');
                }
                $('#cInfo').append('<div class="cItem">' + email + '</div>');
                $('#cInfo').append('<div class="cItem">' + num + '</div>');
                $('#cInfo').append('<div class="cItem">' + addr + '</div>');
                break;
            case 'signature':
                var sigURL = canvas.toDataURL();
                if(document.getElementById('siggy') === null)
                    $('#resume').append('<div id="sigImg"><img id="siggy" /></div>');
                $('#siggy').attr('src', sigURL);
                break;
            case 'projects':
                submitProject();
                break;
            case 'experience':
                submitExperience();
                break;
            case 'education':
                submitSchool();
                break;
            case 'skills':
                submitSkills();
                break;
            default:
                break;
        }


        if (currStep < maxStep) {
            transitioning = true;
            $('#' + steps[currStep]).fadeToggle(250, 'linear', function () {
                currStep += 1;
                $('#' + steps[currStep]).fadeToggle(250, 'linear');
                transitioning = false;
                if (currStep > 0) {
                    $('#back').show();
                }
                else {
                    $('#back').hide();
                }
                if (currStep < maxStep) {
                    $('#next').show();
                }
                else {
                    $('#next').hide();
                }
            });
        }
        /* When transitioning from the last form to the last step, generate the code */
        if(currStep === steps.length-2)
            produceHTML();
    });

    $('#addProject').click(function() {
        submitProject();
    });

    $('#addSchool').click(function() {
        submitSchool();
    });

    $('#addJob').click(function() {
        submitExperience();
    });

    $('#addSkillList').click(function() {
        submitSkills();
    });


    $('#back').click(function () {
        if (transitioning === true)
            return;
        if (currStep > 0) {
            transitioning = true;
            $('#' + steps[currStep]).fadeToggle(250, 'linear', function () {
                currStep -= 1;
                $('#' + steps[currStep]).fadeToggle(250, 'linear');
                transitioning = false;
                if (currStep > 0) {
                    $('#back').show();
                }
                else {
                    $('#back').hide();
                }
                if (currStep < maxStep) {
                    $('#next').show();
                }
                else {
                    $('#next').hide();
                }
            });
        }
    });

    // Show Form Window 
    $('#form').slideToggle();
    $('#welcome').fadeToggle();
    $('#dimmer').toggle();
    

    $('#preview').click(function () {
        $('#form').slideToggle();
        $('#dimmer').toggle();
        $('#edit').toggle();
    });

    $('#edit').click(function () {
        $('#form').slideToggle();
        $('#dimmer').toggle();
        $('#edit').toggle();
    });

    $('#fbLogin').click(function(){
        FB.login(function(){
        },{scope: 'email, user_work_history, user_education_history'});
    });
    $('#fbLogout').click(function(){
        FB.logout()
    });

    var onCanvas = false;

    $(canvas).mousedown(function() {
        ctx.beginPath();
        onCanvas = true;
    }).mouseup(function() {
        onCanvas = false;
    });

    $(canvas).mousemove(function(e) {
        if (onCanvas === true) {
            draw(ctx, e);
        }
    });

    $('#clearCanvas').click(function () {
        ctx.fillStyle='#f1f1f1';
        ctx.fillRect(0, 0, 300, 100);
    });

    
    $('#fbLogout').hide(); // Firefox requirement
    /* FACEBOOK SDK/API EXAMPLE CODE - with our code inside */
    window.fbAsyncInit = function() {
        FB.init({
          appId      : '390646274340088', // App ID
          channelUrl : '//localhost:8080/channel.html', // Channel File
          status     : true, // check login status
          cookie     : true, // enable cookies to allow the server to access the session
          xfbml      : true  // parse XFBML
        });

        /* OUR CODE */
        FB.Event.subscribe('auth.statusChange',function(response) {
            if (response.status === 'connected') {
                if (defaultsSet === false)
                    getFacebookData(response.authResponse.accessToken);

                $('#fbLogin').hide();
                $('#fbLogout').show();
            } else {
                $('#fbLogout').hide();
                $('#fbLogin').show();
            }
        });
        /* END OUR CODE */
    };

    // Load the SDK Asynchronously
    (function(d){
        var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
        if (d.getElementById(id)) {return;}
        js = d.createElement('script'); js.id = id; js.async = true;
        js.src = "//connect.facebook.net/en_US/all.js";
        ref.parentNode.insertBefore(js, ref);
    }(document));
    /* END FACEBOOK CODE */

}

function submitProject() {
    var title = $('#projectTitle').val();
    var details = [];
    details[0] = $('#details1').val();
    details[1] = $('#details2').val();
    details[2] = $('#details3').val();
    var link = $('#projectLink').val();

    if (title === '') {
        return;
    }

    if ($('#proj').length == 0) {
        $('#col2').append('<div id="proj"><h5>Projects</h5></div>');
        $('#proj').append('<div id="addProj" class="button">+</div>');
        $('#addProj').click(function() {
            jumpTo('projects');
        });
    }

    var prj = $('<div class="project"></div>');
    prj.append('<h4>' + title + '</h4>');
    if (details[0] !== '') {
        prj.append('<h3>' + details[0] + '</h3>');
    }
    if (details[1] !== '') {
        prj.append('<h3>' + details[1] + '</h3>');
    }
    if (details[2] !== '') {
        prj.append('<h3>' + details[2] + '</h3>');
    }
    if (link !== '') {
        //should also validate that this is an actual link
        prj.append('<h3><a href=' + link + '>' + link + '</a></h3>');
    }
    prj.append('<div class="delButton button">x</div>');
    $('#proj').append(prj);

    $('.delButton').hide();

    $('#projectTitle').val('');
    $('#details1').val('');
    $('#details2').val('');
    $('#details3').val('');
    $('#projectLink').val('');

    $('.project').mouseover(function() {
        $(this).children('.delButton').show();
    }).mouseout(function() {
        $(this).children('.delButton').hide();
    });

    $('.delButton').click(function() {
        $(this).parent().remove();
    })
}

function submitExperience() {
    var title = $('#jobTitle').val();
    var employer = $('#employer').val();
    var details = [];
    details[0] = $('#detail1').val();
    details[1] = $('#detail2').val();
    details[2] = $('#detail3').val();
    var dates = $('#dates').val();

    if (title === '' || employer === '' || dates === '') {
        return;
    }

    if ($('#expr').length == 0) {
        $('#col1').append('<div id="expr"><h5>Experience</h5></div>');
        $('#expr').append('<div id="addExpr" class="button">+</div>');

        $('#addExpr').click(function() {
            jumpTo('experience');
        });
    }

    var job = $('<div class="job"></div>');
    job.append('<h4>' + title + '</h4>');
    job.append('<h4>' + employer + '</h4>');
    if (details[0] !== '') {
        job.append('<h3>' + details[0] + '</h3>');
    }
    if (details[1] !== '') {
        job.append('<h3>' + details[1] + '</h3>');
    }
    if (details[2] !== '') {
        job.append('<h3>' + details[2] + '</h3>');
    }
    if (dates !== '') {
        //should also validate that this is an actual link
        job.append('<h3>' + dates + '</h3>');
    }
    job.append('<div class="delButton button">x</div>');
    $('#expr').append(job);

    $('.delButton').hide();

    $('#jobTitle').val('');
    $('#employer').val('');
    $('#detail1').val('');
    $('#detail2').val('');
    $('#detail3').val('');
    $('#dates').val('');

    $('.job').mouseover(function() {
        $(this).children('.delButton').show();
    }).mouseout(function() {
        $(this).children('.delButton').hide();
    });

    $('.delButton').click(function() {
        $(this).parent().remove();
    })
}

function submitSkills() {
    var skillType = $('#skillType').val();
    var skills = $('#skillList').val();

    if (skillType === '' || skills === '') {
        return;
    }

    if ($('#skillTitle').length == 0) {
        $('#footer').append('<div id="skillTitle"><h5>Skills</h5></div>');
        $('#skillTitle').append('<div id="addSkill" class="button">+</div>');

        $('#addSkill').click(function() {
            jumpTo('skills');
        });
    }

    var skill = $('<div class="skill"></div>');
    skill.append('<h4>' + skillType + '</h4>');
    skill.append('<h3>' + skills + '</h3>');
    skill.append('<div class="delButton button">x</div>');
    $('#skillTitle').append(skill);

    $('.delButton').hide();

    $('#skillType').val('');
    $('#skillList').val('');

    $('.skill').mouseover(function() {
        $(this).children('.delButton').show();
    }).mouseout(function() {
        $(this).children('.delButton').hide();
    });

    $('.delButton').click(function() {
        $(this).parent().remove();
    });
}

function submitSchool() {
    var school = $('#school').val();
    var degree = $('#degree').val();
    var gpa = $('#gpa').val();
    var graduation = $('#graduation').val();

    if (school === '' || degree === '' || graduation === '') {
        return;
    }

    if ($('#edu').length == 0) {
        $('#col3').append('<div id="edu"><h5>Education</h5></div>');
        $('#edu').append('<div id="addEdu" class="button">+</div>');
        $('#addEdu').click(function() {
            jumpTo('education');
        });
    }
    var sch = $('<div class="school"></div>');
    //should have some validation that requires everything except for gpa
    sch.append('<h4>' + school + '</h4>');
    sch.append('<h3>' + degree + '</h3>');
    if (gpa !== '') {
        //gpa is not required
       sch.append('<h3>' + gpa + '</h3>');
    }
    sch.append('<h3>' + graduation + '</h3>');
    sch.append('<div class="delButton button">x</div>');
    $('#edu').append(sch);

    $('.delButton').hide();

    $('#school').val('');
    $('#degree').val('');
    $('#gpa').val('');
    $('#graduation').val('');

    $('.school').mouseover(function() {
        $(this).children('.delButton').show();
    }).mouseout(function() {
        $(this).children('.delButton').hide();
    });

    $('.delButton').click(function() {
        $(this).parent().remove();
    })
}

function draw(ctx, evt) {
    var mousePos = getMousePos(canvas, evt);
    var offsetS = $('#sig').offset();
    var x = mousePos.x - offsetS.left;
    var y = mousePos.y - offsetS.top;

    ctx.fillStyle = 'black';
    ctx.strokeSyle = 'black';
    ctx.lineTo(x,y);
    ctx.stroke();
}

function getMousePos(canvas, evt) {
    // return relative mouse position
    var mouseX = evt.clientX;
    var mouseY = evt.clientY;
    return {
      x: mouseX,
      y: mouseY
    };
};

function jumpTo(destination) {
    var i = $.inArray(destination, steps);
    $('#' + steps[currStep]).hide();
    $('#' + steps[i]).show();
    if (i == 0)
        $('#back').hide();
    else
        $('#back').show();

    if (i == steps.length)
        $('#next').hide();
    else
        $('#next').show();

    currStep = i;
    $('#form').slideToggle();
    $('#dimmer').toggle();
    $('#edit').toggle();
}

function getFacebookData(accessToken) {
    var path = "https://graph.facebook.com/me?";
    var queryParams = ['access_token=' + accessToken, 'callback=setDefaults'];
    var query = queryParams.join('&');
    var url = path + query;

    // user jsonp to call the graph
    var script = document.createElement('script');
    script.src = url;
    document.body.appendChild(script);
}

function setDefaults(result) {
    var education;
    var work;

    if (result != null) {
        defaultsSet = true;
        if (result.name != undefined)
            $('#name').val(result.name);
        if (result.email != undefined)
            $('#email').val(result.email);

        /* Pick first school which is not a High School, else pick first school
         * or first high school */
        if (result.education != undefined) {
            /* Only one school */
            if ( result.education.length == undefined)
                education = result.education;
            else {
                for (var i = 0; i < result.education.length; i++) {
                    if (result.education[i].type != "High School") {
                        education = result.education[i];
                        break;
                    }
                }
                if (i >= result.education.length)
                    education = result.education[0];
            }

            if (education.school != undefined)
                $('#school').val(education.school.name);

            if (education.concentration != undefined) 
                /* Only one concentration */
                if (education.concentration.length === undefined) 
                    $('#degree').val(education.concentration.name);
                else
                    $('#degree').val(education.concentration[0].name);
            
            if (education.year != undefined)
                $('#graduation').val(education.year.name);
        }

        /* Pick the first work place */
        if (result.work != undefined) {
            /* Only one work */
            if ( result.work.length == undefined)
                work = result.work;
            else {
                work = result.work[0];
            }

            if (work.position != undefined)
                $('#jobTitle').val(work.position.name);

            if (work.employer != undefined) 
                $('#employer').val(work.employer.name);
            
            if (work.start_date != undefined && work.end_date != undefined)
                $('#dates').val("From " + work.start_date + " to " + work.end_date);
            if (work.start_date != undefined && work.end_date === undefined)
                $('#dates').val("From " + work.start_date + " to Present");

        }
    }
}

function produceHTML(){
    /* PREPARE STUFF */
    var site = $("html").clone();
    var newHead = '<head> <title>Resume</title> <link rel="stylesheet" href="css/reset.css" /><link rel="stylesheet" type="text/css" href="css/resumeStyle.css" /></head>';

    /* REMOVE STUFF */
    site.find("head").replaceWith(newHead);
    site.find("#form").remove().end();
    site.find("#edit").remove().end();
    site.find("#dimmer").remove().end();
    site.find("#fb-root").remove().end();
    site.find("script").remove().end();
    site.find(".button").remove().end();

    /* SWAP */
    $("#resumeHTML").val("<html>" + site.html() + "</html>");
}
