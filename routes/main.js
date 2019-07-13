const router = require('express').Router()
const Product = require('../models/product')
const Cart = require('../models/cart')
const Category = require('../models/category')
const Order = require('../models/order')

router.get('/', (req, res) => {
    res.render('main/home');
})

router.get('/about', (req, res) => {
    res.render('main/about')
})

//Route for getting products list depending on category id
router.get('/products/:id', (req, res, next) => {
    Product.find({ category: req.params.id }, (err, products) => {
        if (err) return next(err)
        Category.findById(req.params.id, (err, catgry)=>{
            if(err) throw err
            res.render('main/category', {
                category: catgry,
                products: products
            })
        })
    })
})

//Route for displaying information of product
router.get('/product/:id', (req, res, next) => {
    Product.findById(req.params.id, (err, reslt) => {
        if (err) return next(err)
        res.render('main/productInd', {
            product: reslt
        })
    })
})

//Route for adding an item to cart
router.post('/product/:product_id', (req, res, next) => {
    if (req.user) {
        Cart.findOne({ owner: req.user._id }, (err, cart) => {
            if (err) throw err
            // console.log(cart)
            cart.items.push({
                item: req.body.product_id,
                price: Number(req.body.priceValue),
                quantity: Number(req.body.quantity)
            })
            cart.total += Number(req.body.priceValue)
            cart.save().then(() => {
                res.redirect('/cart')
            }).catch(err => next(err))
        })
    } else {
        req.flash('loginMessage', 'You must be logged in before purchasing anything')
        res.redirect('/login')
    }
})

//Route for cart items
router.get('/cart', (req, res, next) => {
    if (req.user) {
        Cart.findOne({ owner: req.user._id })
            .populate('items.item')
            .exec((err, foundCart) => {
                if (err) return next(err)
                res.render('main/cart', {
                    foundCart: foundCart,
                    message: req.flash('remove'),
                    user: req.user
                })
            })
    } else {
        req.flash('loginMessage', 'You must be logged in before purchasing anything')
        res.redirect('/login')
    }
})

//Removing items from cart
router.post('/remove', (req, res, next) => {
    Cart.findOne({ owner: req.user._id }, (err, foundCart) => {
        foundCart.items.pull(String(req.body.item))
        foundCart.total -= Number(req.body.price)
        foundCart.save()
            .then(() => {
                req.flash('remove', 'Successfully removed')
                res.redirect('/cart')
            })
            .catch(err => next(err))
    })
})

//Route for searching a product by name
router.post('/search', (req, res, next) => {
    const regex = new RegExp(escapeRegex(req.body.item), 'gi');
    Product.find({ name: regex }, (err, prod) => {
        if (err) throw err
        res.render('main/search-display', {
            products: prod
        })
    })
})

//Route for displaying order details
router.get('/order/:id', (req, res, next) => {
    if (!req.params.id) return res.redirect('/')
    Order.findById(req.params.id)
        .populate('items.item')
        .exec((err, foundOrder) => {
            if (err) return next(err)
            // console.log(foundOrder.items)
            res.render('main/order', {
                foundOrder: foundOrder
            })
        })
})

//Menu Router
router.get('/menu', (req, res, next) => {
    Category.find({}, (err, categories)=>{
        if(err) throw err
        res.render('main/menu', {
            categories: categories
        })
    })
})

//Router for about me section
router.get('/about', (req, res, next)=>{
    res.render('main/about')
})

const escapeRegex = function (text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router
