/**
 * Created by kk on 2015/6/5.
 */
kk.RotateControl = kk.Class.extend({
    listener:null,
    enabled:true,
    updating:false,
    updateAngle:0,
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

        this._panStart = false;
        this.lastMoveTimestamp = 0;
        this.moveReleaseTimeDelta = 50;
    },
    projectOnTrackball:function (touchX, touchY)
    {
        var mouseOnBall = new THREE.Vector3();
        mouseOnBall.set(
            this.clamp(touchX / this.windowHalfX, -1, 1),
            0,
            this.clamp(touchY / this.windowHalfY, -1, 1)
        );
        //mouseOnBall.set(
        //    this.clamp(touchX / this.windowHalfX, -1, 1),
        //    this.clamp(-touchY / this.windowHalfY, -1, 1),
        //    0.0
        //);
        var length = mouseOnBall.length();
        if (length > 1.0)
        {
            mouseOnBall.normalize();
        }
        else
        {
            //mouseOnBall.z = Math.sqrt(1.0 - length * length);
            mouseOnBall.y = Math.sqrt(1.0 - length * length);
        }
        return mouseOnBall;
    },
    clamp:function(value, min, max)
    {
        return Math.min(Math.max(value, min), max);
    },
    onPress:function(event){
        if ( this.enabled === false ) return;
        this.unschedule();
    },
    onPan:function(e){
        if ( this.enabled === false ) return;
        if(this.updateStatus !== "") return;
        if(e.type=="panstart")
            this.onPanStart({x: e.center.x,y: e.center.y});
        else if(e.type == "panmove"){
            this.onPanMove({x: e.center.x,y: e.center.y,deltaX: e.deltaX, deltaY: e.deltaY});
        }
        else if(e.type == "panend")
            this.onPanEnd({x: e.center.x,y: e.center.y});
    },
    onPanStart : function(event) {
        //msg.setString("onPanStart...");
        this._panStart = true;
        this.startPoint.set(event.x,event.y);

        this.rotateStart.copy( this.projectOnTrackball(0,0));
        this.rotateEnd.copy(this.rotateStart);
        //kk.log("onPanStart:",event.x,event.y,this.deltaX,this.deltaY);
    },
    onPanMove:function(event){
        if(!this._panStart){
            return this.onPanStart(event);
        }
        //if(event.x === this.startPoint.x && event.y === this.startPoint.y)
        //    return;//panEnd

        this.deltaX = event.x - this.startPoint.x;
        this.deltaY = event.y - this.startPoint.y;

        this.handleRotation();

        this.startPoint.x = event.x;
        this.startPoint.y = event.y;

        this.lastMoveTimestamp = new Date();
        //kk.log("onPanMove:",event.x,event.y,this.deltaX,this.deltaY);
    },
    onPanEnd:function(event){
        if(!this._panStart) return;
        //g_msg.setString("onPanEnd...");
        if (new Date().getTime() - this.lastMoveTimestamp.getTime() > this.moveReleaseTimeDelta)
        {
            this.deltaX = event.x - this.startPoint.x;
            this.deltaY = event.y - this.startPoint.y;
        }
        else{
            this.schedule("pan");
        }
        /*
        else{
            this.deltaX = 0;
            this.deltaY = 0;
        }*/

        this._panStart = false;
    },
    handleRotation:function(){
        this.rotateEnd = this.projectOnTrackball(this.deltaX, this.deltaY);

        var quaternion = this.rotateMatrix(this.rotateStart, this.rotateEnd);
        var curQuaternion = this.object.quaternion;
        curQuaternion.multiplyQuaternions(quaternion, curQuaternion);
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
    rotateByAxisY:function(oldQuaternion, angle){
        var axis = new THREE.Vector3(0,1,0);
        var quaternion = new THREE.Quaternion();
        quaternion.setFromAxisAngle(axis, -angle);
        var curQuaternion = oldQuaternion.clone();
        curQuaternion.multiplyQuaternions(quaternion, curQuaternion);
        curQuaternion.normalize();
        this.object.setRotationFromQuaternion(curQuaternion);
    },
    onRotate:function(e){
        if(e.type==="rotatestart") {
            //g_msg.setString("rotatestart");
            this.rotating = true;
            this.objQuaternion = this.object.quaternion.clone();
            this.nowAngle = 0;
            this.lastAngle = 0;
        }
        else if(e.type=="rotatemove"){
            if(!this.rotating) alert("not start rotatemove...");
            //g_msg.setString("moveNow:"+this.nowAngle);
            //g_msg2.setString("e:"+e.rotation);

            var angle = this.nowAngle/180*Math.PI * this.rotateSpeed;
            this.rotateByAxisY(this.objQuaternion, angle);
            this.lastAngle = this.nowAngle;
            this.nowAngle = e.rotation;
            this.lastMoveTimestamp = new Date();
        }
        else if(e.type==="rotateend"){
            if(this.updateStatus !== "") return;
            var t = new Date().getTime() - this.lastMoveTimestamp.getTime();
            if (new Date().getTime() - this.lastMoveTimestamp.getTime() > this.moveReleaseTimeDelta)
            {
                this.updateAngle = 0;
            }
            else {
                this.updateAngle = (e.rotation - this.lastAngle)/180*Math.PI;
                if(this.updateAngle<-1.8)
                    this.updateAngle+=Math.PI;
                else if(this.updateAngle>1.8)
                    this.updateAngle-=Math.PI;
                this.schedule("rotate");
            }
            //g_msg.setString("t,a:"+t+","+this.updateAngle);
            //g_msg2.setString("update:"+this.updateAngle);
            return;
        }


        /*
        if(!this.rotating) return;
        if(e.type==="rotateend"){
            //g_msg.setString("rotateend");
            this.rotating = false;
            return;
        }
        var angle = e.rotation;
        g_msg.setString("e:"+this.lastAngle);
        g_msg2.setString("e:"+angle);
        var deltaAngle = (angle-this.lastAngle)/180*Math.PI;
        if(deltaAngle>2)
            deltaAngle-=Math.PI*2;
        else if(deltaAngle<-2)
            deltaAngle+=Math.PI*2;
        this.lastAngle = angle;
        var axis = new THREE.Vector3(0,1,0);
        var quaternion = new THREE.Quaternion();
        quaternion.setFromAxisAngle(axis, -deltaAngle);
        this.executeRoation(quaternion);
        */
    },
    schedule:function(status){
        if(this.updateStatus !== "")
            return;
        this.updateStatus = status;
        kk.director.getScheduler().scheduleUpdate(this, 0, false);
    },
    unschedule:function(){
        this.updateStatus = "";
        kk.director.getScheduler().unscheduleUpdate(this);
    },
    update:function(dt){
        if(this.updateStatus === "rotate" && this.updateAngle!==0){
            if(this.updateAngle<-0.05 || this.updateAngle > 0.05){
                this.updateAngle *= 0.9;
                //g_msg2.setString("update:"+this.updateAngle);
                this.rotateByAxisY(this.object.quaternion, this.updateAngle);
            }
            else{
                this.updateAngle = 0;
                this.unschedule();
            }
        }
        else if(this.updateStatus == "pan" && this.deltaX !== 0 && this.deltaY !== 0)
        {
            var drag = 0.9;
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
        else{
            this.unschedule();
        }
    },
    registerListener : function() {
        this.listener = kk.EventListener.create({
            event: kk.EventListener.TOUCH,
            swallowTouches: false,
            onPan: this.onPan.bind(this),
            onRotate:this.onRotate.bind(this),
            onPress:this.onPress.bind(this)
        });
        kk.eventManager.addListener(this.listener);
    },
    removeSelf:function(){
        kk.director.getScheduler().unscheduleUpdate(this);
        kk.eventManager.removeListener(this.listener);
    }
});


kk.DoubleRotateControl = kk.RotateControl.extend({
    ctor: function (obj1, obj2, camera) {
        this.obj1 = obj1;
        this.obj2 = obj2;
        this.center = this.obj1.position.clone().add(this.obj2.position).multiplyScalar(0.5);
        kk.log("center:",this.center);
        this.init();
        this.registerListener();
    },
    projectOnTrackball:function (touchX, touchY)
    {
        var mouseOnBall = new THREE.Vector3();
        mouseOnBall.set(
            this.clamp(touchX / this.windowHalfX, -1, 1),
            0,
            this.clamp(touchY / this.windowHalfY, -1, 1)
        );
        var length = mouseOnBall.length();
        if (length > 1.0)
        {
            mouseOnBall.normalize();
        }
        else
        {
            mouseOnBall.y = Math.sqrt(1.0 - length * length);
        }
        return mouseOnBall;
    },
    handleRotation:function(){
        this.rotateEnd = this.projectOnTrackball(this.deltaX, this.deltaY);

        var quaternion = this.rotateMatrix(this.rotateStart, this.rotateEnd);
        var obj1Sub = this.obj1.position.clone().sub(this.center);
        var obj1SubNew = obj1Sub.applyQuaternion(quaternion);
        this.obj1.position.copy(this.center.clone().add(obj1SubNew));
        var obj2Sub = this.obj2.position.clone().sub(this.center);
        var obj2SubNew = obj2Sub.applyQuaternion(quaternion);
        this.obj2.position.copy(this.center.clone().add(obj2SubNew));

        this.rotateEnd.copy(this.rotateStart);
    },
    update:function(dt){
        if(this.updateStatus == "pan" && this.deltaX !== 0 && this.deltaY !== 0)
        {
            var drag = 0.9;
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
        else{
            this.unschedule();
        }
    },
    registerListener : function() {
        this.listener = kk.EventListener.create({
            event: kk.EventListener.TOUCH,
            swallowTouches: false,
            onPan: this.onPan.bind(this),
            onPress:this.onPress.bind(this)
        });
        kk.eventManager.addListener(this.listener);
    }
});
