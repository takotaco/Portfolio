$(window).ready(function() {
	$('#home').show();
	$('#salonInfo').hide();
	$('#takoInfo').hide();
	$('#flowInfo').hide();
	$('#resumeBuilderInfo').hide();
});

$('.projLink').click(function () {
	console.log("clicked the thing");
	var type = $(this).attr('id');
	if (type === 'salon') {
		$('#salonInfo').show();
		$('#takoInfo').hide();
		$('#flowInfo').hide();
		$('#home').hide();
		$('#resumeBuilderInfo').hide();
	}
	if (type === 'tako') {
		$('#takoInfo').show();
		$('#salonInfo').hide();
		$('#flowInfo').hide();
		$('#home').hide();
		$('#resumeBuilderInfo').hide();
	}
	if (type === 'flow') {
		$('#flowInfo').show();
		$('#takoInfo').hide();
		$('#salonInfo').hide();
		$('#home').hide();
		$('#resumeBuilderInfo').hide();
	}
	if (type === 'home') {
		$('#home').show();
		$('#flowInfo').hide();
		$('#takoInfo').hide();
		$('#salonInfo').hide();
		$('#resumeBuilderInfo').hide();
	}
	if (type == 'rBuilder') {
		$('#resumeBuilderInfo').show();
		$('#home').hide();
		$('#flowInfo').hide();
		$('#takoInfo').hide();
		$('#salonInfo').hide();
	}
});