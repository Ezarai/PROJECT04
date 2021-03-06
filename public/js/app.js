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
angular
  .module("RetroGames")
  .controller("LoginController", LoginController);

LoginController.$inject = ["$auth", "$state", "$rootScope"];
function LoginController($auth, $state, $rootScope) {

  this.credentials = {};

  this.submit = function() {
    $auth.login(this.credentials, {
      url: "/api/login"
    }).then(function(){
      $rootScope.$broadcast("loggedIn");
      $state.go('gamePostsIndex');
    })
  }
}
angular
  .module("RetroGames")
  .controller("MainController", MainController);

MainController.$inject = ["$window", "$auth", "$state", "$rootScope", "User"];
function MainController($window, $auth, $state, $rootScope, User) {
  var self = this;

  var socket = $window.io();

  this.connected = false;

  this.startConversation = function(username) {
    self.currentUser = $auth.getPayload();
    if (username !== self.currentUser.username) {
      var matchedConversation = null;
      self.conversations.forEach(function(conversation) {
        if (conversation.users.includes(username)) matchedConversation = conversation;
      })
      if (!matchedConversation) {
        self.conversations.push({ currentMessage: null, messages: [], users: [username, self.currentUser.username], show: true })
      }  
    }    
  }

  this.hideNavbar = function() {
    var hide = false;
    ["home", "login", "register"].forEach(function(stateName) {
      if($state.current.name === stateName) hide = true;
    })
    return hide;
  }
  
  this.addGamePostShow = function() {
    var hide = false;
    ["gamePostsIndex", "gamePostsShow", "gamePostsNew"].forEach(function(stateName) {
      if($state.current.name === stateName) hide = true;
    })
    return hide;
  }

  this.socketConnect = function() {
    socket = $window.io();
    socket.on('connect', function() {
      socket
        .emit('authenticate', { token: $auth.getToken() })
        .on('authenticated', function() {
          $rootScope.$applyAsync(function() {
            self.connected = true;
          });
        })
        .on('unauthorized', function() {
          $rootScope.$applyAsync(function() {
            self.connected = false;
          });
        });

      socket.on('disconnect', function(){
        $rootScope.$applyAsync(function() {
          self.connected = false;
        });
      });
    });

    socket.on('pm', function(message) {
      self.currentUser = $auth.getPayload();
      var matchedConversation = null;
      var matchedConversationName;
      $rootScope.$evalAsync(function() {
        self.conversations.forEach(function(conversation) {
          var userMatches = 0;
          conversation.users.forEach(function(conversationUser) {
            message.users.forEach(function(messageUser) {
              if (messageUser === conversationUser) {
                userMatches++;
                if (messageUser !== self.currentUser.username) matchedConversationName = messageUser;
              }
            })
          })
          if (userMatches > 1) {
            matchedConversation = conversation;
          }        
        })
        if(!!matchedConversation) {
          matchedConversation.messages.push({ sender: message.sender, messageContents: message.message, show: true })
          var objDiv = document.getElementsByClassName(matchedConversationName)[0];
          console.log("objDiv: ", objDiv);
          objDiv.scrollTop = objDiv.scrollHeight;
        } else {
          self.conversations.push({ currentMessage: null, messages: [{ sender: message.sender, messageContents: message.message }], users: [message.sender, self.currentUser.username], show: true })
        }
      });
    });
  }

  self.socketConnect();

  this.sendMessage = function(conversation) {
    var chatName = this.chatWindowName(conversation.users);
    socket.emit("pm", { message: conversation.currentMessage, receiver: chatName, sender: self.currentUser.username });
    conversation.currentMessage = null;
  }

  self.currentUser = $auth.getPayload();

  if (!!self.currentUser) {
    User.get({ id: self.currentUser._id }, function(user) {
      self.conversations = user.conversations;
      self.conversations.forEach(function(conversation) {
        conversation.currentMessage = null;
        conversation.show = false;
      })
    })  
  } 

  this.chatWindowName = function(users) {
    var chatName;
    users.forEach(function(user) {
      if (user !== self.currentUser.username) {
       chatName = user;
      }
    });
    return chatName;
  }

  this.toggleChat = function(conversation) {
    conversation.show = !conversation.show;
  }

  this.logout = function() {
    $auth.logout();
    self.currentUser = null;
    this.conversations = null;
    $state.go("home");
  }

  $rootScope.$on("loggedIn", function() {
    self.currentUser = $auth.getPayload();
    self.socketConnect();
    User.get({ id: self.currentUser._id }, function(user) {
      self.conversations = user.conversations;
      self.conversations.forEach(function(conversation) {
        conversation.currentMessage = null;
        conversation.show = false;
      })
    })  
  });
}

angular
  .module("RetroGames")
  .controller("RegisterController", RegisterController);

RegisterController.$inject = ["$auth", "$state", "$rootScope"];
function RegisterController($auth, $state, $rootScope) {

  this.newUser = {};

  this.submit = function() {
    $auth.signup(this.newUser, {
      url: '/api/register'
    })
    .then(function(){
      $state.go("login");
    })
  }
}
angular
  .module('RetroGames')
  .directive('date', date);

function date() {
  return {
    restrict: 'A',
    require: "ngModel",
    link: function(scope, element, attrs, ngModel) {
      ngModel.$formatters.push(function(value) {
        return new Date(value);
      });
    }
  }
}
angular
  .module('RetroGames')
  .directive('file', file);

function file() {
  return {
    restrict: 'A',
    require: "ngModel",
    link: function(scope, element, attrs, ngModel) {
      element.on('change', function(e) {
        if(element.prop('multiple')) {
          ngModel.$setViewValue(e.target.files);
        } else {
          ngModel.$setViewValue(e.target.files[0]);
        }
      });
    }
  }
}
angular
  .module("RetroGames")
  .factory("GamePost", GamePost);

GamePost.$inject = ["$resource", "formData"];
function GamePost($resource, formData) {
  return $resource('/api/game_posts/:id', { id: '@_id' },  {
    update: {
      method: "PUT",
      headers: { 'Content-Type': undefined },
      transformRequest: formData.transform
    },
    save: {
      method: "POST",
      headers: { 'Content-Type': undefined },
      transformRequest: formData.transform
    }
  });
}
angular
  .module("RetroGames")
  .factory("Genre", Genre);

Genre.$inject = ["$resource"];
function Genre($resource) {
  return $resource('/api/genres/:id', { id: '@_id' },  {
    update: {
      method: "PUT"
    }
  });
}
angular
  .module("RetroGames")
  .factory("Platform", Platform);

Platform.$inject = ["$resource"];
function Platform($resource) {
  return $resource('/api/platforms/:id', { id: '@_id' },  {
    update: {
      method: "PUT"
    }
  });
}
angular
  .module("RetroGames")
  .factory("Room", Room);

Room.$inject = ["$resource"];
function Room($resource) {
  return $resource('/api/rooms/:id', { id: '@_id' },  {
    update: {
      method: "PUT"
    }
  });
}
angular
  .module("RetroGames")
  .factory("User", User);

User.$inject = ["$resource"];
function User($resource) {
  return $resource('/api/users/:id', { id: '@_id' },  {
    update: {
      method: "PUT"
    }
  });
}
angular
  .module('RetroGames')
  .factory('formData', formData);

function formData() {
  return {
    transform: function(data) {
      console.log("data at start of formData", data);
      var formData = new FormData();
      angular.forEach(data, function(value, key) {
        if(!!value && value._id) value = value._id;
        if(!key.match(/^\$/)) {

          if(value instanceof FileList) {
            for(i=0;i<value.length;i++) {
              formData.append(key, value[i]);
            }
          } else {
            formData.append(key, value);
          }
        }
      });
      console.log("formData at end of formData", formData);
      return formData;
    }
  }
}
angular
  .module('RetroGames')
  .controller("GamePostsEditController", GamePostsEditController);

GamePostsEditController.$inject = ["GamePost", "Platform", "Genre", "$state"];
function GamePostsEditController(GamePost, Platform, Genre, $state) {

  var self = this;
  this.selectedGenres = [];

  this.selected;

  GamePost.get($state.params, function(data) {
    self.selectedGenres = data.genres;
    self.selected = data;
  });
  this.genres = Genre.query();
  this.platforms = Platform.query();

  this.removeGenre = function(genre) {
    this.selectedGenres.splice(
      this.selectedGenres.indexOf(genre), 1);
  }

  this.addGenre = function(genre) {
    for( var i = 0; i < self.selectedGenres.length; i++) {
      if(self.selectedGenres[i]._id === genre._id) return null;
    }

    self.selectedGenres.push(genre);
  }

  this.save = function() {
    this.selected.genres = this.selectedGenres.map(function(genre) {
      return genre._id;
    });
    this.selected.$update(function() {
      $state.go('gamePostsShow', $state.params);
    });
  }
}
angular
  .module('RetroGames')
  .controller("GamePostsIndexController", GamePostsIndexController);

GamePostsIndexController.$inject = ["GamePost"];
function GamePostsIndexController(GamePost) {
  this.all = GamePost.query();
}
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
angular
  .module('RetroGames')
  .controller("GamePostsShowController", GamePostsShowController);

GamePostsShowController.$inject = ["GamePost", "$state", "$scope", "$rootScope"];
function GamePostsShowController(GamePost, $state, $scope, $rootScope) {
  this.selected = GamePost.get($state.params, function(gamePost) {
    $rootScope.$broadcast("gameSelected");
  });

  this.delete = function() {
    this.selected.$remove(function() {
      $state.go("gamePostsIndex");
    });
  }

}
angular
  .module('RetroGames')
  .controller("RoomsIndexController", RoomsIndexController);

RoomsIndexController.$inject = ["Room", "$state"];
function RoomsIndexController(Room, $state) {
  this.all = Room.query();
}
angular
  .module('RetroGames')
  .controller("RoomsNewController", RoomsNewController);

RoomsNewController.$inject = ["Room", "$state", "$auth"];
function RoomsNewController(Room, $state, $auth) {
  var self = this;
  this.new = {};

  this.currentUser = $auth.getPayload();

  this.create = function() {
    this.new.users = [this.currentUser._id];
    Room.save(this.new, function() {
      $state.go('roomsIndex');
    });
  }
}
angular
  .module('RetroGames')
  .controller("RoomsShowController", RoomsShowController);

RoomsShowController.$inject = ["Room", "$state", "$auth", "$rootScope"];
function RoomsShowController(Room, $window, $state, $auth, $rootScope) {
  var self = this;

  // this.message = null;

  // this.allMessages = [];

  // this.roomId = $state.params._id;

  var socket = $window.io();

  this.connected = false;

  this.privateUser = null;

  this.selectPrivateUser = function(username) {
    this.privateUser = { username: username };
  }

  socket.on('connect', function() {
    socket
      .emit('authenticate', { token: $auth.getToken() })
      .on('authenticated', function() {
        $rootScope.$applyAsync(function() {
          self.connected = true;
        });
      })
      .on('unauthorized', function() {
        $rootScope.$applyAsync(function() {
          self.connected = false;
        });
      });

    socket.on('disconnect', function(){
      $rootScope.$applyAsync(function() {
        self.connected = false;
      });
    });
  });

  this.message = null;

  this.all = [];

  this.sendMessage = function() {
    socket.emit("pm", { message: this.message, username: this.privateUser.username });
    this.message = null;
  }

  socket.on('pm', function(message) {
    console.log(message);
    $rootScope.$evalAsync(function() {
      self.all.push(message);
    });
  });  

  // var socket = io.connect();

  // socket.on('connection', function() {
  //   socket.emit('roomJoin', $state.params._id);  
  // })

  // this.sendMessage = function() {
  //   socket.emit("message", { message: this.message, roomId: self.roomId});
  //   this.message = null;
  // }

  // socket.on('message', function(message) {
  //   $rootScope.$evalAsync(function() {
  //     // console.log("message is: ", message);
  //     self.allMessages.push(message);
  //   })

  // })

  // this.selected = Room.get($state.params);

  // this.currentUser = $auth.getPayload();

  // this.messageContents = null;
  // this.newMessage = {};

  // // this.sendMessage = function() {
  // //   this.newMessage.username = this.currentUser.username;
  // //   this.newMessage.messageContents = this.messageContents;
  // //   this.selected.$update();
  // //   this.newMessage = {};
  // // }

  // this.delete = function() {
  //   this.selected.$remove(function() {
  //     $state.go("roomsShow");
  //   });
  // }
}