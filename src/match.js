const regex = /(mapState|mapGetters|mapActions|mapMutations)\(([\n\s]*["']([\w\/]+)["'])?/g

const match = (text, regex) => {
  let match
  const matches = []
  while ((match = regex.exec(text))) {
    matches.push(match[3])
  }
  return matches
}

module.exports = (text) => {
  return match(text, regex)
}
