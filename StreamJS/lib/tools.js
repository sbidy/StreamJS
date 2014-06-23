﻿//from Mark Schmale
// edited


    //todo --> Doku

var tools = {
    readVint: function (buffer, start) {
        start = start || 0;
        for (var length = 1; length <= 8; length++) {
            if (buffer[start] >= Math.pow(2, 8 - length)) {
                break;
            }
        }
        if (length > 8) {
            console.log("Unrepresentable length: " + length + " " + buffer.toString('hex', start, start + length));
            //length = length - 1;
        }
        if (start + length > buffer.length) {
            return null;
        }
  
        var value = buffer[start] & (1 << (8 - length)) - 1;
     
        for (i = 1; i < length; i++) {
            if (i === 7) {
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