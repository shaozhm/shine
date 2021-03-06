SHINE XSA 1.7.6
================
SAP HANA Interactive Education, or SHINE, is a demo application that makes it easy to learn how to build applications on SAP HANA Extended Application Services Advanced Model. This demo application is delivered as a package that contains sample data and design-time developer objects for the applications database tables, views, OData and user interface.
The application consists of the following packages:



- core-db - This is the core db package contains Core data models artifacts required to create the tables and other database artifacts (for example, .hdbcds, .hdbsequence, and so on).

- core-node - This package has the Node.js implementation of Data Generator, Job Scheduler.

- core-xsjs - This package has the Node.js implementation of PO Worklist, Sales Dashboard, Spatial Demo using xsodata libraries.

- site-content - This package contains the JSON configurations for the Fiori as a Service module.

- site-web - This package contains the user interface for Fiori as a Service for the SHINE Launchpad.

- user-db - This package contains the artifacts contains the db artificats for User Creation.

- user-xsjs - This package contains the User CRUD implementation in nodejs using xsodata libraries.

- web - This package contains the user interface for the SHINE Launchpad, Data Generator, and Purchase Order Worklist, Sales Dashboard, User CRUD pplications implemented in SAP UI5.




## Prerequisites
The following components should be installed before SHINE installation on XSA:

- XSAC_MONITORING   
If not installed,please download the latest version from milestone [here](http://nexus.wdf.sap.corp:8081/nexus/content/repositories/build.releases/com/sap/xsa/admin/sap-xsac-admin) or release [here](http://nexus.wdf.sap.corp:8081/nexus/content/repositories/build.milestones/com/sap/xsa/admin/sap-xsac-admin/).


- XSAC_SERVICES   
If not installed,please download the latest version to be installed from milestone[here](http://nexus.wdf.sap.corp:8081/nexus/content/repositories/deploy.milestones.xmake/com/sap/xs/jobscheduler/jobscheduler-assembly/ "here") or release[here](http://nexus.wdf.sap.corp:8081/nexus/content/repositories/build.releases.xmake/com/sap/xs/jobscheduler/jobscheduler-assembly/).


- sapui5_sb  
SAPUI5 Service broker should be installed for SHINE to run. SHINE depends on SAPUI5 Service broker to provide the SAPUI5 bootstrap URL.

## Installation via Product Installer

Below are three ways to install SHINE:

## Install from HANA Media
SHINE for XSA (XSACSHINE06_xx)can be found in the folder XSA_CONT of HANA Media and SHINE for XSA needs an MTA extension descriptor this can be found in the folder XSA_CONT/extension_descriptors/sap-xsac-shine-1.7.x-XSACSHINE07_x.mtaext.template

- Rename **sap-xsac-shine-1.7.xx.mtaext.template** to **sap-xsac-shine-1.7.xx.mtaext**(.template removed from name)

- Open **sap-xsac-shine-1.7.xx.mtaext** file.

- Also change the < SCHEMA_NAME > to any schema name like SHINE_USER_SCHEMA.

-  Login with a user who has the `XS_AUTHORIZATION_ADMIN` and `XS_CONTROLLER_USER` role collections and also has the spacedeveloper role into the customer space.For more details on how to assign roles to a user, please refer Chapter 3 of [SHINE documentation](https://help.sap.com/doc/13ff61e61a8f442090e27050dc61f019/2.0.03/en-US/SAP_HANA_Interactive_Education_SHINE_for_SAP_HANA_XS_Advanced_en_HANA2SPS03.pdf)

    `xs login -u <USERNAME> -p <PASSWORD>`   

     `xs target –o <orgname> -s <customer spacename>`

- Install shine by running the following command


     `xs install XSACSHINE07_XX.ZIP -e <path to mta extension descriptor>/sap-xsac-shine-1.7.xx.mtaext`

### Build the Source code and Install


- Navigate to the shine folder in the system which contains the source code.



- Execute the following command to run a maven build

    `mvn clean install -s cfg/settings.xml`

- Once the maven build is completed successfully,navigate to the assembly/target folder.

- Open **shine.mtaext** file.

- Also change the < SCHEMA_NAME > to any schema name like SHINE__USER.
-  Login with a user who has the `XS_AUTHORIZATION_ADMIN` and `XS_CONTROLLER_USER` role collections and also has the spacedeveloper role into the customer space.For more details on how to assign roles to a user, please refer Chapter 3 of [SHINE documentation](http://help.sap.com/hana/SAP_HANA_Interactive_Education_SHINE_for_SAP_HANA_XS_Advanced_Model_en.pdf)

    `xs login -u <USERNAME> -p <PASSWORD>`   

     `xs target –o <orgname> -s <customer spacename>`

- Install shine by running the following command from the /assembly/target folder.


     `xs install XSACSHINE06_XX.ZIP -e shine.mtaext`

### Install from nexus
- Download the latest SHINE SCA from one of the following two nexus repositories:
  1. [Milestone nexus](http://nexus.wdf.sap.corp:8081/nexus/content/repositories/deploy.milestones.xmake/com/sap/refapps/sap-xsac-shine/)
  2. [Release nexus](http://nexus.wdf.sap.corp:8081/nexus/content/repositories/deploy.releases.xmake/com/sap/refapps/sap-xsac-shine/)

- Open **sap-xsac-shine-1.6.x.mtaext** file.


-  Login with a user who has the `XS_AUTHORIZATION_ADMIN` and `XS_CONTROLLER_USER` role collections and also has the spacedeveloper role into the customer space.For more details on how to assign roles to a user, please refer Chapter 3 of [SHINE documentation](http://help.sap.com/hana/SAP_HANA_Interactive_Education_SHINE_for_SAP_HANA_XS_Advanced_Model_en.pdf)

    `xs login -u <USERNAME> -p <PASSWORD>`   

     `xs target –o <orgname> -s <customer spacename>`

- Navigate to the folder which contains the SCA and run the following command to install SHINE

     `xs install XSACSHINE06_XX.ZIP -e sap-xsac-shine-1.7.xx.mtaext `


## Deploying SHINE on CF


## Create a service for the HDI container

This step is optional and required only if you want to deploy app via cf push



    cf create-service hana hdi-shared shine-container

#
    cf create-service hana hdi-shared shine-user-container

## Create a service for the UAA
This step is optional and required only if you want to deploy app via cf push

```
cf create-service xsuaa default shine-uaa -c xs-security.json
```
