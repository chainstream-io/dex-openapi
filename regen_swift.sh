#!/bin/sh

set -ex

yarn openapi-generator-cli generate \
  -i openapi.json \
  -g swift5 \
  -o swift \
  -c swift/swift-generator-config.json \
  --enable-post-process-file \
  --global-property apis,models,supportingFiles,apiTests=false,apiDocs=false,modelTests=false,modelDocs=false 