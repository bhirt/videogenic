/*
 *
 * edit decision list 
 *
 * http://kodi.wiki/view/Edit_decision_list 
 */
let EventEmitter = require('events');


class EDL extends EventEmitter {
    
    static CUT = 0;
    static MUTE = 1;
    static SCENE = 2;
    static COMMERCIAL = 3;

    // optionally takes 2d array of edl [ [ start,end,action], [start,end,action] .. n ]
    constructor(input) {
        super();

        let self = this;

        // everytime the EDL gets updated, the revision number increases
        self.revision = 1;

        self.nextId = 0;
        self._list = [];

        if (input) {
            input.forEach(function(i) {
                self.add(...i);
            });
        }
    }

    numED() {
        return this._list.length;
    }

    actionNames() {
        return [ 'Cut','Mute','Scene Marker','Commercial Break' ];
    }

    actionName(ed) {
        let names = this.actionNames();
        return names[ed.action];
        
    }

    // update item in list
    update(edId,start,end,action) {

        let ed = this.edWithId(edId);

        console.log(`update old ${ed.id}; start ${ed.start} => ${start} end ${ed.end} => ${end} action ${action}`);
    
        if (ed) {
            let changed = (ed.action != action) || (ed.start != start) || (ed.end != end);

            if (changed) {
                //console.log(`edlUpdate ${edId} ${start}/${ed.start} ${end}/${ed.end} ${action}/${ed.action} changed: ${changed}`);
                ed.start = start;
                ed.end = end;
                ed.action = action;

                this.revision++;

                this.emit('updated', ed );
            }
        }
    }

    insertAtIndex(idx,start,end,action) {
        let ed = { id: this.nextId++, start: start, end: end, action: action };

        console.log(`adding id ed at index ${idx}`);
        console.log(ed);

        this.revision++;

        this._list.splice( idx, 0, ed );

        this.emit('added', ed );
        this.emit('updated', ed );
    }

    // add item after supplied ed
    insertAfter(ed, start,end,action) {
        this.insertAtIndex(this._list.indexOf(ed)+1,start,end,action);
    }

    // add item before supplied ed
    insertBefore(ed, start,end,action) {
        this.insertAtIndex(this._list.indexOf(ed),start,end,action);
    }

    // add item to end of list -- convience for this.insertAtIndex(list.length,...); 
    add(start,end,action) {
        function _overlap(s1,e1,s2,e2) {
            return s1 <= e2 && s2 <= e1;
            
        }

        // make sure new ed doesn't overlap existing
        if (this._list.every( ed => !_overlap(start,end,ed.start,ed.end) )) {
    
            let index = 0;
            let curIndex = 1;
            this._list.forEach( ed => {
                if (start > ed.end) {
                    index = curIndex;
                }
                curIndex++;
            });
            this.insertAtIndex(index,start,end,action);
        }
        else {
            console.log(`${start}..${end} overlaps:`);
            this._list.forEach( ed => {
                if (_overlap(start,end,ed.start,ed.end)) {
                    console.log(`ed.id ${ed.id} ${ed.start}..${ed.end}`);
                }
            });
            throw('cannot add ed that overlaps existing ed');
        }

        
    }

    // remove item from list
    remove(item) {
        let index = this._list.indexOf(item);

        if (index > -1) {
            this.revision++;
            this._list.splice(index,1);
            this.emit('removed', item );
            this.emit('updated', item );
        }
        else {
            throw(`failed to find item ${item} in eld`);
        }

    }
    
    // merges two item.  the ed2 is deleted and then ed1 is updated  
    merge(ed1,ed2) {
        let newStart = Math.min(ed1.start,ed2.start);
        let newEnd = Math.max(ed1.end,ed2.end);

        if (ed1.action == ed2.action) {
            this.remove(ed2);
            this.update(ed1.id,newStart,newEnd,ed1.action);
        }
        else {
            throw('ed1 and ed2 have different action types.  ed of different actions cannot be merged');
        }
    }
            

    // clears the current list
    clear() {
        //this.nextId = 0;
        this._list = [];
        this.revision++;

        this.emit('cleared', this );
        this.emit('updated', null );
    }

    list() {
        return this._list;
    }

    // returns raw data in the same format that the constructor takes eg, [[0.00,203.97,0], [860.11,1210.28,0], [1866.40,1916.87,0]]
    rawData() {
        let data = [];
        this._list.forEach(function(ed) {
            data.push( [ ed.start, ed.end, ed.action ] );
        });
        return data;
    }

    edWithId(id) {
        if (!Number.isInteger(id)) {
            throw('EDL.edWithId() id "' + id + '" is not an integer');
        }

        return this._list.find(function(ed) {
            return ed.id == id; 
        });
    }

    // returns the total amount of time cut in the edl
    cutTime() {
        let t = 0;
        this._list.forEach(function(ed) {
            if (ed.action == 0) {
                t += ed.end - ed.start;
            }
        });
        return t;
    }

    // returns ed data or undef if a bad range was supplied
    edAtIndex(idx) {
        return (idx >= 0) && (idx < this._list.length) ? this._list[idx] : undefined;
    }
}

module.exports = EDL;

