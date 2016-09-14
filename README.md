SHINE XSA 1.1.13
================
SAP HANA Interactive Education, or SHINE, is a demo application that makes it easy to learn how to build applications on SAP HANA extended application services advanced model. This demo application is delivered as a package that contains sample data and design-time developer objects for the applications database tables, views, OData and user interface.
The application consists of the following packages:


- db - This package contains the SAP HANA Deployment Infrastructure (HDI) artifacts and the database artifacts required to create the tables and other database artifacts (for example, .hdbcds, .hdbsequence, and so on).


- admin-js -This package has the Node.js implementation of Data Generator application (back end).


- xsjs - This package contains the XSJS implementation for Purchase Order Worklist (back end).


- ui - This package contains the user interface for the SHINE Launchpad, Data Generator, and Purchase Order Worklist applications implemented in SAP UI5.

## Prerequisites
The xsac_monitoring should be installed before launching the application
The jobscheduler application should be installed from [here](http://nexus.wdf.sap.corp:8081/nexus/content/repositories/deploy.milestones.xmake/com/sap/xs/jobscheduler/jobscheduler-assembly/ "here") (Pick the latest vesrion)





##Create a service for the HDI container 

This step is optional and required only if you want to deploy app via xs push  
```
xs create-service hana hdi-shared shine-hdi-container
```

##Create a service for the UAA
This step is optional and required only if you want to deploy app via xs push
```
xs create-service xsuaa default uaa-refapps -c xs-security.json
```
## Create a service for Jobscheduler
This step is optional and required only if you want to deploy app via xs push
```
xs create-service jobscheduler default scheduler-refapps
```


## On Premise deployment
```
xs install sap-xsac-shine-1.1.13.zip
```

1. From HANA Studio connect to the HANA system and create a user SHINE_USER
2. Assign user parameters 
	- `XS_RC_XS_AUTHORIZATION_ADMIN: XS_AUTHORIZATION_ADMIN`  
	- `XS_RC_XS_CONTROLLER_USER: XS_CONTROLLER_USER`
3. After the deployment of the SHINE App login to xsac_monitoring app
4. Cick on Role Builder tile and Search for Application shine-admin and Select Role Admin by click on Checkbox
5. Click Configure Role Collection button.
6. Click on + button to create a Role Collection
7. Enter name of Role Collection as SHINE_ADMIN and enter a description
8. Click on button + Add Application Role
9. In the Popoup Select Application Name: Shne-Admin, Template Name: Admin and Application Role: Admin.
10. Click on Ok and then Save button
11. Go back to HANA Studio and create a User Parameter  XS_RC_SHINE_ADMIN:SHINE_ADMIN
12. Launch the url for shine_ui app service and login with SHINE_USER.
13. 
14.




