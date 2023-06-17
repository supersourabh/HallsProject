const express = require("express")
const payment = express.Router();
const Razorpay = require('razorpay')
const crypto = require("crypto")
require('dotenv').config()
const formatDate = require("date-and-time");
const sessionCheck = require("../utils/sessionCheck");
const session = require("express-session");
const now = new Date();
const dateAndTime = formatDate.format(now, 'YYYY/MM/DD HH:mm:ss');
const date = formatDate.format(now, 'YYYY/MM/DD');
const time = formatDate.format(now, 'HH:mm:ss');


var rzpInstance = new Razorpay({
    key_id: process.env.RZP_KEY_ID,
    key_secret: process.env.RZP_KEY_SECRET,
});


payment.get("/generate?", sessionCheck, async (req, res) => {
    try {
        const uid = req.session.id
        const ids = (req.query.pids).split('|')
        const categories = []
        for (let i in ids) {
            let catg = ids[i].split('_')
            categories.push({ name: catg[0], id: catg[1] })
        }

        let filterIds = []
        categories.filter(e => filterIds.push(e.id ?? null));

        let query = `select p.id , p.name ,c.name as category , p.price , p.thumbnailUrl as image  from bdhalls.product p 
        inner join bdhalls.category c on p.categoryId = c.id where p.id in (?) order by c.name;`
        req.db.query(query, [filterIds], (err, result) => {
            if (err) res.render("html/error", { error: err.message, status: err.errno })
            else {
                let service_cost = parseFloat(process.env.SERVICE_COST);
                let tax = parseFloat((service_cost * parseFloat(process.env.TAX)) / 100);
                let price = 0;
                result.forEach(e => {
                    price += e.price
                });
                let sumTotal = price
                let itemTax = sumTotal * (15 / 100);
                tax += itemTax;
                let total = parseFloat(sumTotal + service_cost + tax);

                //order creation
                let options = {
                    amount: Math.round(total) * 100,
                    currency: "INR",
                    receipt: uid
                }
                rzpInstance.orders.create(options, (err, order) => {
                    if (err) {
                        res.render("html/error", { error: err.message, status: err.errno })
                    }
                    else {
                        req.db.query('select distinct(state) from bdhalls.addressData order by state;', (err, result) => {
                            res.render("html/payment", { order: order, states: result, products: req.query.pids.replaceAll('|', ',') })
                        })
                    }
                })
            }
        })

    } catch (error) {
        res.render("html/error", { error: error.message, status: error.status })
    }
})

payment.get('/address/cities?', (req, res) => {
    const state = req.query.state
    try {
        req.db.query(`select distinct(city) from bdhalls.addressData where state = '${state}' `, (err, cities) => {
            console.log(cities);
            if (err) res.send({ error: err.message, status: err.statusCode })
            else if (cities.length == 0) res.send({ error: "Cities Not found ", status: 404 })
            else {
                res.send({ state: state, cities: cities })
            }
        })
    } catch (error) {
        res.send({ error: error.message, status: error.status })
    }
})


payment.get('/address/places?', (req, res) => {

    try {
        const state = req.query.state
        const city = req.query.city
        req.db.query(`select place from bdhalls.addressData where state='${state}' and city = '${city}';`, (err, places) => {
            console.log(places);
            if (err) res.send({ error: err.message, status: err.errno })
            else if (places.length == 0) res.send({ error: `Places Not found for state=${state} and city=${city}, please check`, status: 404 })
            else {
                res.send({ state: state, city: city, places: places })
            }
        })
    } catch (error) {
        res.send({ error: error.message, status: error.status })
    }
})

payment.get('/address/outlets?', (req, res) => {

    try {
        const state = req.query.state
        const city = req.query.city
        const place = req.query.place
        req.db.query(`select o.name as name, o.id as id from bdhalls.outlets o inner join bdhalls.addressData a on a.id = o.addressId where a.state='${state}' and a.city = '${city}' and a.place = '${place}' and o.isActive = 1 `,
            (err, outlets) => {
                if (err) res.send({ error: err.message, status: err.errno })
                else if (outlets.length == 0) res.send({ error: `outlets Not found / Inactive for state=${state} and city=${city}`, status: 404 })
                else {
                    res.send({ state: state, city: city, place: place, outlets: outlets })
                }
            })
    } catch (error) {
        res.send({ error: error.message, status: error.status })
    }
})

const slots = [
    "9:00AM-9:45AM", "10:00AM-10:45AM", "11:00AM-11:45AM", "12:00PM-12:45PM",
    "02:00PM-02:45PM", "03:00PM-03:45PM", "04:00PM-04:45PM", "05:00PM-05:45PM", "06:00PM-06:45PM",
]

payment.get('/address/date?', (req, res) => {

    try {
        const state = req.query.state
        const city = req.query.city
        const place = (req.query.place)
        const outletId = (req.query.outletId)
        const clientDate = req.query.date

        const dateFetched = new Date(req.query.date)

        const todayDate = new Date(date)

        if (dateFetched >= todayDate) {

            req.db.query(`select slottime from bdhalls.slots where outletId = '${outletId}' and date='${clientDate}' `, (err, response) => {
                // console.log(response, outletId, clientDate, time);
                if (err) res.send({ error: err.message, status: err.errno })
                else {
                    let freshSlots = slots.filter((ele) => {
                        for (let i = 0; i < response.length; i++) {
                            let isAvailTime = (ele.split('-')[0])
                            isAvailTime = isAvailTime.substring(isAvailTime.length - 3)
                            if (response[i].slottime == ele && time > isAvailTime) return false;
                        }
                        return true;
                    })

                    res.send({ state: state, city: city, place: place, date: date, slots: freshSlots })
                }
            })
        } else {
            res.send({ error: "date is invalid, please check", status: 400 })
        }
    } catch (error) {
        res.send({ error: error.message, status: error.status })
    }
})


payment.get('/address/slot', (req, res) => {

    try {
        if (req.session.user && req.cookies.halls_user_auth) {
            res.status(200).send({ status: 200, message: "ok" })
        } else {
            res.send({ status: 404, message: "Session expired (Unauthorized)" })
        }
    } catch (error) {
        res.send({ error: error.message, status: error.status })
    }
})


payment.post("/verify/signiture", async (req, res) => {
    try {
        let userId = req.body.address.userId;
        let outletId = req.body.address.outletId
        let slot = req.body.address.slot
        let slotDate = req.body.address.date
        let productsRaw = req.body.address.products;
        let productIds = productsRaw.split(',')
        let rzpPayment = req.body.response.razorpay_payment_id;
        let rzpOrder = req.body.response.razorpay_order_id;

        console.log(req.body);

        let productOnlyIds = ['123']
        productIds.forEach(e => {
            productOnlyIds.push(e.split('_')[1])
        });

        let db = req.db
        if (req.session.user && req.cookies.halls_user_auth) {
            //razorpay payment
            let body = req.body.response.razorpay_order_id + "|" + req.body.response.razorpay_payment_id;

            var expectedSignature = crypto.createHmac('sha256', process.env.RZP_KEY_SECRET)
                .update(body.toString())
                .digest('hex');


            if (expectedSignature === req.body.response.razorpay_signature && slots.includes(req.body.address.slot)) {

                let oId = crypto.randomUUID()

                let rzpOrderDetails = await rzpInstance.orders.fetchPayments(req.body.response.razorpay_order_id)
                // res.send(rzpOrderDetails)

                //slot update
                let slotId = crypto.randomUUID()


                db.query(`insert into bdhalls.order set ?; 
                 update bdhalls.product set status = if(status = true and stock_units = 1 ,false , true) , stock_units= if(status = true and stock_units > 1 , stock_units-1, 0)
                  where id in (?)`,
                    [{
                        id: oId, userId: userId, outletId: outletId, price: rzpOrderDetails.items[0].amount / 100,
                        rzpPaymentId: rzpPayment, rzpOrderId: rzpOrder, status: 'Pending', selectedProductsIds: productsRaw
                    }, productOnlyIds], (err, result, fields) => {
                        console.log(db.escape(productOnlyIds));
                        console.log(result, fields, err);
                        if (err) { res.send({ error: err.message, status: err.errno }) }
                        else {
                            db.query(`insert into bdhalls.slots set ? ; `, { id: slotId, orderId: oId, outletId: outletId, date: slotDate, slottime: slot }, (err, result) => {
                                if (err) res.send({ error: err.message, status: err.statusCode })
                                else {
                                    res.send({ status: 200, url: "/payment/success?orderId=" + oId })
                                }
                            })
                        }
                    })
            } else {
                res.status(500).send({ status: 500, errorMessage: "Unauthorized" })
            }
        } else {
            res.send({ status: 200, url: "/user/login" })
        }



    } catch (err) {
        res.status(500).send({ status: err.status, errorMessage: err.message })
        // res.render("html/error", { error: err.message, status: err.status })
    }
})


payment.get("/success?", (req, res) => {

    res.render("html/paymentSuccess", { redirectingUrl: process.env.DOMAIN_URL + "order/orderDetails?orderId=" + req.query.orderId })
})

module.exports = payment;
