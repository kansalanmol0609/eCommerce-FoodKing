const router = require('express').Router()
const Category = require('../models/category')
const Product = require('../models/product')
const Order = require('../models/order')
const path = require('path')
const mongoose = require('mongoose')
const fs = require('fs')

//Route for adding a category
router.get('/add-category', (req, res, next) => {
    res.render('admin/add-category', {
        message: req.flash('success')
    })
})

router.post('/add-category', (req, res, next) => {
    var category = new Category()
    category.name = req.body.name
    category.save((err) => {
        if (err) return next(err)
        req.flash('success', 'Successfully added a category')
        return res.redirect('/add-category')
    })
})

//Adding a product
router.get('/add-product', (req, res, next) => {
    res.render('admin/add-product', {
        message: req.flash('success')
    })
})

// MULTER
const multer = require('multer')
const upload = multer({
    dest: '/app/uploads',
    fileFilter(req, file, cb) {
        if (!(file.originalname.endsWith('jpg') || file.originalname.endsWith('png') || file.originalname.endsWith('jpeg'))) {
            req.fileValidationError = 'Only JPEG/JPG/PNG file formats are allowed'
            return cb(undefined, false)
        }
        if (file.size > 10000000) {
            req.fileValidationError = 'File Size must be less than 10 MB'
            return cb(undefined, false)
        }
        cb(undefined, true)
    }
})

router.post('/add-product', upload.single('upfile'), (req, res, next) => {
    var { name, price, category, description } = req.body
    //To handle errors received from multer
    if (req.fileValidationError) {
        req.flash('success', req.fileValidationError)
        return res.redirect('/add-product')
    }
    //If any of the field is empty
    if (!name || !price || !category || !description || !req.file) {
        console.log(name, price, category, description, req.file)
        req.flash('success', 'All fields are mandatory')
        return res.redirect('/add-product')
    }
    var product = new Product()
    // read the img file from tmp in-memory location
    var newImg = fs.readFileSync(req.file.path);
    // encode the file as a base64 string.
    var encImg = newImg.toString('base64');

    product.name = name
    product.price = price
    product.category = category
    product.image = encImg
    product.description = description
    product.save()
        .then(() => {
            //Deleting the file from server after pushing it to mongodb
            fs.unlink(req.file.path, (err) => { })
            req.flash('success', 'Saved Successfully')
            return res.redirect('/add-product')
        })
        .catch(err => {
            throw err
        })
})

//Delete a product
router.get('/delete-product', (req, res, next) => {
    Product.find({}, (err, prod) => {
        if (err) throw err
        res.render('admin/delete-product', {
            message: req.flash('message'),
            products: prod
        })
    })
})

router.post('/delete-product/:id', (req, res, next) => {
    if (req.params.id) {
        // console.log('Trying to delete')
        Product.deleteOne({ _id: req.params.id })
            .then(() => {
                req.flash('message', 'Successfully Deleted')
                res.redirect('/delete-product')
            })
            .catch(err =>{
                req.flash('message', 'Error occured, try again')
                res.redirect('/delete-product')
            })
    }
})

//Route for getting details of all the orders
router.get('/all-orders', (req, res, next) => {
    Order.find({}, (err, reslt) => {
        if (err) throw err
        res.render('admin/order-all', {
            orders: reslt,
            message: req.flash('message')
        })
    })
})

//Route for marking an order as complete
router.post('/complete-order/:id', (req, res, next) => {
    if (req.params.id) {
        Order.findById(req.params.id, (err, ord) => {
            if (err) throw err
            if (ord) {
                ord.orderComplete = true
                ord.save()
                    .then(() => {
                        req.flash('message', 'Successfully Marked it as Ordered!')
                        res.redirect('/all-orders')
                    }).catch(err => {
                        throw err
                    })
            }
        })
    } else {
        res.send('Not found')
    }
})

module.exports = router