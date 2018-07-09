#! /usr/bin/env node

const program = require('commander')
const config = require('config')
const csvUtil = require('csvtojson')
const fs = require('fs')
const request = require('request')
const _ = require('lodash')
var crypto = require('crypto')

const authToken = config.get('auth_token')
const userToken = config.get('user_token')
const contentTypeJson = config.get('content_type_json')

const apiBaseUrl = config.get('api_base_url')
const orgCreateEndpoint = config.get('org_create_endpoint')

const orgDataFile = config.get('input_org_data')
const orgOutputFile = config.get('output_org_data')


/**
 * Save the organisation ID along with the related input data
 * @param  Object data  Input data used to create the organisation
 * @param  String orgId Organisation ID as returned by Sunbird on successful creation of the organisation
 */
let saveResponse = (data, orgId) => {
	let dataToAppend = "\n" + data.provider + ',' + data.externalId + ',' + orgId + ',' + data.channel
	fs.appendFile(orgOutputFile, dataToAppend, function (err) {
		console.log("Data to be appended", dataToAppend)
		if (err) {
			console.log("Error: ", err)
		}
	  	console.log('Saved!')
	})
}

/**
 * Create an organisation with Sunbird.
 * @param  Object options Options used in the API call to create organisation
 * @param  Array  data    [description]
 * @return {[type]}         [description]
 */
let createOrg = (options, data) => {
	let requestObj = {}
	requestObj.orgName = data.orgName
	requestObj.isRootOrg = data.isRoot == 'yes' ? true : false
	requestObj.provider = data.provider
	requestObj.externalId = data.externalId
	requestObj.channel = data.channel = crypto.createHash('md5').update(data.provider + data.externalId).digest("hex")

	options.body.request = requestObj

	request(options, function(err, res, body) { 
	    if (!err && res.statusCode == 200) {
	      	let organisationId = null
	      	if (body.responseCode == 'OK') {
	      		organisationId = body.result.organisationId
	      		saveResponse(data, organisationId)
	      	} 
	    } else {
	    	console.log('************** ERROR while creating the organisation **************')
	    	console.log('************** RESPONSE: ', res.body)
	    	console.log('************** REQUEST: ', options)
	    }
	})
}


/**
 * Initiate the process to create org. Load the data from CSV file, and make call(s) to the createOrg method
 * @return {[type]} [description]
 */
let initCreateOrg = () => {
	let orgCreateUrl = apiBaseUrl + orgCreateEndpoint
	let options = {
	    url: orgCreateUrl,
	    method: 'post',
	    headers: {
	        'X-Authenticated-User-Token': userToken,
	        'Authorization': authToken,
	        'Content-Type': contentTypeJson
	    },
     	body: {
            "request": {}
      	},
    	json: true
	}

	csvUtil()
	.fromFile(orgDataFile)
	.then((orgsData)=>{
	    _.each(orgsData, function(orgData){
	    	createOrg(options, orgData)
	    })
	})
}

/**
 * Program below provides the sub command - 'create' for the base command 'org'.
 */
program
  .version('0.1')
  .command('create')
  .description('Creates users on Sunbird using the details in the provided csv file')
  .action(initCreateOrg)

program.parse(process.argv)