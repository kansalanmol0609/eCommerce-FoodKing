const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    category: {
        type: mongoose.Schema.Types.ObjectId
    },
    name : {
        type: String,
        trim: true,
    },
    description: String,
    price: Number,
    image: String
})

module.exports = mongoose.model('Product', productSchema)