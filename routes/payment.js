const router = require('express').Router()
const https = require('https');
const checkSum = require('./paytm/checksum')
const Order = require('../models/order')
const Cart = require('../models/cart')
const { PaytmConfig } = require('../config/secret')

//Router for forwarding to paytm 
router.post('/payOrder', (req, res, next) => {
    var order = new Order({
        owner: req.user._id,
        total: Number(req.body.amount),
    })
    Cart.findOne({ owner: req.user._id }, (err, cart) => {
        if (err) throw err
        if (!cart) res.redirect('/cart')
        // console.log(cart.items)
        order.items = cart.items
        order.save()
            .then(() => {
                var params = new Map();
                console.log(req.get('host') + '/paymentDone')
                params['MID'] = PaytmConfig.mid
                params['WEBSITE'] = PaytmConfig.website
                params['CHANNEL_ID'] = 'WEB'
                params['INDUSTRY_TYPE_ID'] = 'Retail'
                params['ORDER_ID'] = order._id
                params['CUST_ID'] = req.user._id
                params['TXN_AMOUNT'] = Number(req.body.amount)
                params['CALLBACK_URL'] = req.protocol + '://' + req.get('host') + '/paymentDone';
                params['EMAIL'] = req.user.email;

                checkSum.genchecksum(params, PaytmConfig.key, function (err, checksum) {
                    if (err) throw err
                    var txn_url = "https://securegw-stage.paytm.in/theia/processTransaction"; // for staging
                    // var txn_url = "https://securegw.paytm.in/theia/processTransaction"; // for production
                    var form_fields = "";
                    for (var x in params) {
                        form_fields += "<input type='hidden' name='" + x + "' value='" + params[x] + "' >";
                    }
                    form_fields += "<input type='hidden' name='CHECKSUMHASH' value='" + checksum + "' >";
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.write('<html><head><title>Merchant Checkout Page</title></head><body><center><h1>Please do not refresh this page...</h1></center><form method="post" action="' + txn_url + '" name="f1">' + form_fields + '</form><script type="text/javascript">document.f1.submit();</script></body></html>');
                    res.end();
                });
            })
            .catch(err => next(err))
    })
})

//Router to receive payment and confirm order
router.post('/paymentDone', (req, res, next) => {
    if (req.body.RESPCODE == '01') {
        //Finding this order
        Order.findById(req.body.ORDERID, (err, order) => {
            if (err) throw err
            if (!order) {
                return req.send("Transaction Failed, Please retry!!")
            }
            var params = req.body
            order.transactionID = params.TXNID
            var checkSumHash = params.CHECKSUMHASH
            delete params.CHECKSUMHASH
            var result = checkSum.verifychecksum(params, PaytmConfig.key, checkSumHash);
            //CheckSum has been Verified
            if (result) {
                //Final Step
                //Let's do final re-verification
                checkSum.genchecksum(params, PaytmConfig.key, function (err, checksum) {
                    if (err) throw err

                    params.CHECKSUMHASH = checksum;
                    post_data = 'JsonData=' + JSON.stringify(params);

                    var options = {
                        hostname: 'securegw-stage.paytm.in', // for staging
                        // hostname: 'securegw.paytm.in', // for production
                        port: 443,
                        path: '/merchant-status/getTxnStatus',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Content-Length': post_data.length
                        }
                    };

                    // Set up the request
                    var response = "";
                    var post_req = https.request(options, function (post_res) {
                        post_res.on('data', function (chunk) {
                            response += chunk;
                        });

                        post_res.on('end', function () {
                            // console.log('S2S Response: ', response, "\n");
                            var _result = JSON.parse(response);
                            //We need to match orderID and amount
                            if (_result.TXNAMOUNT == params.TXNAMOUNT && _result.ORDERID == params.ORDERID) {
                                Order.findById(params.ORDERID, (err, relt) => {
                                    relt.transactionComplete = true
                                    req.user.history.push({
                                        orderID: params.ORDERID
                                    })
                                    // console.log(req.user)
                                    req.user.save()
                                        .then(() => {
                                            relt.save()
                                                .then(() => {
                                                    //Clear the cart
                                                    Cart.findOne({ owner: req.user._id }, (err, crt) => {
                                                        if (err) throw err
                                                        crt.total = 0
                                                        crt.items = []
                                                        crt.save()
                                                            .then(() => {
                                                                res.redirect('/profile')
                                                            })
                                                    })
                                                })
                                        }).catch(err => next(err))
                                })
                            }
                            else {
                                req.user.history.push({
                                    orderID: params.ORDERID
                                })
                                req.user.save().then(() => {
                                    res.send('<!DOCTYPE html><html><head><title>Failed Transaction</title></head><body>"Transaction Failed, Please retry!!" <script>setTimeout(function () { window.location = "/cart";}, 2000)</script></body></html>')
                                }).catch(err => next(err))
                            }

                        });
                    });

                    // post the data
                    post_req.write(post_data);
                    post_req.end();
                });

            } else {
                req.user.history.push({
                    orderID: params.ORDERID
                })
                req.user.save().then(() => {
                    res.send('<!DOCTYPE html><html><head><title>Failed Transaction</title></head><body>"Transaction Failed, Please retry!!" <script>setTimeout(function () { window.location = "/cart";}, 2000)</script></body></html>')
                }).catch(err => next(err))
            }
        })
    } else {
        req.user.history.push({
            orderID: req.body.ORDERID
        })
        req.user.save().then(() => {
            res.send('<!DOCTYPE html><html><head><title>Failed Transaction</title></head><body>"Transaction Failed, Please retry!!" <script>setTimeout(function () { window.location = "/cart";}, 2000)</script></body></html>')
        }).catch(err => next(err))
    }
})

module.exports = router