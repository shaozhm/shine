#!groovy

try
{
 environment {
        SHINE_URL = ''
    }





stage('InstallShine'){
println("Start Installation of SHINE")
node('XSASystem'){
  sh "xs login -u $XSAUSER -p $XSAPASSWORD -a https://localhost:30030 -o myorg -s PROD --skip-ssl-validation"

   sh 'sudo /usr/sap/XSA/HDB00/exe/hdbsql -i 00 -n localhost:30013 -u $XSAUSER -p $XSAPASSWORD "ALTER USER XSA_ADMIN SET PARAMETER XS_RC_SHINE_ADMIN = \'SHINE_ADMIN\'"'
}

}









}

catch(Exception ex)
{
  println(ex)
}

finally

{

}
