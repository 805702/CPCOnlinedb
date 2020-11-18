const db = require('../models');

exports.getExams = async (req, res, next)=>{
    try{
        let exams = await db.sequelize.query(`
        SELECT idExamination,nameExamination,codeExamination,bValue,dateCreated,daysToResult,idExamCategory
        FROM examination
        WHERE statusExamination='active'`,{
            type:db.sequelize.QueryTypes.SELECT
        });

        res.json({exams})
    }catch(err){
        return next(err);
    }
}

exports.getManageExams = async(req, res, next)=>{
    try {
        const exams = await db.sequelize.query(`
        SELECT idExamination, nameExamination, codeExamination, bValue, dateCreated, daysToResult, nameExamCategory, statusExamination as status
        FROM Examination t1
        INNER JOIN ExamCategory t2
        ON t1.idExamCategory = t2.idExamCategory
        `,{type:db.sequelize.QueryTypes.SELECT})
        res.json({exams})
    } catch (error) {return next(error)}
}

async function verifyExamExist(codeExamination, nameExamination){
    try {
        let dbRes = await db.sequelize.query(`
        SELECT idExamination
        FROM Examination
        WHERE codeExamination = '${codeExamination}' or nameExamination ='${nameExamination}'
        `, {type: db.sequelize.QueryTypes.SELECT})

        console.log(dbRes)
        if(dbRes.length!==0)return false
        return true
    } catch (error) {throw Error(error)}
}

exports.createExam=async(req,res, next)=>{
    try {
        const { bValue, codeExamination, daysToResult, idExamCategory, nameExamination, idUser } = req.body
        if(await verifyExamExist(codeExamination, nameExamination)){
            let dbRes = await db.sequelize.query(`
            INSERT INTO Examination (bValue, codeExamination, daysToResult, idExamCategory, nameExamination, createdBy)
            VALUES (${bValue}, '${codeExamination}', ${daysToResult}, ${idExamCategory}, '${nameExamination}', ${idUser})
            `,{type:db.sequelize.QueryTypes.INSERT})
            if(dbRes[1]===1)res.json({res:true})
            else throw new Error("Could not create Exam")
        }else throw new Error('An exam already exist with same code or name')       
    } catch (error) {return next(error)}
}

async function updateExamination(nameExamination, codeExamination, bValue, statusExamination, daysToResult, idExamination, t){
    try {
        let prepareSet = ''
        if(nameExamination!==null) prepareSet += `nameExamination = '${nameExamination}'`
        if(codeExamination!==null) prepareSet += `codeExamination = '${codeExamination}'`
        if(statusExamination!==null) prepareSet += `statusExamination = '${statusExamination}'`
        if(bValue!==null) prepareSet += `bValue = ${bValue}`
        if(daysToResult!==null) prepareSet += `daysToResult = ${daysToResult}`
        return await db.sequelize.query(`
            UPDATE Examination
            SET ${prepareSet}
            WHERE idExamination =${idExamination}
        `,{
            type:db.sequelize.QueryTypes.UPDATE,
            transaction: t
        })
    } catch (error) {throw Error(error)}
}

async function createExamAudit(nameExamination, codeExamination, bValue, statusExamination, daysToResult, idExamination, changedBy, t){
    try {
        return await db.sequelize.query(`
            INSERT INTO ExaminationAudit (nameExamination, codeExamination, bValue, statusExamination, daysToResult, idExamination, changedBy )
            VALUES (
                ${nameExamination!==null?`'${nameExamination}'`:null}, 
                ${codeExamination!==null?`'${codeExamination}'`:null}, 
                ${bValue},
                ${statusExamination!==null?`'${statusExamination}'`:null}, 
                ${daysToResult}, 
                ${idExamination}, 
                ${changedBy}
            )
        `,{
            type:db.sequelize.QueryTypes.INSERT,
            transaction:t
        })
    } catch (error) {throw Error(error)}    
}

exports.updateExam= async(req, res, next)=>{
    try {
        const {nameExamination, codeExamination, bValue, statusExamination, daysToResult, idExamination, idUser} = req.body
        const t = await db.sequelize.transaction();

        const dbUpdate= await updateExamination(nameExamination, codeExamination, bValue, statusExamination, daysToResult, idExamination, t)
        const dbCreateExamAudit = await createExamAudit(nameExamination, codeExamination, bValue, statusExamination, daysToResult, idExamination, idUser, t)

        t.commit()
        t.afterCommit(()=>{
            res.json({res:true})
        })
    } catch (error) {return next(error)}
}