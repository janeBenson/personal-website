const cors = require('cors')
const express = require('express')
const path = require('path')

const app = express()
const port = 3000

app.use(cors())
app.use(express.json()) // auto parse incoming JSON
app.use(express.static('public'))

// For all routes, return index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'))
})

app.listen(port, () => console.log(`Server is listening on port ${port}.`))
