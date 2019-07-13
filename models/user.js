const mongoose = require('mongoose')
const bcrypt = require('bcrypt-nodejs')
const crypto = require('crypto')

//The user schema attributes/ characteristics
var UserSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String
    },
    profile: {
        name: {
            type: String,
            required: true,
            trim: true
        },
        picture: {
            type: String,
            default: ''
        }
    },
    address: {
        type: String,
        trim: true
    },
    history: [{
        orderID: String
    }]
})

//Hash the password before we even save it to database
UserSchema.pre('save', function(next){
    var user = this
    if(!user.isModified('password')){
        return next()
    }
    bcrypt.genSalt(10, function(err, salt){
        if(err) return next(err)
        bcrypt.hash(user.password, salt, null, function(err, hash){
            if(err) return next(err)
            user.password = hash;
            next()
        })
    })
})

//Compare password in the database and the one that the user types in
//Here we are making a function to the userschema -- argument is one we typed in
UserSchema.methods.comparePassword = function(password){
    return bcrypt.compareSync(password, this.password)
}

//Using gravatar method to fetch user picture
UserSchema.methods.gravatar = function(size){
    if(!this.size) size=200
    if(!this.email) return 'https://gravatar.com/avatar/?s'+size+'&d=retro'
    var md5 = crypto.createHash('md5').update(this.email).digest('hex')
    return 'https://gravatar.com/avatar/'+md5+'?s='+size+'&d=retro'
}

module.exports = mongoose.model('User', UserSchema)