angular
  .module('RetroGames', ["ngResource", "ui.router", "satellizer"])
  .config(Router);

Router.$inject = ["$stateProvider", "$urlRouterProvider"];
function Router($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('login', {
      url: '/login',
      templateUrl: '/templates/login.html',
      controller: "LoginController as login"
    })
    .state('register', {
      url: '/register',
      templateUrl: '/templates/register.html',
      controller: "RegisterController as register"
    })
    .state('home', {
      url: '/',
      templateUrl: '/templates/home.html',
    })
    .state('gamePostsIndex', {
      url: '/game_posts',
      templateUrl: '/templates/gamePosts/index.html',
      controller: 'GamePostsIndexController as gamePostsIndex'
    })
    .state('gamePostsNew', {
      url: '/game_posts/new',
      templateUrl: '/templates/gamePosts/new.html',
      controller: 'GamePostsNewController as gamePostsNew'
    })
    .state('gamePostsShow', {
      url: '/game_posts/:id',
      templateUrl: '/templates/gamePosts/show.html',
      controller: 'GamePostsShowController as gamePostsShow'
    })
    .state('gamePostsEdit', {
      url: '/game_posts/:id/edit',
      templateUrl: '/templates/gamePosts/edit.html',
      controller: 'GamePostsEditController as gamePostsEdit'
    })
    .state('roomsIndex', {
      url: '/rooms',
      templateUrl: '/templates/rooms/index.html',
      controller: 'RoomsIndexController as roomsIndex'
    })
    .state('roomsNew', {
      url: '/rooms/new',
      templateUrl: '/templates/rooms/new.html',
      controller: 'RoomsNewController as roomsNew'
    })
    .state('roomsShow', {
      url: '/rooms/:id',
      templateUrl: '/templates/rooms/show.html',
      controller: 'RoomsShowController as roomsShow'
    });

  $urlRouterProvider.otherwise("/");

}