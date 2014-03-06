var id = {};
function GameCtrl($rootScope, $scope){
	$rootScope.temp = {};

	var privateData = {};
	var settings = {
		tilesY: 8,
		tilesX: 8
	}
	var tools = {
		tile:{
			change:function(cell){
				cell.color = $scope.temp.current.color;
				cell.owner = tools.player.index($scope.temp.current);
				$scope.game.recent.push(cell);
			},
			isRecent:function(cell){
				return $scope.game.recent.indexOf(cell) != -1;
			}
		},

		game:{
			board:function(){
				var board = [];
				for(var y=0; y<settings.tilesY; y++){
					var col = [];
					for(var x=0; x<settings.tilesX; x++){
						var tile = {
							owner: -1,
							color: 'silver'
						}
						col.push(tile);
					}
					board.push(col);
				}
				return board;
			},
			setup:function(){
				var localGame = localStorage.getItem('game');
				if(localGame)
					$scope.game = angular.fromJson(localGame)
				else
					$scope.game = {
						players: [{name:'Empty',color:'silver'}],
						board: tools.game.board(),
						recent: []
					}
			},
			reset:function(){
				if(confirm('Are you sure you would like to restart the game?')){
					$scope.game.board = tools.game.board()
					$scope.game.recent = [] 
				}
			}
		},
		
		player:{
			index:function(player){
				return $scope.game.players.indexOf(player);
			},
			add:function(player){
				console.log('add player',player)
				$scope.game.players.push(player);
				$scope.temp.player = {};
			},
			remove:function(player){
				$scope.game.players.splice(tools.player.index(player), 1);
			},
			setTurn:function(player){
				$scope.temp.current = player;
				$scope.game.recent = [];
			},
			countTiles:function(player){
				var ct = 0;
				for(var r=0; r<$scope.game.board.length; r++)
					for(var c=0; c<$scope.game.board[r].length; c++)
						if($scope.game.board[r][c].owner == tools.player.index(player))
							ct++;
				return ct;
			}
		}
	}
	tools.game.setup();

	$scope.$watch('game', function() {
		localStorage.setItem('game',angular.toJson($scope.game))
	}, true);

	$scope.tools = tools;
	it = $scope;
}