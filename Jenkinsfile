#!groovy


stage('GitClone'){
println("Cloning from GitHub repository https://github.wdf.sap.corp/refapps/shine.git")
node('kirushinexsa'){

  sh "rm -rf /tmp/Shine"
  sh "pwd"
  sh "mkdir /tmp/Shine" 

  sh "git clone https://github.wdf.sap.corp/refapps/shine.git /tmp/Shine"
  sh "ls"

}

}

stage('MavenBuild'){
println("Performing the maven build")
node('kirushinexsa'){
  
  sh "chmod 777 -R /tmp/Shine"
  dir('/tmp/Shine') {
  sh "mvn -f  /tmp/Shine/pom.xml clean install -s /tmp/Shine/cfg/settings.xml"
  }

}

}

stage('InstallShine'){
println("Start Installation of SHINE")
node('kirushinexsa'){
  sh "xs login -u $XSAUSER -p $XSAPASSWORD -a https://localhost:30030 -o myorg -s PROD --skip-ssl-validation"
  sh "find /tmp/Shine/assembly/target -name XSACSHINE* > Zipfile"
  def SHINESCA=readFile('Zipfile').trim() 
  sh "mv /tmp/Shine/assembly/target/shine.mtaext.template /tmp/Shine/assembly/target/shine.mtaext"
  sh "sed 's/<SCHEMA_NAME1>/SHINE_CORE/' shine.mtaext"
  sh "sed 's/<SCHEMA_NAME2>/SHINE_USER/' shine.mtaext"
  sh "xs install $output -e shine.mtaext -o ALLOW_SC_SAME_VERSION --ignore-lock"


}

}

