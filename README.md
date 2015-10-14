SHINE 2.0.0
================

## Prerequisites
Execute the following command to build the odata application before deployment. 
```
mvn clean install
```

For the following apps a local node installation has to be done to load the SAP specific node modules.

db, admin-ui, admin-js, purchase-ui, ui-router, launchpad, xsjs

For example "db" folder, execute the following commands
```
cd db
npm install
```

Copy the sapui5 zip from this location http://nexus:8081/nexus/service/local/repositories/replication-walldorf.milestones.build.ios.proxy/content/com/sap/ui5/sapui5/1.30.7/sapui5-1.30.7-static.zip
and copy the contents to the following directories
```
admin-ui\sapui5
launchpad\sapui5
purchase-ui\sapui5
```

Also please replace [c/d/i-user] with your id in the manifest.yml before pushing the application.


##Create a service for the HDI container

```
cf create-service hana hdi-shared shine-hdi-container
```

##Create a service for the UAA

```
cf create-service sap-login default uaa-refapps -c xs-security.json
```
Create group and assign role to the required users here: https://sap-login-test.cfapps.neo.ondemand.com. Use https://wiki.wdf.sap.corp/wiki/display/xs2/Authorization+with+Scopes+for+XS2+Monsoon+Readymade for reference.
