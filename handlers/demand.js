const db = require('../models')
const { Transaction } = require('sequelize')
const Sequelize = require('sequelize')

generateSIN=async(t)=>{
    try{
        let stopGeneration=false;
        let newSIN=0
        do {
            newSIN = Math.floor(Math.random() * 90000000) + 10000000;
            await db.sequelize.query(`select * from MedicalExamDemand where MedicalExamDemand.SIN='${newSIN}'`,{
                type:db.sequelize.QueryTypes.SELECT,
                transaction:t
            })
            .then(result=>{
                if (result.length===0) stopGeneration=true
            })

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
            month= 01;
            break;
        case 'Feb':
            month= 02;
            break;
        case 'Mar':
            month= 03;
            break;
        case 'Apr':
            month= 04;
            break;
        case 'May':
            month= 05;
            break;
        case 'Jun':
            month= 06;
            break;
        case 'Jul':
            month= 07;
            break;
        case 'Aug':
            month= 08;
            break;
        case 'Sep':
            month= 09;
            break;
        case 'Oct':
            month= 10;
            break;
        case 'Nov':
            month= 11;
            break;
        case 'Dec':
            month= 12;
            break;
        default: break;
    }

    return ([year,month,day].join('-'))
}

dbUser =async (iden, t)=>{
    try{
        let user = await db.sequelize
        .query(`select * from user where phoneUser = ${iden.phone}`,{type:db.sequelize.QueryTypes.SELECT, transaction:t})
        .then(result=>result)

        if (user.length===1) return user[0].idUser
        else return await createUser(iden, t)
    }catch(err){throw new Error(err)}
    
}

function toTitleCase(data){
    let data1 = data.toLowerCase().split(' ')
    data1 = data1.map(iData=>{
        return iData.charAt(0).toUpperCase()+iData.substring(1)
    })
    return data1.join(' ')
}

dbMedPersonnel = async(med, t)=>{
    try{
        let name = toTitleCase(med.name)
        let medP = await db.sequelize
        .query(`select * from MedicalPersonnel where title='${med.title}' and name= '${name}'`,{
            type:db.sequelize.QueryTypes.SELECT,
            transaction:t
        })
        .then(result=>result)

        if(medP.length===1)return medP[0].idMedicalPersonnel
        else return await createMedPersonnel(med, t)
    }catch(err){throw new Error(err)}
}

dbDemand=async(idUser, idMedicalPersonnel, demandAmount, entryMethod, t)=>{
    //the 1 in the insert values is the idAgency
    try{
        return await db.sequelize
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
        }).then(result=>result[0])

    }catch(err){throw new Error(err)}
}

dbPayment=async(amount, payingPhone, payingService, idMedicalExamDemand,t)=>{

    try{
        return await db.sequelize
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
        ).then(result=>result[0])
    }catch(err){throw new Error(err)}
}

dbMedicalExamDemand_has_Examination = async(idMedicalExamDemand, examIdlist, t)=>{
    try{
        return examIdlist.map(async(examId)=>{
            try{
                return await db.sequelize
                .query(`insert into MedicalExamDemand_has_Examination (idMedicalExamDemand, idExamination)
                    values(
                        ${idMedicalExamDemand},
                        ${examId}
                    )`,{
                        types:db.sequelize.QueryTypes.INSERT,
                        transaction:t
                    }
                ).then(result=>{return {idIntermediary:result[0], examId:examId}})
            }catch(err){throw new Error(err)}
        })
    }catch(err){throw new Error(err)}
}

examsDueDate = async(examId, t)=>{
    try{
        if(Number(examId)===NaN)throw new Error('examID is not a number')
        return await db.sequelize
        .query(`select daysToResult from examination where idExamination = ${examId}`,{
            type:db.sequelize.QueryTypes.SELECT,
            transaction:t
        }).then(result=>{
            if(result.length!==0)returnresult[0]
            else throw new Error('Examination not found on exam table')
        })
    }catch(err){throw new Error(err)}
}

dbMedicalExamResult = async(idMedExamDemandHasExamList, t)=>{
    try{
        return idMedExamDemandHasExamList.map(async(medExamHasExamObj)=>{
            try{
                let examDue = await examsDueDate(medExamHasExamObj.examId,t)
                let initialDate = MySQLDateFormater(new Date.now().toUTCString(), examDue)
                
                return await db.sequelize
                .query(`insert into MedicalExamResult (initialDueDate, dueDate, idMedExamDemandExamination) 
                values(
                    '${initialDate}',
                    '${initialDate}',
                    ${medExamHasExamObj.idIntermediary}
                )`,{
                    type:db.sequelize.QueryTypes.INSERT,
                    transaction, t
                }).then(result=>result[0])
            }catch(err){throw new Error(err)}
        })
    }catch(err){throw new Error(err)}
}

createMedPersonnel =async(med, t)=>{
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
        }).then(result=>result[0])
        return newMed
    }catch(err){throw new Error(err)}
}

createUser=async(iden,t)=>{
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
        ).then(result=>result[0])

        return newUser
    }catch(err){throw new Error(err)}
}

createDemandTransaction=async(identification, medPersonnel,demandAmount, payingPhone, payingService, examIdlist, entryMethod, t)=>{
    try{
        let userExist = await dbUser(identification, t)
        let medExist = await dbMedPersonnel(medPersonnel, t)
        let demandExist = await dbDemand(userExist, medExist, demandAmount, entryMethod, t)
        let paymentExist = await dbPayment(demandAmount, payingPhone, payingService, demandExist, t)
        let medExamDemandHasExamExist = await dbMedicalExamDemand_has_Examination(demandExist, examIdlist, t)
        let medicalExamResultExist = await dbMedicalExamResult(medExamDemandHasExamExist, t)
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

        await createDemandTransaction(identification, medPersonnel, demandAmount, payingPhone, payingService, choosenExam, entryMethod, t)
        t.commit()
        t.afterCommit(()=>{
            res.json({success:'successfull'})
        })
    }catch(err){return next(err)}
}