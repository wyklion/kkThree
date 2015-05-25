/**
 * Created by kk on 2015/5/8.
 */

var camera;
var scene;
var renderer;
var controls;
var hammer;

kk.game.onStart = function(){
    var stats = initStats();

    //document.addEventListener('mousedown', onDocumentMouseDown, false);
    //document.addEventListener('mousemove', onDocumentMouseMove, false);
    //document.addEventListener('mouseup', onDocumentMouseUp, false);
    //document.addEventListener('ontouchstart',onDocumentMouseDown,false);
    //document.addEventListener('ontouchend',onDocumentMouseMove,false);
    //document.addEventListener('ontouchmove',onDocumentMouseUp,false);

    hammer = new Hammer(document.getElementById("WebGL-output"));
    hammer.on("tap", function (e) {
        //console.log(e.center);
        onTap({x:e.center.x, y:e.center.y});
    });

    createGUI();
    var playScene = new PlayScene();
    playScene.init();
    render();

    function createGUI(){
        controls = new function () {
            this.length = CUBE_LENGTH;
            this.rows = ROW_NUM;
            this.cols = COL_NUM;
            this.rebuildCubes = function(){
                playScene.createCubes();
            };
            /*
            this.rotationSpeed = 0.02;
            this.removeCube = function () {
                var allChildren = scene.children;
                var lastObject = allChildren[allChildren.length - 1];
                if (lastObject instanceof THREE.Mesh) {
                    scene.remove(lastObject);
                }
            };

            this.addCube = function () {

                var cubeSize = Math.ceil((Math.random() * 3));
                var cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
                var cubeMaterial = new THREE.MeshLambertMaterial({color: Math.random() * 0xffffff});
                var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
                cube.castShadow = true;
                cube.name = "cube-" + scene.children.length;

                // position the cube randomly in the scene

                cube.position.x = -30 + Math.round((Math.random() * planeGeometry.parameters.width));
                cube.position.y = Math.round((Math.random() * 5));
                cube.position.z = -20 + Math.round((Math.random() * planeGeometry.parameters.height));

                // add the cube to the scene
                scene.add(cube);
            };*/
            this.outputObjects = function () {
                console.log(scene.children);
            }
        };

        var gui = new dat.GUI();
        gui.add(controls, 'length', 0.5, 5);
        gui.add(controls, 'rows', 1, 10);
        gui.add(controls, 'cols', 10, 20);
        gui.add(controls, 'rebuildCubes');
        gui.add(controls, 'outputObjects');
        /*
        gui.add(controls, 'rotationSpeed', 0, 0.5);
        gui.add(controls, 'addCube');
        gui.add(controls, 'removeCube');*/
    }
    function render(){
        stats.update();
        playScene.render();
        requestAnimationFrame(render);
        renderer.render(scene, camera);
    };
    function initStats() {
        var stats = new Stats();
        stats.setMode(0); // 0: fps, 1: ms
        // Align top-left
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = '0px';
        stats.domElement.style.top = '0px';

        document.getElementById("Stats-output").appendChild(stats.domElement);

        return stats;
    };
    function onDocumentMouseUp(event) {
        playScene.onMouseUp(event);
    };
    function onDocumentMouseDown(event) {
        playScene.onMouseDown(event);
    };
    function onDocumentMouseMove(event) {
        playScene.onMouseMove(event);
    };
    function onTap(event) {
        playScene.onTap(event);
    };
}
function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
//window.onload = init
// listen to the resize events
window.addEventListener('resize', onResize, false);

kk.game.run();