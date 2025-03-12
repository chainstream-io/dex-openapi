#!/bin/sh

set -ex

# 进入 Swift 目录
cd swift

# 如果不存在 .git 目录，初始化 git 仓库
if [ ! -d ".git" ]; then
  git init
  git remote add origin git@github.com:chainstream-io/chainstream-dex-ios.git
fi

# 创建或更新 .gitignore 文件
cat > .gitignore << EOL
# Created by https://www.toptal.com/developers/gitignore/api/xcode,swift

### Swift ###
# Xcode
#
# gitignore contributors: remember to update Global/Xcode.gitignore, Objective-C.gitignore & Swift.gitignore

## User settings
xcuserdata/

## Obj-C/Swift specific
*.hmap

## App packaging
*.ipa
*.dSYM.zip
*.dSYM

## Playgrounds
timeline.xctimeline
playground.xcworkspace

# Swift Package Manager
.build/

# CocoaPods
Pods/

# Carthage
Carthage/Build/

# OpenAPI Generator files
.openapi-generator/
.openapi-generator-ignore
git_push.sh
EOL

# 保存需要保留的文件
if [ -f "swift-generator-config.json" ]; then
  cp swift-generator-config.json /tmp/swift-generator-config.json
fi

# 保存 .gitignore 文件
cp .gitignore /tmp/swift-gitignore

# 恢复保留的文件
if [ -f "/tmp/swift-generator-config.json" ]; then
  cp /tmp/swift-generator-config.json swift-generator-config.json
fi

# 重新生成 SDK
yarn generate:swift

# 恢复 .gitignore 文件
cp /tmp/swift-gitignore .gitignore

# 添加所有需要的文件和目录
git add ChainStreamSDK/
git add Package.swift
git add ChainStreamSDK.podspec
git add README.md
git add .swiftformat
git add project.yml
git add Cartfile
git add .gitignore

# 获取当前版本号
VERSION=$(cat swift-generator-config.json | grep '"podVersion"' | cut -d'"' -f4)

# 提交更改
git commit -m "chore: update sdk to version ${VERSION}"

# 删除本地标签（如果存在）
git tag -d "v${VERSION}" 2>/dev/null || true

# 删除远程标签（如果存在）
git push origin ":refs/tags/v${VERSION}" 2>/dev/null || true

# 创建新标签
git tag "v${VERSION}"

# 推送到远程仓库
git push origin main --tags 