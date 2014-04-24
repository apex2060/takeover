app.factory('game', function($rootScope, $timeout, turn, tileService, ai){
	var game = {
		board:function(){
			var board = [];
			// var settings = $rootScope.settings
			var players = $rootScope.game.players;
			if(players){
				var lw = 8
				var settings = {
					y: (6+players.length),
					x: (6+players.length)
				};
			}else{
				var settings = {
					y: (6),
					x: (6)
				};
			}

			for(var y=0; y<settings.y; y++){
				var col = [];
				for(var x=0; x<settings.x; x++){
					var tile = {
						owner: -1,
						color: 'silver',
						x: x,
						y: y
					}
					col.push(tile);
				}
				board.push(col);
			}
			return game.initTiles(board);
		},
		initTiles:function(board){
			var players = $rootScope.game.players
			var height = board.length;
			var width = board[0].length;

			var first = (height-players.length)/2
			var offset = 0;
			if(players.length>2)
				offset = -1;

			for(var p=0; p<players.length; p++){
				for(var i=0; i<players.length; i++){
					if(p%2)
						var tile = board[first+i+offset][first+p]
					else
						var tile = board[first+i][first+p]
					tile.owner = players[p]
					tile.color = players[p].color
				}
			}
			return board;
		},
		setup:function(){
			var localGame = localStorage.getItem('game');
			if(localGame)
				$rootScope.game = angular.fromJson(localGame)
			else
				$rootScope.game = {
					players: [],
					board: game.board(),
					recent: []
				}
		},
		reset:function(clearPersonality){
			if(confirm('Are you sure you would like to restart the game?')){
				$rootScope.game.board = game.board()
				$rootScope.game.recent = []
				if(clearPersonality)
					for(var i=0; i<$rootScope.game.players.length; i++)
						$rootScope.game.players[i].personality = false;
			}
		},
		isAtEnd:function(){
			var emptyTile = false;
			for(var r=0; r<$rootScope.game.board.length; r++)
				for(var c=0; c<$rootScope.game.board[r].length; c++)
					if($rootScope.game.board[r][c].owner == -1)
						emptyTile = true
			return !emptyTile;
		},
		place:function(tile, player){
			if(tile){
				tileService.place(tile, player).then(function(newPlayer){
					if(newPlayer.isComputer){
						$timeout(function(){
							var ttp = ai.decision.chooseTile(newPlayer)
								game.place(ttp, newPlayer)
						}, 1, true);
					}
				})
			}else{
				if(!game.isAtEnd()){
					var newPlayer = turn.advance(newPlayer)
					$rootScope.temp.player = newPlayer
					if(newPlayer.isComputer){
						$timeout(function(){
							var ttp = ai.decision.chooseTile(newPlayer)
								game.place(ttp, newPlayer)
						}, 1, true);
					}
				}else{
					//Learn From Game!
				}
			}
		}
	}
	return game;
})





app.factory('turn', function ($rootScope) {
	return {
		advance:function(player){
			var nextPlayer;
			var players = $rootScope.game.players;
			if(players.length-1 == players.indexOf(player))//last player
				nextPlayer = players[0]
			else
				nextPlayer = players[players.indexOf(player)+1]
			$rootScope.temp.current = nextPlayer;
			return nextPlayer;
		}
	}
});










app.factory('tileService', function ($rootScope, $q, medulla, turn) {
	var highlighted = [];
	var history = {
		placed: 	[],
		changed: 	[]
	}
	it.history = history;

	function playerByName(name){
		for(var i=0; i<$rootScope.game.players.length; i++)
			if($rootScope.game.players[i].name == name)
				return $rootScope.game.players[i]
	}
	return {
		undo: function(){
			var last = {
				placed: history.placed.pop(),
				changed: history.changed.pop()
			}
			if(last.placed){
				var lastPlaced = $rootScope.game.board[last.placed.y][last.placed.x];
					lastPlaced.owner = -1;
					lastPlaced.color = 'silver';

				for(var i=0; i<last.changed.length; i++){
					var lastChanged = $rootScope.game.board[last.changed[i].y][last.changed[i].x];
					var previousOwner = playerByName(last.changed[i].owner.name)
					lastChanged.owner = previousOwner;
					lastChanged.color = previousOwner.color;
				}
			}
		},
		wipeout:function(){
			while(highlighted.length > 0){
				var piece = highlighted.pop()
				delete piece.highlight;
			}
		},
		highlight:function(tile, player){
			this.wipeout();
			var affected = medulla.affectedTiles(tile, player)
			for(var i=0; i<affected.length; i++){
				affected[i].highlight = player;
				highlighted.push(affected[i]);
			}
		},
		place:function(tile, player){
			var deferred = $q.defer();
			if(medulla.canPlaceTile(tile, player)){
				var affected = medulla.affectedTiles(tile, player);
				history.changed.push(angular.fromJson(angular.toJson(affected)))
				for(var i=0; i<affected.length; i++){
					affected[i].owner = player
					affected[i].color = player.color;
				}

				tile.owner = player;
				tile.color = player.color;
				history.placed.push(angular.fromJson(angular.toJson(tile)))

				var newPlayer = turn.advance(player);
				deferred.resolve(newPlayer)
				// $rootScope.game.recent.push(tile);
			}
			return deferred.promise;
		},
		isRecent:function(tile){
			return $rootScope.game.recent.indexOf(tile) != -1;
		},
		ownerCt:function(player){
			var ct = 0;
			for(var r=0; r<$rootScope.game.board.length; r++)
				for(var c=0; c<$rootScope.game.board[r].length; c++)
					if($rootScope.game.board[r][c].owner.name == player.name)
						ct++;
			return ct;
		}
	}
});








app.factory('medulla', function ($rootScope) {
	var highlighted = [];
	var medulla = {
		all:function(tile){
			return {
				n: 		medulla.n(tile),
				ne: 	medulla.ne(tile),
				e: 		medulla.e(tile),
				se: 	medulla.se(tile),
				s: 		medulla.s(tile),
				sw: 	medulla.sw(tile),
				w: 		medulla.w(tile),
				nw: 	medulla.nw(tile)
			}
		},
		arr:function(tile){
			return [
			medulla.n(tile),
			medulla.ne(tile),
			medulla.e(tile),
			medulla.se(tile),
			medulla.s(tile),
			medulla.sw(tile),
			medulla.w(tile),
			medulla.nw(tile)
			]
		},
		n:function(tile){
			var fishLine = [];
			for(var y=tile.y; y>0; y--){
				var piece = $rootScope.game.board[y-1][tile.x]
				fishLine.push(piece)
			}
			return fishLine;
		},
		ne:function(tile){
			var solarWinds = []
			var north = medulla.n(tile)
			var east = medulla.e(tile)
			var min = Math.min(north.length,east.length)
			for(var i=0; i<min; i++){
				solarWinds.push($rootScope.game.board[north[i].y][east[i].x])
			}
			return solarWinds;
		},
		e:function(tile){
			var fishLine = [];
			for(var x=tile.x+1; x<$rootScope.game.board[0].length; x++){
				var piece = $rootScope.game.board[tile.y][x]
				fishLine.push(piece)
			}
			return fishLine;
		},
		se:function(tile){
			var solarWinds = []
			var south = medulla.s(tile)
			var east = medulla.e(tile)
			var min = Math.min(south.length,east.length)
			for(var i=0; i<min; i++){
				solarWinds.push($rootScope.game.board[south[i].y][east[i].x])
			}
			return solarWinds;
		},
		s:function(tile){
			var fishLine = [];
			for(var y=tile.y+1; y<$rootScope.game.board.length; y++){
				var piece = $rootScope.game.board[y][tile.x]
				fishLine.push(piece)
			}
			return fishLine;
		},
		sw:function(tile){
			var solarWinds = []
			var south = medulla.s(tile)
			var west = medulla.w(tile)
			var min = Math.min(south.length,west.length)
			for(var i=0; i<min; i++){
				solarWinds.push($rootScope.game.board[south[i].y][west[i].x])
			}
			return solarWinds;
		},
		w:function(tile){
			var fishLine = [];
			for(var x=tile.x; x>0; x--){
				var piece = $rootScope.game.board[tile.y][x-1]
				fishLine.push(piece)
			}
			return fishLine;
		},
		nw:function(tile){
			var solarWinds = []
			var north = medulla.n(tile)
			var west = medulla.w(tile)
			var min = Math.min(north.length,west.length)
			for(var i=0; i<min; i++){
				solarWinds.push($rootScope.game.board[north[i].y][west[i].x])
			}
			return solarWinds;
		},

		referee:function(line, player){
			var wouldChange = []
			if(player){
				for(var i=0; i<line.length; i++){
					var piece = line[i]
					if(piece.owner != -1){
						if(piece.owner.name != player.name){
							wouldChange.push(piece);
						}else{
							return wouldChange;
						}
					}else{
						return []
					}
				}
				return []
			}else{
				return []
			}
		},
		affectedLine:function(tile, player){
			var affected = [];
			if(tile && tile.owner==-1){
				var spiderWeb = medulla.arr(tile)
				for(var i=0; i<spiderWeb.length; i++){
					var filtered = medulla.referee(spiderWeb[i], player)
					affected.push(filtered);
				}
			}
			return affected;
		},
		affectedTiles:function(tile, player){
			var affectedTiles = [];
			var affected = medulla.affectedLine(tile, player)
			for(var i=0; i<affected.length; i++)
				affectedTiles = affectedTiles.concat(affected[i])
			return affectedTiles
		},
		changeCount:function(tile, player){
			return medulla.affectedTiles(tile, player).length;
		},
		canPlaceTile:function(tile, player){
			function hasOwner(tile){
				if(tile)
					return tile.owner != -1
			}
			function allowsProgression(tile, player){
				return medulla.changeCount(tile, player) > 0
			}
			// console.log('hasOwner',hasOwner(tile))
			// console.log('allowsProgression',allowsProgression(tile, player))
			return (!hasOwner(tile) && allowsProgression(tile,player)) //true
		},
		tilesAvail:function(){
			var ct = 0;
			for(var y=0; y<$rootScope.game.board.length; y++)
				for(var x=0; x<$rootScope.game.board[y].length; x++)
					if($rootScope.game.board[y][x].owner==-1)
						ct++;
			return ct;
		}
	}

	it.medulla = medulla;
	return medulla;
});

// app.factory('ai', function ($rootScope, $timeout, tile, medulla) {
// 	var ai = {
// 		autoPlay:function(){
// 			$timeout(function(){
// 				$rootScope.$apply(function(){
// 					ai.beginTurn($rootScope.temp.current);
// 				})
// 				ai.autoPlay();
// 			}, 1500)
// 		},
// 		beginTurn:function(player){
// 			var ttplace = ai.tileToChoose(player)
// 			tile.place(ttplace,player);
// 		},
// 		tileAffects:function(player){
// 			var tileList = [];
// 			var rankList = [];
// 			for(var y=0; y<$rootScope.game.board.length; y++){
// 				for(var x=0; x<$rootScope.game.board[y].length; x++){
// 					var tempTile = $rootScope.game.board[y][x];
// 					tileList.push(tempTile);
// 					rankList.push(medulla.changeCount(tempTile, player))
// 				}
// 			}
// 			return({tileList:tileList,rankList:rankList})
// 		},
// 		tileToChoose:function(player){
// 			var ranks = ai.tileAffects(player)
// 			var indexOfMax = ranks.rankList.indexOf(ranks.rankList.max());
// 			var tileToChoose = ranks.tileList[indexOfMax];
// 			return tileToChoose;
// 		}
// 	}
// 	return ai
// })


app.factory('ai', function ($rootScope, medulla, tileService) {
	function board(){
		return $rootScope.game.board;
	}
	var ai = {
		tile: function(tile, player){
			this.tile = 			tile;
			this.numLines = 		ai.interpretation.numLines(tile);
			this.affectedTiles = 	medulla.affectedTiles(tile, player);
			this.numAffected = 		this.affectedTiles.length;
			this.isCorner = 		this.numLines==3?1:-1;
			this.isSide = 			this.numLines==5?1:-1;
			this.isCenter = 		this.numLines==8?1:-1;
			this.opensSide = 		ai.interpretation.opensSide(tile)?1:-1;
			this.opensCorner = 		ai.interpretation.opensCorner(tile)?1:-1;
		},
		interpretation:{
			numLines:function(tile){
				var numLines = 0;
				var spiderWeb = medulla.arr(tile);
				for(var i=0; i<spiderWeb.length; i++)
					if(spiderWeb[i].length>0)
						numLines++;
				return numLines;
			},
			opensSide:function(tile){
				return (tile.x==1 || tile.x==$rootScope.game.board.length-2)
					|| (tile.y==1 || tile.y==$rootScope.game.board[0].length-2)
			},
			opensCorner:function(tile){
				return (tile.x == 1 								&& tile.y <= 1)
					|| (tile.x <= 1 								&& tile.y == 1)

					|| (tile.x == $rootScope.game.board.length-2 	&& tile.y <= 1)
					|| (tile.x >= $rootScope.game.board.length-2 	&& tile.y == 1)

					|| (tile.x == 1 								&& tile.y >= $rootScope.game.board[0].length-2)
					|| (tile.x >= 1 			 					&& tile.y == $rootScope.game.board[0].length-2)

					|| (tile.x == $rootScope.game.board.length-2 	&& tile.y >= $rootScope.game.board[0].length-2)
					|| (tile.x >= $rootScope.game.board.length-2 	&& tile.y == $rootScope.game.board[0].length-2)
			},
			isInDanger:function(tile, player){
				// var redor = medulla.all(tile);
				// var threats = [];
				// for(var i=0; i<redor.n.length; i++)
				// 	if(redor.n[i].owner == -1)
				// 		break;
				// 	else
				// 		if(redor.n[i].owner.name!=player.name)
				// 			if(threats.indexOf(redor.n[i].owner.name) == -1)
				// 				threats.push(redor.n[i].owner.name)
				// if(threats.length)
				// 	for(var i=0; i<redor.s.length; i++)
				// 		if(redor.s[i].owner == -1)
				// 			break;
				// 		else if(threats.indexOf(redor.s[i].owner) != -1)
				// 			threats.splice(threats.indexOf(redor.s[i].owner), 1)
				// 		else if(i == redor.s.length-1)
				// 			threats = []
				// return threats;
			},
			isSafe:function(tile, player){
				
			},
			addsDanger:function(tile, player){

			},
			minimizesDanger:function(tile, player){

			},
			addsOptions:function(tile, player){

			},
			securesCorner:function(tile, player){
				return (tile.x == 0 								&& tile.y <= 0)
					|| (tile.x == $rootScope.game.board.length-1 	&& tile.y == 0)
					|| (tile.x == 0 								&& tile.y == $rootScope.game.board[0].length-1)
					|| (tile.x == $rootScope.game.board.length-1 	&& tile.y == $rootScope.game.board[0].length-1)
			},
			securesMore:function(tile, player){

			}
		},
		personality:function(){
			var options = ['numAffected','isCorner','isSide','isCenter','opensSide','opensCorner']
			this.attrs = {};
			while(options.length>0)
				this.attrs[options.randomRemove()] = options.length;
		},
		evaluation:{
			weightTile:function(smartTile, player){
				var personality = player.personality;
				var tileWeight = 0;
				// tileWeight += smartTile.numAffected * personality.attrs.numAffected;
				tileWeight += smartTile.isCorner * personality.attrs.isCorner;
				tileWeight += smartTile.isSide * personality.attrs.isSide;
				tileWeight += smartTile.isCenter * personality.attrs.isCenter;
				tileWeight += smartTile.opensSide * personality.attrs.opensSide;
				tileWeight += smartTile.opensCorner * personality.attrs.opensCorner;
				return tileWeight;
			}
		},
		vision:{
			options:function(player){
				var tileList = [];
				var rankList = [];
				for(var y=0; y<$rootScope.game.board.length; y++){
					for(var x=0; x<$rootScope.game.board[y].length; x++){
						var tempTile = $rootScope.game.board[y][x]
						var smartTile = new ai.tile(tempTile, player)
						if(smartTile.numAffected>0){
							tileList.push(smartTile)
							rankList.push(ai.evaluation.weightTile(smartTile, player))
							// if(smartTile.opensCorner)
							// 	smartTile.tile.color = 'gold';
						}
					}
				}
				return({tileList:tileList,rankList:rankList})
			},
		},
		decision:{
			chooseTile:function(player){
				if(!player.personality)
					player.personality = new ai.personality();
				var ranks = ai.vision.options(player);
				if(ranks.rankList.length)
					var ttp = ranks.tileList[ranks.rankList.indexOf(ranks.rankList.max())].tile;
				// console.log(ranks,ttp)
				return ttp
			}
		},
		learn:function(){
			if(!localStorage.getItem('ranks'))
				localStorage.setItem('ranks',angular.toJson({list:[]}))
			var ranks = angular.fromJson(localStorage.getItem('ranks'))
			var players = $rootScope.game.players;
			var eogStats = [];
			for(var i=0; i<players.length; i++)
				eogStats.push(tile.ownerCt(players[i]))
			for(var i=0; i<players.length; i++){
				var player = players[i]
				var tileCt = tile.ownerCt(player)
				var rank = {
					position: tileCt/eogStats.max()*100,
					weight: tileCt/eogStats.max() ? tileCt-eogStats.min() : tileCt - eogStats.max()
				}
				rank.total = rank.position*rank.weight;

				pStats = {personality:player.personality,rank:rank}
				if(rank.position==100)
					ranks.list.push(pStats)
				localStorage.setItem('ranks',angular.toJson(ranks))
				console.log('pStats',pStats)
			}

		}


		// pons:{
		// 	//wait & init turn
		// },
		// thalmus:{
		// 	//relay center
		// },
		// amygdala:{
		// 	//personality
		// },
		// hypothalmus:{
		// 	//makes sure we don't do something stupid

		// },
		// cerebellum:{
		// 	//plays the game
		// 	//uses: amygdala, hypothalmus
		// },
		// cerebrum:{
		// 	//Return basic information about situation
		// 	options:{
				
		// 	}
		// 	//Analytics
		// },
	}

	it.ai = ai;
	return ai;
});