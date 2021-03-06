angular
  .module('RetroGames')
  .controller("GamePostsNewController", GamePostsNewController);

GamePostsNewController.$inject = ["GamePost","Platform", "Genre", "$state", "$auth"];
function GamePostsNewController(GamePost, Platform, Genre, $state, $auth) {
  var self = this;
  this.currentUser = $auth.getPayload();
  this.new = {};
  this.genres = Genre.query();
  this.platforms = Platform.query();

  this.selectedGenres = [];

  this.removeGenre = function(genre) {
    this.selectedGenres.splice(
      this.selectedGenres.indexOf(genre), 1);
  }

  this.addGenre = function(genre) {
    if (self.selectedGenres.length > 0) {
      for(var i = 0; i < self.selectedGenres.length; i++) {
        if(self.selectedGenres[i]._id === genre._id) return null;
      }
    }
    self.selectedGenres.push(genre);
  }

  this.create = function() {
    this.new.genres = this.selectedGenres.map(function(genre) {
      return genre._id;
    });
    // this.new.owner = self.currentUser._id;
    console.log("this.new", this.new);
    GamePost.save(this.new, function() {
      // $state.go('gamePostsIndex');
    });
  }
}