/*

Угадыватель цены за доп. Идея в том, чтобы из строк получать цифры.

Напрмер:
"+5.000 по предварительной договорённости" -> 5000

*/

import { isValidPhone } from '../validators/isValidPhone.mjs'

const qeqLeft = {}
const qeqRight = {}
const qeqNums = {}

const guessPriceSimple = (string) => {
  let res = parseInt(string?.replace(/[^0-9]/g, ''))
  res = !Number.isNaN(res) && res > 0 && res <= 1000000 ? res : null

  if (res && res < 99) res = res * 1000
  if (res % 100 !== 0) return null

  return res
}

const l = (reason) => {
  //console.log('---');
  //console.log(left, number, right, number !== value ? '-> ' + value : '');
  console.log('     ==> ' + reason);
  //console.log('---');
}

const processTokens = ({ number, left, right, original }) => {
  let value = number
  let type = 'roubles'
  let mod

  //console.log(`         "${left}"`, `"${right}"`)

  if (value.includes('-') && value[0] !== '-' && value[value.length - 1] !== '-') {
    value = value.split('-').map(parseFloat)
  } else {
    value = parseFloat(value)
  }

  if (left === 'от' || left === 'свыше') {
    mod = 'minimum'
  }

  if (left === 'до') {
    mod = 'maximum'
  }

  if (left === 'по') {
    mod = 'each'
  }

  if (right === 'сутки' || left === 'сутки') {
    mod = 'for 24 hours'
  }

  if (
    right.startsWith('предупре') ||
    left.startsWith('предупре') ||
    right.startsWith('предварительн') ||
    right === 'заранее'
  ) {
    mod = 'warn before'
  }

  if ([
    'симпатии',
    'усмотрение',
    'отказать',
  ].includes(left) || [
    'обсуждается',
    'оставляю',
    'при',
    'строго',
    'только',
    'зависит',
    'исключительно',
  ].includes(right)) {
    mod = 'not guaranteed'
  }

  if (left.startsWith('прогл')) {
    mod = 'swallow'
  }

  if (left === 'лица') {
    mod = 'no face'
  }

  if ([
    'подружка',
    'подружкой',
    'подруга',
    'подругой',
    'доминой',
    'приглашу',
  ].includes(left)) {
    mod = 'girlfriend'
  }

  if (left === 'фото') {
    mod = 'photo'
  }

  if (left === 'видео') {
    mod = 'video'
  }

  if (left === 'более' || left === 'больше') {
    mod = 'maximum'
  }

  if (right === 'горловой') {
    mod = 'throat'
  }

  const w = ['ватсап', 'вотсап', 'рвотсап', 'whatsapp', 'вацапу', 'вацап']

  if (w.includes(right) || w.includes(left)) {
    mod = 'whatsapp'
  }

  if ([
    'подруги',
    'подруга',
    'подружки',
    'подружка',
    'девочки'
  ].includes(right)) {
    return {
      type: 'girlfriend',
      value,
      mod,
    }
  }

  if ([
    'контакт',
    'контакта',
  ].includes(right) && value < 5) {
    return {
      type: 'contacts',
      value,
      mod,
    }
  }

  if ([
    'раза',
    'раз',
  ].includes(right)) {
    return {
      type: 'times',
      value,
      mod,
    }
  }

  if ([
    'м',
    'мин',
    'минут',
    'минуты',
    'минуток',
    'минутки',
  ].includes(right)) {
    if (left === 'до') {
      mod = 'maximum'
    }

    return {
      type: 'minutes',
      value,
      mod,
    }
  }

  if ([
    'ч',
    'час',
    'часа',
    'часов',
    'чаосв',
    'часика',
    'часиков',
    'часовую',
  ].includes(right) && value < 20) {
    if (left === 'менее') {
      mod = 'maximum'
    }

    return {
      type: 'hours',
      value,
      mod,
    }
  }

  if ([
    'х',
    'человек',
    'человека',
    'мужчинами',
  ].includes(right)) {
    return {
      type: 'participants',
      value,
      mod,
    }
  }

  if ([
    'см',
    'сантиметров'
  ].includes(right)) {
    return {
      type: 'centimeters',
      value,
      mod,
    }
  }

  if (['профи', 'проф'].includes(right)) {
    mod = 'professional'
  }

  if ([
    'лет',
    'год',
    'года',
    'летнее',
    'летняя'
  ].includes(right)) {
    if (left === 'опыт' || left === 'работы') {
      mod = 'experience'
    }

    else if (left === 'с') {
      mod = 'started at'
    }

    else if (left === 'уже') {
      mod = 'already'
    }

    return {
      type: 'years',
      value,
      mod,
    }
  }

  if ([
    'шт',
    'штука',
    'штук',
  ].includes(right)) {
    return {
      type: 'items',
      value,
      mod,
    }
  }

  if ([
    'рта',
    'ротика',
  ].includes(right) || right.startsWith('язы')) {
    return {
      type: 'mouth',
      value,
      mod,
    }
  }

  if ([
    'вагины',
    'дырки',
    'дырочки',
  ].includes(right)) {
    return {
      type: 'holes',
      value,
      mod,
    }
  }

  if ([
    'струйки',
    'струи',
    'струй',
    'ручья',
  ].includes(right)) {
    return {
      type: 'stream',
      value,
      mod,
    }
  }

  if ([
    'руки',
    'ручки',
  ].includes(right)) {
    return {
      type: 'hands',
      value,
      mod,
    }
  }

  if ([
    'груди',
    'сиськи',
    'сисеньки',
  ].includes(right)) {
    return {
      type: 'breasts',
      value,
      mod,
    }
  }

  if ([
    'стороны',
  ].includes(right)) {
    return {
      type: 'ways',
      value,
      mod,
    }
  }

  if ([
    'горла',
    'глоточки',
  ].includes(right)) {
    return {
      type: 'throats',
      value,
      mod,
    }
  }

  if ((left === 'грудь') && value < 10) {
    return {
      type: 'breasts size',
      value,
      mod,
    }
  }

  if (left === 'ножки' && value < 45) {
    return {
      type: 'foot size',
      value,
      mod,
    }
  }

  if (right === 'размер' || right === 'размера') {
    return {
      type: 'size',
      value,
      mod,
    }
  }

  if (value === 69) {
    return {
      type: 'pose',
      value,
      mod,
    }
  }

  if (value === 1001) {
    return null
  }

  if (right.startsWith('паль')) {
    if (!Array.isArray(value) && value > 5) {

    } else {
      return {
        type: 'fingers',
        value,
        mod,
      }
    }
  }

  if (['х', 'x', '*'].includes(left) && number <= 10) {
    return {
      type: 'multiply',
      value,
      mod,
    }
  }

  if ([
    'т',
    'тр',
    'тыс',
    'тысяч',
  ].includes(right)) {
    if (number.toString(10).length < 4) {
      if (Array.isArray(value)) {
        value = value.map(v => v * 1000)
      } else {
        value *= 1000
      }
    }
  }

  if (!Array.isArray(value) && value >= 500 && value % 100 !== 0) {
    let resstr = value.toString(10)

    if (value > 130000 && value < 500000) {
      return {
        type: 'ic',
        value,
        mod,
      }
    }

    if (isValidPhone(value)) {
      return {
        type: 'phone',
        value,
        mod,
      }
    }

    if (!qeqNums[value]) qeqNums[value] = 0

    qeqNums[value]++

    //console.log([left, number, right].join('"'))
    //if (left === '2') {
    //  l('Токен исключён, потому что подозрителен: ' + chalk.yellow(resstr))
    //  console.log(original);
    //console.log('---');
    //}
    return null
  }

  // после всех проверок

  if (value === 0) {
    return null
  }

  if (right === 'половинке') {
    return null
  }

  if (left === 'на' && right === '') {
    return null
  }

  if (number === '2-5') {
    debugger
  }

  if (![
    'р',
    'руб',
    'рублей'
  ].includes(right) && (Array.isArray(value) && value[0] < 300 && value[1] < 300) || (value < 300)) {
    if (Array.isArray(value) && value[0] <= 90 && value[1] <= 90) {
      value = value.map(v => v * 1000)
    } else if (value <= 90) {
      value *= 1000
    } else {
      //l(`Ваще хз что это: ${value}`)
      return null
    }
  }

  return {
    type,
    value,
    mod,
  }
}

const symbolsRegex = new RegExp([
    /(820[1-9]|82[1-9]\d|8[34]\d{2})/,                // 8201-8499
    /(850[1-9]|85[1-9]\d)/,                           // 8501-8599
    /(970[1-9]|97[1-9]\d|9[89]\d{2})/,                // 9701-9999
    /(1000[1-9]|100[1-9]\d)/,                         // 10001-10099
    /11088/,                                          // 11088
    /(6250[1-9]|625[1-9]\d|62[6-9]\d{2}|6[34]\d{3}|65[0-4]\d{2}|655[0-4]\d)/,
                                                      // 62501-65549
    /(12344\d|12345\d|123460)/,                       // 123440-123460
    /(12740\d|1274[1-9]\d|127[5-9]\d{2})/,            // 127400-127999
    /(12800[1-9]|1280[1-9]\d|128[1-6]\d{2}|128700)/,  // 128001-128700
    /(12930\d|1293[1-9]\d|129[4-7]\d{2}|129800)/,     // 129300-129800
  ].map(r => r.source).join('|'), 'g')

const getSurroundings = (input, leftPos, rightPos) => {
  let leftSide = ''
  let rightSide = ''

  let spacesCount = 0

  for (let i = leftPos - 1; i >= 0; i--) {
    if (input[i] === ' ') {
      spacesCount++
      continue
    }

    if (spacesCount === 2) {
      break
    }

    leftSide = input[i] + leftSide
  }

  spacesCount = 0

  for (let i = rightPos; i < input.length; i++) {
    if (input[i] === ' ' || input[i] === '-') {
      spacesCount++
    }

    if (spacesCount === 2) {
      break
    }

    rightSide = rightSide + input[i]
  }

  return [
    leftSide.trim(),
    rightSide.trim()
  ]
}

export const guessPrice = (text) => {
  let str = text

  let debug = false
  let c = 1

  if (str.includes('.')) {
    debug = true
  }

  if (debug) console.log(c++, str) // 1

  str = str.toLowerCase()

  /*let m = [...str.matchAll(symbolsRegex)]

  if (m.length) {
    console.log(text);
    //console.log(m);
  }*/

   //str = str.replace(/(10083|9995|9757|9742|10060|8252|10071|11088|9996|127872|128074|128579|128580|127856|129528|128014|128587|127825|128109|128153|9832|65377|127792|128588|128111|128073|128105|127891|128680|128266|8505|128135|9792|128572|128142|128131|127932|62532|128541|9989|65533|129318|129335|128569|128506|128152|128377|128132|128545|127807|129365|128249|9889|9829|8311|128065|128308|128154|128155|128160|129366|129370|128420|128537|128167|129323|128124|127870|128057|128518|128510|128134|9794|9749|128178|128072|128406|65311|65289|65281|127470|127481|127467|127479|128519|128070|128581|127826|128151|128156|128170|127847|128578|127853|128516|127783|128140|128573|127998|123443|123445|123455|127775|128163|127814|127873|128081|128157|128222|128262|128305|128242|128344|128677|128048|128050|128571|128076|128143|128526|128275|129315|128067|128286|128539|128165|128175|128176|128064|127802|128049|128514|129333|129325|127868|8381|9786|10024|10084|127996|128068|128139|128150|128166|128517|128521|128525|128527|128536|128591|129300|129321|129392|127827|127820|128540|127801|129316|128069|128538|128512|128149|128147|128522|128524|128520|128535|129303|128513|128640|128523|128367|128158|128293|128584|129322|127798|128077|127995|127800|65039)/g, ' ')
  str = str.replace(symbolsRegex, ' ')

  str = str.replaceAll('первый ', '1 ')
  str = str.replaceAll('один ', '1 ')
  str = str.replaceAll('один-', '1-')
  //str = str.replaceAll('одна ', '1 ')
  str = str.replaceAll('одну ', '1 ')
  str = str.replaceAll('второй ', '2 ')
  str = str.replaceAll('два ', '2 ')
  str = str.replaceAll('два-', '2-')
  str = str.replaceAll('две ', '2 ')
  //str = str.replaceAll('пару ', '2 ')
  str = str.replaceAll('три ', '3 ')
  str = str.replaceAll('третий ', '3 ')
  str = str.replaceAll('четвёртый ', ' 4')
  str = str.replaceAll('четыре', '4')
  str = str.replaceAll('пятый', '5 ')
  str = str.replaceAll('пять', '5')
  str = str.replaceAll('шестой', '6 ')
  str = str.replaceAll('шесть', '6')
  str = str.replaceAll('седьмой ', '7 ')
  str = str.replaceAll('семь ', '7 ')
  str = str.replaceAll('восьмой ', '8 ')
  str = str.replaceAll('восемь', '8')
  str = str.replaceAll('девять', '9')
  str = str.replaceAll('десять', '10')
  str = str.replaceAll('двадцать ', '20 ')
  str = str.replaceAll('двадцать', '2')
  str = str.replaceAll('тридцать ', '30 ')
  str = str.replaceAll('тридцать', '3')
  str = str.replaceAll('за час', 'за 1 час')

  str = str.replaceAll('1 2 3 паль', '1-3 паль')
  str = str.replaceAll('1 2 паль', '1-2 паль')
  str = str.replaceAll('2 3 паль', '2-3 паль')

  if (debug) console.log(c++, str) // 2

  // change , in floats to . like 1,5 -> 1.5
  str = str.replace(/([1-9]),(5)/g, '$1.$2')
  if (debug) console.log(c++, str) // 3

  // remove all unnecessary . like 'word. ' -> 'word '
  str = str.replace(/(\D)[.]+|[.]+(\D|$)/g, '$1 $2')

  if (debug) console.log(c++, str) // 4

  // remove unnecessary symbols
  str = str.replace(/([+!()?,]|-х|-ти)/g, ' ')

  if (debug) console.log(c++, str) // 5

  // add spaces between letters and characters
  str = str.replace(/([a-zA-Zа-яА-Я])(\d+)|(\d+)([a-zA-Zа-яА-Я])/g, '$1 $2$3 $4')

  if (debug) console.log(c++, str) // 6

  // add spaces between thousands and simple numbers like 10002 -> 1000 2
  str = str.replace(/([05]00)([1-9]{1})(\D|$)/g, '$1 $2$3')

  if (debug) console.log(c++, str) // 7

  // collapse more than one space in a row to one space
  str = str.replace(/\s+/g, ' ').trim()

  if (debug) console.log(c++, str) // 8

  // remove spaces in numbers like 10 500 -> 10500, 2 000 -> 2000, 1 990 -> 1990
  str = str.replace(/(\d{1,3})\s(?=[05]{1}[0]{2}(?:$|\D))|(\d{1,2})\s(?=99[09](?:$|\D))/g, '$1')

  if (debug) console.log(c++, str) // 9

  str = str.replaceAll('.000', '000')
  str = str.replace(/1990|1999/g, '2000')
  str = str.replace(/2990|2999/g, '3000')
  str = str.replace(/3990|3999/g, '4000')
  str = str.replace(/4990|4999/g, '5000')
  str = str.replace(/5990|5999/g, '6000')
  str = str.replace(/6990|6999/g, '7000')
  str = str.replace(/7990|7999/g, '8000')
  str = str.replace(/8990|8999/g, '9000')
  str = str.replace(/1490|1499|1599/g, '1500')
  str = str.replace(/2490|2499|2599/g, '2500')
  str = str.replace(/999|990|2599/g, '1000')

  if (debug) console.log(c++, str)

  if (debug) console.log('-------') // 9

  //console.log('         "' + str + '"')

  //console.log()
  const res = [...str.matchAll(/(\d{1,}\s{0,1}-\s{0,1}\d{1,}|([0-9]*[.])?[0-9]+)/g)]
  const tokens = []

  res.forEach((item) => {
    const number = item[0]
    const leftPos = item.index
    const rightPos = item.index + item[0].length

    const [left, right] = getSurroundings(item.input, leftPos, rightPos)

    if (!qeqLeft[left]) qeqLeft[left] = 0
    if (!qeqRight[right]) qeqRight[right] = 0

    qeqLeft[left]++
    qeqRight[right]++

    if (left === 'в' && right !== 'раз' && right !== 'раза') {
      console.log(item.input);
    }

    tokens.push({ number, left, right, original: item.input })
  })

  return tokens.map(processTokens).filter(Boolean).map(t => {
    if (!t.mod) {
      delete t.mod
    }

    return t
  })
}
