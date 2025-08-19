const { Schema, model, default: mongoose } = require('mongoose')

const PaymentSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    plan: { type: String, enum: ["bronze", "silver", "gold", "platinum"], required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    stripeId: { type : String },

    payout: {
        payoutId: { type: String },        // Stripe Payout ID
        connectedAccountId: { type: String }, // Admin Stripe Account
        amount: { type: Number },          // Amount paid out (in NGN smallest unit, kobo)
        currency: { type: String, default: "ngn" },
        status: { type: String, enum: ["initiated", "completed", "failed"], default: null },
        date: { type: Date }
      }
})

const Payment = model('Payment', PaymentSchema)

module.exports = Payment