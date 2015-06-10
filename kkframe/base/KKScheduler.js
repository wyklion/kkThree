/**
 * Created by kk on 2015/6/3.
 */

//data structures
/**
 * A list double-linked list used for "updates with priority"
 * @Class
 * @name cc.ListEntry
 * @param {cc.ListEntry} prev
 * @param {cc.ListEntry} next
 * @param {function} callback
 * @param {cc.Class} target not retained (retained by hashUpdateEntry)
 * @param {Number} priority
 * @param {Boolean} paused
 * @param {Boolean} markedForDeletion selector will no longer be called and entry will be removed at end of the next tick
 */
kk.ListEntry = function (prev, next, callback, target, priority, paused, markedForDeletion) {
    this.prev = prev;
    this.next = next;
    this.callback = callback;
    this.target = target;
    this.priority = priority;
    this.paused = paused;
    this.markedForDeletion = markedForDeletion;
};

/**
 * A update entry list
 * @Class
 * @name cc.HashUpdateEntry
 * @param {Array} list Which list does it belong to ?
 * @param {cc.ListEntry} entry entry in the list
 * @param {cc.Class} target hash key (retained)
 * @param {function} callback
 * @param {Array} hh
 */
kk.HashUpdateEntry = function (list, entry, target, callback, hh) {
    this.list = list;
    this.entry = entry;
    this.target = target;
    this.callback = callback;
    this.hh = hh;
};

/**
 * Light weight timer
 * @class
 * @extends kk.Class
 */
kk.Timer = kk.Class.extend({
    _scheduler: null,
    _elapsed:0.0,
    _runForever:false,
    _useDelay:false,
    _timesExecuted:0,
    _repeat:0, //0 = once, 1 is 2 x executed
    _delay:0,
    _interval:0.0,

    /**
     * cc.Timer's Constructor
     * Constructor of cc.Timer
     */
    ctor:function () {
        this._scheduler = null;
        this._elapsed = -1;
        this._runForever = false;
        this._useDelay = false;
        this._timesExecuted = 0;
        this._repeat = 0;
        this._delay = 0;
        this._interval = 0;
    },
    /**
     * @return {Number} returns interval of timer
     */
    getInterval : function(){return this._interval;},
    /**
     * @param {Number} interval set interval in seconds
     */
    setInterval : function(interval){this._interval = interval;},

    setupTimerWithInterval: function(seconds, repeat, delay){
        this._elapsed = -1;
        this._interval = seconds;
        this._delay = delay;
        this._useDelay = (this._delay > 0);
        this._repeat = repeat;
        this._runForever = (this._repeat === cc.REPEAT_FOREVER);
    },

    trigger: function(){
        return 0;
    },

    cancel: function(){
        return 0;
    },

    /**
     * triggers the timer
     * @param {Number} dt delta time
     */
    update:function (dt) {
        if (this._elapsed === -1) {
            this._elapsed = 0;
            this._timesExecuted = 0;
        } else {
            this._elapsed += dt;
            if (this._runForever && !this._useDelay) {//standard timer usage
                if (this._elapsed >= this._interval) {
                    this.trigger();
                    this._elapsed = 0;
                }
            } else {//advanced usage
                if (this._useDelay) {
                    if (this._elapsed >= this._delay) {
                        this.trigger();

                        this._elapsed -= this._delay;
                        this._timesExecuted += 1;
                        this._useDelay = false;
                    }
                } else {
                    if (this._elapsed >= this._interval) {
                        this.trigger();

                        this._elapsed = 0;
                        this._timesExecuted += 1;
                    }
                }

                if (!this._runForever && this._timesExecuted > this._repeat)
                    this.cancel();
            }
        }
    }
});



kk.Scheduler = kk.Class.extend({
    _timeScale:1.0,
    _updatesNegList: null,
    _updates0List: null,
    _updatesPosList: null,

    _hashForUpdates:null, // hash used to fetch quickly the list entries for pause,delete,etc
    _updateHashLocked:false,

    ctor:function () {
        this._timeScale = 1.0;
        this._updatesNegList = [];
        this._updates0List = [];
        this._updatesPosList = [];

        this._hashForUpdates = {};
        this._updateHashLocked = false;

    },

    //-----------------------private method----------------------

    _schedulePerFrame: function(callback, target, priority, paused){
        var hashElement = this._hashForUpdates[target.__instanceId];
        if (hashElement && hashElement.entry){
            // check if priority has changed
            if (hashElement.entry.priority !== priority){
                if (this._updateHashLocked){
                    kk.log("warning: you CANNOT change update priority in scheduled function");
                    hashElement.entry.markedForDeletion = false;
                    hashElement.entry.paused = paused;
                    return;
                }else{
                    // will be added again outside if (hashElement).
                    this.unscheduleUpdate(target);
                }
            }else{
                hashElement.entry.markedForDeletion = false;
                hashElement.entry.paused = paused;
                return;
            }
        }

        // most of the updates are going to be 0, that's way there
        // is an special list for updates with priority 0
        if (priority === 0){
            this._appendIn(this._updates0List, callback, target, paused);
        }else if (priority < 0){
            this._priorityIn(this._updatesNegList, callback, target, priority, paused);
        }else{
            // priority > 0
            this._priorityIn(this._updatesPosList, callback, target, priority, paused);
        }
    },

    _removeUpdateFromHash:function (entry) {
        var self = this, element = self._hashForUpdates[entry.target.__instanceId];
        if (element) {
            //list entry
            kk.arrayRemoveObject(element.list, element.entry);

            delete self._hashForUpdates[element.target.__instanceId];
            //cc.arrayRemoveObject(self._hashForUpdates, element);
            element.entry = null;

            //hash entry
            element.target = null;
        }
    },

    _priorityIn:function (ppList, callback,  target, priority, paused) {
        var self = this,
            listElement = new kk.ListEntry(null, null, callback, target, priority, paused, false);

        // empey list ?
        if (!ppList) {
            ppList = [];
            ppList.push(listElement);
        } else {
            var index2Insert = ppList.length - 1;
            for(var i = 0; i <= index2Insert; i++){
                if (priority < ppList[i].priority) {
                    index2Insert = i;
                    break;
                }
            }
            ppList.splice(i, 0, listElement);
        }

        //update hash entry for quick access
        self._hashForUpdates[target.__instanceId] = new kk.HashUpdateEntry(ppList, listElement, target, null);

        return ppList;
    },

    _appendIn:function (ppList, callback, target, paused) {
        var self = this, listElement = new kk.ListEntry(null, null, callback, target, 0, paused, false);
        ppList.push(listElement);

        //update hash entry for quicker access
        self._hashForUpdates[target.__instanceId] = new kk.HashUpdateEntry(ppList, listElement, target, null, null);
    },

    //-----------------------public method-------------------------
    scheduleUpdate: function(target, priority, paused){
        this._schedulePerFrame(function(dt){
            target.update(dt);
        }, target, priority, paused);
    },

    unscheduleUpdate: function(target){
        if (target == null)
            return;

        var element = this._hashForUpdates[target.__instanceId];

        if (element){
            if (this._updateHashLocked){
                element.entry.markedForDeletion = true;
            }else{
                this._removeUpdateFromHash(element.entry);
            }
        }
    },

    update:function(dt){
        this._updateHashLocked = true;

        if(this._timeScale !== 1)
            dt *= this._timeScale;

        var i, list, len, entry;

        for(i=0,list=this._updatesNegList, len = list.length; i<len; i++){
            entry = list[i];
            if(!entry.paused && !entry.markedForDeletion)
                entry.callback(dt);
        }

        for(i=0, list=this._updates0List, len=list.length; i<len; i++){
            entry = list[i];
            if (!entry.paused && !entry.markedForDeletion)
                entry.callback(dt);
        }

        for(i=0, list=this._updatesPosList, len=list.length; i<len; i++){
            entry = list[i];
            if (!entry.paused && !entry.markedForDeletion)
                entry.callback(dt);
        }

        // delete all updates that are marked for deletion
        // updates with priority < 0
        for(i=0,list=this._updatesNegList; i<list.length; ){
            entry = list[i];
            if(entry.markedForDeletion)
                this._removeUpdateFromHash(entry);
            else
                i++;
        }

        for(i=0, list=this._updates0List; i<list.length; ){
            entry = list[i];
            if (entry.markedForDeletion)
                this._removeUpdateFromHash(entry);
            else
                i++;
        }

        for(i=0, list=this._updatesPosList; i<list.length; ){
            entry = list[i];
            if (entry.markedForDeletion)
                this._removeUpdateFromHash(entry);
            else
                i++;
        }

        this._updateHashLocked = false;
    }
});