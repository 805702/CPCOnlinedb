const router = require('express').Router();

const handle = require('../handlers');

router.post('/getUser', handle.getUser)
router.post('/createUser', handle.createUser)
router.get('/getAllUsers', handle.getAllUsers)
router.post('/deleteUser', handle.deleteUser)
router.post('/resetPassword', handle.resetPassword)

module.exports = router;