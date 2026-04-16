/**
 * Compares objects by a selected list of fields.
 *
 * Special cases for `areaTitle` and `cityTitle` also look into nested
 * `connectOrCreate.create.title` values.
 *
 * @param {string[]} fields
 * @param {Record<string, any>} left
 * @param {Record<string, any>} right
 * @returns {boolean}
 */
export const areSame = (fields, left, right) => {
  for (const field of fields) {
    if (field === 'areaTitle') {
      if (left[field] === right[field]) continue

      if (
        !left[field] &&
        left.area?.connectOrCreate.create.title &&
        left.area?.connectOrCreate.create.title !== right[field]
      ) {
        //console.log(left.area?.connectOrCreate.create.title, '->', right[field])
        return false
      }
    } else if (field === 'cityTitle') {
      if (left[field] === right[field]) continue

      if (
        !left[field] &&
        left.city?.connectOrCreate.create.title &&
        left.city?.connectOrCreate.create.title !== right[field]
      ) {
        //console.log(left.city?.connectOrCreate.create.title, '->', right[field])
        return false
      }
    } else if (left[field] !== right[field]) {
      //console.log(left[field], '->', right[field])
      return false
    }
  }

  return true
}

/**
 * Compares objects by a selected list of fields using named arguments.
 *
 * @param {{ fields: string[], left: Record<string, any>, right: Record<string, any> }} options
 * @returns {boolean}
 *
 * @example
 * const matches = matchFields({
 *   fields: ['title', 'cityTitle'],
 *   left,
 *   right,
 * })
 */
export const matchFields = ({ fields, left, right }) => {
  return areSame(fields, left, right)
}
