#!groovy

def isUI5BrokerInstalled() {
    Installed = sh (script: 'xs m | grep sapui5_sb',returnStdout: true).trim()
    echo "Installed: $Installed"
  
}



stage('UI5BrokerInstall'){

println("Check for UI5 service broker dependency")
node('kirushinexsa'){
  isUI5BrokerInstalled()
  sh "wget https://nexus.wdf.sap.corp:8443/nexus/content/repositories/deploy.releases/com/sap/ui5/dist/sapui5-sb-xsa/1.0.1/sapui5-sb-xsa-1.0.1.zip -P /tmp/"
  sh "xs t -s SAP"
  sh "xs install sapui5-sb-xsa-1.0.1.zip -o ALLOW_SC_SAME_VERSION" 
  
  }

}




stage('InstallShine'){
println("Start Installation of SHINE")
node('kirushinexsa'){
  sh "xs login -u $XSAUSER -p $XSAPASSWORD -a https://localhost:30030 -o myorg -s PROD --skip-ssl-validation"
  sh "find /tmp/Shine/assembly/target -name XSACSHINE* > Zipfile"
  def SHINESCA=readFile('Zipfile').trim() 
  sh "mv /tmp/Shine/assembly/target/shine.mtaext.template /tmp/Shine/assembly/target/shine.mtaext"
  sh "sed -i 's/<SCHEMA_NAME_1>/SHINE_CORE/' /tmp/Shine/assembly/target/shine.mtaext"
  sh "sed -i 's/<SCHEMA_NAME_2>/SHINE_USER/' /tmp/Shine/assembly/target/shine.mtaext"
  sh "xs install $SHINESCA -e /tmp/Shine/assembly/target/shine.mtaext -o ALLOW_SC_SAME_VERSION --ignore-lock"


}

}
