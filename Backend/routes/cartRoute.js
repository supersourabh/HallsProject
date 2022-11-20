const { json } = require("body-parser");
const express = require("express");
const sessionCheck = require("../utils/sessionCheck");

const cart = express.Router()



cart.get("/", sessionCheck, (req, res) => {
    try {

        const cakeId = req.query.cake;
        const hatId = req.query.hat;
        const propzId = req.query.propz;
        let db = req.db;
        let query = `select * from bdhalls.product where id="${cakeId}"; select * from bdhalls.product where id="${hatId}"; select * from bdhalls.product where id="${propzId}";`;
        db.query(query, (err, result) => {
            if (err) res.render("html/error", { error: err.message, status: err.errno })
            else {

                let service_cost = parseFloat(process.env.SERVICE_COST);
                let tax = parseFloat((service_cost * parseFloat(process.env.TAX)) / 100);
                const [cake, hat, propz] = result;

                let sumTotal = (cake.length > 0 ? cake[0].price : 0) + (hat.length > 0 ? hat[0].price : 0) + (propz.length > 0 ? propz[0].price : 0);
                let itemTax = sumTotal * (15 / 100);
                tax += itemTax;
                let total = parseFloat(sumTotal + service_cost + tax);

                res.render('html/cart', {
                    cake: cake, hat: hat, propz: propz, sumTotal: sumTotal.toFixed(2),
                    service_cost: service_cost.toFixed(2), tax: tax.toFixed(2), total: total.toFixed(2), cakeId: cakeId, hatId: hatId, propzId: propzId
                });
            }
        })
    } catch (err) {
        res.render("html/error", { error: err.message, status: err.errno })
    }
})

module.exports = cart;