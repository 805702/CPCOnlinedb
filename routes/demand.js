const router = require('express').Router();

const handle = require('../handlers')


router.post('/textDemand', handle.createTextDemand)

module.exports = router;