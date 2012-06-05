#!/bin/bash

BASE_DIR=`dirname $0`

java -jar "$BASE_DIR/../lib/jstestdriver/JsTestDriver.jar" \
     --config "$BASE_DIR/../config/jsTestDriver.conf" \
     --basePath "$BASE_DIR/.." \
     --tests all
