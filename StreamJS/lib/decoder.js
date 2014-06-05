var Writable = require('stream').Writable
  , tools = require('./tools.js')
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

EbmlDecoder.prototype._write = function (chunk, enc, done) {

    if (this._buffer === null) {
        this._buffer = chunk;
    } else {
        this._buffer = Buffer.concat([this._buffer, chunk]);
    }

    while (this._cursor < this._buffer.length) {
        if (this._state === STATE_TAG && !this.readTag()) {
            break;
        }
        if (this._state === STATE_SIZE && !this.readSize()) {
            break;
        }
        if (this._state === STATE_CONTENT && !this.readContent()) {
            break;
        }
    }

    done();
};

EbmlDecoder.prototype.getSchemaInfo = function (tagStr) {
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
    var tag = tools.readVint(this._buffer, this._cursor);
 
    if (tag == null) {
        //console.log('waiting for more data');
        return false;
    }

    var tagStr = this._buffer.toString('hex', this._cursor, this._cursor + tag.length);

    this._cursor += tag.length;
    this._total += tag.length;
    this._state = STATE_SIZE;

    tagObj = {
        tag: tag.value,
        tagStr: tagStr,
        type: this.getSchemaInfo(tagStr).type,
        name: this.getSchemaInfo(tagStr).name,
        start: start,
        end: start + tag.length
    };

    this._tag_stack.push(tagObj);
    console.log('read tag: ' + tagStr);

    return true;
};

EbmlDecoder.prototype.readSize = function () {

    var tagObj = this._tag_stack[this._tag_stack.length - 1];

    //console.log('parsing size for tag: ' + tagObj.tag.toString(16));

    if (this._cursor >= this._buffer.length) {
        //console.log('waiting for more data');
        return false;
    }


    var size = tools.readVint(this._buffer, this._cursor);

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

    var data = this._buffer.slice(this._cursor, this._cursor + tagObj.dataSize);
    this._total += tagObj.dataSize;
    this._state = STATE_TAG;
    this._buffer = this._buffer.slice(this._cursor + tagObj.dataSize);
    this._cursor = 0;

    this._tag_stack.pop(); // remove the object from the stack

    tagObj.data = data;
    this.emit(tagObj.name, tagObj);

    while (this._tag_stack.length > 0) {
        var topEle = this._tag_stack[this._tag_stack.length - 1];
        if (this._total < topEle.end) {
            break;
        }
        this.emit(topEle.name + ':end', topEle);
        this._tag_stack.pop();
    }

    //console.log('read data: ' + data.toString('hex'));
    return true;
};

module.exports = EbmlDecoder;