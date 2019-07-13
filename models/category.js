const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        trim: true,
        lowercase: true
    }
})

module.exports = mongoose.model('Category', categorySchema)