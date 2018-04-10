#!groovy

try
{

 stage('WinVyp'){
println("Install Nodejs and Vyperfor Vyper")
node('WinVyper'){
def shell(command) {
    return bat(returnStdout: true, script: "sh -x -c \"$pwd\"").trim()
}
}
   
  
  
stage('InstallVyper'){
println("Install Nodejs and Vyperfor Vyper")
node('VyperLinux'){
  sh "ifconfig"
  sh "rm /tmp/node-v8.11.1-linux-x64.tar.xz"
  sh "rm -rf /tmp/node-v8.11.1-linux-x64"
  sh "rm -rf /tmp/VyperSrc"
  sh "git clone https://github.wdf.sap.corp/I302582/Vyper4All-Internal.git /tmp/VyperSrc"
  sh "wget https://nodejs.org/dist/v8.11.1/node-v8.11.1-linux-x64.tar.xz -P /tmp/"
  sh "tar -xf /tmp/node-v8.11.1-linux-x64.tar.xz -C /tmp/"
  sh "pwd"
  sh "ls"

  withEnv(['PATH+NODEHOME=/tmp/node-v8.11.1-linux-x64/bin']) {
          echo "PATH is: $PATH"
          sh "chmod -R 777 /tmp/VyperSrc/"
         
          sh "chmod -R 777 /tmp/VyperSrc/"
          sh "sudo -i"
          sh "/tmp/VyperSrc/SetUp.sh"
          

  }

  }
}
  
  
stage('VyperGitClone'){
println("Cloning from GitHub repository https://github.wdf.sap.corp/refapps/shine-test.git -b NewSHINE --single-branch")
node('VyperLinux'){
  sh "rm -rf /tmp/Vyper"
  sh "pwd"
  sh "mkdir /tmp/Vyper" 
  sh "git clone https://github.wdf.sap.corp/refapps/shine-test.git -b NewSHINE --single-branch /tmp/Vyper"

  
  }
}


stage('VyperLinux'){
println("Update conf.js")
node('kirushinexsa'){

  withEnv(['PATH+NODEHOME=/tmp/node-v8.11.1-linux-x64/bin']) {
          echo "PATH is: $PATH"
          sh "node /tmp/VyperSrc/protractor/bin/webdriver-manager update"
          sh  "node /tmp/VyperSrc/protractor/bin/protractor /tmp/Vyper/conf.js"
         
         
          

  }
  }
}

}

catch(Exception ex)
{
  println("Exception")
}
