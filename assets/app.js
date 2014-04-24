var it = {};

var app = angular.module('Takeover', ['ngRoute'])
.config(function($routeProvider) {
	$routeProvider
	.when('/:view', {
		templateUrl: 'views/main.html',
		controller: 'GameCtrl'
	})
	.when('/:view/:id', {
		templateUrl: 'views/main.html',
		controller: 'GameCtrl'
	})
	.otherwise({
		redirectTo: '/home'
	});
});


angular.element(document).ready(function() {
	angular.bootstrap(document, ['Takeover']);
});