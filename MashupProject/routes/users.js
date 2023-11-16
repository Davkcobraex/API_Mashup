var express = require('express');
var router = express.Router();
const logger = require('morgan');
router.use(logger('tiny'));

/* GET users listing. */
router.get('/:params', async function(req, res, next) {
  //res.send('respond with a resource');
  console.log(req.params.params)
  res.send(req.params.params);
});

module.exports = router;
