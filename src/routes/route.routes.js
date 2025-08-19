const { Router } = require('express');
const { getPlans, createCheckOut, getAllPayments, createPayout, stripeWebhook, handleSignUp, handleLogin } = require('../controllers/route.controllers');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');
const router=Router()


router.get('/', getPlans)
router.post('/register',handleSignUp)
router.post('/login', handleLogin)
router.post('/checkout', authMiddleware, createCheckOut)
router.post('/webhooks', stripeWebhook)

//admin
router.get('/getpayment', authMiddleware, adminMiddleware, getAllPayments)
router.post('/payout', authMiddleware, adminMiddleware, createPayout)

module.exports = router;