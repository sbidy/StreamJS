
    //get decoder ready
    var ebml = require("./lib/ebml.js");

    //Client Array -- typ Client
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
                temp_cluster_buffer = headBuffer.slice(total_length, headBuffer.length); //Rest der Daten verwerten
                headBuffer = headBuffer.slice(0, total_length); //Head sperieren
            }
            
            else {
                getClusterData(data);
                if (clusterBuffer.length) {
                    broadcast(clusterBuffer[0]);
                    console.log("Data send " + clusterBuffer[0].length);
                    clusterBuffer.splice(0, 1);
                }
                //broadcast(data);
            }
        });
    });
    streamServer.listen("8082");


    //Outgoing
    var httpServer = require("http").createServer(function (req, res) {


        res.writeHead(200, {
            "Content-Type": "video/webm",
            "Transfer-Encoding": "chunked",
        });

         console.log("Client connected");
         var client = new ebml.client(res);
         clients.push(client);
         client.setID(clients.indexOf(client));
       
                
        res.on('close', function () {
            console.log("Client disconnected");
            clients.splice(client.getID(), 1);
            client.setFlag(0);
        });
    });
    httpServer.listen("8084");

    console.log("in -> HTTP: 8082 /// out <- HTTP: 8084");


    //BroadCastfuntkion
    function broadcast(data) {
        clients.forEach(function (client) {
            
            console.log(total_length);
            if (client.getFlag() == 0) {
                client.getResponse().write(headBuffer); //Head rausschreiben
                console.log("Head gesendet"+ headBuffer.length);
                client.setFlag(1);
            }
           else {
                client.getResponse().write(data);

            }
        });
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
                clusterBuffer.push(Buffer.concat([clusterBuffer, data]));
                console.log("Datan an Clusterbuffer " + clusterBuffer.length);
        }
        else {
           /* temp_cluster_buffer = clusterBuffer.slice(clusterBuffer.lenghtdata.length); //rest der Clusterdaten vewerten
            cluster = cluster.slice(0, cluster_lenght); // Cluster sparieren
            clusterBuffer = Buffer.concat([clusterBuffer,cluster]); // CLuster auf Stack pushen
            console.log("Cluster on Stack");*/
            clusterBuffer = new Buffer(0);
            cluster_found = false;
        }
    }