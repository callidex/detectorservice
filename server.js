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
    console.log("Status packet incoming");
    tempObject.clocktrim = data.readUInt32LE(88);
    tempObject.detectoruid = data.readUInt32LE(92) & 0x3FFFF;
    tempObject.packetssent = data.readUInt32LE(96);
    tempObject.triggeroffset = data.readUInt16LE(100);
    tempObject.triggernoise = data.readUInt16LE(102);
    tempObject.sysuptime = data.readUInt32LE(104);
    tempObject.netuptime = data.readUInt32LE(108);
    tempObject.gpsuptime = data.readUInt32LE(112);
    tempObject.majorversion = data[116];
    tempObject.minorversion = data[117];
    tempObject.avgadcnoise = data.readUInt16LE(118);
    tempObject.batchid = data[120];
    tempObject.address = rinfo.address;

    if (tempObject.detectoruid > 1000) {
      console.log("incorrect status, dropping");
      console.log("server got msg from ${data.readUInt32LE(92) & 0x3FFFF}:${data.readUInt32LE(92)}");
      return null;
    }

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
    var sql = "insert into status (address, avgadcnoise, batchid, clocktrim, detectoruid,majorversion, minorversion, netuptime,  packettype, sysuptime, triggernoise, triggeroffset)" +
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
      + parsedObject.triggeroffset + ")";
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
    await client.query("INSERT INTO sample (detector, data, dmatime, batchid,rtsecs,adcseq) VALUES ($1, $2, $3, $4, $5, $6)", [tempObject.detector, tempObject.data, tempObject.dmatime, tempObject.batchid, tempObject.rtsecs, tempObject.adcseq]);

  }
  catch (err) { console.log(err.stack) }

  finally {
    client.release();
  }
}









