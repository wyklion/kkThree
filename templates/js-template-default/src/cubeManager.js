/**
 * Created by kk on 2015/5/28.
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