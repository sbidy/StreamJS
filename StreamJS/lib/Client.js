var flag = 0;
var response;
var ID = 0;

    // Constructor
function Client(res) {
    response = res;
}

Client.prototype.setFlag = function (value) {
    flag = value;
};
Client.prototype.setID = function (value) {
    ID = value;
};
Client.prototype.getFlag = function () {
    return flag;
};
Client.prototype.getResponse = function () {
    return response;
};
Client.prototype.getID = function () {
    return ID;
};

module.exports = Client;