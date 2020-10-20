const db = require('../models')
const { Transaction } = require('sequelize')
const Sequelize = require('sequelize')

generateSIN=async(t)=>{
    try{
        let stopGeneration=false;
        let newSIN=0
        do {
            newSIN = Math.floor(Math.random() * 90000000) + 10000000;
            let res= awaitdb.sequelize.query(`select * from MedicalExamDemand where MedicalExamDemand.SIN='${newSIN}'`,{
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

dbUser =async (iden, t)=>{
    try{
        let user = await db.sequelize
        .query(`select * from user where phoneUser = ${iden.phone}`,{type:db.sequelize.QueryTypes.SELECT, transaction:t})
        .then(result=>result)

        if (user.length===1) return user[0].idUser
        else return await createUser(iden, t)

        return userId
    }catch(err){throw new Error(err)}
    
}

dbMedPersonnel = async(med, t)=>{
    try{
        let medP = await db.sequelize
        .query(`select * from MedicalPersonnel where title=${med.title} and name=${med.name}`,{
            type:db.sequelize.QueryTypes.SELECT,
            transaction:t
        })
        .then(result=>result)

        if(medP.length!==1)return medP[0].idMedicalPersonnel
        else return await createMedPersonnel(med, t)
    }catch(err){throw new Error(err)}
}

dbDemand=async(idUser, idMedicalPersonnel, demandAmount, t)=>{
    try{
        return await db.sequelize
        .query(`insert into MedicalExamDemand (entryMethod, SIN, demandAmount, idUser, idMedicalPersonnel, idAgency)
            values(
                'text',
                '${await generateSIN(t)}',
                ${demandAmount},
                ${idUser},
                ${idMedicalPersonnel},
                ${1}
            )`,{
                type:db.sequelize.QueryTypes.SELECT,
                transaction:t
        }).then(result=>result[0])

    }catch(err){throw new Error(err)}
}

dbPayment=async(amount, payingPhone, payingService, idMedicalExamDemand,t)=>{
    try{
        return await db.sequelize
        .query(`insert into payment (amount, payingPhone, payingService, idMedicalExam)
            values(
                ${amount},
                ${payingPhone},
                '${payingService}',
                ${idMedicalExam}
            )`,{
                type:db.sequelize.QueryTypes.INSERT,
                transaction:t
            }
        ).then(result=>result[0])
    }catch(err){throw new Error(err)}
}

createMedPersonnel =async(med, t)=>{
    try{
        const newMed = await db.sequelize.query(`
            insert into MedicalPersonnel (title, name) 
            values(
                '${med.title}',
                '${med.name}',
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
                ${iden.email?iden.email.toString():null}
            )`,{
                type:db.sequelize.QueryTypes.INSERT,
                transaction:t
            }
        ).then(result=>result[0])

        return newUser
    }catch(err){throw new Error(err)}
}

createDemandTransaction=async(identification, medPersonnel,demandAmount, payingPhone, payingService, t)=>{
    let userExist = await dbUser(identification, t)
    let medExist = await dbMedPersonnel(medPersonnel, t)
    let demandExist = await dbDemand(userExist, medExist, demandAmount, t)
    let payment = await dbPayment(demandAmount, payingPhone, payingService, demandExist, t)
}

exports.createTextDemand=async(req, res, next)=>{
    try{
        const t = await db.sequelize.transaction();
        // const {
        //     choosenExam[array of id's]<[13,16]>,
        //     payingPhone<Number> 657140183,
        //     payingService"String" "OM",
        //     medPersonnel:{name:'', title:''}
        //     entryMethod: "we already know that it is text"
        // }=req.body

        const {
            choosenExam,
            payingPhone,
            payingService,
            identification,
            medPersonnel,
            entryMethod
        } = req.body

        await createDemandTransaction(identification, medPersonnel, t)
        t.commit()
        t.afterCommit(()=>{
            res.json({userId: userExist})
        })
    }catch(err){return next(err)}
}