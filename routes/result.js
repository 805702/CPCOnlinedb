const router = require('express').Router();

const handle = require('../handlers');

router.post('/getPatientResultData', handle.getPatientResultData)

module.exports = router;