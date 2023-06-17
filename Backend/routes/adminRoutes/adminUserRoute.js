const adminUsers = require('express').Router()

//user functions
adminUsers.get("/", async (req, res) => {
    if (req.query.id) {
        let db = req.db
        db.query('select admin from bdhalls.users where id= ?', [req.query.id], (err, user) => {
            if (err) res.render('html/error', { error: err.message, status: err.errno })
            else if (user.length > 0 && user[0].admin) {
                db.query('select first_name , last_name , mobile, email , date from bdhalls.users ', (err, users) => {
                    if (err) res.render('html/error', { error: err.message, status: err.errno })
                    else res.render("html/admin/users", { users: users })
                })
            } else {
                res.render('html/error', { error: "Unauthorized", status: 404 })
            }
        })
    } else {
        res.render('/html/error', { error: 'Unauthorized', status: 404 })
    }
})

adminUsers.get("/:id/delete/:user", async (req, res) => {
    try {
        if (req.params.id != 'null' && req.params.user != 'null') {
            let db = req.db
            db.query('select admin from bdhalls.users where id= ?', [req.params.user], (err, response) => {
                if (err) res.send({ status: err.message, code: err.errno })
                else {
                    if (response.length > 0 && response[0].admin) {
                        db.query(`delete from bdhalls.users where mobile=?`, [req.params.id], (err, users) => {
                            if (err) res.send({ status: err.message, code: err.errno })
                            else {
                                res.send({ status: 'success', code: 200 })
                            }
                        })
                    } else {
                        res.send({ status: 'Unauthorized', code: 404 })
                    }
                }
            })
        } else throw new Error('Something went wrong')
    } catch (err) {
        res.send({ status: err.message, code: 500 })

    }
})
adminUsers.post("/adminaction", async (req, res) => {
    try {
        let db = req.db
        db.query('update bdhalls.users set admin = ? where mobile=? or email=?',
            [req.body.admin == 'true' ? 1 : 0, req.body.mobileOrEmail, req.body.mobileOrEmail],
            (err, user) => {
                if (err) res.send({ error: err.message, status: err.errno })
                else if (user.affectedRows > 0) {
                    res.send({ status: 200 })
                } else {
                    res.send({ status: 404, error: "not found" })
                }
            })
    } catch (error) {
        res.send({ error: error.message, status: 500 })
    }
})

adminUsers.post("/search", async (req, res) => {
    try {
        let db = req.db
        db.query('select first_name , last_name , mobile, email , admin from bdhalls.users where mobile=? or email=?', [req.body.mobileOrEmail, req.body.mobileOrEmail], (err, user) => {
            if (err) res.send({ error: err.message, status: err.errno })
            else {
                console.log(req.body);
                res.send(user)
            }
        })
    } catch (error) {
        res.send({ error: error.message, status: 500 })
    }
})

module.exports = adminUsers