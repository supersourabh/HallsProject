const express = require("express")
const { randomUUID, randomBytes } = require("node:crypto")
const dbConfig = express.Router()


dbConfig.get("/bdhalls/createdb/mysql", (req, res) => {
    const db = req.db;
    // genURL("photo.jpg" , "product-images", imageKit)
    db.query("create database BDHALLS;", (err, data, fields) => {
        if (err) res.send(err);
        else res.send(data)
    })
})

dbConfig.get("/bdhalls/createAllTables/mysql", (req, res) => {
    const db = req.db;
    db.query(`
    create table bdhalls.USERS  (
        id varchar(50) not null unique primary key,
        first_name varchar(50) not null,
        last_name varchar(50) not null,
        mobile varchar(12) not null unique,
        email varchar(30) not null unique,
        isBirthdayMan bool not null,
        country varchar(50) not null,
        state varchar(50) not null,
        city varchar(12) not null unique,
        address varchar(30) not null unique,
        profile varchar(100) not null
        )
    `, (err, data, fields) => {
        if (err) res.send(err);
        else res.send(data)
    })

    db.query(`
    create table bdhalls.PRODUCT(
        id varchar(50) not null unique primary key,
        creater_id varchar(50) not null ,
        name varchar(50) not null,
        discription varchar(50) not null,
        catagory varchar(50) not null,
        status bool not null ,
        stock_units int not null default '10',
        price float not null,
        discount int not null default '10',
        image varchar(200) not null,
        foreign key(creater_id) references USERS(id)
        )
    `, (err, data, fields) => {
        if (err) res.send(err);
        else res.send(data)
    })
})

dbConfig.get("/uuid", (req, res) => {
    const db = req.db;
    const uid = randomUUID().toString("hex")
    console.log(uid);
    res.send(uid)
})






module.exports = dbConfig;