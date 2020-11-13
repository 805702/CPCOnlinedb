const router = require('express').Router();

const handle = require('../handlers');

router.post('/register', handle.register)
router.post('/loginPhone', handle.loginPhone)
router.post('/login', handle.login)
router.post('/validateToken', handle.validateToken)

module.exports = router;