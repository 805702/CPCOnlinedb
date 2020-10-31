const db = require('../models')
const { Transaction } = require('sequelize')
const Sequelize = require('sequelize')

generateSIN=async(t)=>{
    try{
        let stopGeneration=false;
        let newSIN=0
        do {
            newSIN = Math.floor(Math.random() * 90000000) + 10000000;
            let dbRes = await db.sequelize.query(`select * from MedicalExamDemand where MedicalExamDemand.SIN='${newSIN}'`,{
                type:db.sequelize.QueryTypes.SELECT,
                transaction:t
            })

            if (dbRes.length===0) stopGeneration=true

        }while (!stopGeneration);
        return newSIN;
    }catch(err){throw new Error(err)}
}

function MySQLDateFormater(initialDate, increment){
    let supDate = new Date(initialDate)
    supDate = supDate.setDate(supDate.getDate()+increment)

    supDate = new Date(supDate).toDateString().split(' G')[0]
    supDate = supDate.split(' ')
    let year = supDate[3]
    let month = 00
    let day = supDate[2]
    switch(supDate[1]){
        case 'Jan':
            month= "01";
            break;
        case 'Feb':
            month= "02";
            break;
        case 'Mar':
            month= "03";
            break;
        case 'Apr':
            month= "04";
            break;
        case 'May':
            month= "05";
            break;
        case 'Jun':
            month= "06";
            break;
        case 'Jul':
            month= "07";
            break;
        case 'Aug':
            month= "08";
            break;
        case 'Sep':
            month= "09";
            break;
        case 'Oct':
            month= "10";
            break;
        case 'Nov':
            month= "11";
            break;
        case 'Dec':
            month= "12";
            break;
        default: break;
    }

    return ([year,month,day].join('-'))
}

async function dbUser (iden, t){
    try{
        let user = await db.sequelize
        .query(`select * from user where phoneUser = ${iden.phone}`,{type:db.sequelize.QueryTypes.SELECT, transaction:t})

        if (user.length===1) return user[0].idUser
        else return createUser(iden, t)

    }catch(err){throw new Error(err)}
    
}

function toTitleCase(data){
    let data1 = data.toLowerCase().split(' ')
    data1 = data1.map(iData=>{
        return iData.charAt(0).toUpperCase()+iData.substring(1)
    })
    return data1.join(' ')
}

async function dbMedPersonnel (med, t){
    try{
        med.name = toTitleCase(med.name)
        if(med.name==='' || med.title===''){
            med.title='Dr'
            med.name='XX'
        }
        let medP = await db.sequelize
        .query(`select * from MedicalPersonnel where title='${med.title}' and name= '${med.name}'`,{
            type:db.sequelize.QueryTypes.SELECT,
            transaction:t
        })

        if(medP.length===1)return medP[0].idMedicalPersonnel
        else return await createMedPersonnel(med, t)
    }catch(err){throw new Error(err)}
}

async function dbDemand(idUser, idMedicalPersonnel, demandAmount, entryMethod, t){
    //the 1 in the insert values is the idAgency
    try{
        let dbRes = await db.sequelize
        .query(`insert into MedicalExamDemand (entryMethod, SIN, demandAmount, idUser, idMedicalPersonnel, idAgency)
        values(
            '${entryMethod}',
            '${await generateSIN(t)}',
            ${demandAmount},
            ${idUser},
            ${idMedicalPersonnel},
            ${1}
            )`,{
                type:db.sequelize.QueryTypes.INSERT,
                transaction:t
        })
        return dbRes[0]
    }catch(err){throw new Error(err)}
}

async function dbPayment(amount, payingPhone, payingService, idMedicalExamDemand,t){

    try{
        let dbRes = await db.sequelize
        .query(`insert into payment (amount, payingPhone, payingService, idMedicalExamDemand)
            values(
                ${amount},
                ${payingPhone},
                '${payingService.toLowerCase()}',
                ${idMedicalExamDemand}
            )`,{
                type:db.sequelize.QueryTypes.INSERT,
                transaction:t
            }
        )

        return dbRes[0]
    }catch(err){throw new Error(err)}
}

async function createMedicalExamDemand_has_Examination(values, t){
    try{
        let res =  await db.sequelize
        .query(`insert into MedicalExamDemand_has_Examination (idMedicalExamDemand, idExamination)
            values ${values}`,{ types:db.sequelize.QueryTypes.INSERT, transaction:t })
        return res
    }catch(err){throw new Error()}
}

async function dbMedicalExamDemand_has_Examination (idMedicalExamDemand, examIdlist, t) {
    try{
        let final = examIdlist.map((examId,index)=>{
            if(index+1===examIdlist.length)return `(${idMedicalExamDemand},${examId})`
            return `(${idMedicalExamDemand},${examId}),`
        })
        let values = final.join(' ')
        let dbRes = await createMedicalExamDemand_has_Examination(values,t)
        const cntStart= dbRes[0]
        let rtnArr = examIdlist.map((examId, index)=>{
            return cntStart+index
        })
        return rtnArr
    }catch(err){throw new Error(err)}
}

async function examsDueDate (values, t){
    try{
        return await db.sequelize.query(`
                SELECT idMedExamDemandExamination, daysToResult 
                FROM examination 
                INNER JOIN medicalExamDemand_has_examination 
                ON examination.idExamination = medicalExamDemand_has_examination.idExamination 
                WHERE ${values}`,{
            type:db.sequelize.QueryTypes.SELECT,
            transaction:t
        })
    }catch(err){throw new Error(err)}
}

async function dbMedExamResult_insertMany(values,t){
    try{
        return await db.sequelize
        .query(`
        INSERT INTO MedicalExamResult (initialDueDate, dueDate, idMedExamDemandExamination)
        VALUES ${values}
        `,{
            type:db.sequelize.QueryTypes.INSERT,
            transaction:t
        })
    }catch(err){throw new Error(err)}
}

async function dbMedicalExamResult (idMedExamDemandHasExamList, t){
    try{
        let interValues = idMedExamDemandHasExamList.map((anId, index)=>{
            if(index=== 0) return `idMedExamDemandExamination = ${anId}`
           return ` or idMedExamDemandExamination = ${anId}`
        })
        interValues = interValues.join(' ')
        let intermediary = await examsDueDate(interValues,t)

        let insertValues = intermediary.map((anInter, index)=>{
            let initialDue = MySQLDateFormater(new Date().toUTCString(), anInter.daysToResult)
            if(index+1===intermediary.length) return `('${initialDue}', '${initialDue}', ${anInter.idMedExamDemandExamination})`
            return `('${initialDue}', '${initialDue}', ${anInter.idMedExamDemandExamination}),`
        })
        insertValues=insertValues.join(' ')
        let dbInsert = await dbMedExamResult_insertMany(insertValues, t);

        let cntStart = dbInsert[0]
        let rtnArr = intermediary.map((examId, index)=>{
            return cntStart+index
        })
        return rtnArr
    }catch(err){throw new Error(err)}
}

async function createMedPersonnel (med, t){
    try{
        const newMed = await db.sequelize.query(`
            insert into MedicalPersonnel (title, name) 
            values(
                '${med.title}',
                '${med.name}'
            )
        `,{
            type: db.sequelize.QueryTypes.INSERT,
            transaction: t
        })

        return newMed[0]
    }catch(err){throw new Error(err)}
}

async function createUser(iden,t){
    try{
        const newUser= await db.sequelize
        .query(`insert into user
            (
                phoneUser,
                firstNameUser,
                dateOfBirthUser,
                genderUser,
                roleUser,
                lastNameUser,
                idTown,
                emailUser
            )
             values(
                ${iden.phone},
                '${iden.fname}',
                '${iden.dob}',
                '${iden.gender.toLowerCase()}',
                '${"patient"}',
                '${iden.lname}',
                ${1},
                '${iden.email?iden.email.toString():null}'
            )`,{
                type:db.sequelize.QueryTypes.INSERT,
                transaction:t
            }
        )

        return newUser[0]
    }catch(err){throw new Error(err)}
}

async function createDemandTransaction (identification, medPersonnel,demandAmount, payingPhone, payingService, examIdlist, entryMethod, t){
    try{
        let userExist = await dbUser(identification, t)
        let medExist = await dbMedPersonnel(medPersonnel, t)
        let demandExist = await dbDemand(userExist, medExist, demandAmount, entryMethod, t)
        let paymentExist = await dbPayment(demandAmount, payingPhone, payingService, demandExist, t)
        let medExamDemandHasExamExist = await dbMedicalExamDemand_has_Examination(demandExist, examIdlist, t)
        let medicalExamResultExist = await dbMedicalExamResult(medExamDemandHasExamExist, t)

        let transactionSIN = await db.sequelize.query(`select SIN from medicalExamDemand where idMedicalExamDemand=${demandExist}`,{
            type:db.sequelize.QueryTypes.SELECT,
            transaction:t
        })
        return transactionSIN
    }catch(err){throw new Error(err)}
}

exports.createTextDemand=async(req, res, next)=>{
    try{
        const t = await db.sequelize.transaction();
        const {
            choosenExam,
            payingPhone,
            payingService,
            identification,
            medPersonnel,
            demandAmount,
            entryMethod
        } = req.body

        let transactionSIN = await createDemandTransaction(identification, medPersonnel, demandAmount, payingPhone, payingService, choosenExam, entryMethod, t)
        .catch(err=>{
            res.json({error:"Couldn't complete"})
            throw new Error(err)
        })
        t.commit()
        t.afterCommit(()=>{
            res.json(transactionSIN[0])
        })
    }catch(err){return next(err)}
}