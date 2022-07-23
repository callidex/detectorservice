require("rootpath")();
const express = require("express");
const router = express.Router();
const config = require("./config.json");
const secure = require("./secure.json");
const { Client } = require('pg');

//import geohash from 'latlon-geohash';


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
          database: config.database,
          password: config.password,
          port: config.port,
          max: 300,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000
});
const clien = pool.

pool.connect();


client.connect();
//client.query('SELECT * from sample', (err, res) => { console.log(err.stack)});
client.query('SELECT * from sample').then(res => console.log(res)).catch(err => console.log(err));
;


// routes
//router.post("/status", status);
//router.post("/strike", strike);


