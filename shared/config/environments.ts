export interface EnvironmentConfig {
  endpoint: string;
  appId: string;
  apiKey: string;
  region: string;
  environment: string;
  userPoolId?: string;
  userPoolClientId?: string;
  oauthDomain?: string;
}

export const environments: Record<string, EnvironmentConfig> = {
  dev: {
    endpoint: 'https://fi5pjed64nf4ran34tusrlvi7u.appsync-api.us-east-2.amazonaws.com/graphql',
    appId: 'rxlu3umb3bdhjgswtlwqbsd44m',
    apiKey: 'da2-qfwm2qhugrbilizrqickmeg5oi',
    region: 'us-east-2',
    environment: 'dev',
    userPoolId: 'us-east-2_iAtP0Uzh5',
    userPoolClientId: '28h9r16c1gnq9v60jc1d5uuo5b',
    oauthDomain: 'velera-hazel-config.auth.us-east-2.amazoncognito.com'
  },
  test: {
    endpoint: 'https://duvqljupwfacli45hvfqoi3uni.appsync-api.us-east-2.amazonaws.com/graphql',
    appId: 'abc4k4lp35bidexf7g4cwaacqm',
    apiKey: 'da2-jvygmnixejf7vp6lnoctogaaje',
    region: 'us-east-2',
    environment: 'test'
  },
  uat: {
    endpoint: 'https://uat-db.placeholder.appsync-api.us-east-2.amazonaws.com/graphql',
    appId: 'uat-app-id-placeholder',
    apiKey: 'uat-api-key-placeholder',
    region: 'us-east-2',
    environment: 'uat'
  },
  prod: {
    endpoint: 'https://live-db.placeholder.appsync-api.us-east-2.amazonaws.com/graphql',
    appId: 'live-app-id-placeholder',
    apiKey: 'live-api-key-placeholder',
    region: 'us-east-2',
    environment: 'prod'
  }
};