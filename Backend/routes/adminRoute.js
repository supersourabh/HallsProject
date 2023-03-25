const adminOrders = require('./adminRoutes/adminOrderRoute')
const adminOutlets = require('./adminRoutes/adminOutletsRoute')
const adminProducts = require('./adminRoutes/adminProductsRoute')
const adminUsers = require('./adminRoutes/adminUserRoute')

const admin = require('express').Router()


admin.get("/dashboard", (req, res) => {
    if (req.query.id) {
        let db = req.db
        db.query('select admin from bdhalls.users where id= ?', [req.query.id], (err, user) => {
            if (err) res.render('html/error', { error: err.message, status: err.errno })
            else if (user.length > 0 && user[0].admin) {
                res.redirect("/admin/analytics?id=" + req.query.id)
            } else {
                res.render('html/error', { error: "Unauthorized", status: 404 })
            }
        })
    }
    else {
        res.render('/html/error', { error: 'Unauthorized', status: 404 })
    }
})
admin.get("/analytics", (req, res) => {
    if (req.query.id) {
        let db = req.db
        db.query('select admin from bdhalls.users where id= ?', [req.query.id], (err, user) => {
            if (err) res.render('html/error', { error: err.message, status: err.errno })
            else if (user.length > 0 && user[0].admin) {
                res.render("html/admin/dashboard")
            } else {
                res.render('html/error', { error: "Unauthorized", status: 404 })
            }
        })
    } else {
        res.render('/html/error', { error: 'Unauthorized', status: 404 })
    }

})


//user actions

admin.use("/users", adminUsers)

//order functions
admin.use("/orders", adminOrders)

//product actions
admin.use("/products", adminProducts)

//outlets actions
admin.use("/outlets", adminOutlets)


module.exports = admin