#!groovy

try
{

stage('InstallVyper'){
println("Install Nodejs and Vyperfor Vyper")
node('kirushinexsa'){
  sh "rm /tmp/node-v8.11.1-linux-x64.tar.xz"
  sh "rm -rf /tmp/node-v8.11.1-linux-x64"
  sh "wget https://nodejs.org/dist/v8.11.1/node-v8.11.1-linux-x64.tar.xz -P /tmp/"
  sh "tar -xf /tmp/node-v8.11.1-linux-x64.tar.xz -C /tmp/"
  sh "pwd"
  sh "ls"
  withEnv(['PATH+NODEHOME=/tmp/node-v8.11.1-linux-x64/bin']) {
          echo "PATH is: $PATH"
          sh "chmod -R 777 /tmp/VyperSrc/"
          sh "npm install --save  https://github.com/SAP/ui5-automation-framework"
          

  }

  }
}
}

catch(Exception ex)
{
  println("Exception")
}
