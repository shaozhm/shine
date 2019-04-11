SHINE for XS Advanced SAP HANA 2.0 SPS04
===============

The new and changed features included in this release of SHINE for XS Advanced are as follows:
 
1. Unit tests for tables,views,functions,procedures in Node.js

2. SecureStore in Node.js



This release of the application consists of the following packages:


- core-db - This is the core db package contains Core data models artifacts required to create the tables and other database artifacts (for example, .hdbcds, .hdbsequence, and so on).

- core-node - This package has the Node.js implementation of Data Generator, Job Scheduler.

- core-xsjs - This package has the Node.js implementation of PO Worklist, Sales Dashboard, Spatial Demo using xsodata libraries.

- site-content - This package contains the JSON configurations for the Fiori as a Service module.

- site-web - This package contains the user interface for Fiori as a Service for the SHINE Launchpad.

- user-db - This package contains the artifacts contains the db artificats for User Creation. 

- user-xsjs - This package contains the User CRUD implementation in nodejs using xsodata libraries.

- web - This package contains the user interface for the SHINE Launchpad, Data Generator, and Purchase Order Worklist, Sales Dashboard, User CRUD pplications implemented in SAP UI5.

## Prerequisites
The following components should be installed before SHINE installation on XSA. If not installed please contact your system administrator to install them.

- XSAC_MONITORING   

- XSAC_SERVICES   

- XSAC_PORTAL_SERVICES

- SAPUI5_FESV4

- Auditlog service   

Note: In HANA Express, the Job Scheduler(XSAC_SERVICES) could be pre-installed.
If the services are stopped, please contact the system administrator to start them.

## Importing SHINE from GitHub to SAP Web IDE for SAP HANA

- Launch SAP Web IDE for SAP HANA.

- Navigate to File->Git->Clone Repository
- Enter the URL of the repository as [https://github.com/SAP/hana-shine-xsa.git](https://github.com/SAP/hana-shine-xsa.git)

- Choose OK.


- Create a service for the UAA by executing the command in CLI of XSA system:

    `xs create-service xsuaa default shine-uaa -c xs-security.json`

- Create Job Scheduler Service by executing the command in CLI of XSA system:
  
    `xs cs jobscheduler default shine-scheduler`
- Create Auditlog service by executing the following command:   

    `xs cs auditlog free shine-auditlog`
    
- Create HANA Secure store service by executing the following command:   

    `xs cs hana securestore secureStore`    

- Create SAPUI5 broker service by executing the following command:

    `xs cs sapui5_sb sapui5-1.52 sapui5-provider`

- 	After all these services are created, build and run all modules like core-db, user-db, core-node, core-xsjs, user-xsjs, user-java and web.



Note: While building the core-db module, the following two things have to be replaced in the mta.yaml:

a)	UAA Endpoint 

b)	Controller Endpoint

	
For more details on how to do the above steps, please refer below:
	
   a)	**UAA Endpoint**: Please replace the UAA end point URL in line 204 of mta.yaml to your respective UAA end point URL which will    be of the format :

   `http(s)://<host-name >:3<instance-number>32/ uaa-security`

   For example in HANA express the UAA endpoint can be https://hxehost:39032/uaa-security

   b)   **Controller Endpoint**: Please replace the controller end point URL in line 214 of the mta.yaml file to your respective XS controller end point.
   
   ` http(s)://<host name>:<xs controller port>`

   By default, the xs controller port is 3##30 where ## is the instance number

   Please Note, In HANAExpress VM install has default instance as 90, Binary install is a user-defined number.   
   This will install SHINE without FLP. Please follow the steps in the below section to deploy SHINE with FLP.

Please note, the audit log service needs to be bound manually to the shine-core-node
application. This can be done by doing a dummy run of the core-node module and after it fails
execute following command in the CLI of the XSA system:

`xs bs <WEBIDE_USERNAME>…<PROJECTNAME>-core-node shine-auditlog`

The core-node application deployed via SAP WebIDE for SAP HANA will be of the format  

`<WEBIDE_USERNAME>…. <PROJECTNAME>-core-node`

Rerun the core-node after executing the above command. 

## Deploy SHINE for XSA application with FLP  ##

After doing the above steps,

- Right click on the shine project folder and select Build.
- After successful build of the project, there will be a folder called mta_archives created in the workspace.
- Expand the folder and expand the folder com.sap.refapps.shine_1.x.x.mtar file present inside.
- Right click on the mtar file present inside and select Export.
- Once exported, login to the XSA system via CLI and deploy the mtar file using the following command:
    
    `xs deploy com.sap.refapps.shine_1.x.x.mtar`
    


   For more information on cloning, building, deploying etc. for XSA applications, see [SAP Web IDE for SAP HANA - Installation and  Upgrade Guide. ](https://help.sap.com/viewer/4505d0bdaf4948449b7f7379d24d0f0d/2.0.03/en-US/0a1c5d829a074a8a889acd2ace444042.html)




## Troubleshooting

1. If the SHINE installation message fails with the message, 
Error resolving merged descriptor properties and parameters: No configuration entries were found matching the filter specified in resource "sapui5-provider" 
Install SAPUI5_FESV4 version 1.52 and reinstall SHINE.

2. If the build of any module fails with the error message that looks like:   
   **No compatible version found: @sap/jobs-client@1.1.1**

Then open the package. json of the module which failed and change the version of the library shown in the error message to one of the correct versions also mentioned in the error message.

You can also check the compatible versions of the libraries by right-clicking on the module and selecting “Show dependency updates”



## Support
For any question/clarification or report an issue in SHINE please [create issue](https://github.com/sap/hana-shine-xsa/issues/new/)

[SHINE XSA for HANA 2.0 SPS 03 Documentation ](https://help.sap.com/http.svc/rc/13ff61e61a8f442090e27050dc61f019/2.0.03/en-US/SAP_HANA_Interactive_Education_SHINE_for_SAP_HANA_XS_Advanced_en_HANA2SPS03.pdf)

## License
[Apache License 2.0](LICENSE)
