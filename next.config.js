module.exports = {
  async rewrites() { // Proxy special URLs through to API
    return [
      {
        source: '/ping',
        destination: '/api/ping'
      },
      {
        source: '/info',
        destination: '/api/info'
      },
      {
        source: '/mutations',
        destination: '/api/mutations'
      },
      {
        source: '/conversations',
        destination: '/api/conversations'
      },
      {
        source: '/conversations/:id',
        destination: '/api/conversations/:id'
      }
    ]
  }
}