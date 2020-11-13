// 15-237 Spring 2013, Hw1
// akshalab, Ahmed Shalaby 
// bcharna, Brad Charna
// sticknor, Sam Ticknor

////////////////////////////////////////////////////////
/////////////////// Sheep Leap /////////////////////////
////////////////////////////////////////////////////////


///////////////////////////////////////////////////////
//    Initialize objects, events, load images        //
///////////////////////////////////////////////////////


var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

window.runAnimation = false;
window.startGame = false;
window.startScreen = true;
var jumpSheepId;
var drawScreenId = [];
var cloudIntId;

var init = function(){
    game = new Object();  // game properties
    game.level = 0;
    game.over = false;
    game.timerDelay = 100;
    game.timer = 600;  // start with a minute
    game.goal = 10;
    game.fencesJumped = 0;
    game.timeColor = 'rgb(157, 188, 196)';
    game.grassx = 0;
    game.speed = 1;
    game.fences = {lane0:[],lane1:[],lane2:[]};
    game.fenceGenSpeed = 800;
    game.curLane = 1;
    game.origCloudsx = 0;
    game.levelup = false;
    game.paused = false;

    sheep = new Object();  //sheep properties
  	sheep.xPos = 0;
  	sheep.lane = 1;
  	sheep.onGround = true;
  	sheep.image = 1;
  	sheep.hit = false;
  	sheep.hover = false;
}

var spriteSheet = new Image();
spriteSheet.src = "SpriteSheet.png";

var background = new Image();
background.src = "background.png"

var grass = new Image();
grass.src = "grass.png"


////////////////////////////////////////////////
//        Canvas Resize                       //
////////////////////////////////////////////////


function sizeCanvas(){       // canvas can be resized at any point in game
  var curWidth = window.innerWidth
  if (curWidth > 640){
    ctx.canvas.width  = window.innerWidth-50;
  }
  else {ctx.canvas.width  = 590}
  ctx.canvas.height = Math.round(ctx.canvas.width*.75); //sets ratio
  sheepSizePosition();	
  fenceSizePosition();
  redrawAll();
}


////////////////////////////////////////////////
//                Clouds                      //
////////////////////////////////////////////////



var CLOUD = (function () {
  var exports = {};
  exports.clouds = Array();    //initialize array for clouds
  function drawCloud(cloud){   
    var sx;
    var sy;
    var sWidth;
    var sHeight;
    if (cloud.image === 0){  // get sprite sheet dimensions for clouds
      sx = 80;
      sy = 565;
      sWidth = 243;
      sHeight = 161;
    }
    else if (cloud.image === 1){
      sx = 419;
      sy = 544;
      sWidth = 141;
      sHeight = 104;   
    }
    else if (cloud.image === 2){
      sx = 751;
      sy = 616;
      sWidth = 95;
      sHeight = 75;   
    }
    else{
      sx = 938;
      sy = 580;
      sWidth = 244;
      sHeight = 159;   
    }
    var dx = Math.round(canvas.width - cloud.xPos);
    var dy;
    var dWidth;
    var dHeight;
    if (cloud.lane === 0){
      dy = Math.round(canvas.height * .07);
      dWidth = Math.round(canvas.width * .24);
      dHeight = Math.round(canvas.height * .24);
    }
    else if (cloud.lane === 1){
      dy = Math.round(canvas.height * .2);
      dWidth = Math.round(canvas.width * .21);
      dHeight = Math.round(canvas.height * .21);      
    }
    if (dWidth > Math.round(sWidth * 2) || dHeight > Math.round(sHeight * 2)){
      dWidth = Math.round(sWidth * 2);
      dHeight = Math.round(sHeight * 2); // prevent too much distortion
    }
    ctx.drawImage(spriteSheet, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
  }
  exports.drawClouds = function () {
    for (var i = 0; i < exports.clouds.length; i++){
      drawCloud(exports.clouds[i]);
      var cloudWidth;
      var thisCloud = exports.clouds[i];
      if (thisCloud.lane === 0){
        cloudWidth = Math.round(canvas.width * .13);
      }
      else if (thisCloud.lane === 1){
        cloudWidth = Math.round(canvas.width * .13);
      }
      if (canvas.width - thisCloud.xPos < - 2 * cloudWidth){ // remove from array 
        removeAt(exports.clouds, i);
        i--; //relook at this index as the array got shorter
      }
    }
  }
  exports.newRandomCloud = function () {
    var lane;
    if (game.curLane === 1){
      lane = 0; 
      game.curLane = 0;}
    else {
      lane = 1;
      game.curLane = 1;
    }
    var image_num = Math.floor((Math.random()*4));
    //create cloud
    var cloud = new Object();
    cloud.xPos = 0;
    cloud.lane = lane;
    cloud.image = image_num;
    return cloud;
  };
  return exports;
}());


function removeAt(array, index) {
  array.splice(index,1);
}

function advanceClouds () {
    for (var i = 0; i < CLOUD.clouds.length; i++)
    {
      CLOUD.clouds[i].xPos += 2; // xPos of 0 is all the way to right
    }     
}


function startClouds() {
  CLOUD.clouds.push(CLOUD.newRandomCloud()); //initial push
  makeCloudId = setInterval(function () {if (!game.paused){
    CLOUD.clouds.push(CLOUD.newRandomCloud());}
  }, 9000);
  
  cloudIntId = setInterval(advanceClouds, game.timerDelay);
}


function origClouds(x, y){   //clouds placed on screen before they start generating
  ctx.drawImage(spriteSheet,81, 545, 1100, 193, x, canvas.height*.05,
                              canvas.width, canvas.height*.3);
  if (window.startGame == true){
    game.origCloudsx += -2;
  }
  else game.origCloudsx -= .1;
}



////////////////////////////////////////////////
//               Fences                       //
////////////////////////////////////////////////



function generateNewFence(){ //randomly generate either 1 or 2 fences 
  var lane = Math.floor((Math.random()*3));
  var numberOfFences = Math.floor((Math.random()*4));
  if (numberOfFences > 1){
    if (game.level > 3){  //2 fences at a time if level 5 or above
      numberOfFences = Math.ceil((Math.random()*2));
    }
    else{
      numberOfFences = 1;
    }
  }
  var laneTaken=lane;
  for(var i=0; i<numberOfFences; i++){
    while(lane === laneTaken){
      lane = Math.floor((Math.random()*3));
    }
    laneTaken = lane;
    var fence = new Object();
    fence.xPos = canvas.width;
    fence.xPosRelToCanvas = 1;
    fence.lane = lane;
    fence.hit = false;
    switch (fence.lane){
      case 0:
        fence.yPos = Math.round(canvas.height * .75);   //size the fences in each lane
        fence.curWidth = Math.round(canvas.width * .1);
        fence.curHeight = Math.round(canvas.width * .18);
        game.fences.lane0.push(fence);
        break;
      case 1:
        fence.yPos = Math.round(canvas.height * .69); 
        fence.curWidth = Math.round(canvas.width * .08);
        fence.curHeight = Math.round(canvas.width * .13); 
        game.fences.lane1.push(fence);
        break;
      case 2: 
        fence.yPos = Math.round(canvas.height * .65); 
        fence.curWidth = Math.round(canvas.width * .06);
        fence.curHeight = Math.round(canvas.width * .1);
        game.fences.lane2.push(fence);
        break;
    }
  }
}

function fenceSizePosition(){
  laneFenceSizePosition(game.fences.lane0); 
  laneFenceSizePosition(game.fences.lane1);
  laneFenceSizePosition(game.fences.lane2);
}

function laneFenceSizePosition(laneFences){
  for(var f=0; f<laneFences.length; f++){
  	fence = laneFences[f];
    fence.xPos = Math.round(fence.xPosRelToCanvas * canvas.width)
    switch (fence.lane){
      case 0:
        fence.yPos = Math.round(canvas.height * .75); 
        fence.curWidth = Math.round(canvas.width * .1);
        fence.curHeight = Math.round(canvas.width * .18);
        break;
      case 1:
        fence.yPos = Math.round(canvas.height * .69); 
        fence.curWidth = Math.round(canvas.width * .08);
        fence.curHeight = Math.round(canvas.width * .13); 
        break;
      case 2: 
        fence.yPos = Math.round(canvas.height * .65); 
        fence.curWidth = Math.round(canvas.width * .06);
        fence.curHeight = Math.round(canvas.width * .1);
        break;
    }
  }
}

function advanceFences(funct){
  funct(game.fences.lane0);
  funct(game.fences.lane1);
  funct(game.fences.lane2);
}

var moveFencesInLane = function (laneFences){
  game.grassx -= game.speed;
  var removeFence = 0;
  for(var f=0; f<laneFences.length; f++){
      fence = laneFences[f];
      fenceCenter = fence.xPos + (fence.curWidth/2);
      fence.xPos -= game.speed*5;
      fence.xPosRelToCanvas = fence.xPos/canvas.width
      if (fence.xPos<-10){removeFence++;}
      else if (!fence.hit && sheep.lane === fence.lane &&
               fenceCenter>sheep.xPos && fenceCenter<(sheep.xPos+sheep.curWidth)){
        fence.sheepGoingThrough = true;
        if (sheepTouchingFence(laneFences[f])){
      	  game.timer -= 50;
      	  game.timeColor = 'rgb(222, 110, 91)';
      	  sheep.image = 3;
        }
      }
      else if(!fence.hit && fence.sheepGoingThrough === true && fenceCenter<sheep.xPos){
        game.fencesJumped++;
        game.timeColor = 'rgb(211, 229, 129)';
        game.timer += 20;
        changeGoal();
        fence.sheepGoingThrough = false;
      }
   }
  for(var r=0; r<removeFence;r++){
    laneFences.shift();
  }
}

function drawFence(fence) {
  var dx = fence.xPos;
  if (fence.lane === 0){ //if hit, draw alternative sprite, else, normal
  	if (fence.hit){ctx.drawImage(spriteSheet,2243, 537, 270, 98, dx, fence.yPos*1.15,
		                            fence.curWidth*1.4,fence.curHeight*.5);}
  	else{ctx.drawImage(spriteSheet,2259, 130, 198, 260, dx, fence.yPos,
		                            fence.curWidth,fence.curHeight);}
  }
  else if (fence.lane === 1){
  	if (fence.hit){ctx.drawImage(spriteSheet,2243, 537, 270, 98, dx, fence.yPos*1.12,
		                            fence.curWidth*1.4,fence.curHeight*.5);}
    else{ctx.drawImage(spriteSheet,2302, 697, 198, 260, dx, fence.yPos,
		                            fence.curWidth,fence.curHeight);}
  }
  else{
  	if (fence.hit){ctx.drawImage(spriteSheet,2243, 537, 270, 98, dx, fence.yPos*1.1,
		                            fence.curWidth*1.4,fence.curHeight*.5);}
    else{
  	ctx.drawImage(spriteSheet,2312, 1008, 198, 260, dx, fence.yPos,
		                            fence.curWidth,fence.curHeight);}
  }
}


function drawFencesInLane(lane) {
  var laneFences;
  var numDelete=0;
  if (lane === 0)
    laneFences = game.fences.lane0;
  else if (lane === 1)
    laneFences = game.fences.lane1;
  else
    laneFences = game.fences.lane2;  
  for (var i = 0; i < laneFences.length; i++)
  {
    drawFence(laneFences[i]);
  }
}

// generate random fences and advance those displayed
function fenceFactory(){
    generateNewFenceId = setInterval(generateNewFence, game.fenceGenSpeed);
    advanceFenceId = setInterval(function(){advanceFences(moveFencesInLane);}, 10);
}



////////////////////////////////////////////////
//               Sheep                        //
////////////////////////////////////////////////



function sheepSizePosition(){  
    if(!window.runAnimation){
      sheep.xPos = Math.round(ctx.canvas.width*.2);
    }
  	switch (sheep.lane){  //different dimensions for different lanes
    case 0:
        sheep.curWidth = Math.round(ctx.canvas.width*.21);
        sheep.curHeight = sheep.curWidth*.75;
      	sheep.yPos = Math.round(ctx.canvas.height*.98)-sheep.curHeight;
      	break;
    case 1:
      	sheep.curWidth = Math.round(ctx.canvas.width*.16);
      	sheep.curHeight = sheep.curWidth*.75;
      	sheep.yPos = Math.round(ctx.canvas.height*.86)-sheep.curHeight;
      	break;
    case 2:
      	sheep.curWidth = Math.round(ctx.canvas.width*.11);
      	sheep.curHeight = sheep.curWidth*.75;
      	sheep.yPos = Math.round(ctx.canvas.height*.76)-sheep.curHeight;
      	break;
  }
  if (!sheep.onGround){ 
    sheep.yPos= (sheep.yRelToCanvas*canvas.height);
  }
}

function drawSheep(x,y){
  	var img = new Image();   // Create new img element
  	if (x === undefined) {x = 10};
  	if (y === undefined) {y = Math.floor(ctx.canvas.height*.8)};
  	var width = sheep.curWidth;
  	var height = sheep.curHeight;
	if (!sheep.onGround){
		ctx.drawImage(spriteSheet,1594,75,530,348, x, y, width, height);}
	else if (sheep.image === 1){
		ctx.drawImage(spriteSheet,1011,72,504,350, x, y, width, height);}
	else if (sheep.image === 2){
		ctx.drawImage(spriteSheet,464,70, 490,352, x, y, width, height);}
    else if (sheep.image === 3){
    	ctx.drawImage(spriteSheet, 1594,460,530,348, x, y, width, height);}
  }



function reDrawSheep(x,y){
	if (y === undefined) y = 0;  //for start animation, move sheep forward
	sheep.xPos += x;
	sheep.yPos += y;
  redrawAll();
}


var jumpSheep = function(startYPos, jumpSpeed, acceleration){
  sheep.jumpSpeed = jumpSpeed;         
  sheep.acceleration = acceleration;            // jump with physics to make
  if (!sheep.onGround){                         // more realistic
    if (sheep.yPos - jumpSpeed >= startYPos){
        sheep.yPos = startYPos;
 		sheep.onGround = true;
 		redrawAll();
    }
    else{
      sheep.yPos -= jumpSpeed;           
      sheep.yRelToCanvas = (sheep.yPos/canvas.height);
      jumpSpeed += acceleration;
      jumpSheepId = setTimeout(function()
                                {jumpSheep(startYPos,jumpSpeed,acceleration);},20);
    }
  }
}

function jumpAnim(funct){
	var startYPos = sheep.yPos;
  sheep.startYPosRelToCanvas = startYPos/canvas.height;
  sheep.onGround = false;
  var acceleration = -(sheep.curHeight/100); //dependent on lane
  var jumpSpeed = Math.round(sheep.curHeight/5);
  funct(startYPos,jumpSpeed,acceleration);
}

function animateSheep(){
    if (sheep.image === 1){sheep.image = 2;}  // alternate between sprites to run
    else {sheep.image = 1;} 
}

function sheepTouchingFence(fence){  
  var fenceX = fence.xPos;
  var fenceY = fence.yPos;
  var fenceWidth = fence.curWidth;
  var fenceHeight = fence.curHeight;
  var fenceCenter = fenceX + Math.round(fenceWidth/2);
  if (!fence.hit && fence.lane === sheep.lane && 
      fenceCenter>sheep.xPos && fenceCenter<(sheep.xPos+sheep.curWidth)){
    if (sheep.onGround || ((sheep.yPos+sheep.curHeight)>(fenceY))){
      fence.hit = true;
      return true;
    }
  }
  return false;
}



///////////////////////////////////////////////////////////
//     User Input, pausing, and level progression        //
///////////////////////////////////////////////////////////


function onKeyDown(event){
    var spaceBarCode = 32; //jump
    var upCode = 38;  //change lanes
    var downCode = 40; //change lanes
    var pCode = 80;  //pause/unpause
    var rCode = 82;  //restart
    var hCode = 72;  //hover
    if ((sheep.onGround || sheep.hover) && window.startGame){
      if (sheep.onGround && event.keyCode === spaceBarCode){jumpAnim(jumpSheep);}

      else if(sheep.lane < 2 && event.keyCode === upCode){
      	sheep.lane++;
        sheepSizePosition();
      }
      else if(sheep.lane > 0 && event.keyCode === downCode){
      	sheep.lane--;
        sheepSizePosition();
      }
      else if(event.keyCode === hCode){
        if (sheep.onGround){
          sheep.yPos -= 2*sheep.curHeight;
          sheep.yRelToCanvas = sheep.yPos/canvas.height;
          sheep.onGround = false;
          sheep.hover = true;
        }
        else{
          sheep.onGround = true;
          sheep.hover = false;
          sheepSizePosition();
        }
      }
    }
    if(event.keyCode === pCode){  
      if(!game.over){
      	if (window.startGame) {pauseGame();}
      	else{unPauseGame();}
      }
    }
    else if(event.keyCode === rCode && game.over === true){
      reset(); // reload the page
    }    
}

function changeGoal(){  //If new level is reached, must reset goal to 10
    game.goal--;
    if (game.goal==0){
        game.goal=10;
        game.level++;
        if(game.fenceGenSpeed > 300){  // set minimmum fence generation speed
          game.fenceGenSpeed +=  -150;} // increase fences with new levels
          game.speed+=.1;  // increase game speed
          game.levelup= true;
          setTimeout(function(){game.levelup = false}, 2000) //display level for 2 sec
    }
}

function drawPause(){    //pause dialog
  if (!game.over && game.paused){  
    ctx.drawImage(spriteSheet, 768, 859, 550, 308, canvas.width*.335, canvas.height*.33,
                                                   canvas.width*.35, canvas.height*.2);
    var fontSize = canvas.width*.065;
    ctx.font = fontSize+"px Impact";
    ctx.fillStyle = 'rgb(18, 16, 41)';
    ctx.fillText("Paused", .41*canvas.width, canvas.height*.46);
  }
}

function pauseGame(){
  game.paused = true;
  window.startGame = false;
  if (jumpSheepId !== undefined){
    window.clearTimeout(jumpSheepId);
  }
  window.clearInterval(generateNewFenceId);  //stop everythingin place!
  window.clearInterval(advanceFenceId);      //resize still possible
  window.clearInterval(onTimerId);
  window.clearInterval(makeCloudId);
  window.clearInterval(cloudIntId);
  window.clearInterval(advanceClouds);
  drawPause();
}

function unPauseGame(){    // restart everything from where it was
  window.startGame = true;
  game.paused = false;
  if(!sheep.onGround && !sheep.hover){
    jumpSheep(Math.round(sheep.startYPosRelToCanvas*canvas.height),
              sheep.jumpSpeed,sheep.acceleration);
  }
  else{
    sheepSizePosition();
  }
  onTimerId = setInterval(onTimer, game.timerDelay);
  cloudIntId = setInterval(advanceClouds, game.timerDelay);
  fenceFactory();
}



////////////////////////////////////////
//  Rendered Text, moon, and grass    //
////////////////////////////////////////


function fencesJumped(fences){     //keep track in moon
	var fontSize = canvas.width*.06
	ctx.font = fontSize+"px Impact";
	ctx.fillStyle = 'rgb(255, 236, 134)'
	ctx.fillText(""+fences, canvas.width*.51, canvas.height*.174);
}

function calcTime(time){    //timer to seconds
	if (time < 0) {return 0;}
	else {
		return Math.round(time/10);
	}
}

function timeLeft(time, color){    // keep track of time left
	var fontSize = canvas.width*.06;
	ctx.font = fontSize+"px Impact";
	ctx.fillStyle = color;
	ctx.fillText("Time Left : "+calcTime(time), .64*canvas.width, canvas.height/6.4);
}

function fenceGoal(goal){         //draw mini fences in top left to 
  for (var i = 0; i < goal; i++){    //show how many left until next level
    j = (canvas.width/25)*i;
    ctx.drawImage(spriteSheet,2562, 155, 255, 208, 
                               .02*canvas.width+j, canvas.height*.1,
                                canvas.width*.035,canvas.height*.04);
  }
}

function drawMoon(canvas){
	ctx.drawImage(spriteSheet,0,0,300,350,canvas.width*.44, canvas.height*.05,
		                                  canvas.width*.13,canvas.height*.2);
}

function drawGrass(){   //make grass move, stitch two grass images together
	if (game.grassx < -canvas.width) {game.grassx = 0;}
	ctx.drawImage(grass, game.grassx, 0, canvas.width, canvas.height);
	ctx.drawImage(grass, game.grassx+canvas.width, 0, canvas.width, canvas.height);
}

function gameOverMessage() {
  var fontSize = canvas.width*.06;
  ctx.textAlign = 'center';
  game.over = true;
  ctx.drawImage(spriteSheet, 137, 926, 431, 253, canvas.width*.34, canvas.height*.28,
                                                 canvas.width*.35, canvas.height*.3);
}



////////////////////////////////////////
//  Starting and Running the Game    //
////////////////////////////////////////



function reset(){ //called when game over
  init();    // reinitialize variables
  window.runAnimation = true; 
  window.startGame = false;
  sheepAnimateId = setInterval(animateSheep, game.timerDelay);
	startAnim();
}



function startAnim(){
  window.runAnimation = true;
  window.addEventListener('resize', sizeCanvas);
  sizeCanvas();
  reDrawSheep(5);  
  if (sheep.xPos < Math.round(ctx.canvas.width*.2)){
    setTimeout(startAnim, 40);
    game.levelup = true;
  }
  else{
    window.startGame = true;
    window.runAnimation = false;
    window.clearInterval(sheepAnimateId);
    game.levelup = false;
    run();
  }
}


function redrawAll() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    if (game.origCloudsx > -canvas.width){
    origClouds(game.origCloudsx, canvas.height*.2);}
    CLOUD.drawClouds();
    fencesJumped(game.fencesJumped, canvas, ctx);
    timeLeft(game.timer, game.timeColor, canvas, ctx);
    game.timeColor = 'rgb(157, 188, 196)'; //set back to blue (for flash of red/green)
    if (game.timer <= 100){game.timeColor = 'rgb(222, 110, 91)';} // red if <10 sec
    fenceGoal(game.goal, canvas, ctx);
    drawMoon(canvas, ctx);
    drawGrass();
    if (game.levelup){        // display level 
      ctx.drawImage(spriteSheet, 768, 859, 550, 308, 
                    canvas.width*.335, canvas.height*.33,
                    canvas.width*.35, canvas.height*.2);
      var fontSize = canvas.width*.065;
      ctx.font = fontSize+"px Impact";
      ctx.fillStyle = 'rgb(18, 16, 41)';
      ctx.fillText("Level "+(game.level+1), .42*canvas.width, canvas.height*.46);
    }
    if (!game.over && game.paused){ //pause dialog
      ctx.drawImage(spriteSheet, 768, 859, 550, 308, 
                    canvas.width*.335, canvas.height*.33,
                    canvas.width*.35, canvas.height*.2);
      var fontSize = canvas.width*.065;
      ctx.font = fontSize+"px Impact";
      ctx.fillStyle = 'rgb(18, 16, 41)';
      ctx.fillText("Paused", .41*canvas.width, canvas.height*.46);
  }

    if (sheep.lane === 0){    //draw sheep in front of or behind fences
      drawFencesInLane(2);    //depending on what lane he is in
      drawFencesInLane(1);
      drawFencesInLane(0);
      drawSheep(sheep.xPos,sheep.yPos);
    }
    else if (sheep.lane === 1){
      drawFencesInLane(2);
      drawFencesInLane(1);
      drawSheep(sheep.xPos,sheep.yPos);
      drawFencesInLane(0); 
    }
    else if (sheep.lane == 2){
      drawFencesInLane(2);
      drawSheep(sheep.xPos,sheep.yPos);
      drawFencesInLane(1);
      drawFencesInLane(0); 
    }
    else{
      drawSheep(sheep.xPos,sheep.yPos);
    }

    if (game.timer < 0){
      game.over = true;
      pauseGame();
      gameOverMessage();
    }
}

function onTimer() {
    redrawAll();
    animateSheep(sheep.image);
    game.timer--;
}


function run() {
    canvas.addEventListener('keydown', onKeyDown, false);
    // make canvas focusable, then give it focus!
    canvas.setAttribute('tabindex','0');
    canvas.focus();
    onTimerId = setInterval(onTimer, game.timerDelay);  
    sizeCanvas();
    fenceFactory();
    startClouds();
}


spriteSheet.onload = function () { //start the game once the sprite is loaded
  init();
  splashScreen();
}


function startGameAnimation(event){
  window.removeEventListener('resize',sizeSplashScreen);
  canvas.removeEventListener('keydown',startGameAnimation);
  clearInterval(drawScreenId);
  window.startScreen = false;
  sheepAnimateId = setInterval(animateSheep, game.timerDelay);
  startAnim();
}

var drawScreen = function(glowPics){    // cycle through splashscreens to animate
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(spriteSheet,191, glowPics[window.splashScreenSprite], 
                1067, 727, 0, 0,canvas.width,canvas.height);
  window.splashScreenSprite = ((window.splashScreenSprite+1)%8);
  ctx.drawImage(spriteSheet,1518, 1287, 517, 183, .4*canvas.width, .85*canvas.height,
                                                  .2*canvas.width, .1*canvas.height);
}

function sizeSplashScreen(){
  var glowPics = [3432,1251,1978,2705,4159,2705,1978,1251] //indices from sprite sheet
  var curWidth = window.innerWidth
  if (curWidth > 640){
    canvas.width  = window.innerWidth-50;
  }
  else {canvas.width  = 590}
  canvas.height = Math.round(canvas.width*.75);
  window.splashScreenSprite = 0;
  clearInterval(drawScreenId);
  drawScreenId = setInterval(function(){drawScreen(glowPics);},100);
}

function getPosition(event)
{
  var x = event.x;    //get mouse click
  var y = event.y;
  return {x: x, y: y};
}

function splashScreen(){
    var actOnClick = function(event){
      var pos = getPosition(event);
      console.log(pos.x, pos.y);
      if ((pos.x >= canvas.height*.55) && (pos.x <= canvas.width*.62) &&  // within
          (pos.y >= canvas.height*.85) && (pos.y <= canvas.height*.95)){  // button
        canvas.removeEventListener('mousedown', actOnClick); //end mouse click
        startGameAnimation(); //begin game
      }
    }
    //canvas.addEventListener('keydown',startGameAnimation);
    canvas.addEventListener('mousedown', actOnClick, false);
    window.addEventListener('resize', sizeSplashScreen);
    sizeSplashScreen();
    canvas.setAttribute('tabindex','0');
    canvas.focus();
}

///////////////////////////////////////////////////////////////////////