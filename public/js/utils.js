
var utils = (function() {
 
    var ConvXpercXpos = function (iX)
    {
        if(typeof iX === 'string')
            return (window.innerWidth *parseInt(iX.replace('%',''))/100).toString();
        return iX;
    }

    var ConvYpercYpos = function (iY)
    {
        if(typeof iY === 'string')
            return (window.innerHeight *parseInt(iY.replace('%',''))/100).toString();
        return iY;
    }

    return {
        ConvXpercXpos: ConvXpercXpos,
        ConvYpercYpos: ConvYpercYpos
    };

})();
