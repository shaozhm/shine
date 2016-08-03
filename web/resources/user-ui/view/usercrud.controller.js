sap.ui.controller("shine.democontent.epm.usercrud.view.usercrud", {

    onInit : function(){
        var oLocalUserData = {
            "FirstName": "",
            "LastName" : "",
            "Email" : "",
            "UserId" : 1
        };
        this.oLocalUserModel = new sap.ui.model.json.JSONModel(oLocalUserData);
        this.getView().setModel(this.oLocalUserModel,"user");
        
        var oLocalUserBatchData = [{
            "FirstName": "",
            "LastName" : "",
            "Email" : "",
            "UserId" : 1
        }];
        this.oBatchModel = new sap.ui.model.json.JSONModel(oLocalUserBatchData);
        this.getView().setModel(this.oBatchModel,"batch");
        
        this.oBatchDialog = null;
        
        var data = { languages: [{
        "name": "German"    
    }]
    };

    var oModel = new sap.ui.model.json.JSONModel(data);
    this.getView().setModel(oModel,"lang");

    //Call the User Service (GET) and populate the table.
    this.loadJobsTable();

    },

    loadJobsTable: function() {
        var oThis = this;
        var oTable = oThis.byId("userTbl");
        $.ajax({
            type: "GET",
            async: true,
            url: "/user/odata/v4/sap.hana.democontent.epm.data._.UserData/User",
            contentType: "application/json",
            headers: {
                'x-csrf-token': 'Fetch'
            },
            success: function(data, textStatus, request) {
                
                var oModelTable = new sap.ui.model.json.JSONModel();
                oModelTable.setData({
                    modelData: data.value
                });
                oTable.setModel(oModelTable);
                oTable.bindRows("/modelData");
                
            },
            error: function(error){
                console.log(error);
            }
            
        });
    },

    callUserService: function() {
        
        var oModel = this.getView().getModel();
        var oThis = this;
        
        var oEntry = this.getView().getModel("user").getData();
        var xsrf_token;
        $.ajax({
            type: "GET",
            async: false,
            url: "/user/odata/v4/sap.hana.democontent.epm.data._.UserData/User",
            contentType: "application/json",
            headers: {
                'x-csrf-token': 'Fetch'
            },
            success: function(data, textStatus, request) {
                xsrf_token = request.getResponseHeader('x-csrf-token');
            },
            error: function(error){
                console.log(error);
            }
        });
        
        var aUrl = '/user/odata/v4/sap.hana.democontent.epm.data._.UserData/User';
        jQuery.ajax({
            url: aUrl,
            method: 'POST',
            data: JSON.stringify(oEntry),
            contentType: "application/json",
            headers: {
                'x-csrf-token': xsrf_token
            },
            success: function(){
                sap.ui.commons.MessageBox.alert(oThis.getView().getModel("i18n").getProperty("USER_CREATED"));
                oThis.loadJobsTable();
                oThis.resetUserModel();
            },
            error: function(error) {
                sap.ui.commons.MessageBox.alert(oThis.getView().getModel("i18n").getProperty("ERROR"));
                console.log(error);
            }
        });

    },

    updateService: function(Event) {
        //var oModel = this.byId("userTbl").getModel();


        var oThis = this;
        var oTable = oThis.byId("userTbl");
        // Get the index of the table.
        var link = Event.getSource();
        link = link.toString();
        var index = link[(link.length) - 1];
        var selectedRow = oTable.getRows()[index];
        var cells = selectedRow.getCells();
        
        // construct the object
        var oEntry = {
            "FirstName": cells[1].getValue(),
            "LastName" : cells[2].getValue(),
            "Email" : cells[3].getValue(),
            "UserId" : parseInt(cells[0].getValue())
        };

        var model = oTable.getModel();
        var userId = cells[0].getValue();

        var xsrf_token;
        $.ajax({
            type: "GET",
            async: false,
            url: "/user/odata/v4/sap.hana.democontent.epm.data._.UserData/User",
            contentType: "application/json",
            headers: {
                'x-csrf-token': 'Fetch'
            },
            success: function(data, textStatus, request) {
                xsrf_token = request.getResponseHeader('x-csrf-token');
            },
            error: function(error){
                console.log(error);
            }
        });
        var aUrl = '/user/odata/v4/sap.hana.democontent.epm.data._.UserData/User'+'('+userId + ')';
            jQuery.ajax({
                url: aUrl,
                method: 'PUT',
                async: false,
                data: JSON.stringify(oEntry),
                contentType: "application/json",
                headers: {
                    'x-csrf-token': xsrf_token
                },
                success: function(){
                    //sap.ui.commons.MessageBox.alert(i18n.getProperty("CC_NUMBER_ADDED"));
                    oThis.loadJobsTable();
                },
                error: function(error) {
                    sap.ui.commons.MessageBox.alert(oThis.getView().getModel("i18n").getProperty("ERROR"));
                    console.log(error);
                    
                }
            });

    },

    onDeletePress: function(oEvent) {
        var oThis = this;
        var oTable = oThis.byId("userTbl");
        var model = oTable.getModel();
        var userId = model.getProperty("UserId", oTable.getContextByIndex(oTable.getSelectedIndex()));

        if (!userId) {
            jQuery.sap.require("sap.ui.commons.MessageBox");
            sap.ui.commons.MessageBox.show(oThis.getView().getModel("i18n").getProperty("SELECT_ROW"), "ERROR", "User CRUD");
        } else {

            var xsrf_token;
            $.ajax({
                type: "GET",
                async: false,
                url: "/user/odata/v4/sap.hana.democontent.epm.data._.UserData/User",
                contentType: "application/json",
                headers: {
                    'x-csrf-token': 'Fetch'
                },
                success: function(data, textStatus, request) {
                    xsrf_token = request.getResponseHeader('x-csrf-token');
                },
                error: function(error){
                    console.log(error);
                }
            });
        
            var aUrl = '/user/odata/v4/sap.hana.democontent.epm.data._.UserData/User'+'('+userId + ')';
            jQuery.ajax({
                url: aUrl,
                method: 'DELETE',
                contentType: "application/json",
                headers: {
                    'x-csrf-token': xsrf_token
                },
                success: function(){
                    sap.ui.commons.MessageBox.alert(oThis.getView().getModel("i18n").getProperty("USER_DELETED_SUCCESS"));
                    oThis.loadJobsTable();
                },
                error: function(error) {
                    sap.ui.commons.MessageBox.alert(oThis.getView().getModel("i18n").getProperty("USER_DELETE_FAILURE"));
                    console.log(error);
                }
            });

        }
    },
    
    onFileTypeMissmatch : function(){
        this.oFileUploader.clear();
    },
    
    openBatchDialog : function(){
        if(!this.oBatchDialog){
            this.oBatchDialog = sap.ui.xmlfragment("shine.democontent.epm.usercrud.view.batchDialog",this);
            this.getView().addDependent(this.oBatchDialog);
        }
        this.oBatchDialog.open();
    },
    
    addNewLineItem : function(){
        
        var oLocalUserData = {
            "FirstName": "",
            "LastName" : "",
            "Email" : "",
            "UserId" : 1
        };
        this.getView().getModel("batch").getData().push(oLocalUserData);
        this.getView().getModel("batch").updateBindings("true");
        
    },
    
    openTileDialog : function(oEvent){
        var iData = parseInt(oEvent.getSource().data("tileDialog"));
        var oTileDialog = new sap.account.TileDialog(this,iData);
        this.getView().addDependent(oTileDialog);
        oTileDialog.open(iData);
    },
    
    onBatchDialogClose : function(){
        //reset the model
         this.getView().getModel("batch").setData([{
            "FirstName": "",
            "LastName" : "",
            "Email" : "",
            "UserId" : 1
        }]);
    },
    isDeleteIconVisible : function(oEvent){
        if(oEvent.UserId === "0000000000"){
            return false;
        }
        return true;
    },
    
    onRemoveRow : function(oEvent){
        var regEx = /\d+/;
        var sPath = oEvent.getSource().getBindingContext("batch").getPath();
        var iIndex = sPath.match(regEx);
        var oBatchModel = this.getView().getModel("batch");
        oBatchModel.getData().splice(iIndex,1);
        oBatchModel.updateBindings();
    },
    
    resetUserModel : function(){
         
         var oLocalUserData = {
            "FirstName": "",
            "LastName" : "",
            "Email" : "",
            "UserId" : 1
        };
        this.getView().getModel("user").setData(oLocalUserData);
    },
    
    handlePressHome: function(oEvent) {
        var oShell = this.getView().byId("myShell");
        var bState = oShell.getShowPane();
		oShell.setShowPane(!bState);
    },
  
  onListItemPress : function (oEvent){
    //   var oTileDialog = new sap.account.TileDialog(this,1);
    //   this.getView().addDependent(oTileDialog);
    //   oTileDialog.open(1);
    //   var oBtnOk = sap.ui.getCore().byId("idOkBtn");
    //   oBtnOk.addDelegate({"onpress":function(){
    //     var win = window.open("/sap/hana/democontent/epm/ui/userCRUD/index.html?sap-ui-language=de", '_blank');
    //     win.focus(); 
  
		var oItem = oEvent.getParameters();
		var item = JSON.stringify(oItem);
		var languageId = item.substr(36,1);
				
        var oDialog;
        var btnOk = new sap.m.Button( {
               text : "{i18n>OK}",
               press: function(oEvent){
                  oDialog.close();
               }
            });
        
            var oTextView = new sap.ui.core.HTML({
                content: "{i18n>TRANSLATE_TO_LANG"+languageId+"_LINK}",
                width: "100%"
            });
             var destroyDialog = function(oEvent) {
                oEvent.getSource().destroy();
             };
            oDialog = new sap.m.Dialog({
                title: "{i18n>TRANSLATE_TO_LANG"+languageId+"}",
                content : [ oTextView ],
    			buttons : [ btnOk ],
    			closed: destroyDialog
    		});
    		if(!(oDialog.isOpen())){
    	    	this.getView().addDependent(oDialog);
    		    oDialog.open();
    		}
      }
});