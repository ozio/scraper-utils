import { Nilsimsa } from 'nilsimsa'

export class Text {
  text
  hash

  constructor(text) {
    this.text = text
  }

  getHash() {
    if (this.hash) return this.hash

    const nilsimsa = new Nilsimsa()
    nilsimsa.update(this.text)
    this.hash = nilsimsa.digest('hash')

    return this.hash
  }

  compare(text) {
    return Nilsimsa.compare(this.getHash(), new Text(text).getHash()) / 128
  }

  toString() {
    return this.text
  }
}
