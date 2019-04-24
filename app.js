var express = require('express'), 
	app = express(),
	http = require('http'),
	socketIo = require('socket.io'),
	path= require('path');
var server = http.createServer(app);
var io = socketIo.listen(server);
server.listen(8080);
app.use(express.static(__dirname + '/public'));
console.log("Server running on 127.0.0.1:8080");

app.use(express.static(path.join(__dirname, "public")));

app.get('/', function(req, res) {
   res.sendfile('index.html');
});

var line_history = [];
var users = [];
var currDrawer = 0;

var words = ['cheese', 'bacon', 'flamingo', 'chicken', 'pig', 'sky', 'moon', 'cake', 'buffalo', 'pizza', 'air', 'water', 'dino', 'krabby patty'];
var randNum;

function newWord(){
	randNum = Math.floor(Math.random()*words.length);
	return words[randNum];
}

var wordToGuess = "";
var userDrawing = "";


io.on('connection', function (socket) {
	users.push(socket.id);
	console.log(users);
	socket.emit('yourself', "Your id: " + socket.id);


	//joins specific room
	if(io.sockets.adapter.rooms["drawer"] === undefined){
		socket.join("drawer");
		// socket.emit('chat message', socket.id + "in room drawer");
		io.in(socket.id).emit('draw');
		wordToGuess = newWord();
		io.in(socket.id).emit('chat message', "Word to Draw: " + wordToGuess);
		userDrawing = socket.id;
	} else{
		socket.join("guesser");
		io.in(socket.id).emit("chat message", "You are guessing");
	}
	socket.emit("chat message", userDrawing + " is drawing");

	//disconnect
	socket.on('disconnect', function(){
		for (var i=0; i < users.length; i++){
			if (users[i] == socket.id){
				users.splice(i,1);
			};
		};
		// console.log('user disconnected');
		// console.log(users);

		if (io.sockets.adapter.rooms["drawer"] === undefined) {
			// var x = Math.floor(Math.random() * users.length);
			if(users[currDrawer] === undefined){
				currDrawer=0;
			}
			// console.log("current:", currDrawer, " ", users[currDrawer]);
			socket.emit('chat message', socket.id + " is drawing!");
			io.in(users[currDrawer]).emit('new drawer', users[currDrawer]);
		};
	});

	socket.on('new drawer', function(name) {
		// console.log("current:", currDrawer, " ", users[currDrawer]);
		socket.leave('guesser');
		socket.join('drawer');
		wordToGuess = newWord();
		userDrawing = socket.id;
		io.in(socket.id).emit('chat message', "Word to Draw: " + wordToGuess);
		io.in(socket.id).emit('draw');
		for(var i=0; i<users.length; i++){
			io.in(users[i]).emit('clear');
			io.in(users[i]).emit("chat message", userDrawing + " is drawing");
		}
		// socket.emit("chat message", userDrawing + " is drawing");
	});

	socket.on('chat message', function(msg){
		if (msg === wordToGuess){
			for (var i=0; i<users.length; i++){
				io.in(users[i]).emit('clear chat');
			}
			// io.emit('clear chat');
			io.emit('chat message', socket.id + "Guessed the Correct word");
			if (users[currDrawer+1] === undefined){
				currDrawer = 0;
			} else{
				currDrawer +=1;
			}
			io.in(users[currDrawer]).emit('new drawer', users[currDrawer]);
		} else{
			io.emit('chat message', socket.username + ": " + msg);
		}
		console.log('message: ' + msg);
	});

	io.emit('some event', { for: 'everyone' });

	//drawing
	for (var i in line_history) {
		socket.emit('draw_line', { line: line_history[i] } );
	}
	socket.on('draw_line', function (data) {
		line_history.push(data.line);
		io.emit('draw_line', { line: data.line });
	});

	socket.on('clear', function(){
		line_history=[];
		console.log("clear");
	})
});

// http://code-and.coffee/post/2015/collaborative-drawing-canvas-node-websocket/

