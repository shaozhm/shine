stage('InstallNodejs'){
println("Install Nodejs for Vyper")
node('kirushinexsa'){
  sh "rm /tmp/node-v8.11.1-linux-x64.tar.xz"
  sh "rm -rf /tmp/node-v8.11.1-linux-x64"
  sh "wget https://nodejs.org/dist/v8.11.1/node-v8.11.1-linux-x64.tar.xz -P /tmp/"
  sh "tar -xf /tmp/node-v8.11.1-linux-x64.tar.xz"
  withEnv(['PATH+NODEHOME=tmp/node-v8.11.1-linux-x64/bin']) {
          echo "PATH is: $PATH"
          sh "/tmp/Vyper/SetUp.sh "
  }

  }
}
