sap.ui.define(function() {
	"use strict";

	var Formatter = {

		siteState :  function (fValue) {
			try {
				if (fValue === "STARTED") {
					return "Success";
				} else {
					return "Error";
				}
			} catch (err) {
				return "None";
			}
		}
	};

	return Formatter;

}, /* bExport= */ true);
