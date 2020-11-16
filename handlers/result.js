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
    }catch(err){ throw Error(err)}
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
        WHERE t1.dateConfirmed IS NOT NULL and t1.paymentStatus='resolved' and user.phoneUser=${phoneUser}
        ORDER BY t1.dateCreated desc
        `,{
            type:db.sequelize.QueryTypes.SELECT
        })
    }catch(err){throw Error(err)}
}


async function dbDemandHasExamJoin(phoneUser){
    try{
        // WHERE t1.dateConfirmed IS NOT NULL and t1.paymentStatus='resolved' and user.phoneUser = ${phoneUser}
        return  await db.sequelize.query(`
        SELECT idMedExamDemandExamination, t1.idMedicalExamDemand, nameExamination, daysToResult, bValue, GIN, t1.resultRef, t1.dateCreated
        FROM 
        user INNER JOIN medicalExamDemand t1  ON user.idUser = t1.idUser
        INNER JOIN medicalExamDemand_has_Examination t2 ON t1.idMedicalExamDemand = t2.idMedicalExamDemand
        INNER JOIN examination t3 ON t2.idExamination = t3.idExamination
        WHERE (t1.dateConfirmed IS NOT NULL or t1.entryMethod='special') and t1.paymentStatus='resolved' and user.phoneUser = ${phoneUser}
        ORDER BY t1.dateCreated desc
        `,{
            type:db.sequelize.QueryTypes.SELECT
        })
    }catch(err){throw  Error(err)}
}

async function dbGetSpecialResults(phoneUser){
    try {
        return await db.sequelize.query(`
        SELECT SIN as idMedExamDemandExamination, idMedicalExamDemand, SIN as nameExamination, SIN as daysToResult, SIN as bValue, GIN, resultRef, dateCreated 
        FROM User
        INNER JOIN medicalExamDemand 
        ON user.idUser = medicalExamDemand.idUser 
        WHERE resultRef IS NOT NULL AND phoneUser =${phoneUser} AND entryMethod='special' AND GIN IS NOT NULL   ;
        `,{
            type:db.sequelize.QueryTypes.SELECT
        });
    } catch (error) {throw Error(err)}
}

exports.getPatientResultData = async (req, res, next)=>{
    try{
        const phoneUser = req.body.phone
        let specialJoin = await dbGetSpecialResults(phoneUser)
        let medExamResult = await dbmedicalExamResult(phoneUser)
        let normalJoin = await dbDemandHasExamJoin(phoneUser)
        let demandHasExamJoin = [...normalJoin, ...specialJoin]
        let user = await getUser(phoneUser)
        res.json({ demandHasExamJoin, medExamResult, user })
    }catch(err){
        return next(err);
    }
}

async function setPostpone(postpone, GIN, dueDate, dbAudit, t){
    try{
        return await db.sequelize.query(`
        UPDATE medicalExamresult t1
        INNER JOIN medicalExamDemand_has_Examination t2
        ON t1.idMedExamDemandExamination = t2.idMedExamDemandExamination
        INNER JOIN medicalExamDemand t3
        ON t2.idMedicalExamDemand = t3.idMedicalExamDemand
        SET dueDate= '${postpone}'
        WHERE t3.GIN ='${GIN}' and t1.dueDate='${dueDate}'
        `,{
            type: db.sequelize.QueryTypes.UPDATE,
            transaction: t
        });
    }catch(err){throw Error(err)}
}

async function setResultResultRef(resultRef, GIN, dueDate, idUser, t){
    try{
        return await db.sequelize.query(`
        UPDATE medicalExamResult t1
        INNER JOIN medicalExamDemand_has_Examination t2
        ON t1.idMedExamDemandExamination = t2.idMedExamDemandExamination
        INNER JOIN medicalExamDemand t3
        ON t2.idMedicalExamDemand = t3.idMedicalExamDemand
        SET t1.resultRef='${resultRef}',
            t1.uploadedBy=${idUser},
            t1.dateUploaded=current_timestamp,
            t1.receptionStatus='done'
        WHERE t3.GIN ='${GIN}' AND t1.dueDate='${dueDate}' AND t1.resultRef IS NULL
        `,{
            type: db.sequelize.QueryTypes.UPDATE,
            transaction: t
        });
    }catch(err){throw Error(err)}
}

async function setDemandResultRef(resultRef, GIN, dueDate, t){
    try{
        return await db.sequelize.query(`
        UPDATE medicalExamDemand t1
        INNER JOIN medicalExamDemand_has_Examination t2
        ON t1.idMedicalExamDemand = t2.idMedicalExamDemand
        INNER JOIN medicalExamResult t3
        ON t2.idMedExamDemandExamination = t3.idMedExamDemandExamination
        SET t1.resultRef='${resultRef}',
            t1.receptionStatus = 'done'
        WHERE t1.GIN ='${GIN}' AND t3.dueDate='${dueDate}'
        `,{
            type: db.sequelize.QueryTypes.UPDATE,
            transaction: t
        });
    }catch(err){throw Error(err)}
}

async function dbPostponeIds(GIN, dueDate, t){
    try{
        return await db.sequelize.query(`
        SELECT t3.idMedicalExamResult
        FROM MedicalExamDemand t1
        INNER JOIN MedicalExamDemand_has_Examination t2
        ON t1.idMedicalExamDemand =t2.idMedicalExamDemand
        INNER JOIN MedicalExamResult t3
        ON t2.idMedExamDemandExamination = t3.idMedExamDemandExamination
        WHERE t1.GIN = '${GIN}' and t3.dueDate='${dueDate}'
        `,{
            type:db.sequelize.QueryTypes.SELECT,
            transaction: t
        })
    }catch(err){throw new Error(err)}
}

async function postponeAudit(idUser, resIdList, oldDueDate, t){
    try{
        let values = resIdList.map(anId=>{
            return `(${oldDueDate}, ${anId.idMedicalExamResult}, ${idUser})`;
        })

        values = values.join(' ')
        if(resIdList.length!==0)
        return await db.sequelize.query(`
        INSERT INTO MedicalExamResultAudit (oldDueDate, idMedicalExamResult, changedBy)
        VALUES ${values}
        `,{
            type: db.sequelize.QueryTypes.INSERT,
            transaction: t
        })
        else return [null,0]
    }catch(err){throw new Error(err)}
}



exports.postponeResult = async(req, res, next) =>{
    try{
        const {postpone, GIN, idUser, dueDate} = req.body
        const t = await db.sequelize.transaction();
        let dbIds = await dbPostponeIds(GIN, dueDate, t)
        let dbAudit = postponeAudit(idUser, dbIds, dueDate, t)
        let dbRes = await setPostpone(postpone, GIN, dueDate, dbAudit, t)
        t.commit();
        t.afterCommit(() => {
          res.json({dbRes});
        });
    }catch(err){return next(err)}
}

exports.uploadDemandResult=async( req, res, next )=>{
    try {
        const t = await db.sequelize.transaction();
        const { GIN, idUser, dueDate } = req.body
        let path = req.file.path.split('\\')[1]

        const dbResultResultRef = await setResultResultRef(path, GIN, dueDate, idUser, t)
        const dbDemandResultRef = await setDemandResultRef(path, GIN, dueDate, t)
        t.commit();
        t.afterCommit(() => {
          return res.json({success:dbDemandResultRef});
        });
    } catch (err) {return next(err)}
}

function MySQLDateFormater(initialDate, increment) {
  let supDate = new Date(initialDate);
  supDate = supDate.setDate(supDate.getDate() + increment);

  supDate = new Date(supDate).toDateString().split(" G")[0];
  supDate = supDate.split(" ");
  let year = supDate[3];
  let month = 00;
  let day = supDate[2];
  switch (supDate[1]) {
    case "Jan":
      month = "01";
      break;
    case "Feb":
      month = "02";
      break;
    case "Mar":
      month = "03";
      break;
    case "Apr":
      month = "04";
      break;
    case "May":
      month = "05";
      break;
    case "Jun":
      month = "06";
      break;
    case "Jul":
      month = "07";
      break;
    case "Aug":
      month = "08";
      break;
    case "Sep":
      month = "09";
      break;
    case "Oct":
      month = "10";
      break;
    case "Nov":
      month = "11";
      break;
    case "Dec":
      month = "12";
      break;
    default:
      break;
  }

  return [year, month, day].join("-");
}

exports.getDueResults=async (req, res, next)=>{
    try{
        let theDate = MySQLDateFormater(Date.now(), 0)
        const dbRes = await db.sequelize.query(`
        SELECT t3.dueDate, t1.GIN
        FROM MedicalExamDemand t1
        INNER JOIN MedicalExamDemand_has_Examination t2
        ON t1.idMedicalExamDemand = t2.idMedicalExamDemand
        INNER JOIN MedicalExamResult t3 
        ON t2.idMedExamDemandExamination = t3.idMedExamDemandExamination
        WHERE t3.dueDate <= '${theDate}' AND t3.resultRef IS NULL and t1.GIN  IS NOT NULL
        ORDER BY t3.dueDate ASC
        `,{
            type:db.sequelize.QueryTypes.SELECT
        })

        res.json({dbRes})
    }catch(err){return next(err)}
}

async function lookForPatient(phonePatient, t){
    try {
        let dbRes = await db.sequelize.query(`
        SELECT idUser
        FROM  User
        WHERE phoneUser = ${phonePatient}
        `,{
            type:db.sequelize.QueryTypes.SELECT,
            transaction:t
        })

        if(dbRes.length===1) return dbRes[0].idUser
        return false
    } catch (error) {return Error(error)}
}

async function createPatientWithPhone(phonePatient,t){
    try {
        let dbRes = await db.sequelize.query(`
        INSERT INTO User (phoneUser,idTown)
        VALUES (${phonePatient}, 1)
        `,{
            type:db.sequelize.QueryTypes.INSERT,
            transaction:t
        })
        return dbRes[0]
    } catch (error) {return Error(error)}
}

async function createSpecialDemand(idPatient, GIN, resultRef, t){
    try {
        let dbRes = await db.sequelize.query(`
        INSERT INTO medicalExamDemand (paymentStatus, receptionStatus, entryMethod, GIN, idUser, idAgency, resultRef )
        VALUES ('resolved', 'done', 'special', '${GIN}', ${idPatient}, 1, '${resultRef}' )
        `,{
            type:db.sequelize.QueryTypes.INSERT,
            transaction: t
        })

        return dbRes[0]
    } catch (error) {return Error(error)}
}

async function lookForDemand(GIN, t){
    try {
        let dbRes = await db.sequelize.query(`
        SELECT idMedicalExamDemand
        FROM medicalExamDemand
        WHERE GIN = '${GIN}'
        `,{
            type:db.sequelize.QueryTypes.SELECT,
            transaction: t
        })

        if(dbRes.length ===1 ) return dbRes[0].idMedicalExamDemand
        return false
    } catch (error) {return Error(error)}
}

async function createSpecialPayment(idDemand, t){
    try {
        let dbRes = await db.sequelize.query(`
        INSERT INTO payment (paymentStatus, idMedicalExamDemand, dateResolved)
        VALUES('resolved', ${idDemand}, current_timestamp);
        `,{
            type:db.sequelize.QueryTypes.INSERT,
            transaction: t
        });

        return dbRes[0]
    } catch (error) {return Error(error)}
}

exports.specialResults=async(req, res, next)=>{
    try {
        const t = await db.sequelize.transaction();
        const { GIN, phonePatient, idUploader } = req.body
        let path = req.file.path.split('\\')[1]

        let idPatient = await lookForPatient(phonePatient, t)
        if(!idPatient)idPatient = await createPatientWithPhone(phonePatient, t)
        let idDemand = await lookForDemand(GIN, t)
        let idPayment = null
        if(!idDemand){
            idDemand = await createSpecialDemand(idPatient, GIN, path, t)
            idPayment = await createSpecialPayment(idDemand,t)
        }
        else throw new Error("This GIN already Exist")
        t.commit();
        t.afterCommit(() => {
          return res.json({success:idPayment});
        });
    } catch (error) {return next (error)}
}