require("rootpath")();
const express = require("express");
const router = express.Router();
const config = require("./config.json");
const secure = require("./secure.json");
const { Client } = require('pg');

//import geohash from 'latlon-geohash';


const dgram = require("dgram");

const server = dgram.createSocket('udp4');

server.on('error', (err) => {
  console.log(`server error:\n${err.stack}`);
  server.close();
});

server.on('message', (msg, rinfo) => {

  const data = Buffer.from(msg);
  console.log(data); 
  console.log(data.length);
  if(data[3] ==1)
{
    console.log("Sample packet incoming");

    
} 

  console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
});

server.on('listening', () => {
  const address = server.address();
  console.log(`server listening ${address.address}:${address.port}`);
});

server.bind(5000);


console.log(secure);
const { Pool } = require('pg');
const pool = new Pool({
          user: config.user,
          host: config.host,
          database: secure.database,
          password: secure.password,
          port: config.port,
          max: 300,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
          });


const client = new Client(
{
          user: config.user,
          host: config.host,
          database: secure.database,
          password: secure.password,
          port: config.port,
          max: 300,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000
});


//pool.connect();


client.connect();
//client.query('SELECT * from sample', (err, res) => { console.log(err.stack)});
client.query('SELECT * from sample').then(res => console.log(res)).catch(err => console.log(err));
;



// routes
//router.post("/status", status);
//router.post("/strike", strike);




        var packet = {
            version: "0.4",
            type: "data",
            data: message,
            address: remote.address,
            port: remote.port,
            timestamp: now,
            processed: 0,
            received: new Date().toString()

        };


var storeDataPacket = function (parsedObject, con, rawpacketid) {
    if (parsedObject.maxval < 4096) {
        if (parsedObject.data != undefined && parsedObject.signal != undefined) {
            var fixeddata = repairendian(parsedObject.data);
            var fixedsignal = repairendian(parsedObject.signal);

            var query = "INSERT INTO `datapackets` SET ?",
                values = {
                    rawpacketid: rawpacketid,
                    adcseq: parsedObject.adcseq,
                    dmatime: parsedObject.dmatime,
                    maxval: parsedObject.maxval,
                    mean: parsedObject.mean,
                    needsprocessing: 1,
                    packetnumber: parsedObject.packetnumber,
                    packettype: parsedObject.packettype,
                    received: parsedObject.received,
                    rtsecs: parsedObject.rtsecs,
                    signaldata: new Buffer(fixedsignal),
                    signalcnt: 0,  //parsedObject.signalcnt,
                    stddev: parsedObject.stddev,
                    udpnumber: parsedObject.udpnumber,
                    variance: parsedObject.variance,
                    version: clean(parsedObject.version),
                    address: parsedObject.address,
                    batchid: parsedObject.batchid,
                    detectoruid: parsedObject.detectoruid,
                    data: new Buffer(fixeddata),
                };
            con.query(query, values, function (er, da) {
                if (er) throw er;
                backfilldatapacketfromstatus(con, parsedObject.batchid, parsedObject.detectoruid);
            });
        }
    }
}


