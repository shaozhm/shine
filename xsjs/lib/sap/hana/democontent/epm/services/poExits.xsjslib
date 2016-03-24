function poi_create_before_exit(param) {
    $.trace.error("Start of Exit");
    var after = param.afterTableName;
    var pStmt = null;
    var poid = '';
    var prodid;
    var quant;
    var price;
    var netAmount;
    var grossAmount;
    var taxAmount;
    var cur;
    //Get Input New Record Values

    try {
        
        pStmt = param.connection
            .prepareStatement('select PURCHASEORDERID,"PRODUCT.PRODUCTID",QUANTITY from "' + after + '"');
        var rs = pStmt.executeQuery();
        while (rs.next()) {
            poid = rs.getString(1);
            prodid= rs.getString(2);
            quant= rs.getInteger(3);
        }
        $.trace.error(poid);
         $.trace.error( prodid);
        pStmt.close();
        pStmt = param.connection
            .prepareStatement('select CURRENCY,PRICE from "sap.hana.democontent.epm.data::MD.Products" WHERE PRODUCTID = ?');
        pStmt.setString(1, prodid.toString());
        rs = pStmt.executeQuery();
        while (rs.next()) {
        	cur = rs.getString(1);
            price = rs.getDecimal(2);
        }
        $.trace.error( price);
        pStmt.close();
        if (poid==="300000000"){
        	pStmt = param.connection
        			 .prepareStatement('select "sap.hana.democontent.epm.data::purchaseOrderSeqId".NEXTVAL from "sap.hana.democontent.epm.data::DUMMY"');
        	rs = pStmt.executeQuery();
        
        	while (rs.next()) {
            	poid = rs.getString(1);
        	}
        	$.trace.error(poid);
        	pStmt.close();
        }
        netAmount = price*quant;
        taxAmount =netAmount * 0.19;
        grossAmount = netAmount + taxAmount;
        pStmt = param.connection.prepareStatement("update\"" + after + "\"set PURCHASEORDERID = ?,CURRENCY = ?, GROSSAMOUNT = ?,NETAMOUNT = ?, TAXAMOUNT = ?");
        pStmt.setString(1, poid.toString());
         pStmt.setString(2, cur.toString());
        pStmt.setDecimal(3,parseFloat(grossAmount)); 
        pStmt.setDecimal(4,parseFloat(netAmount));
        pStmt.setDecimal(5,parseFloat(taxAmount));
        pStmt.execute();
        pStmt.close();
    } catch (e) {
    	$.trace.error(e.message);
        pStmt.close();
    }

}
function po_create_before_exit(param) {
    $.trace.error("Start of Exit");
    var after = param.afterTableName;
    var pStmt = null;
    var poid = '';
   
    try {
        pStmt = param.connection
        		 //.prepareStatement('select "sap.hana.democontent.epm.data::purchaseOrderSeqId".NEXTVAL from "sap.hana.democontent.epm.data::DUMMY"');
                   .prepareStatement('SELECT max(PURCHASEORDERID + 1) from "sap.hana.democontent.epm.data::PO.Header"');
        var rs = pStmt.executeQuery();
        while (rs.next()) {
           	poid = rs.getString(1);
        }
        $.trace.error(poid);
        pStmt.close();

        pStmt = param.connection.prepareStatement("update\"" + after + "\"set PURCHASEORDERID = ?");
        pStmt.setString(1, poid.toString());
        pStmt.execute();
        pStmt.close();
    } catch (e) {
    	$.trace.error(e.message);
        pStmt.close();
    }

}
