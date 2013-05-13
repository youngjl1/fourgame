var socket = io.connect();		 

var global = {
	name: '',
	role: '',
	id: '',
	playerMove: '',
	playerColor: ''
};

var HEIGHT = 5;
var WIDTH = 6;

$(document).ready(function() {
	socket.emit('initialLoad', {gameId: window.location.pathname.substring(1)});
	socket.on('initialStatus', function(data){
		if(data.player1Taken == true){
			$('#player1').attr('disabled',true);
			$('#player1').next().append(' (taken)')
		}
		if(data.player2Taken == true){
			$('#player2').attr('disabled',true);
			$('#player2').next().append(' (taken)')
		}
	});
	socket.on('goHome', function(){
		window.location='/';
	});
	
	
	global.playerMove = local_move;
	
	$("#message").keyup(function(event){
		if(event.keyCode == 13){
			$("#btnPostMessage").click();
		}
	});		 
	
	//socket.on('confirmPlayer', function(data){
	//	global.id = data.id;
		//socket.emit('messageFromClient', {message: '<a new person has joined>', role: '', name: ''});
		$(window).unload(function() {
			socket.emit('disconnect2', {id: global.id, role: global.role, gameId: window.location.pathname.substring(1)});
		});		
	//});
	socket.on('errorMessage', function(data){
		alert(data.error);
	});
	
	$('td').hover(function(){
		$("table > tbody > tr > td:nth-child(" + (this.cellIndex+1) + ")").css("background-color",global.color);
		
	},
	function(){
		$("table > tbody > tr > td:nth-child(" + (this.cellIndex+1) + ")").css("background-color","white");		
	})
	
	$('td').click(function(){ 
		if(global.playerMove == global.role){
			var col = this.cellIndex;
			socket.emit('sendMove', {col: col});
		}
		else{
			$('#chatBox').append($('<div class="message"></div>').text("Waiting for other player"));
		}
	});
	socket.on('returnMove', function(data){
		var table = $("#table")[0];
		var cell = table.rows[HEIGHT - data.row].cells[data.col];
		//var imageURL = data.role == "player1" ? "url('/images/redCoin.png')" : "url('/images/blueCoin.png')";
		//$(cell).css('background-image', imageURL); 
		$(cell).attr('class', data.role);
		global.playerMove = data.playerMove
	});
	
	$('table').disableSelection();
	$('#myModal').modal({backdrop: false, keyboard: true});
	
	$('#myModal').on("hide", function(){
		var isValid = true;
		
		if($("#name").val().length == 0){
			isValid = false;
			if($('.get-name .red').length == 0)
				$('.get-name').prepend('<span class="red">*</span>')
		}
		else
			$('.get-name .red').remove();
		
		if($('input[name=role]:checked').length == 0){
			isValid = false;
			if($('.get-role .red').length == 0)
				$('.get-role').prepend('<span class="red bold">*</span>')
		}
		else
			$('.get-role .red').remove();
		
		if(!isValid)
			return false;
		else
		{
			$('.screenMask').remove();
			global.name = $("#name").val()
			global.role = $('input[name=role]:checked').val()
			if(global.role == "player1")
				global.color = "#FF7C7C"
			else if(global.role == "player2")
				global.color = "#77A0FF"
			
			socket.emit('joinGame', {role: global.role});
		}
	})
	
});	

//var socket = io.connect('http://localhost:3000/');		

function postMessage(){
	var myMessage = $('#message').val();
	$('#message').val('');
	socket.emit('messageFromClient', {message: myMessage, role: global.role, name: global.name});	
}
socket.on('broadcastMessage', function (data) {
	if(data.name.length > 0)
		$('#chatBox').append($('<div class="message ' + data.role + '"></div>').text(data.name + ': ' + data.message));
	else
		$('#chatBox').append($('<div class="message"></div>').text(data.message));
	
	document.getElementById("chatBox").scrollTop = document.getElementById("chatBox").scrollHeight;
});


(function($){
    $.fn.disableSelection = function() {
        return this
                 .attr('unselectable', 'on')
                 .css('user-select', 'none')
                 .on('selectstart', false);
    };
})(jQuery);