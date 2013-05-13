function checkForEnd(board, col, row){
	
	var index = col * 6;
	var moveColor = board[index + row];
	
	//check for vertical
	var run = 1;
	for(var i=row-1; i >=0; --i){
		if(board[index+i] != moveColor)
			break;
		else
			++run;
	}
	for(var i=row+1; i < 6; ++i){
		if(board[index+i] != moveColor)
			break;
		else
			++run;
	}
	console.log('vertical');
	if(run >= 4)
		return true;
	
	//check for horizontal
	run = 1;
	for(var i=col-1; i >=0; --i){
		if(board[i*6 + row] != moveColor)
			break;
		else{
			console.log((col*i) + ' 1: ' + row);
			++run;
		}
	}
	for(var i=col+1; i < 7; ++i){
		if(board[i*6 + row] != moveColor)
			break;
		else{
			++run;
		}
	}
	console.log('horizontal');
	if(run >= 4)
		return true;
		
	//check for forward diagonal
	run = 1;
	var count = 1;
	for(var i=row-1; i >=0; --i){
		if((index-(6*count)+i < 0) || board[index-(6*count)+i] != moveColor)
			break;
		++run;
		++count;
	}
	count = 1;
	for(var i=row+1; i < 6; ++i){
		if((index+(6*count)+i >= 6*7 ) || board[index+(6*count)+i] != moveColor)
			break;
		++run;
		++count;
	}
	console.log('forward diagonal');
	if(run >= 4)
		return true;	

	//check for backward diagonal
	run = 1;
	var count = 1;
	for(var i=row-1; i >=0; --i){
		if((index+(6*count)+i >= 6*7 ) || board[index+(6*count)+i] != moveColor)
			break;
		++run;
		++count;
	}
	count = 1;
	for(var i=row+1; i < 6; ++i){
		if((index-(6*count)+i < 0) || board[index-(6*count)+i] != moveColor)
			break;
		++run;
		++count;
	}
	console.log('backward diagonal');
	if(run >= 4)
		return true;
	
	return false;		
}

function passesValidation(gameid1, gameid2, roles, id){
	if(roles[id] == "player1" && id != gameid1)
		return false;
	if(roles[id] == "player2" && id != gameid2)
		return false;
	return true;		
}

function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

exports.checkForEnd = checkForEnd;
exports.passesValidation = passesValidation;
exports.pad = pad;