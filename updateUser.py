import json
import requests
import urllib
import prompt
import getpass
import time

base_url = raw_input("Please enter base url: ")                  # this should be a command-line argument
realm_url = base_url + '/auth/realms'
realm = raw_input("Please enter realm: ")
api_key = raw_input("Please enter api key: ")                   # the user should be prompted for this
admin_username = raw_input("Please enter user name: ")          # the user should be prompted for this
provider_id =   raw_input("Please enter provider value: ")      # the user should be prompted for this
keycloak_realm_url = base_url +'auth/admin/realms/'+realm
def login_admin_user(username, password):
    """Given an admin username and password, will return an admin-cli client access token."""
    login_url = realm_url+'/'+realm+'/protocol/openid-connect/token'
    headers = {
        'content-type': "application/x-www-form-urlencoded",    # does this need to be x-www-form-urlencoded? can it be application/json?
        'cache-control': "no-cache",
    }
    payload_data = {
        'client_id': 'admin-cli',
        'grant_type': 'password',
        'username': username,
        'password': password
    }
    payload = urllib.urlencode(payload_data)
    response = requests.request('POST', login_url, data=payload, headers=headers)
    
    # extracting data in json format
    data = response.json()
    print(data)
    return data['access_token']

	
def prompt_user_for_password():
     return getpass.getpass()

def find_users(filters, api_key, user_token):
    """Given a search query, finds users who match the query."""    
    url = base_url + "/api/user/v1/search"
    timestamp = int(round(time.time() * 1000))
    
    headers = {
        'content-type': "application/json",
        'x-consumer-id': "X-Consumer-ID",
        'ts': timestamp,
        'authorization': "Bearer "+api_key,
        'x-authenticated-user-token': user_token,
        'cache-control': "no-cache"
    }
    payload = {
        'id': None,
        'ts': timestamp,
        'params': {},
        'request': {
            'filters': filters,
            'fields': ['identifier'],
            'limit':5000,
        }
    }
    
    fetched_user_ids = 0
    
    # keep calling the API in a loop until the number of records returned is less 
    # than the number of records requested
    while True:
        payload['request']['offset'] = fetched_user_ids
        response = requests.request("POST", url, data=json.dumps(payload), headers=headers)
        data = response.json()
        print(data)
        content = data['result']['response']['content']
        
        for user_details in content:
            yield user_details['identifier']
   
        size = data['result']['response']['count']
        print(size)
        fetched_user_ids += size
        
        if size < payload['request']['limit']:
            # fewer records were retrieved vs the size requested
            # so we have come to the end of the data, so stop looping
            break
        

def remove_all_required_actions(user_id, keycloak_admin_token):
    """Given a user-id and an keycloak admin user token, remove all required actions for the user."""
    url = keycloak_realm_url+'/users/'+user_id
    payload = json.dumps({'requiredActions':[]})
    headers = {
        'authorization': "Bearer "+keycloak_admin_token,
        'content-type': "application/json",
        'cache-control': "no-cache"
    }
    
    response = requests.request("PUT", url, data=payload, headers=headers)
    print(response)
    result = response.json()
    return result
    
    
if __name__ == "__main__":
    admin_password = prompt_user_for_password()
    keycloak_admin_token = login_admin_user(admin_username, admin_password)
    
    found, success, fail = 0, 0, 0
    for user_id in find_users({'provider': provider_id}, api_key, keycloak_admin_token):
        found += 1
        result = remove_all_required_actions(user_id, keycloak_admin_token)
        if result == OK:
            success += 1
        else:
            fail += 1
            
    print("Found {0} users via query: 'provider': {1}".format(found, provider_id))
    print("Successfully removed login requirements for {0} users".format(success))
    print("Unable to remove login requirements for {0} users".format(fail))
    
