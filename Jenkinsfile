#!groovy

try
{




stage('UI5BrokerInstall'){

println("Check for UI5 service broker dependency")
node('kirushinexsa'){
 
    Installed = sh (script: 'xs m | grep -q sapui5_sb',returnStdout: true,returnStatus: true)
    echo "Installed: $Installed"
    (Installed == 0) ? true : false
  
    if(!Installed)
  {
    sh "wget https://nexus.wdf.sap.corp:8443/nexus/content/repositories/deploy.releases/com/sap/ui5/dist/sapui5-sb-xsa/1.0.1/sapui5-sb-xsa-1.0.1.zip -P /tmp/"
    sh "xs t -s SAP"
    sh "xs install sapui5-sb-xsa-1.0.1.zip -o ALLOW_SC_SAME_VERSION" 
  }
  
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
  



stage('VyperGitClone'){
println("Cloning from GitHub repository https://github.wdf.sap.corp/refapps/shine-test.git -b NewSHINE --single-branch")
node('kirushinexsa'){
  sh "rm -rf /tmp/Vyper"
  sh "pwd"
  sh "mkdir /tmp/Vyper" 
  sh "git clone https://github.wdf.sap.corp/refapps/shine-test.git -b NewSHINE --single-branch /tmp/Vyper"
  sh "sed -i 's/<USER_NAME>/$XSAUSER/' /tmp/Vyper/conf.js"
  
  }
}


stage('UpdateConf'){
println("Update conf.js")
node('kirushinexsa'){
  def SHINEURL = sh (script: 'xs app shine-web --urls',returnStdout: true,returnStatus: false).trim()
  sh "sed -i 's/<USER_NAME>/$XSAUSER/' /tmp/Vyper/conf.js"
  sh "sed -i 's/<PASSWORD>/$XSAPASSWORD/' /tmp/Vyper/conf.js"

  sh "sed -i 's,<SHINEURL>,$SHINEURL,' /tmp/Vyper/conf.js"
  
  }
}
}

catch(Exception ex)
{
  stage('CleanUp'){
  println("Cleaning up the installation")
  node('kirushinexsa'){
      sh "rm -rf /tmp/Shine"
      sh "xs t -s PROD"
      sh "xs uninstall -f XSAC_SHINE --delete-services"
    }
  }
}

finally

{
  stage('CleanUp'){
  println("Cleaning up the installation")
  node('kirushinexsa'){
      sh "rm -rf /tmp/Shine"
      sh "xs t -s PROD"
      sh "xs uninstall -f XSAC_SHINE --delete-services"
    }
  }
}
