#!groovy


 environment {
        SHINE_URL = ''
    }


stage('GitClone'){
println("install node")
node('XSASystem'){
   

  withEnv(['PATH+NODEHOME=/tmp/node-v6.1.0-linux-x64/bin']) {
          
          def total_failed = sh (script: 'jq ".stats.failures" /tmp/integrationTestResult',returnStdout: true,returnStatus: false)
          println("$total_failed")
          if( total_failed > 0 )
   {
     println ("Integration tests failed")
     currentBuild.result = 'FAILURE'
   }
   else
   {
     println ("Integration tests passed")
   }
          

  }
  }
}


