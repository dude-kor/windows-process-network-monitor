pipeline {
    agent any

    environment {
        PROJECT_NAME = 'windows-process-network-monitor'
        ARTIFACT_DIR = 'build_output'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        // -----------------------------
        // 1. 개발 환경 (develop 브랜치)
        // -----------------------------
        stage('Dev: Build & Unit Test') {
            when {
                branch 'develop'
            }
            steps {
                echo "=== [DEV] 개발 빌드 및 단위 테스트 수행 ==="
                // PowerShell 스크립트 기반 프로젝트 테스트 예시
                bat '''
                    powershell -Command "Invoke-Pester -Path ./tests/unit -Output Detailed"
                '''
            }
        }

        // -----------------------------
        // 2. 품질 검증 환경 (PR 또는 release 브랜치)
        // -----------------------------
        stage('QA: Static Analysis & Security Check') {
            when {
                anyOf {
                    branch 'release/*'
                    changeRequest() // Pull Request
                }
            }
            steps {
                echo "=== [QA] 코드 정적 분석 및 보안 취약점 점검 ==="
                bat '''
                    powershell -Command "Invoke-ScriptAnalyzer -Path ./ -Recurse -Severity Error,Warning"
                '''
            }
        }

        // -----------------------------
        // 3. 운영 배포 환경 (main 브랜치)
        // -----------------------------
        stage('Prod: Release Packaging') {
            when {
                branch 'main'
            }
            steps {
                echo "=== [PROD] 배포 패키지 생성 및 서명 ==="
                bat '''
                    powershell -Command "Compress-Archive -Path ./src/* -DestinationPath ./build_output/windows-process-network-monitor-prod.zip -Force"
                '''
                // 산출물 보관
                archiveArtifacts artifacts: 'build_output/*.zip', fingerprint: true
            }
        }
    }

    post {
        success {
            echo "파이프라인 실행 성공: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
        }
        failure {
            echo "파이프라인 실패. 로그를 확인하세요."
        }
    }
}
