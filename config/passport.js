const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const User = require('../models/user')

//Serialize and Deserialize
//It is like storing your connection details into database and also fetching from it
//Like doctor takes your file and stores in the hospital and also it can take file back
passport.serializeUser((user, done)=>{
    done(null, user._id)
})

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user)=>{
        done(err, user)
    })
})

//Middleware
//We can choose any name other than local-login
passport.use('local-login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, (req, email, password, done) => {
    User.findOne({email}, (err, user)=>{
        if(err) return done(err)

        if(!user || !user.comparePassword(password)){
            return done(null, false, req.flash('loginMessage', 'Invalid email or password!!'))
        }

        return done(null, user)
    })
}))

//Custom function to validate
exports.isAuthenticated = (req, res, next)=>{
    if(req.isAuthenticated()){
        return next()
    }
    res.redirect('/login')
}