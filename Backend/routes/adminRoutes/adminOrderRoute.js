const adminOrders = require('express').Router()

adminOrders.get("/", (req, res) => {
    let db = req.db
    db.query('select admin from bdhalls.users where id= ?', [req.query.id], (err, user) => {
        if (err) res.send(err)
        else {
            if (user.length > 0 && user[0].admin) {
                let other = ''
                let orderId = req.query.orderId
                let outletId = req.query.outletId
                let status = req.query.status

                if (orderId) other += 'and ord.id=' + db.escape(orderId)
                if (outletId) other += 'and ord.outletId=' + db.escape(outletId)
                if (status) other += 'and ord.status=' + db.escape(status)

                console.log('other = ' + other);

                db.query(`
                select user.first_name , user.last_name,  user.mobile, ord.id, ord.outletId,  ord.price, s.slottime, s.date as attend_date, ord.status
                from bdhalls.order ord inner join bdhalls.users user on ord.userId = user.id 
                inner join bdhalls.slots s where s.orderId = ord.id ${other} order by ord.date desc;`,
                    (err, result) => {
                        console.log(result);
                        if (err) res.render("html/error", { error: err.message, status: err.errno })
                        else {
                            let orders = result
                            res.render("html/admin/orders", { orders: orders })
                        }
                    })
            } else {
                res.render("html/error", { error: "You are not an ADMIN", status: 404 })
            }
        }
    })
})

adminOrders.get("/:id/delete/:user", (req, res) => {
    try {
        if (req.params.id != 'null' && req.params.user != 'null') {
            let db = req.db
            db.query('select admin from bdhalls.users where id= ?', [req.params.user], (err, response) => {
                if (err) res.send({ status: err.message, code: err.errno })
                else {
                    if (response.length > 0 && response[0].admin) {
                        db.query(`delete from bdhalls.order where id=?`, [req.params.id], (err, orders) => {
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


module.exports = adminOrders