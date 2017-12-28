#Simple Python service to generate Excel for PO List from Hana DB
from cfenv import AppEnv
from cf_logging import flask_logging
from flask import abort,Flask,send_file,request
from hdbcli import dbapi
import logging
from openpyxl import Workbook
import os
import StringIO
import xssec

app = Flask(__name__)
env = AppEnv()

env_port = os.getenv("PORT")
port = int(os.environ.get('PORT', 3000))

hana = env.get_service(label='hana')
uaa_service = env.get_service(name='shine-uaa').credentials

flask_logging.init(app, logging.INFO)


def getPOWorklistData():
    conn = dbapi.connect(address=hana.credentials['host'], port=int(hana.credentials['port']),
                         user=hana.credentials['user'], password=hana.credentials['password'],
                         CURRENTSCHEMA=hana.credentials['schema'])
    cursor = conn.cursor()
    query = "SELECT FROM PO.Item { PURCHASEORDERID , PURCHASEORDERITEM , PRODUCT.PRODUCTID , GROSSAMOUNT}"
    cursor.execute(query, {})
    workbook = Workbook()
    worksheet=workbook.active
    worksheet.append(('PurchaseOrderItemId', 'ItemPos', 'ProductID', 'Amount'))
    for row in cursor.fetchall():
        po = (
            row['PURCHASEORDERID'],
            row['PURCHASEORDERITEM'],
            row['PRODUCTID'],
            str(row['GROSSAMOUNT'])  # decimal doesn't get serialised
        )
        worksheet.append(po)
    cursor.close()
    conn.close()
    out = StringIO.StringIO()
    workbook.save(out)
    out.seek(0)
    return out


@app.route('/')
def home():
    return 'Root Service'


@app.route('/excel')
def downloadPurchaseOrderExcel():
    logger = logging.getLogger('cli.logger')
    if 'authorization' not in request.headers:
        abort(403)
    access_token = request.headers.get('authorization')[7:]
    security_context = xssec.create_security_context(access_token, uaa_service)
    isAuthorized = security_context.check_scope('openid')
    if not isAuthorized:
        logger.error('Unauthorised')
        abort(403)
    logger.info('Generating WorkBook')
    return send_file(getPOWorklistData(), mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                     attachment_filename='PurchaseOrder.xlsx', as_attachment=True)


if __name__ == '__main__':
    app.run(port=port)
