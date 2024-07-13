'use strict'

const fs = require("node:fs")
const util = require('node:util')
const { execSync, exec } = require('node:child_process')

const { parseArgs } = require('node:util')
const argOptions = {
  mode: {
    type: 'string',
  }
}
const args = parseArgs({args: process.argv, options: argOptions, allowPositionals: true})

const mode = args.values?.mode
console.log(`### mode: '${mode}'`)

const targetEnvStr = fs.readFileSync(`../.env.${mode}`).toString()
const partial = targetEnvStr.replace(/\"/g, "\\\"").replace(/\n^\n|\n^$/g, "\n").replace(/=/g,"\t").replace(/(.*)\t(.*)/g, '"$1": $2,').replace(/'/g, '"').trimEnd().slice(0,-1)
const targetEnvObj = JSON.parse(`{${partial}}\n`)

console.log(`### functions URL: '${targetEnvObj.FUNCTIONS_URL}'`)

const magicCommandRemovesHiddenColorCodes = `sed -r 's/[\x1B\x9B][][()#;?]*(([a-zA-Z0-9;]*\x07)|([0-9;]*[0-9A-PRZcf-ntqry=><~]))//g'`
const netlifyStatus = execSync(`netlify status | grep "Current site:" | ${magicCommandRemovesHiddenColorCodes}`).toString()
const currentProjectName = netlifyStatus.split(" ")[2].replace(/\n|\t| /g, "")

if(currentProjectName != targetEnvObj.PROJECT_NAME){
  console.log(`### Project needs to be switched from '${currentProjectName}' to '${targetEnvObj.PROJECT_NAME}'`)
  console.log(execSync(`netlify unlink`).toString())
  console.log(execSync(`netlify link --name ${targetEnvObj.PROJECT_NAME}`).toString())
} else {
  console.log(`### Project is already linked to ${targetEnvObj.PROJECT_NAME}`);
}

console.log("### Importing environment variables...");
console.log(execSync(`netlify env:import ../.env.${mode} 1>/dev/null`).toString())
console.log("### Done: Importing environment variables");
process.exit()