import { beforeMount } from '@playwright/experimental-ct-react/hooks'

beforeMount(async ({ App }) => {
  return <App />
})
