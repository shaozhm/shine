sap.ui.controller("shine.democontent.epm.poworklist.ext.controller.ListReportExt", {
	onInit: function(){
		var sBusinessPartnersServiceUrl = "/sap/hana/democontent/epm/services/businessPartners.xsodata/";
		var sBusinessPartnersModel = new sap.ui.model.odata.ODataModel(sBusinessPartnersServiceUrl, true);
		var sBusinessPartnersJSONModel;
		var that = this;
		sBusinessPartnersModel.read("/BusinessPartners", {
			method: "GET",
			success: function(data) {
				sBusinessPartnersJSONModel = new sap.ui.model.json.JSONModel();
				sBusinessPartnersJSONModel.setData(data);
				that.getOwnerComponent().setModel(sBusinessPartnersJSONModel, "bspartners");
				sap.ui.getCore().byId("businessPartnerDropDown").setModel(sBusinessPartnersJSONModel, "bspartners");
			},
			error: function() {

			}
		});
		//ProductDetails Model
		var sProductDetailsServiceUrl = "/sap/hana/democontent/epm/services/productDetails.xsodata/";
		var sProductDetailsoModel = new sap.ui.model.odata.ODataModel(sProductDetailsServiceUrl, true);
		var sProductDetailsJSONModel;
		sProductDetailsoModel.read("/ProductDetails", {
			method: "GET",
			success: function(data) {
				// alert(JSON.stringify(data));
				sProductDetailsJSONModel = new sap.ui.model.json.JSONModel();
				sProductDetailsJSONModel.setData(data);
				that.getOwnerComponent().setModel(sProductDetailsJSONModel, "products");
				sap.ui.getCore().byId("productDropDown").setModel(sProductDetailsJSONModel, "products");
			},
			error: function() {

			}
		});
	
	},
	onBeforeRebindTableExtension: function(oEvent) {
		var oBindingParams = oEvent.getParameter("bindingParams");
		oBindingParams.parameters = oBindingParams.parameters || {};
						
		var oSmartTable = oEvent.getSource();
		var oSmartFilterBar = this.byId(oSmartTable.getSmartFilterId());
		var vCategory;
		if (oSmartFilterBar instanceof sap.ui.comp.smartfilterbar.SmartFilterBar) {
			//Custom price filter
			var oCustomControl = oSmartFilterBar.getControlByKey("search");
			if (oCustomControl instanceof sap.ui.commons.SearchField) {
				vCategory = oCustomControl.getValue();
				if(vCategory){
						var attrArr = vCategory.split(":");
						var attr = attrArr[1].trim();
						var valArr = vCategory.split("|");
						var val = valArr[0].trim();
					//	300000000 | Attribute: Purchase Order ID
						switch (attr) {
							case "Purchase Order ID":
								oBindingParams.filters.push(new sap.ui.model.Filter("PURCHASEORDERID", "EQ",val));
								break;
							case "Company Name":
								oBindingParams.filters.push(new sap.ui.model.Filter("COMPANYNAME", "EQ", val));
								break;
							case "City":
								oBindingParams.filters.push(new sap.ui.model.Filter("CITY", "EQ", val));
								break;
							default:
								break;
						}
				}
			}
		}
		
		
	},
	close: function(oEvent) {
		var oDialog = (oEvent.getSource()).getEventingParent();
		this.clearUIFields();
		oDialog.close();
	},
	clearUIFields: function() {
		var uiFieldsArray = [];
		var element1 = "businessPartnerDropDown"; //sap.ui.getCore().byId("businessPartnerDropDown");
		var element2 = "productDropDown"; //sap.ui.getCore().byId("productDropDown");
		var element3 = "quantityTextField";
		uiFieldsArray.push(element1);
		uiFieldsArray.push(element2);
		uiFieldsArray.push(element3);
		var uiFields = uiFieldsArray;
		//	console.log(uiFields);
		for (var i = 0; i < uiFields.length; i++) {
			var uiId = uiFields[i];
			var element = sap.ui.getCore().byId(uiId);
			if (element.getValue() !== "") {
				element.setValue("");
			}
			element.setValueState(sap.ui.core.ValueState.none);
		}
	},
	liveChangeNewPO: function(oEvent) {
		var element = sap.ui.getCore().byId(oEvent.getSource().getId());
		if (element.getValue() === "" && element.getValueState() === "Error") {
			element.setValueState(sap.ui.core.ValueState.Error);
		} else if (element.getValueState() === "Error") {
			element.setValueState(sap.ui.core.ValueState.Success);
		}
	},
	validateFields: function(oEvent) {
		var doSubmit = true;
		var uiFieldsArray = [];
		var element1 = "businessPartnerDropDown"; //sap.ui.getCore().byId("businessPartnerDropDown");
		var element2 = "productDropDown"; //sap.ui.getCore().byId("productDropDown");
		var element3 = "quantityTextField";
		uiFieldsArray.push(element1);
		uiFieldsArray.push(element2);
		uiFieldsArray.push(element3);
		var uiFields = uiFieldsArray;
		for (var i = 0; i < uiFields.length; i++) {
			var uiId = uiFields[i];
			var element = sap.ui.getCore().byId(uiId);
			if (element.getValue() === "") {
				element.setValueState(sap.ui.core.ValueState.Error);
				doSubmit = false;
			} else {
				element.setValueState(sap.ui.core.ValueState.Success);
			}
		}

		return doSubmit;
	},
	submit: function(oEvent) {
		var doSubmit = this.validateFields(oEvent);
		if (doSubmit === false) {
			return;
		}

		var uiKeyMapper = "PARTNERID:businessPartnerDropDown:Y,PRODUCTID:productDropDown,QUANTITY:quantityTextField";
		var uiFieldArrayMapper = uiKeyMapper.split(",");

		var item = {};
		for (var i = 0; i < uiFieldArrayMapper.length; i++) {
			var id = (uiFieldArrayMapper[i].split(":"))[0];
			var uiId = (uiFieldArrayMapper[i].split(":"))[1];
			var element = sap.ui.getCore().byId(uiId);
			var additionalTextVariable = (uiFieldArrayMapper[i].split(":"))[2];
			if (additionalTextVariable !== undefined) {
				var value = element.getSelectedKey();
				item[id] = value;
			} else {
				item[id] = element.getValue();
			}
		}
		sap.ui.core.BusyIndicator.show();
		var xsrf_token;
		$.ajax({
			type: "GET",
			async: false,
			url: "/sap/hana/democontent/epm/services/poCreate.xsodata",
			contentType: "application/json",
			headers: {
				'x-csrf-token': 'Fetch',
				'Accept': "application/json"
			},
			success: function(data, textStatus, request) {
				xsrf_token = request.getResponseHeader('x-csrf-token');
			},
			complete: function(){
				sap.ui.core.BusyIndicator.hide();
			}
		});
		var that = this;
		$.ajax({
			type: "POST",
			url: "/sap/hana/democontent/epm/services/poCreate.xsodata/purchaseDetails",
			headers: {
				'x-csrf-token': xsrf_token,
				'Accept': "application/json",
				'Content-Type': "application/json"
			},
			data: JSON.stringify(item),
			dataType: "json",
			success: function(data) {
				// var obj = JSON.parse(data);
				var oPurchaseOrderId = data.d.PURCHASEORDERID;
				sap.m.MessageBox.show('Purchase Order ' + oPurchaseOrderId + ' Created Successfully',
					"SUCCESS",
					"Purchase Order Created Successfully");
				that.clearUIFields();
				that.extensionAPI.refreshTable();

				//	return;
			},
			error: function(jqXHR, textStatus, errorThrown) {
				sap.m.MessageBox.show("Creation of Purchase orders failed",
					"ERROR",
					"Error");
				that.clearUIFields();
				return;

			}
		});
		//this.onRefresh(oEvent);
		this.dialog.close();
	},
	new: function() {
		if (!this.dialog) {
			this.dialog = sap.ui.xmlfragment("shine.democontent.epm.poworklist.ext.fragment.createPurchaseOrder", this);
			this.getView().addDependent(this.dialog);
		}
		this.dialog.open();
		return;

	},

	delete: function(oEvent) {
		var aContexts = this.extensionAPI.getSelectedContexts();
		if (aContexts && aContexts.length > 0) {
			var poIDArr = aContexts[0].sPath.split("'");
			var poID = poIDArr[1];
			//Perform Action
			sap.m.MessageBox.confirm("Do you sure want to delete Purchase Order ID:" + poID,
				jQuery.proxy(function(bResult) {
					if(bResult==="OK"){
						this.deleteConfirm(bResult, this, poID);
					}
				}, this),
				"Delete Purchase order");
		} else {
			sap.m.MessageBox.error("You must first select a row!", {});
		}
	},
	//Delete Confirmation Dialog Results
	deleteConfirm: function(bResult, oController, poId) {
		var that = this;
		if (bResult) {
			var payload = {
				"payload": [{
					"purchaseOrderId": escape(poId)
				}]
			};
			var xsrf_token;
			$.ajax({
				type: "GET",
				async: false,
				url: "/sap/hana/democontent/epm/services/poCreate.xsodata",
				contentType: "application/json",
				headers: {
					'x-csrf-token': 'Fetch',
					'Accept': "application/json"
				},
				success: function(data, textStatus, request) {
					xsrf_token = request.getResponseHeader('x-csrf-token');
				}
			});
			var aUrl = '/sap/hana/democontent/epm/services/poWorklistUpdate.xsjs?cmd=delete';
			jQuery.ajax({
				url: aUrl,
				method: 'POST',
				headers: {
					'x-csrf-token': xsrf_token
				},
				data: JSON.stringify(payload),
				contentType: "application/json",
				success: function(myTxt) {
					oController.onDeleteSuccess(myTxt, oController, poId);
					that.extensionAPI.refreshTable();
				},
				error: oController.onErrorCall
			});
		}
	},

	//Error Event Handler
	onErrorCall: function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status == '500') {
			sap.m.MessageBox.show(jqXHR.responseText,
				"ERROR",
				"Error");
			return;
		} else {
			sap.m.MessageBox.show(decodeURI(jqXHR.responseText),
				"ERROR",
				"Error");
			return;
		}
	},
	exportExcel: function(oEvent) {
		window.open("/sap/hana/democontent/epm/services/poWorklistQuery.xsjs?cmd=Excel");
		return;
	},
	exportZip: function(oEvent) {
		window.open("/sap/hana/democontent/epm/services/poWorklistQuery.xsjs?cmd=Zip");
		return;
	},
	accept: function(oEvent) {
		var aContexts = this.extensionAPI.getSelectedContexts();
		if (aContexts && aContexts.length > 0) {
			//console.log(aContexts[0].sPath);
			var poIDArr = aContexts[0].sPath.split("'");
			var poID = poIDArr[1];
			var action = "Accept";
			//Perform Action
			sap.m.MessageBox.confirm("Are you sure you want to Accept Purchase Order: " + poID,
				jQuery.proxy(function(bResult) {
					if(bResult==="OK"){
						this.approvalConfirm(bResult, this, poID, action);
					}
				}, this),
				"Purchase Order Accept");
		} else {
			sap.m.MessageBox.error("You must first select a row!", {});
		}
	},
	//Approve Confirmation Dialog Results
	approvalConfirm: function(bResult, oController, poId, action) {
		var that = this;
		if (bResult) {
			var payload = {
				"payload": [{
					"purchaseOrderId": escape(poId)
				}, {
					"Action": escape(action)
				}]
			};
			var xsrf_token;
			$.ajax({
				type: "GET",
				async: false,
				url: "/sap/hana/democontent/epm/services/poCreate.xsodata",
				contentType: "application/json",
				headers: {
					'x-csrf-token': 'Fetch',
					'Accept': "application/json"
				},
				success: function(data, textStatus, request) {
					xsrf_token = request.getResponseHeader('x-csrf-token');
				}
			});
			var aUrl = '/sap/hana/democontent/epm/services/poWorklistUpdate.xsjs?cmd=approval';
			jQuery.ajax({
				url: aUrl,
				headers: {
					'x-csrf-token': xsrf_token
				},
				method: 'POST',
				data: JSON.stringify(payload),
				contentType: "application/json",
				success: function(myTxt) {
					oController.onApprovalSuccess(myTxt, oController, action);
					that.extensionAPI.refreshTable();
				},
				error: oController.onErrorCall
			});
		}
	},
	//Delete Successful Event Handler
	onDeleteSuccess: function(myTxt, oController, poId) {
		sap.m.MessageBox.show("Purchase order ID " + poId + " deleted successfully.",
			"SUCCESS",
			"Delete successfull");
	},

	//Approval Successful Event Handler
	onApprovalSuccess: function(myTxt, oController, action) {

		//oController.refreshTable();
		sap.m.MessageBox.show("Approval Status Change Successful",
			"SUCCESS",
			"Approval status");

	},

	reject: function(oEvent) {
		var aContexts = this.extensionAPI.getSelectedContexts();
		if (aContexts && aContexts.length > 0) {
			//console.log(aContexts[0].sPath);
			var poIDArr = aContexts[0].sPath.split("'");
			var poID = poIDArr[1];
			var action = "Reject";
			//Perform Action
			sap.m.MessageBox.confirm("Are you sure you want to Reject Purchase Order: " + poID,
				jQuery.proxy(function(bResult) {
					if(bResult==="OK"){
						this.approvalConfirm(bResult, this, poID, action);
					}
				}, this),
				"Purchase Order Reject");
		} else {
			sap.m.MessageBox.error("You must first select a row!", {});
		}
	},
	onSuggest: function(oEvent) {
		
		var gSearchParam = oEvent.getParameter("value");
		if (gSearchParam.length >= 3) {
			var aUrl = '/sap/hana/democontent/epm/services/poWorklistQuery.xsjs?cmd=filter' + '&query=' + escape(gSearchParam) + '&page=1&start=0&limit=25';
			jQuery.ajax({
				url: aUrl,
				method: 'GET',
				dataType: 'json',
				success: function(data){
					onLoadFilter(data,gSearchParam);
				},
				error: onErrorCall
			});
		}
	}
	


});
function onLoadFilter(myJSON,gSearchParam) {
	var oSearchControl = sap.ui.getCore().byId("shine.democontent.epm.poworklist::sap.suite.ui.generic.template.ListReport.view.ListReport::POHeader--filterBy");
    var aSuggestions = [];
    for (var i = 0; i < myJSON.length; i++) {
        aSuggestions[i] = myJSON[i].terms + ' | ' + "attribute:" + ' ' + myJSON[i].attribute;
    }

    oSearchControl.suggest(gSearchParam, aSuggestions);
}
function onErrorCall(jqXHR, textStatus, errorThrown) {
    sap.ui.commons.MessageBox.show(jqXHR.responseText,
        "ERROR",
        "Error "+textStatus);
    return;
}