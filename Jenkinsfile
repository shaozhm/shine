#!groovy


stage('GitClone'){
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
  def https = 'https:\/\/'
  def fullurl = $https$SHINEURL
  sh "sed -i 's/<SHINEURL>/$fullurl/' /tmp/Vyper/conf.js"
  
  }
}
