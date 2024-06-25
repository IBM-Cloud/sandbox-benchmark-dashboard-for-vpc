#!/bin/bash

hostIP=$(hostname -I | awk '{ print $1}')
sed -i "s/API_IP/$hostIP/g" nginx.conf

docker build . -f Dockerfile -t sandbox-ui
