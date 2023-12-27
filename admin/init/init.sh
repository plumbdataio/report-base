#!/bin/bash

LOGIN_ACCOUNT=""
PROJECT_NAME=""

##################

firebase login:use ${LOGIN_ACCOUNT}
firebase projects:create -n ${PROJECT_NAME} ${PROJECT_NAME}
firebase use --add ${PROJECT_NAME}
firebase use ${PROJECT_NAME}

firebase init hosting
firebase init database
# firebase init storage

firebase auth:import ./first-user.json

# firebase database:get --pretty -o ./db-data.json

# TODO:
# - CLI: import database from existing project
# - Console: setup appcheck and recaptcha