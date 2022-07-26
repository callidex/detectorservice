require("rootpath")();
const express = require("express");
const router = express.Router();
const config = require("./config.json");
const math = require("math");
const secure = require("./secure.json");
const { Client } = require('pg');
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
  var packetNumber = data.readInt32LE(0) & 0xFFFFFF;
  console.log("Packet number ", packetNumber);
  if (data[3] == 0) {
    console.log("Sample packet incoming");
    var tempObject = new Object;
    tempObject.udpnumber = data.readUInt32LE(0);
    tempObject.adcseq = data[4];
    tempObject.detector = data[6];
    tempObject.rtsecs = data.readUInt32LE(7) >> 2;
    tempObject.batchid = data[8];
    console.log("Data packet with batchid ", tempObject.batchid);
    tempObject.dmatime = data.readUInt32LE(12);
    tempObject.data = [];
    for (var i = 0; i < (728 * 2); i = i + 2) {
      tempObject.data.push((data[i + 15] << 8) + data[i + 1 + 15]);
    }
    tempObject.needsprocessing = 1;

    storeSample(tempObject);

  }
  else if (data[3] == 1) {
    console.log("Status packet incoming");

    // don't mess about, store it now
    /*
        var packet = {
          version: "0.1",
          type: "data",
          data: message,
          address: rinfo.address,
          port: rinfo.port,
          timestamp: Date.now(),
          processed: 0,
    
    
        };
    
        storeRawData();
    */

  }

  console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
});

server.on('listening', () => {
  const address = server.address();
  console.log(`server listening ${address.address}:${address.port}`);
});

server.bind(5000);

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

async function storeSample(tempObject) {
  const client = await pool.connect();
  try {
    console.log(tempObject.detector);
    const res = await client.query("INSERT INTO sample (detector) VALUES ($1) RETURNING *",
      values = [tempObject.detector]
    );


  }
  catch (err) { console.log(err.stack) }

  finally {
    client.release();
  }
}





//pool.connect();


//client.connect();
//client.query('SELECT * from sample', (err, res) => { console.log(err.stack)});
//client.query('SELECT * from sample').then(res => console.log(res)).catch(err => console.log(err));
;



// routes
//router.post("/status", status);
//router.post("/strike", strike);





/*
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
*/

