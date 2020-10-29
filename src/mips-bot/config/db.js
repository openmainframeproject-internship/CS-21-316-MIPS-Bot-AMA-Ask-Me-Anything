const mongoose = require('mongoose');

const connectDB = async()  => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
      sslValidate: false
    });

    // eslint-disable-next-line no-console
    console.log(
      `MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold
    );

  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(`Error: ${err.message}`.red);
    process.exit(1);
  }
};


module.exports = connectDB;
