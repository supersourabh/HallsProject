const express = require("express");
const bodyParser = require("body-parser");
const log = require("./utils/morgenLogger");
const path = require("path");
const products = require("./routes/productRoute");
const cart = require("./routes/cartRoute");
const order = require("./routes/orderRoute");
const ImageKit = require("imagekit");
const genURL = require("./utils/imageKitURLGen");
const mysql = require("mysql2");
const dbConnection = require("./utils/dbConnection");
const dbConfig = require("./routes/dbRoute");
const user = require("./routes/userRoute");
const payment = require("./routes/paymentRoute");
const session = require('express-session');
const flash = require('connect-flash');
const crypto = require("crypto");
const AppError = require("./utils/appError");
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const admin = require("./routes/adminRoute");
const favicon = require("serve-favicon");
const addressApis = require("./routes/addressApisRoute");
require("dotenv").config()

const app = express();



var imageKit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC,
    privateKey: process.env.IMAGEKIT_PRIVATE,
    urlEndpoint: "https://ik.imagekit.io/bdhalls"
})

const db = dbConnection();

app.set("db", db);

// var imgUrl = imageKit.url({
//     path: "/product-images/photo.jpg",
//     urlEndpoint: process.env.URL_END_PRODUCT_IMG,
//     transformation: [{
//         width: "300",
//         height: "400",
//     }],
//     signed: true
// })

//bootstrap
app.use('/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')))
app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')))
app.use('/js', express.static(path.join(__dirname, 'node_modules/jquery/dist')))


const PORT = process.env.PORT || 5000;

app.use(bodyParser({ extended: true }))
app.use(express.json())

app.use(cookieParser())

app.use(
    session({
        genid: function (req) {
            return crypto.randomUUID();// use UUIDs for session IDs
        },
        key: "halls_user_auth",
        secret: process.env.SITE_SECRET,
        saveUninitialized: false,
        cookie: { maxAge: 3600000 },
        resave: false
    }))

app.use(flash())


app.use(fileUpload({
    limits: { fileSize: 20 * 1024 * 1024 },
}));

app.use(express.static(path.join(__dirname, "/views/public")))

app.use(favicon(path.join(__dirname, 'views/public/brand', 'c.ico')))
//app.get('/favicon.ico', (req, res) => res.sendFile('./views/public/brand/c.png'));

//ejs part 
app.set("view engine", "ejs")
app.set('views', path.join(__dirname, '/views'));

//morgen logging
log(app);

app.get("/", (req, res) => {
    res.render("html/index");
})

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.send("logout success")
})

app.get("/img", (req, res) => {
    res.send(genURL('photo.jpg', 'user-profiles', imageKit));
})

//db
app.use("/db", (req, res, next) => {
    req.db = db;
    next();
}, dbConfig)

//user
app.use("/user", (req, res, next) => {
    req.db = db;
    req.imageKit = imageKit;
    next();
}, user)

//product
app.use("/products", (req, res, next) => {
    req.db = db;
    next();
}, products)

//cart
app.use("/cart", (req, res, next) => {
    req.db = db;
    next();
}, cart)

//order
app.use("/order", (req, res, next) => {
    req.db = db;
    next();
}, order)

//payment
app.use("/payment", (req, res, next) => {
    req.db = db;
    next();
}, payment)

//addressDataApi
app.use("/addressData", (req, res, next) => {
    req.db = db;
    req.imageKit = imageKit;
    next();
}, addressApis)


//admin
app.use("/admin", (req, res, next) => {
    req.db = db;
    req.imageKit = imageKit;
    next();
}, admin)

//error
app.get('/error', (req, res) => {
    res.render("html/error", { error: "Something went wrong", status: 500 })
})
//404 page
app.get('*', function (req, res, next) {
    next(new AppError(`Page not foung for the path = ${req.path}`, 404))
});

// app.use((err, req, res, next) => {
//     const status = err.status || 500;
//     res.status(status).json({
//         success: 0,
//         status: status,
//         message: err
//     })
// })

app.get("/places?", (req, res) => {
    console.log("running");
    let oId = req.query.oId
    let state = req.query.state
    let city = req.query.city[0].toUpperCase() + req.query.city.substring(1)
    let place = req.query.place[0].toUpperCase() + req.query.place.substring(1)
    let pincode = req.query.pincode


    let qry1 =
        `insert into bdhalls.outlets values('${oId}','India','${state}','${city}','${place}',${pincode})`;

    db.query(qry1, (err, result) => {
        if (err) res.send(err)
        else res.send(result)
    })
})

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`))