/**
 * Module dependencies.
 */

const express = require('express');
var async = require('async');
var request = require('request');
var XLSX = require('xlsx');
var appRoot = require('app-root-path');
var _constants = require('../../../config/constants.js');
var logger = require('../../../config/winston');
const {
    performance
} = require('perf_hooks');

/**
 * Global Varibles
 */

var isCategoryCreated = false;
var isTopicTerm = false;
var index = 0;
var categoryIndex = 0;
var regexPattern = /[^a-zA-Z0-9]/g;
var isTranslation = _constants.translations;
var translationsCode = _constants.translations_lang;

var boardValue = '';
var gradeValue = '';
var subjectValue = '';
var medboardValueiumValue = '';
var L1conceptValue = '';
var L2conceptValue = '';
var L3conceptValue = '';

var boardTmp = '';
var gradeTmp = '';
var subjectTmp = '';
var mediumTmp = '';
var L1conceptTmp = '';
var L2conceptTmp = '';
var L3conceptTmp = '';

var boardTmpRes = '';
var gradeTmpRes = '';
var subjectTmpRes = '';
var mediumTmpRes = '';
var L1conceptTmpRes = '';
var L2conceptTmpRes = '';
var L3conceptTmpRes = '';

var identifierArray = [];
var topicIdentifierArray = [];

var L1Trasalation = '';
var L2Trasalation = '';
var L3Trasalation = '';


/**
 * Initialization Framework, exposing the
 * request and response to each other, as well as reading an excel file.
 *
 * @param {Request} req
 * @param {Response} res
 * @api public
 * 
 */


const initFramework = (req, res) => {

    var excelData = readExcelFile();
    excelData.then(function (data) {
        var startTime = performance.now();
        checkOrCreateFramework(function (error, response) {
            res.json(data);
            if (response) {
                checkOrCreateCategory(function (error, categoryRes) {
                    if (error) {
                        logger.error('CATEGORY ERROR1 :' + error);
                    } else {
                        async.eachSeries(data, function (key, callback) {
                            index = index + 1;
                            identifierArray = [];
                            isTopicTerm = false;
                            console.log('-----------------------  READ ROW NO. ' + index + '--------------------');
                            startTermAndAssociations(key, function (error, data) {
                                if (error) {
                                    logger.error('ERROR1 :' + error);
                                    return callback(error);
                                }
                                callback();
                            });
                        }, function (error) {
                            if (error) {
                                logger.error('ERROR2' + error);
                                return callback(error);
                            }
                            var endTime = performance.now();
                            logger.info('TOTAL FRAMEWORK TIME : Took', (endTime - startTime).toFixed(4), 'milliseconds');
                            logger.info('Successfully bulk data uplaod process done!!!');
                        });
                    }
                });
            } else {
                logger.error('FRAMEWORK ERROR :' + error);
            }
        });

    }, function (error) {
        res.json(error);
    });

}

/**
 * Read a excel file and converting xlsx to json 
 * Returing a json data
 *
 * Options: 
 *       - `XLSX` library require()
 *       - `${appRoot}` library for global app path 
 *
 * @return {JSON} Response
 * 
 */

let readExcelFile = function () {
    return new Promise(function (resolve, reject) {
        var workbook = XLSX.readFile(`${appRoot}/data_input/` + _constants.xlsx_input.file_name);
        var sheet_name_list = workbook.SheetNames;
        var result = [];
        sheet_name_list.forEach(function (y) {
            var worksheet = workbook.Sheets[y];
            var headers = {};
            var data = [];
            for (z in worksheet) {
                if (z[0] === '!') continue;
                //parse out the column, row, and value
                var col = z.substring(0, 1);
                var row = parseInt(z.substring(1));
                var value = worksheet[z].v;

                //store header names
                if (row == 1) {
                    headers[col] = value;
                    continue;
                }

                if (!data[row]) data[row] = {};
                data[row][headers[col]] = value;
            }
            //drop those first two rows which are empty
            data.shift();
            data.shift();
            data.forEach(function (item) {
                result.push(item);
            });
        });
        if (result.length > 0) {
            resolve(result);
        } else {
            logger.error('Excel ERROR : Excel file is empty!!');
            reject('Excel file is empty!!');
        }

    });

}

/**
 * This function is used for read a framework.
 * 
 * @param {Function} callback
 * @return {Object} Response
 * @api public
 * 
 */

let checkOrCreateFramework = function (callback) {
    var options = {
        method: 'GET',
        url: _constants.api_base_url + 'framework/v1/read/' + _constants.framework_id,
        headers: {
            'content-type': 'application/json',
            'Authorization': 'Bearer ' + _constants.apiAuthToken,
            'user-id': 'content Editor'
        },
        json: true
    }
    var startTime = performance.now();
    request(options, function (error, response, body) {
        if (!error && body) {
            try {
                if (body.responseCode === 'OK') {
                    // logger.info('ROW NO >  ' + index + '  > READ FRAMEWORK : REQUEST : ' + JSON.stringify(options) + ' RESPONSE : ' + JSON.stringify(body));
                    callback(null, body);
                } else if (body.responseCode == 'SERVER_ERROR') {
                    logger.error('ROW NO >  ' + index + '  > READ FRAMEWORK ERROR :' + error);
                    callback(new Error('SERVER ERROR'), false);
                } else {
                    createFramework(function (error, response) {
                        if (response) {
                            callback(null, response);
                        } else {
                            callback(error, false);
                        }
                    });
                }
            } catch (error) {
                logger.error('ROW NO >  ' + index + '  > FRAMEWORK ERROR :' + error);
            }
        } else {
            callback(error, false);
        }
        var endTime = performance.now();
        logger.info('ROW NO > ' + index + ' > READ FRAMEWORK : Took', (endTime - startTime).toFixed(4), 'milliseconds');
    });
}

/**
 * This function is used for create a framework
 * 
 * @param {Function} callback
 * @return {Object} Response
 * @api public
 * 
 */

let createFramework = function (callback) {
    var options = {
        method: 'POST',
        url: _constants.api_base_url + _constants.framework_url.api_framework_create,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + _constants.apiAuthToken,
            'user-id': 'content Editor',
            'X-Channel-Id': 'in.ekstep'
        },
        body: {
            "request": {
                "framework": {
                    "name": _constants.framework_name,
                    "description": _constants.framework_name,
                    "code": _constants.framework_id,
                    "owner": _constants.rootOrghashId,
                    "channels": [{
                        "identifier": _constants.rootOrghashId
                    }],
                    "type": "K-12" // fixed
                }
            }
        },
        json: true
    }
    var startTime = performance.now();
    request(options, function (error, response, body) {
        if (!error && body && body.responseCode === 'OK') {
            // logger.info('ROW NO > ' + index + ' > CREATE FRAMEWORK : REQUEST : ' + JSON.stringify(options) + ' RESPONSE : ' + JSON.stringify(body));
            callback(null, body);
        } else {
            callback(error, false);
            logger.error('ROW NO > ' + index + ' > CREATE FRAMEWORK API ERROR : REQUEST : ' + error);
        }
        var endTime = performance.now();
        logger.info('ROW NO > ' + index + ' > CREATE FRAMEWORK : Took', (endTime - startTime).toFixed(4), 'milliseconds');
    });
}

/**
 * This function is used for Read framework categories.
 * 
 * @param {Function} callback
 * @return {Object} Response
 * @api public
 * 
 */

let checkOrCreateCategory = function (callback) {
    async.forEach(_constants.framework_category, function (type, next) {
        var options = {
            method: 'GET',
            url: _constants.api_base_url + _constants.framework_url.api_framework_category_read + type + '?framework=' + _constants.framework_id,
            headers: {
                'content-type': 'application/json',
                'Authorization': 'Bearer ' + _constants.apiAuthToken,
                'user-id': 'content Editor',
                'X-Channel-Id': 'in.ekstep'
            },
            json: true
        }
        var startTime = performance.now();
        request(options, function (error, response, body) {
            if (!error && body) {
                try {
                    if (body.responseCode === 'OK') {
                        // logger.info('ROW NO > ' + index + ' > RAED CATEGORY : REQUEST : ' + JSON.stringify(options) + ' RESPONSE : ' + JSON.stringify(body));
                        next(null, body);
                    } else if (body.responseCode == 'SERVER_ERROR') {
                        logger.error('ROW NO > ' + index + ' > RAED CATEGORY API ERROR : ' + error);
                        return next(new Error('CATEGORY SERVER ERROR'));
                    } else {
                        createCategory(type, function (error, response) {
                            if (response) {
                                next(null, response);
                            } else {
                                return next(error);
                            }
                        });
                    }
                } catch (error) {
                    logger.error('ROW NO > ' + index + ' > READ CATEGORY CATCH ERROR : ' + error);
                }
            } else {
                if (error)
                    return next(error);
            }
            var endTime = performance.now();
            logger.info('ROW NO > ' + index + ' > READ CATEGORY : Took', (endTime - startTime).toFixed(4), 'milliseconds');
        });
    }, function (error, result) {
        if (error) return next(error);
        logger.info(_constants.framework_category.length + ' category(s) was created.');
        callback(error, result);
    });
}

/**
 * This function is used for Create Framework categories.
 * 
 * @param {Function} callback
 * @return {Object} Response
 * @api public
 * 
 */

let createCategory = function (type, callback) {
    var options = {
        method: 'POST',
        url: _constants.api_base_url + _constants.framework_url.api_framework_category_create + '=' + _constants.framework_id,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + _constants.apiAuthToken,
            'user-id': 'Vaibhav',
            'X-Channel-Id': 'in.ekstep'
        },
        body: {
            "request": {
                "category": {
                    "name": type,
                    "description": type,
                    "code": type,
                    "index": categoryIndex++
                }
            }
        },
        json: true
    }
    var startTime = performance.now();
    request(options, function (error, response, body) {
        if (!error && body && body.responseCode === 'OK') {
            // logger.info('ROW NO > ' + index +' > CREATE CATEGORY : REQUEST : ' + JSON.stringify(options) + ' RESPONSE : ' + JSON.stringify(body));
            callback(null, body);
        } else {
            callback(error, false);
            logger.error('ROW NO > ' + index + ' > CREATE CATEGORY API ERROR : ' + error);
        }
        var endTime = performance.now();
        logger.info('ROW NO > ' + index + ' > CREATE FRAMEWORK : Took', (endTime - startTime).toFixed(4), 'milliseconds');
    });
}

/**
 * This function is used for term and associations.
 *
 * @param {Object} row 
 * @param {Function} outerCallback
 * @return {Boolean} Response
 * @api public
 * 
 */

var startTermAndAssociations = function (row, outerCallback) {
    var board = '';
    var grade = '';
    var subject = '';
    var medium = '';
    var L1concept = '';
    var L2concept = '';
    var L3concept = '';

    if (row.Board && row.Board != undefined) {
        boardValue = row.Board;
        board = boardValue.replace(regexPattern, '').toLowerCase();
    }

    if (row.Grade && row.Grade != undefined) {
        gradeValue = row.Grade.toString();
        grade = gradeValue.replace(regexPattern, '').toLowerCase();
    }

    if (row.Subject && row.Subject != undefined) {
        subjectValue = row.Subject;
        subject = subjectValue.replace(regexPattern, '').toLowerCase();
    }

    if (row.Medium && row.Medium != undefined) {
        mediumValue = row.Medium;
        medium = mediumValue.replace(regexPattern, '').toLowerCase();
    }

    var L1key = Object.keys(row)[_constants.excel_column.L1_NO];
    var L1value = row[L1key];

    if (L1key != undefined && L1value != undefined && row.Subject != '' && L1value != 'NA') {
        L1conceptValue = L1value;
        L1concept = subject + '_' + L1value.replace(regexPattern, '').toLowerCase();

        let key = Object.keys(row)[_constants.transalation_column.L1_NO];
        L1Trasalation = row[key];
    }

    var L2key = Object.keys(row)[_constants.excel_column.L2_NO];
    var L2value = row[L2key];

    if (L2key != undefined && L2value != undefined && L1concept != '' && L2value != 'NA') {
        L2conceptValue = L2value;
        L2concept = L1concept + '_' + L2value.replace(regexPattern, '').toLowerCase();

        let key = Object.keys(row)[_constants.transalation_column.L2_NO];
        L2Trasalation = row[key];
    }

    var L3key = Object.keys(row)[_constants.excel_column.L3_NO];
    var L3value = row[L3key];

    if (L3key != undefined && L3value != undefined && L2concept != '' && L3value != 'NA') {
        L3conceptValue = L3value;
        L3concept = L2concept + '_' + L3value.replace(regexPattern, '').toLowerCase();

        let key = Object.keys(row)[_constants.transalation_column.L3_NO];
        L3Trasalation = row[key];
    }

    async.waterfall([
        async.apply(boardFunction, board, 'board'),
        async.apply(mediumFunction, medium, 'medium'),
        async.apply(gradeFunction, grade, 'gradeLevel'),
        async.apply(subjectFunction, subject, 'subject'),
        async.apply(L1TopicFunction, L1concept, 'topic'),
        async.apply(L2TopicFunction, L2concept, 'topic'),
        async.apply(L3TopicFunction, L3concept, 'topic'),
    ], function (err, result) {
        if (err) {
            outerCallback(null, true);
            logger.error('ERROR2 :' + err);
        } else {
            outerCallback(null, true);
        }

    });
}

/**
 * This function is used to read or create term for board category.
 *
 * @param {String} board 
 * @param {String} category 
 * @param {Function} callback
 * @return {Response}
 * @api public
 * 
 */

function boardFunction(board, category, callback) {
    if (board != '' && boardTmp != board) {
        boardTmp = board;
        var termPromise = checkOrCreateTerm(board, category, boardValue);
        termPromise.then(function (result) {
            boardTmpRes = result;
            callback(null, result);
        }, function (err) {
            logger.error('BOARD FUNCTION ERROR :' + err);
            callback(err);
        });
    } else {
        callback(null, boardTmpRes);
    }
}


/**
 * This function is used to read or create term for medium category as well as association with board.
 * Response pass it to next function 
 * @param {String} medium 
 * @param {String} category 
 * @param {Response} boardRes //  Response of board function
 * @param {Function} callback
 * @return {Response}
 * @api public
 * 
 */

function mediumFunction(medium, category, boardRes, callback) {
    var obj = processTermResponse(boardRes);
    identifierArray.push(obj);
    if (medium != '' && mediumTmp != medium) {
        mediumTmp = medium;
        var termPromise = checkOrCreateTerm(medium, category, mediumValue);
        termPromise.then(function (result) {
            mediumTmpRes = result;
            var associationsPromise = associationsWithTerm(medium, category);
            associationsPromise.then(function (response) {
                callback(null, result);
            }, function (err) {
                logger.error('MEDIUM ASSOCIATION FUNCTION ERROR :' + err);
                callback(err);
            });
        }, function (err) {
            logger.error('MEDIUM FUNCTION ERROR :' + err);
            callback(err);
        });
    } else {
        var termPromise = checkOrCreateTerm(medium, category);
        termPromise.then(function (data) {
            var arr = data.result.term.associationswith;
            if (arr && arr != undefined && arr.length > 0) {
                var associationArray = checkIfObjectExist(arr, identifierArray);
                if (associationArray != false) {
                    var associationsPromise = associationsWithTerm(medium, category, associationArray);
                    associationsPromise.then(function (response) {
                        callback(null, mediumTmpRes);
                    }, function (err) {
                        logger.error('Medium Associations term update ERROR :' + err);
                        callback(err);
                    });
                } else {
                    callback(null, mediumTmpRes);
                }
            } else {
                logger.log('Medium Association with Error - ' + medium);
            }
        }, function (err) {
            logger.error('Read Term Error :' + err);
            callback(err);
        });
    }
}

/**
 * This function is used to read or create term for grade category as well as association with medium,board
 *  
 * @param {String} grade 
 * @param {String} category 
 * @param {Response} mediumRes //  Response of medium function
 * @param {Function} callback
 * @return {Response}
 * @api public
 * 
 */

function gradeFunction(grade, category, mediumRes, callback) {
    var obj = processTermResponse(mediumRes);
    identifierArray.push(obj);
    if (grade != '' && gradeTmp != grade) {
        gradeTmp = grade;
        var termPromise = checkOrCreateTerm(grade, category, gradeValue);
        termPromise.then(function (result) {
            gradeTmpRes = result;
            var associationsPromise = associationsWithTerm(grade, category);
            associationsPromise.then(function (response) {
                callback(null, result);
            }, function (err) {
                logger.error('GRADE ASSOCIATION FUNCTION ERROR :' + err);
                callback(err);
            });
        }, function (err) {
            logger.error('GRADE FUNCTION ERROR :' + err);
            callback(err);
        });
    } else {
        var termPromise = checkOrCreateTerm(grade, category);
        termPromise.then(function (data) {
            var arr = data.result.term.associationswith;
            if (arr && arr != undefined && arr.length > 0) {
                var associationArray = checkIfObjectExist(arr, identifierArray);
                if (associationArray != false) {
                    var associationsPromise = associationsWithTerm(grade, category, associationArray);
                    associationsPromise.then(function (response) {
                        callback(null, gradeTmpRes);
                    }, function (err) {
                        logger.error('Grade Associations term update ERROR :' + err);
                        callback(err);
                    });
                } else {
                    callback(null, gradeTmpRes);
                }
            } else {
                logger.error('Grade Association with Error' + grade);
            }
        }, function (err) {
            logger.error('Read Term Error :' + err);
            callback(err);
        });
    }
}

/**
 * This function is used to read or create term for subject category as well as association with medium,board,grade
 *  
 * @param {String} subject 
 * @param {String} category 
 * @param {Response} gradeRes //  Response of grade function
 * @param {Function} callback
 * @return {Response}
 * @api public
 * 
 */

function subjectFunction(subject, category, gradeRes, callback) {
    var obj = processTermResponse(gradeRes);
    identifierArray.push(obj);
    if (subject != '' && subjectTmp != subject) {
        subjectTmp = subject;
        var termPromise = checkOrCreateTerm(subject, category, subjectValue);
        termPromise.then(function (result) {
            subjectTmpRes = result;
            var associationsPromise = associationsWithTerm(subject, category);
            associationsPromise.then(function (response) {
                callback(null, result);
            }, function (err) {
                logger.error('SUBJECT ASSOCIATION FUNCTION ERROR :' + err);
                callback(err);
            });
        }, function (err) {
            logger.error('SUBJECT FUNCTION ERROR :' + err);
            callback(err);
        });
    } else {
        var termPromise = checkOrCreateTerm(subject, category);
        termPromise.then(function (data) {
            var arr = data.result.term.associationswith;
            if (arr && arr != undefined && arr.length > 0) {
                var associationArray = checkIfObjectExist(arr, identifierArray);
                if (associationArray != false) {
                    var associationsPromise = associationsWithTerm(subject, category, associationArray);
                    associationsPromise.then(function (response) {
                        callback(null, subjectTmpRes);
                    }, function (err) {
                        logger.error('Subject Associations term update ERROR :' + err);
                        callback(err);
                    });
                } else {
                    callback(null, subjectTmpRes);
                }
            } else {
                logger.error('Subject Association Not Found' + subject);
            }
        }, function (err) {
            logger.error('Read Term Error :' + err);
            callback(err);
        });
    }

}

/**
 * This function is used to read or create term for chepter concept category 
 * As well as association with medium,board,grade,subject
 *  
 * @param {String} L1concept 
 * @param {String} category 
 * @param {Response} subjectRes //  Response of subject function
 * @param {Function} callback
 * @return {Response}
 * @api public
 * 
 */

function L1TopicFunction(L1concept, category, subjectRes, callback) {

    var obj = processTermResponse(subjectRes);
    identifierArray.push(obj);
    if (L1concept != '' && L1conceptTmp != L1concept) {
        L1conceptTmp = L1concept;
        var termPromise = checkOrCreateTerm(L1concept, category, L1conceptValue, L1Trasalation);
        termPromise.then(function (result) {
            L1conceptTmpRes = result;
            checkTransalations(result, L1concept, category, L1Trasalation);
            var associationsPromise = associationsWithTerm(L1concept, category);
            associationsPromise.then(function (response) {
                callback(null, result);
            }, function (err) {
                logger.error('L1CONCEPT ASSOCIATION FUNCTION ERROR :' + err);
                callback(err);
            });
        }, function (err) {
            logger.error('L1CONCEPT FUNCTION ERROR :' + err);
            callback(err);
        });
    } else if (L1concept != '') {
        var termPromise = checkOrCreateTerm(L1concept, category);
        termPromise.then(function (data) {
            var arr = data.result.term.associationswith;
            if (arr && arr != undefined && arr.length > 0) {
                var associationArray = checkIfObjectExist(arr, identifierArray);
                if (associationArray != false) {
                    var associationsPromise = associationsWithTerm(L1concept, category, associationArray);
                    associationsPromise.then(function (response) {
                        callback(null, L1conceptTmpRes);
                    }, function (err) {
                        logger.error('L1concept Associations term update ERROR :' + err);
                        callback(err);
                    });
                } else {
                    callback(null, L1conceptTmpRes);
                }
            } else {
                logger.error('L1concept Association with Error' + L1concept);
            }
        }, function (err) {
            logger.error('Read Term Error :' + err);
            callback(err);
        });
    } else {
        callback(null, L1conceptTmpRes);
    }
}

/**
 * This function is used to read or create term for Topic concept 
 * As well as map tree under category `chapter-concept`
 *  
 * @param {String} L2concept 
 * @param {String} category 
 * @param {Response} L1conceptRes //  Response of L1TopicFunction 
 * @param {Function} callback
 * @return {Response}
 * @api public
 * 
 */

function L2TopicFunction(L2concept, category, L1conceptRes, callback) {

    if (L2concept != '' && L2conceptTmp != L2concept) {
        L2conceptTmp = L2concept;
        topicIdentifierArray = [];
        var obj = processTermResponse(L1conceptRes);
        topicIdentifierArray.push(obj);
        isTopicTerm = true;
        var termPromise = checkOrCreateTerm(L2concept, category, L2conceptValue, L2Trasalation);
        termPromise.then(function (result) {
            L2conceptTmpRes = result;
            checkTransalations(result, L2concept, category, L2Trasalation);
            callback(null, result);
        }, function (err) {
            logger.error('L2concept FUNCTION ERROR :' + err);
            callback(err);
        });
    } else {
        callback(null, L2conceptTmpRes);
    }
}

/**
 * This function is used to read or create term for Sub Topic 
 * As well as map tree under category `Topic concept`
 *  
 * @param {String} L3concept 
 * @param {String} category 
 * @param {Response} L2conceptRes //  Response of L2TopicFunction 
 * @param {Function} callback
 * @return {Response}
 * @api public
 * 
 */

function L3TopicFunction(L3concept, category, L2conceptRes, callback) {
    if (L3concept != '' && L3conceptTmp != L3concept) {
        L3conceptTmp = L3concept;
        topicIdentifierArray = [];
        var obj = processTermResponse(L2conceptRes);
        topicIdentifierArray.push(obj);
        isTopicTerm = true;
        var termPromise = checkOrCreateTerm(L3concept, category, L3conceptValue, L3Trasalation);
        termPromise.then(function (result) {
            L3conceptTmpRes = result;
            checkTransalations(result, L3concept, category, L3Trasalation);
            callback(null, result);
        }, function (err) {
            logger.error('L3concept FUNCTION ERROR :' + err);
            callback(err);
        });
    } else {
        callback(null, L3conceptTmpRes);
    }
}

/**
 * This function function is used for Read Terms for each categories
 *
 * @param {String} term 
 * @param {String} category
 * @param {String} termValue
 * @return {Response}
 * @api public
 * 
 */

let checkOrCreateTerm = function (term, category, termValue, termTraslationValue) {
    var options = {
        method: 'GET',
        url: _constants.api_base_url + _constants.framework_url.api_framework_category_term_read + term + '?framework=' + _constants.framework_id + '&category=' + category,
        headers: {
            'content-type': 'application/json',
            'Authorization': 'Bearer ' + _constants.apiAuthToken,
            'user-id': 'Ekstep',
            'X-Channel-Id': 'in.ekstep'
        },
        json: true
    }
    return new Promise(function (resolve, reject) {
        var startTime = performance.now();
        request(options, function (error, response, body) {
            if (error) {
                logger.error('READ TERM API ERROR : ' + error);
                reject(error);
            } else if (body && body.responseCode == 'OK') {
                // logger.info('ROW NO >  ' + index + '  > READ TERM : REQUEST : ' + JSON.stringify(options) + ' RESPONSE : ' + JSON.stringify(body));
                resolve(body);
            } else {
                var createTermPromise = createTerm(term, category, termValue, termTraslationValue);
                createTermPromise.then(function (result) {
                    resolve(result);
                }, function (err) {
                    logger.error('CREATE TERM API ERROR1 : ' + err);
                    reject(err);
                });
            }
            var endTime = performance.now();
            logger.info('ROW NO > ' + index + ' > READ TERM : Took', (endTime - startTime).toFixed(4), 'milliseconds');
        });
    });
}


/**
 * This function is used for Create Terms for each categories
 *
 * @param {String} term 
 * @param {String} category
 * @param {String} termValue
 * @return {Response}
 * @api public
 * 
 */

let createTerm = function (term, category, termValue, termTraslationValue) {

    var body = {
        "request": {
            "term": {
                "name": termValue,
                "label": termValue,
                "description": termValue,
                "code": term,
                "index": index
            }
        }
    }

    if (termTraslationValue && isTranslation) {
        body.request.term.translations = {
            [translationsCode]: termTraslationValue
        };
    }

    if (isTopicTerm) {
        body.request.term.parents = topicIdentifierArray;
    }

    var options = {
        method: 'POST',
        url: _constants.api_base_url + _constants.framework_url.api_framework_category_term_create + '=' + _constants.framework_id + '&category=' + category,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + _constants.apiAuthToken,
            'user-id': 'Vaibhav',
            'X-Channel-Id': _constants.rootOrghashId
        },
        body: body,
        json: true
    }

    return new Promise(function (resolve, reject) {
        var startTime = performance.now();
        request(options, function (error, response, body) {
            if (error) {
                logger.error('CREATE TERM API ERROR2 : ' + error);
                reject(error);
            } else if (body && body.responseCode == 'OK') {
                // logger.info('ROW NO >  ' + index + '  > CREATE TERM : REQUEST : ' + JSON.stringify(options) + ' RESPONSE : ' + JSON.stringify(body));
                resolve(body);
            } else {
                let err = new Error('Create Term Error - ' + term);
                logger.error('CREATE TERM API ERROR3 : ' + err);
                reject(err);
            }
            var endTime = performance.now();
            logger.info('ROW NO > ' + index + ' > CREATE TERM : Took', (endTime - startTime).toFixed(4), 'milliseconds');
        });
    });
}

/**
 * Each term associations to another term from another category 
 *
 * @param {String} term 
 * @param {String} category
 * @param {Array} identifier  // default value is null
 * @return {Response} 
 * @api public
 * 
 */

let associationsWithTerm = function (term, category, identifier = '') {
    var body = '';
    if (identifier != '') {
        body = {
            "request": {
                "term": {
                    "associationswith": identifier
                }
            }
        }
    } else {
        body = {
            "request": {
                "term": {
                    "associationswith": identifierArray
                }
            }
        }
    }

    var options = {
        method: 'PATCH',
        url: _constants.api_base_url + _constants.framework_url.api_framework_category_term_update + term + '?framework=' + _constants.framework_id + '&category=' + category,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + _constants.apiAuthToken,
            //   'user-id': 'Vaibhav',
            'X-Channel-Id': _constants.rootOrghashId
        },
        body: body,
        json: true
    }

    return new Promise(function (resolve, reject) {
        var startTime = performance.now();
        request(options, function (error, response, body) {
            if (error) {
                logger.error('ASSOCIATION TERM API ERROR : ' + error);
                reject(error);
            } else if (body && body.responseCode == 'OK') {
                // logger.info('ROW NO >  ' + index + '  > ASSOCIATION TERM : REQUEST : ' + JSON.stringify(options) + ' RESPONSE : ' + JSON.stringify(body));
                resolve(body);
            } else {
                let err = new Error('Association Term Error - ' + term);
                logger.error('ASSOCIATION TERM API ERROR2 : ' + err);
                reject(err);
            }
            var endTime = performance.now();
            logger.info('ROW NO > ' + index + ' > ASSOCIATION TERM : Took', (endTime - startTime).toFixed(4), 'milliseconds');
        });
    });
}

/**
 * This function is used for Update Transaltions for each term
 *
 * @param {String} term 
 * @param {String} category
 * @param {String} termValue
 * @return {Response}
 * @api public
 * 
 */

let updateTermTransaltions = function (term, category, transaltionObj) {

    var body = {
        "request": {
            "term": transaltionObj
        }
    }

    if (isTopicTerm) {
        body.request.term.parents = topicIdentifierArray;
    }
    var options = {
        method: 'PATCH',
        url: _constants.api_base_url + _constants.framework_url.api_framework_category_term_update + term + '?framework=' + _constants.framework_id + '&category=' + category,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + _constants.apiAuthToken,
            'user-id': 'Vaibhav',
            'X-Channel-Id': _constants.rootOrghashId
        },
        body: body,
        json: true
    }

    return new Promise(function (resolve, reject) {
        var startTime = performance.now();
        request(options, function (error, response, body) {
            if (error) {
                logger.error('Update term transaltions error1 : ' + error);
                reject(error);
            } else if (body && body.responseCode == 'OK') {
                // logger.info('ROW NO >  ' + index + '  > CREATE TERM : REQUEST : ' + JSON.stringify(options) + ' RESPONSE : ' + JSON.stringify(body));
                resolve(body);
            } else {
                let err = new Error('Update term transaltions error2 - ' + term);
                logger.error(err);
                reject(err);
            }
            var endTime = performance.now();
            logger.info('ROW NO > ' + index + ' > UPDATE TERM TRANSALTIONS : Took', (endTime - startTime).toFixed(4), 'milliseconds');
        });
    });
}

/**
 * Check if a value is exists in an array 
 *
 * @param {Array} arr 
 * @param {Array} identifierArray
 * @return {Array} Response  - if flag is true than return an array else return false
 * @api public
 * 
 */

function checkIfObjectExist(arr, identifierArray) {
    var tmpArr = [];
    flag = false;
    for (var i = 0; i < arr.length; i++) {
        var obj = {
            'identifier': arr[i].identifier
        };
        tmpArr.push(obj);
        for (var j = 0; j < identifierArray.length; j++) {
            if (arr[i].identifier != identifierArray[j].identifier) {
                flag = true;
                var obj1 = {
                    'identifier': identifierArray[j].identifier
                };
                tmpArr.push(obj1);
            }
        }
    }
    if (flag) {
        return tmpArr;
    } else {
        return false;
    }

}

// filter the response data

function processTermResponse(response) {
    if (response.result.node_id && !isArray(response.result.node_id)) {
        return {
            'identifier': response.result.node_id
        };
    } else if (response.result.node_id) {
        return {
            'identifier': response.result.node_id[0]
        };
    } else {
        return {
            'identifier': response.result.term.identifier
        };
    }
}

// Check value is an array

let isArray = function (a) {
    return (!!a) && (a.constructor === Array);
};

function checkTransalations(res, term, category, termTransalation) {
    if (!isTranslation) {
        return false;
    }

    if (res.result && res.result.term) {
        if (!res.result.term.translations) {
            var obj = {
                "translations": {
                    [_constants.translations_lang]: termTransalation
                }
            }
            var transalationPromis = updateTermTransaltions(term, category, obj);
            transalationPromis.then(function (response) {
                return true;
            }, function (err) {
                console.error('checkTransalations function error1');
            });
        } else if (res.result.term.translations && !res.result.term.translations.hasOwnProperty(_constants.translations_lang)) {
            var existingTransalation = res.result.term.translations;
            existingTransalation[_constants.translations_lang] = termTransalation;
            var transalationPromis = updateTermTransaltions(term, category, existingTransalation);
            transalationPromis.then(function (response) {
                return true;
            }, function (err) {
                console.error('checkTransalations function error2');
            });

        } else {
            return true;
        }
    }
}

// Exposing an initFramework

module.exports = {
    initFramework
};