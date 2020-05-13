var _ = require('underscore'),
  fs = require('fs');

var config = JSON.parse(fs.readFileSync('./lib/config.json', 'utf8'));

var r_mrd = "role_murderer";
var r_fsci = "role_forensic_scientist";
var r_invst = "role_investigator";
var r_accmp = 'role_accomplice';
var r_wtnss = 'role_witness';

/*
 * The Game object
 */

/**
 * Create new game and initialize
 */
function Game(params) {

  // pending/ongoing/checkmate/stalemate/forfeit
  this.status = 'pending';

  this.hostPlayer = params.playerName;
  this.useAccmp = params.useAccmp;
  this.useWtnss = params.useWtnss;

  this.r_mrd = r_mrd;
  this.r_fsci = r_fsci;
  this.r_invst = r_invst;
  this.r_accmp = r_accmp;
  this.r_wtnss = r_wtnss;

  this.evt_type_assignroles = 'assignroles';
  this.evt_type_murdercardschosen = 'murdercardschosen';
  this.evt_type_playerjoined = "playerjoined"

  this.playerCardChosenCount = 0;

  this.meansChosen = '';
  this.evidenceChosen = '';

  // {name: null, role: null}
  this.players = {};

  this.causeOfDeathKeys = Object.keys(config.imgSources.imgSrcCauseOfDeath);
  var locatioKeysSplice = Object.keys(config.imgSources.imgSrcLocation);
  this.locationKeys = locatioKeysSplice.splice(Math.floor(Math.random() * locatioKeysSplice.length), 1);
  this.sceneKeys = shuffle(Object.keys(config.imgSources.imgSrcScene));
  this.badgeKeys = Object.keys(config.imgSources.imgSrcBadge);
  this.bulletKeys = Object.keys(config.imgSources.imgSrcBullet);
  this.checkMarkKeys = Object.keys(config.imgSources.imgSrcCheckMark);
  
  this.updateEvt = null;

  this.modifiedOn = Date.now();

  this.clientGetPlayer = function(iName)
  {
    var i = 0;
    for(i = 0; i < this.players.length; i++)
    {
      if(this.players[i].name === iName)
        return this.players[i];
    }

    return null;
  }

}

Game.prototype.setMurdCardsChosen = function(iMeansCard, iEvidenceCard)
{
  this.meansChosen = iMeansCard;
  this.evidenceChosen = iEvidenceCard;
  this.updateEvt = this.evt_type_murdercardschosen;
}

function shuffle(arra1) {
  let ctr = arra1.length;
  let temp;
  let index;

  // While there are elements in the array
  while (ctr > 0) {
// Pick a random index
      index = Math.floor(Math.random() * ctr);
// Decrease ctr by 1
      ctr--;
// And swap the last element with it
      temp = arra1[ctr];
      arra1[ctr] = arra1[index];
      arra1[index] = temp;
  }
  return arra1;
}

/**
 * Get players
 */
Game.prototype.getPlayers = function() {

  return this.players;
}

/**
 * Get players
 */
Game.prototype.getPlayer = function(iName) {

  return _.findWhere(this.players, {name: iName});
}

/**
 * Add player to game, and after both players have joined activate the game.
 * Returns true on success and false on failure.
 */
Game.prototype.addPlayer = function(playerData) {

  var player = {name: playerData.playerName, 
                isHost: playerData.isHost, 
                role: playerData.role, 
                meansCards: [], 
                evidenceCards: []
              };

  // finally add the player
  this.players[playerData.playerName] = player;

  return true;
};

/**
 * Remove player from game, this does not end the game, players may come and go as they please.
 * Returns true on success and false on failure.
 */
Game.prototype.removePlayer = function(playerData) {

  // Find player in question
  var p = _.findWhere(this.players, {name: playerData.playerName});
  if (!p) { return false; }

  // Set player info
  p.joined = false;

  this.modifiedOn = Date.now();

  return true;
};

/**
 * Assign rolls
 */
Game.prototype.assignRoles = function() {

  //var playerCount = this.players.length;

  var roleArray = null;

  var playerCount = 0;
  for(var key in this.players)
  {
    playerCount++;
  }

  // this.rolesFourPlayer  = 
  // this.rolesFivePlayer  = 
  // this.rolesSixPlayer   = 
  // this.rolesSevenPlayer = 
  // this.rolesEightPlayer = 
  // this.rolesNinePlayer  = 
  // this.rolesTenPlayer   = 
  // this.rolesElevenPlayer   = 
  // this.rolesTwelvePlayer   = 

  switch(playerCount) {
    case 4:
      roleArray = [r_mrd, r_fsci, r_invst, r_invst];
      break;
    case 5:
      roleArray = [r_mrd, r_fsci, r_invst, r_invst, r_invst];
      break;
    case 6:
      roleArray = [r_mrd, r_fsci, r_invst, r_invst, r_invst, r_invst];
      break;
    case 7:
      roleArray = [r_mrd, r_fsci, r_invst, r_invst, r_invst, r_invst, r_invst];
      break;
    case 8:
      roleArray = [r_mrd, r_fsci, r_invst, r_invst, r_invst, r_invst, r_invst, r_invst];
      break;
    case 9:
      roleArray = [r_mrd, r_fsci, r_invst, r_invst, r_invst, r_invst, r_invst, r_invst, r_invst];
      break;
    case 10:
      roleArray = [r_mrd, r_fsci, r_invst, r_invst, r_invst, r_invst, r_invst, r_invst, r_invst, r_invst];
      break;
    case 11:
      roleArray = [r_mrd, r_fsci, r_invst, r_invst, r_invst, r_invst, r_invst, r_invst, r_invst, r_invst, r_invst];
      break;
    case 12:
      roleArray = [r_mrd, r_fsci, r_invst, r_invst, r_invst, r_invst, r_invst, r_invst, r_invst, r_invst, r_invst, r_invst];
      break;
    default:
      roleArray = [r_mrd, r_fsci, r_invst, r_invst];
  }
  
  if (playerCount > 5)
  {
    if(this.useAccmp === true)
      roleArray[roleArray.length - 1] = r_accmp;
    if(this.useWtnss === true)
      roleArray[roleArray.length - 2] = r_wtnss;
  }
  
  var indicesPlayers = [];
  var indicesRoles = [];
  for (var i = 0; i < playerCount; i++)
  {
      indicesPlayers.push(i);
      indicesRoles.push(i);
  }

  var playerKeys = Object.keys(this.players);

  // for debugging created a way to ensure that i could
  // make my mobile player the forensic scientist
  for (var i = 0; i < playerCount; i++) {
    var player = this.players[playerKeys[i]];
    if (player.name === 'paulfsci')
    {
      indicesPlayers.splice(i);
      indicesRoles.splice(1);
      player.role = r_fsci;
    }
  }

  var playerKeys = Object.keys(this.players);
  while (indicesPlayers.length > 0)
  {
    var randPlayer = indicesPlayers.splice(Math.floor(Math.random() * indicesPlayers.length), 1);
    var randRole = indicesRoles.splice(Math.floor(Math.random() * indicesRoles.length), 1);
    this.players[playerKeys[randPlayer]].role = roleArray[randRole];
  }

  // need to get random keys of images (random means cards and random evidence cards)
  // but don't know if the config object above is touched by other game sessions
  // so gonna play it safe and remove keys that are already assigned to other players
  var meansKeys = Object.keys(config.imgSources.imgSrcMeans).slice(0);
  var evidenceKeys = Object.keys(config.imgSources.imgSrcEvidence).slice(0);

  for(var playerKey in this.players)
  {
    var player = this.players[playerKey];
    // var i = 0;
    // for(i = 0; i < player.meansCards.length ; i++)
    // {
    //   index = meansKeys.indexOf(player.meansCards[i]);
    //   if (index > -1) {
    //     meansKeys.splice(index, 1);
    //   }

    //   index = evidenceKeys.indexOf(player.evidenceCards[i]);
    //   if (index > -1) {
    //     evidenceKeys.splice(index, 1);
    //   }
    // }

    // assign the random image keys to the player

    if(player.role !== r_fsci)
    {
      var i = 4;
      while (i > 0)
      {
        var randMeans = meansKeys.splice(Math.floor(Math.random() * meansKeys.length), 1);
        var randEv = evidenceKeys.splice(Math.floor(Math.random() * evidenceKeys.length), 1);
        
        player.meansCards.push(randMeans);
        player.evidenceCards.push(randEv);

        i--;
      }
    }
      
  }

  this.updateEvt = 'assignroles';

  return true;
};

/**
 * Apply move and regenerate game state.
 * Returns true on success and false on failure.
 */
Game.prototype.move = function(moveString) {

  // Test if move is valid
  var validMove = _.findWhere(this.validMoves, parseMoveString(moveString));
  if (!validMove) { return false; }

  // Check for a pawn promotion suffix
  var whitePawnPromotion = new RegExp('(w)P..[-x].8p([RNBQ])');
  var blackPawnPromotion = new RegExp('(b)P..[-x].1p([RNBQ])');
  var promotionMatches, promotionPiece = null;

  if (whitePawnPromotion.test(moveString)) {
    promotionMatches = whitePawnPromotion.exec(moveString);
    promotionPiece   = promotionMatches[1]+promotionMatches[2];
  }

  if (blackPawnPromotion.test(moveString)) {
    promotionMatches = blackPawnPromotion.exec(moveString);
    promotionPiece   = promotionMatches[1]+promotionMatches[2];
  }

  // Apply move
  switch (validMove.type) {
    case 'move' :
      this.board[validMove.endSquare] = promotionPiece || validMove.pieceCode;
      this.board[validMove.startSquare] = null;
      break;

    case 'capture' :
      this.capturedPieces.push(this.board[validMove.captureSquare]);
      this.board[validMove.captureSquare] = null;

      this.board[validMove.endSquare] = promotionPiece || validMove.pieceCode;
      this.board[validMove.startSquare] = null;
      break;

    case 'castle' :
      if (validMove.pieceCode === 'wK' && validMove.boardSide === 'queen') {
        this.board.c1 = validMove.pieceCode
        this.board.e1 = null;

        this.board.d1 = 'wR'
        this.board.a1 = null;
      }
      if (validMove.pieceCode === 'wK' && validMove.boardSide === 'king') {
        this.board.g1 = validMove.pieceCode
        this.board.e1 = null;

        this.board.f1 = 'wR'
        this.board.h1 = null;
      }
      if (validMove.pieceCode === 'bK' && validMove.boardSide === 'queen') {
        this.board.c8 = validMove.pieceCode
        this.board.e8 = null;

        this.board.d8 = 'bR'
        this.board.a8 = null;
      }
      if (validMove.pieceCode === 'bK' && validMove.boardSide === 'king') {
        this.board.g8 = validMove.pieceCode
        this.board.e8 = null;

        this.board.f8 = 'bR'
        this.board.h8 = null;
      }
      break;

    default : break;
  };

  // Set this move as last move
  this.lastMove = validMove;

  // Get inactive player
  var inactivePlayer = _.find(this.players, function(p) {
    return (p === this.activePlayer) ? false : true;
  }, this);

  // Regenerate valid moves
  this.validMoves = getMovesForPlayer(inactivePlayer.color, this.board, this.lastMove);

  // Set check status for both players
  _.each(this.players, function(p) {
    p.inCheck = isPlayerInCheck(p.color, this.board);
  }, this);

  // Test for checkmate or stalemate
  if (this.validMoves.length === 0) {
    this.status = (inactivePlayer.inCheck) ? 'checkmate' : 'stalemate' ;
  }

  // Toggle active player
  if (this.status === 'ongoing') { this.activePlayer = inactivePlayer; }

  this.modifiedOn = Date.now();

  return true;
};

/**
 * Apply a player's forfeit to the game.
 * Returns true on success and false on failure.
 */
Game.prototype.forfeit = function(playerData) {

  // Find player in question
  var p = _.findWhere(this.players, {color: playerData.playerColor});
  if (!p) { return false; }

  // Set player info
  p.forfeited = true;

  // Set game status
  this.status = 'forfeit';

  this.modifiedOn = Date.now();

  return true;
};

/*
 * Private Utility Functions
 */


// Export the game object
module.exports = Game;