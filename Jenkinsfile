#!groovy

try
{






stage('VyperGitClone'){
println("Cloning from GitHub repository https://github.wdf.sap.corp/refapps/shine-test.git -b NewSHINE --single-branch")
node('kirushinexsa'){
  sh "rm -rf /tmp/Vyper"
  sh "pwd"
  sh "mkdir /tmp/Vyper" 
  sh "git clone https://github.wdf.sap.corp/refapps/shine-test.git -b NewSHINE --single-branch /tmp/Vyper"
  
  
  
  }
}


stage('UpdateConf'){
println("Update conf.js")
node('kirushinexsa'){
  def SHINEURL = sh (script: 'xs app shine-web --urls',returnStdout: true,returnStatus: false).trim()
  sh "sed -i 's/<USER_NAME>/$XSAUSER/' /tmp/Vyper/conf.js"
  sh "sed -i 's/<PASSWORD>/$XSAPASSWORD/' /tmp/Vyper/conf.js"

  sh "sed -i 's,<SHINEURL>,$SHINEURL,' /tmp/Vyper/conf.js"
  withEnv(['PATH+NODEHOME=/tmp/node-v8.11.1-linux-x64/bin']) {
          echo "PATH is: $PATH"
          sh "set HTTP_PROXY=http://proxy.wdf.sap.corp:8080"
          sh "set HTTPS_PROXY=http://proxy.wdf.sap.corp:8080"
          sh "node %Vyper% > log.log"

      

  }
  
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
      sh "xs uninstall  XSAC_SHINE -f  --delete-services "
    }
  }
}

finally

{
  stage('CleanUp'){
  println("Cleaning up the installation")
  node('kirushinexsa'){
      SHINEStillInstalled = sh (script: 'xs a | grep -q shine',returnStdout: true,returnStatus: true)
      if(SHINEStillInstalled==0)
    {
      
      sh "xs t -s PROD"
      sh "xs uninstall  XSAC_SHINE -f  --delete-services " 
      sh "rm -rf /tmp/Shine"
    }
    }
  }
}
