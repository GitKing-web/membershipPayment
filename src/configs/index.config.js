const mongoose = require('mongoose')

mongoose.set('strictQuery', true)

const connectDB = async () => {
    mongoose.connect(process.env.NODE_ENV === 'development' ? process.env.LOCAL_MONGO_URI : process.env.PUBLIC_MONGO_URI)
}


module.exports = connectDB