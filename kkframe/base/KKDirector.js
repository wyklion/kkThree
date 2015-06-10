/**
 * Created by kk on 2015/6/3.
 */

kk.director = {
    _paused: false,
    _deltaTime: 0.0,
    _scheduler: null,
    _actionManager: null,
    init:function(){
        var self = this;
        self._lastUpdate = Date.now();
        kk.eventManager.addCustomListener(kk.game.EVENT_SHOW, function () {
            self._lastUpdate = Date.now();
        });

        //scheduler
        this._scheduler = new kk.Scheduler();
        //action manager
        //this._actionManager = new cc.ActionManager();
        //Paused?
        this._paused = false;

    },
    /**
     * calculates delta time since last time it was called
     */
    calculateDeltaTime: function () {
        var now = Date.now();
        this._deltaTime = (now - this._lastUpdate) / 1000;
        this._lastUpdate = now;
    },

    getScheduler: function () {
        return this._scheduler;
    },

    mainLoop:function(){
        this.calculateDeltaTime();
        if (!this._paused) {
            this._scheduler.update(this._deltaTime);
        }
    }
}