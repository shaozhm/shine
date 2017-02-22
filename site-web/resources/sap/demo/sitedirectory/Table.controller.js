sap.ui.define([
    'jquery.sap.global',
    './Formatter',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel'
], function (jQuery, Formatter, Controller, JSONModel) {
    "use strict";

    var TableController = Controller.extend("sap.demo.sitedirectory.Table", {

        onInit: function () {
            // set explored app's demo model on this sample
            var oModel = new JSONModel("/portal/rest/v1/sites");
            this.getView().setModel(oModel);


            oModel.attachRequestCompleted(function (oEvent) {
                var model = oEvent.getSource();
                console.log(model.getData(), "model loaded");

                model.getData().forEach(function (site) {
                    $.ajax("/v2/apps/" + site.hostGuid).done(function (res) {
                        site.state = res.applicationEntity.state;
                        site.instances = "("+res.applicationEntity.instances+"/"+res.applicationEntity.instances+" instances)";

                        $.ajax("/v2/apps/" + site.hostGuid + "/env").done(function (res) {
                            var appEnv = JSON.parse(res.application_env_json[0].value),
                                url = appEnv.full_application_uris[0];
                            site.url = url;
                            model.refresh();
                        });
                    });
                });


            });


        }
    });

    return TableController;

});
