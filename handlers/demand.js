const db = require('../models')
const cloudinary = require('../utils/cloudinary')

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
        .query(`insert into MedicalExamDemand (entryMethod, SIN, demandAmount, idUser, idMedicalPersonnel, idAgency, paymentStatus)
        values(
            '${entryMethod}',
            '${await generateSIN(t)}',
            ${entryMethod==='text'?demandAmount:null},
            ${idUser},
            ${idMedicalPersonnel},
            ${1},
            '${entryMethod==='text'?'resolved':'pending'}'
            )`,{
                type:db.sequelize.QueryTypes.INSERT,
                transaction:t
        })
        return dbRes[0]
    }catch(err){throw new Error(err)}
}

async function dbPayment(amount, payingPhone, payingService, idMedicalExamDemand,entryMethod,t){

    try{
        let now = new Date().toUTCString()
        let dateResolved = MySQLDateFormater(now, 0) + ' ' +now.split(' ')[4]
        let dbRes = await db.sequelize
        .query(`insert into payment (amount, payingPhone, payingService, idMedicalExamDemand,paymentStatus, dateResolved)
            values(
                ${entryMethod==='text'?amount:null},
                ${entryMethod==='text'?payingPhone:null},
                ${entryMethod==='text'?`'${payingService.toLowerCase()}'`:null},
                ${idMedicalExamDemand},
                '${entryMethod==='text'?'resolved':'pending'}',
                ${entryMethod==='text'?`'${dateResolved}'`:null}
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
                '${iden.email?iden.email:null}'
            )`,{
                type:db.sequelize.QueryTypes.INSERT,
                transaction:t
            }
        )

        return newUser[0]
    }catch(err){throw new Error(err)}
}

async function createDemandTransaction (identification, medPersonnel,demandAmount, payingPhone, payingService, examIdlist, entryMethod, URL_s, t){
    try{
        let userExist = await dbUser(identification, t)
        let medExist = await dbMedPersonnel(medPersonnel, t)
        let demandExist = await dbDemand(userExist, medExist, demandAmount, entryMethod, t)
        let paymentExist = await dbPayment(demandAmount, payingPhone, payingService, demandExist, entryMethod, t)
        if(entryMethod==='text'){
            let medExamDemandHasExamExist = await dbMedicalExamDemand_has_Examination(demandExist, examIdlist, t)
            let medicalExamResultExist = await dbMedicalExamResult(medExamDemandHasExamExist, t)
        }else if(entryMethod==='image'){
            let images = await dbMedicalExamImage(demandExist, URL_s, t)
        }

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

        let transactionSIN = await createDemandTransaction(identification, medPersonnel, demandAmount, payingPhone, payingService, choosenExam, entryMethod, null, t)
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

// WHERE paymentStatus='resolved' and dateConfirmed IS NULL and GIN IS NULL and receptionStatus='pending'
async function dbToConfirmDemands(){
    try{
        return await db.sequelize.query(`
        SELECT SIN, dateCreated
        FROM MedicalExamDemand
        WHERE paymentStatus='resolved' and dateConfirmed IS NULL and GIN IS NULL and receptionStatus='pending'
        ORDER BY dateCreated DESC
        `,{
            type: db.sequelize.QueryTypes.SELECT
        })
    }catch(err){throw new Error(err)}
}

exports.getDemandsToConfirm = async(req,res,next)=>{
    try{
        let toConfirmDemands = await dbToConfirmDemands()
        res.json({toConfirm: toConfirmDemands})
    }catch(err){return next(err)}
}

exports.treatDemand = async(req,res,next)=>{
    try{
        let SIN = req.body.SIN
        let dbRes =  await db.sequelize.query(`
        UPDATE medicalExamDemand
        SET receptionStatus='treating'
        WHERE SIN='${SIN}'`,{
            type:db.sequelize.QueryTypes.UPDATE
        })

        res.json({dbRes})
    }catch(err){return next(err)}
}

async function dbRequestExams(SIN){
    try{
        return await db.sequelize.query(`
        SELECT t3.nameExamination
        FROM medicalExamDemand t1
        INNER JOIN medicalExamDemand_has_examination t2 
        ON t1.idMedicalExamDemand = t2.idMedicalExamDemand
        INNER JOIN examination t3
        ON t2.idExamination = t3.idExamination
        WHERE t1.SIN='${SIN}'
        `,{
            type:db.sequelize.QueryTypes.SELECT
        })
    }catch(err){throw new Error(err)}
}

async function dbPatient(SIN){
    try{
        return await db.sequelize.query(`
        SELECT phoneUser, firstNameUser, dateOfBirthUser, genderUser, lastNameUser
        FROM medicalExamDemand t1
        INNER JOIN User t2
        ON t1.idUser = t2.idUser
        WHERE t1.SIN = '${SIN}'
        `,{
            type: db.sequelize.QueryTypes.SELECT
        })
    }catch(err){throw new Error(err)}
}

async function dbMedP(SIN){
    try{
        return await db.sequelize.query(`
        SELECT t2.name, t2.title
        FROM medicalExamDemand t1
        INNER JOIN medicalPersonnel t2
        ON t1.idMedicalPersonnel = t2.idMedicalPersonnel
        WHERE t1.SIN = '${SIN}'
        `,{
            type: db.sequelize.QueryTypes.SELECT
        })
    }catch(err){throw new Error(err)}
}

exports.getSINData=async(req,res,next)=>{
    try{
        const SIN=req.body.SIN
        const requestExams = await dbRequestExams(SIN)
        const patient = await dbPatient(SIN)
        const medP = await dbMedP(SIN)

        res.json({requestExams, patient, medP})
    }catch(err){return next(err)}
}

async function dbConfirmDemand( SIN, GIN, confirmedBy){
    try{
        let now = new Date().toUTCString()
        return await db.sequelize.query(`
        UPDATE medicalExamDemand
        SET GIN = '${GIN}',
            dateConfirmed='${MySQLDateFormater(now, 0)} ${now.split(' ')[4]}',
            confirmedBy=${confirmedBy}
        WHERE SIN = '${SIN}'
        `,{
            type:db.sequelize.QueryTypes.UPDATE
        })
    }catch(err){throw new Error(err)}
}

async function dbConfirmedBy(phoneUser){
    try{
        return await db.sequelize.query(`
        select idUser from user where phoneUser=${phoneUser}
        `,{
            type:db.sequelize.QueryTypes.SELECT
        })
    }catch(err){throw new Error(err)}
}

exports.confirmDemand=async(req,res,next)=>{
    try{
        const { SIN, GIN, phoneUser } = req.body
        const confirmedBy = await dbConfirmedBy(phoneUser)
        const confirm = await dbConfirmDemand(SIN, GIN, confirmedBy[0].idUser)

        res.json({confirm})
    }catch(err){return next(err)}
}

function createMedExamImageValues(idMedicalExamDemand, URL_s){
    let values = URL_s.map(_=>{
        return `(${idMedicalExamDemand}, '${_}')`
    })
}

async function dbMedicalExamImage(idMedicalExamDemand, URL_s, t){
    try{
        const values = URL_s.map(_=>`(${idMedicalExamDemand}, '${_}')`)
        return await db.sequelize.query(`
        INSERT INTO MedicalExamImage (idMedicalExamDemand, imageRef)
        VALUES ${values}
        `,{
            type:db.sequelize.QueryTypes.INSERT,
            transaction:t
        })
    }catch(err){throw new Error(err)}
}

exports.createImageDemand=async(req, res, next)=>{
    try {
        const t = await db.sequelize.transaction();
        let URL_s = []
        const { dob, email, fname, gender, lname, phone, title, name, entryMethod } = req.body
        const identification = {dob, email, fname, gender, lname, phone}
        const medPersonnel = {title, name}
        // Upload image to cloudinary
        for (let index = 0; index < req.files.length; index++) {
            const element = req.files[index];
            const result = await cloudinary.uploader.upload(element.path)

            URL_s.push(result.secure_url)
        }

        let transactionSIN = await createDemandTransaction(
            identification,
            medPersonnel,
            null,
            null,
            null,
            null,
            entryMethod,
            URL_s,
            t
        )
        .catch(err=>{
            throw new Error(err)
            // res.json({error:"Couldn't complete"})
        })
        t.commit()
        t.afterCommit(()=>{
            res.json(transactionSIN[0])
        })
    } catch (err) { return next(err) }
}

exports.awaitingCompletion=async(req, res, next)=>{
    try{
        const { idUser } = req.body
        let dbRes = await db.sequelize.query(`
        SELECT dateCreated, SIN, t3.imageRef
        FROM user t1
        INNER JOIN medicalExamDemand t2
        ON t1.idUser = t2.idUser
        INNER JOIN medicalExamImage t3
        ON t2.idMedicalExamDemand = t3.idMedicalExamDemand
        WHERE t1.iduser = ${idUser} and t2.entryMethod='image' and t2.dateCompleted is null
        ORDER BY t2.dateCreated ASC
        `,{
            typ: db.sequelize.QueryTypes.SELECT
        })

        return res.json({dbRes})
    }catch(err){return next(err)}
}

async function updateToCompleteDemand(SIN, completedBy, demandAmount, t){
    try{
        return await db.sequelize.query(`
        UPDATE medicalExamDemand
        SET dateCompleted = current_timestamp,
            completedBy = ${completedBy},
            demandAmount = ${demandAmount}
        WHERE SIN = '${SIN}'
        `,{
            type:db.sequelize.QueryTypes.UPDATE,
            transaction: t
        })
    }catch(err){throw Error(err)}
}

async function getDemandId (SIN,t){
    try{
        let dbRes = await db.sequelize.query(`
            SELECT idMedicalExamDemand
            FROM medicalExamDemand
            WHERE SIN = '${SIN}'
        `, {
            type: db.sequelize.QueryTypes.SELECT,
            transaction:t
        })
    }catch(err){throw Error(err)}
}

async function updateToCompletePayment(SIN, amount, t){
    try{
        return await db.sequelize.query(`
        UPDATE payment t1
        INNER JOIN medicalExamDemand t2
        ON t1.idMedicalExamDemand = t2.idMedicalExamDemand
        SET amount = ${amount},
        WHERE t2.SIN = '${SIN}'
        `,{
            type:db.sequelize.QueryTypes.UPDATE,
            transaction:t
        })
    }catch(err){throw Error(err)}
}

exports.completeDemand=async(req, res, next)=>{
    try{
        const { SIN, completedBy, examIdList, demandAmount } = req.body
        const t = await db.sequelize.transaction();
        const updateDemand = await updateToCompleteDemand(SIN, completedBy, demandAmount, t)
        const updatePayment = await updateToCompletePayment(SIN, demandAmount, t)
        const idMedicalExamDemand = await getDemandId(SIN, t)
        const medExamDemandHasExamExist = await dbMedicalExamDemand_has_Examination(idMedicalExamDemand, examIdList, t);
        const medicalExamResult = await dbMedicalExamResult(medExamDemandHasExamExist, t);
        t.commit()
        t.afterCommit(()=>{
            res.json({res:true})
        })
    }catch(err){return next(err)}
}

async function dbAwaitingPayment(idUser){
    try{
        // WHERE t1.dateConfirmed IS NULL and t1.paymentStatus='resolved' and user.phoneUser = ${phoneUser}
        return  await db.sequelize.query(`
        SELECT idMedExamDemandExamination, t1.idMedicalExamDemand, nameExamination, daysToResult, bValue, SIN as GIN, t1.resultRef, t1.dateCreated
        FROM 
        user INNER JOIN medicalExamDemand t1  ON user.idUser = t1.idUser
        INNER JOIN medicalExamDemand_has_Examination t2 ON t1.idMedicalExamDemand = t2.idMedicalExamDemand
        INNER JOIN examination t3 ON t2.idExamination = t3.idExamination
        INNER JOIN payment t4 
        ON t4.idMedicalExamDemand = t1.idmedicalExamDemand
        WHERE t4.dateResolved IS NULL and t1.dateCompleted is not null and t1.paymentStatus='pending' and user.idUser = ${idUser}
        ORDER BY t1.dateCreated desc
        `,{
            type:db.sequelize.QueryTypes.SELECT
        })
    }catch(err){throw new Error(err)}
}

exports.awaitingPayment=async(req, res, next)=>{
    try{
        const { idUser } = req.body
        const demandHasExamJoin = await dbAwaitingPayment(idUser)
        

        return res.json({demandHasExamJoin})
    }catch(err){return next(err)}
}

async function updateToPayPayment(SIN,t){
    try{
        return await db.sequelize.query(`
        UPDATE payment t1
        INNER JOIN medicalExamDemand t2
        ON t1.idMedicalExamDemand = t2.idMedicalExamDemand
        SET paymentStatus ='resolved',
            dateResolved = current_timestamp
        WHERE t2.SIN = '${SIN}'
        `,{
            type: db.sequelize.QueryTypes.UPDATE,
            transaction: t
        })
    }catch(err){throw Error(err)}
}

async function updateToPayDemand(SIN, t ){
    try{
        return await db.sequelize.query(`
        UPDATE medicalExamDemand 
        SET paymentStatus = 'resolved'
        WHERE SIN  ='${SIN}'
        `, {
            type:db.sequelize.QueryTypes.UPDATE,
            transaction:t
        })
    }catch(err){throw Error(err)}
}

exports.completePayment=async(req,res,next)=>{
    try{
        const { SIN } = req.body
        const t = transaction
        const dbDemand = await updateToPayDemand(SIN, t)
        const dbPayment = await updateToPayPayment(SIN, t)
        t.commit()
        t.afterCommit(()=>{
            return res.json({res:true})
        })
    }catch(err){return next(err)}
}

async function dbAwaitingConfirmationExaminations(idUser){
    try{
        // WHERE t1.dateConfirmed IS NOT NULL and t1.paymentStatus='resolved' and user.phoneUser = ${phoneUser}

        return await db.sequelize.query(`
        SELECT t3.*
        FROM
        user INNER JOIN medicalExamDemand t1 ON user.idUser = t1.idUser
        INNER JOIN medicalExamDemand_has_Examination t2 ON t1.idMedicalExamDemand = t2.idMedicalExamDemand
        INNER JOIN medicalExamResult t3 ON t2.idMedExamDemandExamination = t3.idMedExamDemandExamination
        WHERE t1.dateConfirmed IS NULL and t1.paymentStatus='resolved' and user.idUser=${idUser}
        ORDER BY t1.dateCreated desc
        `,{
            type:db.sequelize.QueryTypes.SELECT
        })
    }catch(err){throw new Error(err)}
}

async function dbAwaitingConfirmation(idUser){
    try{
        // WHERE t1.dateConfirmed IS NULL and t1.paymentStatus='resolved' and user.phoneUser = ${phoneUser}
        return  await db.sequelize.query(`
        SELECT idMedExamDemandExamination, t1.idMedicalExamDemand, nameExamination, daysToResult, bValue, SIN as GIN, t1.resultRef, t1.dateCreated
        FROM 
        user INNER JOIN medicalExamDemand t1  ON user.idUser = t1.idUser
        INNER JOIN medicalExamDemand_has_Examination t2 ON t1.idMedicalExamDemand = t2.idMedicalExamDemand
        INNER JOIN examination t3 ON t2.idExamination = t3.idExamination
        WHERE t1.dateConfirmed IS NULL and t1.paymentStatus='resolved' and user.idUser = ${idUser}
        ORDER BY t1.dateCreated desc
        `,{
            type:db.sequelize.QueryTypes.SELECT
        })
    }catch(err){throw new Error(err)}
}

exports.awaitingConfirmation=async(req,res,next)=>{
    try{
        const {idUser} = req.body
        let medExamResult = await dbAwaitingConfirmationExaminations(idUser);
        let demandHasExamJoin = await dbAwaitingConfirmation(idUser);
        return res.json({ demandHasExamJoin, medExamResult});
    }catch(err){return next(err)}
}

exports.specialDemands = async(req, res, next)=>{
    try{
        const findPatientByPhone={createFictifUser}


    }catch(err){return next(err)}
}