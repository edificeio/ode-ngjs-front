#!/usr/bin/env groovy

pipeline {
  agent any

  environment {
    NEXUS_SONATYPE_PASSWORD = credentials('nexus-sonatype-password')
    NEXUS_ODE_PASSWORD = credentials('nexus-ode-password')
  }
  
  stages {
    stage('Init') {
      steps {
        checkout scm
        sh './build.sh clean init'
      }
    }
    stage('Build') {
      steps {
        sh "./build.sh build"
      }
    }
    stage('Publish NPM') {
      steps {
        configFileProvider([configFile(fileId: '.npmrc-infra-front', variable: 'NPMRC')]) {
          sh "cp $NPMRC .npmrc"
          sh "./build.sh publishNPM"
        }
      }
    }
  }
}

