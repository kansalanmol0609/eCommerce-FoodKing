const router = require('express').Router()
const User = require('../models/user')
const passport = require('passport')
const passportConf = require('../config/passport')
const Cart = require('../models/cart')
const sgMail = require('@sendgrid/mail');
const bcrypt = require('bcrypt-nodejs')
const crypto = require('crypto')
const { secretKeySendGriD } = require('../config/secret')

sgMail.setApiKey(secretKeySendGriD);

router.get('/login', (req, res) => {
    if(req.user){
        return res.redirect('/profile')
    }
    res.render('accounts/login', { message: req.flash('loginMessage') })
})

router.post('/login', passport.authenticate('local-login', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: true
}))

router.get('/profile', passportConf.isAuthenticated, (req, res) => {
    User.findById(req.user._id)
        .populate('history.item')
        .exec((err, foundUser) => {
            if (err) throw err
            res.render('accounts/profile', {
                user: foundUser
            })
        })
})

router.get('/signup', (req, res, next) => {
    if(req.user){
        return res.redirect('/profile')
    }
    res.render('accounts/signup', {
        errors: req.flash('errors'),
        user: req.user
    })
})

router.post('/signup', (req, res, next) => {
    var { name, email, password } = req.body
    var otp = Math.floor(100000 + Math.random() * 900000)
    if (name && email && password) {
        if (password.length < 6) {
            req.flash('errors', 'Password length must be atleast 6')
            return res.redirect('/signup')
        }
        User.findOne({ email }, (err, existingUser) => {
            if (existingUser) {
                req.flash('errors', 'Account with that email already exists!')
                return res.redirect('/signup')
            }
            else {
                //We have saved this user, now we need to create cart for him/her
                const msg = {
                    to: email,
                    from: 'foodking_kansal@gmail.com',
                    subject: 'OTP for verifying your account',
                    html: `<strong>Welcome to Food King</strong><p>You are just one step away from starting ordering. Just fill this otp: <strong>${otp}</strong></p>`,
                };
                sgMail.send(msg)
                bcrypt.genSalt(10, function (err, salt) {
                    if (err) return next(err)
                    bcrypt.hash(otp, salt, null, function (err, hash) {
                        if (err) return next(err)
                        otpHash = hash;
                        res.render('accounts/otp-check', {
                            otpHash: otpHash,
                            name,
                            email,
                            password
                        })
                    })
                })
            }
        })
    } else {
        req.flash('errors', 'All fields are mandatory!')
        return res.redirect('/signup')
    }
})

router.post('/signupConfirmed', (req, res) => {
    if(req.user){
        return res.redirect('/profile')
    }
    var { name, email, password, otp, otpHash } = req.body
    if (bcrypt.compareSync(otp, otpHash)) {
        var user = new User()
        console.log(name, email, password)
        user.profile.name = String(name)
        user.email = String(email)
        user.password = String(password)
        user.profile.picture = user.gravatar()
        user.save()
            .then(user => {
                var cart = new Cart()
                cart.owner = user._id
                cart.save()
                    .then(() => {
                        //So as to login that user who has just made an id
                        req.logIn(user, (err) => {
                            if (err) return next(err)
                            res.redirect('/profile')
                        })
                    })
                    .catch(err => res.status(400).send(err))
            })
            .catch(err => res.status(400).send(err))
    } else {
        req.flash('errors', 'Wrong OTP!!')
        return res.redirect('/signup')
    }
})

router.get('/logout', (req, res, next) => {
    req.logout()
    res.redirect('/')
})

//Profile Edit option
router.get('/edit-profile', (req, res, next) => {
    res.render('accounts/edit-profile', {
        message: req.flash('success')
    })
})

router.post('/edit-profile', (req, res, next) => {
    User.findOne({ _id: req.user.id }, (err, user) => {
        if (err) return next(err)

        if (req.body.name) user.profile.name = req.body.name
        if (req.body.address) user.address = req.body.address

        user.save()
            .then(u => {
                req.flash('success', 'Successfully Edited your profile')
                return res.redirect('/edit-profile')
            })
            .catch(err => next(err))
    })
})

module.exports = router