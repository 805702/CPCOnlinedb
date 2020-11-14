const router = require('express').Router();
const upload = require("../utils/multer");
const handle = require('../handlers');

router.post('/getPatientResultData', handle.getPatientResultData)
router.post('/postponeResult', handle.postponeResult)
router.post('/uploadDemandResult', upload.single('uploadFile'), handle.uploadDemandResult)
router.get('/getDueResults', handle.getDueResults)
router.post('/specialResults', upload.single('uploadFile'), handle.specialResults)

module.exports = router;