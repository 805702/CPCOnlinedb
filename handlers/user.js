const db = require('../models');

exports.getUser = async (req, res, next)=>{
    try{
        const phoneUser = req.body.phone
        let user = await db.sequelize.query(`select * from user where phoneUser=${phoneUser} && statusUser='active'`,{
            type:db.sequelize.QueryTypes.SELECT
        });
        let resObj ={}
        if(user.length===1){
            resObj={
                phoneUser:user[0].phoneUser,
                firstNameUser:user[0].firstNameUser,
                lastNameUser:user[0].lastNameUser,
                genderUser:user[0].genderUser,
                dateOfBirthUser:user[0].dateOfBirthUser,
                roleUser:user[0].roleUser,
                emailUser:user[0].emailUser
            }
        }
        else resObj={
            roleUser:'visitor'
        }
        res.json({user:resObj})
    }catch(err){
        return next(err);
    }
}