import requests

username = "keycalok admin user name"
password = "password"
releam = "sunbird"
apiKey = "api gateway key";
keycloakUrl = "https://diksha.gov.in/auth/realms/"
keycloakRestUrl = "BaseUrl/auth/admin/realms"
filterKey = "apekx"
url = keycloakUrl+releam+"/protocol/openid-connect/token"

payload = "client_id=admin-cli&username="+username+"&password="+password+"&grant_type=password"
headers = {
    'content-type': "application/x-www-form-urlencoded",
    'cache-control': "no-cache",
    'postman-token': "dd6be762-a743-e847-50ec-bd1393403349"
    }

response = requests.request("POST", url, data=payload, headers=headers)

#print(response.text)
# extracting data in json format
data = response.json()
token = data['access_token']

url = "https://diksha.gov.in/api/user/v1/search"

payload = "\n{\n\"id\":\"unique API ID\",\n\"ts\":\"2013/10/15 16:16:39\",\n  \"params\": {\n      \n  },\n \"request\": {\n        \"filters\":{\n           \"provider\":\""+filterKey+"\"\n        },\n        \"fields\":[\"identifier\"],\n        \"limit\":10000,\n        \"offset\":0\n        \n    }\n}"
headers = {
    'content-type': "application/json",
    'x-consumer-id': "X-Consumer-ID",
    'ts': "2017-05-25 10:18:56:578+0530",
    'x-msgid': "8e27cbf5-e299-43b0-bca7-8347f7e5abcf",
    'authorization': "Bearer "+apiKey,
    'x-authenticated-user-token': token,
    
    'cache-control': "no-cache",
    'postman-token': "92c86733-7ca3-b7e0-1c9f-966118349b69"
    }

response = requests.request("POST", url, data=payload, headers=headers)

data = response.json()
size = data['result']['response']['count']

for i in range(0,9999):
    identifier = data['result']['response']['content'][i]['identifier']
    url = keycloakRestUrl+releam+"/users/"+identifier
    payload = "{\"requiredActions\":[]}"
    headers = {
    'authorization': "Bearer "+token,
    'content-type': "application/json",
    'cache-control': "no-cache",
    'postman-token': "f33cf350-cd6c-76b6-969b-f74bab72b618"
    }
    response = requests.request("PUT", url, data=payload, headers=headers)
    print(response)

