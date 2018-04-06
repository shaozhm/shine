stage('InstallVyper'){
println("Install Nodejs and Vyperfor Vyper")
node('kirushinexsa'){
  
  sh "wget https://nodejs.org/dist/v8.11.1/node-v8.11.1-linux-x64.tar.xz -P /tmp/"
  sh "tar -xf /tmp/node-v8.11.1-linux-x64.tar.xz"
  sh "mkdir /tmp/VyperSrc"
  sh "git clone https://github.wdf.sap.corp/TechnologyTestCenter-Framework-Tools/Vyper4All-Internal.git /tmp/VyperSrc"
  withEnv(['PATH+NODEHOME=tmp/node-v8.11.1-linux-x64/bin']) {
          echo "PATH is: $PATH"
          sh "sudo -i"
          sh "/tmp/VyperSrc/SetUp.sh "
  }

  }
}
