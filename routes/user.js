const router = require('express').Router();

const handle = require('../handlers');

router.post('/getUser', handle.getUser)

module.exports = router;