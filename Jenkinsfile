#!groovy


 environment {
        SHINE_URL = ''
    }


stage('GitClone'){
println("install node")
node('XSASystem'){
   sh (script: 'rm -rf /tmp/node-v8.11.1-linux-x64',returnStdout: false,returnStatus: false)
   sh (script: 'rm -rf /tmp/node-v8.11.1-linux-x64.tar.xz',returnStdout: false,returnStatus: false)
  sh (script: 'rm -rf /tmp/tests',returnStdout: false,returnStatus: false)

   sh "git clone https://github.wdf.sap.corp/I302582/test.git /tmp/tests"
   sh "wget https://nodejs.org/dist/v8.11.1/node-v8.11.1-linux-x64.tar.xz -P /tmp/"
  sh "tar -xf /tmp/node-v8.11.1-linux-x64.tar.xz -C /tmp/"
  sh "pwd"
  sh "ls"

  withEnv(['PATH+NODEHOME=/tmp/node-v8.11.1-linux-x64/bin']) {
          echo "PATH is: $PATH"
          sh "node -v"
          sh "npm --prefix /tmp/tests/test/ install /tmp/tests/test"
   
          sh "xs push -f /tmp/tests/test/manifest.yml -p /tmp/tests/test"
          

  }
  }
}


