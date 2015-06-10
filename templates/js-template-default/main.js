/**
 * Created by kk on 2015/5/8.
 */

var camera;
var scene;
var renderer;

kk.game.onStart = function(){
    var playScene = new PlayScene();
}
kk.game.run();

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
// listen to the resize events
window.addEventListener('resize', onResize, false);
