const db = require("../models");

async function searchExamCategory (nameExamCategory){
    try {
        let dbRes = await db.sequelize.query(`
        SELECT idExamCategory 
        FROM examCategory
        WHERE nameExamCategory = '${nameExamCategory.toUpperCase()}'`,{type:db.sequelize.QueryTypes.SELECT})

        console.log(dbRes)
        if(dbRes.length===0)return true
        else return false
    } catch (error) {throw Error(error)}
}

exports.createExamCategory=async(req, res, next)=>{
    try {
        const { nameExamCategory, idUser } = req.body
        if(await searchExamCategory(nameExamCategory)){
            let dbRes = await db.sequelize.query(`
            INSERT INTO ExamCategory (nameExamCategory, createdBy)
            VALUES ('${nameExamCategory.toUpperCase()}', ${idUser})
            `,{
                type:db.sequelize.QueryTypes.INSERT
            })
            return res.json({dbRes:dbRes[0]})
        }else throw new Error("A Category already exist with this name")
    } catch (error) {return next(error)}
}

exports.getAllCategories=async(req,res,next)=>{
    try {
        let dbRes = await db.sequelize.query(`
        SELECT idExamCategory, nameExamCategory
        FROM ExamCategory
        WHERE statusExamCategory ='active'
        `,{type:db.sequelize.QueryTypes.SELECT})
        return res.json({dbRes})
    } catch (error) {return next(error)}
}