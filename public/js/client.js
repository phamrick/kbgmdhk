$(window).bind("beforeunload",function(event) {
    return "If you reload the page you will be removed fromthe game!";
});

var isMobile = false;
if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
  isMobile = true;
}

$(window).scroll(function () { 
    if($(this).scrollTop() > 50) // change 50 to what you want (work out how far the nav is from the top of the page alraedy and add it there, that'll make it smoother transition)
    {
        $('#fsciFloating').addClass('scrolling');
    } else {
        $('#fsciFloating').removeClass('scrolling');
    }
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
    var myMeansChosen = '';
    var myEvidenceChosen = '';

    var checkMarkCount = 1;

    var timeout;
    var longtouch;
    var longtouchblocktap = false;
    var scenedragblock = false;

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

      myKonvas.CreateStage(screen.width, screen.height);
  
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
            myKonvas.DeleteChildNodesByClass(null, 'Image');
        });

        $('#bttnDrawSceneCard').click(function(ev) {

            // var sceneKeys = [gameState.sceneKeys[sceneCount]];

            // var instantiateSceneCard = function(params)
            // {
            //     //myKonvas.InstantiateImgArray(sixKeys, screen.width/2, screen.height/2, true, false, true, true, null);
            //     myKonvas.InstantiateImgGrid(sceneKeys, screen.width/2,  screen.height/2 - 200, 6, false, true, true, null);
            // }

            // loadImages(sceneKeys, instantiateSceneCard, sceneKeys);

            // sceneCount++;
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
                        // loadImages(imgKeys, function(params) {

                        //     myKonvas.InstantiateImgArray(imgKeys, 140, 70, true, false, true, true, null);
                        // }, 
                        // null);

                        loadImages(imgKeys, function(params) {
 
                            $('#fsciFloating').html('<img src="' + "/img/" + gameState.meansChosen + ".png" + '"><img src="' + "/img/" + gameState.evidenceChosen  + ".png" + '">');
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

                if (isHost)        
                    loadImages(gameState.roleCardSamplesKeys, instCardsForStartScreen, gameState.roleCardSamplesKeys);

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

        socket.on('drawnewscenecard', function(data) {

            if (isHost === true)
            {
                var groupSceneReplace = myKonvas.GetNodeFromPiecesLayer(data.sceneCardId);
                var groupChildren = groupSceneReplace.getChildren(function(node){
                    return node.id().startsWith("scene");
                  })
                var sceneImage = groupChildren[0];
                drawNewSceneCard(sceneImage, false);
            }
        });
        
    };

    var instCardsPrivate = function(iPlayer)
    {
        var cardKeys = iPlayer.meansCards.concat(iPlayer.evidenceCards);
        cardKeys.push(iPlayer.role);
        loadImages(cardKeys, instCardsAfterLoadPrivate, cardKeys);
    }

    var instCardsPublic = function()
    {
        var params = {};
        var allCardKeys = [];

        for(var playerKey in gameState.players)
        {
            var player = gameState.players[playerKey];
            if (player.role !== gameState.r_fsci)
            {
                var cardKeys = player.meansCards.concat(player.evidenceCards);
                params[player.name] = cardKeys;
                allCardKeys = allCardKeys.concat(cardKeys);
            }
        }

        loadImages(allCardKeys, instCardsAfterLoadHost, params);
    }

    var instCardsForStartScreen = function(imgKeys)
    {
        var xOffset = 5;
        var yOffset = 5;

        var i = 1;
        var j = 1;
        var k = 0;

        var xGap = 0;
        var yGap = 0;
        var xPadding = 200;
        var yPadding = 100;

        var xOffset = 0;
        var yOffset = yPadding;

        var kimg = null;

        var columns = 8

        for (j = 1; j < 4; j++)
        {
            xOffset = xPadding;

            for (i = 1; i <= columns; i++)
            {
                if (i === 3 | i === 4 || i === 5 | i === 6 )
                {
                    console.log('skipping i = ' + i + ', j = ' + j + " ---- xOffset: " + xOffset);
                    xOffset = xOffset + kimg.width() + xGap;

                } else {

                    console.log('creating img i = ' + i + ', j = ' + j + ' --- x: ' + xOffset + ", y: " + yOffset);
                    kimg = myKonvas.InstantiateSingleImg2(imgKeys[k], xOffset, yOffset, false, true, true, false);

                    if (k === 0)
                    {
                        xGap = (screen.width - (kimg.width()*columns) - (xPadding*2))/(columns-1);
                        yGap = (screen.height - (kimg.height()*3) - (yPadding*2))/2;

                        console.log('xGap = ' + xGap);
                        console.log('yGap = ' + yGap);
                    }

                    xOffset = xOffset + kimg.width() + xGap;

                    k++;
                }

                if (k == imgKeys.length)
                break;
            }

            if (k == imgKeys.length)
            break;

            yOffset = yOffset + kimg.height() + yGap;
        }

        if(kimg)
            kimg.getLayer().draw();
    }

    var instCardsAfterLoadHost = function(dictPlayerNameToCardKeyArray)
    {
        var dims = null;
        var xOffset = 5;
        var yOffset = 5;

        var i = 1;
        var j = 1;
        var k = 0;

        var xGap = 0;
        var yGap = 0;
        var xPadding = 5;
        var yPadding = 5;

        var xOffset = 0;
        var yOffset = yPadding;

        var playerNames = Object.keys(dictPlayerNameToCardKeyArray);

        for (j = 1; j < 5; j++)
        {
            var dims = null;

            xOffset = xPadding;

            for (i = 1; i < 5; i++)
            {

                if ( (i == 2 || i == 3) && j == 2)
                {
                    xOffset = xOffset + dims.width + xGap;

                } else {

                    var playerName = playerNames[k];
                    var cardKeys = dictPlayerNameToCardKeyArray[playerName];
                    var kobjs = myKonvas.InstaniateImgGridGroup2(cardKeys, xOffset, yOffset, 1, 1, 4, false, true, false);
                    var group = kobjs.groups[0];

                    addPlayerName(group, playerName);
                    var dims = group.getClientRect();

                    if (k === 0)
                    {
                        xGap = (screen.width - (dims.width*4) - (xPadding*2))/3;
                        yGap = (screen.height - (dims.height*3) - (yPadding*2))/2;
                    }

                    xOffset = xOffset + dims.width + xGap;

                    k++ 
                }

                if (k == playerNames.length)
                break;
            }

            if (k == playerNames.length)
            break;

            yOffset = yOffset + dims.height + yGap;
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

    var instCardsAfterLoadPrivate = function(iCardKeys)
    {
        var kobjs = myKonvas.InstaniateImgGridGroup2(iCardKeys, 0, 0, 1, 1, 4, false, false, false);

        var group = kobjs.groups[0];

        if(role !== gameState.r_fsci)
        {
            hideRoleKimg(group);
            setDblClickOnCards(group);
        }
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
                iGroup.getLayer().draw();
                break;
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

        var n = "\n";

        var mrd_colon = "murderer: ";
        var accm_colon= "accmplce: ";
        var wtnss_colon="witness: ";

        if (role === gameState.r_fsci)
        {
            infoMurd = mrd_colon + playerMurd;
            infoAccm = playerAccm.length > 0 ? n + accm_colon   + playerAccm : "";
            infoWtnss = playerwitness.length > 0 ? n + wtnss_colon + playerwitness : "";

            y = 170;

        } else if (role === gameState.r_mrd) {

            infoAccm = playerAccm.length > 0 ? accm_colon + playerAccm : "";
            infoWtnss = playerwitness.length > 0 ? n + wtnss_colon + q : "";

            if(infoAccm.length === 0 && infoWtnss.length === 0)
                infoMurd = "all other players\nare investigators";

        } else if (role === gameState.r_accmp)
        {
            infoMurd = mrd_colon + playerMurd;
            infoWtnss = playerwitness.length > 0 ? n + wtnss_colon + q : "";

        } else if (role === gameState.r_wtnss) {
            infoMurd = mrd_colon + playerMurd;
            infoAccm = playerAccm.length > 0 ? n + accm_colon + playerAccm : "";
        } else {
            infoMurd = mrd_colon + q;
            infoAccm = playerAccm.length > 0 ? n + accm_colon + q : "";
            infoWtnss = playerwitness.length > 0 ? n + wtnss_colon + q : "";
        }

        // var fontSize = isMobile === false ? 30: 20;
        var width = isMobile === false ? 250: 225;

        myKonvas.InstantiateRectText(infoMurd + infoAccm + infoWtnss, 
                                    x, y, width, 18, '#ffffb3', '#4d2600', '#e60000',null);
                                    
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

    var dblclickOnRect = function (evt)
    {
        var rect = evt.target;
        var id = rect.id();
        if(id.startsWith('rect_means_'))
        {
            myMeansChosen = "";
            var group = rect.getParent();
            rect.destroy();
            group.getLayer().draw();
        }
        if(id.startsWith('rect_evidence_'))
        {
            myEvidenceChosen = "";
            var group = rect.getParent();
            rect.destroy();
            group.getLayer().draw();
        }
    }

    var dblclickOnCard = function(evt)
    {
        var kimg = evt.target;

        if (kimg.id().startsWith('means')  && myMeansChosen.length === 0)
        {
            myKonvas.DrawRectOnImg(kimg).on('dblclick', dblclickOnRect);
            myMeansChosen = kimg.id();
        }
        // } else {
        //     return;
        // }

        if (kimg.id().startsWith('evidence')  && myEvidenceChosen.length === 0)
        {
            myKonvas.DrawRectOnImg(kimg).on('dblclick', dblclickOnRect);
            myEvidenceChosen = kimg.id();
        }
        // } else {
        //     return;
        // }

        if (myMeansChosen.length === 0 || myEvidenceChosen.length === 0)
        {
            return;

        } else if (role === gameState.r_mrd)
        {
            if (gameState.meansChosen.length > 0 && gameState.evidenceChosen.length > 0)
                return;
            
            socket.emit(gameState.evt_type_murdercardschosen, 
                        {gameID: gameID,
                        meansChosen:  myMeansChosen,
                        evidenceChosen: myEvidenceChosen});
        } 

        var group = kimg.getParent();
        createInfoBoxAndShowRole();
        myKonvas.DeleteChildNodesByClass(group, 'Rect');
        group.getLayer().draw();
    }

    var loadImages = function(iImageKeys, callback, params)
    {
        var loadedImages = 0;
        var i = 0;
        while(i < iImageKeys.length)
        {
            var keySrc = iImageKeys[i];
            if(keySrc in images)
            {
                loadedImages++;
            } else {
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
            }

            i++;
        }
    }

    var forSciCauseLocSceneImgs = function()
    {
        var keysTotal = gameState.causeOfDeathKeys.concat(gameState.locationKeys);
        keysTotal = keysTotal.concat(gameState.sceneKeys);
        var keysFirstSix = keysTotal.slice(0,6); 

        loadImages(gameState.checkMarkKeys, null, null);
        loadImages(keysTotal, instantiateFirstSixCards, keysFirstSix);
    }

    var instantiateFirstSixCards = function(keys)
    {
        var kobjs = myKonvas.InstaniateImgGridGroup2(keys, -15, 260, 5, 0, 6, false, false, true);
        var i = 0;

        if(!isHost) 
            for(i = 0; i < kobjs.kimgs.length; i++)
                createCheckMarkAndSceneTouchEvents(kobjs.kimgs[i]);

        myKonvas.ResizeStageToFitPieces(kobjs.kimgs);
    }

    var createCheckMarkAndSceneTouchEvents = function(iKimg)
    {
        //iKimg.on('click tap', createCheckmark);
 
        iKimg.on('mousedown touchstart', function(e) {
            console.log("scene mousedown");
            timeout = setTimeout(function() {
                longtouch = true;
            }, 1000);
        });

        iKimg.on('dragstart', function(e) {
            console.log("scene dragstart");
            scenedragblock = true;
        });

        iKimg.on('dragmove', function(e) {
            console.log("scene dragmove");
        });

        iKimg.on('dragend', function(e) {
            console.log("scene dragend");
            scenedragblock = false;
        });

        iKimg.on('mouseup touchend', function(e) {
            console.log("scene mouseup");
            if (longtouch && !scenedragblock) {
                longtouchblocktap = true;
                if(e.target.id().startsWith('scene'))
                    if(confirm('do you want to draw a scene card?'))
                    {
                        drawNewSceneCard(e.target, true);
                    }
            } else if (!scenedragblock) {
                createCheckmark(e);
            }

            longtouch = false;
            clearTimeout(timeout);
            setTimeout(function() {
                longtouchblocktap = false;
            }, 500);
        });
    }

    var createCheckmark = function(e) {

        var checkMarkKey = gameState.checkMarkKeys[0];

        if (longtouchblocktap)
            return;

        var nodeImg = e.target;
        var group = nodeImg.getParent();

        var x = e.evt.offsetX;
        var y = e.evt.offsetY;

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

        group.add(kimg);
        kimg.moveToTop()
        var layer = group.getLayer();
        layer.draw();

        var relx = x - nodeImg.x();
        var rely = y - nodeImg.y();

        socket.emit('checkadded', { gameID: gameID, sceneCardId: group.id(), x: relx, y: rely });
    }

    var drawNewSceneCard = function(iReplaceThis, emit)
    {
        var keys = [gameState.sceneKeys[sceneCount]];

        var kobjs = myKonvas.InstaniateImgGridGroup2(keys, iReplaceThis.x(), iReplaceThis.y(), 0, 0, 1, false, isHost, true);
        var kimg = kobjs.kimgs[0];
        //var group = kobjs.groups[0];

        var groupReplaceID = iReplaceThis.getParent().id();
        iReplaceThis.destroy();

        if(!isHost)
            createCheckMarkAndSceneTouchEvents(kimg);

        sceneCount++;

        if(emit)
            socket.emit('drawnewscenecard', { gameID: gameID, sceneCardId: groupReplaceID});

        kimg.getLayer().draw();
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
        keysTotal = keysTotal.concat(gameState.sceneKeys);
        keysTotal = keysTotal.concat(gameState.badgeKeys);
        keysTotal = keysTotal.concat(fillArray(gameState.badgeKeys[0], playercount));

        var firstSixKeys = keysTotal.slice(0,6); 

        var badgeKey = gameState.badgeKeys[0];

        var cardWidth = 180;

        var instantiateFirstSixCards = function(params)
        {
            //myKonvas.InstaniateImgGridGroup2(firstSixKeys, screen.width - 3*cardWidth, 10, 0, 0, 3, false, true, true);
            var kobj = myKonvas.InstaniateImgGridGroup2(firstSixKeys, 0, 0, 2, 2, 6, false, true, true);
            for(i = 0; i < kobj.groups.length; i++)
                kobj.groups[i].move({x: (screen.width - kobj.width)/2, y: (screen.height - kobj.height)/2})

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