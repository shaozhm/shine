#!groovy

stage('GitClone'){
println("Cloning from GitHub repository https://github.wdf.sap.corp/refapps/shine.git")
node('kirushinexsa'){
  sh "cd /home/i302582/"
  sh "rm -rf Shine"
  sh "pwd"
  sh "mkdir Shine" 
  sh "cd Shine"
  sh "git clone https://github.wdf.sap.corp/refapps/shine.git"
  sh "ls"

}

}
