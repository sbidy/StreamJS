var Writable = require('stream').Writable
  , schema = require('./schema.js')

var STATE_TAG = 1,
    STATE_SIZE = 2,
    STATE_CONTENT = 3;


function EbmlDecoder(options) {

    Writable.call(this, options);

    options = options || {};

    this._buffer = null;
    this._tag_stack = [];
    this._state = STATE_TAG;
    this._cursor = 0;
    this._total = 0;
    this._schema = schema;
}

require('util').inherits(EbmlDecoder, Writable);

EbmlDecoder.prototype.getTotalLenght = function () {
    return this._total;
};
//"main"
EbmlDecoder.prototype._write = function (chunk, enc, done) {

    if (this._buffer === null) {
        this._buffer = chunk;
    } else {
        this._buffer = Buffer.concat([this._buffer, chunk]);
    }

    while (this._cursor < this._buffer.length) {
        //read the tag infromation - if no tag break and wait for the next data
        if (this._state === STATE_TAG && !this.readTag()) {
            break;
        }
        //read the size - if no size - wait for the next data
        if (this._state === STATE_SIZE && !this.readSize()) {
            break;
        }
        //reads the content and emit the event for the event loops
        if (this._state === STATE_CONTENT && !this.readContent()) {
            break;
        }
    }

    done();
};
//for 
EbmlDecoder.prototype.getSchemaInfo = function (tagStr) {

    //retrun the lookup infromations from shema.js - if no exist return "unknown"
    return this._schema[tagStr] || {
        "type": "unknown",
        "name": "unknown"
    };
};

EbmlDecoder.prototype.readTag = function () {

    //console.log('parsing tag');

    if (this._cursor >= this._buffer.length) {
        //console.log('waiting for more data');
        return false;
    }

    var start = this._total;
    //Get the complete tag
    var tag = getLength(this._buffer, this._cursor);
 
    //retrurn if tag cant detected
    if (tag == null) {
        //console.log('waiting for more data');
        return false;
    }

    //get the tag in hex
    var tagStr = this._buffer.toString('hex', this._cursor, this._cursor + tag.length);

    //set global vars
    this._cursor += tag.length;
    this._total += tag.length;
    this._state = STATE_SIZE;

    //generate tag Object with lookup in schema database (schema.js)
    tagObj = {
        tag: tag.value,
        tagStr: tagStr,
        type: this.getSchemaInfo(tagStr).type,
        name: this.getSchemaInfo(tagStr).name,
        start: start,
        end: start + tag.length
    };
    //if (tagObj.tag != 35) { console.log(tagObj); }
    //push the tag object to the tag_stack
    this._tag_stack.push(tagObj);
    //console.log('read tag: ' + tagStr);

    return true;
};

EbmlDecoder.prototype.readSize = function () {

    var tagObj = this._tag_stack[this._tag_stack.length - 1];

    //console.log('parsing size for tag: ' + tagObj.tag.toString(16));

    if (this._cursor >= this._buffer.length) {
        //console.log('waiting for more data');
        return false;
    }


    var size = getLength(this._buffer, this._cursor);

    if (size == null) {
        //console.log('waiting for more data');
        return false;
    }

    this._cursor += size.length;
    this._total += size.length;
    this._state = STATE_CONTENT;
    tagObj.dataSize = size.value;
    tagObj.end += size.value + size.length;

    //console.log('read size: ' + size.value);

    return true;
};

EbmlDecoder.prototype.readContent = function () {

    var tagObj = this._tag_stack[this._tag_stack.length - 1];

    //console.log('parsing content for tag: ' + tagObj.tag.toString(16));

    //
    if (tagObj.type === 'm') {
        //console.log('content should be tags');
        this.emit(tagObj.name, tagObj);
        this._state = STATE_TAG;
        return true;
    }

    if (this._buffer.length < this._cursor + tagObj.dataSize) {
       // console.log('got: ' + this._buffer.length);
       // console.log('need: ' + (this._cursor + tagObj.dataSize));
       // console.log('waiting for more data');
        return false;
    }

    //safe all data to vars
    var data = this._buffer.slice(this._cursor, this._cursor + tagObj.dataSize);
    this._total += tagObj.dataSize;
    this._state = STATE_TAG;
    this._buffer = this._buffer.slice(this._cursor + tagObj.dataSize);
    this._cursor = 0;

    this._tag_stack.pop(); // remove the object from the stack

    //call event
    tagObj.data = data;
    this.emit(tagObj.name, tagObj); //emits all tags --> if ?

    while (this._tag_stack.length > 0) {
        var topEle = this._tag_stack[this._tag_stack.length - 1];
        //iterate to the end
        if (this._total < topEle.end) {
            break;
        }
        //emit at the end
        this.emit(topEle.name + ':end', topEle);
        this._tag_stack.pop();
    }
    //console.log('read data: ' + data.toString('hex'));
    return true;
};

    //no prototype - inclass only

getLength = function (buffer, start) {
        //init with 0 if not defined
        start = start || 0;

        //iterate trought the buffer an check if data is 0 or 1, if 1 breaks
        for (var length = 1; length <= 8; length++) {
            if (buffer[start] >= Math.pow(2, 8 - length)) {
                break;
            }
        }
        //if the data length > 8 - can not be a tag
        if (length > 8) {
            console.log("Unrepresentable length: " + length + " " + buffer.toString('hex', start, start + length));
            //length = length - 1;
        }
        //if the cursor is longer than the data
        if (start + length > buffer.length) {
            return null;
        }
        //sift over 1 with 8 - length (1,2,4 or 8)
        // -1 to make a 0 at start

        //(1 << (8 - length)) - 1 the 0 at the beginning (127 or 63 ...// 011111 or 001111 ...)
        var value = buffer[start] & (1 << (8 - length)) - 1;


        for (i = 1; i < length; i++) {
            if (i === 7) {
                //if the vaule is over the int-size-limit
                // pow(53) bugfix
                if (value >= Math.pow(2, 53) && buffer[start + 7] > 0) {
                    throw new Error("Unrepresentable value: "+ value+" " + buffer.toString('hex', start, start + length));
                }
            }
            value *= Math.pow(2, 8);
            value += buffer[start + i];
        }
        return {
            length: length,
            value: value
        };
    }

module.exports = EbmlDecoder;