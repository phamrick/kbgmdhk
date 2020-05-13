$(window).bind("beforeunload",function(event) {
    return "If you reload the page you will be removed fromthe game!";
});

var isMobile = false;
if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
  isMobile = true;
}

var Client = (function(window) {

    var socket      = null;
    var gameState   = null;
  
    var gameID      = null;
    var playerName  = null;
    var isHost      = null;
    var role        = null;
    var useAccmp    = null;
    var useWtnss    = null;
    var myMeansChosen = '';
    var myEvidenceChosen = '';

    var checkMarkCount = 1;

    var timeout;
    var longtouch;
    var longtouchblacktap = false;

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

            var sceneKeys = [gameState.sceneKeys[sceneCount]];

            var instantiateSceneCard = function(params)
            {
                //myKonvas.InstantiateImgArray(sixKeys, screen.width/2, screen.height/2, true, false, true, true, null);
                myKonvas.InstantiateImgGrid(sceneKeys, screen.width/2,  screen.height/2 - 200, 6, false, true, true, null);
            }

            loadImages(sceneKeys, instantiateSceneCard, sceneKeys);

            sceneCount++;
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

            if (gameState.updateEvt === gameState.evt_type_assignroles)
            {
                $('#playerListDiv').hide();

                if(isHost === false)
                {
                    var gsPlayer = gameState.players[playerName];
                    role = gsPlayer.role;

                    // role = gsPlayer.role;
                    // document.getElementById('role').innerHTML = "Role: " + role;

                    instCardsPrivate(gsPlayer);

                    if (role === gameState.r_fsci)
                        forSciCauseLocSceneImgs();

                } else {
                    instCardsPublic();
                    hostLoadCauseLocSceneImgs();
                }

            } else if (gameState.updateEvt === gameState.evt_type_murdercardschosen)
            {
                if(isHost === false)
                {
                    if(role === gameState.r_fsci)
                    {
                        var imgKeys = [gameState.meansChosen, gameState.evidenceChosen];
                        loadImages(imgKeys, function(params) {

                            myKonvas.InstantiateImgArray(imgKeys, 140, 70, true, false, true, true, null);
                        }, 
                        null);
                        
                        createInfoBoxAndShowRole();
                    }
                }
            } else if (gameState.updateEvt === gameState.evt_type_playerjoined)
            {
                var j = 0;
                for(var key in gameState.players)
                {
                    j++;
                    $('#pList' + j.toString()).text(key);
                }
            }

        });

        socket.on('checkadded', function(data) {

            if (isHost === true)
                createCheckMarkHost(data.sceneCardId, data.x, data.y);
        });

        socket.on('checkremoved', function(data) {

            if (isHost === true)
                removeCheckMarkHost(data.sceneCardId, data.checkId);
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
        var xOffset = 5;
        var yOffset = 5;

        for(var playerKey in iPlayerImgParams)
        {
            var player = iPlayerImgParams[playerKey];

            if (player.role !== gameState.r_fsci)
            {
                group = myKonvas.InstaniateImgGridGroup(player, xOffset, yOffset, 4, false, true, null);
                addPlayerName(group, playerKey);
                var dims = group.getClientRect();
                yOffset = dims.height + yOffset + 10;

                if(yOffset + dims.height > window.innerHeight)
                {
                    yOffset = 0;
                    xOffset = xOffset + dims.width + 10;
                }
            }
        }
    }

    var addPlayerName = function(iGroup, iPlayerName) {

        var rect = iGroup.getClientRect();

        myKonvas.InstantiateRectText( iPlayerName, 
            rect.x + rect.width/2, 
            rect.y + rect.height/2 - 35, 
            rect.width/2 * 0.9,
            30,
            '#ffffb3',
            '#4d2600',
            '#e60000',
            function(iText, iRect) {
                iGroup.add(iRect);
                iGroup.add(iText);
                var layer = iGroup.getLayer();
                layer.draw();
            }
        );
    }

    var instCardsAfterLoad = function(iCardKeys)
    {
        var callback = null;
        if(role !== gameState.r_fsci)
            callback = hideRoleKimg;

        var group = myKonvas.InstaniateImgGridGroup(iCardKeys, 0, 0, 4, false, true, callback);

        if(role !== gameState.r_fsci)
            setDblClickOnCards(group);
    }

    var hideRoleKimg = function(iGroup)
    {
        var children = iGroup.getChildren().toArray();

        var i = children.length - 1;

        while (i > -1)
        {
            var kimg = children[i];
            var id = kimg.id();

            if(id === gameState.r_fsci || 
                id === gameState.r_mrd ||
                id === gameState.r_wtnss ||
                id === gameState.r_invst ||
                id === gameState.r_accmp)
            {
                kimg.hide();
            }

            i--;
        }
    }

    var showRoleKimg = function(iLayer)
    {
        var oGroup = iLayer.getChildren(function(node){
            return node.getClassName() === 'Group';
         }).toArray()[0];

        var children = oGroup.getChildren().toArray();

        var i = children.length - 1;
        
        while (i > -1)
        {
            var kimg = children[i];
            var id = kimg.id();

            if(id === gameState.r_fsci || 
                id === gameState.r_mrd ||
                id === gameState.r_wtnss ||
                id === gameState.r_invst)
            {
                kimg.show();
            }

            i--;
        }
    }

    var createInfoBoxAndShowRole = function()
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

        var infoMurd = '';
        var infoAccm = '';
        var infoWtnss = '';

        var q = "?????";

        var x = 140;
        var y = 350;

        if (role === gameState.r_fsci)
        {
            infoMurd = "murderer:     " + playerMurd;
            infoAccm = playerAccm.length > 0 ? "\naccomplice:  "   + playerAccm : "";
            infoWtnss = playerwitness.length > 0 ? "\nwitness:       " + playerwitness : "";

            y = 10;

        } else if (role === gameState.r_mrd) {

            infoAccm = playerAccm.length > 0 ? "accomplice:  "   + playerAccm : "";
            infoWtnss = playerwitness.length > 0 ? "\nwitness:       " + q : "";

            if(infoAccm.length === 0 && infoWtnss.length === 0)
                infoMurd = "all other players\nare investigators";

        } else if (role === gameState.r_accmp)
        {
            infoMurd = "murderer:     " + playerMurd;
            infoWtnss = playerwitness.length > 0 ? "\nwitness:       " + q : "";

        } else if (role === gameState.r_wtnss) {
            infoMurd = "murderer:     " + playerMurd;
            infoAccm = playerAccm.length > 0 ? "\naccomplice:  "   + playerAccm : "";
        } else {
            infoMurd = "murderer:     " + q;
            infoAccm = playerAccm.length > 0 ? "\naccomplice:  "   + q : "";
            infoWtnss = playerwitness.length > 0 ? "\nwitness:       " + q : "";
        }

        // var fontSize = isMobile === false ? 30: 20;
        var width = isMobile === false ? 250: 225;

        myKonvas.InstantiateRectText(infoMurd + infoAccm + infoWtnss, 
                                    x, y, width, 20, '#ffffb3', '#4d2600', '#e60000',null);
                                    
        myKonvas.RunCallbackOnPiecesLayer(showRoleKimg);
    }

    var setDblClickOnCards = function(iGroup)
    {
        var children = iGroup.getChildren().toArray();

        var i = 7;
        while(i > -1)
        {
            var kimg = children[i];
            kimg.on('dblclick', dblclickOnCard);
            kimg.on('dbltap', dblclickOnCard);
            
            i--;
        }
    }

    var dblclickOnCard = function(evt)
    {
        var kimg = evt.target;
        if (kimg.id().startsWith('means'))
            myMeansChosen = kimg.id();
        if (kimg.id().startsWith('evidence'))
            myEvidenceChosen = kimg.id();

        if (myMeansChosen.length === 0 || myEvidenceChosen.length === 0)
        {
            return;

        } else if (role === gameState.r_mrd)
        {
            if (gameState.meansChosen.length > 0 && gameState.evidenceChosen.length > 0)
                return;
            
            if (myMeansChosen.length > 0 && myEvidenceChosen.length > 0)
            {
                socket.emit(gameState.evt_type_murdercardschosen, 
                            {gameID: gameID,
                            meansChosen:  myMeansChosen,
                            evidenceChosen: myEvidenceChosen});
            }

            createInfoBoxAndShowRole();
        }  else {
            createInfoBoxAndShowRole();
        }
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
                    if(callback)
                        callback(params);
                }
            }
            images[keySrc].src = "/img/" + keySrc + ".png";
            i++;
        }
    }

    var forSciCauseLocSceneImgs = function()
    {
        var keys = gameState.causeOfDeathKeys.concat(gameState.locationKeys);
        keys = keys.concat(gameState.sceneKeys);
        keys = keys.slice(0,6); 

        var checkMarkKey = gameState.checkMarkKeys[0];

        var instantiateFirstSixCards = function(params)
        {
            var kobjs = myKonvas.InstaniateImgGridGroup2(keys, -10, 200, 2, false, false, true);
            var i = 0;
            for(i = 0; i < kobjs.kimgs.length; i++)
            {
                var createCheckmark = function(e) {
                    if (longtouchblacktap)
                        return;

                    var nodeImg = e.target;
                    var group = nodeImg.getParent();

                    var x = e.evt.clientX;
                    var y = e.evt.clientY;

                    if (isMobile === true)
                    {
                        var touchpos = myKonvas.GetPointerPos();

                        x = touchpos.x;
                        y = touchpos.y;
                    }

                    var kimg = myKonvas.InstantiateSingleImg2(checkMarkKey, x, y, false, false, false, false);
                    kimg.move(   {   x: -kimg.width()*.25,   y: -kimg.height()*.8  }  );

                    var newID = kimg.id() + '_' + checkMarkCount.toString();
                    kimg.id( newID);

                    checkMarkCount++;

                    kimg.on('click tap', function(e) {
                        var id = e.target.id();
                        var targetLayer = e.target.getLayer();
                        e.target.destroy();
                        targetLayer.draw();
                        socket.emit('checkremoved', { gameID: gameID, sceneCardId: group.id(), checkId: id});
                    });

                    //myKonvas.AddNodeToPiecesLayer(kimg);

                    group.add(kimg);
                    kimg.moveToTop()
                    var layer = group.getLayer();
                    layer.draw();

                    var relx = x - nodeImg.x();
                    var rely = y - nodeImg.y();

                    socket.emit('checkadded', { gameID: gameID, sceneCardId: group.id(), x: relx, y: rely });
                }

                kobjs.kimgs[i].on('click tap', createCheckmark);
                //kobjs.kimgs[i].on('dbltap', createCheckmark);
         
                kobjs.kimgs[i].on('touchstart', function(e) {
                    timeout = setTimeout(function() {
                    longtouch = true;
                    }, 1000);
                });

                kobjs.kimgs[i].on('touchend', function(e) {
                    if (longtouch) {
                        longtouchblacktap = true;
                        alert('do you want to draw a scene card?');
                    }

                    longtouch = false;
                    clearTimeout(timeout);
                    setTimeout(function() {
                        longtouchblacktap = false;
                    }, 500);
                });
            }

            myKonvas.ResizeStageToFitPieces(kobjs.kimgs);
        }

        loadImages(gameState.checkMarkKeys, null, null);
        loadImages(keys, instantiateFirstSixCards, null);
    }

    var removeCheckMarkHost = function(iSceneID, iCheckId)
    {
        var group = myKonvas.GetNodeFromPiecesLayer(iSceneID);
        var children = group.getChildren().toArray();

        var i = 0;
        for(i = 0; i < children.length; i++)
        {
            var node = children[i];
            if(node.id() === iCheckId)
                node.destroy();
        }

        group.getLayer().draw();
    }

    var createCheckMarkHost = function(iSceneID, iRelX, iRelY)
    {
        var group = myKonvas.GetNodeFromPiecesLayer(iSceneID);
        var kimg = group.getChildren().toArray()[0];

        var checkMarkKey = gameState.checkMarkKeys[0];

        var kimgCheck = myKonvas.InstantiateSingleImg2(checkMarkKey, kimg.x() + iRelX, kimg.y() + iRelY, false, false, false, false);
        kimgCheck.move(   {   x: -kimgCheck.width()*.25,   y: -kimgCheck.height()*.8  }  );

        var newID = kimgCheck.id() + '_' + checkMarkCount.toString();
        kimgCheck.id( newID);

        checkMarkCount++;

        group.add(kimgCheck);
        kimgCheck.moveToTop()
        var layer = group.getLayer();
        layer.draw();
    }

    var hostLoadCauseLocSceneImgs = function()
    {
        var playercount = Object.keys(gameState.players).length;

        var keysTotal = gameState.causeOfDeathKeys;
        keysTotal = keysTotal.concat(gameState.locationKeys);
        keysTotal = keysTotal.concat(gameState.sceneKeys).slice(0,6);
        keysTotal = keysTotal.concat(gameState.badgeKeys);
        keysTotal = keysTotal.concat(fillArray(gameState.badgeKeys[0], playercount));

        var firstSixKeys = keysTotal.slice(0,6); 

        var badgeKey = gameState.badgeKeys[0];

        var cardWidth = 180;

        var instantiateFirstSixCards = function(params)
        {
            myKonvas.InstaniateImgGridGroup2(firstSixKeys, screen.width - 3*cardWidth, 10, 3, false, true, true);
            var i = 0;
            for(i = 0; i < playercount; i++)
            {
                var badge = myKonvas.InstantiateSingleImg2(badgeKey, screen.width, screen.height, false, true, true, true);
                badge.move( {   x: -badge.width() - 5,   y: -badge.height() - 5  }  );
                badge.getLayer().draw();
            }
        }

        loadImages(gameState.checkMarkKeys, null, null);
        loadImages(keysTotal, instantiateFirstSixCards, null);
        
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