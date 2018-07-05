// constant varibles

module.exports = {
    'api_base_url': '', // please provide the base url here
    'framework_url' : {
        'api_framework_read':'framework/v1/read/',
        'api_framework_create':'framework/v1/create/',
        'api_framework_category_read' : 'framework/v1/category/read/',
        'api_framework_category_create' : 'framework/v1/category/create?framework',
        'api_framework_category_term_create' : 'framework/v1/term/create?framework',
        'api_framework_category_term_read' : 'framework/v1/term/read/',
        'api_framework_category_term_update' : 'framework/v1/term/update/'
    },
    'framework_name' : '', // please specify the famework name 
    'framework_id' : '', // please specify the famework_id 
    'rootOrghashId':'', // Please add the orgId's hash value
    'apiAuthToken' : '', // Please provide the API auth token
    'framework_category' : [], // use the categories which is available as master categories that can be got from https://staging.ekstep.in/framework/v3/category/master/search api
    'xlsx_input' : {
        'file_name' : 'final_taxonomy.xlsx' // please provide the taxonomy file here
    },
    'excel_column' : {
        
    },
    'transalation_column' : {
      
    },
    'translations' : true,
    'translations_lang' : '',
    'bulk_term_limit' : 100
};
