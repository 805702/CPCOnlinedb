const db = require('../models')
const { Transaction } = require('sequelize')
const Sequelize = require('sequelize')


verifyUserExist =async (iden,t)=>{
    try{
        const userId = ''
        const user = await db.sequelize
        .query(`select * from user where phoneUser = ${iden.phone}`,{type:db.sequelize.QueryTypes.SELECT, transaction:t})
        .then(result=>result)
        
        if (user.length===1)return 'found user with phone'
        else {
            return await createUser(iden, t)
        }
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
                ${iden.fname},
                ${iden.dob},
                ${iden.gender.toLowerCase()},
                ${"'patient'"},
                ${iden.lname},
                ${1},
                ${iden.email?iden.email:null}
            )`,{
                type:db.sequelize.QueryTypes.INSERT,
                transaction:t
            }
        ).then(result=>result)

        console.log(newUser)
        return newUser
    }catch(err){throw new Error(err)}
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

        const userExist = await verifyUserExist(identification,t)
        t.commit()
        t.afterCommit(()=>{
            res.send(userExist)
        })
    }catch(err){return next(err)}
}