const router = require('express').Router();

const handle = require('../handlers')


router.post('/hello', handle.createTextDemand)

module.exports = router;