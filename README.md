SHINE XSA 1.1.2
================

## Prerequisites
Execute the following command to build the odata application before deployment. 
```
mvn clean install
```

For the following apps a local node installation has to be done to load the SAP specific node modules.

db, ui, admin-js, xsjs

For example "db" folder, execute the following commands
```
cd db
npm install
```

Copy the sapui5 zip from this location http://nexus:8081/nexus/service/local/repositories/replication-walldorf.milestones.build.ios.proxy/content/com/sap/ui5/sapui5/1.30.7/sapui5-1.30.7-static.zip
and copy the contents to the following directories
```
ui\sapui5

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

## On Premise deployment
```

mvn clean install

xs install assembly/target/sap-xsac-shine-1.1.0.zip

```

1. From HANA Studio connect to the HANA system and create a restricted user SHINE_USER
2. Uncheck the checkbox Disable ODBC/JDBC access
3. Assign role RESTRICTED_USER_JDBC_ACCESS to the user
4. Assign user parameters 
	XS_RC_XS_AUTHORIZATION_ADMIN: XS_AUTHORIZATION_ADMIN
	XS_RC_XS_CONTROLLER_ADMIN: XS_CONTROLLER_ADMIN
5.  After the deployment of the SHINE App login to uaa-security/ XS Admin App
6. Cick on Role Builder tile and Search for Application shine-admin and Select Role Admin by click on Checkbox
7. Click Configure Role Collection button.
8. Click on + button to create a Role Collection
9. Enter name of Role Collection as SHINE_ADMIN and enter a description
10. Click on button + Add Application Role
11. In the Popoup Select Application Name: Shne-Admin, Template Name: Admin and Application Role: Admin.
12. Click on Ok and then Save button
13. Go back to HANA Studio and create a User Parameter  XS_RC_SHINE_ADMIN:SHINE_ADMIN
14. Launch the url for shine_ui app service and login with SHINE_USER


