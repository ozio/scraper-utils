export const areSame = (fields, left, right) => {
  for (const field of fields) {
    if (field === 'areaTitle') {
      if (left[field] === right[field]) continue

      if (!left[field] && left.area?.connectOrCreate.create.title && left.area?.connectOrCreate.create.title !== right[field]) {
        //console.log(left.area?.connectOrCreate.create.title, '->', right[field])
        return false
      }
    } else if (field === 'cityTitle') {
      if (left[field] === right[field]) continue

      if (!left[field] && left.city?.connectOrCreate.create.title && left.city?.connectOrCreate.create.title !== right[field]) {
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
