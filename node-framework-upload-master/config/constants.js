// constant varibles

module.exports = {
    'api_base_url': 'http://13.127.197.25/api/', // please provide the base url here
    'framework_url' : {
        'api_framework_read':'framework/v1/read/',
        'api_framework_create':'framework/v1/create/',
        'api_framework_category_read' : 'framework/v1/category/read/',
        'api_framework_category_create' : 'framework/v1/category/create?framework',
        'api_framework_category_term_create' : 'framework/v1/term/create?framework',
        'api_framework_category_term_read' : 'framework/v1/term/read/',
        'api_framework_category_term_update' : 'framework/v1/term/update/'
    },
    'channelId' : 'Adoption_Test_Org',
    'framework_name' : 'adoption_sunbird', // please specify the famework name 
    'framework_id' : 'adp_sb_01', // please specify the famework_id 
    'rootOrghashId':'0125396682513039360', // Please add the orgId's hash value
    'apiAuthToken' : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIwZTBmN2RhMWJhZDU0YmZmOGQ3ZDU5MWRkYjgzZWRmYSJ9.Idq48kHLe8tLY-lHK1T8RG2MttDghTdddi9zFsV25_g', // Please provide the API auth token
    'framework_category' : ['board','medium','gradeLevel','subject','topic'], // use the categories which is available as master categories that can be got from https://staging.ekstep.in/framework/v3/category/master/search api
    'xlsx_input' : {
        'file_name' : 'final_taxonomy.xlsx' // please provide the taxonomy file here
    },
    'excel_column' : {
        'L1_NO' : 1, // 
        'L2_NO' : 2, // 
        'L3_NO' : 3, //
    },
    'transalation_column' : {
      
    },
    'translations' : true,
    'translations_lang' : '',
    'bulk_term_limit' : 100
};
