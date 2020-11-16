const { PassThrough } = require('nodemailer/lib/xoauth2');
const db = require('../models');
const { sendMail } = require('../utils/mail');
const uuidV4 = require("uuid").v4();
const bcrypt = require("bcryptjs");
const { patch } = require('request');

exports.getUser = async (req, res, next)=>{
    try{
        const phoneUser = req.body.phone
        let user = await db.sequelize.query(`select phoneUser, firstNameUser, lastNameUser, genderUser, dateOfBirthUser, roleUser, emailUser from user where phoneUser=${phoneUser} && statusUser='active'`,{
            type:db.sequelize.QueryTypes.SELECT
        });
        if(user.length===1){
            res.json({user:user[0]})
        }
        else res.json({user:{roleUser:'visitor'}})
    }catch(err){
        return next(err);
    }
}

function generatePassword(){
    let newPass = uuidV4
    return newPass.toString().slice(0,8)
}

async function createPersonnelUser(body, pwd, t){
    try {
        const { dob, email, fname, gender, lname, phone, role } = body
        const dbRes = await db.sequelize.query(`
        INSERT INTO User (phoneUser, firstNameUser, dateOfBirthUser, genderUser, roleUser, passwordUser, emailUser, lastNameUser, idTown)
        VALUES (${phone}, '${fname}', '${dob}', '${gender.toLowerCase()}', '${role}', '${pwd}', '${email}', '${lname}', 1)
        `,{
            type:db.sequelize.QueryTypes.INSERT,
            transaction: t
        })
        if(dbRes.length===2)return dbRes[0]
        else throw new Error("Couldn't create user")
    } catch (error) {throw Error(error)}
}

async function createPartnerUser(body, pwd, t){
    try {
        const { email, phone, role } = body
        const dbRes = await db.sequelize.query(`
        INSERT INTO User (phoneUser, firstNameUser, dateOfBirthUser, genderUser, roleUser, passwordUser, emailUser, lastNameUser, idTown)
        VALUES (${phone}, null, null, null, '${role}', '${pwd}', '${email}', null, 1)
        `,{
            type:db.sequelize.QueryTypes.INSERT,
            transaction: t
        })
        if(dbRes.length===2)return dbRes[0]
        else throw new Error("Couldn create user")
    } catch (error) {throw Error(error)}
}

async function createPersonnel(idUser, idPersonnel, matricule, t){
    try {
        let dbRes = await db.sequelize.query(`
        INSERT INTO Personnel (personnelCreatedBy, idUser, matricule)
        VALUES (${idUser}, ${idPersonnel}, '${matricule}')
        `,{
            type:db.sequelize.QueryTypes.INSERT,
            transaction: t
        })
    } catch (error) {throw Error(error)}
}

async function createPartner(idUser, idPartner, name, reduction, t){
    try {
        let dbRes = await db.sequelize.query(`
        INSERT INTO Partner (partnerCreatedBy, idUser, reduction, name)
        VALUES (${idUser}, ${idPartner}, ${reduction}, '${name}')
        `,{
            type:db.sequelize.QueryTypes.INSERT,
            transaction:t
        })
    } catch (error) {throw Error(error)}
}

async function checkUser(email, phone, t){
    try {
        let dbRes = await db.sequelize.query(`
        SELECT idUser
        FROM User
        WHERE phoneUser=${phone} or emailUser = '${email}'
        `,{
            type:db.sequelize.QueryTypes.SELECT,
            transaction:t
        })

        if(dbRes.length!==0) throw new Error("User with phone or email already exists")
        else return {ans:'good'}
    } catch (error) {throw Error(error)}
}

exports.createUser = async (req, res, next)=>{
    try {
        const { email, role, phone } = req.body
        const t = await db.sequelize.transaction()
        let actionner = await checkUser(email, phone, t)
        if(actionner.ans ==='good'){
            const pwd = generatePassword()
            const hashed = await bcrypt.hash(pwd, 10);
            if(role!=='partner'){
                const { matricule, idUser, } = req.body
                const theUser = await createPersonnelUser(req.body, hashed, t)
                const personnel = await createPersonnel(idUser, theUser, matricule, t)
            }else {
                const { fname, reduction, idUser, } = req.body
                const theUser = await createPartnerUser(req.body, hashed, t)
                const partner = await createPartner(idUser, theUser, fname, reduction)
            }
            sendMail(email, 'create', pwd)
        }else throw new Error("User already Exist with credentials mail or phone")

        t.commit();
        t.afterCommit(() => {
          return res.json({ res: true });
        });
    } catch (error) {return next (error)}
}


async function getAllPersonnel(){
    try {
        return await db.sequelize.query(`
        SELECT phoneUser, statusUser, firstNameUser, dateOfBirthUser, genderUser, roleUser, emailUser, lastNameUser, matricule as specialData
        FROM User t1
        INNER JOIN Personnel t2
        ON t1.idUser = t2.idUser
        WHERE t1.roleUser <> 'partner'
        `,{
            type:db.sequelize.QueryTypes.SELECT
        })
    } catch (error) { throw Error(error)}
}

async function getAllPartner(){
    try {
        return await db.sequelize.query(`
        SELECT phoneUser, statusUser, name as firstNameUser, dateOfBirthUser, genderUser, roleUser, emailUser, lastNameUser, reduction as specialData
        FROM User t1
        INNER JOIN Partner t2
        ON t1.idUser = t2.idUser
        WHERE t1.roleUser='partner'
        `,{type:db.sequelize.QueryTypes.SELECT})
    } catch (error) {throw Error(err)}
}

exports.getAllUsers = async(req, res, next)=>{
    try {
        let personnel = await getAllPersonnel();
        let partner = await getAllPartner();

        let dbReturn = [...personnel, ...partner]
        res.json({dbReturn})
    } catch (error) {return next(error)}
}

exports.deleteUser = async(req, res, next)=>{
    try {
        const { phone, status } = req.body
        if(!isNaN(phone)){
            let dbRes = await db.sequelize.query(`
            UPDATE User
            SET statusUser='${status}'
            WHERE phoneUser = ${phone}
            `,{type:db.sequelize.QueryTypes.UPDATE})
            if(dbRes[1] !== 0)res.json({true:true})
            else throw new Error("Nothing touched")
        }else throw new Error('Invalid phone')
    } catch (error) {return next(error)}
}

exports.resetPassword = async (req, res, next)=>{
    try {
        const { phone, email } =req.body
        const pwd = generatePassword();
        const hashed = await bcrypt.hash(pwd, 10);
        if(!isNaN(phone)){
            let dbRes = await db.sequelize.query(`
            UPDATE User
            SET passwordUser = '${hashed}'
            WHERE phoneUser=${phone}
            `,{type:db.sequelize.QueryTypes.UPDATE})
            if(dbRes[1] !== 0){
                sendMail(email, "reset", pwd);
                res.json({true:true})
            }
            else throw new Error("Nothing touched")
        }else throw new Error('Invalid phone')
    } catch (error) {return next(error)}
}