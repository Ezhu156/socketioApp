document.addEventListener("DOMContentLoaded", function() {
   var mouse = { 
      click: false,
      move: false,
      pos: {x:0, y:0},
      pos_prev: false,
      within: false
   };
   // get canvas element and create context
   var canvas  = document.getElementById('drawing');
   var context = canvas.getContext('2d');
   var width   = window.innerWidth;
   var height  = window.innerHeight;
   var socket  = io.connect();

   //sets the size of the canvas
   canvas.width = 500;
   canvas.height = 500;

   //sets the color of the canvas
   canvas.style.backgroundColor = 'rgb(255,255,255)';

   // register mouse event handlers
   canvas.onmousedown = function(e){ mouse.click = true; };
   canvas.onmouseup = function(e){ mouse.click = false; };

   canvas.onmousemove = function(e) {
   // normalize mouse position to range 0.0 - 1.0
      mouse.pos.x = e.clientX / width;
      mouse.pos.y = e.clientY / height;
      mouse.move = true;
      if(mouse.pos.x <= canvas.width && mouse.pos.y <= canvas.height){
         console.log("within")
         mouse.within=true;
      }
   };

   // draw line received from server
  socket.on('draw_line', function (data) {
      var line = data.line;
      context.beginPath();
      context.moveTo(line[0].x * width, line[0].y * height);
      context.lineTo(line[1].x * width, line[1].y * height);
      context.stroke();
   });
   

   // main loop, running every 25ms
   function mainLoop() {
      // check if the user is drawing
      if (mouse.click && mouse.move && mouse.pos_prev && mouse.within) {
         // send line to to the server
         socket.emit('draw_line', { line: [ mouse.pos, mouse.pos_prev ] });
         mouse.move = false;
      }
      mouse.pos_prev = {x: mouse.pos.x, y: mouse.pos.y};
      setTimeout(mainLoop, 25);
   }

   socket.on('draw', function(){
      mainLoop();
   });

   socket.on('clear', function(){
      context.clearRect(0,0, canvas.width, canvas.height);
      socket.emit('clear');
   })

   var user;

   //chat
   $('form').submit(function(e){
      e.preventDefault(); // prevents page reloading
      socket.emit('chat message', $('#m').val());
      $('#m').val('');
      return false;
   });

   socket.on('chat message', function(msg){
      $('#messages').append($('<li>').text(msg));
   });

   socket.on('connectToRoom', function(data){
         $('#messages').append($('<li>').text(data));
   })

   socket.on('new drawer', function(){
      socket.emit('new drawer', user);
   })

   socket.on('yourself', function(msg){
      $('#yourself').append($('<h2>').text(msg));
   });

   socket.on('clear chat', function(){
      $('#messages').empty();
   })
});
