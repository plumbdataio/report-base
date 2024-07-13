
import type { OnPreBuild, NetlifyConfig} from '@netlify/build'
//@ts-expect-error
import customerInfo from '../../../customer_info.json' assert { type: "json" }

// export const onPreDev = ({netlifyConfig}: {netlifyConfig: NetlifyConfig}) => {
//   netlifyConfig.build.environment = Object.assign(netlifyConfig.build.environment, customerInfo)
//   console.log(`netlifyConfig.build.environment: ${JSON.stringify(netlifyConfig.build.environment)}`);
// }
export const onDev = ({netlifyConfig}: {netlifyConfig: NetlifyConfig}) => {
  netlifyConfig.build.environment = Object.assign(netlifyConfig.build.environment, customerInfo)
  // delete process.env.AWS_LAMBDA_JS_RUNTIME
  // console.log(`netlifyConfig.build.environment: ${JSON.stringify(netlifyConfig.build.environment)}`);
}

// export const onPreBuild : OnPreBuild = ({netlifyConfig}) => {}