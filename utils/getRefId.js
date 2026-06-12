/**
 * Normalize a Mongoose ref field (ObjectId or populated subdocument) to its id.
 */
function getRefId(ref) {
    if (!ref) return null;
    return ref._id ?? ref;
}

module.exports = getRefId;
