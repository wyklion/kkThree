/**
 * Created by kk on 2015/5/11.
 */

var PlayScene = kk.Class.extend({
    step:0,
    step2:0,
    stats:null,
    controls:null,
    ctor:function(){
        var scope = this;
        this.step = 0;
        this.step2 = 0;
        this.init();

        this.sceneControl = new kk.OrbitControls(camera);
        this.sceneControl.center.y = 10;
        this.sceneControl.userPan = false;
        //this.sceneControl.fixedUpDown = true;
        //this.sceneControl.autoRotate = true;
        //this.sceneControl.setEnabled(false);
        kk.director.getScheduler().scheduleUpdate(this.sceneControl, 0, false);

        var listener1 = kk.EventListener.create({
            event: kk.EventListener.TOUCH,
            swallowTouches: true,
            onTap: function (e) {
                scope.onTap({x:e.center.x, y:e.center.y});
            }
        });
        kk.eventManager.addListener(listener1);
        kk.director.getScheduler().scheduleUpdate(this, 0, false);

    },
    init:function() {
        this.initStats();

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

        // add the output of the renderer to the html element
        document.getElementById("WebGL-output").appendChild(renderer.domElement);

        // position and point the camera to the center of the scene
        camera.position.x = 0;
        camera.position.y = 55;
        camera.position.z = 50;
        //camera.lookAt(new THREE.Vector3(0, 25, 0));

        // show axes in the screen
        var axes = new THREE.AxisHelper(20);
        scene.add(axes);

        this.initLight();

        this.initObjs();
    },
    initLight:function() {
        var ambientLight = new THREE.AmbientLight(0x555555);
        scene.add(ambientLight);

        //小球光
        var pointColor = "#ccffcc";
        this.pointLight = new THREE.PointLight(pointColor);
        this.pointLight.distance = 30;
        this.pointLight.position.set(20, 15, 20);
        scene.add(this.pointLight);
        //this.pointLight.visible = false;
        // add a small sphere simulating the pointlight
        var sphereLight = new THREE.SphereGeometry(0.2);
        var sphereLightMaterial = new THREE.MeshBasicMaterial({color: 0xac6c25});
        this.sphereLightMesh = new THREE.Mesh(sphereLight, sphereLightMaterial);
        this.sphereLightMesh.castShadow = true;
        this.sphereLightMesh.position.set(20, 15, 20);
        scene.add(this.sphereLightMesh);

        var target = new THREE.Object3D();
        target.position = new THREE.Vector3(0, 0, 0);
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
        directionalLight.target = target;
        //directionalLight.shadowCameraVisible = true;
        scene.add(directionalLight);
    },
    initObjs:function(){
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
        plane.position.y = -5;
        scene.add(plane);

        this.createControlObj();
    },
    createControlObj:function(){
        var cubeGeometry = new THREE.BoxGeometry(10, 10, 10);
        var cubeMaterial = new THREE.MeshLambertMaterial({color: 0xaaaadd});
        var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cube.castShadow = true;
        // position the cube
        cube.position.x = 0;
        cube.position.z = 0;
        cube.position.y = 15;
        scene.add(cube);

        //var ctr = new kk.RotateControl(cube, camera);
    },
    update:function(dt){
        this.stats.update();

        this.step+=0.02;
        if(this.step > Math.PI*2) this.step -= Math.PI*2;

        this.sphereLightMesh.position.x = 20 * (Math.cos(this.step));
        this.sphereLightMesh.position.z = 20 * (Math.sin(this.step));
        this.pointLight.position.x = 20 * (Math.cos(this.step));
        this.pointLight.position.z = 20 * (Math.sin(this.step));

        renderer.render(scene, camera);
    },
    onTap:function(event){
    },
    initStats:function() {
        this.stats = new Stats();
        this.stats.setMode(0); // 0: fps, 1: ms
        // Align top-left
        this.stats.domElement.style.position = 'absolute';
        this.stats.domElement.style.left = '0px';
        this.stats.domElement.style.top = '0px';

        document.getElementById("Stats-output").appendChild(this.stats.domElement);
    }
});