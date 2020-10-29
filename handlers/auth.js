const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const db = require('../models');

//work on adding cron jobs to make otp codes invalid
//work on generating the correct generateEndDateTime

exports.register = async (req, res, next)=>{
    try{
        const user = req.body.pwd
        const hashed = await bcrypt.hash(user, 10);
        // user.pwd=hashed

        const ans = await bcrypt.compare(user, hashed)

        res.json(hashed);
    }catch(err){
        return next(err);
    }
}


function generateOTPCode(){
    return Math.floor(Math.random() * 9000) + 1000;
}

async function createOTP (phone){
    try{
        return await db.sequelize
        .query(`INSERT INTO OTP (code,endDateTimeCode,phone) VALUES (${generateOTPCode()},"${generateEndDateTime()}", ${phone});`)
        .then(result=>{return true})
    }catch(err){throw new Error(err)}
}

async function findUser(phone){
    try{
        return await db.sequelize.query(`select * from user where phoneUser=${phone} and statusUser='active'`, {
            type:db.sequelize.QueryTypes.SELECT
        })
        .then(result=>result)
    }catch(err){throw new Error(err)}
}

async function findOTP(phone){
    try{
        return await db.sequelize
        .query(`select * from otp where phone=${phone} order by initiatedDateTimeCode desc`,{
            type:db.sequelize.QueryTypes.SELECT
        })
        .then(result=>{
            return result[0]
        })
    }catch(err){throw new Error(err)}
}

async function findValidOTP(phone){
    try{
        return await db.sequelize
        .query(`select * from otp where phone=${phone} and status='valid' order by initiatedDateTimeCode desc`,{
            type:db.sequelize.QueryTypes.SELECT
        })
        .then(result=>{
            return result[0]
        })
    }catch(err){throw new Error(err)}
}


async function updateOTP(otpId){
    try{
        return await db.sequelize
        .query(`update otp set status='invalid' where idOTP=${otpId}`)
        .then(result=>{return true})
    }catch(err) {throw new Error(err)}
}

function existingUserToken(user){
    const {phoneUser}=user
    return jwt.sign({phoneUser}, process.env.TOKENSECRET)
}

createLog = async(action, idUser)=>{
    try{
        return await db.sequelize
        .query(`insert into logs (nameEvent,idUser) values('${action}',${idUser})`)
    }catch(err){throw new Error(err)}
}

exports.loginPhone = async(req, res, next)=>{
    try{
        const phone = req.body.phone
        const result = await findUser(phone)
        if(result.length===0 || result[0].roleUser ==='patient'){
            //before you write a new code in the db delete the previous one.
            //make previous otpCode for this number invalid
            const otp = await findOTP(phone)
            console.log(otp)
            let  upDate=''
            if(otp!==undefined) upDate = await updateOTP(otp.idOTP)
            console.log(upDate)
            if((otp!==undefined && upDate) || otp===undefined){
                const createdOtp = await createOTP(phone)
                if(createdOtp===true){
                    //insert api to send code to user here
                    return res.json({method:'code'})
                } else throw new Error("Sequelize result for Insert is more than 2 in array")
            }else throw new Error('Could not update previous OTP to invalid')
        }
        return res.json({method:'password'})
    }catch(err){next(err);}
}


exports.login = async (req, res, next)=>{
    try{
        const phone =req.body.phone;
        const pwd = req.body.pwd;
        const method = req.body.method;

        switch(method){
            case 'password':
                let user = await findUser(phone)
                if(user.length===1 && user[0].roleUser !=='patient'){
                    const valid = await bcrypt.compare(pwd,user[0].passwordUser)
                    if(valid){
                        const logs = createLog('signin',user[0].idUser)//write to the logs table
                        if(logs.length!==2) console.log('there was a problem login this user signin')
                        return res.json({ role:user[0].roleUser, token:existingUserToken(user[0]) })
                        //prepare jwt and return
                    } else throw new Error ('Invalid Password')
                } else throw new Error('Many users with same phone')
                break;
            case 'code':
                let otp = await findValidOTP(phone)
                console.log(otp)
                if(otp!==undefined){
                    if(Number(pwd)===Number(otp.code)){
                        const user = await findUser(phone)
                        if(user.length===1 && user[0].roleUser==='patient'){
                            const upDate = await updateOTP(otp.idOTP) //make OTP code invalid
                            const logs = createLog('signin',user[0].idUser)//write to the logs table
                            if(logs.length!==2) console.log('there was a problem login this user signin')
                            if(!upDate) console.log('there was a problem removing OTPCode')
                            return res.json({ role:'patient', token:existingUserToken(user[0]) })//generate patient token
                        } 
                        const roleUser='visitor'
                        const phoneUser = phone
                        const token = jwt.sign({phoneUser}, process.env.TOKENSECRET)
                        return res.json({ role:roleUser, token:token })//generate visitor jwt and send as response
                    }else throw new Error('Invalid Code')
                }else throw new Error('No otp code for this number. resend code')
                break;
            default:
                return next(err);
                break;
        }

    }catch(err){return next(err);}
}

generateEndDateTime =()=>{
    let now = new Date().toUTCString().split(' GMT')[0].split(' ')
    switch(now[2]){
        case 'Jan':
            now[2]= 01;
            break;
        case 'Feb':
            now[2]= 02;
            break;
        case 'Mar':
            now[2]= 03;
            break;
        case 'Apr':
            now[2]= 04;
            break;
        case 'May':
            now[2]= 05;
            break;
        case 'Jun':
            now[2]= 06;
            break;
        case 'Jul':
            now[2]= 07;
            break;
        case 'Aug':
            now[2]= 08;
            break;
        case 'Sep':
            now[2]= 09;
            break;
        case 'Oct':
            now[2]= 10;
            break;
        case 'Nov':
            now[2]= 11;
            break;
        case 'Dec':
            now[2]= 12;
            break;
        default: break;
    }


    let time = now[4].split(':')
    time[0]=(Number(time[0])+1)%24
    time=time[0]+':'+time[1]+':'+time[2]
    now = now[3]+'-'+now[2]+'-'+now[1]+' '+time
    return now;
}