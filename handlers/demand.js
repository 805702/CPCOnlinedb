const db = require('../models')
const { Transaction } = require('sequelize')
const Sequelize = require('sequelize')


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

createDemandTransaction=async(identification, medPersonnel, t)=>{
    let userExist = await dbUser(identification, t)
    let medExist = await dbMedPersonnel(medPersonnel, t)
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

        const createExists = createDemandTransaction(identification, medPersonnel, t)
        t.commit()
        t.afterCommit(()=>{
            res.json({userId: userExist})
        })
    }catch(err){return next(err)}
}