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
const Term  = require('./term.js');
const { performance } = require('perf_hooks');

/**
 * Global Varibles
 */
let regexPattern = /[^a-zA-Z0-9]/g;
var isCategoryCreated =  false;
var isTopicTerm = false;
var index = 0;
var categoryIndex = 0;

// set map 

var termMap = new Map();
var l2Map = new Map();

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
    excelData.then(function(data){
        var startTime = performance.now();
        checkOrCreateFramework(function(error,response) {
            if(response) {
                checkOrCreateCategory(function(error,categoryRes) {
                    if (error) {
                        logger.error('CATEGORY ERROR1 :' + error);
                    } else {
                        let term = new Term(data);
                        let termArray = term.getFilterTerm();
                        res.json(termArray);
                        asyncProcessTerms(termArray,function(err,result) {
                            console.log('ERROR : ' + err);
                            console.log('RESULT10 : ' + result);
                            async.eachSeries(data, function (key, callback){ 
                                index = index + 1;
                                identifierArray = [];
                                isTopicTerm = false;
                                console.log('-----------------------  READ ROW NO. ' + index + '--------------------');
                                termAssociations(key, function(error, data) {
                                    if (error){
                                        logger.error('ERROR1 :' + error);
                                        return callback(error);
                                    }
                                    callback();
                                });
                              }, function(error) {
                                  if (error) {
                                    logger.error('ERROR2' + error);
                                    return callback(error);
                                  }
                                  var endTime = performance.now();
                                  logger.info('TOTAL FRAMEWORK TIME : Took', (endTime - startTime).toFixed(4), 'milliseconds'); 
                                  logger.info('Successfully bulk data uplaod process done!!!');
                            });
                            // termMap.forEach(logMapElements);
                        }); 
                    }
                });
            } else {
                logger.error('FRAMEWORK ERROR :' + error);
            }
        });
    },function(error) {
        res.json(error);
    });

}

function logMapElements(value, key, map) {
    console.log(`m[${key}] = ${value}`);
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


let readExcelFile = function() {
    return new Promise(function(resolve, reject){
        var workbook = XLSX.readFile(`${appRoot}/data_input/`+ _constants.xlsx_input.file_name);
        var sheet_name_list = workbook.SheetNames;
        var result = [];
        sheet_name_list.forEach(function(y) {
            var worksheet = workbook.Sheets[y];
            var headers = {};
            var data = [];
            for(z in worksheet) {
                if(z[0] === '!') continue;
                //parse out the column, row, and value
                var col = z.substring(0,1);
                var row = parseInt(z.substring(1));
                var value = worksheet[z].v;
        
                //store header names
                if(row == 1) {
                    headers[col] = value;
                    continue;
                }
        
                if(!data[row]) data[row]={};
                data[row][headers[col]] = value;
            }
            //drop those first two rows which are empty
            data.shift();
            data.shift();
            data.forEach(function(item){
                result.push(item);
            });
        });
        if(result.length > 0) {
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

let checkOrCreateFramework = function(callback){
    var options = {
      method: 'GET',
      url: _constants.api_base_url + 'framework/v1/read/'+_constants.framework_id,
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
            if(body.responseCode === 'OK') {
                // logger.info('ROW NO >  ' + index + '  > READ FRAMEWORK : REQUEST : ' + JSON.stringify(options) + ' RESPONSE : ' + JSON.stringify(body));
                callback(null,body); 
            } else if (body.responseCode == 'SERVER_ERROR') {
                logger.error('ROW NO >  ' + index + '  > READ FRAMEWORK ERROR :' + error);
                callback(new Error('SERVER ERROR'),false);
            } else {
                createFramework(function(error,response){
                    if(response){
                        callback(null,response);
                    } else {
                        callback(error,false);
                    }
                });
            }
        } catch (error) {
            logger.error('ROW NO >  ' + index + '  > FRAMEWORK ERROR :' + error);
        }
      } else {
        callback(error,false);
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

let createFramework = function(callback){
    var options = {
        method: 'POST',
        url: _constants.api_base_url + _constants.framework_url.api_framework_create,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + _constants.apiAuthToken,
          'user-id': 'content Editor',
          'X-Channel-Id':'in.ekstep'
        },
        body: {
            "request": 
                {
                  "framework": 
                  {
                    "name": _constants.framework_name, 
                    "description": _constants.framework_name,
                    "code": _constants.framework_id,
                    "owner": _constants.rootOrghashId,
                    "channels": [{"identifier": _constants.rootOrghashId}],
                    "type": "K-12" // fixed
                  }
                }
        },
        json: true
      }
      var startTime = performance.now();
      request(options, function (error, response, body) {
        if(!error && body && body.responseCode === 'OK') {
            // logger.info('ROW NO > ' + index + ' > CREATE FRAMEWORK : REQUEST : ' + JSON.stringify(options) + ' RESPONSE : ' + JSON.stringify(body));
            callback(null,body);
        } else {
            callback(error,false);
            logger.error('ROW NO > ' + index + ' > CREATE FRAMEWORK API ERROR : REQUEST : ' +  error);
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

let checkOrCreateCategory = function(callback){
    async.forEach(_constants.framework_category, function(type, next) { 
        var options = {
            method: 'GET',
            url: _constants.api_base_url + _constants.framework_url.api_framework_category_read+type+'?framework='+_constants.framework_id,
            headers: {
                'content-type': 'application/json',
                'Authorization': 'Bearer ' + _constants.apiAuthToken,
                'user-id': 'content Editor',
                'X-Channel-Id' : 'in.ekstep'
            },
            json: true
        }
        var startTime = performance.now();
       request(options, function (error, response, body) { 
            if (!error && body){
                try {
                    if(body.responseCode === 'OK') {
                        // logger.info('ROW NO > ' + index + ' > RAED CATEGORY : REQUEST : ' + JSON.stringify(options) + ' RESPONSE : ' + JSON.stringify(body));
                        next(null,body);
                    } else if (body.responseCode == 'SERVER_ERROR') {
                        logger.error('ROW NO > ' + index + ' > RAED CATEGORY API ERROR : ' +  error);
                        return next(new Error('CATEGORY SERVER ERROR'));
                    } else {
                        createCategory(type,function(error,response){
                            if(response){
                                next(null,response);
                            } else {
                                return next(error);
                            }
                        });
                    }
                } catch (error) {
                    logger.error('ROW NO > ' + index + ' > READ CATEGORY CATCH ERROR : ' +  error);
                }
            } else {
                if(error)
                    return next(error);
            }
            var endTime = performance.now();
            logger.info('ROW NO > ' + index + ' > READ CATEGORY : Took', (endTime - startTime).toFixed(4), 'milliseconds');
        });
    }, function(error,result) {
        if (error) return next(error);
        logger.info(_constants.framework_category.length+' category(s) was created.');
        callback(error,result);
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

let createCategory = function(type,callback){
    var options = {
        method: 'POST',
        url: _constants.api_base_url + _constants.framework_url.api_framework_category_create+'='+_constants.framework_id,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + _constants.apiAuthToken,
          'user-id': 'Vaibhav',
          'X-Channel-Id':'in.ekstep'
        },
        body: {
            "request": 
                {
                  "category": 
                  {
                    "name": type, 
                    "description": type,
                    "code": type,
                    "index":categoryIndex++
                  }
                }
        },
        json: true
      }
      var startTime = performance.now();
      request(options, function (error, response, body) {
        if(!error && body && body.responseCode === 'OK') {
            // logger.info('ROW NO > ' + index +' > CREATE CATEGORY : REQUEST : ' + JSON.stringify(options) + ' RESPONSE : ' + JSON.stringify(body));
            callback(null,body);
        } else {
            callback(error,false);
            logger.error('ROW NO > ' + index + ' > CREATE CATEGORY API ERROR : ' +  error);
        }
        var endTime = performance.now();
        logger.info('ROW NO > ' + index + ' > CREATE CATEGORY: Took', (endTime - startTime).toFixed(4), 'milliseconds');
      });
}


/**
 * This function is used for create bulk term
 * 
 * @param {Object} data
 * @param {Function} outerCallback
 * @return {Boolean} Response
 * @api public
 * 
 */
let asyncProcessTerms = function(data,outerCallback) {
    async.waterfall([
        function(callback) {
            uplaodBulkTerms(data['Board'],'board',function(err,result){
                if(result) {
                    callback();
                } else {
                    callback(err);
                }
            });
        },function(callback) {
            uplaodBulkTerms(data['Medium'],'medium',function(err,result){
                console.log('VAIBHAV1 : ' + result);
                if(result) {
                    callback();
                } else {
                    callback(err);
                }
            });
        },function(callback) {
            uplaodBulkTerms(data['Grade'],'gradeLevel',function(err,result){
                if(result) {
                    callback();
                } else {
                    callback(err);
                }
            });
        },function(callback) {
            uplaodBulkTerms(data['Subject'],'subject',function(err,result){
                if(result) {
                    callback();
                } else {
                    callback(err);
                }
            });
        },function(callback) {
            uplaodBulkTerms(data['L1'],'topic',function(err,result){
                if(result) {
                    callback(null,result);
                } else {
                    callback(err);
                }
            });
        }
    ], function (err, result) {
        if(err) {
            logger.error(err);
        } else {
            outerCallback(null,result);
        }
        
    });
}

let uplaodBulkTerms = async function(termArray,category,callback) {
    let count = 0;
    let offset = 0;
    let subArray = []; 
    let flag = false;
    if(termArray.length > _constants.bulk_term_limit) {
        for(let i = 0; i < termArray.length;i++) {
            subArray.push(termArray[i]);
            count++;   
            if(count == _constants.bulk_term_limit) {
                let termPromise = createBulkTermsApi(subArray,category);
                await termPromise.then(function(result) {
                    flag = createHashMapForTerm(subArray,result);
                    console.log('FLAG1' + flag);
                    console.log("bulk " + category);
                }, function(err) {
                    logger.error(err);
                    callback(err,false);
                    // break;
                }); 
                count = 0;
                subArray = [];
                if(!flag) break;
            }
        }
        console.log('FLAG2' + flag);
        console.log("callback " + category);
        
        if(flag) {
            callback(null,true);
        } else {
            logger.error('ERROR IN HASHMAP FUNCTION');
        }

    } else {
        let termPromise = createBulkTermsApi(termArray,category);
        await termPromise.then(function(result) {
            flag = createHashMapForTerm(termArray,result);
            console.log('FLAG3' + flag);
            console.log("Single bulk " + category);
        }, function(err) {
            logger.error(err);
            callback(err,false);
        });
        console.log('FLAG4' + flag);
        console.log("Single callback " + category);
        if(flag) {
            callback(null,true);
        } else {
            logger.error('ERROR1 IN HASHMAP FUNCTION');
        }
    }

}

// bulk terms api function
let createBulkTermsApi = function(term,category){
     
    var body = {
        "request": {
            "term":term
        }
    }
    
    if(isTopicTerm){
        body.request.term.parents = topicIdentifierArray;
    } 
    var options = {
        method: 'POST',
        url: _constants.api_base_url + _constants.framework_url.api_framework_category_term_create+'='+_constants.framework_id+'&category='+category,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + _constants.apiAuthToken,
          'user-id': 'Vaibhav',
          'X-Channel-Id':_constants.rootOrghashId
        },
        body:body,
        json: true
      }
  
      return new Promise(function(resolve, reject) {
        var startTime = performance.now();
        console.log('BODY : ' + JSON.stringify(options));
        request(options, function (error, response, body) {
            if (error) {
                logger.error('CREATE TERM API ERROR2 : ' + error);
                reject(error);
            } else if (body && body.responseCode == 'OK') {
                logger.info('ROW NO >  ' + index + '  > CREATE TERM : REQUEST : ' + JSON.stringify(options) + ' RESPONSE CODE : ' + body.responseCode);
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
 * This function is used for term and associations.
 *
 * @param {Object} row 
 * @param {Function} outerCallback
 * @return {Boolean} Response
 * @api public
 * 
 */

var termAssociations = function(row,outerCallback) {
    var board = '';
    var grade = '';
    var subject = '';
    var medium = '';
    var L1concept = '';
    var L2concept = '';
    var L3concept = '';

    if(row.Board && row.Board != undefined) {
        board = row.Board.replace(regexPattern, '').toLowerCase();
    } 

    if(row.Grade && row.Grade != undefined) {
        grade = row.Grade.replace(regexPattern, '').toLowerCase();
    } 

    if(row.Subject && row.Subject != undefined) {
        subject = row.Subject.replace(regexPattern , '').toLowerCase();
    } 

    if(row.Medium && row.Medium != undefined) {
        medium = row.Medium.replace(regexPattern, '').toLowerCase();
    } 

    var L1key = Object.keys(row)[_constants.excel_column.L1_NO];
    var L1value = row[L1key];

    if(L1key != undefined && L1value != undefined && row.Subject != '' && L1value != 'NA' ) {
        L1concept = subject+'_'+L1value.replace(regexPattern, '').toLowerCase();
    }

    var L2key = Object.keys(row)[_constants.excel_column.L2_NO];
    var L2value = row[L2key];

    if(L2key != undefined && L2value != undefined && L1concept != '' && L2value != 'NA') {
        L2conceptValue = L2value;
        L2concept = L1concept+'_'+L2value.replace(regexPattern, '').toLowerCase();
    }

    var L3key = Object.keys(row)[_constants.excel_column.L3_NO];
    var L3value = row[L3key];

    if(L3key != undefined && L3value != undefined && L2concept != '' && L3value != 'NA') {
        L3conceptValue = L3value;
        L3concept = L2concept+'_'+L3value.replace(regexPattern, '').toLowerCase();
    }

    async.waterfall([
        async.apply(boardFunction, board,'board'),
        async.apply(mediumFunction, medium,'medium'),
        async.apply(gradeFunction, grade,'gradeLevel'),
        async.apply(subjectFunction, subject,'subject'),
        async.apply(L1TopicFunction, L1concept,'topic'),
        async.apply(L2TopicFunction, L2concept,'topic'),
        async.apply(L3TopicFunction, L3concept,'topic'),
    ], function (err, result) {
        if(err) {
            outerCallback(null,true);
            logger.error('ERROR2 :' + err);
        } else {
            outerCallback(null,true);
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

function boardFunction(board,category,callback) {
    if(board != '' && boardTmp != board) {
        boardTmp = board;
        if(termMap.has(board)){
            boardTmpRes = termMap.get(board);
            callback(null,boardTmpRes);
        } else {
            logger.error("ERROR IN boardFunction");
        }
        
    } else {
        callback(null,boardTmpRes);
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

function mediumFunction(medium,category,boardRes,callback) {
    identifierArray.push(boardRes);
    if(medium != '' && mediumTmp != medium) {
        mediumTmp = medium;
        if(termMap.has(medium)){
            mediumTmpRes = termMap.get(medium);
            var associationsPromise = associationsWithTerm(medium,category);
            associationsPromise.then(function(response) {
                callback(null,mediumTmpRes);
            }, function(err){
                logger.error('MEDIUM ASSOCIATION FUNCTION ERROR :' + err);
                callback(err);
            }); 
        } else {
            logger.error("ERROR IN mediumFunction");
        }
    } else {
        var termPromise = checkOrCreateTerm(medium,category);
        termPromise.then(function(data) {
            var arr = data.result.term.associationswith;
            if(arr && arr != undefined && arr.length > 0) {
                var associationArray = checkIfObjectExist(arr,identifierArray);
                if(associationArray != false) {
                    var associationsPromise = associationsWithTerm(medium,category,associationArray);
                    associationsPromise.then(function(response) {
                        callback(null,mediumTmpRes);
                    }, function(err){
                        logger.error('Medium Associations term update ERROR :' + err);
                        callback(err);
                    });
                } else {
                    callback(null,mediumTmpRes);
                }
            } else {
                logger.log('Medium Association with Error - ' + medium);
            } 
        }, function(err) {
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

function gradeFunction(grade,category,mediumRes,callback) {
    identifierArray.push(mediumRes);
    if(grade != '' && gradeTmp != grade) {
        gradeTmp = grade;
        if(termMap.has(grade)){
            gradeTmpRes = termMap.get(grade);
            var associationsPromise = associationsWithTerm(grade,category);
            associationsPromise.then(function(response) {
                callback(null,gradeTmpRes);
            }, function(err){
                logger.error('GRADE ASSOCIATION FUNCTION ERROR :' + err);
                callback(err);
            }); 
        } else {
            logger.error("ERROR IN gradeFunction");
        }
    } else {
        var termPromise = checkOrCreateTerm(grade,category);
        termPromise.then(function(data) {
            var arr = data.result.term.associationswith;
            if(arr && arr != undefined && arr.length > 0) {
                var associationArray = checkIfObjectExist(arr,identifierArray);
                if(associationArray != false) {
                    var associationsPromise = associationsWithTerm(grade,category,associationArray);
                    associationsPromise.then(function(response) {
                        callback(null,gradeTmpRes);
                    }, function(err){
                        logger.error('Grade Associations term update ERROR :' + err);
                        callback(err);
                    });
                } else {
                    callback(null,gradeTmpRes);
                }
            } else {
                logger.error('Grade Association with Error' + grade);
            } 
        }, function(err) {
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

function subjectFunction(subject,category,gradeRes,callback) {
    identifierArray.push(gradeRes);
    if(subject != '' && subjectTmp != subject) {
        subjectTmp = subject;
        if(termMap.has(subject)){
            subjectTmpRes = termMap.get(subject);
            var associationsPromise = associationsWithTerm(subject,category);
            associationsPromise.then(function(response) {
                callback(null,subjectTmpRes);
            }, function(err){
                logger.error('SUBJECT ASSOCIATION FUNCTION ERROR :' + err);
                callback(err);
            }); 
        } else {
            logger.error("ERROR IN subjectFunction");
        }
    } else {
        var termPromise = checkOrCreateTerm(subject,category);
        termPromise.then(function(data) {
            var arr = data.result.term.associationswith;
            if(arr && arr != undefined && arr.length > 0) {
                var associationArray = checkIfObjectExist(arr,identifierArray);
                if(associationArray != false) {
                    var associationsPromise = associationsWithTerm(subject,category,associationArray);
                    associationsPromise.then(function(response) {
                        callback(null,subjectTmpRes);
                    }, function(err){
                        logger.error('Subject Associations term update ERROR :' + err);
                        callback(err);
                    });
                } else {
                    callback(null,subjectTmpRes);
                }
            } else {
                logger.error('Subject Association Not Found' + subject);
            } 
        }, function(err) {
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

function L1TopicFunction(L1concept,category,subjectRes,callback) {
    identifierArray.push(subjectRes);
    if(L1concept != '' && L1conceptTmp != L1concept) {
        L1conceptTmp = L1concept;
        if(termMap.has(L1concept)){
            L1conceptTmpRes = termMap.get(L1concept);
            var associationsPromise = associationsWithTerm(L1concept,category);
            associationsPromise.then(function(response) {
                callback(null,L1conceptTmpRes);
            }, function(err){
                logger.error('L1 ASSOCIATION FUNCTION ERROR :' + err);
                callback(err);
            }); 
        } else {
            logger.error("ERROR IN L1TopicFunction");
        }
    } else {
        var termPromise = checkOrCreateTerm(L1concept,category);
        termPromise.then(function(data) {
            var arr = data.result.term.associationswith;
            if(arr && arr != undefined && arr.length > 0) {
                var associationArray = checkIfObjectExist(arr,identifierArray);
                if(associationArray != false) {
                    var associationsPromise = associationsWithTerm(L1concept,category,associationArray);
                    associationsPromise.then(function(response) {
                        callback(null,L1conceptTmpRes);
                    }, function(err){
                        logger.error('L1concept Associations term update ERROR :' + err);
                        callback(err);
                    });
                } else {
                    callback(null,L1conceptTmpRes);
                }
            } else {
                logger.error('L1concept Association with Error' + L1concept);
            }
        }, function(err) {
            logger.error('Read Term Error :' + err);
            callback(err);
        });
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

function L2TopicFunction(L2concept,category,L1conceptRes,callback) {

    if(L2concept != '' && !l2Map.has(L2concept)){
        topicIdentifierArray = [];
        topicIdentifierArray.push(L1conceptRes);
        isTopicTerm = true;
        var termPromise = createTerm(L2concept,category,L2conceptValue);
        termPromise.then(function(result) {
            var obj = processTermResponse(result);
            L2conceptTmpRes = obj;
            l2Map.set(L2concept,obj);
            callback(null,L2conceptTmpRes);
        }, function(err) {
            logger.error('L2concept FUNCTION ERROR :' + err);
            callback(err);
        });
    } else {
        callback(null,L2conceptTmpRes);
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

function L3TopicFunction(L3concept,category,L2conceptRes,callback) {
    if(L3concept != '' && L3conceptTmp != L3concept) {
        L3conceptTmp = L3concept;
        topicIdentifierArray = [];
        topicIdentifierArray.push(L2conceptRes);
        isTopicTerm = true;
        var termPromise = createTerm(L3concept,category,L3conceptValue);
        termPromise.then(function(result) {
            L3conceptTmpRes = result;
            callback(null,result);
        }, function(err) {
            logger.error('L3concept FUNCTION ERROR :' + err);
            callback(err);
        });
    } else {
        callback(null,L3conceptTmpRes);
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

let checkOrCreateTerm = function(term,category,termValue){
    var options = {
        method: 'GET',
        url: _constants.api_base_url + _constants.framework_url.api_framework_category_term_read+term+'?framework='+_constants.framework_id+'&category='+category,
        headers: {
            'content-type': 'application/json',
            'Authorization': 'Bearer ' + _constants.apiAuthToken,
            'user-id': 'Ekstep',
            'X-Channel-Id' : 'in.ekstep'
        },
        json: true
    }
    return new Promise(function(resolve, reject) {
        var startTime = performance.now();
        request(options, function (error, response, body) { 
            if (error) {
                logger.error('READ TERM API ERROR : ' + error);
                reject(error);
            } else if (body && body.responseCode == 'OK') {
                // logger.info('ROW NO >  ' + index + '  > READ TERM : REQUEST : ' + JSON.stringify(options) + ' RESPONSE : ' + JSON.stringify(body));
                resolve(body);
            } else {
                var createTermPromise = createTerm(term,category,termValue);
                createTermPromise.then(function(result) {
                    resolve(result);
                }, function(err) {
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

let createTerm = function(term,category,termValue){
     
    var body = {
        "request": {
            "term": {
            "name": termValue, 
            "label" : termValue,
            "description": termValue,
            "code": term,
            "index":index
            }
        }
    }
    
    if(isTopicTerm){
        body.request.term.parents = topicIdentifierArray;
    } 
    var options = {
        method: 'POST',
        url: _constants.api_base_url + _constants.framework_url.api_framework_category_term_create+'='+_constants.framework_id+'&category='+category,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + _constants.apiAuthToken,
          'user-id': 'Vaibhav',
          'X-Channel-Id':_constants.rootOrghashId
        },
        body:body,
        json: true
      }
  
      return new Promise(function(resolve, reject) {
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

let associationsWithTerm = function(term,category,identifier = ''){
    var body = '';
    if(identifier != ''){
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
        url: _constants.api_base_url + _constants.framework_url.api_framework_category_term_update+term+'?framework='+_constants.framework_id+'&category='+category,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + _constants.apiAuthToken,
        //   'user-id': 'Vaibhav',
          'X-Channel-Id':_constants.rootOrghashId
        },
        body:body,
        json: true
      }
  
      return new Promise(function(resolve, reject) {
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
 * Check if a value is exists in an array 
 *
 * @param {Array} arr 
 * @param {Array} identifierArray
 * @return {Array} Response  - if flag is true than return an array else return false
 * @api public
 * 
 */

function checkIfObjectExist(arr,identifierArray)
{
    var tmpArr = [];
    flag = false;
    for(var i=0;i<arr.length;i++) {
        var obj  = {'identifier' : arr[i].identifier};
        tmpArr.push(obj);
        for(var j=0;j<identifierArray.length;j++) {
            if(arr[i].identifier != identifierArray[j].identifier) {     
                flag = true;
                var obj1  = {'identifier' : identifierArray[j].identifier};
                tmpArr.push(obj1);
            }       
        }
    }     
    if(flag) {
        return tmpArr;
    } else {
        return false;
    }
    
}


// filter the response data

function processTermResponse(response) {
    if(response.result.node_id && !isArray(response.result.node_id)) {
        return {'identifier' : response.result.node_id};
    } else if(response.result.node_id) {
        return {'identifier' : response.result.node_id[0]};
    } else  {
        return {'identifier' : response.result.term.identifier};
    }
}

var createHashMapForTerm = function(termList,response) {
    let termCount = termList.length;
    let resCount = response.result.node_id.length;
    
    try {
        if(resCount === termCount) {
            for (let i = 0; i < termCount; i++) {
                termMap.set(termList[i]['code'],{'identifier' : response.result.node_id[i]});
            }
            return true;
        } else {
            return false;
        }
    } catch (error) {
        logger.error("CREATING HASHMAP " + error);
        return false;
    }

} 

// Check value is an array

let isArray = function(a) {
    return (!!a) && (a.constructor === Array);
};

// Exposing an initFramework

module.exports = { initFramework }; 