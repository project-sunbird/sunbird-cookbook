
Please do following steps:

Step 1 :  Change the board name Ex. State (Rajasthan)
Step 2 :  Change excel's column name and check column order (Ex.Chapter - Concept Name) For V2
Step 3 :  Remove Hidden sheet 
STep 3 :  Configure config file
          - Framework Name
          - Framework ID
          - Excel Input filepath
          - Check excel column name and order
          - Transalation column order and name


// To run application on server

1. nohup node index.js &
2. ps -ef|grep index.js 
3. curl "http://localhost:3000/v2/getframework"
4. tail -f 'filepath'


// Stop the nodejs application

kill -9 'processid'