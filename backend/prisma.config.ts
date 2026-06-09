import { defineConfig } from 'prisma/config'

export default defineConfig({
  datasource: {
    url: 'postgresql://postgres:07212005@localhost:5432/datara_ai'
  },
  migrate: {
    async adapter() {
      const { PrismaPg } = await import('@prisma/adapter-pg')
      return new PrismaPg({ connectionString: 'postgresql://postgres:07212005@localhost:5432/datara_ai' })
    }
  }
})