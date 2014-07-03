var ID;
var flag;
var response;

// Constructor
function Client(res) {
    this.response = res;
}
Client.prototype.setFlag = function (value) {
    this.flag = value;
};
Client.prototype.setID = function (value) {
    this.ID = value;
};
Client.prototype.getFlag = function () {
    return this.flag;
};
Client.prototype.getResponse = function () {
    return this.response;
};
Client.prototype.getID = function () {
    return this.ID;
};

module.exports = Client;