#!groovy

try
{


stage('InstallVyper'){
println("Install Nodejs and Vyperfor Vyper")
node('kirushinexsa'){
  sh "rm /tmp/node-v8.11.1-linux-x64.tar.xz"
  sh "rm -rf /tmp/node-v8.11.1-linux-x64"
  sh "rm -rf /tmp/VyperSrc"
  sh "wget https://nodejs.org/dist/v8.11.1/node-v8.11.1-linux-x64.tar.xz -P /tmp/"
  sh "tar -xf /tmp/node-v8.11.1-linux-x64.tar.xz"
  sh "pwd"
  sh "ls"
  sh "mkdir /tmp/VyperSrc"
  sh "git clone https://github.wdf.sap.corp/TechnologyTestCenter-Framework-Tools/Vyper4All-Internal.git /tmp/VyperSrc"
  withEnv(['PATH+NODEHOME=/tmp/node-v8.11.1-linux-x64/bin']) {
          echo "PATH is: $PATH"
          sh "chmod -R 777 /tmp/VyperSrc/"
          sh "node -v"
          sh "sudo -i"
          sh "/tmp/VyperSrc/SetUp.sh "
  }

  }
}



stage('VyperGitClone'){
println("Cloning from GitHub repository https://github.wdf.sap.corp/refapps/shine-test.git -b NewSHINE --single-branch")
node('kirushinexsa'){
  sh "rm -rf /tmp/Vyper"
  sh "pwd"
  sh "mkdir /tmp/Vyper" 
  sh "git clone https://github.wdf.sap.corp/refapps/shine-test.git -b NewSHINE --single-branch /tmp/Vyper"
  sh "sed -i 's/<USER_NAME>/$XSAUSER/' /tmp/Vyper/conf.js"
  
  }
}


stage('UpdateConf'){
println("Update conf.js")
node('kirushinexsa'){
  def SHINEURL = sh (script: 'xs app shine-web --urls',returnStdout: true,returnStatus: false).trim()
  sh "sed -i 's/<USER_NAME>/$XSAUSER/' /tmp/Vyper/conf.js"
  sh "sed -i 's/<PASSWORD>/$XSAPASSWORD/' /tmp/Vyper/conf.js"

  sh "sed -i 's,<SHINEURL>,$SHINEURL,' /tmp/Vyper/conf.js"
  
  }
}
}

catch(Exception ex)
{
  stage('CleanUp'){
  println("Cleaning up the installation")
  node('kirushinexsa'){
      sh "rm -rf /tmp/Shine"
      sh "xs t -s PROD"
      sh "xs uninstall  XSAC_SHINE -f  --delete-services "
    }
  }
}

finally

{
  stage('CleanUp'){
  println("Cleaning up the installation")
  node('kirushinexsa'){
      SHINEStillInstalled = sh (script: 'xs a | grep -q shine',returnStdout: true,returnStatus: true)
      if(SHINEStillInstalled==0)
    {
      
      sh "xs t -s PROD"
      sh "xs uninstall  XSAC_SHINE -f  --delete-services " 
      sh "rm -rf /tmp/Shine"
    }
    }
  }
}
