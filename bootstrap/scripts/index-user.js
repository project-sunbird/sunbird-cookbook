#! /usr/bin/env node

const program = require('commander')
const config = require('config')
const csvUtil = require('csvtojson')
const fs = require('fs')
const request = require('request')
const _ = require('lodash')

const authToken = config.get('auth_token')
const userToken = config.get('user_token')
const contentTypeJson = config.get('content_type_json')

const apiBaseUrl = config.get('api_base_url')
const userCreateEndpoint = config.get('user_create_endpoint')
const orgUserMapingEndpoint = config.get('org_user_map_endpoint')

const userDataFile = config.get('input_user_data')
const orgDataFile = config.get('output_org_data')
const userOutputFile = config.get('output_user_data')

let orgsData = {}

/**
 * This method will give org object which matches the provider and extId
 * @param  data to be matched with the Input file
 * @return the Org object
 */
let getOrgData = (data) => {
    return _.find(orgsData, function (orgData) {
        return ((orgData.provider === data.provider) && (orgData.externalID === data.orgExternalId))
    })
}

/**
 * method to create User
 * @param  Object options Options used in the API call to create User
 * @param  Array  data
 * 
 */
let createUsers = (options, data) => {
    let orgData = getOrgData(data)
    let opt = options.body.request
    opt.email = data.email
    opt.firstName = data.firstName
    opt.userName = data.userName
    opt.password = data.password
    opt.phone = data.phone
    opt.phoneVerified = (data.phoneVerified === 'yes') ? true : false
    opt.channel = orgData.channel
    let obj = {}
    obj.id = data.userExternalId
    obj.provider = data.provider
    obj.idType = data.userIdType
    opt.externalIds = []
    opt.externalIds.push(obj)

    request(options, function (err, res, body) {
        if (!err && res.statusCode == 200) {
            let result = body.result
            if (result.response === 'SUCCESS') {
                let userData = (JSON.parse(res.request.body)).request
                assignUserToOrg(result, userData, orgData, data , function(userData, roles, result){
                    saveResponse(userData, result, roles)
                })                
            }
        } else {
            console.log('Error', err)
        }
    })
}

/**
 * Method to assign Role and org to a created user
 * @param  Object data  external object
 * @param  Object data  user object
 * @param  Object data  Organisation object
 * @param  Object data  Input data
 * @param  Function     callback function 
 */
let assignUserToOrg = (res, userData, orgData, data, cb) => {
    let orgUserMappingUrl = apiBaseUrl + orgUserMapingEndpoint
    let reqoptions = {
        url: orgUserMappingUrl,
        method: 'post',
        headers: {
            'content-type': contentTypeJson,
            'authorization': authToken,
            'X-Authenticated-User-Token': userToken
        },
        body: {
            "request": {}
        },
        json: true
    }
    let opt = reqoptions.body.request
    opt.organisationId = orgData.sbOrganisationId
    opt.roles = (data.roles).split(",")
    opt.userId = res.userId
    request(reqoptions, function (err, res, body) {
        if (!err && res.statusCode == 200) {
            let result = body.result
            if (result.response === 'SUCCESS') {
                cb(userData, data.roles, res);
            }
        } else {
            console.log('Error in assignUserToOrg', err)
        }
    })

}

/**
 * Save the User ID along with the related input data
 * @param  Object data  Input data used to create the user
 * @param  Object data  User object
 * @param  Object data  Roles object
 */
let saveResponse = (data, res, roles) => {
    let extId = data.externalIds[0]
    let dataToAppend = "\n" + extId.id + ',' + extId.provider + ',' + data.email + ',' + res.userId + ',' + data.phone + ',"'  + roles + '"'
    fs.appendFile(userOutputFile, dataToAppend, function (err) {
        console.log("Data to be appended", dataToAppend)
        if (err) {
            console.log("Error: ", err)
        }
        console.log('Saved!')
    })
}

/**
 * Initiate the process to create user. Load the data from CSV file, and make call(s) to the createUser method
 *
 */
let initCreateUser = () => {
    csvUtil().fromFile(orgDataFile).then((orgs) => {
        orgsData = orgs
    })
    let userCreateUrl = apiBaseUrl + userCreateEndpoint
    let options = {
        url: userCreateUrl,
        method: 'post',
        headers: {
            'content-type': contentTypeJson,
            'authorization': authToken
        },
        body: {
            "request": {}
        },
        json: true
    }
    csvUtil().fromFile(userDataFile).then((usersData) => {
        _.each(usersData, function (userData) {
            createUsers(options, userData)
        })
    })
}

program
    .version('0.1')
    .command('create')
    .description('Creates users on Sunbird using the details in the provided csv file')
    .action(initCreateUser)

program.parse(process.argv)