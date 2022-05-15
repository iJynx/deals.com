const mongoose = require("mongoose");
// const { toJSON, paginate } = require("./plugins");

const CacheIndexSchema = mongoose.Schema(
  {
    query: {
      type: String,
      required: true,
    },
    results: {
      type: Array,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// CacheIndexSchema.plugin(toJSON);
const CacheIndex = mongoose.model("CacheIndex", CacheIndexSchema);

module.exports = {
  CacheIndex,
};
