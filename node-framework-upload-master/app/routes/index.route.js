/**
 * Load Module dependencies.
 */
const express = require('express');
const router = express.Router();
const indexControllerV1 = require('../v1/controllers/index.controller');
const indexControllerV2 = require('../v2/controllers/index.controller');

// version v1 routes api

router.route('/v1/getframework')
    .get(indexControllerV1.initFramework);



// version v2 routes api

router.route('/v2/getframework')
    .get(indexControllerV2.initFramework);

module.exports = router;