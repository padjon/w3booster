const fs = require('fs');
let WSServer = require('ws').Server;
let server = require('http').createServer();

// Create web socket server on top of a regular http server
new WSServer({
  server: server
}).on('connection', function connection(ws) {
 console.log("conn")
 ws.send(fs.readFileSync('scenarios/player-2on2.json').toString());
});


server.listen(25082, function() {
    console.log("listening on 25082")
});