const router = require("express").Router();

const handle = require("../handlers");

router.post("/createExamCategory", handle.createExamCategory);
router.get('/getAllCategories', handle.getAllCategories)

module.exports = router;
