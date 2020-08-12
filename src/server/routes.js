const getRandomImage = require('./utils/getRandomImage')

module.exports = (app) => {
  // Get random image
  app.get('/api/random-image', async (req, res) => {
    try {
      const data = await getRandomImage()
      console.log(data)
      res.header('Content-Type', 'application/json')
      res.send(
        JSON.stringify({
          urls: {
            regular: data.urls.regular,
            small: data.urls.small
          },
          author: {
            name: data.user.name,
            portfolio: data.user.links.html
          }
        })
      )
    } catch (error) {
      console.log(error)
      res.status(500).send()
    }
  })
}
