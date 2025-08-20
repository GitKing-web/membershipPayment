require('dotenv').config()
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const connectDB = require('./src/configs/index.config')
const router = require('./src/routes/route.routes')
const app = express()
const PORT = process.env.PORT || 3001

//middlewares
app.use(express.json());
app.use(cors())

app.use(router)

app.listen(PORT, async() => {
    await connectDB()
        .then(() => { console.log('DB connected') })
        .catch((err) => console.log(err) )
    console.log('server running on port...', PORT);
})