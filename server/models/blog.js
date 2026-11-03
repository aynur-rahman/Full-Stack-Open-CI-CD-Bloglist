const mongoose = require('mongoose')

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  author: { type: String, default: '', trim: true },
  url: { type: String, required: true, trim: true },
  comments: { type: [String], default: [] },
  likes: { type: Number, default: 0, min: 0, validate: Number.isInteger },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
})

blogSchema.set('toJSON', {
  transform: (_document, object) => {
    object.id = object._id.toString()
    delete object._id
    delete object.__v
  },
})

module.exports = mongoose.model('Blog', blogSchema)
