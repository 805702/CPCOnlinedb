const router = require('express').Router();

const handle = require('../handlers');

router.get('/getExams', handle.getExams)

module.exports = router;