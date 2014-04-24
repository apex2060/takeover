var GameCtrl = app.controller('GameCtrl', function($rootScope, $scope, game, turn, tileService, medulla, ai){
	$rootScope.temp = {};
	$rootScope.game = {};

	var privateData = {};
	$rootScope.settings = {
		y: 8,		//Row
		x: 8		//Column
	}
	//Board.length == height (Y)
	//Board[0].length == width (X)
	var tools = {
		medulla:medulla,
		turn:turn,
		tile:tileService,
		ai:ai,
		game:game,
		
		player:{
			index:function(player){
				return $rootScope.game.players.indexOf(player);
			},
			add:function(player){
				console.log('add player',player)
				$rootScope.game.players.push(player);
				$rootScope.temp.player = {};
			},
			remove:function(player){
				$rootScope.game.players.splice(tools.player.index(player), 1);
			},
			setTurn:function(player){
				$rootScope.temp.current = player;
				$rootScope.game.recent = [];
			},
			countTiles:function(player){
				var ct = 0;
				for(var r=0; r<$rootScope.game.board.length; r++)
					for(var c=0; c<$rootScope.game.board[r].length; c++)
						if($rootScope.game.board[r][c].owner.name == player.name)
							ct++;
				return ct;
			}
		}
		
	}
	tools.game.setup();

	$rootScope.$watch('game', function() {
		localStorage.setItem('game',angular.toJson($rootScope.game))
	}, true);

	$rootScope.tools = tools;
	it.GameCtrl = $scope;
});