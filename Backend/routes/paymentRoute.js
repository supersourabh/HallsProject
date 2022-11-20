const express = require("express")
const payment = express.Router();
const Razorpay = require('razorpay')
const crypto = require("crypto")
require('dotenv').config()
const formatDate = require("date-and-time");
const sessionCheck = require("../utils/sessionCheck");
const now = new Date();
const dateAndTime = formatDate.format(now, 'YYYY/MM/DD HH:mm:ss');
const date = formatDate.format(now, 'YYYY/MM/DD');
const time = formatDate.format(now, 'HH:mm:ss');

let statesCode =
{
    "AN": "Andaman and Nicobar Islands",
    "AP": "Andhra Pradesh",
    "AR": "Arunachal Pradesh",
    "AS": "Assam",
    "BR": "Bihar",
    "CG": "Chandigarh",
    "CH": "Chhattisgarh",
    "DN": "Dadra and Nagar Haveli",
    "DD": "Daman and Diu",
    "DL": "Delhi",
    "GA": "Goa",
    "GJ": "Gujarat",
    "HR": "Haryana",
    "HP": "Himachal Pradesh",
    "JK": "Jammu and Kashmir",
    "JH": "Jharkhand",
    "KA": "Karnataka",
    "KL": "Kerala",
    "LA": "Ladakh",
    "LD": "Lakshadweep",
    "MP": "Madhya Pradesh",
    "MH": "Maharashtra",
    "MN": "Manipur",
    "ML": "Meghalaya",
    "MZ": "Mizoram",
    "NL": "Nagaland",
    "OR": "Odisha",
    "PY": "Puducherry",
    "PB": "Punjab",
    "RJ": "Rajasthan",
    "SK": "Sikkim",
    "TN": "Tamil Nadu",
    "TS": "Telangana",
    "TR": "Tripura",
    "UP": "Uttar Pradesh",
    "UK": "Uttarakhand",
    "WB": "West Bengal"
}


var rzpInstance = new Razorpay({
    key_id: process.env.RZP_KEY_ID,
    key_secret: process.env.RZP_KEY_SECRET,
});


payment.get("/generate?", sessionCheck, async (req, res) => {
    try {
        let uid = req.query.uid
        let itemsIds = req.query.pids;
        let items = itemsIds.split(",")


        let query = `select * from bdhalls.product where id="${items[0]}"; select * from bdhalls.product where id="${items[1]}"; select * from bdhalls.product where id="${items[2]}";`;

        req.db.query(query, (err, result) => {
            if (err) res.render("html/error", { error: err.message, status: err.errno })
            else {
                let service_cost = parseFloat();
                let tax = parseFloat((service_cost * parseFloat(process.env.TAX)) / 100);
                const [cake, hat, propz] = result;

                let sumTotal = (cake.length > 0 ? cake[0].price : 0) + (hat.length > 0 ? hat[0].price : 0) + (propz.length > 0 ? propz[0].price : 0);
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
                        req.db.query('select distinct(state) from bdhalls.outlets order by state;', (err, result) => {
                            res.render("html/payment", { order: order, states: result, products: itemsIds })
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
        req.db.query(`select city from bdhalls.outlets where state = '${state}'`, (err, cities) => {
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
        req.db.query(`select place,outletId from bdhalls.outlets where state='${state}' and city = '${city}'`, (err, places) => {
            if (err) res.send({ error: err.message, status: err.errno })
            else if (places.length == 0) res.send({ error: `Places Not found for state=${state} and city=${city}, please check`, status: 404 })
            else {
                console.log(places);
                res.send({ state: state, city: city, places: places })
            }
        })
    } catch (error) {
        res.send({ error: error.message, status: error.status })
    }
})

const slots = [
    "9:00-9:45AM", "10:00-10:45AM", "11:00-11:45AM", "12:00-12:45PM",
    "02:00-02:45PM", "03:00-03:45PM", "04:00-04:45PM", "05:00-05:45PM", "06:00-06:45PM",
]

payment.get('/address/date?', (req, res) => {

    try {
        const state = req.query.state
        const city = req.query.city
        const place = (req.query.placeOid).split(" ")[0];
        const outletId = (req.query.placeOid).split(" ")[1];
        const clientDate = req.query.date

        const dateFetched = new Date(req.query.date)

        const todayDate = new Date(date)

        if (dateFetched >= todayDate) {

            req.db.query(`select timeslot from bdhalls.slots where outletId = '${outletId}' and date='${clientDate}'`, (err, response) => {
                if (err) res.send({ error: err.message, status: err.errno })
                else {
                    let freshSlots = slots.filter((ele) => {
                        for (let i = 0; i < response.length; i++) {
                            if (response[i].timeslot == ele) return false;
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
        let outletId = req.body.address.place.split(" ")[1]
        let slot = req.body.address.slot
        let slotDate = req.body.address.date
        let productsRaw = req.body.address.products;
        let rzpPayment = req.body.response.razorpay_payment_id;
        let rzpOrder = req.body.response.razorpay_order_id;

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


                db.query(`insert into bdhalls.order values('${oId}', '${userId}' , '${outletId.toString()}','${slot}',${rzpOrderDetails.items[0].amount / 100},'${rzpPayment}' , '${rzpOrder}' , '${productsRaw}' , 'Pending','${slotDate}','${dateAndTime}' )`, (err, result) => {
                    if (err) res.send({ error: err.message, status: err.errno })
                    else {
                        let slotId = crypto.randomUUID()
                        db.query(`insert into bdhalls.slots values('${slotId}' , '${outletId}' , '${date}','${slot}')`, (err, result) => {
                            if (err) res.send({ error: err.message, status: err.statusCode })
                            else {
                                console.log(result);
                                res.send({ status: 200, url: "/payment/success?orderId=" + oId })
                            }
                        })
                    }
                })
            } else {
                res.status(500).send({ status: 500, url: "/error" })
            }
        } else {
            res.send({ status: 200, url: "/user/login" })
        }



    } catch (err) {
        res.render("html/error", { error: err.message, status: err.status })
    }
})


payment.get("/success?", (req, res) => {

    res.render("html/paymentSuccess", { redirectingUrl: process.env.DOMAIN_URL + "order/orderDetails?orderId=" + req.query.orderId })
})

module.exports = payment;
