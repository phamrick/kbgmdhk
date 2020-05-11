
$(window).bind("beforeunload",function(event) {
    return "If you reload the page you will be removed fromthe game!";
});

var Client = (function(window) {

    var socket      = null;
    var gameState   = null;
  
    var gameID      = null;
    var playerName  = null;
    var isHost      = null;
    var role        = null;
    var useAccmp    = null;
    var useWtnss    = null;

    var sceneCount = 5;

    var images = {};

    var container   = null;
  
    /**
     * Initialize the UI
     */
    var init = function(config) {

      gameID      = config.gameID;
      playerName  = config.playerName;
      isHost      = JSON.parse(config.isHost);
      role        = config.role;
      useAccmp    = config.useAccmp;
      useWtnss    = config.useWtnss;
  
      // Create socket connection
      socket = io.connect();
  
      // Attach event handlers
      attachDOMEventHandlers();
      attachSocketEventHandlers();

      myKonvas.CreateStage();
  
      // Join game
      socket.emit('join', gameID);
    };
  
    /**
     * Attach DOM event handlers
     */
    var attachDOMEventHandlers = function() {
  
        $('#bttnStartGame').click(function(ev) {
            socket.emit('assignroles', gameID);
            $(this).hide();
        });

        $('#bttnDrawSceneCard').click(function(ev) {

            var sceneKeys = [gameState.sceneKeys[sceneCount] ];
            var instantiateSceneCard = function(params)
            {
                //myKonvas.InstantiateImgArray(sixKeys, screen.width/2, screen.height/2, true, false, true, true, null);
                myKonvas.InstantiateImgGrid(sceneKeys, screen.width/2,  screen.height/2 - 200, 6, false, true, true, null);
            }
            loadImages(sceneKeys, instantiateSceneCard, sceneKeys);
        });

        if(isHost === false)
        {
            $('#bttnStartGame').hide();
            $('#bttnDrawSceneCard').hide(); 
        }
    };
  
    /**
     * Attach Socket.IO event handlers
     */
    var attachSocketEventHandlers = function() {
  
        // Update UI with new game state
        socket.on('update', function(data) {

            gameState = data;

            if(gameState.updateEvt === 'assignroles')
            {
                if(isHost === false)
                {
                    var gsPlayer = gameState.players[playerName];

                    // role = gsPlayer.role;
                    // document.getElementById('role').innerHTML = "Role: " + role;

                    instCardsPrivate(gsPlayer);

                } else {
                    instCardsPublic();
                    hostLoadCauseLocSceneImgs();
                }
            }

        });

    };

    var instCardsPrivate = function(iPlayer)
    {
        var cardKeys = iPlayer.meansCards.concat(iPlayer.evidenceCards);
        cardKeys.push(iPlayer.role);
        loadImages(cardKeys, instCardsAfterLoad, cardKeys);
    }

    var instCardsPublic = function()
    {
        var params = {};
        var allCardKeys = [];

        for(var playerKey in gameState.players)
        {
            var player = gameState.players[playerKey];
            var cardKeys = player.meansCards.concat(player.evidenceCards);
            params[player.name] = cardKeys;
            allCardKeys = allCardKeys.concat(cardKeys);
        }

        loadImages(allCardKeys, instCardsAfterLoadHost, params);
    }

    var instCardsAfterLoadHost = function(iPlayerImgParams)
    {
        var dims = null;
        var xOffset = 0;
        var yOffset = 0;

        for(var playerKey in iPlayerImgParams)
        {
            var addPlayerName = function(iGroup) {
                var rect = iGroup.getClientRect();
                myKonvas.InstantiateRectText('  ' + playerKey, 
                    rect.x + rect.width/2, 
                    rect.y + rect.height/2 - 35, 
                    rect.width/2 * 0.9,
                    function(iText, iRect) {
                        iGroup.add(iRect);
                        iGroup.add(iText);
                        var layer = iGroup.getLayer();
                        layer.draw();
                    }
                );
            }

            dims = myKonvas.InstaniateImgGridGroup(iPlayerImgParams[playerKey], xOffset, yOffset, 4, false, true, addPlayerName);
            yOffset = dims.height + yOffset + 10;

            if(yOffset + dims.height > window.innerHeight)
            {
                yOffset = 0;
                xOffset = xOffset + dims.width + 10;
            }
        }
    }

    var instCardsAfterLoad = function(iCardKeys)
    {
        var playerMurd = "";
        var playerAccm = "";
        var playerwitness = "";

        for(var playerKey in gameState.players)
        {
            var player = gameState.players[playerKey];
            if(player.role === gameState.r_mrd)
                playerMurd = player.name;
            if(player.role === gameState.r_accmp)
                playerAccm = player.name;
            if(player.role === gameState.r_wtnss)
                playerwitness = player.name;
        }

        var infoMurd = "murderer:   " + playerMurd;
        var infoAccm = playerAccm.length > 0 ? "\naccomplice:  "   + playerAccm : "";
        var infoWtnss = playerwitness.length > 0 ? "\nwitness:    " + playerwitness : "";

        if (role === gameState.r_fsci)
        {
            myKonvas.InstantiateRectText(infoMurd + infoAccm + infoWtnss, 150, 350, 300, null);

        } else if (role === gameState.r_mrd && infoAccm.length > 0) {

            myKonvas.InstantiateRectText(infoAccm.substr(1), 150, 350, 300, null);

        } else if (role === gameState.r_accmp || role === gameState.r_wtnss)
        {
            myKonvas.InstantiateRectText(infoMurd + infoAccm, 150, 350, 300, null);
        } 

        myKonvas.InstaniateImgGridGroup(iCardKeys, 0, 0, 4, false, true, null);

        //myKonvas.InstantiateImgGrid(iCardKeys, 0, 0, 4, false, true);
    }

    var loadImages = function(iImageKeys, callback, params)
    {
        var loadedImages = 0;
        var i = 0;
        while(i < iImageKeys.length)
        {
            var keySrc = iImageKeys[i];
			images[keySrc] = new Image();
			images[keySrc].onload = function() {
				loadedImages++;
				console.log('loadedImages: ' + loadedImages.toString());
				if (loadedImages >= iImageKeys.length) {
                    callback(params);
                }
            }
            images[keySrc].src = "/img/" + keySrc + ".png";
            i++;
        }
    }

    var hostLoadCauseLocSceneImgs = function()
    {
        var keys = gameState.causeOfDeathKeys.concat(gameState.locationKeys).concat(gameState.sceneKeys).concat(gameState.badgeKeys).concat(gameState.bulletKeys);

        var sixKeys = keys.slice(0,6); 
        var keysTotal = sixKeys.concat(fillArray(gameState.bulletKeys[0], 6));

        var i = 0;
        for(var playerKey in gameState.players)
        {
            i++;
            keysTotal = keysTotal.concat(gameState.badgeKeys[0]);
        }

        var instantiateFirstSixCards = function(params)
        {
            //myKonvas.InstantiateImgArray(sixKeys, screen.width/2, screen.height/2, true, false, true, true, null);
            myKonvas.InstantiateImgGrid(keysTotal, screen.width/2,  screen.height/2 - 200, 6, false, true, true, null);
        }

        loadImages(keys, instantiateFirstSixCards, keysTotal);
    }

    function fillArray(value, len) {
        if (len == 0) return [];
        var a = [value];
        while (a.length * 2 <= len) a = a.concat(a);
        if (a.length < len) a = a.concat(a.slice(0, len - a.length));
        return a;
      }
      

    // /**
    //  * Update UI from game state
    //  */
    // var update = function() {
    //
    //     var ul = document.getElementById("playerList");
    //
    //     if (ul === null)
    //         ul=document.createElement('ul');
    //
    //     document.body.appendChild(test);
    //     test.appendChild(ul);
    //
    //     for (var i=0; i<gameState.players.length; i++){
    //
    //         var li=document.createElement('li');
    //
    //         ul.appendChild(li);
    //         li.innerHTML=li.innerHTML + array[i];
    // 
    //     }
    // };
  
    return { init: init,
            images: images};
  
  }(window));