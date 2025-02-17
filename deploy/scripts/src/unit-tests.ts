import { check, group } from 'k6'
import TOTP from './utils/authentication/totp'
import { type Profile, type ProfileList, selectProfile } from './utils/config/load-profiles'

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    checks: ['rate==1.00']
  }
}

export default (): void => {
  group('authentication/totp', () => {
    // Examples from https://www.rfc-editor.org/rfc/rfc6238
    const sha1seed = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ' // Ascii string "12345678901234567890" in base32
    const sha256seed = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZA====' // 32 byte seed
    const sha512seed = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNA=' // 64 byte seed
    const sha1otp = new TOTP(sha1seed, 8, 'sha1')
    const sha256otp = new TOTP(sha256seed, 8, 'sha256')
    const sha512otp = new TOTP(sha512seed, 8, 'sha512')

    check(null, {
      '| SHA1   | T+59          |': () => sha1otp.generateTOTP(59 * 1000) === '94287082',
      '| SHA256 | T+1111111109  |': () => sha256otp.generateTOTP(1111111109 * 1000) === '68084774',
      '| SHA512 | T+1111111111  |': () => sha512otp.generateTOTP(1111111111 * 1000) === '99943326',
      '| SHA1   | T+1234567890  |': () => sha1otp.generateTOTP(1234567890 * 1000) === '89005924',
      '| SHA256 | T+2000000000  |': () => sha256otp.generateTOTP(2000000000 * 1000) === '90698825',
      '| SHA512 | T+20000000000 |': () => sha512otp.generateTOTP(20000000000 * 1000) === '47863826'
    })
  })

  group('config/load-profiles', () => {
    const profiles: ProfileList = {
      smoke: {
        'scenario-1a': {
          executor: 'constant-vus',
          duration: '1s'
        },
        'scenario-1b': {
          executor: 'shared-iterations'
        }
      },
      stress: {
        'scenario-2a': {
          executor: 'ramping-vus',
          stages: []
        },
        'scenario-2b': {
          executor: 'externally-controlled',
          duration: '2s'
        },
        'scenario-2c': {
          executor: 'per-vu-iterations'
        }
      }
    }

    const noFlags = selectProfile(profiles)
    const profileOnly = selectProfile(profiles, { profile: 'stress' })
    const singleScenario = selectProfile(profiles, { profile: 'smoke', scenario: 'scenario-1b' })
    const multiScenario = selectProfile(profiles, { profile: 'stress', scenario: 'scenario-2a,scenario-2b' })
    const scenarioAll = selectProfile(profiles, { profile: 'smoke', scenario: 'all' })
    const scenarioBlank = selectProfile(profiles, { profile: 'stress', scenario: '' })

    function checkProfile (profile: Profile, name: string, scenarioCount: number): boolean {
      return profile.name === name && Object.keys(profile.scenarios).length === scenarioCount
    }

    check(null, {
      'No Flags             ': () => checkProfile(noFlags, 'smoke', 2), // Default profile is smoke
      'Profile Only         ': () => checkProfile(profileOnly, 'stress', 3), // All scenarios for given profile enabled
      'Single Scenario      ': () => checkProfile(singleScenario, 'smoke', 1), // Only specified scenario enabled
      'Multi Scenario       ': () => checkProfile(multiScenario, 'stress', 2), // Only specified scenarios enabled
      'Scenario "all" String': () => checkProfile(scenarioAll, 'smoke', 2), // All scenarios enabled
      'Scenario Empty String': () => checkProfile(scenarioBlank, 'stress', 3) // All scenarios enabled
    })
  })
}
