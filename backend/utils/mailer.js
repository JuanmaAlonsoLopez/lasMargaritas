const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    
    service: 'gmail',
    auth:{
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
    
});
transporter.verify((err, success) => {
  if (err) console.error('Mailer error:', err);
  else    console.log('Mailer is ready to send');
});
module.exports = transporter;