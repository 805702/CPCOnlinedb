const db = require('../models');

exports.getUser = async (req, res, next)=>{
    try{
        const phoneUser = req.body.phone
        let user = await db.sequelize.query(`select phoneUser, firstNameUser, lastNameUser, genderUser, dateOfBirthUser, roleUser, emailUser from user where phoneUser=${phoneUser} && statusUser='active'`,{
            type:db.sequelize.QueryTypes.SELECT
        });
        if(user.length===1){
            res.json({user:user[0]})
        }
        else res.json({user:{roleUser:'visitor'}})
    }catch(err){
        return next(err);
    }
}