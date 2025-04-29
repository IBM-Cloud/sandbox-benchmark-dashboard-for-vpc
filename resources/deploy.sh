#!/bin/bash

set -o errexit
set -o pipefail
set -x

SRC_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd .. && pwd)"

if [ $# -lt 3 ]; then
  echo "Usage: ./deploy.sh IAM_TRUSTED_PROFILEID UI_PASSWORD IBM_SSHKEY_ID"
  echo "Please provide the IAM Trusted ProfileID."
  echo "Please provide the UI password."
  echo "Please provide the IBM Cloud SSH Key id."
  exit 1
fi

## Generate random string for DB password
DB_PASSWORD=`tr -dc A-Za-z0-9 </dev/urandom | head -c 13; echo`

IAM_TRUSTED_PROFILEID=$1
UI_PASSWORD=$2
IBM_SSHKEY_ID=$3

## Check for IAM Trusted profileID
if [ -z "$IAM_TRUSTED_PROFILEID" ]; then
  echo "Please provide the IAM Trusted ProfileID."
  exit 1
fi

## Check for UI Password input
if [ -z "$UI_PASSWORD" ]; then
  echo "Please provide the UI password."
  exit 1
fi

## Check for UI Password input
if [ -z "$IBM_SSHKEY_ID" ]; then
  echo "Please provide the IBM Cloud SSH Key id."
  exit 1
fi

echo "#### Initiating setup of sandbox dashboard ####"

## Build Sandbox backend image
pushd $SRC_ROOT/backend
chmod +x build.sh
./build.sh

popd

## Build Sandbox frontend image
pushd $SRC_ROOT/frontend
chmod +x build.sh
./build.sh

popd

## Provide permissions to sql file
DB_SCHEMA_SCRIPT=$SRC_ROOT/resources/sandbox.sql
chmod +777 $DB_SCHEMA_SCRIPT
sed -i "s/ENCODE_PASSWORD/$UI_PASSWORD/g" $DB_SCHEMA_SCRIPT

## Update the environment variables in docker-compose file
sed -i "s/__DB_PASSWORD__/$DB_PASSWORD/g" $SRC_ROOT/resources/docker-compose.yml
sed -i "s|__DB_SCHEMA_SCRIPT__|$DB_SCHEMA_SCRIPT|g" $SRC_ROOT/resources/docker-compose.yml
sed -i "s/__TRUSTED_PROFILE__/$IAM_TRUSTED_PROFILEID/g" $SRC_ROOT/resources/docker-compose.yml
sed -i "s/__IBM_SSHKEY_ID__/$IBM_SSHKEY_ID/g" $SRC_ROOT/resources/docker-compose.yml

docker-compose -f $SRC_ROOT/resources/docker-compose.yml up -d 
