const db = require('../models')
const { Transaction } = require('sequelize')
const Sequelize = require('sequelize')


verifyUserExist =async (phone,t)=>{
    try{
        const user = await db.sequelize
        .query(`select * from user where phoneUser = ${phone}`,{type:db.sequelize.QueryTypes.SELECT, transaction:t})
        .then(result=>result)
        
        if (user.length===1)return true
        else false
    }catch(err){throw new Error(err)}
    
}

exports.createTextDemand=async(req, res, next)=>{
    try{
        const t = await db.sequelize.transaction();
        // const {
        //     choosenExam,
        //     payingPhone,
        //     payingService,
        //     identification,
        //     medPersonnel,
        //     entryMethod
        // }=req.body
        await verifyUserExist(req.body.phone,t)
        t.commit()
        t.afterCommit(()=>{
            res.send('hello world')
        })
    }catch(err){return next(err)}
}