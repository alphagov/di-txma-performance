import http, { type Response } from 'k6/http'
import { type Options } from 'k6/options'
import { check, group, sleep } from 'k6'
import { selectProfile, type ProfileList, describeProfile } from './utils/config/load-profiles'

const profiles: ProfileList = {
  smoke: {
    demoSamApp: {
      executor: 'ramping-arrival-rate',
      startRate: 1,
      timeUnit: '1m',
      preAllocatedVUs: 1,
      maxVUs: 1,
      stages: [
        { target: 6, duration: '10s' }, // Ramps up to target load
        { target: 6, duration: '10s' } // Holds at target load
      ],
      exec: 'demoSamApp'
    },
    demoNodeApp: {
      executor: 'ramping-arrival-rate',
      startRate: 1,
      timeUnit: '1m',
      preAllocatedVUs: 1,
      maxVUs: 1,
      stages: [
        { target: 6, duration: '10s' }, // Ramps up to target load
        { target: 6, duration: '10s' } // Holds at target load
      ],
      exec: 'demoNodeApp'
    }
  },
  load: {
    demoSamApp: {
      executor: 'ramping-arrival-rate',
      startRate: 1,
      timeUnit: '1m',
      preAllocatedVUs: 1,
      maxVUs: 50,
      stages: [
        { target: 60, duration: '120s' }, // Ramps up to target load
        { target: 60, duration: '120s' } // Holds at target load
      ],
      exec: 'demoSamApp'
    },
    demoNodeApp: {
      executor: 'ramping-arrival-rate',
      startRate: 1,
      timeUnit: '1m',
      preAllocatedVUs: 1,
      maxVUs: 50,
      stages: [
        { target: 60, duration: '120s' }, // Ramps up to target load
        { target: 60, duration: '120s' } // Holds at target load
      ],
      exec: 'demoNodeApp'
    }
  }
}
const loadProfile = selectProfile(profiles)

export const options: Options = {
  scenarios: loadProfile.scenarios,
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95th percntile response time <1000ms
    http_req_failed: ['rate<0.05'] // Error rate <5%
  }
}

export function setup (): void {
  describeProfile(loadProfile)
}

const env = {
  FE_URL: __ENV.CFN_HelloWorldApi, // Output from demoNodeApp
  BE_URL: __ENV.CFN_ApiGatewayEndpoint // Output from demoNodeApp
}

export function demoSamApp (): void {
  let res: Response

  group('GET - {demoSamApp} /test', function () {
    res = http.get(env.BE_URL + '/test')

    check(res, {
      'is status 200': r => r.status === 200,
      'verify page content': r => JSON.parse(r.body as string).code === 'success'
    })
  })

  sleep(1)
}

export function demoNodeApp (): void {
  let res: Response

  group('GET - {demoNodeApp}', function () {
    res = http.get(env.FE_URL)

    check(res, {
      'is status 200': r => r.status === 200,
      'verify page content': r => JSON.parse(r.body as string).message === 'hello world'
    })
  })

  sleep(1)
}
