const { Router } = require('express');
const { getPlans, createCheckOut, getAllPayments, createPayout, stripeWebhook,
     handleSignUp, handleLogin, handleSuccess, handleFail, handleAdminSignUp, 
     handleAdminLogin,
     getAdminDashboard,
     deletePayment,
     deleteAllPayments} = require('../controllers/route.controllers');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');
const router=Router()


router.get('/', getPlans)
router.get('/success', handleSuccess)
router.get('/cancel', handleFail)
router.post('/register',handleSignUp)
router.post('/login', handleLogin)
router.post('/checkout', authMiddleware, createCheckOut)
router.post('/webhooks', stripeWebhook)

//admin
router.post("/admin/dia/signup", handleAdminSignUp);
router.post("/admin/dia/login", handleAdminLogin);
router.get("/admin/dashboard", authMiddleware, adminMiddleware, getAdminDashboard);
router.get('/getpayment', authMiddleware, adminMiddleware, getAllPayments)
router.delete("/admin/dia/deletepayment/:id", authMiddleware, adminMiddleware, deletePayment);
router.delete("/admin/dia/deleteAllPayments", authMiddleware, adminMiddleware, deleteAllPayments);
router.post('/payout', authMiddleware, adminMiddleware, createPayout)

module.exports = router;