
    //get decoder ready
    var ebml = require("./lib/ebml.js");

    //Client Array  --> Später Objekte mit Status !!
    var clients = [];
    //Buffer
    var headBuffer = null;
    var clusterBuffer = [];
    var temp_cluster_buffer = new Buffer(0);
    //Flags
    var cluster_found = false;
    var track_found = false;
    //vars
    var total_length = 0;
    var cluster_lenght = 0;

    //Incomming
    //HTTP
    var streamServer = require("http").createServer(function (request, response) {
        console.log("Connected - http");

        request.on("data", function (data) {
            
            if (headBuffer == null) headBuffer = new Buffer(0); //Workaround - concat can not added to null
            //Check if Meta is allready sending
            if (!track_found) {
                checkDataForIdent(data);
                headBuffer = Buffer.concat([headBuffer, data]);
                console.log("Daten an Track-Buffer - done");
                console.log(total_length);
            }
            else {
                getClusterData(data);
                if (clusterBuffer.length > 1) {
                    broadcast(clusterBuffer.pop());
                }
            }
        });
    });
    streamServer.listen("8082");


    //Outgoing
    var httpServer = require("http").createServer(function (req, res) {

        console.log("Client connected");
        res.writeHead(200, {
            "Content-Type": "video/webm",
            "Transfer-Encoding": "chunked"
        });
        var client = new ebml.client(res)
        clients.push(client);

        res.on('close', function () {
            console.log("Client disconnected");
            clients.splice(clients.indexOf(client), 1);
        });
    });
    httpServer.listen("8084");

    console.log("in -> HTTP: 8082 /// out <- HTTP: 8084");


    //BroadCastfuntkion
    function broadcast(data) {
        clients.forEach(function (client) {

            if (client.getFlag() == 0) {
                temp_cluster_buffer = headBuffer.slice(total_length, headBuffer.length); //Rest der Daten verwerten
                headBuffer = headBuffer.slice(0, total_length); //Head sperieren
                client.getResponse().write(headBuffer); //Head rausschreiben
                console.log("Head gesendet"+ headBuffer.length);
                client.setFlag(1);
            }
            else {
                console.log("sende daten");
                client.getResponse().write(data);
            }
        });
    }
    //Get Buffer lenght
    function getLength(data) {
        var count = 0;
        for (var i = 0; i < data.length ; i++) {
            if (data[i] != null)
                count++;
        }
        return count;
    }
    //Check Data
    function checkDataForIdent(data) {

        var decoder = new ebml.decoder(); //Kann noch raus

        decoder.on('Tracks:end', function (data) {
            track_found = true;
            total_length = decoder.getTotalLenght();
            return;
        });
        decoder.on('Cluster:end', function (data) {
            cluster_found = true;
            cluster_lenght = data.taglang;
            return;
        });
        decoder.write(data);
    }
    
    function getClusterData(data) {

        checkDataForIdent(data);
        var cluster = new Buffer(0);
        if (!cluster_found) {

            if (temp_cluster_buffer.length > 0) {
                cluster = Buffer.concat([cluster,temp_cluster_buffer]);
                temp_cluster_buffer = new Buffer(0);
                console.log("REST-Datan an Clusterbuffer " + cluster.length);
            }
            else {
                cluster = Buffer.concat([cluster, data]);
                console.log("Datan an Clusterbuffer " + cluster.length);
            }
            
        }
        else {
            temp_cluster_buffer = cluster.slice(cluster_lenght,cluster.length); //rest der Clusterdaten vewerten
            cluster = cluster.slice(0, cluster_lenght); // Cluster sparieren
            clusterBuffer.push(cluster); // CLuster auf Stack pushen
            cluster_found = false;
        }
    }