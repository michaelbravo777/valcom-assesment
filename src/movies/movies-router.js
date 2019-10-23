const path = require('path')
const express = require('express')
const xss = require('xss')
const MoviesService = require('./movies-service')

const moviesRouter = express.Router()
const jsonParser = express.json()

const serializeMovie = movie => ({
  id: movie.id,
  name: xss(movie.title),
  release_date: movie.release_date,
  overview: xss(movie.overview)
})

moviesRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db')
    MoviesService.getAllMovies(knexInstance)
      .then(movies => {
        res.json(movies.map(serializeMovie))
      })
      .catch(next)
  })
  .post(jsonParser, (req, res, next) => {
    const { name, release_date, overview } = req.body
    const newMovie = {
      title: name,
      release_date
    }

    for (const [key, value] of Object.entries(newMovie))
      if (value == null)
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        })

    newMovie.overview = overview

    MoviesService.insertMovie(
      req.app.get('db'),
      newMovie
    )
      .then(movie => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${movie.id}`))
          .json(serializeMovie(movie))
      })
      .catch(next)
  })

moviesRouter
  .route('/:movie_id')
  .all((req, res, next) => {
    MoviesService.getById(
      req.app.get('db'),
      req.params.movie_id
    )
      .then(movie => {
        if (!movie) {
          return res.status(404).json({
            error: { message: `Movie doesn't exist` }
          })
        }
        res.movie = movie
        next()
      })
      .catch(next)
  })
  .get((req, res, next) => {
    res.json(serializeMovie(res.movie))
  })
  .delete((req, res, next) => {
    MoviesService.deleteMovie(
      req.app.get('db'),
      req.params.movie_id
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })
  .patch(jsonParser, (req, res, next) => {
    const { title, overview } = req.body
    const movieToUpdate = { title, overview }

    const numberOfValues = Object.values(movieToUpdate).filter(Boolean).length
    if (numberOfValues === 0)
      return res.status(400).json({
        error: {
          message: `Request body must contain either 'title' or 'overview'`
        }
      })

    MoviesService.updateMovie(
      req.app.get('db'),
      req.params.movie_id,
      movieToUpdate
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })

module.exports = moviesRouter