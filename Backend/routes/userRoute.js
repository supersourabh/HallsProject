const express = require("express")
const crypto = require("node:crypto")
const bcrypt = require("bcrypt")
const genURL = require("../utils/imageKitURLGen")
var jwt = require('jsonwebtoken');
const { genToken } = require("../utils/auth");
const sessionCheck = require("../utils/sessionCheck.js");


const user = express.Router()


user.get("/user", (req, res) => {
    const db = req.db;
    //db.query("create table demo (name varchar(20) , phone varchar(12))")
    //db.query("insert into demo values('sourabh' , '6362579248')")
    db.query("select * from bdhalls.users", (err, rows, fields) => {
        if (err) res.send(err)
        else res.send(rows)
    })
    //res.render('html/products');
})

user.get("/login", async (req, res) => {

    res.render('html/login', { redirectUrl: false });

})

user.post("/login?", async (req, res) => {
    try {
        let db = req.db
        if (req.body.mobile && req.body.password) {
            db.query(`select id , first_name ,password, last_name , profile, mobile from bdhalls.users where mobile = ${req.body.mobile};`, (err, result) => {
                if (err) res.render("html/error", { error: err.message, status: err.errno })
                else if (result.length == 0) {
                    res.redirect("/user/signup")
                }
                else {
                    let user = result[0]
                    if (user && bcrypt.compareSync(req.body.password, user.password)) {
                        //redirecting to /
                        //var token = genToken({ id: user.id, mobile: user.mobile })
                        //user['token'] = token;
                        delete user['password']
                       // req.session.user = user;
                        res.render("html/redirect", { url: process.env.DOMAIN_URL, data: user })
                        //res.redirect(url + "?pids=" + req.query.data)

                    } else {
                        res.render("html/error", { error: "incorrect credentials", status: 404 })
                    }
                }
            })
        } else {
            res.render("html/error", { error: "credentials not provided ", status: 400 })
        }

    } catch (error) {

    }
})

user.get("/signup", async (req, res) => {
    res.render('html/signup');
})

user.post("/signup", async (req, res) => {
    try {
        let db = req.db
        let imagekit = req.imageKit
        if (req.body.conform_password == req.body.password && req.body.password.length > 8) {
            let file = req.files;
            let id = crypto.randomUUID()
            let body = req.body
            delete body['conform_password']

            body["id"] = id
            body["password"] = bcrypt.hashSync(body.password, 4)

            if (file) {

                let profile = file.profile
                db.query(`insert into bdhalls.users set ?`, body, async (err, response) => {
                    if (err) {
                        if (err.errno == 1062) res.render("html/error", { error: "Mandatory Fields already exists", status: err.errno })
                        else res.render("html/error", { error: err.message, status: err.errno })
                    }
                    else {
                        await imagekit.upload({
                            file: profile.data, //required
                            fileName: id + "@" + profile.name,
                            folder: "/user-profiles/",
                            extensions: [
                                {
                                    name: "google-auto-tagging",
                                    maxTags: 5,
                                    minConfidence: 95
                                }
                            ] //required
                        }, (error, result) => {
                            if (error) res.send("error" + error)
                            else {
                                let reslt = result
                                let url = reslt.url
                                let genUrl = genURL.genUrlFromLink(url, imagekit)
                                db.query(`update bdhalls.users set profile = '${genUrl}' where id='${id}';`, (err, response) => {
                                    if (err) console.log(err);
                                    else { res.redirect("/user/login") }
                                })
                            }
                        })
                    }
                })
            } else {
                body["profile"] = ""
                db.query(`insert into bdhalls.users set ?`, req.body, (err, result) => {
                    if (err) {
                        if (err.errno == 1062) res.render("html/error", { error: "Mandatory Fields already exists", status: err.errno })
                        else res.render("html/error", { error: err.message, status: err.errno })
                    }
                    else {
                        res.redirect("/user/login")
                    }

                })
            }

        } else {
            res.render("html/error", { error: "Password mismatch", status: 400 })
        }
    } catch (error) {
        res.render("html/error", { error: error.message, status: 500 })
    }
})


user.get("/profile?", (req, res) => {
    try {
        let id = req.query.id
        console.log(id);
        req.db.query(`select * from bdhalls.users where id=?`, id, (err, user) => {
            if (err) res.render("html/error", { error: err.message, status: err.errno })
            else {
                let fetchedUser = user[0]
                res.render("html/profile", { user: fetchedUser })
            }
        })
    } catch (error) {
        res.render("html/error", { error: error.message, status: 500 })
    }
})


user.get("/?", async (req, res) => {
    try {
        let token = req.query.t
        //let done = jwt.verify(token, process.env.JWT_SECRET)
        var decoded = jwt.decode(token);
        res.send(decoded)
    } catch (error) {
        res.status(404).send(error)
    }

})
module.exports = user;