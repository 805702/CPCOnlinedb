const router = require('express').Router();
const upload = require('../utils/multer')
const handle = require('../handlers')

router.post('/textDemand', handle.createTextDemand)
router.get('/confirmDemands', handle.getDemandsToConfirm) //list of demands awaiting confirmation
router.post('/treatDemand', handle.treatDemand)
router.post('/SINData', handle.getSINData)
router.post('/confirmDemand', handle.confirmDemand) //confirm a demand
router.post("/imageDemand", upload.array('file', 2000), handle.createImageDemand);
router.post('/awaitingCompletion', handle.awaitingCompletion);
router.post('/completeDemand', handle.completeDemand)
router.post('/awaitingPayment', handle.awaitingPayment)
router.post('/completePayment', handle.completePayment)
router.post('/awaitingConfirmation', handle.awaitingConfirmation)

module.exports = router;