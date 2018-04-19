#!groovy


 environment {
        SHINE_URL = ''
    }


stage('GitClone'){
println("install node")
node('XSASystem'){
    sh "curl https://mo-7a5424181.mo.sap.corp:51197/integrationTestResult -P /tmp/ --insecure > integrationTestResult "
   sh (script: 'rm -rf /tmp/node-v6.1.0-linux-x64',returnStdout: false,returnStatus: false)
   sh (script: 'rm -f /tmp/node-v6.1.0-linux-x64.tar.gz',returnStdout: false,returnStatus: false)
  sh (script: 'rm -rf /tmp/tests',returnStdout: false,returnStatus: false)

   sh "git clone https://github.wdf.sap.corp/refapps/shine.git -b shine-test --single-branch /tmp/tests"
   sh "xs t -s PROD"
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
          
          sh "npm --prefix /tmp/tests install /tmp/tests"
          sh "xs t -s PROD"
          sh "xs push -f /tmp/tests/manifest.yml -p /tmp/tests/"
          def TEST_URL = sh (script: 'xs app shine-test --urls',returnStdout: true,returnStatus: false).trim()
          
          sh "curl $TEST_URL/integrationTestResult -P /tmp/ --insecure > integrationTestResult "
          def total_failed = sh (script: 'jq ".stats.failures" /tmp/integrationTestResult',returnStdout: true,returnStatus: false).trim()
          
          if($total_failed > 0 )
   {
     println ("Integration tests failed")
     currentBuild.result = 'FAILURE'
   }
   else
   {
     println ("Integration tests passed")
   }
          

  }
  }
}


