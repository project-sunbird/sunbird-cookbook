# Bootstrap Sunbird with Organisations and Users
This utility helps you easily create organisations and users in a Sunbird v1.8
Note: This version supports organisation creation only.

### Installation
This utility requires [Node.js](https://nodejs.org/) v8.11+ to run.
Install the dependencies.
```sh
$ npm install
```
### Configuration
All the configurations are available in `config/default.json`
`api_base_url`: Base URL of your Sunbird installation ending with `api/`.
`auth_token`: Authorization token to make API calls.
`user_token`: User access token belonging to a user having permissions to create organisations and users.

### Data
This utility accepts input data for creating organisations and users in csv format. Sample csv files are available in `data\input\org.csv` and `data\input\user.csv`. You may edit them to add the required data. 

If you want to change the location of input files, feel free to do so. In this case you need to update the respective configurations - `input_org_data` and `input_user_data`

Note: Please ensure that in the first row of the org.csv `isRoot` column has a value `'yes'`. At this point this utility does not support multiple root organisations in one run.

### Execution
To create organisations, please run the following command
```sh
$ node index.js org create
```

To create users, please run the following command
```sh
$ node index.js user create
```

### Output
The IDs and related data of the created organisations and users are saved in `data/output/org.csv` and `data/output/user.csv` respectively.