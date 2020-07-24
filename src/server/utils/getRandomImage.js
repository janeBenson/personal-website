const fetch = require('node-fetch')

const { unsplash } = require('../../../config.js')

async function getRandomImage() {
  const options = {
    method: 'GET',
    headers: {
      'Accept-Version': 'v1',
      Authorization: unsplash.authorization
    }
  }

  const res = await fetch(unsplash.url, options)
  const json = await res.json()
  return json
}

module.exports = getRandomImage
