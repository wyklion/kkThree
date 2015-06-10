/**
 * Created by kk on 2015/6/5.
 */

kk.RotateControl = kk.Class.extend({
    listener:null,
    enabled:true,
    ctor: function (object, camera) {
        this.object = object;
        this.init();
        this.registerListener();
    },
    init: function () {
        this.enabled = true;
        this.rotateStart = new THREE.Vector3(0, 0, 1);
        this.rotateEnd = new THREE.Vector3(0, 0, 1);
        this.startPoint = new THREE.Vector2();
        this.lastPoint = new THREE.Vector2();

        this.rotateSpeed = 2;

        this.windowHalfX = window.innerWidth / 2;
        this.windowHalfY = window.innerHeight / 2;

        this.mouseDown = false;
        this.lastMoveTimestamp = 0;
        this.moveReleaseTimeDelta = 50;
    },
    projectOnTrackball:function (touchX, touchY)
    {
        var mouseOnBall = new THREE.Vector3();
        mouseOnBall.set(
            this.clamp(touchX / this.windowHalfX, -1, 1), this.clamp(-touchY / this.windowHalfY, -1, 1),
            0.0
        );
        var length = mouseOnBall.length();
        if (length > 1.0)
        {
            mouseOnBall.normalize();
        }
        else
        {
            mouseOnBall.z = Math.sqrt(1.0 - length * length);
        }
        return mouseOnBall;
    },
    clamp:function(value, min, max)
    {
        return Math.min(Math.max(value, min), max);
    },
    onPanStart : function(event) {
        if ( this.enabled === false ) return;

        this.mouseDown = true;
        this.startPoint.set(event.x,event.y);

        this.rotateStart.copy( this.projectOnTrackball(0,0));
        this.rotateEnd.copy(this.rotateStart);
    },
    onPanMove:function(event){
        this.deltaX = event.x - this.startPoint.x;
        this.deltaY = event.y - this.startPoint.y;

        this.handleRotation();

        this.lastPoint.copy(this.startPoint);
        this.startPoint.x = event.x;
        this.startPoint.y = event.y;

        this.lastMoveTimestamp = new Date();
    },
    onPanEnd:function(event){
        if (new Date().getTime() - this.lastMoveTimestamp.getTime() < this.moveReleaseTimeDelta)
        {
            this.deltaX = event.x - this.lastPoint.x;
            this.deltaY = event.y - this.lastPoint.y;
            this.schedule();
        }
        else{
            this.deltaX = 0;
            this.deltaY = 0;
        }

        this.mouseDown = false;
    },
    handleRotation:function(){
        this.rotateEnd = this.projectOnTrackball(this.deltaX, this.deltaY);

        var rotateQuaternion = this.rotateMatrix(this.rotateStart, this.rotateEnd);
        var curQuaternion = this.object.quaternion;
        curQuaternion.multiplyQuaternions(rotateQuaternion, curQuaternion);
        curQuaternion.normalize();
        this.object.setRotationFromQuaternion(curQuaternion);

        this.rotateEnd.copy(this.rotateStart);
    },
    rotateMatrix:function(rotateStart, rotateEnd)
    {
        var axis = new THREE.Vector3(),
            quaternion = new THREE.Quaternion();

        var angle = Math.acos(rotateStart.dot(rotateEnd) / rotateStart.length() / rotateEnd.length());

        if (angle)
        {
            axis.crossVectors(rotateStart, rotateEnd).normalize();
            angle *= this.rotateSpeed;
            quaternion.setFromAxisAngle(axis, angle);
        }
        return quaternion;
    },
    schedule:function(){
        kk.director.getScheduler().scheduleUpdate(this, 0, false);
    },
    unschedule:function(){
        kk.director.getScheduler().unscheduleUpdate(this);
    },
    update:function(dt){
        if (!this.mouseDown && this.deltaX !== 0 && this.deltaY !== 0)
        {
            var drag = 0.95;
            var minDelta = 0.05;

            if (this.deltaX < -minDelta || this.deltaX > minDelta)
            {
                this.deltaX *= drag;
            }
            else
            {
                this.deltaX = 0;
            }

            if (this.deltaY < -minDelta || this.deltaY > minDelta)
            {
                this.deltaY *= drag;
            }
            else
            {
                this.deltaY = 0;
            }

            this.handleRotation();
        }
        else
            this.unschedule();
    },
    registerListener : function() {
        var scope = this;
        this.listener = kk.EventListener.create({
            event: kk.EventListener.TOUCH,
            swallowTouches: false,
            onPan: function (e) {
                if(e.type=="panstart")
                    scope.onPanStart({x: e.center.x,y: e.center.y});
                else if(e.type == "panmove"){
                    scope.onPanMove({x: e.center.x,y: e.center.y,deltaX: e.deltaX, deltaY: e.deltaY});
                }
                else if(e.type == "panend")
                    scope.onPanEnd({x: e.center.x,y: e.center.y});
            }
        });
        kk.eventManager.addListener(this.listener);
    }
});