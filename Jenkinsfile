#!groovy

try
{

stage('InstallVyper'){
println("Install Nodejs and Vyperfor Vyper")
node('kirushinexsa'){
  sh "rm /tmp/node-v8.11.1-linux-x64.tar.xz"
  sh "rm -rf /tmp/node-v8.11.1-linux-x64"
  sh "rm -rf /tmp/VyperSrc"
  sh "git clone https://github.wdf.sap.corp/TechnologyTestCenter-Framework-Tools/Vyper4All-Internal.git /tmp/VyperSrc"
  sh "wget https://nodejs.org/dist/v8.11.1/node-v8.11.1-linux-x64.tar.xz -P /tmp/"
  sh "tar -xf /tmp/node-v8.11.1-linux-x64.tar.xz -C /tmp/"
  sh "pwd"
  sh "ls"
  mkdir ""
  withEnv(['PATH+NODEHOME=/tmp/node-v8.11.1-linux-x64/bin']) {
          echo "PATH is: $PATH"
          sh "chmod -R 777 /tmp/VyperSrc/"
          sh "npm install --save  https://github.com/SAP/ui5-automation-framework"
          sh "chmod -R 777 /tmp/VyperSrc/"
          sh "sudo -i"
          sh "/tmp/VyperSrc/SetUp.sh"
          

  }

  }
}
}

catch(Exception ex)
{
  println("Exception")
}
