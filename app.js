const express = require('express')
const morgan = require('morgan')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const ejsMate = require('ejs-mate')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const flash = require('express-flash')
const MongoStore = require('connect-mongo')(session)
const passport = require('passport')

//Models
const { database, secretKey } = require('./config/secret')
var User = require('./models/user')
const Category = require('./models/category')
const Cart = require('./models/cart')

const app = express()
const PORT = process.env.PORT || 3000

//To remove depricate warning
mongoose.set('useCreateIndex', true);
//Connect to mongoDB
mongoose.connect(database, { useNewUrlParser: true })
    .then(() => {
        console.log('MongoDB Connected Successfully!!')
    })
    .catch((err) => {
        console.log('ERROR OCURRED')
        console.log(err)
    })

//Public Directory
app.use(express.static(__dirname + '/public'))
app.use('/products', express.static(__dirname + '/public'))
app.use('/product', express.static(__dirname + '/public'))
app.use('/order', express.static(__dirname + '/public'))

//Middleware
app.use(morgan('dev'))

//Body Parser
app.use(bodyParser.json({limit: '50mb'}))
app.use(bodyParser.urlencoded({ limit: '50mb',extended: true }))

app.use(cookieParser())
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: secretKey,
    store: new MongoStore({ url: database, autoReconnect: true })
}))
app.use(flash())
app.use(function(req, res, next){
    res.locals.otpMessage = req.flash('otpMessage');
    next();
});
app.use(passport.initialize())
app.use(passport.session())


//Creating middleware to pass user to every page
app.use((req, res, next) => {
    res.locals.user = req.user
    next()
})

app.use((req, res, next) => {
    //To fetch all categories
    Category.find({}, (err, cat) => {
        if (err) return next(err)
        res.locals.categories = cat
        next()
    })
})

//Setting up middleware function to calculate number of items in cart
const CartItem = (req, res, next) => {
    if (req.user) {
        var total = 0
        Cart.findOne({owner: req.user._id}, (err, cart) => {
            res.locals.cart = 0
            if (cart) {
                cart.items.forEach(item => {
                    total += Number(item.quantity)
                });
                // console.log(total)
                res.locals.cart = total
            }
            next()
        })
    } else {
        next()
    }
}
app.use(CartItem)


//EJS View Engine
app.set('views', __dirname + '/views')
app.engine('ejs', ejsMate)
app.set('view engine', 'ejs')

//Routes
app.use(require('./routes/main'))
app.use(require('./routes/user'))
app.use(require('./routes/admin'))
app.use(require('./routes/payment'))
app.use('/api', require('./api/api'))

//Listening on port 3000
app.listen(PORT, (err) => {
    if (err) throw err;
    console.log('Server is running ...')
})