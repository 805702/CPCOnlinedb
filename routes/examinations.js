const router = require('express').Router();

const handle = require('../handlers');

router.get('/getExams', handle.getExams)
router.get('/getManageExams', handle.getManageExams)
router.post('/createExam', handle.createExam)
router.post('/updateExam', handle.updateExam)

module.exports = router;