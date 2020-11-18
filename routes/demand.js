const router = require('express').Router();
const upload = require('../utils/multer')
const handle = require('../handlers')

router.post('/textDemand', handle.createTextDemand)
router.get('/confirmDemands', handle.getDemandsToConfirm) //list of demands awaiting confirmation
router.get('/getDemandsToComplete', handle.getDemandsToComplete) //list of demands awaiting completion
router.post('/treatDemand', handle.treatDemand) //reception of demand
router.post('/SINData', handle.getSINData)
router.post('/confirmDemand', handle.confirmDemand) //confirm a demand
router.post("/imageDemand", upload.array('file', 2000), handle.createImageDemand);
router.post('/awaitingCompletion', handle.awaitingCompletion); //patients awaiting completion
router.post('/completeDemand', handle.completeDemand) // the process of completing a demand
router.post('/awaitingPayment', handle.awaitingPayment) //patients awaiting payment
router.post('/completePayment', handle.completePayment)
router.post('/awaitingConfirmation', handle.awaitingConfirmation) //patients awaiting confirmation

module.exports = router;