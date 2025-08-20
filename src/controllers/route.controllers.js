const Stripe = require('stripe');
const jwt = require('jsonwebtoken')
const Payment = require('../models/Payment.model');
const User = require('../models/User.model');



//auth

const handleSignUp = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: "User already exists" });
    
        user = new User({ name, email, password });
        await user.save();
    
        res.status(201).json({ user: { id: user._id, name: user.name, role: user.role } });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
}

const handleLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });
    
        const isMatch = await user.matchPassword(password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
    
        const token = jwt.sign({ id: user._id, role: user.role } ,process.env.JWT_SECRET, { expiresIn: '3d'})
        res.json({ token, user: { id: user._id, name: user.name, role: user.role } });

      } catch (error) {
        res.status(500).json({ message: error.message });
      }
}

const getPlans = (req, res) => {
    const plans = [    
        { name: "regular", price: 10000 },    
        { name: "Vip", price: 20000 },      
        { name: "vVip", price: 100000 } 
      ];
      res.json(plans);
}

//stripe payment
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const createCheckOut = async (req, res) => {
  try {
    const { plan, userId } = req.body;

    const priceMap = {
      regular: 10000,  // $100.00
      Vip: 20000,    // $200.00
      vVip: 100000 // $1000.00
    };

    if (!priceMap[plan]) {
      return res.status(400).json({ error: "Invalid Plan" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd", // or "ngn" if you mean Naira
            product_data: { name: `${plan.toUpperCase()} Membership` },
            unit_amount: priceMap[plan],
          },
          quantity: 1,
        },
      ],
      success_url: "https://membershippaymentapi.onrender.com/success",
      cancel_url: "https://membershippaymentapi.onrender.com/cancel",
    });

    const payment = await Payment.create({
      userId,
      plan,
      amount: priceMap[plan] / 100, // store as dollars (or naira if ngn)
      status: "pending",
      stripeId: session.id,
    });

    res.json({ message: 'payment intent made', paymentId: payment._id, url:session.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const handleSuccess = (req, res) => {
  res.status(200).json({ message: "Payment Successful"})
}

const handleFail = (req, res) => {
  res.status(200).json({ message: "Error processing Payment... try again..."})
}



const stripeWebhook = async (req, res) => {
    let event;
    try {
      const sig = req.headers["stripe-signature"];
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error("⚠️ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  
    // Handle event types
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
  
      try {
        // Update Payment in DB
        await Payment.findOneAndUpdate(
          { stripeId: session.id },
          { status: "paid" },
          { new: true }
        );
        console.log("✅ Payment marked as PAID:", session.id);
      } catch (err) {
        console.error("DB update failed:", err.message);
      }
    }
  
    res.json({ received: true });

}



//admin
// controllers/payment.controller.js


// Get all payments (Admin)
const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find().populate("userId", "email");
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
};

// controllers/payout.controller.js


// Trigger a payout to Admin’s bank (via Connect Account)
const createPayout = async (req, res) => {
    try {
        const { paymentId, amount, currency, connectedAccountId } = req.body;
    
        // Validate
        if (!paymentId || !amount || !currency || !connectedAccountId) {
          return res.status(400).json({ error: "Missing required fields" });
        }
    
        // 1. Trigger payout to Admin's connected account
        const payout = await stripe.payouts.create(
          {
            amount,          // in kobo for NGN
            currency,        // "ngn"
          },
          {
            stripeAccount: connectedAccountId, // Admin’s Connect Account ID
          }
        );
    
        // 2. Update Payment in DB
        const updatedPayment = await Payment.findByIdAndUpdate(
          paymentId,
          {
            $set: {
              "payout.payoutId": payout.id,
              "payout.connectedAccountId": connectedAccountId,
              "payout.amount": amount,
              "payout.currency": currency,
              "payout.status": payout.status,  // usually "paid"
              "payout.date": new Date()
            }
          },
          { new: true }
        );
    
        res.json({ success: true, payout, updatedPayment });
      } catch (err) {
        console.error("Payout error:", err.message);
        res.status(500).json({ error: "Payout failed" });
      }
};




module.exports = {
    getPlans,
    createCheckOut,
    stripeWebhook,
    getAllPayments,
    createPayout, handleSignUp, handleLogin, handleSuccess, handleFail
}