#!groovy

try
{
 environment {
        SHINE_URL = ''
    }


stage('GitClone'){
println("Cloning from GitHub repository https://github.wdf.sap.corp/refapps/shine.git")
node('XSASystem'){
  sh (script: 'rm -rf /tmp/Shine',returnStdout: false,returnStatus: false)
  sh "pwd"
  sh "mkdir /tmp/Shine" 
  sh "git clone https://github.wdf.sap.corp/refapps/shine.git /tmp/Shine"
  sh "ls"
  }
}

stage('MavenBuild'){
println("Performing the maven build")
node('XSASystem'){
  sh "chmod 777 -R /tmp/Shine"
  dir('/tmp/Shine') {
    sh "mvn -f  /tmp/Shine/pom.xml clean install -s /tmp/Shine/cfg/settings.xml"
    }
  }
}


stage('UI5BrokerInstall'){

println("Check for UI5 service broker dependency")
node('XSASystem'){
    
    Installed = sh (script: 'xs m | grep -q sapui5_sb',returnStdout: true,returnStatus: true)
    echo "Installed: $Installed"
 
    echo "Installed: $Installed"
    if(Installed!=0)
  {
    sh "wget https://nexus.wdf.sap.corp:8443/nexus/content/repositories/deploy.releases/com/sap/ui5/dist/sapui5-sb-xsa/1.0.1/sapui5-sb-xsa-1.0.1.zip -P /tmp/"
    sh "xs t -s SAP"
    sh "xs install sapui5-sb-xsa-1.0.1.zip -o ALLOW_SC_SAME_VERSION" 
  }
  
  }

}


stage('InstallShine'){
println("Start Installation of SHINE")
node('XSASystem'){
  sh "xs login -u $XSAUSER -p $XSAPASSWORD -a https://localhost:30030 -o myorg -s PROD --skip-ssl-validation"
  sh "find /tmp/Shine/assembly/target -name XSACSHINE* > Zipfile"
  def SHINESCA=readFile('Zipfile').trim() 
  sh "mv /tmp/Shine/assembly/target/shine.mtaext.template /tmp/Shine/assembly/target/shine.mtaext"
  sh "sed -i 's/<SCHEMA_NAME_1>/SHINE_CORE/' /tmp/Shine/assembly/target/shine.mtaext"
  sh "sed -i 's/<SCHEMA_NAME_2>/SHINE_USER/' /tmp/Shine/assembly/target/shine.mtaext"
  sh "xs install $SHINESCA -e /tmp/Shine/assembly/target/shine.mtaext -o ALLOW_SC_SAME_VERSION --ignore-lock"
  def SHINEURL = sh (script: 'xs app shine-web --urls',returnStdout: true,returnStatus: false).trim()
  env.SHINE_URL = SHINEURL
  println("SHINE URL =  ${env.SHINE_URL}") 
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
