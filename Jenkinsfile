#!groovy

stage('GitClone'){
println("Cloning from GitHub repository https://github.wdf.sap.corp/refapps/shine.git")
node('kirushinexsa'){

  sh "rm -rf /home/i302582/Shine"
  sh "pwd"
  sh "mkdir /home/i302582/Shine" 

  sh "git clone https://github.wdf.sap.corp/refapps/shine.git /home/i302582/Shine"
  sh "ls"

}

}

stage('MavenBuild'){
println("Performing the maven build")
node('kirushinexsa'){
  
  sh "chmod 777 -R /home/i302582/Shine"
  dir('/home/i302582/Shine') {
  sh "mvn -f  /home/i302582/Shine/pom.xml clean install -s /home/i302582/Shine/cfg/settings.xml"
  }

}

}
