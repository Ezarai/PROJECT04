angular
  .module('RetroGames')
  .controller("RoomsIndexController", RoomsIndexController);

RoomsIndexController.$inject = ["Room", "$state"];
function RoomsIndexController(Room, $state) {
  this.all = Room.query();
}