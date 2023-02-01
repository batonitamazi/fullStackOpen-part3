require("dotenv").config()
const express = require("express")
const app = express()
const bodyParser = require("body-parser")
const morgan = require("morgan")
const cors = require("cors")
const Person = require("./models/person")

// create application/json parser
const jsonParser = bodyParser.json()

app.use(cors())
app.use(express.json())
app.use(express.static("build"))

app.use(
  morgan((tokens, req, res) => {
    return [
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens.res(req, res, "content-length"),
      "-",
      tokens["response-time"](req, res),
      "ms",
      JSON.stringify(req.body),
    ].join(" ")
  })
)

app.get("/info", (req, res, next) => {
  Person.find({})
    .then((result) =>
      res.send(
        `<p>phonebook has info for ${
          result.length
        } peope <br/> <p>${new Date()}</p>`
      )
    )
    .catch((error) => next(error))
})

app.get("/api/persons", (req, res, next) => {
  Person.find({})
    .then((result) => {
      res.json(result)
    })
    .catch((error) => next(error))
})

app.get("/api/persons/:id", (req, res, next) => {
  Person.findById(req.params.id)
    .then((person) => {
      if (person) {
        res.json(person)
      } else {
        res.status(404).end()
      }
    })
    .catch((error) => next(error))
})

app.delete("/api/persons/:id", (req, res, next) => {
  Person.findByIdAndDelete(req.params.id)
    .then(() => {
      res.status(204).end()
    })
    .catch((error) => next(error))
})
app.post("/api/persons", jsonParser, (req, res, next) => {
  // request.body is undefined!
  const body = req.body
  if (!body.name || !body.number) {
    return res.status(400).json({
      error: "The name or number is missing",
    })
  }
  const person = new Person({
    name: body.name,
    number: body.number,
  })

  person
    .save()
    .then((result) => res.json(result))
    .catch((error) => next(error))
})

app.put("/api/persons/:id", (req, res, next) => {
  const body = req.body
  const person = {
    name: body.name,
    number: body.number,
  }
  Person.findByIdAndUpdate(req.params.id, person, {
    new: true,
    runValidators: true,
    context: "query",
  })
    .then((updatedPerson) => {
      res.json(updatedPerson)
    })
    .catch((error) => next(error))
})

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === "CastError") {
    return response.status(400).send({ error: "malformatted id" })
  } else if (error.name === "ValidationError") {
    return response.status(400).json({ error: error.message })
  }
  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server is running on a port ${PORT}`)
})
