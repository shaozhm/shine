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
