const request = require("request");

module.exports.sendSMS=(phone, message)=>{
    console.log(
      `https://api.1s2u.io/bulksms?username=ppwangun&password=perfect&mno=237${phone}&sid=CPCOnline&msg=${message}&mt=0&fl=0`
    );
    request
      .get(
        `https://api.1s2u.io/bulksms?username=ppwangun&password=perfect&mno=237${phone}&sid=CPCOnline&msg=${message}&mt=0&fl=0`
      )
      .on("response", (response) => {
        // console.log(error)
        // console.log(response)
        if (response.statusCode == 200) {
          //   console.log(response);
        }
      });
}