/**
 * Created by kk on 2015/5/11.
 */

var ROW_NUM = 8;
var COL_NUM = 28;
var CUBE_LENGTH = 2;

var CubeManager = function(scene){
    this.scene = scene;
    this.cubes = new Array();
    for(var r=0;r<ROW_NUM;r++)
        for(var c=0;c<COL_NUM;c++){
            this.cubes[r*COL_NUM+c]={
                flag:2,
                obj:null,
                color:0
            }
        }
};

CubeManager.prototype = {
    constructor: CubeManager,
    setCube:function(idx,obj,color){
        this.cubes[idx] = {
            obj:obj,
            color:color,
            flag:0
        };
    },
    clear:function(){ this.cubes = new Array(); },
    breakCube:function(idx){
        //console.log("break:",this.cubes[idx]);

        this.checkCount = 0;
        this.checkAroundSameColorCube(this, this.cubes[idx].color, idx);
        if(this.checkCount >= 3){
            this.removeSameColor();
            this.dropDownCubes();
            //console.log("check other...");
            if(!this.anyBreakChance()){
                //console.log("no break any more...");
                this.scene.createCubes();
            }
            else
                ;//console.log("has break chance...");
        }
        else
            this.clearFlag();
    },
    anyBreakChance:function(){
        for(var i = 1; i < this.cubes.length;i++){
            if(this.cubes[i].flag != 1){
                this.checkCount = 0;
                this.checkAroundSameColorCube(this, this.cubes[i].color, i);
                if(this.checkCount >= 3){
                    this.clearFlag();
                    return true;
                }
            }
        }
        this.clearFlag();
        return false;
    },
    clearFlag:function(){
        for(var i = 0; i < this.cubes.length;i++){
            if(this.cubes[i].flag == 1)
                this.cubes[i].flag = 0;
        }
    },
    removeCube:function(idx){
        //console.log("remove:", Math.floor(idx / COL_NUM), idx%COL_NUM,this.cubes[idx]);
        if(this.cubes[idx].obj!=null){
            this.cubes[idx].obj.parent.remove(this.cubes[idx].obj);
            this.cubes[idx].obj = null;
        }
        this.cubes[idx].flag = 2;
    },
    removeSameColor:function(){
        for(var i = 0; i < this.cubes.length;i++){
            if(this.cubes[i].flag == 1) {
                this.removeCube(i)
            }
        }
    },
    dropDownCubes:function(){
        for(var c = 0; c < COL_NUM; c++){
            for(var r = 1; r < ROW_NUM;r++){
                if(this.cubes[r*COL_NUM+c].flag==0) {
                    var down = r - 1;
                    while (down > 0 && this.cubes[down * COL_NUM + c].flag == 2) {
                        down = down - 1;
                    }
                    if (down == 0 && this.cubes[down * COL_NUM + c].flag == 2)
                        this.moveCube(r * COL_NUM + c, c);
                    else if (down < r - 1) {
                        this.moveCube(r * COL_NUM + c, (down + 1) * COL_NUM + c);
                    }
                }
            }
        }
    },
    moveCube:function(from,to){
        /*
        var r = Math.floor(from / COL_NUM);
        var c = from%COL_NUM;
        var r2 = Math.floor(to / COL_NUM);
        var c2 = to%COL_NUM;
        console.log(from,r,c,to,r2,c2);
        if(this.cubes[from].obj==null)
            console.log("from:",this.cubes[from],"to:",this.cubes[to]);*/

        this.cubes[to].obj = this.cubes[from].obj;
        this.cubes[to].obj.idx = to;
        this.cubes[to].color = this.cubes[from].color;
        this.cubes[to].flag = 0;
        this.cubes[from].obj = null;
        this.cubes[from].flag = 2;
        var r = (from-to)/COL_NUM;
        this.cubes[to].obj.position.y = this.cubes[to].obj.position.y - r*(CUBE_LENGTH*1.1);
    },
    checkAroundSameColorCube:function(scope, color, idx){
        var r = Math.floor(idx / COL_NUM);
        var c = idx%COL_NUM;
        if(this.cubes[idx].flag != 0)
            return;
        if(this.cubes[idx].color != color) return;
        //console.log("check idx:",r,c, "color:",this.cubes[idx].color);
        this.cubes[idx].flag = 1;
        scope.checkCount++;
        var x = r + 1;
        if(x<ROW_NUM)
            this.checkAroundSameColorCube(scope, color, x*COL_NUM+c);
        x = r - 1;
        if(x>=0)
            this.checkAroundSameColorCube(scope, color, x*COL_NUM+c);
        x = (c + COL_NUM - 1)%COL_NUM;
        this.checkAroundSameColorCube(scope, color, r*COL_NUM+x);
        x = (c + 1)%COL_NUM;
        this.checkAroundSameColorCube(scope, color, r*COL_NUM+x);
    }
}

var PlayScene = function(){
};

PlayScene.prototype = {
    constructor: PlayScene,
    init:function(){
        this.clock = new THREE.Clock();
        // create a scene, that will hold all our elements such as objects, cameras and lights.
        scene = new THREE.Scene();
        //scene.fog=new THREE.FogExp2( 0xffffff, 0.015 );
        scene.fog = new THREE.Fog(0xffffff, 0.005, 200);
        //scene.overrideMaterial = new THREE.MeshLambertMaterial({color: 0xffffff});

        // create a camera, which defines where we're looking at.
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

        // create a render and set the size
        renderer = new THREE.WebGLRenderer();
        renderer.setClearColor(new THREE.Color(0xeeeeee));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMapEnabled = true;

        // position and point the camera to the center of the scene
        camera.position.x = 0;
        camera.position.y = 35;
        camera.position.z = 40;
        //camera.lookAt(new THREE.Vector3(0, 25, 0));

        this.orbitControls = new THREE.OrbitControls(camera);
        this.orbitControls.center.y = 10;
        this.orbitControls.userPan = false;
        this.orbitControls.fixedUpDown = true;
        //this.orbitControls.autoRotate = true;
        var scope = this;

        hammer.on("panstart", function (e) {
            //console.log("panstart");
            scope.orbitControls.dispatchEvent({type:"panstart",
                x: e.center.x,y: e.center.y});
        });
        hammer.on("pan", function (e) {
            //console.log(e);
            scope.orbitControls.dispatchEvent({type:"pan",
                x: e.center.x,y: e.center.y,deltaX: e.deltaX, deltaY: e.deltaY});
        });

        /*
        this.trackballControls = new THREE.TrackballControls(camera);
        this.trackballControls.rotateSpeed = 1.0;
        this.trackballControls.zoomSpeed = 1.0;
        this.trackballControls.panSpeed = 1.0;
        //this.trackballControls.noZoom=false;
        this.trackballControls.noPan=true;
        //this.trackballControls.staticMoving = true;
        //this.trackballControls.dynamicDampingFactor=0.3;*/

        var ambientLight = new THREE.AmbientLight(0xaaaaaa);
        scene.add(ambientLight);

        // add spotlight for the shadows
        this.spotLight = new THREE.SpotLight(0xaa3333);
        this.spotLight.position.set(100, 0, 100);
        this.spotLight.intensity = 0.5;
        scene.add(this.spotLight);
        this.spotLight2 = new THREE.SpotLight(0x3333aa);
        this.spotLight2.position.set(-100, 0, -100);
        this.spotLight2.intensity = 0.5;
        scene.add(this.spotLight2);

        // add the output of the renderer to the html element
        document.getElementById("WebGL-output").appendChild(renderer.domElement);


        // show axes in the screen
        var axes = new THREE.AxisHelper(20);
        scene.add(axes);
        // create the ground plane
        var planeGeometry = new THREE.PlaneBufferGeometry(1000, 1000, 1, 1);
        var planeMaterial = new THREE.MeshLambertMaterial({color: 0xeb73eb});
        var plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.receiveShadow = true;
        // rotate and position the plane
        plane.rotation.x = -0.5 * Math.PI;
        plane.position.x = 0;
        plane.position.y = 0;
        plane.position.z = 0;
        // add the plane to the scene
        scene.add(plane);


        this.createCubes();

        // create a sphere
        var sphereGeometry = new THREE.SphereGeometry(4, 20, 20);
        var sphereMaterial = new THREE.MeshLambertMaterial({color: 0x7777ff});
        var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.castShadow = true;
        // position the sphere
        sphere.position.x = 0;
        sphere.position.y = 20;
        sphere.position.z = 0;
        // add the sphere to the scene
        scene.add(sphere);

        // call the render function
        this.step = 0;
        this.render();
    },
    createCubes:function() {
        if (this.cubeGroup != null)
            this.cubeGroup.parent.remove(this.cubeGroup);
        ROW_NUM = controls.rows;
        COL_NUM = controls.cols;
        CUBE_LENGTH = controls.length;
        this.cm = new CubeManager(this);
        this.cubeGroup = new THREE.Group();
        scene.add(this.cubeGroup);
        for (var r = 0; r < ROW_NUM; r++) {
            for (var c = 0; c < COL_NUM; c++) {
                var cube = this.createOneCube(r, c);
                this.cubeGroup.add(cube);
            }
        }
    },
    createOneCube2:function(row,col){
        var angle = (Math.PI*2/controls.cols)*col;
        // create a cube
        var name;
        var idx = Math.ceil((Math.random() * 3));
        if(idx == 1)
            name = "res/brick-wall.jpg";
        else if(idx==2)
            name = "res/weave-bump.jpg";
        else if(idx==3)
            name = "res/wood-2.jpg";

        var geom = new THREE.BoxGeometry(CUBE_LENGTH, CUBE_LENGTH, CUBE_LENGTH);
        var texture = THREE.ImageUtils.loadTexture(name);
        var mat = new THREE.MeshPhongMaterial();
        mat.map = texture;
        var cube = new THREE.Mesh(geom, mat);
        cube.castShadow = true;
        // position the cube
        cube.position.x = ( 10 * (Math.cos(angle)));
        cube.position.z = ( 10 * Math.sin(angle));
        cube.position.y = (CUBE_LENGTH*1.1) * (row+1);
        cube.rotation.y = -angle;
        cube.idx = row*COL_NUM+col;
        this.cm.setCube(cube.idx, cube, idx);
        return cube

    },
    createOneCube:function(row,col){
        var angle = (Math.PI*2/controls.cols)*col;
        // create a cube
        var color;
        var idx = Math.ceil((Math.random() * 3));
        if(idx == 1)
            color =  {color: 0xff0000};
        else if(idx==2)
            color =  {color: 0x00ff00};
        else if(idx==3)
            color =  {color: 0x0000ff};
        var cubeGeometry = new THREE.BoxGeometry(CUBE_LENGTH, CUBE_LENGTH, CUBE_LENGTH);
        var cubeMaterial = new THREE.MeshLambertMaterial(color);
        var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cube.castShadow = true;
        // position the cube
        cube.position.x = ( 10 * (Math.cos(angle)));
        cube.position.z = ( 10 * Math.sin(angle));
        cube.position.y = (CUBE_LENGTH*1.1) * (row+1);
        cube.rotation.y = -angle;
        cube.idx = row*COL_NUM+col;
        this.cm.setCube(cube.idx, cube, idx);
        return cube
    },
    step:0,
    render:function(){
        var delta = this.clock.getDelta();
        //this.trackballControls.update(delta);
        this.orbitControls.update(delta);

        this.step+=0.02;
        if(this.step > Math.PI*2) this.step -= Math.PI*2;
        this.spotLight.position.x = 100 * (Math.cos(this.step));
        this.spotLight.position.z = 100 * (Math.sin(this.step));
        this.spotLight2.position.x = 100 * (Math.cos(Math.PI+this.step));
        this.spotLight2.position.z = 100 * (Math.sin(Math.PI+this.step));
        // rotate the cubes around its axes
        /*
         scene.traverse(function (e) {
         if (e instanceof THREE.Mesh && e != plane) {
         e.rotation.x += controls.rotationSpeed;
         e.rotation.y += controls.rotationSpeed;
         e.rotation.z += controls.rotationSpeed;
         }
         });*/
        /*
         // bounce the sphere up and down
         step += controls.bouncingSpeed;
         sphere.position.x = 20 + ( 10 * (Math.cos(step)));
         sphere.position.y = 2 + ( 10 * Math.abs(Math.sin(step)));
         */
    },
    onTap:function(event){
        var vector = new THREE.Vector3(( event.x / window.innerWidth ) * 2 - 1, -( event.y / window.innerHeight ) * 2 + 1, 0.5);
        vector = vector.unproject(camera);

        var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());

        var intersects = raycaster.intersectObjects(this.cubeGroup.children);

        if (intersects.length > 0) {
            this.cm.breakCube(intersects[0].object.idx);
            /*
             console.log(intersects[0]);
             console.log(intersects[0].object.idx);
             if(intersects[0].object.material.opacity == 0.1)
             {
             intersects[0].object.material.transparent = true;
             intersects[0].object.material.opacity = 1;
             }
             else{
             intersects[0].object.material.transparent = true;
             intersects[0].object.material.opacity = 0.1;
             }*/
        }
    },
    onMouseUp:function(event) {
        var vector = new THREE.Vector3(( event.clientX / window.innerWidth ) * 2 - 1, -( event.clientY / window.innerHeight ) * 2 + 1, 0.5);
        vector = vector.unproject(camera);
        //console.log(vector,this.downVector);
        if(!this.downVector.equals(vector)) return;

        var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());

        var intersects = raycaster.intersectObjects(this.cubeGroup.children);

        if (intersects.length > 0) {
            this.cm.breakCube(intersects[0].object.idx);
            /*
             console.log(intersects[0]);
             console.log(intersects[0].object.idx);
            if(intersects[0].object.material.opacity == 0.1)
            {
                intersects[0].object.material.transparent = true;
                intersects[0].object.material.opacity = 1;
            }
            else{
                intersects[0].object.material.transparent = true;
                intersects[0].object.material.opacity = 0.1;
            }*/
        }
    },
    onMouseDown:function(event) {
        this.downVector  = new THREE.Vector3(( event.clientX / window.innerWidth ) * 2 - 1, -( event.clientY / window.innerHeight ) * 2 + 1, 0.5);
        this.downVector = this.downVector.unproject(camera);
    },
    tube:null,
    onMouseMove:function(event) {
        var showRay = true;
        if (showRay) {
            var vector = new THREE.Vector3(( event.clientX / window.innerWidth ) * 2 - 1, -( event.clientY / window.innerHeight ) * 2 + 1, 0.5);
            vector = vector.unproject(camera);

            var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
            var intersects = raycaster.intersectObjects(this.cubeGroup.children);

            if (intersects.length > 0) {

                var points = [];
                points.push(new THREE.Vector3(-30, 39.8, 30));
                points.push(intersects[0].point);

                var mat = new THREE.MeshBasicMaterial({color: 0xff0000, transparent: true, opacity: 0.6});
                var tubeGeometry = new THREE.TubeGeometry(new THREE.SplineCurve3(points), 60, 0.001);

                if (this.tube) scene.remove(this.tube);

                if (showRay) {
                    this.tube = new THREE.Mesh(tubeGeometry, mat);
                    scene.add(this.tube);
                }
            }
            else if (this.tube) scene.remove(this.tube);
        }
    }
};