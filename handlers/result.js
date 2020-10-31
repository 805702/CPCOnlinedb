const db = require('../models');

//1. the first information table is the medicalExamDemand_has_Examination that will have an inner join with the  examination table and another inner join with MedicalExamDemand.
// the structure of 1 will be the following columns: 
// idMedicalExamDemandExamination idMedicalExamDemand nameExamination daysToResult bValue GIN medicalExamDemand.dateCreated,

// 2. the second information table is the MedicalExamResult table of all the medicalExamDemand_has_Examination table.


async function getUser(phoneUser){
    try{
        let user = await db.sequelize.query(`select phoneUser, firstNameUser, lastNameUser, genderUser, dateOfBirthUser, roleUser, emailUser from user where phoneUser=${phoneUser} && statusUser='active'`,{
            type:db.sequelize.QueryTypes.SELECT
        });
        if(user.length===1) return {user:user[0]}
        return {user:{roleUser:'visitor'}}
    }catch(err){ throw new Error(err)}
}

async function dbmedicalExamResult(phoneUser){
    try{
        // WHERE t1.dateConfirmed IS NOT NULL and t1.paymentStatus='resolved' and user.phoneUser = ${phoneUser}

        return await db.sequelize.query(`
        SELECT t3.*
        FROM
        user INNER JOIN medicalExamDemand t1 ON user.idUser = t1.idUser
        INNER JOIN medicalExamDemand_has_Examination t2 ON t1.idMedicalExamDemand = t2.idMedicalExamDemand
        INNER JOIN medicalExamResult t3 ON t2.idMedExamDemandExamination = t3.idMedExamDemandExamination
        WHERE t1.dateConfirmed IS NULL and t1.paymentStatus<>'resolved' and user.phoneUser=${phoneUser}
        ORDER BY t1.dateCreated desc
        `,{
            type:db.sequelize.QueryTypes.SELECT
        })
    }catch(err){throw new Error(err)}
}


async function dbDemandHasExamJoin(phoneUser){
    try{
        // WHERE t1.dateConfirmed IS NOT NULL and t1.paymentStatus='resolved' and user.phoneUser = ${phoneUser}
        return  await db.sequelize.query(`
        SELECT idMedExamDemandExamination, t1.idMedicalExamDemand, nameExamination, daysToResult, bValue, GIN, t1.dateCreated
        FROM 
        user INNER JOIN medicalExamDemand t1  ON user.idUser = t1.idUser
        INNER JOIN medicalExamDemand_has_Examination t2 ON t1.idMedicalExamDemand = t2.idMedicalExamDemand
        INNER JOIN examination t3 ON t2.idExamination = t3.idExamination
        WHERE t1.dateConfirmed IS NULL and t1.paymentStatus<>'resolved' and user.phoneUser = ${phoneUser}
        ORDER BY t1.dateCreated desc
        `,{
            type:db.sequelize.QueryTypes.SELECT
        })
    }catch(err){throw new Error(err)}
}

exports.getPatientResultData = async (req, res, next)=>{
    try{
        const phoneUser = req.body.phone

        let medExamResult = await dbmedicalExamResult(phoneUser)
        let demandHasExamJoin = await dbDemandHasExamJoin(phoneUser)
        let user = await getUser(phoneUser)
        res.json({ demandHasExamJoin, medExamResult, user })
    }catch(err){
        return next(err);
    }
}