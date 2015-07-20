/**
 * Created by kk on 2015/6/15.
 */

kk.Menu = kk.Class.extend({
    menuItem:null,
    listener:null,
    callback:null,
    camera:null,
    scope:null,
    ctor: function (sprite, scope, camera, callback) {
        this.menuItem = sprite;
        this.scope = scope;
        this.camera = camera;
        this.callback = callback;

        this.isSelected = false;
        this.isPressed = false;

        this.scope.add(this.menuItem);
        this.init();
    },
    init:function(){
        this.registerListener();
    },
    inRect:function(event){
        var centerX = this.menuItem.position.x-this.camera.left;
        var centerY = this.camera.top-this.menuItem.position.y;
        if(event.x >= centerX-this.menuItem.scale.x*0.5
            && event.x <= centerX+this.menuItem.scale.x*0.5
            && event.y >= centerY-this.menuItem.scale.y*0.5
            && event.y <= centerY+this.menuItem.scale.y*0.5)
            return true;
        return false;
    },
    onTap:function(event) {
        if (this.inRect(event)) {
            this.isPressed = false;
            this.isSelected = false;
            this.callback();
        }
        /*
        var vector = new THREE.Vector3(( event.x / window.innerWidth ) * 2 - 1, -( event.y / window.innerHeight ) * 2 + 1, 0.5);
        vector = vector.unproject(this.camera);
        vector.sub(this.camera.position).normalize()
        var raycaster = new THREE.Raycaster(this.camera.position, vector);
        kk.log(this.camera.position, vector)
        var intersects = raycaster.intersectObjects([this.menuItem]);

        if (intersects.length > 0) {
            this.callback();
        }*/
    },
    onPress:function(event){
        if(event.type == "press"){
            if(this.inRect(event)){
                this.isPressed = true;
                this.selected();
            }
        }
        else if(event.type == "pressup"){
            this.isPressed = false;
            this.isSelected = false;
        }
    },
    onPan:function(event){
        if(this.isPressed){
            if(!this.isSelected && this.inRect(event))
                this.selected();
            else if(this.isSelected && !this.inRect(event))
                this.unselected();
        }
    },
    selected:function(){
        this.isSelected = true;
        if(this.onSelected){
            this.onSelected();
        }
    },
    unselected:function(){
        this.isSelected = false;
        if(this.onUnselected){
            this.onUnselected();
        }
    },
    registerListener:function(){
        var scope = this;
        this.listener = kk.EventListener.create({
            event: kk.EventListener.TOUCH,
            swallowTouches: false,
            onTap: function (e) {
                scope.onTap({x: e.center.x,y: e.center.y});
            },
            onPan: function (e) {
                scope.onPan({type: e.type, x: e.center.x,y: e.center.y});
            },
            onPress: function (e) {
                scope.onPress({type: e.type, x: e.center.x,y: e.center.y});
            }
        });
        kk.eventManager.addListener(this.listener, -1);
    },
    removeSelf:function(){
        if(this.listener != null)
            kk.eventManager.removeListener(this.listener);
        this.scope.remove(this.menuItem);
    }
});