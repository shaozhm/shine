SHINE Polyglot app
================

## Prerequisites
Execute the following command to build the odata application before deployment. 
```
mvn clean install
```

For the following apps a local node installation has to be done to load the SAP specific node modules.
db, admin-ui, admin-js
For example for db folder, execute the following commands
```
cd db
npm install
```

Also please replace [c/d/i-user] with your id in the manifest.yml before pushing the application.


##Create a service for the UAA

```
cf create-service sap-login default uaa-refapps -c xs-security.json
```
Create group and assign role to the required users here: https://sap-login-test.cfapps.neo.ondemand.com. Use https://wiki.wdf.sap.corp/wiki/display/xs2/Authorization+with+Scopes+for+XS2+Monsoon+Readymade for reference
