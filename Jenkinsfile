#!groovy


 environment {
        SHINE_URL = ''
    }


stage('GitClone'){
println("install node")
node('XSASystem'){
   sh (script: 'rm -rf /tmp/node-v6.1.0-linux-x64',returnStdout: false,returnStatus: false)
   sh (script: 'rm  /tmp/node-v6.1.0-linux-x64.tar.gz',returnStdout: false,returnStatus: false)
  sh (script: 'rm -rf /tmp/tests',returnStdout: false,returnStatus: false)

   sh "git clone https://github.wdf.sap.corp/refapps/shine.git -b shine-test --single-branch /tmp/tests"
   sh "wget https://nodejs.org/download/release/v6.1.0/node-v6.1.0-linux-x64.tar.gz -P /tmp/"
  sh "tar -xf /tmp/node-v6.1.0-linux-x64.tar.xz -C /tmp/"
  sh "pwd"
  sh "ls"

  withEnv(['PATH+NODEHOME=/tmp/node-v6.1.0-linux-x64/bin']) {
          echo "PATH is: $PATH"
          sh "node -v"
          sh "chmod 777 /tmp/tests/test/"
          sh "npm --prefix /tmp/tests install /tmp/tests"
   
          sh "xs push -f /tmp/tests/manifest.yml -p /tmp/tests/"
          

  }
  }
}


