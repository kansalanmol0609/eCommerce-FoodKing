const mongoose = require('mongoose')

var orderSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    total: {
        type: Number,
        default: 0
    },
    transactionComplete: {
        type: Boolean,
        default: false
    },
    orderComplete: {
        type: Boolean,
        default: false
    },
    transactionID: {
        type: String,
        default: ''
    },
    items: [{
        item: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        quantity: {
            type: Number,
            default: 1
        },
        price: {
            type: Number,
            default: 0
        }
    }]
})

module.exports = mongoose.model('Order', orderSchema)