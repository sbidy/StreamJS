var flag = 0;
var response;

    // Constructor
function Client(res) {
    response = res;
}

Client.prototype.setFlag = function (value) {
    flag = value;

};
Client.prototype.getFlag = function () {
    return flag;
};
Client.prototype.getResponse = function () {
    return response;
};

module.exports = Client;