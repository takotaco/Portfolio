/* 
Arthur Chang (arthurc)
Elizabeth Keller (eakeller)
Kenneth Murphy (kmmurphy)
*/

var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

// Timer Variables
var intervalId;
var timerDelay = 100;

// Overall Game State Variables
var sushiTypes = ["salmon maki", "hand roll", "tamago nigiri", "rice paper maki", "octopus"];
var sushiIndexes = [0, 1, 2, 3, 4];
var sushiWeights = [20,20,20,20,20];
var plateColors = ["#D73232", "#D77D32", "#1E8181", "#28AC28", "#AC2873"];
var platePoints = [10, 15, 20, 50, 100];
var plateIndexes = [0,1,2,3,4];
var plateWeights = [30, 30, 25, 20, 15];


// Game Variables
var maxPlates = 16;
var maxOctosMissed = 5;
var maxLevel = 5;
var octosPerLevel = 10;
var startingSpeed = 2*Math.PI/8/15;
var maxPlateTimer = 200;
var startingRotMax = 200;

var button = ["F","C","X","Z","A","W","E","R"];
var leavingSoon = 10;
var numTentacles = 8; // Because it's an octopus
var numSubsections = 4;
var maxAvailTentacles = 8;

var game = new Game(maxPlates, maxOctosMissed, maxLevel, octosPerLevel, startingSpeed, maxPlateTimer, startingRotMax); // create first game
var table = new Table();
var segments = new Segments();
var plates = new Plates();
var octopus = new Octopus(maxAvailTentacles);
var woctopus = new Octopus(maxAvailTentacles);
var pausePlates = new Plates(); // for pause screen

var gameWon = false;
var gameOver = false;
var isStarted = false;
var isPaused = false;
var startOct = false;

/*********************************************
 * Random Functions
 ********************************************/
function getWeightedRandom(weights,items) {
	var totalWeight = 0, cumWeight = 0;
	var random, i;

	// sum up the weights
	for (i = 0; i < weights.length; i++)
		totalWeight += weights[i];

	random = Math.floor(Math.random() * totalWeight);

	// now find which bucket our of random value is in
	for (i = 0; i < weights.length; i++) {
		cumWeight += weights[i];
		if (random < cumWeight)
			return items[i];
	}
}

/*********************************************
 * Octopus and Tentacle Functions and Objects
 ********************************************/
function Tentacle (X, Y, xDest, yDest, id) {
	// Fields
	this.tentacleId = id;
	// ranked largest to smallest
	// x and y coordinates of the subsections of the tentacle
	this.xPos = [];
	this.yPos = [];
	// radii of the subsections
	this.radii = [];

	var c = numSubsections / 100;
	for ( var i = 0; i < numSubsections; i++) { 
		this.xPos.push(X);
		this.yPos.push(Y);
		this.radii.push(canvas.width * c / (Math.pow(2,i)));
	}

	// destination targets for retracting and extending an arm
	this.xDest = xDest;
	this.yDest = yDest;
	
	this.xHome = X;
	this.yHome = Y;

	// whether they are extending or retracting
	this.extend = false;
	this.retract = false;

	// Methods
	this.draw = function () {
		ctx.fillStyle = 'rgb(171,0,171)';
		for (var i = 0; i < numSubsections; i++){
			ctx.beginPath();
			ctx.arc(this.xPos[i], this.yPos[i], this.radii[i], 0, 2*Math.PI, true);
			ctx.fill();
			ctx.strokeStyle = "black";
			ctx.stroke();
		}
	}
	this.extendArm = function () {
		// find the delta between the end of the tentacle and the destination
		var deltaX = this.xPos[numSubsections - 1] - this.xDest;
		var deltaY = this.yPos[numSubsections - 1] - this.yDest;
		var inPosX = false;
		var inPosY = false;
		var changeX, changeY;

		// change x positions if necessary
		if(deltaX > 5 || deltaX < -5){
			for(var i = 0; i < numSubsections; i++){
				changeX = deltaX*.2*i;
				this.xPos[i] -= changeX; 
			}	
		} else {
			inPosX = true;	
		}
		// change y positions if necessary
		if(deltaY > 5 || deltaY < -5){
			for(var i = 0; i < numSubsections; i++){
				changeY = deltaY*.2*i;
				this.yPos[i] -= changeY; 
			}	
		} else {
			inPosY = true;	
		}	
		// if inPosX and inPosY are both true then you can retract
		if (inPosX && inPosY) {
			this.extend = false;
			this.retract = true;
			if(!startOct && isStarted)
				segments.segmentArray[this.tentacleId].checkCollision();
		}
	}
	this.retractArm = function() {
		// find the delta between the end of the tentacle and the destination
		var deltaX = this.xPos[numSubsections - 1] - this.xHome;
		var deltaY = this.yPos[numSubsections - 1] - this.yHome;
		var inPosX = false;
		var inPosY = false;
		var changeX, changeY;

		// change x positions if necessary
		if(deltaX > 5 || deltaX < -5){
			for(var i = 0; i < numSubsections; i++){
				changeX = deltaX*.2*i;
				this.xPos[i] -= changeX; 
			}	
		} else{
			inPosX = true;	
		}
		// change x positions if necessary
		if(deltaY > 5 || deltaY < -5){
			for(var i = 0; i < numSubsections; i++){
				var changeY = deltaY*.2*i;
				this.yPos[i] -= changeY; 
			}	
		} else{
			inPosY = true;	
		}	
		// if inPosX and inPosY are both true then you can retract
		if(inPosX && inPosY){
			this.retract = false;
			game.availTentacles++;
			if (startOct)
				startOct = false;
		}
	}
}

function Octopus(maxAvailTentacles) {
	// Fields
	this.centerX = table.centerX;
	this.centerY = table.centerY;

	this.maxAvailTentacles = maxAvailTentacles;
	this.availTentacles = maxAvailTentacles;
	this.tentacles = [];

	// Create the tentacles
	var tentacleRadius = canvas.width/7;
	for(var i = 0; i < numTentacles; i++){
		var x = (this.centerX + tentacleRadius * Math.cos(2 * Math.PI * i / numTentacles));
		var y = (this.centerY + tentacleRadius * Math.sin(2 * Math.PI * i / numTentacles));
		var xDest = (this.centerX + (table.outerR+table.innerR)*.5 * Math.cos(2 * Math.PI * i / numTentacles));
		var yDest = (this.centerY + (table.outerR+table.innerR)*.5 * Math.sin(2 * Math.PI * i / numTentacles));
		this.tentacles.push(new Tentacle(x, y, xDest, yDest, i));
	}

	// Methods
	this.draw = function () {
		// For Head
		var radius = canvas.width/12;
		var startAngle = 0;
		var endAngle = Math.PI;
		var clockwise = true;

		// For ballon shape of Head
		//multiplied by small constants for make it look better
		var cp1x = this.centerX - canvas.width * .08;
		var cp1y = this.centerY + canvas.height *.02;
		var cp2x = this.centerX - canvas.width * .06;  
		var cp2y = this.centerY + canvas.height * .06;
		var x1 = (this.centerX-canvas.width*.03);
		var y1 = (this.centerY+canvas.height*.1);

		var cp3x = this.centerX + canvas.width * .08;
		var cp3y = this.centerY + canvas.height *.02;
		var cp4x = this.centerX + canvas.width * .06;  
		var cp4y = this.centerY + canvas.height * .06;
		var x2 = (this.centerX+canvas.width*.03);
		var y2 = (this.centerY+canvas.height*.1);

		// For Eyes
		var eyeRadius = canvas.width*.025;
		var leftX = this.centerX - eyeRadius;
		var rightX = this.centerX + eyeRadius - 3;
		var y = this.centerY - eyeRadius;

		// For Pupils
		var pupilRadius = canvas.width*.015;

		// For Mouth
		var x = this.centerX - canvas.width * .02;
		var cp5x = this.centerX - canvas.width*.02;
		var cp5y = this.centerY + canvas.height*.05;
		var cp6x = this.centerX + canvas.width*.02;  
		var cp6y = this.centerY + canvas.height*.05;

		//draw the body of the octopus
		ctx.beginPath();
		ctx.arc(this.centerX, this.centerY, radius, startAngle, endAngle, clockwise);
		ctx.bezierCurveTo(cp1x,cp1y,cp2x,cp2y,x1,y1);
		ctx.lineTo(x2,y2)
		ctx.moveTo(this.centerX+radius, this.centerY);
		ctx.bezierCurveTo(cp3x,cp3y,cp4x,cp4y,x2,y2);
		ctx.fillStyle = 'rgb(171,0,171)';
		ctx.fill();
		ctx.strokeStyle = "black";
		ctx.stroke();
		
		//draw the eyes of the octopus
		ctx.fillStyle = 'rgb(255, 255, 255)';
		ctx.beginPath();
		endAngle = 2*Math.PI;
		//left eye
		ctx.arc(leftX, y, eyeRadius, startAngle, endAngle, clockwise);
		//right eye
		ctx.arc(rightX, y, eyeRadius, startAngle, endAngle, clockwise);
		ctx.fill();
		
		//draw the pupils of the octopus
		ctx.fillStyle = 'rgb(0, 0, 0)';
		ctx.beginPath();
		//left pupil
		leftX = this.centerX - eyeRadius;
		y = this.centerY - eyeRadius + canvas.height *.011;
		ctx.arc(leftX, y, pupilRadius, startAngle, endAngle, clockwise);
		//right pupil
		rightX = this.centerX + eyeRadius-3;
		ctx.arc(rightX, y, pupilRadius, startAngle, endAngle, clockwise);
		ctx.fill();
		
		//draw the mouth
		ctx.beginPath();
		y = this.centerY + canvas.height * .03;
		ctx.moveTo(x, y);
		x = this.centerX + canvas.width * .02;
		ctx.bezierCurveTo(cp5x, cp5y, cp6x, cp6y, x, y);
		ctx.stroke();
		
		//draw the tentacles
		for(var i= 0; i<numTentacles ; i++){
			this.tentacles[i].draw();
		}		
	}
	this.move = function(){
		for (var i = 0; i < numTentacles; i++) {
			if (this.tentacles[i].extend)
				this.tentacles[i].extendArm();
			if (this.tentacles[i].retract)
				this.tentacles[i].retractArm();
		}
	}
	this.moveTentacle = function(tentacleIndex) {
		// Make sure the user still has tentacles to move
		if (game.availTentacles <= 0) {
			console.log("Max amount of tentacles are presently moving. Must wait for more to become available.");
			game.availTentacles = 0;
			return;
		}
		game.availTentacles--;
		if (!this.tentacles[tentacleIndex].extend && !this.tentacles[tentacleIndex].retract)
			this.tentacles[tentacleIndex].extend = true;
	}
}
/*********************************************
 * Plates and Sushi Functions and Objects
 ********************************************/
function Sushi () {
	// fields
	var sushiDraw = [this.drawSalmon, this.drawHandRoll, this.drawTamago, this.drawRiceMaki, this.drawOctopus];

	this.value = getWeightedRandom(plateWeights,plateIndexes);
	this.type = getWeightedRandom(sushiWeights,sushiIndexes);

	// Methods
	this.draw = function (position) {
		sushiDraw[this.type](position);
	}
}
Sushi.prototype.drawSalmon = function(position){
	var diff = (table.outerR - table.innerR)/2;
	var x = (table.centerX + (table.innerR + diff) * Math.cos(2 * Math.PI * position / game.maxPlates)) + 10;
	var y = (table.centerY + (table.innerR + diff) * Math.sin(2 * Math.PI * position / game.maxPlates)) + 7;
	var drawPiece = function (cx, cy) {
		ctx.fillStyle = "white";
		ctx.beginPath();
		ctx.arc(cx, cy, 10, 0, 2*Math.PI, true);
		ctx.closePath();
		ctx.fill();
		ctx.strokeStyle = "black";
		ctx.stroke();
		ctx.fillStyle = "salmon";
		ctx.beginPath();
		ctx.arc(cx, cy, 5, 0, 2*Math.PI, true);
		ctx.closePath();
		ctx.fill();
	};
	drawPiece(x, y);
	x = (table.centerX + (table.innerR + diff) * Math.cos(2 * Math.PI * position / game.maxPlates));
	y = (table.centerY + (table.innerR + diff) * Math.sin(2 * Math.PI * position / game.maxPlates)) - 13;
	drawPiece(x,y);
	x = (table.centerX + (table.innerR + diff) * Math.cos(2 * Math.PI * position / game.maxPlates)) - 13;
	y = (table.centerY + (table.innerR + diff) * Math.sin(2 * Math.PI * position / game.maxPlates)) + 7;
	drawPiece(x,y);
}
Sushi.prototype.drawHandRoll = function(position) { 
	var diff = (table.outerR - table.innerR)/2;
	var rollRadius = 30;
	var riceRadius = 11;
	var eelRadius = 4;
	var x = (table.centerX + (table.innerR + diff) * Math.cos(2 * Math.PI * position / game.maxPlates)) - rollRadius/1.5;
	var y = (table.centerY + (table.innerR + diff) * Math.sin(2 * Math.PI * position / game.maxPlates));
	ctx.fillStyle = "black";
	ctx.beginPath();
	ctx.arc(x, y, rollRadius, -Math.PI/7, Math.PI/7, false);
	ctx.lineTo(x, y);
	ctx.closePath();
	ctx.fill();
	ctx.fillStyle = "white";
	ctx.strokeStyle = "black";
	ctx.beginPath();
	ctx.arc(x + rollRadius, y, riceRadius, 0, 2*Math.PI, true);
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
	ctx.fillStyle = "gold";
	ctx.strokeStyle = "green";
	ctx.beginPath();
	ctx.arc(x + rollRadius, y, eelRadius, 0, 2*Math.PI, true);
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
}
Sushi.prototype.drawTamago = function (position) {
	var diff = (table.outerR - table.innerR)/2;
	var riceWidth = 12;
	var riceHeight = 25;
	var eggWidth = 7;
	var eggHeight = 20;
	var widthDiffRE = riceWidth - eggWidth;
	var heightDiffRE = riceHeight - eggHeight;
	var seaweedHeight = 7;
	var heightDiffRS = riceHeight - seaweedHeight;
	var ox = (table.centerX + (table.innerR + diff) * Math.cos(2 * Math.PI * position / game.maxPlates)) - riceWidth*2;
	var oy = (table.centerY + (table.innerR + diff) * Math.sin(2 * Math.PI * position / game.maxPlates)) - riceHeight/2;
	var drawPiece = function (x, y) {	
		ctx.fillStyle = "white";
		ctx.beginPath();
		ctx.fillRect(x, y, riceWidth, riceHeight);
		ctx.closePath();
		ctx.fillStyle = "gold";
		ctx.beginPath();
		ctx.fillRect(x + widthDiffRE/2, y + heightDiffRE/2, eggWidth, eggHeight);	
		ctx.closePath();
		ctx.fillStyle = "black";
		ctx.beginPath();
		ctx.fillRect(x, y + heightDiffRS/2, riceWidth, seaweedHeight);
		ctx.closePath();
	};
	drawPiece(ox, oy);
	drawPiece(ox + riceHeight*0.75, oy);
	drawPiece(ox + riceHeight*1.5, oy);
}

Sushi.prototype.drawRiceMaki = function (position) {
	var diff = (table.outerR - table.innerR)/2;
	var x = (table.centerX + (table.innerR + diff) * Math.cos(2 * Math.PI * position / game.maxPlates)) + 10;
	var y = (table.centerY + (table.innerR + diff) * Math.sin(2 * Math.PI * position / game.maxPlates)) + 7;
	var drawPiece = function (cx, cy) {
		ctx.fillStyle = "black";
		ctx.beginPath();
		ctx.arc(cx, cy, 10, 0, 2*Math.PI, true);
		ctx.closePath();
		ctx.fill();
		ctx.strokeStyle = "white";
		ctx.stroke();
		ctx.fillStyle = "salmon";
		ctx.strokeStyle = "white";
		ctx.beginPath();
		ctx.arc(cx, cy, 5, 0, 2*Math.PI, true);
		ctx.closePath
		ctx.fill();
		ctx.stroke();
	};
	drawPiece(x, y);
	x = (table.centerX + (table.innerR + diff) * Math.cos(2 * Math.PI * position / game.maxPlates));
	y = (table.centerY + (table.innerR + diff) * Math.sin(2 * Math.PI * position / game.maxPlates)) - 13;
	drawPiece(x,y);
	x = (table.centerX + (table.innerR + diff) * Math.cos(2 * Math.PI * position / game.maxPlates)) - 13;
	y = (table.centerY + (table.innerR + diff) * Math.sin(2 * Math.PI * position / game.maxPlates)) + 7;
	drawPiece(x,y);
}

Sushi.prototype.drawOctopus = function (position) {
	var riceRadius = (table.outerR - table.innerR)/6;
	var diff = (table.outerR - table.innerR)/2;
	var centerX = (table.centerX + (table.innerR + diff) * Math.cos(2 * Math.PI * position / game.maxPlates));
	var centerY = (table.centerY + (table.innerR + diff) * Math.sin(2 * Math.PI * position / game.maxPlates)) - riceRadius/2;	

	ctx.fillStyle = "white";
	ctx.beginPath();
	ctx.arc(centerX, centerY + riceRadius/2, riceRadius, 0, 2*Math.PI, true);
	ctx.closePath();
	ctx.fill();

	// For Head
	var plateWidth = (table.outerR - table.innerR)*1.5;
	var radius = plateWidth/12;
	var startAngle = 0;
	var endAngle = Math.PI;
	var clockwise = true;

	// For ballon shape of Head
	//multiplied by small constants for make it look better
	var cp1x = centerX - plateWidth * .08;
	var cp1y = centerY + plateWidth *.02;
	var cp2x = centerX - plateWidth * .06;  
	var cp2y = centerY + plateWidth * .06;
	var x1 = (centerX-plateWidth*.03);
	var y1 = (centerY+plateWidth*.1);

	var cp3x = centerX + plateWidth * .08;
	var cp3y = centerY + plateWidth *.02;
	var cp4x = centerX + plateWidth * .06;  
	var cp4y = centerY + plateWidth * .06;
	var x2 = (centerX+plateWidth*.03);
	var y2 = (centerY+plateWidth*.1);

	// For Eyes
	var eyeRadius = plateWidth*.025;
	var leftX = centerX - eyeRadius;
	var rightX = centerX + eyeRadius - 3;
	var y = centerY - eyeRadius;

	// For Pupils
	var pupilRadius = plateWidth*.015;

	// For Mouth
	var x = centerX - plateWidth * .02;
	var cp5x = centerX - plateWidth*.02;
	var cp5y = centerY + plateWidth*.01;
	var cp6x = centerX + plateWidth*.02;  
	var cp6y = centerY + plateWidth*.01;

	//draw the body of the octopus
	ctx.beginPath();
	ctx.arc(centerX, centerY, radius, startAngle, endAngle, clockwise);
	ctx.bezierCurveTo(cp1x,cp1y,cp2x,cp2y,x1,y1);
	ctx.lineTo(x2,y2)
	ctx.moveTo(centerX+radius, centerY);
	ctx.bezierCurveTo(cp3x,cp3y,cp4x,cp4y,x2,y2);
	ctx.fillStyle = 'rgb(171,0,171)';
	ctx.fill();
	ctx.strokeStyle = "black";
	ctx.stroke();
	
	//draw the eyes of the octopus
	ctx.fillStyle = 'rgb(255, 255, 255)';
	ctx.beginPath();
	endAngle = 2*Math.PI;
	//left eye
	ctx.arc(leftX, y, eyeRadius, startAngle, endAngle, clockwise);
	//right eye
	ctx.arc(rightX, y, eyeRadius, startAngle, endAngle, clockwise);
	ctx.fill();
	
	//draw the pupils of the octopus
	ctx.fillStyle = 'rgb(0, 0, 0)';
	ctx.beginPath();
	//left pupil
	leftX = centerX - eyeRadius;
	y = centerY - eyeRadius + plateWidth *.011;
	ctx.arc(leftX, y, pupilRadius, startAngle, endAngle, clockwise);
	//right pupil
	rightX = centerX + eyeRadius-3;
	ctx.arc(rightX, y, pupilRadius, startAngle, endAngle, clockwise);
	ctx.fill();
	
	//draw the mouth
	ctx.beginPath();
	y = centerY + plateWidth * .05;
	ctx.moveTo(x, y);
	x = centerX + plateWidth * .02;
	ctx.bezierCurveTo(cp5x, cp5y, cp6x, cp6y, x, y);
	ctx.stroke();

	//draw some tentacles
	var tentacleR = 5;
	ctx.fillStyle = 'rgb(171,0,171)';
	ctx.beginPath();
	ctx.arc(centerX - 1.75*riceRadius/2, centerY + 2*riceRadius/3, tentacleR, 0, 2*Math.PI, true);
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
	ctx.beginPath();
	ctx.arc(centerX + 1.75*riceRadius/2, centerY + 2*riceRadius/3, tentacleR, 0, 2*Math.PI, true);
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
	ctx.beginPath();
	ctx.arc(centerX - 0.3*riceRadius, centerY + riceRadius, tentacleR, 0, 2*Math.PI, true);
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
	ctx.beginPath();
	ctx.arc(centerX + 0.3*riceRadius, centerY + riceRadius, tentacleR, 0, 2*Math.PI, true);
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
}

function Plate (angle) {
	// fields
	this.sushi = new Sushi();

	this.plateInnerRadius = (table.outerR - table.innerR)/5;
	this.plateOuterRadius = (table.outerR - table.innerR)/3;
	this.position = angle; //angle at which center is on circle

	// Methods
	//draw function (considers shape, which is part of type, so switch on type)
	this.draw = function (timer) {
		var diff = (table.outerR - table.innerR)/2;
		var x = (table.centerX + (table.innerR + diff) * Math.cos(2 * Math.PI * this.position / game.maxPlates));
		var y = (table.centerY + (table.innerR + diff) * Math.sin(2 * Math.PI * this.position / game.maxPlates));

		// Colors
		if (timer > leavingSoon)
			ctx.strokeStyle = "black";
		else
			ctx.strokeStyle = "yellow";
		ctx.lineWidth = 3;
		ctx.fillStyle = plateColors[this.sushi.value];

		// Draw plates
		ctx.beginPath();
		ctx.arc(x, y, this.plateOuterRadius, 0, 2*Math.PI, true);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.beginPath();
		ctx.arc(x, y, this.plateInnerRadius, 0, 2*Math.PI, true);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();

		// Draw sushi	
		this.sushi.draw(this.position);
	}
	this.move = function () {
		if (game.clockwise === true)
			this.position += game.speed;
		else
			this.position -= game.speed;
	}
}

function Plates () {
	// fields
	this.platesArray = [];
	this.activePlates = [];
	this.plateTimer = [];
	
	for (var i = 0; i < game.maxPlates; i++) {
		//a plate is in an active section if it has j/plate.angle that is a multiple of 2
		//is halfway(ish) in the area when it's a multiple of 2 +- 0.5
		//this should be used for collision calculation
		this.platesArray.push(new Plate(i));
		this.activePlates.push(false);
		this.plateTimer.push(Math.floor(Math.random() * game.maxPlateTimer));
	}

	// Methods
	this.draw = function () {
		for (var i = 0; i < game.maxPlates; i++) {
			if (this.activePlates[i] === true) {
				this.platesArray[i].draw(this.plateTimer[i]);
			}
		}
	}
	this.move = function () {
		for (var i = 0; i < game.maxPlates; i++)
			this.platesArray[i].move();
	}
	this.update = function () {
		var random;
		for (var i = 0; i < game.maxPlates; i++) {
			// Update timer and check if the timer up?
			if (--this.plateTimer[i] <= 0) {
				// Did the player miss an octopus?
				if (this.activePlates[i] === true && sushiTypes[this.platesArray[i].sushi.type] === "octopus")
					game.missOcto();

				// Swap Plate Activity, timer and sushi type
				if (this.activePlates[i])
					this.deactivatePlate(i);
				else
					this.activatePlate(i);
			}
		}
	}
	this.activatePlate = function(i) {
		this.activePlates[i] = true;
		this.platesArray[i].sushi = new Sushi();
		random = Math.floor(Math.random() * game.maxPlateTimer);
		random = (random > game.maxPlateTimer/(5 + game.level)) ? random : game.maxPlateTimer/(5 + game.level);
		this.plateTimer[i] = random;
	}
	this.deactivatePlate = function(i) {
		this.activePlates[i] = false;
		// doesn't matter about the sushi
		random = Math.floor(Math.random() * game.maxPlateTimer);
		random = (random > game.maxPlateTimer/(5 + game.level)) ? random : game.maxPlateTimer/(5 + game.level);
		this.plateTimer[i] = random/2;
	}
}


/*********************************************
 * Table and Segments Functions and Objects
 ********************************************/
function Segment (startAngle, endAngle) {
	// fields
	this.cx = table.centerX;
	this.cy = table.centerY;
	this.outerR = table.outerR;
	this.innerR = table.innerR;
	this.startAngle = startAngle;
	this.endAngle = endAngle;

	this.color = "#83A147"; // Active Segment Color

	// Methods
	this.draw = function () {
		ctx.beginPath();
		ctx.arc(this.cx, this.cy, this.innerR, this.startAngle, this.endAngle, false);
		ctx.arc(this.cx, this.cy, this.outerR, this.endAngle, this.startAngle, true);
		ctx.closePath();
		ctx.strokeStyle = "black";
		ctx.lineWidth = 3;
		ctx.fillStyle = this.color;
		ctx.fill();
		ctx.stroke();
	}
	this.checkCollision = function () {
		var position;

		// Look through every plate
		for (var i = 0; i < maxPlates; i++) {
			// Do nothing if the plate is not active
			if(plates.activePlates[i] === true) {

				// Mod this to fit within 2PI
				position = (2 * Math.PI * plates.platesArray[i].position / game.maxPlates) % (2*Math.PI);

				// the north segment's startAngle uses negative radians, so we must account for
				// the position being in the positive region
				if (position >= (Math.PI*(2-1.5/numTentacles/4)))
					position -= 2*Math.PI;

				// If plate is active, and the plate is in the correct segment
				// check if an octopus was saved or something else was saved.
				// And give points or take away points appropriately.
				if (position >= this.startAngle && position <= this.endAngle) {

					if (sushiTypes[plates.platesArray[i].sushi.type] === "octopus") {
						// increase points, count a saved octo and update Level
						game.saveOcto(platePoints[plates.platesArray[i].sushi.value]);
						game.updateLevel();
					} else {
						game.losePoints(platePoints[plates.platesArray[i].sushi.value]);
					}
					// Disable plate and refresh it in Plates.update
					plates.deactivatePlate(i);
				}
			}
		}
	}
}

function Segments () {
	// fields
	this.segmentArray = [];

	// Create active segments for the 8 legs to touch, thus 8 segments.
	//2*Math.PI/8 (8 divisions of table, one active segment per division, 3 inactive)
	for (var i = 0; i < numTentacles; i++) {
		this.segmentArray.push(new Segment(i*(2*Math.PI/numTentacles) - (1.5*Math.PI/numTentacles/4), 
								i*(2*Math.PI/numTentacles) + 1.5*Math.PI/numTentacles/4));
	}
	
	// Methods
	this.draw = function () {
		for (var i = 0; i < numTentacles; i++) {
			this.segmentArray[i].draw();
		}
	}
}

function Table () {
	// fields
	this.centerX = canvas.width/2;
	this.centerY = canvas.height/2;
	this.outerR = Math.min(0.9*canvas.width/2, 0.9*canvas.width/2);
	this.innerR = Math.min(0.6*canvas.width/2, 0.6*canvas.width/2);

	this.color= "#895A47"; // Table Color

	// Methods
	this.draw = function () {
		// Draw Table
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.arc(this.centerX, this.centerY, this.outerR, 0, 2*Math.PI, true);
		ctx.closePath();
		ctx.fillStyle = this.color;
		ctx.strokeStyle = "black";
		ctx.fill();
		ctx.stroke();
		ctx.beginPath();
		ctx.arc(this.centerX, this.centerY, this.innerR, 0, 2*Math.PI, true);
		ctx.closePath();
		ctx.fillStyle = game.bgColor;
		ctx.fill();
		ctx.stroke();
	}
}

/*********************************************
 * Game Object
 ********************************************/
function Game(maxPlates, maxOctosMissed, maxLevel, octosPerLevel, startingSpeed, maxPlateTimer, startingRotMax) {

	// fields
	this.bgColor = "lightblue";
	this.fontColor = "black";
	this.titleSize = Math.min(canvas.width,canvas.height)/15;

	this.points = 0;
	this.octosSaved = 0;
	this.octosMissed = 0;
	this.maxOctosMissed = maxOctosMissed;

	this.level = 1;
	this.maxLevel = maxLevel;
	this.octosPerLevel = octosPerLevel;

	// Plate speed, rotation and various variables
	this.startingSpeed = startingSpeed;
	this.speed = startingSpeed;

	this.startingRotMax = startingRotMax;
	this.rotMax = startingRotMax;
	this.rotTimer = startingRotMax;
	this.rotateLevels = false;
	this.clockwise = true;

	this.maxPlates = maxPlates;
	this.maxPlateTimer = maxPlateTimer;

	// Methods
	this.losePoints = function(points) {
		this.points -= points;
		if (this.points <= 0)
			this.points = 0;
	}
	this.saveOcto = function(points) {
		this.octosSaved++;
		this.points += points;
	}
	this.missOcto = function() {
		this.octosMissed++;
		if(this.octosMissed === this.maxOctosMissed) {
			gameOver = true;
		}
	}
	this.updateLevel = function() {
		this.level = Math.floor(this.octosSaved / this.octosPerLevel) + 1;
		this.speed = this.startingSpeed * this.level;
		this.rotMax = this.startingRotMax / this.level;
		if (this.level > maxLevel/2)
			this.rotateLevels = true;
		if (this.level > maxLevel) {
			this.level = maxLevel;
			gameWon = true;
		}
	}
	this.update = function() {
		var random;
		// rotate only if in a rotating level or higher
		if (this.rotateLevels) {
			// Update timer and check if the timer up?
			if (--this.rotTimer <= 0) {
				this.clockwise = !this.clockwise;
				this.rotTimer = Math.floor(Math.random()*this.rotMax);
			}
		}
	}
}


/*********************************************
 * Basic Game Flow Functions
 ********************************************/
function drawLabels() {
	var labelRadius = (table.outerR - table.innerR)/4;
	var halfAngle = (segments.segmentArray[0].endAngle - segments.segmentArray[0].startAngle)/2;

	for (var i = 0; i < numTentacles; i++) {
		var diff = (table.outerR - table.innerR)/2;
		var position = halfAngle + segments.segmentArray[i].startAngle;
		var x = (table.centerX + (table.innerR + diff) * Math.cos(position));
		var y = (table.centerY + (table.innerR + diff) * Math.sin(position));

		// Colors
		ctx.fillStyle = "rgba(173,255,47,0.5)";
		ctx.lineWidth = 3;
		
		// Draw plates
		ctx.beginPath();
		ctx.arc(x, y, labelRadius, 0, 2*Math.PI, true);
		ctx.closePath();
		ctx.fill();

		ctx.fillStyle = game.bgColor;
		ctx.font = "bold " + game.titleSize +"px Helvetica";
		ctx.textAlign = "center";
		ctx.fillText(button[i],x,y+game.titleSize*0.4);
	}
}

function drawStats() {
	ctx.fillStyle = game.fontColor;
	ctx.font = "bold " + (game.titleSize) +"px Helvetica";
	ctx.textAlign = "left";
	ctx.fillText("Score: " + game.points, canvas.width*0.005, canvas.height*0.05);
	ctx.font = (game.titleSize/3) + "px Helvetica";
	ctx.fillText("Level: " + game.level + "    Octopi Saved: " + game.octosSaved, canvas.width*0.005, canvas.height*0.05 + game.titleSize/2);
	ctx.fillStyle = "darkred";
	ctx.font = "bold "+ (game.titleSize) +"px Helvetica";
	for (var i = 0; i < game.octosMissed && i < game.maxOctosMissed; i++)
		ctx.fillText("X", canvas.width*0.93 - (game.titleSize)*i, canvas.height*0.07);
}
function drawStartScreen() {
	var startPlates = new Plates();
	startPlates.activatePlate(2);
	startPlates.activatePlate(3);
	startPlates.activatePlate(4);
	startPlates.activatePlate(5);
	startPlates.activatePlate(6);
	startPlates.activatePlate(10);
	startPlates.activatePlate(11);
	startPlates.activatePlate(12);
	startPlates.activatePlate(13);
	startPlates.activatePlate(14);
	ctx.fillStyle = "lightblue";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	startPlates.draw();
	
	ctx.fillStyle = game.fontColor;
	ctx.font = "bold " + game.titleSize +"px Helvetica";
	ctx.textAlign = "center";
	ctx.fillText("Welcome to Tako Nigiri!", canvas.width/2, canvas.height/2.5);

	ctx.font = (game.titleSize/2) + "px Helvetica";
	ctx.fillText("Goal: Save all of your Octopus Brethren before they get eaten up!", canvas.width/2, canvas.height/2.5 + game.titleSize);

	ctx.textAlign = "left";
	ctx.fillText("Controls: Control your eight legs using 'W','E','R','F','C','X','Z','A'", canvas.width/32, canvas.height/2.5 + game.titleSize*2);
	ctx.fillText("The plates will shine yellow, if they are in danger of getting eaten.", canvas.width/32, canvas.height/2.5 + game.titleSize*2.5);
	ctx.fillText("You lose if five of your friends are eaten.", canvas.width/32, canvas.height/2.5 + game.titleSize*3);

	ctx.textAlign = "center";
	ctx.fillText("Press SPACE to start the game!", canvas.width/2, canvas.height/2.5 + game.titleSize*4);
	ctx.fillText("Press 'P' to pause the game!", canvas.width/2, canvas.height/2.5 + game.titleSize*4.5);
}

function drawGameOver() {
	var i = 0;
	var endPlates = new Plates();
	for (i; i < game.maxPlates; i++) {
		endPlates.platesArray[i].sushi.type = 4;
		if ((i >= 2 && i <= 6) || (i >= 10 && i <= 14)) {
			endPlates.activePlates[i] = true;
		}
	}	

	ctx.fillStyle = "lightblue";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	endPlates.draw();
	
	ctx.fillStyle = game.fontColor;
	ctx.font = "bold " + game.titleSize +"px Helvetica";
	ctx.textAlign = "center";
	ctx.fillText("(T_T) GAME OVER!", canvas.width/2, canvas.height/2);
	ctx.font = (game.titleSize/2) + "px Helvetica";
	ctx.fillText("NOOOOO They ate your baby friends! Oh well, better luck next time.", canvas.width/2, canvas.height/2 + game.titleSize);
	ctx.fillText("Press SPACE to restart the game!", canvas.width/2, canvas.height/2 + game.titleSize*1.5);
}

function drawGameWon() {
	ctx.fillStyle = "lightblue";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	woctopus.draw();
	for (var i = 0; i < numTentacles; i++) {
		woctopus.moveTentacle(i);
	}
	woctopus.move();
	
	ctx.fillStyle = game.fontColor;
	ctx.font = "bold " + game.titleSize +"px Helvetica";
	ctx.textAlign = "center";
	ctx.textBaseLine = "middle";
	ctx.fillText("~(^_^)~ YOU WON!", canvas.width/2, canvas.height/4);
	ctx.font = (game.titleSize/2) + "px Helvetica";
	ctx.fillText("Oya! Congrats! You saved your friends!", canvas.width/2, 3*canvas.height/4);
	ctx.fillText("Press SPACE to restart the game!", canvas.width/2, 3*canvas.height/4 + game.titleSize*0.5);
}

function drawPauseScreen() {
	ctx.fillStyle = "lightblue";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	pausePlates.draw();
	
	ctx.fillStyle = game.fontColor;
	ctx.font = "bold " + game.titleSize +"px Helvetica";
	ctx.textAlign = "center";
	ctx.fillText("PAUSED", canvas.width/2, canvas.height/2.5);
	ctx.font = (game.titleSize/2) + "px Helvetica";
	ctx.fillText("Press SPACE to restart the game!", canvas.width/2, canvas.height/2 + game.titleSize*1.5);
	ctx.fillText("Press 'P' to unpause the game!", canvas.width/2, canvas.height/2 + game.titleSize*2);
}

function redrawAll() {
    // erase everything -- not efficient, but simple!
    ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = game.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

	table.draw();
	segments.draw();
	drawLabels();
	if (!startOct) {
		plates.draw();
		octopus.draw();
	} else {
		woctopus.draw();
	}

	drawStats();

	if (!isStarted) {
		drawStartScreen();
	}else if (isPaused) {
		drawPauseScreen();
	}else if (gameOver) {
		drawGameOver();
	}else if (gameWon) {
		drawGameWon();
	}
}

function onTimer() {
	if(isStarted && !startOct && !isPaused && !gameOver && !gameWon){
		plates.move();
		octopus.move();
		plates.update();
		game.update();
	}
	if(startOct){
		woctopus.move();
	}
    redrawAll();
}

function onKeyDown(event) {
	// UI Keys
	var pCode = 80;
	var spaceCode = 32;

	// Control Keys
	var wCode = 87;
	var eCode = 69;
	var rCode = 82;
	var fCode = 70;
	var cCode = 67;
	var xCode = 88;
	var zCode = 90;
	var aCode = 65;

	switch (Number(event.keyCode)) {
		case pCode:
			if(isStarted && !gameOver && !gameWon){
				isPaused = !isPaused;
			}
			break;
		case spaceCode:
			if (isStarted === false) {
				isStarted = true;
				startOct = true;
				for (var i = 0; i < numTentacles; i++)
					woctopus.moveTentacle(i);
			} else if (isPaused || gameOver || gameWon){
				isPaused = false;
				isStarted = false;
				gameOver = false;
				gameWon = false;
				startOct = false;

				// Create a new Game
				game = new Game(maxPlates, maxOctosMissed, maxLevel, octosPerLevel, startingSpeed, maxPlateTimer, startingRotMax);
				table = new Table();
				segments = new Segments();
				plates = new Plates();
				octopus = new Octopus();
			}
			break;

		// Tentacle controls
		case wCode:
			if (isStarted && !isPaused && !gameOver && !gameWon)
				octopus.moveTentacle(5);
			break;
		case eCode:
			if (isStarted && !isPaused && !gameOver && !gameWon)
				octopus.moveTentacle(6);
			break;
		case rCode:
			if (isStarted && !isPaused && !gameOver && !gameWon)
				octopus.moveTentacle(7);
			break;
		case fCode:
			if (isStarted && !isPaused && !gameOver && !gameWon)
				octopus.moveTentacle(0);
			break;
		case cCode:
			if (isStarted && !isPaused && !gameOver && !gameWon)
				octopus.moveTentacle(1);
			break;
		case xCode:
			if (isStarted && !isPaused && !gameOver && !gameWon)
				octopus.moveTentacle(2);
			break;
		case zCode:
			if (isStarted && !isPaused && !gameOver && !gameWon)
				octopus.moveTentacle(3);
			break;
		case aCode:
			if (isStarted && !isPaused && !gameOver && !gameWon)
				octopus.moveTentacle(4);
			break;
		default:
			break;
	}	

}

function run() {
	// set up keyboard events, default font values, etc.
    canvas.addEventListener('keydown', onKeyDown, false);

    // make canvas focusable, then give it focus!
    canvas.setAttribute('tabindex','0');
    canvas.focus();

	/* Make pause screen plates and only activate them once so they do not change */
	pausePlates.activatePlate(2);
	pausePlates.activatePlate(3);
	pausePlates.activatePlate(4);
	pausePlates.activatePlate(5);
	pausePlates.activatePlate(6);
	pausePlates.activatePlate(10);
	pausePlates.activatePlate(11);
	pausePlates.activatePlate(12);
	pausePlates.activatePlate(13);
	pausePlates.activatePlate(14);
	
	// Begin infinite update loop
    intervalId = setInterval(onTimer, timerDelay);
}

run();
