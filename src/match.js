const regex = /(mapState|mapGetters|mapActions|mapMutations)\(([\n\s]*["']([\w\/]+)["'])?/g

const match = (text, regex) => {
  let match
  const matches = []
  while ((match = regex.exec(text))) {
    if (match[3]) matches.push(match[3])
  }
  return Array.from(new Set(matches))
}

module.exports = (text) => {
  return match(text, regex)
}
