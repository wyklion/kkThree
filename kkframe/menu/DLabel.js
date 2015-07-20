/**
 * Created by kk on 2015/6/16.
 */

d.Label = kk.Class.extend({
    context:null,
    sprite:null,
    ctor:function(text, parameters){

        if ( parameters === undefined ) parameters = {};

        var fontface = parameters.hasOwnProperty("fontface") ?
            parameters["fontface"] : "Arial";

        this.fontsize = parameters.hasOwnProperty("fontsize") ?
            parameters["fontsize"] : 18;

        var borderThickness = parameters.hasOwnProperty("borderThickness") ?
            parameters["borderThickness"] : 4;

        var borderColor = parameters.hasOwnProperty("borderColor") ?
            parameters["borderColor"] : { r:0, g:0, b:0, a:1.0 };

        this.backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
            parameters["backgroundColor"] : { r:255, g:255, b:255, a:1.0 };

        var useScreenCoordinates = parameters.hasOwnProperty("useScreenCoordinates") ?
            parameters["useScreenCoordinates"] : false;

        var canvas = document.createElement('canvas');
        this.context = canvas.getContext('2d');
        this.context.font = "Bold " + this.fontsize + "px " + fontface;

        // get size data (height depends only on font size)
        var metrics = this.context.measureText( text );
        this.textWidth = metrics.width;

        /*
        // background color
        this.context.fillStyle   = "rgba(" + this.backgroundColor.r + "," + this.backgroundColor.g + ","
        + this.backgroundColor.b + "," + this.backgroundColor.a + ")";
        // border color
        this.context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
        + borderColor.b + "," + borderColor.a + ")";

        this.context.lineWidth = borderThickness;
        this.roundRect(this.context, borderThickness/2, borderThickness/2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
        // 1.4 is extra height factor for text below baseline: g,j,p,q.
        */

        // text color
        this.context.fillStyle = "rgba(0, 0, 0, 1.0)";

        this.contextX = borderThickness;
        this.contextY = this.fontsize + borderThickness;
        this.context.fillText( text, 0, this.fontsize);//this.contextX, this.contextY);

        // canvas contents will be used for a texture
        this.texture = new THREE.Texture(canvas)
        this.texture.needsUpdate = true;

        var spriteMaterial = new THREE.SpriteMaterial(
            { map: this.texture});//, useScreenCoordinates: false});
        this.sprite = new THREE.Sprite( spriteMaterial );
        var imageWidth = this.texture.image.width;
        var imageHeight = this.texture.image.height;
        this.sprite.scale.set(imageWidth, imageHeight,1.0);
    },
    setString:function(text){
        this.context.clearRect(0,0,this.textWidth,this.fontsize)
        // get size data (height depends only on font size)
        var metrics = this.context.measureText( text );
        this.textWidth = metrics.width;

        this.context.fillStyle = "rgba(0, 0, 0, 1.0)";
        this.context.fillText( text, this.contextX, this.contextY);
        this.texture.needsUpdate = true;
        var imageWidth = this.texture.image.width;
        var imageHeight = this.texture.image.height;
        this.sprite.scale.set(imageWidth, imageHeight,1.0);
    },
    // function for drawing rounded rectangles
    roundRect:function(ctx, x, y, w, h, r)
    {
        ctx.beginPath();
        ctx.moveTo(x+r, y);
        ctx.lineTo(x+w-r, y);
        ctx.quadraticCurveTo(x+w, y, x+w, y+r);
        ctx.lineTo(x+w, y+h-r);
        ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
        ctx.lineTo(x+r, y+h);
        ctx.quadraticCurveTo(x, y+h, x, y+h-r);
        ctx.lineTo(x, y+r);
        ctx.quadraticCurveTo(x, y, x+r, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
})