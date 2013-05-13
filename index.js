var express = require('express')
home = require('./models/home')
utils = require('./lib/utils')
var http = require('http');
var path = require('path');

var app = express(); 
var server = http.createServer(app);
var io = require('socket.io').listen(server);

var PLAYER1 = "player1"
var PLAYER2 = "player2"
var OBSERVER = 'observer'


var games = {}; //to know a table/room/url's game state

var sock_roles = {}; //to know a socket's role
var sock_names = {}; //to know a socket's name
var sock_urls = {};	//to know a socket's table/room

function Game(){
	this.board = [];
	for(var i=0; i < 6*7; ++i){
		this.board.push(0);
	}
	this.totalMoves = 0;
	this.playerMove = PLAYER1;
	this.player1ID = '';
	this.player2ID = '';
}
//Game.prototype.getInfo = function() {

io.sockets.on('connection', function (socket) {
  handleGameJoining(socket);
  handleGameMoves(socket);
  handleMessaging(socket);
  handleDisconnect(socket);
  
  socket.on('initialLoad', function(data){
	var game = games[data.gameId];
	if(game == undefined){
		socket.emit('goHome',{});
		return;
	}
	sock_urls[socket.id] = data.gameId;
	socket.join(data.gameId);
	socket.emit('initialStatus', {player1Taken: game.player1ID.length > 0, player2Taken: game.player2ID.length > 0} );
  });
  
});

app.configure(function () {
	app.set('test','You can use app.get to get this text anywhere');

	app.set('view engine','jade');
	app.set('views', __dirname +  '/views');
	
	app.use(express.bodyParser());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
    app.use('public/stylesheets', express.static(path.join(__dirname, 'public/stylesheets')));	
    app.use('public/js', express.static(path.join(__dirname, 'public/js')));	
    app.use('public/images', express.static(path.join(__dirname, 'public/images')));	
});

app.get('/', function(req, res){
	//check db, if url is valid serve up game page
	res.render('homepage', {title: "GameTable"});
});

app.get(/^\/(\d{5})$/i, function(req, res){
	var gameID = req.url.substring(1);
	if(!games[gameID]){
		res.writeHead(302, {
		  'Location': '/' 
		  //add other headers here...
		});
		res.end();
		return;
	} 
	game = games[gameID];
	console.log('get request');
	res.render('gamepage', {title: "four in a row", 
							move: game.playerMove,
							board: game.board,
							player1Taken: game.player1ID.length > 0, player2Taken: game.player2ID.length > 0});
});

app.post('/', function(request, response){
	var gameId = Math.floor((Math.random()*100000));
	while(games[gameId]){
		gameId = Math.floor((Math.random()*100000));
	} 
	games[gameId] = new Game();

	response.writeHead(302, {
	  'Location': '/' + utils.pad(gameId, 5)
	  //add other headers here...
	});
	response.end();
});

server.listen(3000);

function handleGameJoining(socket){
  socket.on('joinGame', function(data){
	
	var game = games[sock_urls[socket.id]];
	var url = sock_urls[socket.id];
	
	var myId = '';
	var myError = '';
	var message = ' has joined>';
	if(data.role == PLAYER1){
		if(game.player1ID.length == 0){
			game.player1ID = socket.id;
			sock_roles[socket.id] = PLAYER1;
			message = '<Player 1' + message;
		}
		else
			myError = 'Error: Player 1 was already taken';
	}
	else if(data.role == PLAYER2){
		if(game.player2ID.length == 0){
			game.player2ID = socket.id;
			sock_roles[socket.id] = PLAYER2;
			
			message = '<Player 2' + message;
		}
		else
			myError = 'Error: Player 2 was already taken';
	}
	else if(data.role == OBSERVER)
		message = '<An observer' + message;
	else
		myError = "Error: Unknown role"
	
	if(myError.length > 0)
		socket.emit('errorMessage', {error: myError});
	else{
		socket.emit('broadcastMessage', {message: message, role: '', name: ''} )		
		socket.broadcast.to(url).emit('broadcastMessage', {message: message, role: '', name: ''} )		
		console.log("after broadcast: " + message);
	}
  });
}

function handleGameMoves(socket){
  socket.on('sendMove', function (data) {
	
	var game = games[sock_urls[socket.id]];	
	var url = sock_urls[socket.id];
	var role = sock_roles[socket.id];
	

	if(!utils.passesValidation(game.player1ID, game.player2ID, sock_roles, socket.id) || game.playerMove != role){
		socket.emit('errorMessage', {error: "Invalid move"});
		return;
	}
	
	var startPoint = data.col * 6;
	var playerSign = (role == PLAYER1) ? 1 : 2;
	
	var i = 0;
	while(game.board[startPoint + i] != 0){
		++i;
		if(i > 5){
			socket.emit('broadcastMessage', {message: "Column is filled.", role: '', name: ''} );
			return;
		}
	}
	var row = i;
	game.board[startPoint+row] = playerSign; 
	++game.totalMoves;
	
	var gameOver = utils.checkForEnd(game.board, data.col, row);
	if(gameOver){
		socket.emit('broadcastMessage', {message: game.playerMove + " is the winner!", role: '', name: ''} );
		socket.broadcast.to(url).emit('broadcastMessage', {message: game.playerMove + " is the winner!", role: '', name: ''} );
		game.playerMove = 'none';
	}
	else if(game.totalMoves >= 6*7){
		socket.emit('broadcastMessage', {message: "The game is a draw.", role: '', name: ''} );
		socket.broadcast.to(url).emit('broadcastMessage', {message: "The game is a draw.", role: '', name: ''} );

		game.playerMove = 'none';
	}
	else{	
		game.playerMove = (game.playerMove==PLAYER1) ? PLAYER2 : PLAYER1;
	}
	socket.emit('returnMove', {role: role , col: data.col, row: row, playerMove: game.playerMove});
	socket.broadcast.to(url).emit('returnMove', {role: role , col: data.col, row: row, playerMove: game.playerMove});
 	
  });
}

function handleMessaging(socket){
  socket.on('messageFromClient', function (data) {
	var url = sock_urls[socket.id];	
	
	socket.emit('broadcastMessage', data);
	socket.broadcast.to(url).emit('broadcastMessage', data);
  });
}

function handleDisconnect(socket){
  socket.on('disconnect2', function(data){
	console.log('disconnect2 function');
	var game = games[sock_urls[socket.id]];	
	var url = sock_urls[socket.id];
	var role = sock_roles[socket.id];
	
	var message = " has left the page>";
	var error = '';
	if(role == PLAYER1 && socket.id == game.player1ID){
		game.player1ID = '';
		message = "<player 1 " + message;
	}
	else if(role == PLAYER2 && socket.id == game.player2ID){
		game.player2ID = ''
		message = "<player 2 " + message;
	}
	else if(role == OBSERVER)
		message = "<An observer " + message;
	else
		error = "unknown role";
		
	if(error.length > 0){
		socket.emit('errorMessage', {error: error});
	}
	else
	{
		//insert code here to delete page if there are no connections
		socket.broadcast.to(url).emit('broadcastMessage', {message: message, role: '', name: ''});		
		

	}
		
  });

  socket.on('disconnect', function(data){
	console.log('disconnect function');
	var url = sock_urls[socket.id];
	socket.leave(url);
  
	delete sock_roles[socket.id];
	delete sock_urls[socket.id];
	
	console.log('Disconnection. Connections left: ' + io.sockets.clients(url).length)
	if(io.sockets.clients(url).length == 0){
		console.log("There are 0 connections :/ Setting timeout");
		setTimeout(function(){
			console.log("There are " + io.sockets.clients(url).length + " connections remaining.");
			if(io.sockets.clients(url).length == 0){				
				console.log("Closing room.");
				delete games[url];
			}
		}, 5000);
	}
  });
}



