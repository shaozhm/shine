sap.ui.controller("shine.democontent.epm.poworklist.ext.controller.Reports", {

	onInit: function(){
		//alert("yugu")
		var oPieModel = new sap.ui.model.json.JSONModel();
		var data = [{
                label:"Empty",
                data: 1
            }];
            oPieModel.setData({
                modelData: data
            });
        
             sap.ui.getCore().byId("shine.democontent.epm.poworklist::sap.suite.ui.generic.template.ObjectPage.view.Details::POHeader--myPie").setModel(oPieModel,"piemodel");
            sap.ui.getCore().byId("shine.democontent.epm.poworklist::sap.suite.ui.generic.template.ObjectPage.view.Details::POHeader--lblPie").setText("Summary of PO Gross Value in EUR");
            
            var oGroupBy = sap.ui.getCore().byId("shine.democontent.epm.poworklist::sap.suite.ui.generic.template.ObjectPage.view.Details::POHeader--DDLBGroupBy");
            oGroupBy.fireChange({
                newValue: "Company Name",
                selectedItem: oGroupBy.getItems()[0]
            });
	},
	setGroupBy: function(oEvent, oController) {
        var groupBy = oEvent.oSource.getSelectedItemId();
        groupBy  = /[^-]*$/.exec(groupBy)[0];
        var aUrl = '/sap/hana/democontent/epm/services/poWorklistQuery.xsjs?cmd=getTotalOrders' + '&groupby=' + escape(groupBy) + '&currency=USD&filterterms=';
		sap.ui.core.BusyIndicator.show();
        jQuery.ajax({
            url: aUrl,
            method: 'GET',
            dataType: 'json',
            success: onLoadTotals,
            error: onErrorCall,
            complete: function(){
            	sap.ui.core.BusyIndicator.hide();
            }
        });
       

    }


});
function onLoadTotals(myJSON) {
	var oPieModel = new sap.ui.model.json.JSONModel();
    var data = [];
    for (var i = 0; i < myJSON.entries.length; i++) {
        data[i] = {
            label: myJSON.entries[i].name,
            data: myJSON.entries[i].value
        };
    }
    oPieModel.setData({
        modelData: data
    });
     sap.ui.getCore().byId("shine.democontent.epm.poworklist::sap.suite.ui.generic.template.ObjectPage.view.Details::POHeader--myPie").setModel(oPieModel,"piemodel");
    sap.ui.core.BusyIndicator.hide();
}
function onErrorCall(jqXHR, textStatus, errorThrown) {
    sap.ui.core.BusyIndicator.hide();
    if (jqXHR.status == '500') {
        sap.ui.commons.MessageBox.show(jqXHR.responseText,
            "ERROR",
            "Error");
        return;

    } else {
        sap.ui.commons.MessageBox.show(jqXHR.statusText,
            "ERROR",
            "Error");
        return;

    }
}