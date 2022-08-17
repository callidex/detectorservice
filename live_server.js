require("rootpath")();
const express = require("express");
const router = express.Router();
const config = require("./config.json");
const math = require("math");
const secure = require("./secure.json");
const { Client } = require('pg');
const dgram = require("dgram");
const server = dgram.createSocket('udp4');

const relay = dgram.createSocket('udp4');



server.on('error', (err) => {
  console.log(`server error:\n${err.stack}`);
  server.close();
});

server.on('message', (msg, rinfo) => {


   relay.send(msg,5000, 'gate.wzone.co.uk', (err) => 
   {
//client.close();
});

  const data = Buffer.from(msg);
  console.log(data.length);
  var packetNumber = data.readInt32LE(0) & 0xFFFFFF;
  var tempObject = new Object;
  if (data[3] == 0) {
    console.log("Sample packet incoming");
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
  else if (data[3] == 1 || data[3] == 2) {

    console.log(`Status packet incoming ${data[3]}  len = ${data.length}`);
    tempObject.type = data[3];
    tempObject.ITOW = data.readUInt32LE(4);
    tempObject.year = data.readUInt16LE(8);
    tempObject.month = data[10];    // doc + 4
    tempObject.day =  data[11];
    tempObject.hour = data[12];
    tempObject.min = data[13];
    tempObject.sec =  data[14];
    tempObject.valid = data[15];
    tempObject.flags = data[25];
    tempObject.lon = data.readInt32LE(28);
    tempObject.lat = data.readInt32LE(32);
    tempObject.height = data.readInt32LE(36);
    tempObject.abovesealevel = data.readInt32LE(40);
    tempObject.clocktrim = data.readUInt32LE(88);
    tempObject.detectoruid = data.readUInt16LE(92) & 0xFFF;
    tempObject.packetssent = data.readUInt16LE(94);

    tempObject.triggeroffset = data.readUInt16LE(96) & 0xFFF;
    tempObject.adcbase = data.readUInt16LE(98) & 0xFFF;
    tempObject.triggernoise = 0;
    tempObject.sysuptime = data.readUInt32LE(100);
    tempObject.netuptime = data.readUInt32LE(104);
    tempObject.gpsuptime = data.readUInt32LE(108);
    tempObject.majorversion = data[112];
    tempObject.minorversion = data[113];
    tempObject.avgadcnoise = data.readUInt16LE(118);
    tempObject.batchid = data[120];

    tempObject.address = rinfo.address;

    tempObject.temppress = data.readUInt32LE(136);
    tempObject.pressure = data.readUInt32LE(136) & 0xFFFFF;
    tempObject.temp = data.readUInt32LE(136) & 0xFFFFF00000;

    tempObject.epoch = data.readUInt32LE(140);
    tempObject.telltale = data.readUInt32LE(152);
    if (tempObject.detectoruid > 1000) {
      console.log("incorrect status, dropping");
      return null;
    }
  console.log(data);
    console.log(tempObject);

    storeStatus(tempObject);

  }

  console.log(`server got msg from ${rinfo.address}:${rinfo.port}`);
});

server.on('listening', () => {
  const address = server.address();
  console.log(`server listening ${address.address}:${address.port}`);
});

server.bind(5000);

const { Pool } = require('pg');
const { smoothed_z_score } = require("./smooth");
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

async function storeStatus(parsedObject) {
  const client = await pool.connect();
  try {
    var sql = "insert into status (address, avgadcnoise, batchid, clocktrim, detectoruid,majorversion, minorversion, netuptime,  packettype, sysuptime, triggernoise, triggeroffset, lon,lat,abovesealevel,adcbase,epoch,temp, pressure)" +
      "VALUES ('" + parsedObject.address + "'," + parsedObject.avgadcnoise
      + "," + parsedObject.batchid + ","
      + parsedObject.clocktrim + ","
      + parsedObject.detectoruid + ","
      + parsedObject.majorversion + ","
      + parsedObject.minorversion + ","
      + parsedObject.netuptime + ","
      + parsedObject.packetssent + ","
      + parsedObject.sysuptime + ","
      + parsedObject.triggernoise + ","
      + parsedObject.triggeroffset + ","
      + parsedObject.lon + ","
      + parsedObject.lat + ","
      + parsedObject.abovesealevel +","
      + parsedObject.adcbase  + ","
      + parsedObject.epoch  + ","
      + parsedObject.temp + ","
      + parsedObject.pressure 
+ ")";
    //    + parsedObject.packetnumber + ","
    //    + parsedObject.packettype + ","
    //   + parsedObject.received + ","


    await client.query(sql);
  }
  catch (err) {
    console.log(err.stack)
    console.log(sql);
  }

  finally {
    client.release();
  }
}

async function storeSample(tempObject) {
  const client = await pool.connect();
  try {
    console.log(tempObject.detector);
    var smoothed = smoothed_z_score(tempObject.data);
    await client.query("INSERT INTO sample (detector, data, dmatime, batchid,rtsecs,adcseq,smoothed) VALUES ($1, $2, $3, $4, $5, $6, $7)", [tempObject.detector, tempObject.data, tempObject.dmatime, tempObject.batchid, tempObject.rtsecs, tempObject.adcseq, smoothed]);



  }
  catch (err) { console.log(err.stack) }

  finally {
    client.release();
  }
}









