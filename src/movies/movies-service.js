const MoviesService = {
  getAllNotes(knex) {
    return knex.select('*').from('movies')
  },

  insertNote(knex, newMovie) {
    return knex
      .insert(newMovie)
      .into('movies')
      .returning('*')
      .then(rows => {
        return rows[0]
      })
  },

  getById(knex, id) {
    return knex
      .from('movies')
      .select('*')
      .where('id', id)
      .first()
  },

  deleteNote(knex, id) {
    return knex('movies')
      .where({ id })
      .delete()
  },

  updateNote(knex, id, newMovieields) {
    return knex('movies')
      .where({ id })
      .update(newMovieFields)
  },
}

module.exports = MoviesService