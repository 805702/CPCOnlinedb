const db = require('../models');

exports.getExams = async (req, res, next)=>{
    try{
        let exams = await db.sequelize.query(`select idExamination,nameExamination,codeExamination,bValue,dateCreated,daysToResult,idExamCategory from examination where statusExamination='active'`,{
            type:db.sequelize.QueryTypes.SELECT
        });

        res.json({exams:exams})
    }catch(err){
        return next(err);
    }
}