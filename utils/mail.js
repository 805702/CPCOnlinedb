const nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "cpconline2020@gmail.com",
    pass: "builditbetter2021",
  },
});

var mailOptions =(toMail, reason, pwd)=> {
    let params = {
        from: "cpconline2020@gmail.com",
        to: `${toMail}`,
        subject: reason==='create'?"Your CPCOnline Access Password":"Your New CPCOnline Access Password",
        text: reason==='create'?`Your new CPCOnline accout has been created.
    this is your access password 
    ${pwd}
    Feel free to change this password when you sign in`:
        `Your CPCOnline password has been reset your new password is
         ${pwd} 
         Feel free to change when you sign in`
    }

    return params
};

module.exports.sendMail=( toMail, reason, pwd )=>{
    transporter.sendMail( mailOptions(toMail, reason, pwd), function (error, info) {
      if (error) {
          console.log(error);
          return false
      } else {
        console.log("Email sent: " + toMail);
        return true
      }
    });
}