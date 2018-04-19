#!groovy


 environment {
        SHINE_URL = ''
    }


stage('GitClone'){
println("install node")
node('XSASystem'){
   sh "git clone https://github.wdf.sap.corp/I302582/test.git /tmp/tests/"
   sh "wget https://nodejs.org/dist/v8.11.1/node-v8.11.1-linux-x64.tar.xz -P /tmp/"
  sh "tar -xf /tmp/node-v8.11.1-linux-x64.tar.xz -C /tmp/"
  sh "pwd"
  sh "ls"

  withEnv(['PATH+NODEHOME=/tmp/node-v8.11.1-linux-x64/bin']) {
          echo "PATH is: $PATH"
          sh "node -v"
          sh "java -jar /tmp/tests/mta.jar --build-target=XSA --mtar=/tmp/tests/shine-test.mtar build"
          

  }
  }
}


