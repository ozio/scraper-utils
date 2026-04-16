// https://stackoverflow.com/questions/10596417/is-there-a-way-to-get-element-by-xpath-using-javascript-in-selenium-webdriver

/**
 * Finds the first DOM element matching an XPath expression.
 *
 * @param {string} path
 * @returns {Node | null}
 */
export const getElementByXpath = (path) =>
  document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue

/**
 * Finds the first DOM element matching an XPath expression using named options.
 *
 * @param {{ xpath: string }} options
 * @returns {Node | null}
 */
export const findElement = ({ xpath }) => getElementByXpath(xpath)
