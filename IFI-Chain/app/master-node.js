const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);

const P2PServer = require("./p2p-server");
const p2pServer = new P2PServer();

const blockChainApi = require("./route/blockChainRoute");
const walletApi = require("./route/walletRoute");
const accountApi = require("./route/accountRoute");
const productApi = require("./route/productRoute");
const userApi = require('./route/userRoute');
const sellerApi = require('./route/sellerRoute');
const supplierApi = require('./route/supplierRoute');

const HTTP_PORT = process.env.HTTP_PORT || 3000;

const app = express();

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://localhost/user-wallet", {
  useCreateIndex: true,
  useNewUrlParser: true
});
var db = mongoose.connection;
app.use(
  session({
    secret: "try best",
    resave: true,
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection: db })
  })
);

app.use("/blockchain", blockChainApi);
app.use("/wallet", walletApi);
app.use("/account", accountApi);
app.use('/product', productApi);
app.use('/user', userApi);
app.use('/seller', sellerApi);
app.use('/supplier', supplierApi);

app.listen(HTTP_PORT, () => {
  console.log("App is listening on port " + HTTP_PORT);
});

p2pServer.listen();
