/**
 * Created by kk on 2015/5/11.
 */

var ROW_NUM = 8;
var COL_NUM = 28;
var CUBE_LENGTH = 2;

var PlayScene = function(){
};

PlayScene.prototype = {
    constructor: PlayScene,
    init:function(){
        this.clock = new THREE.Clock();
        // create a scene, that will hold all our elements such as objects, cameras and lights.
        scene = new THREE.Scene();
        //scene.fog=new THREE.FogExp2( 0xffffff, 0.015 );
        //scene.fog = new THREE.Fog(0xddbbaa, 0.005, 300);
        //scene.overrideMaterial = new THREE.MeshLambertMaterial({color: 0xffffff});

        // create a camera, which defines where we're looking at.
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

        // create a render and set the size
        renderer = new THREE.WebGLRenderer();
        renderer.setClearColor(new THREE.Color(0xaaaaaa));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMapEnabled = true;
        //renderer.shadowMapType = THREE.PCFShadowMap;

        // position and point the camera to the center of the scene
        camera.position.x = 0;
        camera.position.y = 35;
        camera.position.z = 40;
        //camera.lookAt(new THREE.Vector3(0, 25, 0));

        this.orbitControls = new THREE.OrbitControls(camera);
        this.orbitControls.center.y = 10;
        this.orbitControls.userPan = false;
        //this.orbitControls.fixedUpDown = true;
        //this.orbitControls.autoRotate = true;
        var scope = this;

        kk.hammer.on("panstart", function (e) {
            //console.log("panstart");
            scope.orbitControls.dispatchEvent({type:"panstart",
                x: e.center.x,y: e.center.y});
        });
        kk.hammer.on("pan", function (e) {
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

        var ambientLight = new THREE.AmbientLight(0x555555);
        scene.add(ambientLight);

        //小球光
        var pointColor = "#ccffcc";
        this.pointLight = new THREE.PointLight(pointColor);
        this.pointLight.distance = 30;
        this.pointLight.position.set(20,15,20);
        scene.add(this.pointLight);
        //this.pointLight.visible = false;
        // add a small sphere simulating the pointlight
        var sphereLight = new THREE.SphereGeometry(0.2);
        var sphereLightMaterial = new THREE.MeshBasicMaterial({color: 0xac6c25});
        this.sphereLightMesh = new THREE.Mesh(sphereLight, sphereLightMaterial);
        this.sphereLightMesh.castShadow = true;
        this.sphereLightMesh.position.set(20,15,20);
        scene.add(this.sphereLightMesh);


        // add the output of the renderer to the html element
        document.getElementById("WebGL-output").appendChild(renderer.domElement);


        // show axes in the screen
        var axes = new THREE.AxisHelper(20);
        scene.add(axes);

        //平地
        var floorTex = THREE.ImageUtils.loadTexture("res/brick-wall.jpg");
        floorTex.wrapT = THREE.RepeatWrapping;
        floorTex.wrapS = THREE.RepeatWrapping;
        var mat = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            map: floorTex
        });
        var geom = new THREE.BoxGeometry(500, 500, 1, 30);
        geom.computeVertexNormals();
        var plane = new THREE.Mesh(geom, mat);
        plane.rotation.x = -0.5 * Math.PI;
        plane.receiveShadow = true;
        plane.material.map.repeat.set(10,10);
        plane.material.map.needUpdate = true;
        scene.add(plane);

        /*
        // 锥光，有阴影
        this.spotLight = new THREE.SpotLight(0xeecccc);
        this.spotLight.position.set(25, 50, 25);
        this.spotLight.intensity = 1;
        this.spotLight.castShadow = true;
        this.spotLight.target = plane;
        scene.add(this.spotLight);*/
        /*
        this.spotLight2 = new THREE.SpotLight(0xeecccc);
        this.spotLight2.position.set(20, 30, 20);
        this.spotLight2.intensity = 1;
        this.spotLight2.castShadow = true;
        this.spotLight2.target = plane;
        scene.add(this.spotLight2);*/

        //远光
        var pointColor = "#ff5808";
        var directionalLight = new THREE.DirectionalLight(pointColor);
        directionalLight.position.set(25, 50, 25);
        directionalLight.castShadow = true;
        directionalLight.shadowCameraNear = 2;
        directionalLight.shadowCameraFar = 100;
        directionalLight.shadowCameraLeft = -50;
        directionalLight.shadowCameraRight = 50;
        directionalLight.shadowCameraTop = 50;
        directionalLight.shadowCameraBottom = -50;

        directionalLight.distance = 0;
        directionalLight.intensity = 0.5;
        directionalLight.shadowMapHeight = 1024;
        directionalLight.shadowMapWidth = 1024;
        directionalLight.target = plane;
        directionalLight.shadowCameraVisible = true;
        scene.add(directionalLight);

        // create the ground plane
        /*
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
         */


        this.createCubes();

        //一个球
        /*
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
        */

        this.loadObj2();

        // call the render function
        this.step = 0;
        this.render();
    },
    loadObj2:function() {
        var loader = new THREE.ColladaLoader();
        var mesh;
        loader.load("res/Truck_dae.dae", function (result) {
            mesh = result.scene.children[0].children[0].clone();
            mesh.scale.set(0.5, 0.5, 0.5);
            mesh.position.set(20, 0, 20);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            //kk.log(mesh)
            mesh.traverse(function(child)
            {
                if (child instanceof THREE.Mesh)
                {
                    //设置模型生成阴影并接收阴影
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            scene.add(mesh);
        });
    },
    loadObj:function(){
        var loader = new THREE.OBJMTLLoader();

        loader.load('res/butterfly.obj', 'res/butterfly.mtl', function (object) {

            //traverse：回调，该模型以及所有子模型均执行该函数
            //相当于遍历obj的children数组
            object.traverse(function(child)
            {
                if (child instanceof THREE.Mesh)
                {
                    //设置模型生成阴影并接收阴影
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            /*
            // configure the wings
            var wing2 = object.children[5].children[0];
            var wing1 = object.children[4].children[0];
            wing1.castShadow = true;
            wing2.castShadow = true;

            wing1.material.opacity = 0.6;
            //wing1.material.transparent = true;
            //wing1.material.depthTest = false;
            wing1.material.side = THREE.DoubleSide;

            wing2.material.opacity = 0.6;
            //wing2.material.depthTest = false;
            //wing2.material.transparent = true;
            wing2.material.side = THREE.DoubleSide;
            */

            object.scale.set(30, 30, 30);
            object.position.set(10,6,15)
            object.castShadow = true;
            object.receiveShadow = true;

            scene.add(object);
        });
    },
    createCubes:function() {
        if (this.cubeGroup != null)
            this.cubeGroup.parent.remove(this.cubeGroup);
        ROW_NUM = controls.rows;
        COL_NUM = controls.cols;
        CUBE_LENGTH = controls.length;
        this.cm = new CubeManager(this, ROW_NUM, COL_NUM, CUBE_LENGTH);
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
        cube.receiveShadow = true;
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
    step2:0,
    render:function(){
        var delta = this.clock.getDelta();
        //this.trackballControls.update(delta);
        this.orbitControls.update(delta);

        this.step+=0.02;
        if(this.step > Math.PI*2) this.step -= Math.PI*2;
        /*
        this.step2+=0.03;
        if(this.step2 > Math.PI*2) this.step2 -= Math.PI*2;
        this.spotLight.position.x = 100 * (Math.cos(this.step));
        this.spotLight.position.z = 100 * (Math.sin(this.step));
        this.spotLight2.position.x = 100 * (Math.cos(Math.PI+this.step));
        this.spotLight2.position.z = 100 * (Math.sin(Math.PI+this.step));*/

        this.sphereLightMesh.position.x = 20 * (Math.cos(this.step));
        this.sphereLightMesh.position.z = 20 * (Math.sin(this.step));
        this.pointLight.position.x = 20 * (Math.cos(this.step));
        this.pointLight.position.z = 20 * (Math.sin(this.step));
        //this.pointLight.position.copy(this.sphereLightMesh.position);

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