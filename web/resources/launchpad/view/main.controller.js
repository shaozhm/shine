sap.ui.controller("shine.democontent.epm.launchpad.view.main", {

	onInit: function() {
	
	},

	
	onAfterRendering: function() {

		var value = sap.app.localStorage.getPreference(sap.app.localStorage.PREF_SHOW_WELCOME);
		if (value !== 'false') {
			var welcomeDialog = new sap.account.WelcomeDialog(this);
			welcomeDialog.open();
		}
	},
	handlePress: function(oEvent) {
			var tileID;
		    var tileId = oEvent.getSource().getId();
		    if(tileId==="__xmlview0--dg"){
		    	tileID=1;
		    }
		     if(tileId==="__xmlview0--po"){
		    	tileID=2;
		    }
		     if(tileId==="__xmlview0--jobscheduling"){
		    	tileID=3;
		    }
		     if(tileId==="__xmlview0--so"){
		    	tileID=4;
		    }
		     if(tileId==="__xmlview0--uc"){
		    	tileID=5;
		    }
		     if(tileId==="__xmlview0--spatial"){
		    	tileID=8;
		    }
		    if(tileId==="__xmlview0--fulltextsearch"){
		    	tileID=1;
		    }
		    
		var value = sap.app.localStorage.getPreference(sap.app.localStorage.PREF_TILE_HELP_SHOW_PREFIX + tileID);
        if (value !== 'false') {
            var tileDialog = new sap.account.TileDialog(this);
            tileDialog.open(tileID);
        } else {
            var tileDialog = new sap.account.TileDialog(this);
            window.location = tileDialog.getHrefLocation(tileID);
        }
		},


sourceCodeDownload: function(){
	 sap.m.URLHelper.redirect("../source/sap-xsac-shine-src-code.zip", true);
}
	

});
