// outside libraries used: konvas
// other modules used: Client.js


var myKonvas = (function() {
 
  var layerMap;
  var layerPieces;
  var stage;

  var CreateStage =  function()
  {
    stage = new Konva.Stage({
      container: 'container',
      width: window.innerWidth,
      height: window.innerHeight
    });

    layerMap = new Konva.Layer();
    layerPieces = new Konva.Layer();
    
    stage.add(layerMap);
    stage.add(layerPieces);
    
    //stage.scale({ x: xscale, y: xscale });
    
    layerMap.draw();
    layerPieces.draw();

    stage.on('contextmenu', function(e) {

      // prevent default behavior
      e.evt.preventDefault();
      if (e.target === stage) {
        // if we are on empty place of the stage we will do nothing
        return;
      }

      // var node = e.target;
       
      // if(node instanceof Konva.Image)
      // {
      //   BulletOneRightClick(node);
      // }

    });
  }

  var GetXposFromPercent = function (iX)
  {
    return (window.innerWidth *parseInt(iX.replace('%',''))/100).toString();
  }

  var GetYposFromPercent = function (iY)
  {
    return (window.innerHeight *parseInt(iY.replace('%',''))/100).toString();
  }

  var BulletOneRightClick = function(node)
  {
      var img = node.image();

      var moveX = 0;
      var moveY = 0;

      if (img.src.endsWith("bullet_one_100.png"))
      {
        moveX = parseInt(GetXposFromPercent('40%')) - node.width() /2;
        moveY = parseInt(GetYposFromPercent('60%')) - node.height() /2;
      } else if (img.src.endsWith("bullet_three_100.png"))
      {
        moveX = parseInt(GetXposFromPercent('50%')) - node.width() /2;
        moveY = parseInt(GetYposFromPercent('60%')) - node.height() /2;
      } else {

        moveX = parseInt(GetXposFromPercent('60%')) - node.width() /2;
        moveY = parseInt(GetYposFromPercent('60%')) - node.height() /2;
      }

      //MoveToAnimate(node, moveX, moveY);
      MoveWithTween(node, moveX, moveY);
  }

  var MoveWithTween = function(iNode, iX, iY)
  {
    var tween = new Konva.Tween({
      node: iNode,
      x: iX,
      y: iY,
      duration: 1,
      easing: Konva.Easings.EaseInOut
    });
    
    // play tween
    tween.play();
  }

  var EvtDragStart = function(e) {
		
    var draggedObj = e.target;
    draggedObj.moveToTop();
    draggedObj.getLayer().draw();
  };

  var EvtNodeTopMostAndSelected = function(e) {
					
    var oNode = e.target;
    oNode.moveToTop();
    oNode.getLayer().draw();
  };

  var InstaniateText = function(iText, iX, iY, callBack)
  {
		var text = new Konva.Text({
      text: iText,
      x: iX,
      y: iY,
      fontSize: 30,
      fontStyle: 'bold',
      fill: 'white',
    });

    if(callBack)
      callBack(text);
  }

  var InstantiateRectText = function(iText, iX, iY, iWidth, iFontSize, iBgcolor, iFontColor, iBorderColor, callBack)
  {
    var ktext = new Konva.Text({
      x: iX + 5,
      y: iY + 2,
      text:iText,
      fontSize: iFontSize,
      fill: iFontColor,
      fontStyle: 'bold',
      padding: 2,
      fontFamily: 'Courier New'
    });
    
    var rect = new Konva.Rect({
      x: iX,
      y: iY,
      stroke: iBorderColor,
      strokeWidth: 3,
      fill: iBgcolor,
      width: iWidth,
      height: ktext.height(),
      shadowColor: 'black',
      shadowBlur: 5,
      shadowOffsetX: 5,
      shadowOffsetY: 5,
      shadowOpacity: 0.4,
      cornerRadius: 5,
    });

    if(callBack)
    {
      callBack(ktext, rect);
    } else {
      layerPieces.add(rect);
      layerPieces.add(ktext);
      layerPieces.draw();
    }
  }

  var InstaniateImgGridGroup = function(iImgKeys, iX, iY, iWrapCount, iCentered, iDraggable, callBack)
  {
    var group = new Konva.Group({
        x: 0,
        y: 0,
        draggable: iDraggable
    });

    var callBackParam = {
      param :{
        group: group
      },
      callBack: function(iParam, iKimg) {
        iParam.group.add(iKimg);
      }
    };

    InstantiateImgGrid(iImgKeys, iX, iY, iWrapCount, iCentered, false, false, callBackParam);

    if(callBack)
      callBack(group);

    layerPieces.add(group);
    layerPieces.draw();

    return group;
  }

  var InstantiateImgGrid = function(iImgKeys, iX, iY, iWrapCount, iCentered, iAddToLayer, iDraggable, callBackParam)
  {
    var rowCount = Math.floor(iImgKeys.length / iWrapCount);

    var yOffset = 0

    while(rowCount > 0)
    {
      var row = iImgKeys.splice(0, iWrapCount);
      dims = InstantiateImgArray(row, iX, iY + yOffset, true, iCentered, iAddToLayer, iDraggable, callBackParam);
      yOffset = dims.height + yOffset;
      rowCount--;
    }
    
    if (iImgKeys.length > 0)
      InstantiateImgArray(iImgKeys, iX, iY + yOffset, true, iCentered, iAddToLayer, iDraggable, callBackParam);
  }

  var InstantiateImgArray = function(iImgKeys, iX, iY, iXdir, iCentered, iAddToLayer, iDraggable, callBackParam)
  {
    var i = 0;
    var xOffset = 0;
    var yOffset = 0;

    var widthKeep = 0;
    var heightKeep = 0;

    while(i < iImgKeys.length)
    {
      var imageDOM = Client.images[iImgKeys[i]];

      widthKeep = imageDOM.width;
      heightKeep = imageDOM.height;

      InstantiateImg(imageDOM, iX + xOffset, iY + yOffset, iCentered, iDraggable, iAddToLayer, false, callBackParam);

      if(iXdir === true)
      {
        xOffset = xOffset + imageDOM.width;
      } else {
        yOffset = yOffset + imageDOM.height;
      }

      i++;
    }

    layerPieces.draw();

    return {width: widthKeep, height: heightKeep};
  }

  var InstantiateSingleImg = function(iImgKey,iX, iY, iCentered, iDraggable, iAddToLayer, iDrawLayer, callBackParam)
  {
    var imageDOM = Client.images[iImgKey];
    InstantiateImg(imageDOM, iX, iY, iCentered, iDraggable, iAddToLayer, iDrawLayer, callBackParam);
  }

  var InstantiateImg = function (imageDOM, iX, iY, iCentered, iDraggable, iAddToLayer, iDrawLayer, callBackParam)
  {

    if(typeof iX === 'string')
      if(iX.endsWith('%'))
        iX = (window.innerWidth *parseInt(iX.replace('%',''))/100).toString();
    if(typeof iX === 'string')
      if(iY.endsWith('%'))
        iY = (window.innerHeight *parseInt(iY.replace('%',''))/100).toString();

    var oKimg = new Konva.Image({
      image: imageDOM,
      x: parseInt(iX) + (iCentered ? (-imageDOM.width/2): 0),
      y: parseInt(iY) + (iCentered ? (-imageDOM.height/2): 0),
      id: getFilenameNoExt(imageDOM.src),
      draggable: iDraggable
    });

    if( iAddToLayer == true)
      layerPieces.add(oKimg);

    if (iDraggable)
    {
       oKimg.on('click', EvtNodeTopMostAndSelected);
       oKimg.on('dragstart', EvtDragStart);
    }

    if (iDrawLayer === true)
      layerPieces.draw();

    if (callBackParam)
      callBackParam.callBack(callBackParam.param, oKimg);
  }

  function getFilenameNoExt (iFilePath) {
    var filename = iFilePath.split('/').pop();
    return filename.substr(0, filename.lastIndexOf('.'));
  }

  var CreatePieces = function(iPiecesConfig)
  {
    for(var piecesKey in iPiecesConfig)
    {
      var pieceVal = iPiecesConfig[piecesKey];
      var srcKey = pieceVal.srcKey;
      var insts = pieceVal.instances;

      var index = 0; 
      while (index < insts.length) { 
        var inst = insts[index];
        InstantiateSingleImg(srcKey, inst.x, inst.y, true, true, false, null);
        index++; 
      }

      var instsRepeat = pieceVal.instancerepeated;
      var count = parseInt(instsRepeat.count);

      index = 0;
      while (index < count) { 
        InstantiateSingleImg(srcKey, instsRepeat.x, instsRepeat.y, true, true, false, null);
        index++; 
      }
    }

    layerPieces.draw();
  }

  var RunCallbackOnPiecesLayer = function(callback)
  {
    callback(layerPieces);
    layerPieces.draw();
  }

  var PlaceCharCards = function(iCharCardKeyArray)
  {
    iNumChars = iCharCardKeyArray.length;

    var append = "";
    if(iNumChars > 6)
      append = "_250";

    var imgDimGrab = Client.images['char_kit_carlson' + append];

    charCardWidth = imgDimGrab.width;
    charCardHeight = imgDimGrab.height;

    charCardHalfWidth = imgDimGrab.width/2;
    charCardHalfHeight = imgDimGrab.height/2;

    var RotatePoint = function (cx, cy, x, y, angle) {
      var radians = (Math.PI / 180) * angle,
          cos = Math.cos(radians),
          sin = Math.sin(radians),
          nx = (cos * (x - cx)) + (sin * (y - cy)) + cx,
          ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
      return {x: nx, y: ny};
    }

    console.log('window.innerWidth: ' +window.innerWidth);
    console.log('window.innerHeight: ' +window.innerHeight);

    var originX = window.innerWidth / 2;
    var originY = window.innerHeight / 2;

    var pointX = 0;
    var pointY = -originY;

    var normalize = Math.sqrt(pointX*pointX + pointY*pointY);

    var deltaAngle = 360/iNumChars;

    var pointsUnit = [];
    pointsUnit.push({x: pointX/normalize, y: pointY/normalize, theta: 90});
    //pointsUnit.push({x: pointX, y: pointY, theta: 90});

    var pointsFinal = [];

    pointsFinal.push({x: originX, y: pointY+ charCardHalfHeight + originY, side: 'top'});

    for(i = 1; i < iNumChars; i++)
    {
      var prevPtX = pointsUnit[i-1].x;
      var prevPtY = pointsUnit[i-1].y;
      var prevTheta = pointsUnit[i-1].theta;

      //var newPt = RotatePoint(originX, originY, prevPtX, prevPtY, -deltaAngle);
      var newPt = RotatePoint(0, 0, prevPtX, prevPtY, -deltaAngle);
      pointsUnit.push({x: newPt.x, y: newPt.y, theta: prevTheta - deltaAngle });

      var slope  = newPt.y/newPt.x;

      var sign_of_x = newPt.x/Math.abs(newPt.x);
      var sign_of_y = newPt.y/Math.abs(newPt.y);

      // if( newPt.y > 0 && newPt.x > 0)
      // {
      // where does this line intersect right side offset indward by charchardwidth/2?
      // y = slope*x
      // vertline -> xQuad1 = sign_of_x(window.innerWidth/2 - charCardHalfWidth)
      // yQuad1= slope*vertline

        var xIntersectVert = (sign_of_x*(window.innerWidth/2)) - sign_of_x*charCardHalfWidth;
        var yIntersectVert = slope*xIntersectVert;

      // where does this line intersect top side offset downward by charCardHalfHeight/2?
      // y = slope*x
      // horz line -> y = (window.innerHeight/2 - 1) - charCardHalfHeight/2
      // x = y/slope
        var yIntersectHoriz = sign_of_y*(window.innerHeight/2) - sign_of_y*charCardHalfHeight;
        var xIntersectHoriz = yIntersectHoriz/slope;

        var top = false;
        var rhs = false;
        var bttm = false;
        var lhs = false;

        if (sign_of_y > 0)
        {
          if (yIntersectVert < yIntersectHoriz)
          {
            pointsFinal.push({x: xIntersectVert + originX, y: yIntersectVert + originY, side: (sign_of_x > 0 ?'rhs':'lhs')});
            rhs = true;
            console.log('side 1');
          } else {
            pointsFinal.push({x: xIntersectHoriz + originX, y: yIntersectHoriz + originY, side: 'bttm'});
            bttm = true;
            console.log('side 2');
          }

        } else {

          if (yIntersectVert > yIntersectHoriz)
          {
            pointsFinal.push({x: xIntersectVert + originX, y: yIntersectVert + originY, side: 'rhs'});
            lhs = true;
            console.log('side 3');
          } else {
            pointsFinal.push({x: xIntersectHoriz + originX, y: yIntersectHoriz + originY, side: 'top'});
            top = true;
            console.log('side 4');
          } 

        }
    }


    for(i = 1; i < pointsFinal.length; i++ )
    {
      var ptX = pointsFinal[i].x;
      var ptY = pointsFinal[i].y;
      var side = pointsFinal[i].side;

      if(side === 'top' && ptX > (window.innerWidth/2))
      {
        pointsFinal[i].x = (window.innerWidth - (ptX + charCardHalfWidth)) + ptX -20;

      } else if(side === 'top' && ptX < (window.innerWidth/2))
      {
        pointsFinal[i].x = 20 + charCardHalfWidth;

      } else if(side === 'bttm' && ptX > (window.innerWidth/2 + 1) && iNumChars ===7)
      {
        pointsFinal[i].x = (window.innerWidth/2) + charCardWidth;

      } else if(side === 'bttm' && ptX < (window.innerWidth/2 - 1) && iNumChars ===7)
      {
        pointsFinal[i].x = (window.innerWidth/2) - charCardWidth;

      } else if(side === 'bttm' && ptX > (window.innerWidth/2 + 1) && iNumChars ===8)
      {
        pointsFinal[i].x = (window.innerWidth - (ptX + charCardHalfWidth)) + ptX -20;

      } else if(side === 'bttm' && ptX < (window.innerWidth/2 - 1) && iNumChars ===8)
      {
        pointsFinal[i].x = 20 + charCardHalfWidth;
      }
    }


    var imgBullet = Client.images['bullet_three_100'];

    for(i = 0; i < pointsFinal.length; i++ )
    {
      var ptX = pointsFinal[i].x;
      var ptY = pointsFinal[i].y;

      console.log('point: ' + ptX + ', ' + ptY);
      
      InstantiateSingleImg(iCharCardKeyArray[i] + append, ptX, ptY, true, true, false, null);
      InstantiateSingleImg('bullet_three_100', ptX - charCardHalfWidth + 35 , ptY + charCardHalfHeight, true, true, false, null);
      InstantiateSingleImg('bullet_three_100', ptX - charCardHalfWidth + 100 , ptY + charCardHalfHeight, true, true, false, null);
      InstantiateSingleImg('bullet_one_100', ptX - charCardHalfWidth + 165 , ptY + charCardHalfHeight, true, true, false, null);
    }

    layerPieces.draw();

  }

  var CreateBackground = function()
  {
    var imgBg = Client.images['background'];
    var oKimg = new Konva.Image({
      image: imgBg,
      x: 0,
      y: 0
    });

    layerMap.add(oKimg);

    layerMap.scale({x: screen.width/imgBg.width, y: screen.height/imgBg.height});

    layerMap.draw();
    stage.draw();
  }

  return {
    CreateStage: CreateStage,
    CreatePieces: CreatePieces,
    InstantiateSingleImg: InstantiateSingleImg,
    InstantiateImgArray: InstantiateImgArray,
    CreateBackground: CreateBackground,
    PlaceCharCards: PlaceCharCards,
    InstantiateImgGrid: InstantiateImgGrid,
    InstaniateImgGridGroup: InstaniateImgGridGroup,
    InstaniateText: InstaniateText,
    InstantiateRectText: InstantiateRectText,
    RunCallbackOnPiecesLayer: RunCallbackOnPiecesLayer
  };

})();
