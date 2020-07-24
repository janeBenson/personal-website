const getRandomImage = require('./utils/getRandomImage')

module.exports = (app) => {
  // Get random image
  app.get('/api/random-image', async (req, res) => {
    try {
      const data = await getRandomImage()
      res.header('Content-Type', 'application/json')
      res.send(JSON.stringify(data))
    } catch (error) {
      console.log(error)
      res.status(500).send()
    }
  })
}
