const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    minlength: 3,
    unique: true,
    trim: true,
  },
  name: { type: String, default: '' },
  passwordHash: { type: String, required: true, select: false },
})

// Derive a user's blogs from their owner field to avoid two copies of the relationship.
userSchema.virtual('blogs', {
  ref: 'Blog',
  localField: '_id',
  foreignField: 'user',
})
userSchema.set('toJSON', {
  virtuals: true,
  transform: (_document, object) => {
    object.id = object._id.toString()
    delete object._id
    delete object.__v
    delete object.passwordHash
  },
})

module.exports = mongoose.model('User', userSchema)
