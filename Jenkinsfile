#!groovy

try
{
 environment {
        SHINE_URL = ''
             }
stage('GitClone'){
println("Cloning from GitHub repository https://github.wdf.sap.corp/refapps/shine.git")
node('shinehxe'){
  sh (script: 'rm -rf /tmp/Shine/shine',returnStdout: false,returnStatus: false)
  sh '''
     mkdir /tmp/Shine
     cd /tmp/Shine
     git clone https://github.wdf.sap.corp/refapps/shine.git
     ls
     chmod 777 -R shine
      ''' 
  }
}

stage('MavenBuild'){
println("Performing the maven build")
node('shinehxe'){
sh '''
    cd /tmp/Shine
    wget -nc http://apache.mirror.digitalpacific.com.au/maven/maven-3/3.3.9/binaries/apache-maven-3.3.9-bin.tar.gz
    tar -zxvf apache-maven-3.3.9-bin.tar.gz
    rm apache-maven-3.3.9-bin.tar.gz
    cd /tmp/Shine/shine
    export PATH="$PATH::/tmp/Shine/apache-maven-3.3.9/bin"
    echo "PATH = ${PATH}"
    mvn -f pom.xml clean install -s cfg/settings.xml
     '''
  }
}


/*stage('UI5BrokerInstall'){

println("Check for UI5 service broker dependency")
node('shine'){
    
    Installed = sh (script: 'xs m | grep -q sapui5_sb',returnStdout: true,returnStatus: true)
    echo "Installed: $Installed"
 
    echo "Installed: $Installed"
    if(Installed!=0)
  {
    
    sh "curl -O https://nexus.wdf.sap.corp:8443/nexus/content/repositories/deploy.releases/com/sap/ui5/dist/sapui5-sb-xsa/1.0.1/sapui5-sb-xsa-1.0.1.zip -P /tmp/ --insecure"
    sh "xs t -s SAP"
    sh "xs install sapui5-sb-xsa-1.0.1.zip -o ALLOW_SC_SAME_VERSION" 
  }
  
  }

} */


stage('InstallShine'){
println("Start Installation of SHINE")
node('shinehxe'){
 sh '''
 xs login -u $XSAUSER -p $XSAPASSWORD -a https://localhost:39030 -o $XSAORG -s SAP --skip-ssl-validation
 xs delete-space -f shine-test --quiet
 xs create-space shine-test
 xs t -s shine-test
 find /tmp/Shine/shine/assembly/target -name XSACSHINE* > Zipfile 
 mv /tmp/Shine/shine/assembly/target/shine.mtaext.template /tmp/Shine/shine/assembly/target/shine.mtaext
 sed -i 's/<SCHEMA_NAME_2>/SHINE_COREJAAS/g' /tmp/Shine/shine/assembly/target/shine.mtaext
 sed -i 's/<SCHEMA_NAME_1>/SHINE_USERJAAS/g' /tmp/Shine/shine/assembly/target/shine.mtaext
 sed -i 's/XSAC_SHINE-CONFIG1/XSAC_SHINE-JAAS/g' /tmp/Shine/shine/assembly/target/shine.mtaext
 xs install /tmp/Shine/shine/assembly/target/XSACSHINE* -e /tmp/Shine/shine/assembly/target/shine.mtaext -o ALLOW_SC_SAME_VERSION --ignore-lock
  '''
  sh "xs login -u $XSAUSER -p $XSAPASSWORD -a https://localhost:39030 -o $XSAORG -s shine-test --skip-ssl-validation"
  def SHINEURL = sh (script: 'xs app shine-web --urls',returnStdout: true,returnStatus: false).trim()
  env.SHINE_URL = SHINEURL
  println("SHINE URL =  ${env.SHINE_URL}") 
  sh "xs mtas"
  sh "xs lc"
  sh 'sudo /usr/sap/HXE/HDB90/exe/hdbsql -i 90 -n localhost:39013 -u $XSAUSER -p $XSAPASSWORD "ALTER USER XSA_ADMIN SET PARAMETER XS_RC_SHINE_ADMIN = \'SHINE_ADMIN\'"'
}
} 
 
stage('IntegrationTests'){
println("Run integration tests")
node('shinehxe'){
   sh (script: 'rm -rf /tmp/node-v6.1.0-linux-x64',returnStdout: false,returnStatus: false)
   sh (script: 'rm -f /tmp/node-v6.1.0-linux-x64.tar.gz',returnStdout: false,returnStatus: false)
   sh (script: 'rm -rf /tmp/tests',returnStdout: false,returnStatus: false)
   sh "git clone https://github.wdf.sap.corp/refapps/shine.git -b shine-test --single-branch /tmp/tests"
   sh "xs t -s shine-test"
   def COREXSJS_URL = sh (script: 'xs app shine-core-xsjs --urls',returnStdout: true,returnStatus: false).trim()
   def USERXSJS_URL = sh (script: 'xs app shine-user-xsjs --urls',returnStdout: true,returnStatus: false).trim()
   def CORENODE_URL = sh (script: 'xs app shine-core-node --urls',returnStdout: true,returnStatus: false).trim()
   sh "sed -i 's,<CORE_XSJS_URL>,$COREXSJS_URL,' /tmp/tests/shine.json"
   sh "sed -i 's,<USER_XSJS_URL>,$USERXSJS_URL,' /tmp/tests/shine.json"
   sh "sed -i 's,<CORE_NODE_URL>,$CORENODE_URL,' /tmp/tests/shine.json"
   sh "wget https://nodejs.org/download/release/v6.1.0/node-v6.1.0-linux-x64.tar.gz -P /tmp/"
   sh "tar -xf /tmp/node-v6.1.0-linux-x64.tar.gz -C /tmp/"
   sh "pwd"
   sh "ls"
   withEnv(['PATH+NODEHOME=/tmp/node-v6.1.0-linux-x64/bin']) {
          echo "PATH is: $PATH"
          sh "node -v"
          sh "npm config set @sap:registry http://nexus.wdf.sap.corp:8081/nexus/content/repositories/build.milestones.npm/"
          sh "npm config set registry http://registry.npmjs.org/"
          sh "npm config set strict-ssl false"
          sh "npm --prefix /tmp/tests install /tmp/tests"
          sh "xs t -s shine-test"
          sh "xs push -f /tmp/tests/manifest.yml -p /tmp/tests/"
          def TEST_URL = sh (script: 'xs app shine-test --urls',returnStdout: true,returnStatus: false).trim()
          
          sh "curl $TEST_URL/integrationTestResult -P /tmp/ --insecure -o /tmp/integrationTestResult.json "
          sleep 30
          sh "curl $TEST_URL/integrationTestResult -P /tmp/ --insecure -o /tmp/integrationTestResult.json "
          def total_failed = sh (script: 'jq ".stats.failures" /tmp/integrationTestResult.json',returnStdout: true,returnStatus: false).trim()
          
                 if( total_failed.matches("0") )
   {
     println ("Integration tests passed")
     println("Detailed report can be found at $TEST_URL/integrationTestResult or /tmp/integrationTestResult.json in the slave machine")
   
   }
   else
   {
     println ("Integration tests failed")
     println("Detailed report can be found at $TEST_URL/integrationTestResult or /tmp/integrationTestResult.json in the slave machine") 
     currentBuild.result = 'FAILURE'
     
   }
          

  }
  }
} 


 def shell = {
    bat(returnStdout: true, script: "sh -x -c \"${it}\"").trim()
}

/*stage('VyperTests'){
println("Trigger Vyper tests")
node('WinVyper'){
 shell ("rm -rf /c/Users/i302582/shine-test")
 shell( "git clone https://github.wdf.sap.corp/refapps/shine-test.git -b NewSHINE --single-branch /c/Users/i302582/shine-test")
 shell("sed -i 's/<USER_NAME>/$XSAUSER/' /c/Users/i302582/shine-test/conf.js")
 shell("sed -i 's/<PASSWORD>/$XSAPASSWORD/' /c/Users/i302582/shine-test/conf.js")   
 shell("sed -i 's,<SHINEURL>,${env.SHINE_URL},' /c/Users/i302582/shine-test/conf.js")    
 shell ("rm -rf /c/Users/i302582/VyperResults.log")
 def St = shell("node /c/Users/i302582/Vyper4All-Internal/protractor/bin/protractor /c/Users/i302582/shine-test/conf.js | grep '^Total'")
 println("$St")
 Status = St.split();
 println("Status $Status")
 def failed = Status[15]
 def total_failed = failed.toInteger()
 println("$total_failed")
 if( total_failed > 0)
 {
  currentBuild.result = 'FAILURE'
 }
 else
 {
  println ("Vyper tests passed")

 }


 
 
}
   
 }
*/


}

catch(Exception ex)
{
  println(ex)
}

finally

{

stage('CleanUp'){
  println("Cleaning up the installation")
  node('shinehxe'){
      SHINEStillInstalled = sh (script: 'xs a | grep -q shine',returnStdout: true,returnStatus: true)
      if(SHINEStillInstalled==0)
    {
      
      sh "xs t -s shine-test"
      sh "xs uninstall  XSAC_SHINE -f  --delete-services --ignore-lock" 
      sh "rm -rf /tmp/Shine"
      sh "rm -rf /tmp/tests"
      sh "xs delete -f shine-test" 
      sh "xs delete-space -f shine-test"
    }
    }
  }
  
}
