const fileUpload = require('express-fileupload');
const crypto = require("node:crypto");
const genURL = require('../../utils/imageKitURLGen');
const adminOutlets = require('express').Router()


adminOutlets.get("/", (req, res) => {
    try {
        console.log(Object.keys(req.query).length);
        filter = undefined;
        if (Object.keys(req.query).length > 1) {
            filter = " ";
            let pincode = req.query.pincode;
            let outletId = req.query.outletId;
            let outletName = req.query.outletName;
            let status = req.query.status;

            if (status) filter += `o.isActive= '${status}'`;
            if (pincode) filter += `a.pincode='${pincode}'`;
            if (outletId) filter += `o.id= '${outletId}'`;
            if (outletName) filter += `o.name= '${outletName}'`;
        }

        let quey = `
            select admin from bdhalls.users where id= ?;
            select o.id , o.name , concat(u.first_name, ' ', u.last_name,'(',u.mobile,')' ) as admin,
            a.pincode as pincode , o.outlet_service_cost as service_cost, o.isActive as status , o.date , ord.orders_count
            from bdhalls.outlets as o
            inner join bdhalls.users u on o.outlet_admin = u.id
            inner join bdhalls.addressData a on a.id = o.addressId 
            left join (select outletId , count(*) as orders_count from bdhalls.order group by outletId) ord on ord.outletId = o.id
            ${filter != undefined ? 'where ?' : ''}
            order by date desc; 
            select state from bdhalls.addressData group by state order by state ;
            select city from bdhalls.addressData group by city order by city;
            select place from bdhalls.addressData group by place order by place;
            `;
        console.log(filter);
        console.log(quey);

        // if(req.query.id && req.query.outletId)  access= false;

        if (req.query.id) {
            let db = req.db
            db.query(
                quey
                , [req.query.id, filter], (err, result) => {
                    //result is like [ [{admin : x }] , [{outlet1},{outlet2}]  ]
                    console.log(err);
                    if (err) res.render('html/error', { error: err.message, status: err.errno })
                    else if (result.length > 0 && result[0].length > 0 && result[0][0].admin) {
                        res.render("html/admin/outlets", { outlets: result[1], states: result[2], cities: result[3], places: result[4], editOutlet: result[5] ?? null })
                    } else {
                        res.render('html/error', { error: "Unauthorized", status: 404 })
                    }
                })
        } else {
            res.render('html/error', { error: 'Unauthorized', status: 404 })
        }
    } catch (error) {
        res.render('html/error', { error: error.message, status: 500 })

    }
})


adminOutlets.post("/create", async (req, res) => {
    try {
        if (req.query.id) {
            let image = req.files.image
            if (!image) throw new Error("image not found")
            else {
                let body = req.body
                let imageKit = req.imageKit
                let imageUrl = null
                let imageData = {
                    file: image.data, //required
                    fileName: body['outlet_admin'] + "@" + image.name,
                    folder: "/outlet-images/",
                    extensions: [
                        {
                            name: "google-auto-tagging",
                            maxTags: 5,
                            minConfidence: 95
                        }
                    ]
                }
                imageKit.upload(imageData, (err, result) => {
                    console.log(err, result);
                    if (err) { throw new Error(err.message) }
                    else {
                        let url = result.url
                        imageUrl = genURL.genUrlFromLink(url, imageKit)


                        body['image'] = imageUrl;

                        let db = req.db
                        db.query(`
                    select admin from bdhalls.users where id= ?; 
                    select id from bdhalls.users where mobile = ?;
                    select * from bdhalls.addressData where id = ?;
                    `
                            , [req.query.id, body['outlet_admin'], body["addressId"]], (err, result) => {
                                //result is like [ [{admin : x }] , [{outlet1},{outlet2}]  ]
                                console.log(err, result);
                                if (err) res.status(500).send({ error: err.message, status: err.errno })
                                else if (result.length > 0 && result[0].length > 0 && result[1].length > 0 && result[0][0].admin && result[1][0].id) {
                                    console.log(result);

                                    body['outlet_admin'] = result[1][0].id;
                                    body["id"] = result[2][0].stateCode + result[2][0].pincode + body['name'].substring(0, 3).toUpperCase() + Math.round(Math.random() * 100000)
                                    db.query('insert into bdhalls.outlets set ?', [body], (err, insertData) => {
                                        console.log(err);
                                        console.log(insertData);
                                        if (err) res.status(500).send({ error: err.message, status: err.errno })
                                        else {
                                            res.send({ status: 200, message: "outlet added successfully" })
                                        }
                                    })
                                    //res.send({ outlets: result[1] })
                                } else {
                                    res.status(404).send({ error: "Unauthorized", status: 404 })
                                }
                            })
                    }
                })
            }
        } else {
            res.status(404).send({ error: 'Unauthorized', status: 404 })
        }
    } catch (error) {
        res.status(500).send({ error: error.message, status: 500 })

    }
})

adminOutlets.get("/:outletId/edit/:id", async (req, res) => {
    try {
        if (req.params.id) {
            let db = req.db
            db.query(`select admin from bdhalls.users where id= ?; 
            select o.name , u.mobile, o.outlet_service_cost, o.Id as id from bdhalls.outlets o inner join bdhalls.users u on u.id = o.outlet_admin where o.id = ? ;
            `
                , [req.params.id, req.params.outletId], (err, result) => {
                    if (err) res.send({ error: err.message, status: err.errno })
                    else if (result[0][0].admin && result[1].length > 0) {
                        res.render("html/admin/adminEdit", { editItemType: "OUTLET", outlet: result[1][0] })
                    } else {
                        res.render('html/error', { error: 'Unauthorized', status: 404 })
                    }
                })
        } else {
            res.render('html/error', { error: 'Unauthorized', status: 404 })
        }
    } catch (error) {
        res.render('html/error', { error: 'Unauthorized', status: 404 })
    }
})


adminOutlets.put("/:outletId/edit/:id", (req, res) => {
    try {
        if (req.params.id) {
            let body = req.body
            let db = req.db
            let admin_mobile = body["admin_mobile"];
            delete body["admin_mobile"]
            db.query(`select admin from bdhalls.users where id= ?; update bdhalls.outlets set ? 
            where outlet_admin in (select id from bdhalls.users where mobile = "${admin_mobile}");`
                , [req.params.id, req.body], (err, result) => {
                    //result is like [ [{admin : x }] , [{outlet1},{outlet2}]  ]
                    if (err) res.send({ error: err.message, status: err.errno })
                    else if (result.length > 0 && result[0][0].admin && result[1].affectedRows != 0) {
                        res.send({ status: 200, message: "outlet edited" })
                    } else {
                        res.send({ error: "Unauthorized/Field error", status: 404 })
                    }
                })

        } else {
            res.send({ error: 'Unauthorized', status: 404 })
        }
    } catch (error) {
        res.send({ error: error.message, status: 500 })

    }
})


adminOutlets.delete("/:outletId/delete/:id", (req, res) => {
    try {
        if (req.params.id) {
            let db = req.db
            db.query(`select admin from bdhalls.users where id= ?; delete from bdhalls.outlets where id= ?`
                , [req.params.id, req.params.outletId], (err, result) => {
                    //result is like [ [{admin : x }] , [{outlet1},{outlet2}]  ]
                    console.log(result);
                    if (err) res.send({ error: err.message, status: err.errno })
                    else if (result[0][0].admin) {
                        res.send({ status: 200, message: "outlet delete success" })
                    } else {
                        res.status(403).send({ error: 'Unauthorized', status: 404 })
                    }
                })
        } else {
            res.status(403).send({ error: 'Unauthorized', status: 404 })
        }
    } catch (error) {
        res.status(500).send({ error: error.message, status: 500 })
    }
})



module.exports = adminOutlets