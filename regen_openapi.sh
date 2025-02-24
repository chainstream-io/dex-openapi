#!/bin/sh

set -ex

yarn openapi-generator-cli generate -i openapi.json -g typescript -o javascript/src/openapi -c javascript/openapi-generator-config.json -t javascript/templates --type-mappings=set=Array --global-property apis,models,supportingFiles,apiTests=false,apiDocs=false,modelTests=false,modelDocs=false

