const express = require("express")

const order = express.Router()


order.get("/orderDetails?", async (req, res) => {
    try {
        let db = req.db
        const oId = req.query.orderId
        db.query(`select * from bdhalls.order where id = '${oId}'`, (err, result) => {
            if (err) res.render("html/error", { error: err.message, status: err.errno })
            else {
                let order = result[0]
                if (result.length == 0) res.render("html/error", { error: "order not found", status: 404 })
                else {

                    let productIds = order.productsId.split("+");
                    let error = ""
                    db.query(`select image, name, price from bdhalls.product where id in (?);`, [productIds], (err, products) => {
                        if (err) {
                            error = err.message;
                        }
                        else {
                            let itemTotal = 0;
                            for (let i = 0; i < products.length; i++) itemTotal += products[i].price;
                            //res.send({ order, products, itemTotal })
                            res.render("html/orderDetails", { order: order, products: products, itemTotal: itemTotal })
                        }
                    })
                }

                //res.render("html/orderDetails", { order: order ,})
            }

        })


    } catch (error) {
        return next(e)
    }
})

order.get("/od", (req, res) => {
    let data = {
        "id": "d9522260-48d9-4707-a166-529b2ad9ed07",
        "userId": "c3ee7af2-6138-49a7-b462-d5e0b228ae52",
        "outletId": "1121",
        "slot": "11:00-11:45AM",
        "price": 1036,
        "rzpPaymentId": "pay_Kcoe4RztpxrGf8",
        "rzpOrderId": "order_KcocyqHwnirZ4v",
        "productsId": "c3ee7af2-6138-49a7-b462-d5e0b228ae65+c3ee7af2-6138-49a7-b462-d5e0b228ae70+null",
        "status": "Attended",
        "timestamp": "2022-11-06T16:14:56.000Z",
        "date": "2022-11-06T16:14:56.000Z"
    }
    let products = [
        {
            "image": "https://ik.imagekit.io/bdhalls/default-image.jpg?updatedAt=1665324003777&ik-s=058c557f3ad6e697b08197bb1aa9660059ea18cc",
            "name": "cake-1",
            "price": 100.5
        },
        {
            "image": "https://ik.imagekit.io/bdhalls/default-image.jpg?updatedAt=1665324003777&ik-s=058c557f3ad6e697b08197bb1aa9660059ea18cc",
            "name": "hat-1",
            "price": 300.5
        }
    ]
    res.render("html/orderDetails", { order: data, products: products, itemTotal: 401.00 })
})


module.exports = order;