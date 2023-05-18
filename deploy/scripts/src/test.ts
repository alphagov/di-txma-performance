import http from 'k6/http'
import { type Options } from 'k6/options'
import { sleep } from 'k6'

export const options: Options = {
  duration: '1m',
  vus: 5,
  thresholds: {
    http_req_duration: ['p(95)<500']
  }
}

sleep(1);

const checkRes = check(res, {
    'status is 200': (r) => r.status === 200,
    'response body': (r) => r.body.indexOf('Collection of simple web-pages suitable for load testing') !== -1,
});

export default function (): void {
  http.get('https://test.k6.io')
  sleep(1)
}
