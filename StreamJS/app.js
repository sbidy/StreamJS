
    //get decoder ready
    var ebml = require("./lib/ebml.js");
    var colors = require("colors");

    //Client Array -- typ Client
    var clients = [];
    //Buffer
    var headBuffer = null;
    var clusterBuffer = [];
    var cluster = new Buffer(0);
    var temp_cluster_buffer = new Buffer(0);
    //Flags
    var cluster_found = false;
    var track_found = false;
    //vars
    var total_length = 0;
    var cluster_lenght = 0;
    var id = 0;
    var clinet = null;

    //Incomming
    //HTTP
    var streamServer = require("http").createServer(function (req, res) {
        console.log("Stream-Connected - http".green);
        
        req.on("data", function (data) {
            
            if (headBuffer == null) headBuffer = new Buffer(0); //Workaround - concat can not added to null
            //Check if Meta is allready sending
            if (!track_found) {
                checkDataForIdent(data);
                headBuffer = Buffer.concat([headBuffer, data]);
                console.log("Daten an Track-Buffer - done".green);
                temp_cluster_buffer = headBuffer.slice(total_length, headBuffer.length); //Rest der Daten verwerten
                headBuffer = headBuffer.slice(0, total_length); //Head separieren
            }
            
            else {
                getClusterData(data);
                //sentData();
                if (clusterBuffer.length && clients.length) {
                    broadcast(clusterBuffer[0]);
                    console.log("Data sent ".magenta + clusterBuffer[0].length + " byte");
                    clusterBuffer.splice(0, 1);
                }
            }
        });

        res.on('close', function () {
            console.log("Stream-Client disconnected".red);
            headBuffer = null;
            for(var i=0;i<clusterBuffer.length;i++)
            {
                console.log("Pusch from stack to client - on stack:".blue + (clusterBuffer.length-i));
                broadcast(clusterBuffer[i]);
                if (i == clusterBuffer.length) {
                    clients = [];
                    clusterBuffer = [];
                }
            }
            
            cluster = new Buffer(0);
            total_length = 0;
            cluster_lenght = 0;
        });
    });
    streamServer.listen("8081");


    //Outgoing http server for broadcast
    var httpServer = require("http").createServer(function (req, res) {

        //
        res.writeHead(200, {
            "Content-Type": "video/webm", //set the typ
            "Transfer-Encoding": "chunked", //not needed only for documetation- default
        });

         console.log("Client connected".green);
         var client = new ebml.client(res);
         client.setFlag(0);
         client.setID(id);
         id++;
         clients.push(client);
         
        //delete client if connection is close
        res.on('close', function () {
            console.log("Client disconnected".red);
            clients.splice(client.getID(), 1); //get the client ID
            client.setFlag(0);
        });
    });
    httpServer.listen("8080");

    console.log("in -> HTTP: 8081 /// out <- HTTP: 8080");

    function sentData() {
        while (clients.length > 0) {
            
            if (clusterBuffer.length > 0) {
                broadcast(clusterBuffer[0]);
                console.log("Data sent ".magenta + clusterBuffer[0].length + " byte");
                clusterBuffer.splice(0, 1);
            }
            else {
                break;
            }
            //broadcast(data);
        }
    }

    //BroadCastfuntcion
    function broadcast(data) {
        clients.forEach(function (client) {
            if (client.getFlag() == 0) {
                client.getResponse().write(headBuffer); //broadcast the header to the client
                console.log("Head sent".yellow + headBuffer.length + " byte");
                client.setFlag(1);
            }
           else {
                client.getResponse().write(data); //write the normal data to the client
            }
        });
    }
    
    //Check Data
    function checkDataForIdent(data) {

        var decoder = new ebml.decoder(); //init the decoder.js

        //Event if Tacks-Element end reached
        decoder.on('Tracks:end', function (data) {
            track_found = true;
            total_length = decoder.getTotalLenght();
            return;
        });
        //event if Cluster-Element end reached
        decoder.on('Cluster:end', function (data) {
            //get the length of the cluster
            cluster_lenght = data.end;
            cluster_found = true;
            return;
        });

        //write data to the decoder.write function
        decoder.write(data);
    }
   
    function getClusterData(data) {
        
        checkDataForIdent(data);

        /*if (cluster_found) {
            console.log("Cluster length:" + cluster_lenght);
            console.log("Clusterstack length: " + cluster.length);
            temp_cluster_buffer = cluster.slice(cluster_lenght, cluster.length);
            cluster = cluster.slice(0, cluster_lenght);
            clusterBuffer.push(cluster);
            console.log("Datan at cluster_buffer " + clusterBuffer.length);
            cluster = temp_cluster_buffer;
            cluster_found = false;
        }
        else {*/
            //temp_cluster_buffer = cluster.slice(clusterBuffer.lenghtdata.length);
            /*if (temp_cluster_buffer.length > 0) {
                console.log("add rest to the cluster");
                Buffer.concat([cluster, temp_cluster_buffer]);
            }*/
            //cluster = Buffer.concat([cluster, data]);
            
            //temp_cluster_buffer = cluster.slice(cluster_lenght, cluster.length);
            //cluster = cluster.slice(0, cluster_lenght);
            clusterBuffer.push(data);
            console.log("Add data to cluster_buffer : " + data.length + " byte");
            console.log("Datan at cluster_buffer ".yellow + clusterBuffer.length + " byte");
            cluster = 0;
         }