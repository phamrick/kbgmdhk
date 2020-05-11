var DB = null;

/**
 * Validate session data for "Game" page
 * Returns valid data on success or null on failure
 */
var validateGame = function(req) {

  // These must exist
  if (!req.session.gameID)      { return null; }
  if (!req.session.playerName)  { return null; }
  if (!req.params.id)           { return null; }

  // These must match
  if (req.session.gameID !== req.params.id) { return null; }

  return {
    gameID      : req.session.gameID,
    playerName  : req.session.playerName,
    isHost      : req.session.isHost,
    role      : req.session.role
  };
};

/**
 * Validate "Join Game" form input
 * Returns valid data on success or null on failure
 */
var validateJoinGame = function(req) {

  // These must exist
  if (!req.body['game-id']) { return null; }

  // If Game ID consists of only whitespace, return null
  if (/^\s*$/.test(req.body['game-id'])) { return null; }

  return {
    gameID      : req.body['game-id'].toLowerCase(),
    playerName  : req.body['player-name']
  };
};

/**
 * Render "Home" Page
 */
var home = function(req, res) {

  // Welcome
  res.render('home');
};

/**
 * Render "Game" Page (or redirect to home page if session is invalid)
 */
var game = function(req, res) {

  // Validate session data
  var validData = validateGame(req);
  if (!validData) { res.redirect('/'); return; }

  // Render the game page
  res.render('game', validData);
};

/**
 * Process "Start Game" form submission
 * Redirects to game page on success or home page on failure
 */
var startGame = function(req, res) {

  // Create a new session
  req.session.regenerate(function(err) {
    if (err) { res.redirect('/'); return; }

    // if req.body.extraRoles is an array that means both roles were checked
    // if it's not an array then it's a string and need to check the value
    var useAccmp = true;
    var useWtnss = true;

    if(Array.isArray(req.body.extraRoles) === false)
    {
        useAccmp = 'accmp' === req.body.extraRoles;
        useWtnss = 'wtnss' === req.body.extraRoles;
    } 

    var validData = { playerName  : req.body['player-name'],
                        useAccmp  : useAccmp,
                        useWtnss  : useWtnss
                     };

    // Create new game
    var gameID = DB.add(validData);

    // Save data to session
    req.session.gameID      = gameID;
    req.session.playerName  = validData.playerName;
    req.session.isHost = true;
    req.session.role = "";


    // Redirect to game page
    res.redirect('/game/'+gameID);
  });
};

/**
 * Process "Join Game" form submission
 * Redirects to game page on success or home page on failure
 */
var joinGame = function(req, res) {

  // Create a new session
  req.session.regenerate(function(err) {
    if (err) { res.redirect('/'); return; }

    // Validate form input
    var validData = validateJoinGame(req);
    if (!validData) { res.redirect('/'); return; }

    // Find specified game
    var game = DB.find(validData.gameID);
    if (!game) { res.redirect('/'); return;}

    // Save data to session
    req.session.gameID      = validData.gameID;
    req.session.playerName  = validData.playerName;
    req.session.isHost = false;
    req.session.role = "unassigned";

    // Redirect to game page
    res.redirect('/game/'+validData.gameID);
  });
};

/**
 * Redirect non-existent routes to the home page
 */
var invalid = function(req, res) {

  // Go home HTTP request, you're drunk
  res.redirect('/');
};

/**
 * Attach route handlers to the app
 */
exports.attach = function(app, db) {
  DB = db;

  app.get('/',         home);
  app.get('/game/:id', game);
  app.post('/start',   startGame);
  app.post('/join',    joinGame);
  app.all('*',         invalid);
};
