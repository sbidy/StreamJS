//forked from Mark Schmale - https://github.com/themasch/node-ebml

var tools = {
    readVint: function (buffer, start) {
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
        //
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
    },

    writeVint: function (value) {

        //if 0 or over the 2^53 javascript int limit
        if (value < 0 || value > Math.pow(2, 53)) {
            throw new Error("Unrepresentable value: " + value);
        }
        for (var length = 1; length <= 8; length++) {
            if (value < Math.pow(2, 7 * length)) {
                break;
            }
        }
        var buffer = new Buffer(length);
        for (i = 1; i <= length; i++) {
            var b = value & 0xFF;
            buffer[length - i] = b;
            value -= b;
            value /= Math.pow(2, 8);
        }
        buffer[0] = buffer[0] | (1 << (8 - length));
        return buffer;
    }
};

module.exports = tools;