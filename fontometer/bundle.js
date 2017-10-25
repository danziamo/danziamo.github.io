(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

const gen = require('./lib/generator.js');
const domInjector = require('./lib/dom-injector');
const pr = require('./lib/css-parser');

window.onload = function() {
    let cssProps = {};
    const generate = () => {
        gen(document, cssProps);
    };
    document.getElementById('genButton').onclick = generate;

    var timer;
    document.getElementById('family').onkeyup = (e) => {
        clearTimeout(timer);
        timer = setTimeout(function() {
            const link = 'https://fonts.googleapis.com/css?family=' + e.target.value;

            const httpRequest = new XMLHttpRequest();
            httpRequest.onreadystatechange = function() {
                if (this.readyState === 4 && this.status === 200) {
                    cssProps = pr(this.responseText);
                    domInjector(document, e.target.value, link, cssProps);
                    // console.log(cssProps);
                }
            }
            httpRequest.open('GET', link, true);
            httpRequest.send();
        }, 600);
    };

};

/* global document window */

},{"./lib/css-parser":4,"./lib/dom-injector":5,"./lib/generator.js":8}],2:[function(require,module,exports){
'use strict';

module.exports = {
    p: (body) => ({
        type: 'Program', body: body }),
    es: (expr) => ({
        type: 'ExpressionStatement', expression: expr }),
    ifs: (test, consequent, alternate) => ({
        type: 'IfStatement', test: test, consequent: consequent, alternate: alternate || null }),
    be: (operator, left, right) => ({
        type: 'BinaryExpression', operator: operator, left: left, right: right }),
    le: (operator, left, right) => ({
        type: 'LogicalExpression', operator: operator, left: left, right: right }),
    ae: (operator, left, right) => ({
        type: 'AssignmentExpression', operator: operator, left: left, right: right }),
    me: (object, property, computed) => ({
        type: 'MemberExpression', object: object, property: property, computed: computed || false }),
    ce: (callee, args) => ({
        type: 'CallExpression', callee: callee, arguments: args || [] }),
    vds: (declarations, kind) => ({
        type: 'VariableDeclaration', declarations: declarations || [], kind: kind || 'var' }),
    vdr: (id, init) => ({
        type: 'VariableDeclarator', id: id, init: init }),
    id: (name) => ({
        type: 'Identifier', name: name.toString() }),
    lit: (val) => ({
        type: 'Literal', value: val }),
    fs: (init, test, update, body) => ({
        type: 'ForStatement', init: init, test: test, update: update, body: body }),
    bs: (body) => ({
        type: 'BlockStatement', body: body }),
    oe: (properties) => ({
        type: 'ObjectExpression', properties: properties || [] }),
    pr: (key, value, computed) => ({
        type: 'Property', key: key, value: value, computed: computed || false,
        kind: 'init', method: false, shorthand: false }),
    fe: (params, body) => ({
        type: 'FunctionExpression', id: null, params: params,
        body: body, generator: false, expression: false, async: false }),
    rs: (argument) => ({
        type: 'ReturnStatement', argument: argument }),
    cs: (label) => ({
        type: 'ContinueStatement', label: label || null }),
    ue: (operator, argument, prefix) => ({
        type: 'UnaryExpression', operator: operator, argument: argument, prefix: prefix || true }),
    ts: (block, handler, finalizer) => ({
        type: 'TryStatement', block: block, handler: handler, finalizer: finalizer || null }),
    cc: (param, body) => ({
        type: 'CatchClause', param: param, body: body }),
    afe: (params, body) => ({
        type: 'ArrowFunctionExpression', params: params, body: body, id: null, generator: false, expression: true, asyns: false }),
    ls: (label, body) => ({
        type: 'LabeledStatement', label: label, body: body }),
    ne: (callee, args) => ({
        type: 'NewExpression', callee: callee, arguments: args || [] }),
    are: (elements) => ({
        type: 'ArrayExpression', elements: elements || []})
};

},{}],3:[function(require,module,exports){
'use strict';

const esprima = require('esprima')
    , escodegen = require('escodegen')
    , f = require('./ast-descriptor')
    ;

const minifiedOptions = {
    format: {
        indent: {
            style: ''
        },
        space: '',
        newline: ''
    }
};

const getVdr = (key, value) => {
    return f.vdr(f.id(key), f.lit(value));
};

const initVar = (cst) => {
    return f.vds([
        f.vdr(
            f.id('table'),
            f.are(cst.table.map(e => f.lit(e)))
        ),
        getVdr('baseSize', cst.baseSize),
        getVdr('height', cst.height),
        getVdr('descent', cst.height*cst.magicRatio),
        getVdr('defaultWidth', cst.default),
        cst.regex && f.vdr(f.id('re'), f.ne(f.id('RegExp'), [f.lit(cst.regex)]))
    ], 'const');

};

const genGetHeight = () => {
    return f.pr(
        f.id('getHeight'),
        f.fe(
            [],
            f.bs([f.rs(f.be('*', f.id('ratio'), f.id('height')))])
        )
    );
};

const genGetDescent = () => {
    return f.pr(
        f.id('getDescent'),
        f.fe(
            [],
            f.bs([f.rs(f.be('*', f.id('ratio'), f.id('descent')))])
        )
    );
};

const genGetWidth = () => {
    return f.pr(
        f.id('getWidth'), f.id('getWidth')
    );
};

const genMatchWidth = () => {
    let script = 'const getIndex = (ch) => { const m = ch.match(re);' +
        'if (m !== null)' +
        'for (let i = 0; i < table.length; i += 1)' +
        'if (m[i + 1] !== undefined) return i;};';
    return esprima.parseScript(script).body[0];
};

const genWidth = () => {
    var script = 'const getWidth = (str) => { return str.split("").reduce( (acc, e) => acc + (table[getIndex(e)] || defaultWidth)*ratio, 0); };';
    return esprima.parseScript(script).body[0];
};

const genReturnStatement = () => {
    return f.rs(
        f.fe(
            [f.id('fontSize')],
            f.bs([
                f.vds([
                    f.vdr(
                        f.id('ratio'),
                        f.be('/', f.id('fontSize'), f.id('baseSize'))
                    )
                ], 'const'),
                genMatchWidth(),
                genWidth(),
                f.rs(
                    f.oe([
                        genGetHeight('height'),
                        genGetDescent('descent'),
                        genGetWidth('width')
                    ])
                )
            ])
        )
    );
};

module.exports = (cst) => {
    const ast = f.p(
        Object.keys(cst).reduce( (acc, e) => {
            return acc.concat(
                f.es(
                    f.ae('=',
                        f.me(f.id('exports'), f.lit(e.replace(/["' ]/g, '')), true),
                        f.fe(
                            [],
                            f.bs([
                                initVar(cst[e]),
                                genReturnStatement(cst[e])
                            ])
                        )
                    )
                )
            );
        }, [])
    );
    return {
        normal: escodegen.generate(ast, {}),
        minified: escodegen.generate(ast, minifiedOptions)
    };
};

},{"./ast-descriptor":2,"escodegen":12,"esprima":14}],4:[function(require,module,exports){
'use strict';

const postcss = require('postcss');

module.exports = (css) => {
    const processor = postcss();
    const nodes = processor.process(css).result.root.nodes
        .filter(e => e.type === 'atrule')
        .reduce( (acc, e) => {
            const node = e.nodes.filter(item => item.prop === 'font-family')[0];
            if (acc[node.value] === undefined) {
                acc[node.value] = {};
            }
            e.nodes
                .filter(item => item.prop !== 'font-family')
                .forEach( item => {
                    if (item.prop === 'unicode-range') {
                        if (acc[node.value]['unicode-range'] === undefined)
                            acc[node.value]['unicode-range'] = item.value;
                        else
                            acc[node.value]['unicode-range'] += ' ' + item.value;
                    } else {
                        acc[node.value][item.prop] = item.value;
                    }
                });
            return acc;
        }, {});
    return nodes;
};

},{"postcss":35}],5:[function(require,module,exports){
'use strict';

const fu = require('./font-util');

module.exports = (document, family, link) => {

    if (document.getElementsByTagName('link').length !== 0)
        document.getElementsByTagName('head')[0].removeChild(document.getElementsByTagName('link')[0]);
    var el = document.createElement('link');
    el.setAttribute('rel', 'stylesheet');
    el.setAttribute('href', link);
    document.getElementsByTagName('head')[0].appendChild(el);
    document.getElementsByTagName('style')[0].innerHTML = 'body * { font-family: ' + fu.formatFont(family) + ', Roboto; font-size: 24px;}';
};

},{"./font-util":7}],6:[function(require,module,exports){
'use strict';

module.exports = (document) => {
    const createSvg = (family) => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textEl.style['font-family'] = family.replace(/["']/g, '');
        svg.setAttributeNS(null, 'width', '0');
        svg.setAttributeNS(null, 'height', '0');
        svg.style.visibility = 'hidden';
        document.body.appendChild(svg);
        svg.appendChild(textEl);


        return {
            svg: svg,
            tw: (text, fs) => {
                textEl.style['font-size'] = fs + 'px';
                textEl.textContent = text;
                const bBox = svg.getBBox();
                return {
                    w: bBox.width,
                    h: bBox.height
                };
            }
        };
    };

    const removeSvg = (svg) => {
        document.body.removeChild(svg);
    };

    const attachStrButton = (btnId, fileName, str) => {
        const btn = document.getElementById(btnId);
        btn.innerText = fileName + '.js (' + str.length + ' bytes)';
        btn.onclick = () => download(str, fileName);
    };

    const download = (txt, name) => {
        const elem = document.createElement('a');
        elem.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(txt));
        elem.setAttribute('download', name.toLowerCase().replace(' ', '-')+'.js');
        elem.style.display='none';
        document.body.appendChild(elem);
        elem.click();
        document.body.removeChild(elem);
    };

    return {
        attachStrButton: attachStrButton,
        createSvg: createSvg,
        removeSvg: removeSvg,
        download: download
    };
};

},{}],7:[function(require,module,exports){
'use strict';

const reRegExpChar = /[-\\^$.*+?()[\]{}|]/g;
const reHasRegExpChar = RegExp(reRegExpChar.source);

const escapeString = (str) => {
    return (str && reHasRegExpChar.test(str))
        ? str.replace(reRegExpChar, '\\$&')
        : str;
};

const getBaseSize = (tw) => {
    let r = {};
    let k = 0;
    let baseSize = 288;
    for (let f = 9; f <= 288; f+= 1) {
        let int = 0;
        let rat = 0;
        r[f] = new Set();
        for (let c = 33; c < 127; c += 1) {
            const chw = tw(String.fromCharCode(c), f).w;
            if (Number.isInteger(chw)) int += 1;
            else rat += 1;
            r[f].add(chw);
        }
        if (int/rat > k) {
            k = int/rat;
            baseSize = f;
        }
    }
    return baseSize;
};

const genTable = (tw, bs) => {
    let lst = 100;
    let mst = 0;
    let minHeight = 1000;
    let maxHeight = 0;
    let res = {};
    for (let c = 33; c < 127; c += 1) {
        const ch = String.fromCharCode(c);
        const chs = tw(ch, bs);
        if (chs.w < lst) lst = chs.w;
        if (chs.w > mst) mst = chs.w;
        if (chs.h < minHeight) minHeight = chs.h;
        if (chs.h > maxHeight) maxHeight = chs.h;
        if (res[chs.w] === undefined)
            res[chs.w] = '';
        res[chs.w] += ch;
    }

    res = Object.keys(res).reduce( (acc, e) => {
        acc[res[e]] = e;
        return acc;
    }, {});

    return {
        regex: Object.keys(res)
            .reduce( (acc, e) => acc.concat('([' + escapeString(e) + '])'), [])
            .join('|'),
        table: Object.keys(res).map( e => res[e]),
        height: maxHeight,
        default: (3 * mst + lst)/4
    };
};

const formatFont = (str) => {
    return str.split('|').map(e =>
        e.split('&')[0].split(':')[0].replace('+', ' ')
    ).join(', ');
};



module.exports = {
    getBaseSize: getBaseSize,
    genTable: genTable,
    formatFont: formatFont
};

},{}],8:[function(require,module,exports){
'use strict';

const ast = require('./ast-gen.js')
    , domUtil = require('./dom-util.js')
    , fu = require('./font-util.js')
    ;

module.exports = function(document, props) {
    const dom = domUtil(document);
    const cst = Object.keys(props).reduce( (acc, family) => {
        const svgGen = dom.createSvg(family);
        const svg = svgGen.svg;
        const tw = svgGen.tw;
        const baseSize = fu.getBaseSize(tw);
        const gt = fu.genTable(tw, baseSize);

        dom.removeSvg(svg);

        acc[family] = Object.assign({baseSize: baseSize, magicRatio: .35}, gt);
        return acc;

    }, {});

    const content = ast(cst);
    dom.attachStrButton('btnDownload', 'fonts', content.normal);
    dom.attachStrButton('btnDownloadMin', 'fonts.min', content.minified);
};

},{"./ast-gen.js":3,"./dom-util.js":6,"./font-util.js":7}],9:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function placeHoldersCount (b64) {
  var len = b64.length
  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0
}

function byteLength (b64) {
  // base64 is 4/3 + up to two characters of the original data
  return (b64.length * 3 / 4) - placeHoldersCount(b64)
}

function toByteArray (b64) {
  var i, l, tmp, placeHolders, arr
  var len = b64.length
  placeHolders = placeHoldersCount(b64)

  arr = new Arr((len * 3 / 4) - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0; i < l; i += 4) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

},{}],10:[function(require,module,exports){

},{}],11:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('Invalid typed array length')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (isArrayBuffer(value)) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  return fromObject(value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj) {
    if (isArrayBufferView(obj) || 'length' in obj) {
      if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
        return createBuffer(0)
      }
      return fromArrayLike(obj)
    }

    if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
      return fromArrayLike(obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (isArrayBufferView(string) || isArrayBuffer(string)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : new Buffer(val, encoding)
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffers from another context (i.e. an iframe) do not pass the `instanceof` check
// but they should be treated as valid. See: https://github.com/feross/buffer/issues/166
function isArrayBuffer (obj) {
  return obj instanceof ArrayBuffer ||
    (obj != null && obj.constructor != null && obj.constructor.name === 'ArrayBuffer' &&
      typeof obj.byteLength === 'number')
}

// Node 0.10 supports `ArrayBuffer` but lacks `ArrayBuffer.isView`
function isArrayBufferView (obj) {
  return (typeof ArrayBuffer.isView === 'function') && ArrayBuffer.isView(obj)
}

function numberIsNaN (obj) {
  return obj !== obj // eslint-disable-line no-self-compare
}

},{"base64-js":9,"ieee754":21}],12:[function(require,module,exports){
(function (global){
/*
  Copyright (C) 2012-2014 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2015 Ingvar Stepanyan <me@rreverser.com>
  Copyright (C) 2014 Ivan Nikulin <ifaaan@gmail.com>
  Copyright (C) 2012-2013 Michael Ficarra <escodegen.copyright@michael.ficarra.me>
  Copyright (C) 2012-2013 Mathias Bynens <mathias@qiwi.be>
  Copyright (C) 2013 Irakli Gozalishvili <rfobic@gmail.com>
  Copyright (C) 2012 Robert Gust-Bardon <donate@robert.gust-bardon.org>
  Copyright (C) 2012 John Freeman <jfreeman08@gmail.com>
  Copyright (C) 2011-2012 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2012 Joost-Wim Boekesteijn <joost-wim@boekesteijn.nl>
  Copyright (C) 2012 Kris Kowal <kris.kowal@cixar.com>
  Copyright (C) 2012 Arpad Borsos <arpad.borsos@googlemail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/*global exports:true, require:true, global:true*/
(function () {
    'use strict';

    var Syntax,
        Precedence,
        BinaryPrecedence,
        SourceNode,
        estraverse,
        esutils,
        isArray,
        base,
        indent,
        json,
        renumber,
        hexadecimal,
        quotes,
        escapeless,
        newline,
        space,
        parentheses,
        semicolons,
        safeConcatenation,
        directive,
        extra,
        parse,
        sourceMap,
        sourceCode,
        preserveBlankLines,
        FORMAT_MINIFY,
        FORMAT_DEFAULTS;

    estraverse = require('estraverse');
    esutils = require('esutils');

    Syntax = estraverse.Syntax;

    // Generation is done by generateExpression.
    function isExpression(node) {
        return CodeGenerator.Expression.hasOwnProperty(node.type);
    }

    // Generation is done by generateStatement.
    function isStatement(node) {
        return CodeGenerator.Statement.hasOwnProperty(node.type);
    }

    Precedence = {
        Sequence: 0,
        Yield: 1,
        Await: 1,
        Assignment: 1,
        Conditional: 2,
        ArrowFunction: 2,
        LogicalOR: 3,
        LogicalAND: 4,
        BitwiseOR: 5,
        BitwiseXOR: 6,
        BitwiseAND: 7,
        Equality: 8,
        Relational: 9,
        BitwiseSHIFT: 10,
        Additive: 11,
        Multiplicative: 12,
        Unary: 13,
        Postfix: 14,
        Call: 15,
        New: 16,
        TaggedTemplate: 17,
        Member: 18,
        Primary: 19
    };

    BinaryPrecedence = {
        '||': Precedence.LogicalOR,
        '&&': Precedence.LogicalAND,
        '|': Precedence.BitwiseOR,
        '^': Precedence.BitwiseXOR,
        '&': Precedence.BitwiseAND,
        '==': Precedence.Equality,
        '!=': Precedence.Equality,
        '===': Precedence.Equality,
        '!==': Precedence.Equality,
        'is': Precedence.Equality,
        'isnt': Precedence.Equality,
        '<': Precedence.Relational,
        '>': Precedence.Relational,
        '<=': Precedence.Relational,
        '>=': Precedence.Relational,
        'in': Precedence.Relational,
        'instanceof': Precedence.Relational,
        '<<': Precedence.BitwiseSHIFT,
        '>>': Precedence.BitwiseSHIFT,
        '>>>': Precedence.BitwiseSHIFT,
        '+': Precedence.Additive,
        '-': Precedence.Additive,
        '*': Precedence.Multiplicative,
        '%': Precedence.Multiplicative,
        '/': Precedence.Multiplicative
    };

    //Flags
    var F_ALLOW_IN = 1,
        F_ALLOW_CALL = 1 << 1,
        F_ALLOW_UNPARATH_NEW = 1 << 2,
        F_FUNC_BODY = 1 << 3,
        F_DIRECTIVE_CTX = 1 << 4,
        F_SEMICOLON_OPT = 1 << 5;

    //Expression flag sets
    //NOTE: Flag order:
    // F_ALLOW_IN
    // F_ALLOW_CALL
    // F_ALLOW_UNPARATH_NEW
    var E_FTT = F_ALLOW_CALL | F_ALLOW_UNPARATH_NEW,
        E_TTF = F_ALLOW_IN | F_ALLOW_CALL,
        E_TTT = F_ALLOW_IN | F_ALLOW_CALL | F_ALLOW_UNPARATH_NEW,
        E_TFF = F_ALLOW_IN,
        E_FFT = F_ALLOW_UNPARATH_NEW,
        E_TFT = F_ALLOW_IN | F_ALLOW_UNPARATH_NEW;

    //Statement flag sets
    //NOTE: Flag order:
    // F_ALLOW_IN
    // F_FUNC_BODY
    // F_DIRECTIVE_CTX
    // F_SEMICOLON_OPT
    var S_TFFF = F_ALLOW_IN,
        S_TFFT = F_ALLOW_IN | F_SEMICOLON_OPT,
        S_FFFF = 0x00,
        S_TFTF = F_ALLOW_IN | F_DIRECTIVE_CTX,
        S_TTFF = F_ALLOW_IN | F_FUNC_BODY;

    function getDefaultOptions() {
        // default options
        return {
            indent: null,
            base: null,
            parse: null,
            comment: false,
            format: {
                indent: {
                    style: '    ',
                    base: 0,
                    adjustMultilineComment: false
                },
                newline: '\n',
                space: ' ',
                json: false,
                renumber: false,
                hexadecimal: false,
                quotes: 'single',
                escapeless: false,
                compact: false,
                parentheses: true,
                semicolons: true,
                safeConcatenation: false,
                preserveBlankLines: false
            },
            moz: {
                comprehensionExpressionStartsWithAssignment: false,
                starlessGenerator: false
            },
            sourceMap: null,
            sourceMapRoot: null,
            sourceMapWithCode: false,
            directive: false,
            raw: true,
            verbatim: null,
            sourceCode: null
        };
    }

    function stringRepeat(str, num) {
        var result = '';

        for (num |= 0; num > 0; num >>>= 1, str += str) {
            if (num & 1) {
                result += str;
            }
        }

        return result;
    }

    isArray = Array.isArray;
    if (!isArray) {
        isArray = function isArray(array) {
            return Object.prototype.toString.call(array) === '[object Array]';
        };
    }

    function hasLineTerminator(str) {
        return (/[\r\n]/g).test(str);
    }

    function endsWithLineTerminator(str) {
        var len = str.length;
        return len && esutils.code.isLineTerminator(str.charCodeAt(len - 1));
    }

    function merge(target, override) {
        var key;
        for (key in override) {
            if (override.hasOwnProperty(key)) {
                target[key] = override[key];
            }
        }
        return target;
    }

    function updateDeeply(target, override) {
        var key, val;

        function isHashObject(target) {
            return typeof target === 'object' && target instanceof Object && !(target instanceof RegExp);
        }

        for (key in override) {
            if (override.hasOwnProperty(key)) {
                val = override[key];
                if (isHashObject(val)) {
                    if (isHashObject(target[key])) {
                        updateDeeply(target[key], val);
                    } else {
                        target[key] = updateDeeply({}, val);
                    }
                } else {
                    target[key] = val;
                }
            }
        }
        return target;
    }

    function generateNumber(value) {
        var result, point, temp, exponent, pos;

        if (value !== value) {
            throw new Error('Numeric literal whose value is NaN');
        }
        if (value < 0 || (value === 0 && 1 / value < 0)) {
            throw new Error('Numeric literal whose value is negative');
        }

        if (value === 1 / 0) {
            return json ? 'null' : renumber ? '1e400' : '1e+400';
        }

        result = '' + value;
        if (!renumber || result.length < 3) {
            return result;
        }

        point = result.indexOf('.');
        if (!json && result.charCodeAt(0) === 0x30  /* 0 */ && point === 1) {
            point = 0;
            result = result.slice(1);
        }
        temp = result;
        result = result.replace('e+', 'e');
        exponent = 0;
        if ((pos = temp.indexOf('e')) > 0) {
            exponent = +temp.slice(pos + 1);
            temp = temp.slice(0, pos);
        }
        if (point >= 0) {
            exponent -= temp.length - point - 1;
            temp = +(temp.slice(0, point) + temp.slice(point + 1)) + '';
        }
        pos = 0;
        while (temp.charCodeAt(temp.length + pos - 1) === 0x30  /* 0 */) {
            --pos;
        }
        if (pos !== 0) {
            exponent -= pos;
            temp = temp.slice(0, pos);
        }
        if (exponent !== 0) {
            temp += 'e' + exponent;
        }
        if ((temp.length < result.length ||
                    (hexadecimal && value > 1e12 && Math.floor(value) === value && (temp = '0x' + value.toString(16)).length < result.length)) &&
                +temp === value) {
            result = temp;
        }

        return result;
    }

    // Generate valid RegExp expression.
    // This function is based on https://github.com/Constellation/iv Engine

    function escapeRegExpCharacter(ch, previousIsBackslash) {
        // not handling '\' and handling \u2028 or \u2029 to unicode escape sequence
        if ((ch & ~1) === 0x2028) {
            return (previousIsBackslash ? 'u' : '\\u') + ((ch === 0x2028) ? '2028' : '2029');
        } else if (ch === 10 || ch === 13) {  // \n, \r
            return (previousIsBackslash ? '' : '\\') + ((ch === 10) ? 'n' : 'r');
        }
        return String.fromCharCode(ch);
    }

    function generateRegExp(reg) {
        var match, result, flags, i, iz, ch, characterInBrack, previousIsBackslash;

        result = reg.toString();

        if (reg.source) {
            // extract flag from toString result
            match = result.match(/\/([^/]*)$/);
            if (!match) {
                return result;
            }

            flags = match[1];
            result = '';

            characterInBrack = false;
            previousIsBackslash = false;
            for (i = 0, iz = reg.source.length; i < iz; ++i) {
                ch = reg.source.charCodeAt(i);

                if (!previousIsBackslash) {
                    if (characterInBrack) {
                        if (ch === 93) {  // ]
                            characterInBrack = false;
                        }
                    } else {
                        if (ch === 47) {  // /
                            result += '\\';
                        } else if (ch === 91) {  // [
                            characterInBrack = true;
                        }
                    }
                    result += escapeRegExpCharacter(ch, previousIsBackslash);
                    previousIsBackslash = ch === 92;  // \
                } else {
                    // if new RegExp("\\\n') is provided, create /\n/
                    result += escapeRegExpCharacter(ch, previousIsBackslash);
                    // prevent like /\\[/]/
                    previousIsBackslash = false;
                }
            }

            return '/' + result + '/' + flags;
        }

        return result;
    }

    function escapeAllowedCharacter(code, next) {
        var hex;

        if (code === 0x08  /* \b */) {
            return '\\b';
        }

        if (code === 0x0C  /* \f */) {
            return '\\f';
        }

        if (code === 0x09  /* \t */) {
            return '\\t';
        }

        hex = code.toString(16).toUpperCase();
        if (json || code > 0xFF) {
            return '\\u' + '0000'.slice(hex.length) + hex;
        } else if (code === 0x0000 && !esutils.code.isDecimalDigit(next)) {
            return '\\0';
        } else if (code === 0x000B  /* \v */) { // '\v'
            return '\\x0B';
        } else {
            return '\\x' + '00'.slice(hex.length) + hex;
        }
    }

    function escapeDisallowedCharacter(code) {
        if (code === 0x5C  /* \ */) {
            return '\\\\';
        }

        if (code === 0x0A  /* \n */) {
            return '\\n';
        }

        if (code === 0x0D  /* \r */) {
            return '\\r';
        }

        if (code === 0x2028) {
            return '\\u2028';
        }

        if (code === 0x2029) {
            return '\\u2029';
        }

        throw new Error('Incorrectly classified character');
    }

    function escapeDirective(str) {
        var i, iz, code, quote;

        quote = quotes === 'double' ? '"' : '\'';
        for (i = 0, iz = str.length; i < iz; ++i) {
            code = str.charCodeAt(i);
            if (code === 0x27  /* ' */) {
                quote = '"';
                break;
            } else if (code === 0x22  /* " */) {
                quote = '\'';
                break;
            } else if (code === 0x5C  /* \ */) {
                ++i;
            }
        }

        return quote + str + quote;
    }

    function escapeString(str) {
        var result = '', i, len, code, singleQuotes = 0, doubleQuotes = 0, single, quote;

        for (i = 0, len = str.length; i < len; ++i) {
            code = str.charCodeAt(i);
            if (code === 0x27  /* ' */) {
                ++singleQuotes;
            } else if (code === 0x22  /* " */) {
                ++doubleQuotes;
            } else if (code === 0x2F  /* / */ && json) {
                result += '\\';
            } else if (esutils.code.isLineTerminator(code) || code === 0x5C  /* \ */) {
                result += escapeDisallowedCharacter(code);
                continue;
            } else if (!esutils.code.isIdentifierPartES5(code) && (json && code < 0x20  /* SP */ || !json && !escapeless && (code < 0x20  /* SP */ || code > 0x7E  /* ~ */))) {
                result += escapeAllowedCharacter(code, str.charCodeAt(i + 1));
                continue;
            }
            result += String.fromCharCode(code);
        }

        single = !(quotes === 'double' || (quotes === 'auto' && doubleQuotes < singleQuotes));
        quote = single ? '\'' : '"';

        if (!(single ? singleQuotes : doubleQuotes)) {
            return quote + result + quote;
        }

        str = result;
        result = quote;

        for (i = 0, len = str.length; i < len; ++i) {
            code = str.charCodeAt(i);
            if ((code === 0x27  /* ' */ && single) || (code === 0x22  /* " */ && !single)) {
                result += '\\';
            }
            result += String.fromCharCode(code);
        }

        return result + quote;
    }

    /**
     * flatten an array to a string, where the array can contain
     * either strings or nested arrays
     */
    function flattenToString(arr) {
        var i, iz, elem, result = '';
        for (i = 0, iz = arr.length; i < iz; ++i) {
            elem = arr[i];
            result += isArray(elem) ? flattenToString(elem) : elem;
        }
        return result;
    }

    /**
     * convert generated to a SourceNode when source maps are enabled.
     */
    function toSourceNodeWhenNeeded(generated, node) {
        if (!sourceMap) {
            // with no source maps, generated is either an
            // array or a string.  if an array, flatten it.
            // if a string, just return it
            if (isArray(generated)) {
                return flattenToString(generated);
            } else {
                return generated;
            }
        }
        if (node == null) {
            if (generated instanceof SourceNode) {
                return generated;
            } else {
                node = {};
            }
        }
        if (node.loc == null) {
            return new SourceNode(null, null, sourceMap, generated, node.name || null);
        }
        return new SourceNode(node.loc.start.line, node.loc.start.column, (sourceMap === true ? node.loc.source || null : sourceMap), generated, node.name || null);
    }

    function noEmptySpace() {
        return (space) ? space : ' ';
    }

    function join(left, right) {
        var leftSource,
            rightSource,
            leftCharCode,
            rightCharCode;

        leftSource = toSourceNodeWhenNeeded(left).toString();
        if (leftSource.length === 0) {
            return [right];
        }

        rightSource = toSourceNodeWhenNeeded(right).toString();
        if (rightSource.length === 0) {
            return [left];
        }

        leftCharCode = leftSource.charCodeAt(leftSource.length - 1);
        rightCharCode = rightSource.charCodeAt(0);

        if ((leftCharCode === 0x2B  /* + */ || leftCharCode === 0x2D  /* - */) && leftCharCode === rightCharCode ||
            esutils.code.isIdentifierPartES5(leftCharCode) && esutils.code.isIdentifierPartES5(rightCharCode) ||
            leftCharCode === 0x2F  /* / */ && rightCharCode === 0x69  /* i */) { // infix word operators all start with `i`
            return [left, noEmptySpace(), right];
        } else if (esutils.code.isWhiteSpace(leftCharCode) || esutils.code.isLineTerminator(leftCharCode) ||
                esutils.code.isWhiteSpace(rightCharCode) || esutils.code.isLineTerminator(rightCharCode)) {
            return [left, right];
        }
        return [left, space, right];
    }

    function addIndent(stmt) {
        return [base, stmt];
    }

    function withIndent(fn) {
        var previousBase;
        previousBase = base;
        base += indent;
        fn(base);
        base = previousBase;
    }

    function calculateSpaces(str) {
        var i;
        for (i = str.length - 1; i >= 0; --i) {
            if (esutils.code.isLineTerminator(str.charCodeAt(i))) {
                break;
            }
        }
        return (str.length - 1) - i;
    }

    function adjustMultilineComment(value, specialBase) {
        var array, i, len, line, j, spaces, previousBase, sn;

        array = value.split(/\r\n|[\r\n]/);
        spaces = Number.MAX_VALUE;

        // first line doesn't have indentation
        for (i = 1, len = array.length; i < len; ++i) {
            line = array[i];
            j = 0;
            while (j < line.length && esutils.code.isWhiteSpace(line.charCodeAt(j))) {
                ++j;
            }
            if (spaces > j) {
                spaces = j;
            }
        }

        if (typeof specialBase !== 'undefined') {
            // pattern like
            // {
            //   var t = 20;  /*
            //                 * this is comment
            //                 */
            // }
            previousBase = base;
            if (array[1][spaces] === '*') {
                specialBase += ' ';
            }
            base = specialBase;
        } else {
            if (spaces & 1) {
                // /*
                //  *
                //  */
                // If spaces are odd number, above pattern is considered.
                // We waste 1 space.
                --spaces;
            }
            previousBase = base;
        }

        for (i = 1, len = array.length; i < len; ++i) {
            sn = toSourceNodeWhenNeeded(addIndent(array[i].slice(spaces)));
            array[i] = sourceMap ? sn.join('') : sn;
        }

        base = previousBase;

        return array.join('\n');
    }

    function generateComment(comment, specialBase) {
        if (comment.type === 'Line') {
            if (endsWithLineTerminator(comment.value)) {
                return '//' + comment.value;
            } else {
                // Always use LineTerminator
                var result = '//' + comment.value;
                if (!preserveBlankLines) {
                    result += '\n';
                }
                return result;
            }
        }
        if (extra.format.indent.adjustMultilineComment && /[\n\r]/.test(comment.value)) {
            return adjustMultilineComment('/*' + comment.value + '*/', specialBase);
        }
        return '/*' + comment.value + '*/';
    }

    function addComments(stmt, result) {
        var i, len, comment, save, tailingToStatement, specialBase, fragment,
            extRange, range, prevRange, prefix, infix, suffix, count;

        if (stmt.leadingComments && stmt.leadingComments.length > 0) {
            save = result;

            if (preserveBlankLines) {
                comment = stmt.leadingComments[0];
                result = [];

                extRange = comment.extendedRange;
                range = comment.range;

                prefix = sourceCode.substring(extRange[0], range[0]);
                count = (prefix.match(/\n/g) || []).length;
                if (count > 0) {
                    result.push(stringRepeat('\n', count));
                    result.push(addIndent(generateComment(comment)));
                } else {
                    result.push(prefix);
                    result.push(generateComment(comment));
                }

                prevRange = range;

                for (i = 1, len = stmt.leadingComments.length; i < len; i++) {
                    comment = stmt.leadingComments[i];
                    range = comment.range;

                    infix = sourceCode.substring(prevRange[1], range[0]);
                    count = (infix.match(/\n/g) || []).length;
                    result.push(stringRepeat('\n', count));
                    result.push(addIndent(generateComment(comment)));

                    prevRange = range;
                }

                suffix = sourceCode.substring(range[1], extRange[1]);
                count = (suffix.match(/\n/g) || []).length;
                result.push(stringRepeat('\n', count));
            } else {
                comment = stmt.leadingComments[0];
                result = [];
                if (safeConcatenation && stmt.type === Syntax.Program && stmt.body.length === 0) {
                    result.push('\n');
                }
                result.push(generateComment(comment));
                if (!endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString())) {
                    result.push('\n');
                }

                for (i = 1, len = stmt.leadingComments.length; i < len; ++i) {
                    comment = stmt.leadingComments[i];
                    fragment = [generateComment(comment)];
                    if (!endsWithLineTerminator(toSourceNodeWhenNeeded(fragment).toString())) {
                        fragment.push('\n');
                    }
                    result.push(addIndent(fragment));
                }
            }

            result.push(addIndent(save));
        }

        if (stmt.trailingComments) {

            if (preserveBlankLines) {
                comment = stmt.trailingComments[0];
                extRange = comment.extendedRange;
                range = comment.range;

                prefix = sourceCode.substring(extRange[0], range[0]);
                count = (prefix.match(/\n/g) || []).length;

                if (count > 0) {
                    result.push(stringRepeat('\n', count));
                    result.push(addIndent(generateComment(comment)));
                } else {
                    result.push(prefix);
                    result.push(generateComment(comment));
                }
            } else {
                tailingToStatement = !endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString());
                specialBase = stringRepeat(' ', calculateSpaces(toSourceNodeWhenNeeded([base, result, indent]).toString()));
                for (i = 0, len = stmt.trailingComments.length; i < len; ++i) {
                    comment = stmt.trailingComments[i];
                    if (tailingToStatement) {
                        // We assume target like following script
                        //
                        // var t = 20;  /**
                        //               * This is comment of t
                        //               */
                        if (i === 0) {
                            // first case
                            result = [result, indent];
                        } else {
                            result = [result, specialBase];
                        }
                        result.push(generateComment(comment, specialBase));
                    } else {
                        result = [result, addIndent(generateComment(comment))];
                    }
                    if (i !== len - 1 && !endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString())) {
                        result = [result, '\n'];
                    }
                }
            }
        }

        return result;
    }

    function generateBlankLines(start, end, result) {
        var j, newlineCount = 0;

        for (j = start; j < end; j++) {
            if (sourceCode[j] === '\n') {
                newlineCount++;
            }
        }

        for (j = 1; j < newlineCount; j++) {
            result.push(newline);
        }
    }

    function parenthesize(text, current, should) {
        if (current < should) {
            return ['(', text, ')'];
        }
        return text;
    }

    function generateVerbatimString(string) {
        var i, iz, result;
        result = string.split(/\r\n|\n/);
        for (i = 1, iz = result.length; i < iz; i++) {
            result[i] = newline + base + result[i];
        }
        return result;
    }

    function generateVerbatim(expr, precedence) {
        var verbatim, result, prec;
        verbatim = expr[extra.verbatim];

        if (typeof verbatim === 'string') {
            result = parenthesize(generateVerbatimString(verbatim), Precedence.Sequence, precedence);
        } else {
            // verbatim is object
            result = generateVerbatimString(verbatim.content);
            prec = (verbatim.precedence != null) ? verbatim.precedence : Precedence.Sequence;
            result = parenthesize(result, prec, precedence);
        }

        return toSourceNodeWhenNeeded(result, expr);
    }

    function CodeGenerator() {
    }

    // Helpers.

    CodeGenerator.prototype.maybeBlock = function(stmt, flags) {
        var result, noLeadingComment, that = this;

        noLeadingComment = !extra.comment || !stmt.leadingComments;

        if (stmt.type === Syntax.BlockStatement && noLeadingComment) {
            return [space, this.generateStatement(stmt, flags)];
        }

        if (stmt.type === Syntax.EmptyStatement && noLeadingComment) {
            return ';';
        }

        withIndent(function () {
            result = [
                newline,
                addIndent(that.generateStatement(stmt, flags))
            ];
        });

        return result;
    };

    CodeGenerator.prototype.maybeBlockSuffix = function (stmt, result) {
        var ends = endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString());
        if (stmt.type === Syntax.BlockStatement && (!extra.comment || !stmt.leadingComments) && !ends) {
            return [result, space];
        }
        if (ends) {
            return [result, base];
        }
        return [result, newline, base];
    };

    function generateIdentifier(node) {
        return toSourceNodeWhenNeeded(node.name, node);
    }

    function generateAsyncPrefix(node, spaceRequired) {
        return node.async ? 'async' + (spaceRequired ? noEmptySpace() : space) : '';
    }

    function generateStarSuffix(node) {
        var isGenerator = node.generator && !extra.moz.starlessGenerator;
        return isGenerator ? '*' + space : '';
    }

    function generateMethodPrefix(prop) {
        var func = prop.value;
        if (func.async) {
            return generateAsyncPrefix(func, !prop.computed);
        } else {
            // avoid space before method name
            return generateStarSuffix(func) ? '*' : '';
        }
    }

    CodeGenerator.prototype.generatePattern = function (node, precedence, flags) {
        if (node.type === Syntax.Identifier) {
            return generateIdentifier(node);
        }
        return this.generateExpression(node, precedence, flags);
    };

    CodeGenerator.prototype.generateFunctionParams = function (node) {
        var i, iz, result, hasDefault;

        hasDefault = false;

        if (node.type === Syntax.ArrowFunctionExpression &&
                !node.rest && (!node.defaults || node.defaults.length === 0) &&
                node.params.length === 1 && node.params[0].type === Syntax.Identifier) {
            // arg => { } case
            result = [generateAsyncPrefix(node, true), generateIdentifier(node.params[0])];
        } else {
            result = node.type === Syntax.ArrowFunctionExpression ? [generateAsyncPrefix(node, false)] : [];
            result.push('(');
            if (node.defaults) {
                hasDefault = true;
            }
            for (i = 0, iz = node.params.length; i < iz; ++i) {
                if (hasDefault && node.defaults[i]) {
                    // Handle default values.
                    result.push(this.generateAssignment(node.params[i], node.defaults[i], '=', Precedence.Assignment, E_TTT));
                } else {
                    result.push(this.generatePattern(node.params[i], Precedence.Assignment, E_TTT));
                }
                if (i + 1 < iz) {
                    result.push(',' + space);
                }
            }

            if (node.rest) {
                if (node.params.length) {
                    result.push(',' + space);
                }
                result.push('...');
                result.push(generateIdentifier(node.rest));
            }

            result.push(')');
        }

        return result;
    };

    CodeGenerator.prototype.generateFunctionBody = function (node) {
        var result, expr;

        result = this.generateFunctionParams(node);

        if (node.type === Syntax.ArrowFunctionExpression) {
            result.push(space);
            result.push('=>');
        }

        if (node.expression) {
            result.push(space);
            expr = this.generateExpression(node.body, Precedence.Assignment, E_TTT);
            if (expr.toString().charAt(0) === '{') {
                expr = ['(', expr, ')'];
            }
            result.push(expr);
        } else {
            result.push(this.maybeBlock(node.body, S_TTFF));
        }

        return result;
    };

    CodeGenerator.prototype.generateIterationForStatement = function (operator, stmt, flags) {
        var result = ['for' + space + '('], that = this;
        withIndent(function () {
            if (stmt.left.type === Syntax.VariableDeclaration) {
                withIndent(function () {
                    result.push(stmt.left.kind + noEmptySpace());
                    result.push(that.generateStatement(stmt.left.declarations[0], S_FFFF));
                });
            } else {
                result.push(that.generateExpression(stmt.left, Precedence.Call, E_TTT));
            }

            result = join(result, operator);
            result = [join(
                result,
                that.generateExpression(stmt.right, Precedence.Sequence, E_TTT)
            ), ')'];
        });
        result.push(this.maybeBlock(stmt.body, flags));
        return result;
    };

    CodeGenerator.prototype.generatePropertyKey = function (expr, computed, value) {
        var result = [];

        if (computed) {
            result.push('[');
        }

        if (value.type === 'AssignmentPattern') {
            result.push(this.AssignmentPattern(value, Precedence.Sequence, E_TTT));
        } else {
            result.push(this.generateExpression(expr, Precedence.Sequence, E_TTT));
        }

        if (computed) {
            result.push(']');
        }

        return result;
    };

    CodeGenerator.prototype.generateAssignment = function (left, right, operator, precedence, flags) {
        if (Precedence.Assignment < precedence) {
            flags |= F_ALLOW_IN;
        }

        return parenthesize(
            [
                this.generateExpression(left, Precedence.Call, flags),
                space + operator + space,
                this.generateExpression(right, Precedence.Assignment, flags)
            ],
            Precedence.Assignment,
            precedence
        );
    };

    CodeGenerator.prototype.semicolon = function (flags) {
        if (!semicolons && flags & F_SEMICOLON_OPT) {
            return '';
        }
        return ';';
    };

    // Statements.

    CodeGenerator.Statement = {

        BlockStatement: function (stmt, flags) {
            var range, content, result = ['{', newline], that = this;

            withIndent(function () {
                // handle functions without any code
                if (stmt.body.length === 0 && preserveBlankLines) {
                    range = stmt.range;
                    if (range[1] - range[0] > 2) {
                        content = sourceCode.substring(range[0] + 1, range[1] - 1);
                        if (content[0] === '\n') {
                            result = ['{'];
                        }
                        result.push(content);
                    }
                }

                var i, iz, fragment, bodyFlags;
                bodyFlags = S_TFFF;
                if (flags & F_FUNC_BODY) {
                    bodyFlags |= F_DIRECTIVE_CTX;
                }

                for (i = 0, iz = stmt.body.length; i < iz; ++i) {
                    if (preserveBlankLines) {
                        // handle spaces before the first line
                        if (i === 0) {
                            if (stmt.body[0].leadingComments) {
                                range = stmt.body[0].leadingComments[0].extendedRange;
                                content = sourceCode.substring(range[0], range[1]);
                                if (content[0] === '\n') {
                                    result = ['{'];
                                }
                            }
                            if (!stmt.body[0].leadingComments) {
                                generateBlankLines(stmt.range[0], stmt.body[0].range[0], result);
                            }
                        }

                        // handle spaces between lines
                        if (i > 0) {
                            if (!stmt.body[i - 1].trailingComments  && !stmt.body[i].leadingComments) {
                                generateBlankLines(stmt.body[i - 1].range[1], stmt.body[i].range[0], result);
                            }
                        }
                    }

                    if (i === iz - 1) {
                        bodyFlags |= F_SEMICOLON_OPT;
                    }

                    if (stmt.body[i].leadingComments && preserveBlankLines) {
                        fragment = that.generateStatement(stmt.body[i], bodyFlags);
                    } else {
                        fragment = addIndent(that.generateStatement(stmt.body[i], bodyFlags));
                    }

                    result.push(fragment);
                    if (!endsWithLineTerminator(toSourceNodeWhenNeeded(fragment).toString())) {
                        if (preserveBlankLines && i < iz - 1) {
                            // don't add a new line if there are leading coments
                            // in the next statement
                            if (!stmt.body[i + 1].leadingComments) {
                                result.push(newline);
                            }
                        } else {
                            result.push(newline);
                        }
                    }

                    if (preserveBlankLines) {
                        // handle spaces after the last line
                        if (i === iz - 1) {
                            if (!stmt.body[i].trailingComments) {
                                generateBlankLines(stmt.body[i].range[1], stmt.range[1], result);
                            }
                        }
                    }
                }
            });

            result.push(addIndent('}'));
            return result;
        },

        BreakStatement: function (stmt, flags) {
            if (stmt.label) {
                return 'break ' + stmt.label.name + this.semicolon(flags);
            }
            return 'break' + this.semicolon(flags);
        },

        ContinueStatement: function (stmt, flags) {
            if (stmt.label) {
                return 'continue ' + stmt.label.name + this.semicolon(flags);
            }
            return 'continue' + this.semicolon(flags);
        },

        ClassBody: function (stmt, flags) {
            var result = [ '{', newline], that = this;

            withIndent(function (indent) {
                var i, iz;

                for (i = 0, iz = stmt.body.length; i < iz; ++i) {
                    result.push(indent);
                    result.push(that.generateExpression(stmt.body[i], Precedence.Sequence, E_TTT));
                    if (i + 1 < iz) {
                        result.push(newline);
                    }
                }
            });

            if (!endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString())) {
                result.push(newline);
            }
            result.push(base);
            result.push('}');
            return result;
        },

        ClassDeclaration: function (stmt, flags) {
            var result, fragment;
            result  = ['class'];
            if (stmt.id) {
                result = join(result, this.generateExpression(stmt.id, Precedence.Sequence, E_TTT));
            }
            if (stmt.superClass) {
                fragment = join('extends', this.generateExpression(stmt.superClass, Precedence.Assignment, E_TTT));
                result = join(result, fragment);
            }
            result.push(space);
            result.push(this.generateStatement(stmt.body, S_TFFT));
            return result;
        },

        DirectiveStatement: function (stmt, flags) {
            if (extra.raw && stmt.raw) {
                return stmt.raw + this.semicolon(flags);
            }
            return escapeDirective(stmt.directive) + this.semicolon(flags);
        },

        DoWhileStatement: function (stmt, flags) {
            // Because `do 42 while (cond)` is Syntax Error. We need semicolon.
            var result = join('do', this.maybeBlock(stmt.body, S_TFFF));
            result = this.maybeBlockSuffix(stmt.body, result);
            return join(result, [
                'while' + space + '(',
                this.generateExpression(stmt.test, Precedence.Sequence, E_TTT),
                ')' + this.semicolon(flags)
            ]);
        },

        CatchClause: function (stmt, flags) {
            var result, that = this;
            withIndent(function () {
                var guard;

                result = [
                    'catch' + space + '(',
                    that.generateExpression(stmt.param, Precedence.Sequence, E_TTT),
                    ')'
                ];

                if (stmt.guard) {
                    guard = that.generateExpression(stmt.guard, Precedence.Sequence, E_TTT);
                    result.splice(2, 0, ' if ', guard);
                }
            });
            result.push(this.maybeBlock(stmt.body, S_TFFF));
            return result;
        },

        DebuggerStatement: function (stmt, flags) {
            return 'debugger' + this.semicolon(flags);
        },

        EmptyStatement: function (stmt, flags) {
            return ';';
        },

        ExportDefaultDeclaration: function (stmt, flags) {
            var result = [ 'export' ], bodyFlags;

            bodyFlags = (flags & F_SEMICOLON_OPT) ? S_TFFT : S_TFFF;

            // export default HoistableDeclaration[Default]
            // export default AssignmentExpression[In] ;
            result = join(result, 'default');
            if (isStatement(stmt.declaration)) {
                result = join(result, this.generateStatement(stmt.declaration, bodyFlags));
            } else {
                result = join(result, this.generateExpression(stmt.declaration, Precedence.Assignment, E_TTT) + this.semicolon(flags));
            }
            return result;
        },

        ExportNamedDeclaration: function (stmt, flags) {
            var result = [ 'export' ], bodyFlags, that = this;

            bodyFlags = (flags & F_SEMICOLON_OPT) ? S_TFFT : S_TFFF;

            // export VariableStatement
            // export Declaration[Default]
            if (stmt.declaration) {
                return join(result, this.generateStatement(stmt.declaration, bodyFlags));
            }

            // export ExportClause[NoReference] FromClause ;
            // export ExportClause ;
            if (stmt.specifiers) {
                if (stmt.specifiers.length === 0) {
                    result = join(result, '{' + space + '}');
                } else if (stmt.specifiers[0].type === Syntax.ExportBatchSpecifier) {
                    result = join(result, this.generateExpression(stmt.specifiers[0], Precedence.Sequence, E_TTT));
                } else {
                    result = join(result, '{');
                    withIndent(function (indent) {
                        var i, iz;
                        result.push(newline);
                        for (i = 0, iz = stmt.specifiers.length; i < iz; ++i) {
                            result.push(indent);
                            result.push(that.generateExpression(stmt.specifiers[i], Precedence.Sequence, E_TTT));
                            if (i + 1 < iz) {
                                result.push(',' + newline);
                            }
                        }
                    });
                    if (!endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString())) {
                        result.push(newline);
                    }
                    result.push(base + '}');
                }

                if (stmt.source) {
                    result = join(result, [
                        'from' + space,
                        // ModuleSpecifier
                        this.generateExpression(stmt.source, Precedence.Sequence, E_TTT),
                        this.semicolon(flags)
                    ]);
                } else {
                    result.push(this.semicolon(flags));
                }
            }
            return result;
        },

        ExportAllDeclaration: function (stmt, flags) {
            // export * FromClause ;
            return [
                'export' + space,
                '*' + space,
                'from' + space,
                // ModuleSpecifier
                this.generateExpression(stmt.source, Precedence.Sequence, E_TTT),
                this.semicolon(flags)
            ];
        },

        ExpressionStatement: function (stmt, flags) {
            var result, fragment;

            function isClassPrefixed(fragment) {
                var code;
                if (fragment.slice(0, 5) !== 'class') {
                    return false;
                }
                code = fragment.charCodeAt(5);
                return code === 0x7B  /* '{' */ || esutils.code.isWhiteSpace(code) || esutils.code.isLineTerminator(code);
            }

            function isFunctionPrefixed(fragment) {
                var code;
                if (fragment.slice(0, 8) !== 'function') {
                    return false;
                }
                code = fragment.charCodeAt(8);
                return code === 0x28 /* '(' */ || esutils.code.isWhiteSpace(code) || code === 0x2A  /* '*' */ || esutils.code.isLineTerminator(code);
            }

            function isAsyncPrefixed(fragment) {
                var code, i, iz;
                if (fragment.slice(0, 5) !== 'async') {
                    return false;
                }
                if (!esutils.code.isWhiteSpace(fragment.charCodeAt(5))) {
                    return false;
                }
                for (i = 6, iz = fragment.length; i < iz; ++i) {
                    if (!esutils.code.isWhiteSpace(fragment.charCodeAt(i))) {
                        break;
                    }
                }
                if (i === iz) {
                    return false;
                }
                if (fragment.slice(i, i + 8) !== 'function') {
                    return false;
                }
                code = fragment.charCodeAt(i + 8);
                return code === 0x28 /* '(' */ || esutils.code.isWhiteSpace(code) || code === 0x2A  /* '*' */ || esutils.code.isLineTerminator(code);
            }

            result = [this.generateExpression(stmt.expression, Precedence.Sequence, E_TTT)];
            // 12.4 '{', 'function', 'class' is not allowed in this position.
            // wrap expression with parentheses
            fragment = toSourceNodeWhenNeeded(result).toString();
            if (fragment.charCodeAt(0) === 0x7B  /* '{' */ ||  // ObjectExpression
                    isClassPrefixed(fragment) ||
                    isFunctionPrefixed(fragment) ||
                    isAsyncPrefixed(fragment) ||
                    (directive && (flags & F_DIRECTIVE_CTX) && stmt.expression.type === Syntax.Literal && typeof stmt.expression.value === 'string')) {
                result = ['(', result, ')' + this.semicolon(flags)];
            } else {
                result.push(this.semicolon(flags));
            }
            return result;
        },

        ImportDeclaration: function (stmt, flags) {
            // ES6: 15.2.1 valid import declarations:
            //     - import ImportClause FromClause ;
            //     - import ModuleSpecifier ;
            var result, cursor, that = this;

            // If no ImportClause is present,
            // this should be `import ModuleSpecifier` so skip `from`
            // ModuleSpecifier is StringLiteral.
            if (stmt.specifiers.length === 0) {
                // import ModuleSpecifier ;
                return [
                    'import',
                    space,
                    // ModuleSpecifier
                    this.generateExpression(stmt.source, Precedence.Sequence, E_TTT),
                    this.semicolon(flags)
                ];
            }

            // import ImportClause FromClause ;
            result = [
                'import'
            ];
            cursor = 0;

            // ImportedBinding
            if (stmt.specifiers[cursor].type === Syntax.ImportDefaultSpecifier) {
                result = join(result, [
                        this.generateExpression(stmt.specifiers[cursor], Precedence.Sequence, E_TTT)
                ]);
                ++cursor;
            }

            if (stmt.specifiers[cursor]) {
                if (cursor !== 0) {
                    result.push(',');
                }

                if (stmt.specifiers[cursor].type === Syntax.ImportNamespaceSpecifier) {
                    // NameSpaceImport
                    result = join(result, [
                            space,
                            this.generateExpression(stmt.specifiers[cursor], Precedence.Sequence, E_TTT)
                    ]);
                } else {
                    // NamedImports
                    result.push(space + '{');

                    if ((stmt.specifiers.length - cursor) === 1) {
                        // import { ... } from "...";
                        result.push(space);
                        result.push(this.generateExpression(stmt.specifiers[cursor], Precedence.Sequence, E_TTT));
                        result.push(space + '}' + space);
                    } else {
                        // import {
                        //    ...,
                        //    ...,
                        // } from "...";
                        withIndent(function (indent) {
                            var i, iz;
                            result.push(newline);
                            for (i = cursor, iz = stmt.specifiers.length; i < iz; ++i) {
                                result.push(indent);
                                result.push(that.generateExpression(stmt.specifiers[i], Precedence.Sequence, E_TTT));
                                if (i + 1 < iz) {
                                    result.push(',' + newline);
                                }
                            }
                        });
                        if (!endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString())) {
                            result.push(newline);
                        }
                        result.push(base + '}' + space);
                    }
                }
            }

            result = join(result, [
                'from' + space,
                // ModuleSpecifier
                this.generateExpression(stmt.source, Precedence.Sequence, E_TTT),
                this.semicolon(flags)
            ]);
            return result;
        },

        VariableDeclarator: function (stmt, flags) {
            var itemFlags = (flags & F_ALLOW_IN) ? E_TTT : E_FTT;
            if (stmt.init) {
                return [
                    this.generateExpression(stmt.id, Precedence.Assignment, itemFlags),
                    space,
                    '=',
                    space,
                    this.generateExpression(stmt.init, Precedence.Assignment, itemFlags)
                ];
            }
            return this.generatePattern(stmt.id, Precedence.Assignment, itemFlags);
        },

        VariableDeclaration: function (stmt, flags) {
            // VariableDeclarator is typed as Statement,
            // but joined with comma (not LineTerminator).
            // So if comment is attached to target node, we should specialize.
            var result, i, iz, node, bodyFlags, that = this;

            result = [ stmt.kind ];

            bodyFlags = (flags & F_ALLOW_IN) ? S_TFFF : S_FFFF;

            function block() {
                node = stmt.declarations[0];
                if (extra.comment && node.leadingComments) {
                    result.push('\n');
                    result.push(addIndent(that.generateStatement(node, bodyFlags)));
                } else {
                    result.push(noEmptySpace());
                    result.push(that.generateStatement(node, bodyFlags));
                }

                for (i = 1, iz = stmt.declarations.length; i < iz; ++i) {
                    node = stmt.declarations[i];
                    if (extra.comment && node.leadingComments) {
                        result.push(',' + newline);
                        result.push(addIndent(that.generateStatement(node, bodyFlags)));
                    } else {
                        result.push(',' + space);
                        result.push(that.generateStatement(node, bodyFlags));
                    }
                }
            }

            if (stmt.declarations.length > 1) {
                withIndent(block);
            } else {
                block();
            }

            result.push(this.semicolon(flags));

            return result;
        },

        ThrowStatement: function (stmt, flags) {
            return [join(
                'throw',
                this.generateExpression(stmt.argument, Precedence.Sequence, E_TTT)
            ), this.semicolon(flags)];
        },

        TryStatement: function (stmt, flags) {
            var result, i, iz, guardedHandlers;

            result = ['try', this.maybeBlock(stmt.block, S_TFFF)];
            result = this.maybeBlockSuffix(stmt.block, result);

            if (stmt.handlers) {
                // old interface
                for (i = 0, iz = stmt.handlers.length; i < iz; ++i) {
                    result = join(result, this.generateStatement(stmt.handlers[i], S_TFFF));
                    if (stmt.finalizer || i + 1 !== iz) {
                        result = this.maybeBlockSuffix(stmt.handlers[i].body, result);
                    }
                }
            } else {
                guardedHandlers = stmt.guardedHandlers || [];

                for (i = 0, iz = guardedHandlers.length; i < iz; ++i) {
                    result = join(result, this.generateStatement(guardedHandlers[i], S_TFFF));
                    if (stmt.finalizer || i + 1 !== iz) {
                        result = this.maybeBlockSuffix(guardedHandlers[i].body, result);
                    }
                }

                // new interface
                if (stmt.handler) {
                    if (isArray(stmt.handler)) {
                        for (i = 0, iz = stmt.handler.length; i < iz; ++i) {
                            result = join(result, this.generateStatement(stmt.handler[i], S_TFFF));
                            if (stmt.finalizer || i + 1 !== iz) {
                                result = this.maybeBlockSuffix(stmt.handler[i].body, result);
                            }
                        }
                    } else {
                        result = join(result, this.generateStatement(stmt.handler, S_TFFF));
                        if (stmt.finalizer) {
                            result = this.maybeBlockSuffix(stmt.handler.body, result);
                        }
                    }
                }
            }
            if (stmt.finalizer) {
                result = join(result, ['finally', this.maybeBlock(stmt.finalizer, S_TFFF)]);
            }
            return result;
        },

        SwitchStatement: function (stmt, flags) {
            var result, fragment, i, iz, bodyFlags, that = this;
            withIndent(function () {
                result = [
                    'switch' + space + '(',
                    that.generateExpression(stmt.discriminant, Precedence.Sequence, E_TTT),
                    ')' + space + '{' + newline
                ];
            });
            if (stmt.cases) {
                bodyFlags = S_TFFF;
                for (i = 0, iz = stmt.cases.length; i < iz; ++i) {
                    if (i === iz - 1) {
                        bodyFlags |= F_SEMICOLON_OPT;
                    }
                    fragment = addIndent(this.generateStatement(stmt.cases[i], bodyFlags));
                    result.push(fragment);
                    if (!endsWithLineTerminator(toSourceNodeWhenNeeded(fragment).toString())) {
                        result.push(newline);
                    }
                }
            }
            result.push(addIndent('}'));
            return result;
        },

        SwitchCase: function (stmt, flags) {
            var result, fragment, i, iz, bodyFlags, that = this;
            withIndent(function () {
                if (stmt.test) {
                    result = [
                        join('case', that.generateExpression(stmt.test, Precedence.Sequence, E_TTT)),
                        ':'
                    ];
                } else {
                    result = ['default:'];
                }

                i = 0;
                iz = stmt.consequent.length;
                if (iz && stmt.consequent[0].type === Syntax.BlockStatement) {
                    fragment = that.maybeBlock(stmt.consequent[0], S_TFFF);
                    result.push(fragment);
                    i = 1;
                }

                if (i !== iz && !endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString())) {
                    result.push(newline);
                }

                bodyFlags = S_TFFF;
                for (; i < iz; ++i) {
                    if (i === iz - 1 && flags & F_SEMICOLON_OPT) {
                        bodyFlags |= F_SEMICOLON_OPT;
                    }
                    fragment = addIndent(that.generateStatement(stmt.consequent[i], bodyFlags));
                    result.push(fragment);
                    if (i + 1 !== iz && !endsWithLineTerminator(toSourceNodeWhenNeeded(fragment).toString())) {
                        result.push(newline);
                    }
                }
            });
            return result;
        },

        IfStatement: function (stmt, flags) {
            var result, bodyFlags, semicolonOptional, that = this;
            withIndent(function () {
                result = [
                    'if' + space + '(',
                    that.generateExpression(stmt.test, Precedence.Sequence, E_TTT),
                    ')'
                ];
            });
            semicolonOptional = flags & F_SEMICOLON_OPT;
            bodyFlags = S_TFFF;
            if (semicolonOptional) {
                bodyFlags |= F_SEMICOLON_OPT;
            }
            if (stmt.alternate) {
                result.push(this.maybeBlock(stmt.consequent, S_TFFF));
                result = this.maybeBlockSuffix(stmt.consequent, result);
                if (stmt.alternate.type === Syntax.IfStatement) {
                    result = join(result, ['else ', this.generateStatement(stmt.alternate, bodyFlags)]);
                } else {
                    result = join(result, join('else', this.maybeBlock(stmt.alternate, bodyFlags)));
                }
            } else {
                result.push(this.maybeBlock(stmt.consequent, bodyFlags));
            }
            return result;
        },

        ForStatement: function (stmt, flags) {
            var result, that = this;
            withIndent(function () {
                result = ['for' + space + '('];
                if (stmt.init) {
                    if (stmt.init.type === Syntax.VariableDeclaration) {
                        result.push(that.generateStatement(stmt.init, S_FFFF));
                    } else {
                        // F_ALLOW_IN becomes false.
                        result.push(that.generateExpression(stmt.init, Precedence.Sequence, E_FTT));
                        result.push(';');
                    }
                } else {
                    result.push(';');
                }

                if (stmt.test) {
                    result.push(space);
                    result.push(that.generateExpression(stmt.test, Precedence.Sequence, E_TTT));
                    result.push(';');
                } else {
                    result.push(';');
                }

                if (stmt.update) {
                    result.push(space);
                    result.push(that.generateExpression(stmt.update, Precedence.Sequence, E_TTT));
                    result.push(')');
                } else {
                    result.push(')');
                }
            });

            result.push(this.maybeBlock(stmt.body, flags & F_SEMICOLON_OPT ? S_TFFT : S_TFFF));
            return result;
        },

        ForInStatement: function (stmt, flags) {
            return this.generateIterationForStatement('in', stmt, flags & F_SEMICOLON_OPT ? S_TFFT : S_TFFF);
        },

        ForOfStatement: function (stmt, flags) {
            return this.generateIterationForStatement('of', stmt, flags & F_SEMICOLON_OPT ? S_TFFT : S_TFFF);
        },

        LabeledStatement: function (stmt, flags) {
            return [stmt.label.name + ':', this.maybeBlock(stmt.body, flags & F_SEMICOLON_OPT ? S_TFFT : S_TFFF)];
        },

        Program: function (stmt, flags) {
            var result, fragment, i, iz, bodyFlags;
            iz = stmt.body.length;
            result = [safeConcatenation && iz > 0 ? '\n' : ''];
            bodyFlags = S_TFTF;
            for (i = 0; i < iz; ++i) {
                if (!safeConcatenation && i === iz - 1) {
                    bodyFlags |= F_SEMICOLON_OPT;
                }

                if (preserveBlankLines) {
                    // handle spaces before the first line
                    if (i === 0) {
                        if (!stmt.body[0].leadingComments) {
                            generateBlankLines(stmt.range[0], stmt.body[i].range[0], result);
                        }
                    }

                    // handle spaces between lines
                    if (i > 0) {
                        if (!stmt.body[i - 1].trailingComments && !stmt.body[i].leadingComments) {
                            generateBlankLines(stmt.body[i - 1].range[1], stmt.body[i].range[0], result);
                        }
                    }
                }

                fragment = addIndent(this.generateStatement(stmt.body[i], bodyFlags));
                result.push(fragment);
                if (i + 1 < iz && !endsWithLineTerminator(toSourceNodeWhenNeeded(fragment).toString())) {
                    if (preserveBlankLines) {
                        if (!stmt.body[i + 1].leadingComments) {
                            result.push(newline);
                        }
                    } else {
                        result.push(newline);
                    }
                }

                if (preserveBlankLines) {
                    // handle spaces after the last line
                    if (i === iz - 1) {
                        if (!stmt.body[i].trailingComments) {
                            generateBlankLines(stmt.body[i].range[1], stmt.range[1], result);
                        }
                    }
                }
            }
            return result;
        },

        FunctionDeclaration: function (stmt, flags) {
            return [
                generateAsyncPrefix(stmt, true),
                'function',
                generateStarSuffix(stmt) || noEmptySpace(),
                stmt.id ? generateIdentifier(stmt.id) : '',
                this.generateFunctionBody(stmt)
            ];
        },

        ReturnStatement: function (stmt, flags) {
            if (stmt.argument) {
                return [join(
                    'return',
                    this.generateExpression(stmt.argument, Precedence.Sequence, E_TTT)
                ), this.semicolon(flags)];
            }
            return ['return' + this.semicolon(flags)];
        },

        WhileStatement: function (stmt, flags) {
            var result, that = this;
            withIndent(function () {
                result = [
                    'while' + space + '(',
                    that.generateExpression(stmt.test, Precedence.Sequence, E_TTT),
                    ')'
                ];
            });
            result.push(this.maybeBlock(stmt.body, flags & F_SEMICOLON_OPT ? S_TFFT : S_TFFF));
            return result;
        },

        WithStatement: function (stmt, flags) {
            var result, that = this;
            withIndent(function () {
                result = [
                    'with' + space + '(',
                    that.generateExpression(stmt.object, Precedence.Sequence, E_TTT),
                    ')'
                ];
            });
            result.push(this.maybeBlock(stmt.body, flags & F_SEMICOLON_OPT ? S_TFFT : S_TFFF));
            return result;
        }

    };

    merge(CodeGenerator.prototype, CodeGenerator.Statement);

    // Expressions.

    CodeGenerator.Expression = {

        SequenceExpression: function (expr, precedence, flags) {
            var result, i, iz;
            if (Precedence.Sequence < precedence) {
                flags |= F_ALLOW_IN;
            }
            result = [];
            for (i = 0, iz = expr.expressions.length; i < iz; ++i) {
                result.push(this.generateExpression(expr.expressions[i], Precedence.Assignment, flags));
                if (i + 1 < iz) {
                    result.push(',' + space);
                }
            }
            return parenthesize(result, Precedence.Sequence, precedence);
        },

        AssignmentExpression: function (expr, precedence, flags) {
            return this.generateAssignment(expr.left, expr.right, expr.operator, precedence, flags);
        },

        ArrowFunctionExpression: function (expr, precedence, flags) {
            return parenthesize(this.generateFunctionBody(expr), Precedence.ArrowFunction, precedence);
        },

        ConditionalExpression: function (expr, precedence, flags) {
            if (Precedence.Conditional < precedence) {
                flags |= F_ALLOW_IN;
            }
            return parenthesize(
                [
                    this.generateExpression(expr.test, Precedence.LogicalOR, flags),
                    space + '?' + space,
                    this.generateExpression(expr.consequent, Precedence.Assignment, flags),
                    space + ':' + space,
                    this.generateExpression(expr.alternate, Precedence.Assignment, flags)
                ],
                Precedence.Conditional,
                precedence
            );
        },

        LogicalExpression: function (expr, precedence, flags) {
            return this.BinaryExpression(expr, precedence, flags);
        },

        BinaryExpression: function (expr, precedence, flags) {
            var result, currentPrecedence, fragment, leftSource;
            currentPrecedence = BinaryPrecedence[expr.operator];

            if (currentPrecedence < precedence) {
                flags |= F_ALLOW_IN;
            }

            fragment = this.generateExpression(expr.left, currentPrecedence, flags);

            leftSource = fragment.toString();

            if (leftSource.charCodeAt(leftSource.length - 1) === 0x2F /* / */ && esutils.code.isIdentifierPartES5(expr.operator.charCodeAt(0))) {
                result = [fragment, noEmptySpace(), expr.operator];
            } else {
                result = join(fragment, expr.operator);
            }

            fragment = this.generateExpression(expr.right, currentPrecedence + 1, flags);

            if (expr.operator === '/' && fragment.toString().charAt(0) === '/' ||
            expr.operator.slice(-1) === '<' && fragment.toString().slice(0, 3) === '!--') {
                // If '/' concats with '/' or `<` concats with `!--`, it is interpreted as comment start
                result.push(noEmptySpace());
                result.push(fragment);
            } else {
                result = join(result, fragment);
            }

            if (expr.operator === 'in' && !(flags & F_ALLOW_IN)) {
                return ['(', result, ')'];
            }
            return parenthesize(result, currentPrecedence, precedence);
        },

        CallExpression: function (expr, precedence, flags) {
            var result, i, iz;
            // F_ALLOW_UNPARATH_NEW becomes false.
            result = [this.generateExpression(expr.callee, Precedence.Call, E_TTF)];
            result.push('(');
            for (i = 0, iz = expr['arguments'].length; i < iz; ++i) {
                result.push(this.generateExpression(expr['arguments'][i], Precedence.Assignment, E_TTT));
                if (i + 1 < iz) {
                    result.push(',' + space);
                }
            }
            result.push(')');

            if (!(flags & F_ALLOW_CALL)) {
                return ['(', result, ')'];
            }
            return parenthesize(result, Precedence.Call, precedence);
        },

        NewExpression: function (expr, precedence, flags) {
            var result, length, i, iz, itemFlags;
            length = expr['arguments'].length;

            // F_ALLOW_CALL becomes false.
            // F_ALLOW_UNPARATH_NEW may become false.
            itemFlags = (flags & F_ALLOW_UNPARATH_NEW && !parentheses && length === 0) ? E_TFT : E_TFF;

            result = join(
                'new',
                this.generateExpression(expr.callee, Precedence.New, itemFlags)
            );

            if (!(flags & F_ALLOW_UNPARATH_NEW) || parentheses || length > 0) {
                result.push('(');
                for (i = 0, iz = length; i < iz; ++i) {
                    result.push(this.generateExpression(expr['arguments'][i], Precedence.Assignment, E_TTT));
                    if (i + 1 < iz) {
                        result.push(',' + space);
                    }
                }
                result.push(')');
            }

            return parenthesize(result, Precedence.New, precedence);
        },

        MemberExpression: function (expr, precedence, flags) {
            var result, fragment;

            // F_ALLOW_UNPARATH_NEW becomes false.
            result = [this.generateExpression(expr.object, Precedence.Call, (flags & F_ALLOW_CALL) ? E_TTF : E_TFF)];

            if (expr.computed) {
                result.push('[');
                result.push(this.generateExpression(expr.property, Precedence.Sequence, flags & F_ALLOW_CALL ? E_TTT : E_TFT));
                result.push(']');
            } else {
                if (expr.object.type === Syntax.Literal && typeof expr.object.value === 'number') {
                    fragment = toSourceNodeWhenNeeded(result).toString();
                    // When the following conditions are all true,
                    //   1. No floating point
                    //   2. Don't have exponents
                    //   3. The last character is a decimal digit
                    //   4. Not hexadecimal OR octal number literal
                    // we should add a floating point.
                    if (
                            fragment.indexOf('.') < 0 &&
                            !/[eExX]/.test(fragment) &&
                            esutils.code.isDecimalDigit(fragment.charCodeAt(fragment.length - 1)) &&
                            !(fragment.length >= 2 && fragment.charCodeAt(0) === 48)  // '0'
                            ) {
                        result.push(' ');
                    }
                }
                result.push('.');
                result.push(generateIdentifier(expr.property));
            }

            return parenthesize(result, Precedence.Member, precedence);
        },

        MetaProperty: function (expr, precedence, flags) {
            var result;
            result = [];
            result.push(expr.meta);
            result.push('.');
            result.push(expr.property);
            return parenthesize(result, Precedence.Member, precedence);
        },

        UnaryExpression: function (expr, precedence, flags) {
            var result, fragment, rightCharCode, leftSource, leftCharCode;
            fragment = this.generateExpression(expr.argument, Precedence.Unary, E_TTT);

            if (space === '') {
                result = join(expr.operator, fragment);
            } else {
                result = [expr.operator];
                if (expr.operator.length > 2) {
                    // delete, void, typeof
                    // get `typeof []`, not `typeof[]`
                    result = join(result, fragment);
                } else {
                    // Prevent inserting spaces between operator and argument if it is unnecessary
                    // like, `!cond`
                    leftSource = toSourceNodeWhenNeeded(result).toString();
                    leftCharCode = leftSource.charCodeAt(leftSource.length - 1);
                    rightCharCode = fragment.toString().charCodeAt(0);

                    if (((leftCharCode === 0x2B  /* + */ || leftCharCode === 0x2D  /* - */) && leftCharCode === rightCharCode) ||
                            (esutils.code.isIdentifierPartES5(leftCharCode) && esutils.code.isIdentifierPartES5(rightCharCode))) {
                        result.push(noEmptySpace());
                        result.push(fragment);
                    } else {
                        result.push(fragment);
                    }
                }
            }
            return parenthesize(result, Precedence.Unary, precedence);
        },

        YieldExpression: function (expr, precedence, flags) {
            var result;
            if (expr.delegate) {
                result = 'yield*';
            } else {
                result = 'yield';
            }
            if (expr.argument) {
                result = join(
                    result,
                    this.generateExpression(expr.argument, Precedence.Yield, E_TTT)
                );
            }
            return parenthesize(result, Precedence.Yield, precedence);
        },

        AwaitExpression: function (expr, precedence, flags) {
            var result = join(
                expr.all ? 'await*' : 'await',
                this.generateExpression(expr.argument, Precedence.Await, E_TTT)
            );
            return parenthesize(result, Precedence.Await, precedence);
        },

        UpdateExpression: function (expr, precedence, flags) {
            if (expr.prefix) {
                return parenthesize(
                    [
                        expr.operator,
                        this.generateExpression(expr.argument, Precedence.Unary, E_TTT)
                    ],
                    Precedence.Unary,
                    precedence
                );
            }
            return parenthesize(
                [
                    this.generateExpression(expr.argument, Precedence.Postfix, E_TTT),
                    expr.operator
                ],
                Precedence.Postfix,
                precedence
            );
        },

        FunctionExpression: function (expr, precedence, flags) {
            var result = [
                generateAsyncPrefix(expr, true),
                'function'
            ];
            if (expr.id) {
                result.push(generateStarSuffix(expr) || noEmptySpace());
                result.push(generateIdentifier(expr.id));
            } else {
                result.push(generateStarSuffix(expr) || space);
            }
            result.push(this.generateFunctionBody(expr));
            return result;
        },

        ArrayPattern: function (expr, precedence, flags) {
            return this.ArrayExpression(expr, precedence, flags, true);
        },

        ArrayExpression: function (expr, precedence, flags, isPattern) {
            var result, multiline, that = this;
            if (!expr.elements.length) {
                return '[]';
            }
            multiline = isPattern ? false : expr.elements.length > 1;
            result = ['[', multiline ? newline : ''];
            withIndent(function (indent) {
                var i, iz;
                for (i = 0, iz = expr.elements.length; i < iz; ++i) {
                    if (!expr.elements[i]) {
                        if (multiline) {
                            result.push(indent);
                        }
                        if (i + 1 === iz) {
                            result.push(',');
                        }
                    } else {
                        result.push(multiline ? indent : '');
                        result.push(that.generateExpression(expr.elements[i], Precedence.Assignment, E_TTT));
                    }
                    if (i + 1 < iz) {
                        result.push(',' + (multiline ? newline : space));
                    }
                }
            });
            if (multiline && !endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString())) {
                result.push(newline);
            }
            result.push(multiline ? base : '');
            result.push(']');
            return result;
        },

        RestElement: function(expr, precedence, flags) {
            return '...' + this.generatePattern(expr.argument);
        },

        ClassExpression: function (expr, precedence, flags) {
            var result, fragment;
            result = ['class'];
            if (expr.id) {
                result = join(result, this.generateExpression(expr.id, Precedence.Sequence, E_TTT));
            }
            if (expr.superClass) {
                fragment = join('extends', this.generateExpression(expr.superClass, Precedence.Assignment, E_TTT));
                result = join(result, fragment);
            }
            result.push(space);
            result.push(this.generateStatement(expr.body, S_TFFT));
            return result;
        },

        MethodDefinition: function (expr, precedence, flags) {
            var result, fragment;
            if (expr['static']) {
                result = ['static' + space];
            } else {
                result = [];
            }
            if (expr.kind === 'get' || expr.kind === 'set') {
                fragment = [
                    join(expr.kind, this.generatePropertyKey(expr.key, expr.computed, expr.value)),
                    this.generateFunctionBody(expr.value)
                ];
            } else {
                fragment = [
                    generateMethodPrefix(expr),
                    this.generatePropertyKey(expr.key, expr.computed, expr.value),
                    this.generateFunctionBody(expr.value)
                ];
            }
            return join(result, fragment);
        },

        Property: function (expr, precedence, flags) {
            if (expr.kind === 'get' || expr.kind === 'set') {
                return [
                    expr.kind, noEmptySpace(),
                    this.generatePropertyKey(expr.key, expr.computed, expr.value),
                    this.generateFunctionBody(expr.value)
                ];
            }

            if (expr.shorthand) {
                return this.generatePropertyKey(expr.key, expr.computed, expr.value);
            }

            if (expr.method) {
                return [
                    generateMethodPrefix(expr),
                    this.generatePropertyKey(expr.key, expr.computed, expr.value),
                    this.generateFunctionBody(expr.value)
                ];
            }

            return [
                this.generatePropertyKey(expr.key, expr.computed, expr.value),
                ':' + space,
                this.generateExpression(expr.value, Precedence.Assignment, E_TTT)
            ];
        },

        ObjectExpression: function (expr, precedence, flags) {
            var multiline, result, fragment, that = this;

            if (!expr.properties.length) {
                return '{}';
            }
            multiline = expr.properties.length > 1;

            withIndent(function () {
                fragment = that.generateExpression(expr.properties[0], Precedence.Sequence, E_TTT);
            });

            if (!multiline) {
                // issues 4
                // Do not transform from
                //   dejavu.Class.declare({
                //       method2: function () {}
                //   });
                // to
                //   dejavu.Class.declare({method2: function () {
                //       }});
                if (!hasLineTerminator(toSourceNodeWhenNeeded(fragment).toString())) {
                    return [ '{', space, fragment, space, '}' ];
                }
            }

            withIndent(function (indent) {
                var i, iz;
                result = [ '{', newline, indent, fragment ];

                if (multiline) {
                    result.push(',' + newline);
                    for (i = 1, iz = expr.properties.length; i < iz; ++i) {
                        result.push(indent);
                        result.push(that.generateExpression(expr.properties[i], Precedence.Sequence, E_TTT));
                        if (i + 1 < iz) {
                            result.push(',' + newline);
                        }
                    }
                }
            });

            if (!endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString())) {
                result.push(newline);
            }
            result.push(base);
            result.push('}');
            return result;
        },

        AssignmentPattern: function(expr, precedence, flags) {
            return this.generateAssignment(expr.left, expr.right, '=', precedence, flags);
        },

        ObjectPattern: function (expr, precedence, flags) {
            var result, i, iz, multiline, property, that = this;
            if (!expr.properties.length) {
                return '{}';
            }

            multiline = false;
            if (expr.properties.length === 1) {
                property = expr.properties[0];
                if (property.value.type !== Syntax.Identifier) {
                    multiline = true;
                }
            } else {
                for (i = 0, iz = expr.properties.length; i < iz; ++i) {
                    property = expr.properties[i];
                    if (!property.shorthand) {
                        multiline = true;
                        break;
                    }
                }
            }
            result = ['{', multiline ? newline : '' ];

            withIndent(function (indent) {
                var i, iz;
                for (i = 0, iz = expr.properties.length; i < iz; ++i) {
                    result.push(multiline ? indent : '');
                    result.push(that.generateExpression(expr.properties[i], Precedence.Sequence, E_TTT));
                    if (i + 1 < iz) {
                        result.push(',' + (multiline ? newline : space));
                    }
                }
            });

            if (multiline && !endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString())) {
                result.push(newline);
            }
            result.push(multiline ? base : '');
            result.push('}');
            return result;
        },

        ThisExpression: function (expr, precedence, flags) {
            return 'this';
        },

        Super: function (expr, precedence, flags) {
            return 'super';
        },

        Identifier: function (expr, precedence, flags) {
            return generateIdentifier(expr);
        },

        ImportDefaultSpecifier: function (expr, precedence, flags) {
            return generateIdentifier(expr.id || expr.local);
        },

        ImportNamespaceSpecifier: function (expr, precedence, flags) {
            var result = ['*'];
            var id = expr.id || expr.local;
            if (id) {
                result.push(space + 'as' + noEmptySpace() + generateIdentifier(id));
            }
            return result;
        },

        ImportSpecifier: function (expr, precedence, flags) {
            var imported = expr.imported;
            var result = [ imported.name ];
            var local = expr.local;
            if (local && local.name !== imported.name) {
                result.push(noEmptySpace() + 'as' + noEmptySpace() + generateIdentifier(local));
            }
            return result;
        },

        ExportSpecifier: function (expr, precedence, flags) {
            var local = expr.local;
            var result = [ local.name ];
            var exported = expr.exported;
            if (exported && exported.name !== local.name) {
                result.push(noEmptySpace() + 'as' + noEmptySpace() + generateIdentifier(exported));
            }
            return result;
        },

        Literal: function (expr, precedence, flags) {
            var raw;
            if (expr.hasOwnProperty('raw') && parse && extra.raw) {
                try {
                    raw = parse(expr.raw).body[0].expression;
                    if (raw.type === Syntax.Literal) {
                        if (raw.value === expr.value) {
                            return expr.raw;
                        }
                    }
                } catch (e) {
                    // not use raw property
                }
            }

            if (expr.value === null) {
                return 'null';
            }

            if (typeof expr.value === 'string') {
                return escapeString(expr.value);
            }

            if (typeof expr.value === 'number') {
                return generateNumber(expr.value);
            }

            if (typeof expr.value === 'boolean') {
                return expr.value ? 'true' : 'false';
            }

            if (expr.regex) {
              return '/' + expr.regex.pattern + '/' + expr.regex.flags;
            }
            return generateRegExp(expr.value);
        },

        GeneratorExpression: function (expr, precedence, flags) {
            return this.ComprehensionExpression(expr, precedence, flags);
        },

        ComprehensionExpression: function (expr, precedence, flags) {
            // GeneratorExpression should be parenthesized with (...), ComprehensionExpression with [...]
            // Due to https://bugzilla.mozilla.org/show_bug.cgi?id=883468 position of expr.body can differ in Spidermonkey and ES6

            var result, i, iz, fragment, that = this;
            result = (expr.type === Syntax.GeneratorExpression) ? ['('] : ['['];

            if (extra.moz.comprehensionExpressionStartsWithAssignment) {
                fragment = this.generateExpression(expr.body, Precedence.Assignment, E_TTT);
                result.push(fragment);
            }

            if (expr.blocks) {
                withIndent(function () {
                    for (i = 0, iz = expr.blocks.length; i < iz; ++i) {
                        fragment = that.generateExpression(expr.blocks[i], Precedence.Sequence, E_TTT);
                        if (i > 0 || extra.moz.comprehensionExpressionStartsWithAssignment) {
                            result = join(result, fragment);
                        } else {
                            result.push(fragment);
                        }
                    }
                });
            }

            if (expr.filter) {
                result = join(result, 'if' + space);
                fragment = this.generateExpression(expr.filter, Precedence.Sequence, E_TTT);
                result = join(result, [ '(', fragment, ')' ]);
            }

            if (!extra.moz.comprehensionExpressionStartsWithAssignment) {
                fragment = this.generateExpression(expr.body, Precedence.Assignment, E_TTT);

                result = join(result, fragment);
            }

            result.push((expr.type === Syntax.GeneratorExpression) ? ')' : ']');
            return result;
        },

        ComprehensionBlock: function (expr, precedence, flags) {
            var fragment;
            if (expr.left.type === Syntax.VariableDeclaration) {
                fragment = [
                    expr.left.kind, noEmptySpace(),
                    this.generateStatement(expr.left.declarations[0], S_FFFF)
                ];
            } else {
                fragment = this.generateExpression(expr.left, Precedence.Call, E_TTT);
            }

            fragment = join(fragment, expr.of ? 'of' : 'in');
            fragment = join(fragment, this.generateExpression(expr.right, Precedence.Sequence, E_TTT));

            return [ 'for' + space + '(', fragment, ')' ];
        },

        SpreadElement: function (expr, precedence, flags) {
            return [
                '...',
                this.generateExpression(expr.argument, Precedence.Assignment, E_TTT)
            ];
        },

        TaggedTemplateExpression: function (expr, precedence, flags) {
            var itemFlags = E_TTF;
            if (!(flags & F_ALLOW_CALL)) {
                itemFlags = E_TFF;
            }
            var result = [
                this.generateExpression(expr.tag, Precedence.Call, itemFlags),
                this.generateExpression(expr.quasi, Precedence.Primary, E_FFT)
            ];
            return parenthesize(result, Precedence.TaggedTemplate, precedence);
        },

        TemplateElement: function (expr, precedence, flags) {
            // Don't use "cooked". Since tagged template can use raw template
            // representation. So if we do so, it breaks the script semantics.
            return expr.value.raw;
        },

        TemplateLiteral: function (expr, precedence, flags) {
            var result, i, iz;
            result = [ '`' ];
            for (i = 0, iz = expr.quasis.length; i < iz; ++i) {
                result.push(this.generateExpression(expr.quasis[i], Precedence.Primary, E_TTT));
                if (i + 1 < iz) {
                    result.push('${' + space);
                    result.push(this.generateExpression(expr.expressions[i], Precedence.Sequence, E_TTT));
                    result.push(space + '}');
                }
            }
            result.push('`');
            return result;
        },

        ModuleSpecifier: function (expr, precedence, flags) {
            return this.Literal(expr, precedence, flags);
        }

    };

    merge(CodeGenerator.prototype, CodeGenerator.Expression);

    CodeGenerator.prototype.generateExpression = function (expr, precedence, flags) {
        var result, type;

        type = expr.type || Syntax.Property;

        if (extra.verbatim && expr.hasOwnProperty(extra.verbatim)) {
            return generateVerbatim(expr, precedence);
        }

        result = this[type](expr, precedence, flags);


        if (extra.comment) {
            result = addComments(expr, result);
        }
        return toSourceNodeWhenNeeded(result, expr);
    };

    CodeGenerator.prototype.generateStatement = function (stmt, flags) {
        var result,
            fragment;

        result = this[stmt.type](stmt, flags);

        // Attach comments

        if (extra.comment) {
            result = addComments(stmt, result);
        }

        fragment = toSourceNodeWhenNeeded(result).toString();
        if (stmt.type === Syntax.Program && !safeConcatenation && newline === '' &&  fragment.charAt(fragment.length - 1) === '\n') {
            result = sourceMap ? toSourceNodeWhenNeeded(result).replaceRight(/\s+$/, '') : fragment.replace(/\s+$/, '');
        }

        return toSourceNodeWhenNeeded(result, stmt);
    };

    function generateInternal(node) {
        var codegen;

        codegen = new CodeGenerator();
        if (isStatement(node)) {
            return codegen.generateStatement(node, S_TFFF);
        }

        if (isExpression(node)) {
            return codegen.generateExpression(node, Precedence.Sequence, E_TTT);
        }

        throw new Error('Unknown node type: ' + node.type);
    }

    function generate(node, options) {
        var defaultOptions = getDefaultOptions(), result, pair;

        if (options != null) {
            // Obsolete options
            //
            //   `options.indent`
            //   `options.base`
            //
            // Instead of them, we can use `option.format.indent`.
            if (typeof options.indent === 'string') {
                defaultOptions.format.indent.style = options.indent;
            }
            if (typeof options.base === 'number') {
                defaultOptions.format.indent.base = options.base;
            }
            options = updateDeeply(defaultOptions, options);
            indent = options.format.indent.style;
            if (typeof options.base === 'string') {
                base = options.base;
            } else {
                base = stringRepeat(indent, options.format.indent.base);
            }
        } else {
            options = defaultOptions;
            indent = options.format.indent.style;
            base = stringRepeat(indent, options.format.indent.base);
        }
        json = options.format.json;
        renumber = options.format.renumber;
        hexadecimal = json ? false : options.format.hexadecimal;
        quotes = json ? 'double' : options.format.quotes;
        escapeless = options.format.escapeless;
        newline = options.format.newline;
        space = options.format.space;
        if (options.format.compact) {
            newline = space = indent = base = '';
        }
        parentheses = options.format.parentheses;
        semicolons = options.format.semicolons;
        safeConcatenation = options.format.safeConcatenation;
        directive = options.directive;
        parse = json ? null : options.parse;
        sourceMap = options.sourceMap;
        sourceCode = options.sourceCode;
        preserveBlankLines = options.format.preserveBlankLines && sourceCode !== null;
        extra = options;

        if (sourceMap) {
            if (!exports.browser) {
                // We assume environment is node.js
                // And prevent from including source-map by browserify
                SourceNode = require('source-map').SourceNode;
            } else {
                SourceNode = global.sourceMap.SourceNode;
            }
        }

        result = generateInternal(node);

        if (!sourceMap) {
            pair = {code: result.toString(), map: null};
            return options.sourceMapWithCode ? pair : pair.code;
        }


        pair = result.toStringWithSourceMap({
            file: options.file,
            sourceRoot: options.sourceMapRoot
        });

        if (options.sourceContent) {
            pair.map.setSourceContent(options.sourceMap,
                                      options.sourceContent);
        }

        if (options.sourceMapWithCode) {
            return pair;
        }

        return pair.map.toString();
    }

    FORMAT_MINIFY = {
        indent: {
            style: '',
            base: 0
        },
        renumber: true,
        hexadecimal: true,
        quotes: 'auto',
        escapeless: true,
        compact: true,
        parentheses: false,
        semicolons: false
    };

    FORMAT_DEFAULTS = getDefaultOptions().format;

    exports.version = require('./package.json').version;
    exports.generate = generate;
    exports.attachComments = estraverse.attachComments;
    exports.Precedence = updateDeeply({}, Precedence);
    exports.browser = false;
    exports.FORMAT_MINIFY = FORMAT_MINIFY;
    exports.FORMAT_DEFAULTS = FORMAT_DEFAULTS;
}());
/* vim: set sw=4 ts=4 et tw=80 : */

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./package.json":13,"estraverse":15,"esutils":20,"source-map":70}],13:[function(require,module,exports){
module.exports={
  "_from": "escodegen@^1.9.0",
  "_id": "escodegen@1.9.0",
  "_inBundle": false,
  "_integrity": "sha512-v0MYvNQ32bzwoG2OSFzWAkuahDQHK92JBN0pTAALJ4RIxEZe766QJPDR8Hqy7XNUy5K3fnVL76OqYAdc4TZEIw==",
  "_location": "/escodegen",
  "_phantomChildren": {},
  "_requested": {
    "type": "range",
    "registry": true,
    "raw": "escodegen@^1.9.0",
    "name": "escodegen",
    "escapedName": "escodegen",
    "rawSpec": "^1.9.0",
    "saveSpec": null,
    "fetchSpec": "^1.9.0"
  },
  "_requiredBy": [
    "#DEV:/",
    "#USER"
  ],
  "_resolved": "http://repo.arteris.com/repository/npm/escodegen/-/escodegen-1.9.0.tgz",
  "_shasum": "9811a2f265dc1cd3894420ee3717064b632b8852",
  "_spec": "escodegen@^1.9.0",
  "_where": "/home/dant/arteris/fontgenerator",
  "bin": {
    "esgenerate": "./bin/esgenerate.js",
    "escodegen": "./bin/escodegen.js"
  },
  "bugs": {
    "url": "https://github.com/estools/escodegen/issues"
  },
  "bundleDependencies": false,
  "dependencies": {
    "esprima": "^3.1.3",
    "estraverse": "^4.2.0",
    "esutils": "^2.0.2",
    "optionator": "^0.8.1",
    "source-map": "~0.5.6"
  },
  "deprecated": false,
  "description": "ECMAScript code generator",
  "devDependencies": {
    "acorn": "^4.0.4",
    "bluebird": "^3.4.7",
    "bower-registry-client": "^1.0.0",
    "chai": "^3.5.0",
    "commonjs-everywhere": "^0.9.7",
    "gulp": "^3.8.10",
    "gulp-eslint": "^3.0.1",
    "gulp-mocha": "^3.0.1",
    "semver": "^5.1.0"
  },
  "engines": {
    "node": ">=0.12.0"
  },
  "files": [
    "LICENSE.BSD",
    "LICENSE.source-map",
    "README.md",
    "bin",
    "escodegen.js",
    "package.json"
  ],
  "homepage": "http://github.com/estools/escodegen",
  "license": "BSD-2-Clause",
  "main": "escodegen.js",
  "maintainers": [
    {
      "name": "Yusuke Suzuki",
      "email": "utatane.tea@gmail.com",
      "url": "http://github.com/Constellation"
    }
  ],
  "name": "escodegen",
  "optionalDependencies": {
    "source-map": "~0.5.6"
  },
  "repository": {
    "type": "git",
    "url": "git+ssh://git@github.com/estools/escodegen.git"
  },
  "scripts": {
    "build": "cjsify -a path: tools/entry-point.js > escodegen.browser.js",
    "build-min": "cjsify -ma path: tools/entry-point.js > escodegen.browser.min.js",
    "lint": "gulp lint",
    "release": "node tools/release.js",
    "test": "gulp travis",
    "unit-test": "gulp test"
  },
  "version": "1.9.0"
}

},{}],14:[function(require,module,exports){
(function webpackUniversalModuleDefinition(root, factory) {
/* istanbul ignore next */
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
/* istanbul ignore next */
	else if(typeof exports === 'object')
		exports["esprima"] = factory();
	else
		root["esprima"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/* istanbul ignore if */
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	/*
	  Copyright JS Foundation and other contributors, https://js.foundation/

	  Redistribution and use in source and binary forms, with or without
	  modification, are permitted provided that the following conditions are met:

	    * Redistributions of source code must retain the above copyright
	      notice, this list of conditions and the following disclaimer.
	    * Redistributions in binary form must reproduce the above copyright
	      notice, this list of conditions and the following disclaimer in the
	      documentation and/or other materials provided with the distribution.

	  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
	  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
	  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
	  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
	  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
	  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
	  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
	  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
	  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	*/
	Object.defineProperty(exports, "__esModule", { value: true });
	var comment_handler_1 = __webpack_require__(1);
	var jsx_parser_1 = __webpack_require__(3);
	var parser_1 = __webpack_require__(8);
	var tokenizer_1 = __webpack_require__(15);
	function parse(code, options, delegate) {
	    var commentHandler = null;
	    var proxyDelegate = function (node, metadata) {
	        if (delegate) {
	            delegate(node, metadata);
	        }
	        if (commentHandler) {
	            commentHandler.visit(node, metadata);
	        }
	    };
	    var parserDelegate = (typeof delegate === 'function') ? proxyDelegate : null;
	    var collectComment = false;
	    if (options) {
	        collectComment = (typeof options.comment === 'boolean' && options.comment);
	        var attachComment = (typeof options.attachComment === 'boolean' && options.attachComment);
	        if (collectComment || attachComment) {
	            commentHandler = new comment_handler_1.CommentHandler();
	            commentHandler.attach = attachComment;
	            options.comment = true;
	            parserDelegate = proxyDelegate;
	        }
	    }
	    var isModule = false;
	    if (options && typeof options.sourceType === 'string') {
	        isModule = (options.sourceType === 'module');
	    }
	    var parser;
	    if (options && typeof options.jsx === 'boolean' && options.jsx) {
	        parser = new jsx_parser_1.JSXParser(code, options, parserDelegate);
	    }
	    else {
	        parser = new parser_1.Parser(code, options, parserDelegate);
	    }
	    var program = isModule ? parser.parseModule() : parser.parseScript();
	    var ast = program;
	    if (collectComment && commentHandler) {
	        ast.comments = commentHandler.comments;
	    }
	    if (parser.config.tokens) {
	        ast.tokens = parser.tokens;
	    }
	    if (parser.config.tolerant) {
	        ast.errors = parser.errorHandler.errors;
	    }
	    return ast;
	}
	exports.parse = parse;
	function parseModule(code, options, delegate) {
	    var parsingOptions = options || {};
	    parsingOptions.sourceType = 'module';
	    return parse(code, parsingOptions, delegate);
	}
	exports.parseModule = parseModule;
	function parseScript(code, options, delegate) {
	    var parsingOptions = options || {};
	    parsingOptions.sourceType = 'script';
	    return parse(code, parsingOptions, delegate);
	}
	exports.parseScript = parseScript;
	function tokenize(code, options, delegate) {
	    var tokenizer = new tokenizer_1.Tokenizer(code, options);
	    var tokens;
	    tokens = [];
	    try {
	        while (true) {
	            var token = tokenizer.getNextToken();
	            if (!token) {
	                break;
	            }
	            if (delegate) {
	                token = delegate(token);
	            }
	            tokens.push(token);
	        }
	    }
	    catch (e) {
	        tokenizer.errorHandler.tolerate(e);
	    }
	    if (tokenizer.errorHandler.tolerant) {
	        tokens.errors = tokenizer.errors();
	    }
	    return tokens;
	}
	exports.tokenize = tokenize;
	var syntax_1 = __webpack_require__(2);
	exports.Syntax = syntax_1.Syntax;
	// Sync with *.json manifests.
	exports.version = '4.0.0';


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	var syntax_1 = __webpack_require__(2);
	var CommentHandler = (function () {
	    function CommentHandler() {
	        this.attach = false;
	        this.comments = [];
	        this.stack = [];
	        this.leading = [];
	        this.trailing = [];
	    }
	    CommentHandler.prototype.insertInnerComments = function (node, metadata) {
	        //  innnerComments for properties empty block
	        //  `function a() {/** comments **\/}`
	        if (node.type === syntax_1.Syntax.BlockStatement && node.body.length === 0) {
	            var innerComments = [];
	            for (var i = this.leading.length - 1; i >= 0; --i) {
	                var entry = this.leading[i];
	                if (metadata.end.offset >= entry.start) {
	                    innerComments.unshift(entry.comment);
	                    this.leading.splice(i, 1);
	                    this.trailing.splice(i, 1);
	                }
	            }
	            if (innerComments.length) {
	                node.innerComments = innerComments;
	            }
	        }
	    };
	    CommentHandler.prototype.findTrailingComments = function (metadata) {
	        var trailingComments = [];
	        if (this.trailing.length > 0) {
	            for (var i = this.trailing.length - 1; i >= 0; --i) {
	                var entry_1 = this.trailing[i];
	                if (entry_1.start >= metadata.end.offset) {
	                    trailingComments.unshift(entry_1.comment);
	                }
	            }
	            this.trailing.length = 0;
	            return trailingComments;
	        }
	        var entry = this.stack[this.stack.length - 1];
	        if (entry && entry.node.trailingComments) {
	            var firstComment = entry.node.trailingComments[0];
	            if (firstComment && firstComment.range[0] >= metadata.end.offset) {
	                trailingComments = entry.node.trailingComments;
	                delete entry.node.trailingComments;
	            }
	        }
	        return trailingComments;
	    };
	    CommentHandler.prototype.findLeadingComments = function (metadata) {
	        var leadingComments = [];
	        var target;
	        while (this.stack.length > 0) {
	            var entry = this.stack[this.stack.length - 1];
	            if (entry && entry.start >= metadata.start.offset) {
	                target = entry.node;
	                this.stack.pop();
	            }
	            else {
	                break;
	            }
	        }
	        if (target) {
	            var count = target.leadingComments ? target.leadingComments.length : 0;
	            for (var i = count - 1; i >= 0; --i) {
	                var comment = target.leadingComments[i];
	                if (comment.range[1] <= metadata.start.offset) {
	                    leadingComments.unshift(comment);
	                    target.leadingComments.splice(i, 1);
	                }
	            }
	            if (target.leadingComments && target.leadingComments.length === 0) {
	                delete target.leadingComments;
	            }
	            return leadingComments;
	        }
	        for (var i = this.leading.length - 1; i >= 0; --i) {
	            var entry = this.leading[i];
	            if (entry.start <= metadata.start.offset) {
	                leadingComments.unshift(entry.comment);
	                this.leading.splice(i, 1);
	            }
	        }
	        return leadingComments;
	    };
	    CommentHandler.prototype.visitNode = function (node, metadata) {
	        if (node.type === syntax_1.Syntax.Program && node.body.length > 0) {
	            return;
	        }
	        this.insertInnerComments(node, metadata);
	        var trailingComments = this.findTrailingComments(metadata);
	        var leadingComments = this.findLeadingComments(metadata);
	        if (leadingComments.length > 0) {
	            node.leadingComments = leadingComments;
	        }
	        if (trailingComments.length > 0) {
	            node.trailingComments = trailingComments;
	        }
	        this.stack.push({
	            node: node,
	            start: metadata.start.offset
	        });
	    };
	    CommentHandler.prototype.visitComment = function (node, metadata) {
	        var type = (node.type[0] === 'L') ? 'Line' : 'Block';
	        var comment = {
	            type: type,
	            value: node.value
	        };
	        if (node.range) {
	            comment.range = node.range;
	        }
	        if (node.loc) {
	            comment.loc = node.loc;
	        }
	        this.comments.push(comment);
	        if (this.attach) {
	            var entry = {
	                comment: {
	                    type: type,
	                    value: node.value,
	                    range: [metadata.start.offset, metadata.end.offset]
	                },
	                start: metadata.start.offset
	            };
	            if (node.loc) {
	                entry.comment.loc = node.loc;
	            }
	            node.type = type;
	            this.leading.push(entry);
	            this.trailing.push(entry);
	        }
	    };
	    CommentHandler.prototype.visit = function (node, metadata) {
	        if (node.type === 'LineComment') {
	            this.visitComment(node, metadata);
	        }
	        else if (node.type === 'BlockComment') {
	            this.visitComment(node, metadata);
	        }
	        else if (this.attach) {
	            this.visitNode(node, metadata);
	        }
	    };
	    return CommentHandler;
	}());
	exports.CommentHandler = CommentHandler;


/***/ },
/* 2 */
/***/ function(module, exports) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.Syntax = {
	    AssignmentExpression: 'AssignmentExpression',
	    AssignmentPattern: 'AssignmentPattern',
	    ArrayExpression: 'ArrayExpression',
	    ArrayPattern: 'ArrayPattern',
	    ArrowFunctionExpression: 'ArrowFunctionExpression',
	    AwaitExpression: 'AwaitExpression',
	    BlockStatement: 'BlockStatement',
	    BinaryExpression: 'BinaryExpression',
	    BreakStatement: 'BreakStatement',
	    CallExpression: 'CallExpression',
	    CatchClause: 'CatchClause',
	    ClassBody: 'ClassBody',
	    ClassDeclaration: 'ClassDeclaration',
	    ClassExpression: 'ClassExpression',
	    ConditionalExpression: 'ConditionalExpression',
	    ContinueStatement: 'ContinueStatement',
	    DoWhileStatement: 'DoWhileStatement',
	    DebuggerStatement: 'DebuggerStatement',
	    EmptyStatement: 'EmptyStatement',
	    ExportAllDeclaration: 'ExportAllDeclaration',
	    ExportDefaultDeclaration: 'ExportDefaultDeclaration',
	    ExportNamedDeclaration: 'ExportNamedDeclaration',
	    ExportSpecifier: 'ExportSpecifier',
	    ExpressionStatement: 'ExpressionStatement',
	    ForStatement: 'ForStatement',
	    ForOfStatement: 'ForOfStatement',
	    ForInStatement: 'ForInStatement',
	    FunctionDeclaration: 'FunctionDeclaration',
	    FunctionExpression: 'FunctionExpression',
	    Identifier: 'Identifier',
	    IfStatement: 'IfStatement',
	    ImportDeclaration: 'ImportDeclaration',
	    ImportDefaultSpecifier: 'ImportDefaultSpecifier',
	    ImportNamespaceSpecifier: 'ImportNamespaceSpecifier',
	    ImportSpecifier: 'ImportSpecifier',
	    Literal: 'Literal',
	    LabeledStatement: 'LabeledStatement',
	    LogicalExpression: 'LogicalExpression',
	    MemberExpression: 'MemberExpression',
	    MetaProperty: 'MetaProperty',
	    MethodDefinition: 'MethodDefinition',
	    NewExpression: 'NewExpression',
	    ObjectExpression: 'ObjectExpression',
	    ObjectPattern: 'ObjectPattern',
	    Program: 'Program',
	    Property: 'Property',
	    RestElement: 'RestElement',
	    ReturnStatement: 'ReturnStatement',
	    SequenceExpression: 'SequenceExpression',
	    SpreadElement: 'SpreadElement',
	    Super: 'Super',
	    SwitchCase: 'SwitchCase',
	    SwitchStatement: 'SwitchStatement',
	    TaggedTemplateExpression: 'TaggedTemplateExpression',
	    TemplateElement: 'TemplateElement',
	    TemplateLiteral: 'TemplateLiteral',
	    ThisExpression: 'ThisExpression',
	    ThrowStatement: 'ThrowStatement',
	    TryStatement: 'TryStatement',
	    UnaryExpression: 'UnaryExpression',
	    UpdateExpression: 'UpdateExpression',
	    VariableDeclaration: 'VariableDeclaration',
	    VariableDeclarator: 'VariableDeclarator',
	    WhileStatement: 'WhileStatement',
	    WithStatement: 'WithStatement',
	    YieldExpression: 'YieldExpression'
	};


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
/* istanbul ignore next */
	var __extends = (this && this.__extends) || (function () {
	    var extendStatics = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
	    return function (d, b) {
	        extendStatics(d, b);
	        function __() { this.constructor = d; }
	        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	    };
	})();
	Object.defineProperty(exports, "__esModule", { value: true });
	var character_1 = __webpack_require__(4);
	var JSXNode = __webpack_require__(5);
	var jsx_syntax_1 = __webpack_require__(6);
	var Node = __webpack_require__(7);
	var parser_1 = __webpack_require__(8);
	var token_1 = __webpack_require__(13);
	var xhtml_entities_1 = __webpack_require__(14);
	token_1.TokenName[100 /* Identifier */] = 'JSXIdentifier';
	token_1.TokenName[101 /* Text */] = 'JSXText';
	// Fully qualified element name, e.g. <svg:path> returns "svg:path"
	function getQualifiedElementName(elementName) {
	    var qualifiedName;
	    switch (elementName.type) {
	        case jsx_syntax_1.JSXSyntax.JSXIdentifier:
	            var id = elementName;
	            qualifiedName = id.name;
	            break;
	        case jsx_syntax_1.JSXSyntax.JSXNamespacedName:
	            var ns = elementName;
	            qualifiedName = getQualifiedElementName(ns.namespace) + ':' +
	                getQualifiedElementName(ns.name);
	            break;
	        case jsx_syntax_1.JSXSyntax.JSXMemberExpression:
	            var expr = elementName;
	            qualifiedName = getQualifiedElementName(expr.object) + '.' +
	                getQualifiedElementName(expr.property);
	            break;
	        /* istanbul ignore next */
	        default:
	            break;
	    }
	    return qualifiedName;
	}
	var JSXParser = (function (_super) {
	    __extends(JSXParser, _super);
	    function JSXParser(code, options, delegate) {
	        return _super.call(this, code, options, delegate) || this;
	    }
	    JSXParser.prototype.parsePrimaryExpression = function () {
	        return this.match('<') ? this.parseJSXRoot() : _super.prototype.parsePrimaryExpression.call(this);
	    };
	    JSXParser.prototype.startJSX = function () {
	        // Unwind the scanner before the lookahead token.
	        this.scanner.index = this.startMarker.index;
	        this.scanner.lineNumber = this.startMarker.line;
	        this.scanner.lineStart = this.startMarker.index - this.startMarker.column;
	    };
	    JSXParser.prototype.finishJSX = function () {
	        // Prime the next lookahead.
	        this.nextToken();
	    };
	    JSXParser.prototype.reenterJSX = function () {
	        this.startJSX();
	        this.expectJSX('}');
	        // Pop the closing '}' added from the lookahead.
	        if (this.config.tokens) {
	            this.tokens.pop();
	        }
	    };
	    JSXParser.prototype.createJSXNode = function () {
	        this.collectComments();
	        return {
	            index: this.scanner.index,
	            line: this.scanner.lineNumber,
	            column: this.scanner.index - this.scanner.lineStart
	        };
	    };
	    JSXParser.prototype.createJSXChildNode = function () {
	        return {
	            index: this.scanner.index,
	            line: this.scanner.lineNumber,
	            column: this.scanner.index - this.scanner.lineStart
	        };
	    };
	    JSXParser.prototype.scanXHTMLEntity = function (quote) {
	        var result = '&';
	        var valid = true;
	        var terminated = false;
	        var numeric = false;
	        var hex = false;
	        while (!this.scanner.eof() && valid && !terminated) {
	            var ch = this.scanner.source[this.scanner.index];
	            if (ch === quote) {
	                break;
	            }
	            terminated = (ch === ';');
	            result += ch;
	            ++this.scanner.index;
	            if (!terminated) {
	                switch (result.length) {
	                    case 2:
	                        // e.g. '&#123;'
	                        numeric = (ch === '#');
	                        break;
	                    case 3:
	                        if (numeric) {
	                            // e.g. '&#x41;'
	                            hex = (ch === 'x');
	                            valid = hex || character_1.Character.isDecimalDigit(ch.charCodeAt(0));
	                            numeric = numeric && !hex;
	                        }
	                        break;
	                    default:
	                        valid = valid && !(numeric && !character_1.Character.isDecimalDigit(ch.charCodeAt(0)));
	                        valid = valid && !(hex && !character_1.Character.isHexDigit(ch.charCodeAt(0)));
	                        break;
	                }
	            }
	        }
	        if (valid && terminated && result.length > 2) {
	            // e.g. '&#x41;' becomes just '#x41'
	            var str = result.substr(1, result.length - 2);
	            if (numeric && str.length > 1) {
	                result = String.fromCharCode(parseInt(str.substr(1), 10));
	            }
	            else if (hex && str.length > 2) {
	                result = String.fromCharCode(parseInt('0' + str.substr(1), 16));
	            }
	            else if (!numeric && !hex && xhtml_entities_1.XHTMLEntities[str]) {
	                result = xhtml_entities_1.XHTMLEntities[str];
	            }
	        }
	        return result;
	    };
	    // Scan the next JSX token. This replaces Scanner#lex when in JSX mode.
	    JSXParser.prototype.lexJSX = function () {
	        var cp = this.scanner.source.charCodeAt(this.scanner.index);
	        // < > / : = { }
	        if (cp === 60 || cp === 62 || cp === 47 || cp === 58 || cp === 61 || cp === 123 || cp === 125) {
	            var value = this.scanner.source[this.scanner.index++];
	            return {
	                type: 7 /* Punctuator */,
	                value: value,
	                lineNumber: this.scanner.lineNumber,
	                lineStart: this.scanner.lineStart,
	                start: this.scanner.index - 1,
	                end: this.scanner.index
	            };
	        }
	        // " '
	        if (cp === 34 || cp === 39) {
	            var start = this.scanner.index;
	            var quote = this.scanner.source[this.scanner.index++];
	            var str = '';
	            while (!this.scanner.eof()) {
	                var ch = this.scanner.source[this.scanner.index++];
	                if (ch === quote) {
	                    break;
	                }
	                else if (ch === '&') {
	                    str += this.scanXHTMLEntity(quote);
	                }
	                else {
	                    str += ch;
	                }
	            }
	            return {
	                type: 8 /* StringLiteral */,
	                value: str,
	                lineNumber: this.scanner.lineNumber,
	                lineStart: this.scanner.lineStart,
	                start: start,
	                end: this.scanner.index
	            };
	        }
	        // ... or .
	        if (cp === 46) {
	            var n1 = this.scanner.source.charCodeAt(this.scanner.index + 1);
	            var n2 = this.scanner.source.charCodeAt(this.scanner.index + 2);
	            var value = (n1 === 46 && n2 === 46) ? '...' : '.';
	            var start = this.scanner.index;
	            this.scanner.index += value.length;
	            return {
	                type: 7 /* Punctuator */,
	                value: value,
	                lineNumber: this.scanner.lineNumber,
	                lineStart: this.scanner.lineStart,
	                start: start,
	                end: this.scanner.index
	            };
	        }
	        // `
	        if (cp === 96) {
	            // Only placeholder, since it will be rescanned as a real assignment expression.
	            return {
	                type: 10 /* Template */,
	                value: '',
	                lineNumber: this.scanner.lineNumber,
	                lineStart: this.scanner.lineStart,
	                start: this.scanner.index,
	                end: this.scanner.index
	            };
	        }
	        // Identifer can not contain backslash (char code 92).
	        if (character_1.Character.isIdentifierStart(cp) && (cp !== 92)) {
	            var start = this.scanner.index;
	            ++this.scanner.index;
	            while (!this.scanner.eof()) {
	                var ch = this.scanner.source.charCodeAt(this.scanner.index);
	                if (character_1.Character.isIdentifierPart(ch) && (ch !== 92)) {
	                    ++this.scanner.index;
	                }
	                else if (ch === 45) {
	                    // Hyphen (char code 45) can be part of an identifier.
	                    ++this.scanner.index;
	                }
	                else {
	                    break;
	                }
	            }
	            var id = this.scanner.source.slice(start, this.scanner.index);
	            return {
	                type: 100 /* Identifier */,
	                value: id,
	                lineNumber: this.scanner.lineNumber,
	                lineStart: this.scanner.lineStart,
	                start: start,
	                end: this.scanner.index
	            };
	        }
	        return this.scanner.lex();
	    };
	    JSXParser.prototype.nextJSXToken = function () {
	        this.collectComments();
	        this.startMarker.index = this.scanner.index;
	        this.startMarker.line = this.scanner.lineNumber;
	        this.startMarker.column = this.scanner.index - this.scanner.lineStart;
	        var token = this.lexJSX();
	        this.lastMarker.index = this.scanner.index;
	        this.lastMarker.line = this.scanner.lineNumber;
	        this.lastMarker.column = this.scanner.index - this.scanner.lineStart;
	        if (this.config.tokens) {
	            this.tokens.push(this.convertToken(token));
	        }
	        return token;
	    };
	    JSXParser.prototype.nextJSXText = function () {
	        this.startMarker.index = this.scanner.index;
	        this.startMarker.line = this.scanner.lineNumber;
	        this.startMarker.column = this.scanner.index - this.scanner.lineStart;
	        var start = this.scanner.index;
	        var text = '';
	        while (!this.scanner.eof()) {
	            var ch = this.scanner.source[this.scanner.index];
	            if (ch === '{' || ch === '<') {
	                break;
	            }
	            ++this.scanner.index;
	            text += ch;
	            if (character_1.Character.isLineTerminator(ch.charCodeAt(0))) {
	                ++this.scanner.lineNumber;
	                if (ch === '\r' && this.scanner.source[this.scanner.index] === '\n') {
	                    ++this.scanner.index;
	                }
	                this.scanner.lineStart = this.scanner.index;
	            }
	        }
	        this.lastMarker.index = this.scanner.index;
	        this.lastMarker.line = this.scanner.lineNumber;
	        this.lastMarker.column = this.scanner.index - this.scanner.lineStart;
	        var token = {
	            type: 101 /* Text */,
	            value: text,
	            lineNumber: this.scanner.lineNumber,
	            lineStart: this.scanner.lineStart,
	            start: start,
	            end: this.scanner.index
	        };
	        if ((text.length > 0) && this.config.tokens) {
	            this.tokens.push(this.convertToken(token));
	        }
	        return token;
	    };
	    JSXParser.prototype.peekJSXToken = function () {
	        var state = this.scanner.saveState();
	        this.scanner.scanComments();
	        var next = this.lexJSX();
	        this.scanner.restoreState(state);
	        return next;
	    };
	    // Expect the next JSX token to match the specified punctuator.
	    // If not, an exception will be thrown.
	    JSXParser.prototype.expectJSX = function (value) {
	        var token = this.nextJSXToken();
	        if (token.type !== 7 /* Punctuator */ || token.value !== value) {
	            this.throwUnexpectedToken(token);
	        }
	    };
	    // Return true if the next JSX token matches the specified punctuator.
	    JSXParser.prototype.matchJSX = function (value) {
	        var next = this.peekJSXToken();
	        return next.type === 7 /* Punctuator */ && next.value === value;
	    };
	    JSXParser.prototype.parseJSXIdentifier = function () {
	        var node = this.createJSXNode();
	        var token = this.nextJSXToken();
	        if (token.type !== 100 /* Identifier */) {
	            this.throwUnexpectedToken(token);
	        }
	        return this.finalize(node, new JSXNode.JSXIdentifier(token.value));
	    };
	    JSXParser.prototype.parseJSXElementName = function () {
	        var node = this.createJSXNode();
	        var elementName = this.parseJSXIdentifier();
	        if (this.matchJSX(':')) {
	            var namespace = elementName;
	            this.expectJSX(':');
	            var name_1 = this.parseJSXIdentifier();
	            elementName = this.finalize(node, new JSXNode.JSXNamespacedName(namespace, name_1));
	        }
	        else if (this.matchJSX('.')) {
	            while (this.matchJSX('.')) {
	                var object = elementName;
	                this.expectJSX('.');
	                var property = this.parseJSXIdentifier();
	                elementName = this.finalize(node, new JSXNode.JSXMemberExpression(object, property));
	            }
	        }
	        return elementName;
	    };
	    JSXParser.prototype.parseJSXAttributeName = function () {
	        var node = this.createJSXNode();
	        var attributeName;
	        var identifier = this.parseJSXIdentifier();
	        if (this.matchJSX(':')) {
	            var namespace = identifier;
	            this.expectJSX(':');
	            var name_2 = this.parseJSXIdentifier();
	            attributeName = this.finalize(node, new JSXNode.JSXNamespacedName(namespace, name_2));
	        }
	        else {
	            attributeName = identifier;
	        }
	        return attributeName;
	    };
	    JSXParser.prototype.parseJSXStringLiteralAttribute = function () {
	        var node = this.createJSXNode();
	        var token = this.nextJSXToken();
	        if (token.type !== 8 /* StringLiteral */) {
	            this.throwUnexpectedToken(token);
	        }
	        var raw = this.getTokenRaw(token);
	        return this.finalize(node, new Node.Literal(token.value, raw));
	    };
	    JSXParser.prototype.parseJSXExpressionAttribute = function () {
	        var node = this.createJSXNode();
	        this.expectJSX('{');
	        this.finishJSX();
	        if (this.match('}')) {
	            this.tolerateError('JSX attributes must only be assigned a non-empty expression');
	        }
	        var expression = this.parseAssignmentExpression();
	        this.reenterJSX();
	        return this.finalize(node, new JSXNode.JSXExpressionContainer(expression));
	    };
	    JSXParser.prototype.parseJSXAttributeValue = function () {
	        return this.matchJSX('{') ? this.parseJSXExpressionAttribute() :
	            this.matchJSX('<') ? this.parseJSXElement() : this.parseJSXStringLiteralAttribute();
	    };
	    JSXParser.prototype.parseJSXNameValueAttribute = function () {
	        var node = this.createJSXNode();
	        var name = this.parseJSXAttributeName();
	        var value = null;
	        if (this.matchJSX('=')) {
	            this.expectJSX('=');
	            value = this.parseJSXAttributeValue();
	        }
	        return this.finalize(node, new JSXNode.JSXAttribute(name, value));
	    };
	    JSXParser.prototype.parseJSXSpreadAttribute = function () {
	        var node = this.createJSXNode();
	        this.expectJSX('{');
	        this.expectJSX('...');
	        this.finishJSX();
	        var argument = this.parseAssignmentExpression();
	        this.reenterJSX();
	        return this.finalize(node, new JSXNode.JSXSpreadAttribute(argument));
	    };
	    JSXParser.prototype.parseJSXAttributes = function () {
	        var attributes = [];
	        while (!this.matchJSX('/') && !this.matchJSX('>')) {
	            var attribute = this.matchJSX('{') ? this.parseJSXSpreadAttribute() :
	                this.parseJSXNameValueAttribute();
	            attributes.push(attribute);
	        }
	        return attributes;
	    };
	    JSXParser.prototype.parseJSXOpeningElement = function () {
	        var node = this.createJSXNode();
	        this.expectJSX('<');
	        var name = this.parseJSXElementName();
	        var attributes = this.parseJSXAttributes();
	        var selfClosing = this.matchJSX('/');
	        if (selfClosing) {
	            this.expectJSX('/');
	        }
	        this.expectJSX('>');
	        return this.finalize(node, new JSXNode.JSXOpeningElement(name, selfClosing, attributes));
	    };
	    JSXParser.prototype.parseJSXBoundaryElement = function () {
	        var node = this.createJSXNode();
	        this.expectJSX('<');
	        if (this.matchJSX('/')) {
	            this.expectJSX('/');
	            var name_3 = this.parseJSXElementName();
	            this.expectJSX('>');
	            return this.finalize(node, new JSXNode.JSXClosingElement(name_3));
	        }
	        var name = this.parseJSXElementName();
	        var attributes = this.parseJSXAttributes();
	        var selfClosing = this.matchJSX('/');
	        if (selfClosing) {
	            this.expectJSX('/');
	        }
	        this.expectJSX('>');
	        return this.finalize(node, new JSXNode.JSXOpeningElement(name, selfClosing, attributes));
	    };
	    JSXParser.prototype.parseJSXEmptyExpression = function () {
	        var node = this.createJSXChildNode();
	        this.collectComments();
	        this.lastMarker.index = this.scanner.index;
	        this.lastMarker.line = this.scanner.lineNumber;
	        this.lastMarker.column = this.scanner.index - this.scanner.lineStart;
	        return this.finalize(node, new JSXNode.JSXEmptyExpression());
	    };
	    JSXParser.prototype.parseJSXExpressionContainer = function () {
	        var node = this.createJSXNode();
	        this.expectJSX('{');
	        var expression;
	        if (this.matchJSX('}')) {
	            expression = this.parseJSXEmptyExpression();
	            this.expectJSX('}');
	        }
	        else {
	            this.finishJSX();
	            expression = this.parseAssignmentExpression();
	            this.reenterJSX();
	        }
	        return this.finalize(node, new JSXNode.JSXExpressionContainer(expression));
	    };
	    JSXParser.prototype.parseJSXChildren = function () {
	        var children = [];
	        while (!this.scanner.eof()) {
	            var node = this.createJSXChildNode();
	            var token = this.nextJSXText();
	            if (token.start < token.end) {
	                var raw = this.getTokenRaw(token);
	                var child = this.finalize(node, new JSXNode.JSXText(token.value, raw));
	                children.push(child);
	            }
	            if (this.scanner.source[this.scanner.index] === '{') {
	                var container = this.parseJSXExpressionContainer();
	                children.push(container);
	            }
	            else {
	                break;
	            }
	        }
	        return children;
	    };
	    JSXParser.prototype.parseComplexJSXElement = function (el) {
	        var stack = [];
	        while (!this.scanner.eof()) {
	            el.children = el.children.concat(this.parseJSXChildren());
	            var node = this.createJSXChildNode();
	            var element = this.parseJSXBoundaryElement();
	            if (element.type === jsx_syntax_1.JSXSyntax.JSXOpeningElement) {
	                var opening = element;
	                if (opening.selfClosing) {
	                    var child = this.finalize(node, new JSXNode.JSXElement(opening, [], null));
	                    el.children.push(child);
	                }
	                else {
	                    stack.push(el);
	                    el = { node: node, opening: opening, closing: null, children: [] };
	                }
	            }
	            if (element.type === jsx_syntax_1.JSXSyntax.JSXClosingElement) {
	                el.closing = element;
	                var open_1 = getQualifiedElementName(el.opening.name);
	                var close_1 = getQualifiedElementName(el.closing.name);
	                if (open_1 !== close_1) {
	                    this.tolerateError('Expected corresponding JSX closing tag for %0', open_1);
	                }
	                if (stack.length > 0) {
	                    var child = this.finalize(el.node, new JSXNode.JSXElement(el.opening, el.children, el.closing));
	                    el = stack[stack.length - 1];
	                    el.children.push(child);
	                    stack.pop();
	                }
	                else {
	                    break;
	                }
	            }
	        }
	        return el;
	    };
	    JSXParser.prototype.parseJSXElement = function () {
	        var node = this.createJSXNode();
	        var opening = this.parseJSXOpeningElement();
	        var children = [];
	        var closing = null;
	        if (!opening.selfClosing) {
	            var el = this.parseComplexJSXElement({ node: node, opening: opening, closing: closing, children: children });
	            children = el.children;
	            closing = el.closing;
	        }
	        return this.finalize(node, new JSXNode.JSXElement(opening, children, closing));
	    };
	    JSXParser.prototype.parseJSXRoot = function () {
	        // Pop the opening '<' added from the lookahead.
	        if (this.config.tokens) {
	            this.tokens.pop();
	        }
	        this.startJSX();
	        var element = this.parseJSXElement();
	        this.finishJSX();
	        return element;
	    };
	    JSXParser.prototype.isStartOfExpression = function () {
	        return _super.prototype.isStartOfExpression.call(this) || this.match('<');
	    };
	    return JSXParser;
	}(parser_1.Parser));
	exports.JSXParser = JSXParser;


/***/ },
/* 4 */
/***/ function(module, exports) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	// See also tools/generate-unicode-regex.js.
	var Regex = {
	    // Unicode v8.0.0 NonAsciiIdentifierStart:
	    NonAsciiIdentifierStart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B4\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AD\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF19]|\uD806[\uDCA0-\uDCDF\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1]|\uD87E[\uDC00-\uDE1D]/,
	    // Unicode v8.0.0 NonAsciiIdentifierPart:
	    NonAsciiIdentifierPart: /[\xAA\xB5\xB7\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B4\u08E3-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0AF9\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D5F-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1369-\u1371\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AD\uA7B0-\uA7B7\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA8FD\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDCA-\uDDCC\uDDD0-\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE37\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF50\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDDD8-\uDDDD\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9\uDF00-\uDF19\uDF1D-\uDF2B\uDF30-\uDF39]|\uD806[\uDCA0-\uDCE9\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/
	};
	exports.Character = {
	    /* tslint:disable:no-bitwise */
	    fromCodePoint: function (cp) {
	        return (cp < 0x10000) ? String.fromCharCode(cp) :
	            String.fromCharCode(0xD800 + ((cp - 0x10000) >> 10)) +
	                String.fromCharCode(0xDC00 + ((cp - 0x10000) & 1023));
	    },
	    // https://tc39.github.io/ecma262/#sec-white-space
	    isWhiteSpace: function (cp) {
	        return (cp === 0x20) || (cp === 0x09) || (cp === 0x0B) || (cp === 0x0C) || (cp === 0xA0) ||
	            (cp >= 0x1680 && [0x1680, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000, 0xFEFF].indexOf(cp) >= 0);
	    },
	    // https://tc39.github.io/ecma262/#sec-line-terminators
	    isLineTerminator: function (cp) {
	        return (cp === 0x0A) || (cp === 0x0D) || (cp === 0x2028) || (cp === 0x2029);
	    },
	    // https://tc39.github.io/ecma262/#sec-names-and-keywords
	    isIdentifierStart: function (cp) {
	        return (cp === 0x24) || (cp === 0x5F) ||
	            (cp >= 0x41 && cp <= 0x5A) ||
	            (cp >= 0x61 && cp <= 0x7A) ||
	            (cp === 0x5C) ||
	            ((cp >= 0x80) && Regex.NonAsciiIdentifierStart.test(exports.Character.fromCodePoint(cp)));
	    },
	    isIdentifierPart: function (cp) {
	        return (cp === 0x24) || (cp === 0x5F) ||
	            (cp >= 0x41 && cp <= 0x5A) ||
	            (cp >= 0x61 && cp <= 0x7A) ||
	            (cp >= 0x30 && cp <= 0x39) ||
	            (cp === 0x5C) ||
	            ((cp >= 0x80) && Regex.NonAsciiIdentifierPart.test(exports.Character.fromCodePoint(cp)));
	    },
	    // https://tc39.github.io/ecma262/#sec-literals-numeric-literals
	    isDecimalDigit: function (cp) {
	        return (cp >= 0x30 && cp <= 0x39); // 0..9
	    },
	    isHexDigit: function (cp) {
	        return (cp >= 0x30 && cp <= 0x39) ||
	            (cp >= 0x41 && cp <= 0x46) ||
	            (cp >= 0x61 && cp <= 0x66); // a..f
	    },
	    isOctalDigit: function (cp) {
	        return (cp >= 0x30 && cp <= 0x37); // 0..7
	    }
	};


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	var jsx_syntax_1 = __webpack_require__(6);
	/* tslint:disable:max-classes-per-file */
	var JSXClosingElement = (function () {
	    function JSXClosingElement(name) {
	        this.type = jsx_syntax_1.JSXSyntax.JSXClosingElement;
	        this.name = name;
	    }
	    return JSXClosingElement;
	}());
	exports.JSXClosingElement = JSXClosingElement;
	var JSXElement = (function () {
	    function JSXElement(openingElement, children, closingElement) {
	        this.type = jsx_syntax_1.JSXSyntax.JSXElement;
	        this.openingElement = openingElement;
	        this.children = children;
	        this.closingElement = closingElement;
	    }
	    return JSXElement;
	}());
	exports.JSXElement = JSXElement;
	var JSXEmptyExpression = (function () {
	    function JSXEmptyExpression() {
	        this.type = jsx_syntax_1.JSXSyntax.JSXEmptyExpression;
	    }
	    return JSXEmptyExpression;
	}());
	exports.JSXEmptyExpression = JSXEmptyExpression;
	var JSXExpressionContainer = (function () {
	    function JSXExpressionContainer(expression) {
	        this.type = jsx_syntax_1.JSXSyntax.JSXExpressionContainer;
	        this.expression = expression;
	    }
	    return JSXExpressionContainer;
	}());
	exports.JSXExpressionContainer = JSXExpressionContainer;
	var JSXIdentifier = (function () {
	    function JSXIdentifier(name) {
	        this.type = jsx_syntax_1.JSXSyntax.JSXIdentifier;
	        this.name = name;
	    }
	    return JSXIdentifier;
	}());
	exports.JSXIdentifier = JSXIdentifier;
	var JSXMemberExpression = (function () {
	    function JSXMemberExpression(object, property) {
	        this.type = jsx_syntax_1.JSXSyntax.JSXMemberExpression;
	        this.object = object;
	        this.property = property;
	    }
	    return JSXMemberExpression;
	}());
	exports.JSXMemberExpression = JSXMemberExpression;
	var JSXAttribute = (function () {
	    function JSXAttribute(name, value) {
	        this.type = jsx_syntax_1.JSXSyntax.JSXAttribute;
	        this.name = name;
	        this.value = value;
	    }
	    return JSXAttribute;
	}());
	exports.JSXAttribute = JSXAttribute;
	var JSXNamespacedName = (function () {
	    function JSXNamespacedName(namespace, name) {
	        this.type = jsx_syntax_1.JSXSyntax.JSXNamespacedName;
	        this.namespace = namespace;
	        this.name = name;
	    }
	    return JSXNamespacedName;
	}());
	exports.JSXNamespacedName = JSXNamespacedName;
	var JSXOpeningElement = (function () {
	    function JSXOpeningElement(name, selfClosing, attributes) {
	        this.type = jsx_syntax_1.JSXSyntax.JSXOpeningElement;
	        this.name = name;
	        this.selfClosing = selfClosing;
	        this.attributes = attributes;
	    }
	    return JSXOpeningElement;
	}());
	exports.JSXOpeningElement = JSXOpeningElement;
	var JSXSpreadAttribute = (function () {
	    function JSXSpreadAttribute(argument) {
	        this.type = jsx_syntax_1.JSXSyntax.JSXSpreadAttribute;
	        this.argument = argument;
	    }
	    return JSXSpreadAttribute;
	}());
	exports.JSXSpreadAttribute = JSXSpreadAttribute;
	var JSXText = (function () {
	    function JSXText(value, raw) {
	        this.type = jsx_syntax_1.JSXSyntax.JSXText;
	        this.value = value;
	        this.raw = raw;
	    }
	    return JSXText;
	}());
	exports.JSXText = JSXText;


/***/ },
/* 6 */
/***/ function(module, exports) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.JSXSyntax = {
	    JSXAttribute: 'JSXAttribute',
	    JSXClosingElement: 'JSXClosingElement',
	    JSXElement: 'JSXElement',
	    JSXEmptyExpression: 'JSXEmptyExpression',
	    JSXExpressionContainer: 'JSXExpressionContainer',
	    JSXIdentifier: 'JSXIdentifier',
	    JSXMemberExpression: 'JSXMemberExpression',
	    JSXNamespacedName: 'JSXNamespacedName',
	    JSXOpeningElement: 'JSXOpeningElement',
	    JSXSpreadAttribute: 'JSXSpreadAttribute',
	    JSXText: 'JSXText'
	};


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	var syntax_1 = __webpack_require__(2);
	/* tslint:disable:max-classes-per-file */
	var ArrayExpression = (function () {
	    function ArrayExpression(elements) {
	        this.type = syntax_1.Syntax.ArrayExpression;
	        this.elements = elements;
	    }
	    return ArrayExpression;
	}());
	exports.ArrayExpression = ArrayExpression;
	var ArrayPattern = (function () {
	    function ArrayPattern(elements) {
	        this.type = syntax_1.Syntax.ArrayPattern;
	        this.elements = elements;
	    }
	    return ArrayPattern;
	}());
	exports.ArrayPattern = ArrayPattern;
	var ArrowFunctionExpression = (function () {
	    function ArrowFunctionExpression(params, body, expression) {
	        this.type = syntax_1.Syntax.ArrowFunctionExpression;
	        this.id = null;
	        this.params = params;
	        this.body = body;
	        this.generator = false;
	        this.expression = expression;
	        this.async = false;
	    }
	    return ArrowFunctionExpression;
	}());
	exports.ArrowFunctionExpression = ArrowFunctionExpression;
	var AssignmentExpression = (function () {
	    function AssignmentExpression(operator, left, right) {
	        this.type = syntax_1.Syntax.AssignmentExpression;
	        this.operator = operator;
	        this.left = left;
	        this.right = right;
	    }
	    return AssignmentExpression;
	}());
	exports.AssignmentExpression = AssignmentExpression;
	var AssignmentPattern = (function () {
	    function AssignmentPattern(left, right) {
	        this.type = syntax_1.Syntax.AssignmentPattern;
	        this.left = left;
	        this.right = right;
	    }
	    return AssignmentPattern;
	}());
	exports.AssignmentPattern = AssignmentPattern;
	var AsyncArrowFunctionExpression = (function () {
	    function AsyncArrowFunctionExpression(params, body, expression) {
	        this.type = syntax_1.Syntax.ArrowFunctionExpression;
	        this.id = null;
	        this.params = params;
	        this.body = body;
	        this.generator = false;
	        this.expression = expression;
	        this.async = true;
	    }
	    return AsyncArrowFunctionExpression;
	}());
	exports.AsyncArrowFunctionExpression = AsyncArrowFunctionExpression;
	var AsyncFunctionDeclaration = (function () {
	    function AsyncFunctionDeclaration(id, params, body) {
	        this.type = syntax_1.Syntax.FunctionDeclaration;
	        this.id = id;
	        this.params = params;
	        this.body = body;
	        this.generator = false;
	        this.expression = false;
	        this.async = true;
	    }
	    return AsyncFunctionDeclaration;
	}());
	exports.AsyncFunctionDeclaration = AsyncFunctionDeclaration;
	var AsyncFunctionExpression = (function () {
	    function AsyncFunctionExpression(id, params, body) {
	        this.type = syntax_1.Syntax.FunctionExpression;
	        this.id = id;
	        this.params = params;
	        this.body = body;
	        this.generator = false;
	        this.expression = false;
	        this.async = true;
	    }
	    return AsyncFunctionExpression;
	}());
	exports.AsyncFunctionExpression = AsyncFunctionExpression;
	var AwaitExpression = (function () {
	    function AwaitExpression(argument) {
	        this.type = syntax_1.Syntax.AwaitExpression;
	        this.argument = argument;
	    }
	    return AwaitExpression;
	}());
	exports.AwaitExpression = AwaitExpression;
	var BinaryExpression = (function () {
	    function BinaryExpression(operator, left, right) {
	        var logical = (operator === '||' || operator === '&&');
	        this.type = logical ? syntax_1.Syntax.LogicalExpression : syntax_1.Syntax.BinaryExpression;
	        this.operator = operator;
	        this.left = left;
	        this.right = right;
	    }
	    return BinaryExpression;
	}());
	exports.BinaryExpression = BinaryExpression;
	var BlockStatement = (function () {
	    function BlockStatement(body) {
	        this.type = syntax_1.Syntax.BlockStatement;
	        this.body = body;
	    }
	    return BlockStatement;
	}());
	exports.BlockStatement = BlockStatement;
	var BreakStatement = (function () {
	    function BreakStatement(label) {
	        this.type = syntax_1.Syntax.BreakStatement;
	        this.label = label;
	    }
	    return BreakStatement;
	}());
	exports.BreakStatement = BreakStatement;
	var CallExpression = (function () {
	    function CallExpression(callee, args) {
	        this.type = syntax_1.Syntax.CallExpression;
	        this.callee = callee;
	        this.arguments = args;
	    }
	    return CallExpression;
	}());
	exports.CallExpression = CallExpression;
	var CatchClause = (function () {
	    function CatchClause(param, body) {
	        this.type = syntax_1.Syntax.CatchClause;
	        this.param = param;
	        this.body = body;
	    }
	    return CatchClause;
	}());
	exports.CatchClause = CatchClause;
	var ClassBody = (function () {
	    function ClassBody(body) {
	        this.type = syntax_1.Syntax.ClassBody;
	        this.body = body;
	    }
	    return ClassBody;
	}());
	exports.ClassBody = ClassBody;
	var ClassDeclaration = (function () {
	    function ClassDeclaration(id, superClass, body) {
	        this.type = syntax_1.Syntax.ClassDeclaration;
	        this.id = id;
	        this.superClass = superClass;
	        this.body = body;
	    }
	    return ClassDeclaration;
	}());
	exports.ClassDeclaration = ClassDeclaration;
	var ClassExpression = (function () {
	    function ClassExpression(id, superClass, body) {
	        this.type = syntax_1.Syntax.ClassExpression;
	        this.id = id;
	        this.superClass = superClass;
	        this.body = body;
	    }
	    return ClassExpression;
	}());
	exports.ClassExpression = ClassExpression;
	var ComputedMemberExpression = (function () {
	    function ComputedMemberExpression(object, property) {
	        this.type = syntax_1.Syntax.MemberExpression;
	        this.computed = true;
	        this.object = object;
	        this.property = property;
	    }
	    return ComputedMemberExpression;
	}());
	exports.ComputedMemberExpression = ComputedMemberExpression;
	var ConditionalExpression = (function () {
	    function ConditionalExpression(test, consequent, alternate) {
	        this.type = syntax_1.Syntax.ConditionalExpression;
	        this.test = test;
	        this.consequent = consequent;
	        this.alternate = alternate;
	    }
	    return ConditionalExpression;
	}());
	exports.ConditionalExpression = ConditionalExpression;
	var ContinueStatement = (function () {
	    function ContinueStatement(label) {
	        this.type = syntax_1.Syntax.ContinueStatement;
	        this.label = label;
	    }
	    return ContinueStatement;
	}());
	exports.ContinueStatement = ContinueStatement;
	var DebuggerStatement = (function () {
	    function DebuggerStatement() {
	        this.type = syntax_1.Syntax.DebuggerStatement;
	    }
	    return DebuggerStatement;
	}());
	exports.DebuggerStatement = DebuggerStatement;
	var Directive = (function () {
	    function Directive(expression, directive) {
	        this.type = syntax_1.Syntax.ExpressionStatement;
	        this.expression = expression;
	        this.directive = directive;
	    }
	    return Directive;
	}());
	exports.Directive = Directive;
	var DoWhileStatement = (function () {
	    function DoWhileStatement(body, test) {
	        this.type = syntax_1.Syntax.DoWhileStatement;
	        this.body = body;
	        this.test = test;
	    }
	    return DoWhileStatement;
	}());
	exports.DoWhileStatement = DoWhileStatement;
	var EmptyStatement = (function () {
	    function EmptyStatement() {
	        this.type = syntax_1.Syntax.EmptyStatement;
	    }
	    return EmptyStatement;
	}());
	exports.EmptyStatement = EmptyStatement;
	var ExportAllDeclaration = (function () {
	    function ExportAllDeclaration(source) {
	        this.type = syntax_1.Syntax.ExportAllDeclaration;
	        this.source = source;
	    }
	    return ExportAllDeclaration;
	}());
	exports.ExportAllDeclaration = ExportAllDeclaration;
	var ExportDefaultDeclaration = (function () {
	    function ExportDefaultDeclaration(declaration) {
	        this.type = syntax_1.Syntax.ExportDefaultDeclaration;
	        this.declaration = declaration;
	    }
	    return ExportDefaultDeclaration;
	}());
	exports.ExportDefaultDeclaration = ExportDefaultDeclaration;
	var ExportNamedDeclaration = (function () {
	    function ExportNamedDeclaration(declaration, specifiers, source) {
	        this.type = syntax_1.Syntax.ExportNamedDeclaration;
	        this.declaration = declaration;
	        this.specifiers = specifiers;
	        this.source = source;
	    }
	    return ExportNamedDeclaration;
	}());
	exports.ExportNamedDeclaration = ExportNamedDeclaration;
	var ExportSpecifier = (function () {
	    function ExportSpecifier(local, exported) {
	        this.type = syntax_1.Syntax.ExportSpecifier;
	        this.exported = exported;
	        this.local = local;
	    }
	    return ExportSpecifier;
	}());
	exports.ExportSpecifier = ExportSpecifier;
	var ExpressionStatement = (function () {
	    function ExpressionStatement(expression) {
	        this.type = syntax_1.Syntax.ExpressionStatement;
	        this.expression = expression;
	    }
	    return ExpressionStatement;
	}());
	exports.ExpressionStatement = ExpressionStatement;
	var ForInStatement = (function () {
	    function ForInStatement(left, right, body) {
	        this.type = syntax_1.Syntax.ForInStatement;
	        this.left = left;
	        this.right = right;
	        this.body = body;
	        this.each = false;
	    }
	    return ForInStatement;
	}());
	exports.ForInStatement = ForInStatement;
	var ForOfStatement = (function () {
	    function ForOfStatement(left, right, body) {
	        this.type = syntax_1.Syntax.ForOfStatement;
	        this.left = left;
	        this.right = right;
	        this.body = body;
	    }
	    return ForOfStatement;
	}());
	exports.ForOfStatement = ForOfStatement;
	var ForStatement = (function () {
	    function ForStatement(init, test, update, body) {
	        this.type = syntax_1.Syntax.ForStatement;
	        this.init = init;
	        this.test = test;
	        this.update = update;
	        this.body = body;
	    }
	    return ForStatement;
	}());
	exports.ForStatement = ForStatement;
	var FunctionDeclaration = (function () {
	    function FunctionDeclaration(id, params, body, generator) {
	        this.type = syntax_1.Syntax.FunctionDeclaration;
	        this.id = id;
	        this.params = params;
	        this.body = body;
	        this.generator = generator;
	        this.expression = false;
	        this.async = false;
	    }
	    return FunctionDeclaration;
	}());
	exports.FunctionDeclaration = FunctionDeclaration;
	var FunctionExpression = (function () {
	    function FunctionExpression(id, params, body, generator) {
	        this.type = syntax_1.Syntax.FunctionExpression;
	        this.id = id;
	        this.params = params;
	        this.body = body;
	        this.generator = generator;
	        this.expression = false;
	        this.async = false;
	    }
	    return FunctionExpression;
	}());
	exports.FunctionExpression = FunctionExpression;
	var Identifier = (function () {
	    function Identifier(name) {
	        this.type = syntax_1.Syntax.Identifier;
	        this.name = name;
	    }
	    return Identifier;
	}());
	exports.Identifier = Identifier;
	var IfStatement = (function () {
	    function IfStatement(test, consequent, alternate) {
	        this.type = syntax_1.Syntax.IfStatement;
	        this.test = test;
	        this.consequent = consequent;
	        this.alternate = alternate;
	    }
	    return IfStatement;
	}());
	exports.IfStatement = IfStatement;
	var ImportDeclaration = (function () {
	    function ImportDeclaration(specifiers, source) {
	        this.type = syntax_1.Syntax.ImportDeclaration;
	        this.specifiers = specifiers;
	        this.source = source;
	    }
	    return ImportDeclaration;
	}());
	exports.ImportDeclaration = ImportDeclaration;
	var ImportDefaultSpecifier = (function () {
	    function ImportDefaultSpecifier(local) {
	        this.type = syntax_1.Syntax.ImportDefaultSpecifier;
	        this.local = local;
	    }
	    return ImportDefaultSpecifier;
	}());
	exports.ImportDefaultSpecifier = ImportDefaultSpecifier;
	var ImportNamespaceSpecifier = (function () {
	    function ImportNamespaceSpecifier(local) {
	        this.type = syntax_1.Syntax.ImportNamespaceSpecifier;
	        this.local = local;
	    }
	    return ImportNamespaceSpecifier;
	}());
	exports.ImportNamespaceSpecifier = ImportNamespaceSpecifier;
	var ImportSpecifier = (function () {
	    function ImportSpecifier(local, imported) {
	        this.type = syntax_1.Syntax.ImportSpecifier;
	        this.local = local;
	        this.imported = imported;
	    }
	    return ImportSpecifier;
	}());
	exports.ImportSpecifier = ImportSpecifier;
	var LabeledStatement = (function () {
	    function LabeledStatement(label, body) {
	        this.type = syntax_1.Syntax.LabeledStatement;
	        this.label = label;
	        this.body = body;
	    }
	    return LabeledStatement;
	}());
	exports.LabeledStatement = LabeledStatement;
	var Literal = (function () {
	    function Literal(value, raw) {
	        this.type = syntax_1.Syntax.Literal;
	        this.value = value;
	        this.raw = raw;
	    }
	    return Literal;
	}());
	exports.Literal = Literal;
	var MetaProperty = (function () {
	    function MetaProperty(meta, property) {
	        this.type = syntax_1.Syntax.MetaProperty;
	        this.meta = meta;
	        this.property = property;
	    }
	    return MetaProperty;
	}());
	exports.MetaProperty = MetaProperty;
	var MethodDefinition = (function () {
	    function MethodDefinition(key, computed, value, kind, isStatic) {
	        this.type = syntax_1.Syntax.MethodDefinition;
	        this.key = key;
	        this.computed = computed;
	        this.value = value;
	        this.kind = kind;
	        this.static = isStatic;
	    }
	    return MethodDefinition;
	}());
	exports.MethodDefinition = MethodDefinition;
	var Module = (function () {
	    function Module(body) {
	        this.type = syntax_1.Syntax.Program;
	        this.body = body;
	        this.sourceType = 'module';
	    }
	    return Module;
	}());
	exports.Module = Module;
	var NewExpression = (function () {
	    function NewExpression(callee, args) {
	        this.type = syntax_1.Syntax.NewExpression;
	        this.callee = callee;
	        this.arguments = args;
	    }
	    return NewExpression;
	}());
	exports.NewExpression = NewExpression;
	var ObjectExpression = (function () {
	    function ObjectExpression(properties) {
	        this.type = syntax_1.Syntax.ObjectExpression;
	        this.properties = properties;
	    }
	    return ObjectExpression;
	}());
	exports.ObjectExpression = ObjectExpression;
	var ObjectPattern = (function () {
	    function ObjectPattern(properties) {
	        this.type = syntax_1.Syntax.ObjectPattern;
	        this.properties = properties;
	    }
	    return ObjectPattern;
	}());
	exports.ObjectPattern = ObjectPattern;
	var Property = (function () {
	    function Property(kind, key, computed, value, method, shorthand) {
	        this.type = syntax_1.Syntax.Property;
	        this.key = key;
	        this.computed = computed;
	        this.value = value;
	        this.kind = kind;
	        this.method = method;
	        this.shorthand = shorthand;
	    }
	    return Property;
	}());
	exports.Property = Property;
	var RegexLiteral = (function () {
	    function RegexLiteral(value, raw, pattern, flags) {
	        this.type = syntax_1.Syntax.Literal;
	        this.value = value;
	        this.raw = raw;
	        this.regex = { pattern: pattern, flags: flags };
	    }
	    return RegexLiteral;
	}());
	exports.RegexLiteral = RegexLiteral;
	var RestElement = (function () {
	    function RestElement(argument) {
	        this.type = syntax_1.Syntax.RestElement;
	        this.argument = argument;
	    }
	    return RestElement;
	}());
	exports.RestElement = RestElement;
	var ReturnStatement = (function () {
	    function ReturnStatement(argument) {
	        this.type = syntax_1.Syntax.ReturnStatement;
	        this.argument = argument;
	    }
	    return ReturnStatement;
	}());
	exports.ReturnStatement = ReturnStatement;
	var Script = (function () {
	    function Script(body) {
	        this.type = syntax_1.Syntax.Program;
	        this.body = body;
	        this.sourceType = 'script';
	    }
	    return Script;
	}());
	exports.Script = Script;
	var SequenceExpression = (function () {
	    function SequenceExpression(expressions) {
	        this.type = syntax_1.Syntax.SequenceExpression;
	        this.expressions = expressions;
	    }
	    return SequenceExpression;
	}());
	exports.SequenceExpression = SequenceExpression;
	var SpreadElement = (function () {
	    function SpreadElement(argument) {
	        this.type = syntax_1.Syntax.SpreadElement;
	        this.argument = argument;
	    }
	    return SpreadElement;
	}());
	exports.SpreadElement = SpreadElement;
	var StaticMemberExpression = (function () {
	    function StaticMemberExpression(object, property) {
	        this.type = syntax_1.Syntax.MemberExpression;
	        this.computed = false;
	        this.object = object;
	        this.property = property;
	    }
	    return StaticMemberExpression;
	}());
	exports.StaticMemberExpression = StaticMemberExpression;
	var Super = (function () {
	    function Super() {
	        this.type = syntax_1.Syntax.Super;
	    }
	    return Super;
	}());
	exports.Super = Super;
	var SwitchCase = (function () {
	    function SwitchCase(test, consequent) {
	        this.type = syntax_1.Syntax.SwitchCase;
	        this.test = test;
	        this.consequent = consequent;
	    }
	    return SwitchCase;
	}());
	exports.SwitchCase = SwitchCase;
	var SwitchStatement = (function () {
	    function SwitchStatement(discriminant, cases) {
	        this.type = syntax_1.Syntax.SwitchStatement;
	        this.discriminant = discriminant;
	        this.cases = cases;
	    }
	    return SwitchStatement;
	}());
	exports.SwitchStatement = SwitchStatement;
	var TaggedTemplateExpression = (function () {
	    function TaggedTemplateExpression(tag, quasi) {
	        this.type = syntax_1.Syntax.TaggedTemplateExpression;
	        this.tag = tag;
	        this.quasi = quasi;
	    }
	    return TaggedTemplateExpression;
	}());
	exports.TaggedTemplateExpression = TaggedTemplateExpression;
	var TemplateElement = (function () {
	    function TemplateElement(value, tail) {
	        this.type = syntax_1.Syntax.TemplateElement;
	        this.value = value;
	        this.tail = tail;
	    }
	    return TemplateElement;
	}());
	exports.TemplateElement = TemplateElement;
	var TemplateLiteral = (function () {
	    function TemplateLiteral(quasis, expressions) {
	        this.type = syntax_1.Syntax.TemplateLiteral;
	        this.quasis = quasis;
	        this.expressions = expressions;
	    }
	    return TemplateLiteral;
	}());
	exports.TemplateLiteral = TemplateLiteral;
	var ThisExpression = (function () {
	    function ThisExpression() {
	        this.type = syntax_1.Syntax.ThisExpression;
	    }
	    return ThisExpression;
	}());
	exports.ThisExpression = ThisExpression;
	var ThrowStatement = (function () {
	    function ThrowStatement(argument) {
	        this.type = syntax_1.Syntax.ThrowStatement;
	        this.argument = argument;
	    }
	    return ThrowStatement;
	}());
	exports.ThrowStatement = ThrowStatement;
	var TryStatement = (function () {
	    function TryStatement(block, handler, finalizer) {
	        this.type = syntax_1.Syntax.TryStatement;
	        this.block = block;
	        this.handler = handler;
	        this.finalizer = finalizer;
	    }
	    return TryStatement;
	}());
	exports.TryStatement = TryStatement;
	var UnaryExpression = (function () {
	    function UnaryExpression(operator, argument) {
	        this.type = syntax_1.Syntax.UnaryExpression;
	        this.operator = operator;
	        this.argument = argument;
	        this.prefix = true;
	    }
	    return UnaryExpression;
	}());
	exports.UnaryExpression = UnaryExpression;
	var UpdateExpression = (function () {
	    function UpdateExpression(operator, argument, prefix) {
	        this.type = syntax_1.Syntax.UpdateExpression;
	        this.operator = operator;
	        this.argument = argument;
	        this.prefix = prefix;
	    }
	    return UpdateExpression;
	}());
	exports.UpdateExpression = UpdateExpression;
	var VariableDeclaration = (function () {
	    function VariableDeclaration(declarations, kind) {
	        this.type = syntax_1.Syntax.VariableDeclaration;
	        this.declarations = declarations;
	        this.kind = kind;
	    }
	    return VariableDeclaration;
	}());
	exports.VariableDeclaration = VariableDeclaration;
	var VariableDeclarator = (function () {
	    function VariableDeclarator(id, init) {
	        this.type = syntax_1.Syntax.VariableDeclarator;
	        this.id = id;
	        this.init = init;
	    }
	    return VariableDeclarator;
	}());
	exports.VariableDeclarator = VariableDeclarator;
	var WhileStatement = (function () {
	    function WhileStatement(test, body) {
	        this.type = syntax_1.Syntax.WhileStatement;
	        this.test = test;
	        this.body = body;
	    }
	    return WhileStatement;
	}());
	exports.WhileStatement = WhileStatement;
	var WithStatement = (function () {
	    function WithStatement(object, body) {
	        this.type = syntax_1.Syntax.WithStatement;
	        this.object = object;
	        this.body = body;
	    }
	    return WithStatement;
	}());
	exports.WithStatement = WithStatement;
	var YieldExpression = (function () {
	    function YieldExpression(argument, delegate) {
	        this.type = syntax_1.Syntax.YieldExpression;
	        this.argument = argument;
	        this.delegate = delegate;
	    }
	    return YieldExpression;
	}());
	exports.YieldExpression = YieldExpression;


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	var assert_1 = __webpack_require__(9);
	var error_handler_1 = __webpack_require__(10);
	var messages_1 = __webpack_require__(11);
	var Node = __webpack_require__(7);
	var scanner_1 = __webpack_require__(12);
	var syntax_1 = __webpack_require__(2);
	var token_1 = __webpack_require__(13);
	var ArrowParameterPlaceHolder = 'ArrowParameterPlaceHolder';
	var Parser = (function () {
	    function Parser(code, options, delegate) {
	        if (options === void 0) { options = {}; }
	        this.config = {
	            range: (typeof options.range === 'boolean') && options.range,
	            loc: (typeof options.loc === 'boolean') && options.loc,
	            source: null,
	            tokens: (typeof options.tokens === 'boolean') && options.tokens,
	            comment: (typeof options.comment === 'boolean') && options.comment,
	            tolerant: (typeof options.tolerant === 'boolean') && options.tolerant
	        };
	        if (this.config.loc && options.source && options.source !== null) {
	            this.config.source = String(options.source);
	        }
	        this.delegate = delegate;
	        this.errorHandler = new error_handler_1.ErrorHandler();
	        this.errorHandler.tolerant = this.config.tolerant;
	        this.scanner = new scanner_1.Scanner(code, this.errorHandler);
	        this.scanner.trackComment = this.config.comment;
	        this.operatorPrecedence = {
	            ')': 0,
	            ';': 0,
	            ',': 0,
	            '=': 0,
	            ']': 0,
	            '||': 1,
	            '&&': 2,
	            '|': 3,
	            '^': 4,
	            '&': 5,
	            '==': 6,
	            '!=': 6,
	            '===': 6,
	            '!==': 6,
	            '<': 7,
	            '>': 7,
	            '<=': 7,
	            '>=': 7,
	            '<<': 8,
	            '>>': 8,
	            '>>>': 8,
	            '+': 9,
	            '-': 9,
	            '*': 11,
	            '/': 11,
	            '%': 11
	        };
	        this.lookahead = {
	            type: 2 /* EOF */,
	            value: '',
	            lineNumber: this.scanner.lineNumber,
	            lineStart: 0,
	            start: 0,
	            end: 0
	        };
	        this.hasLineTerminator = false;
	        this.context = {
	            isModule: false,
	            await: false,
	            allowIn: true,
	            allowStrictDirective: true,
	            allowYield: true,
	            firstCoverInitializedNameError: null,
	            isAssignmentTarget: false,
	            isBindingElement: false,
	            inFunctionBody: false,
	            inIteration: false,
	            inSwitch: false,
	            labelSet: {},
	            strict: false
	        };
	        this.tokens = [];
	        this.startMarker = {
	            index: 0,
	            line: this.scanner.lineNumber,
	            column: 0
	        };
	        this.lastMarker = {
	            index: 0,
	            line: this.scanner.lineNumber,
	            column: 0
	        };
	        this.nextToken();
	        this.lastMarker = {
	            index: this.scanner.index,
	            line: this.scanner.lineNumber,
	            column: this.scanner.index - this.scanner.lineStart
	        };
	    }
	    Parser.prototype.throwError = function (messageFormat) {
	        var values = [];
	        for (var _i = 1; _i < arguments.length; _i++) {
	            values[_i - 1] = arguments[_i];
	        }
	        var args = Array.prototype.slice.call(arguments, 1);
	        var msg = messageFormat.replace(/%(\d)/g, function (whole, idx) {
	            assert_1.assert(idx < args.length, 'Message reference must be in range');
	            return args[idx];
	        });
	        var index = this.lastMarker.index;
	        var line = this.lastMarker.line;
	        var column = this.lastMarker.column + 1;
	        throw this.errorHandler.createError(index, line, column, msg);
	    };
	    Parser.prototype.tolerateError = function (messageFormat) {
	        var values = [];
	        for (var _i = 1; _i < arguments.length; _i++) {
	            values[_i - 1] = arguments[_i];
	        }
	        var args = Array.prototype.slice.call(arguments, 1);
	        var msg = messageFormat.replace(/%(\d)/g, function (whole, idx) {
	            assert_1.assert(idx < args.length, 'Message reference must be in range');
	            return args[idx];
	        });
	        var index = this.lastMarker.index;
	        var line = this.scanner.lineNumber;
	        var column = this.lastMarker.column + 1;
	        this.errorHandler.tolerateError(index, line, column, msg);
	    };
	    // Throw an exception because of the token.
	    Parser.prototype.unexpectedTokenError = function (token, message) {
	        var msg = message || messages_1.Messages.UnexpectedToken;
	        var value;
	        if (token) {
	            if (!message) {
	                msg = (token.type === 2 /* EOF */) ? messages_1.Messages.UnexpectedEOS :
	                    (token.type === 3 /* Identifier */) ? messages_1.Messages.UnexpectedIdentifier :
	                        (token.type === 6 /* NumericLiteral */) ? messages_1.Messages.UnexpectedNumber :
	                            (token.type === 8 /* StringLiteral */) ? messages_1.Messages.UnexpectedString :
	                                (token.type === 10 /* Template */) ? messages_1.Messages.UnexpectedTemplate :
	                                    messages_1.Messages.UnexpectedToken;
	                if (token.type === 4 /* Keyword */) {
	                    if (this.scanner.isFutureReservedWord(token.value)) {
	                        msg = messages_1.Messages.UnexpectedReserved;
	                    }
	                    else if (this.context.strict && this.scanner.isStrictModeReservedWord(token.value)) {
	                        msg = messages_1.Messages.StrictReservedWord;
	                    }
	                }
	            }
	            value = token.value;
	        }
	        else {
	            value = 'ILLEGAL';
	        }
	        msg = msg.replace('%0', value);
	        if (token && typeof token.lineNumber === 'number') {
	            var index = token.start;
	            var line = token.lineNumber;
	            var lastMarkerLineStart = this.lastMarker.index - this.lastMarker.column;
	            var column = token.start - lastMarkerLineStart + 1;
	            return this.errorHandler.createError(index, line, column, msg);
	        }
	        else {
	            var index = this.lastMarker.index;
	            var line = this.lastMarker.line;
	            var column = this.lastMarker.column + 1;
	            return this.errorHandler.createError(index, line, column, msg);
	        }
	    };
	    Parser.prototype.throwUnexpectedToken = function (token, message) {
	        throw this.unexpectedTokenError(token, message);
	    };
	    Parser.prototype.tolerateUnexpectedToken = function (token, message) {
	        this.errorHandler.tolerate(this.unexpectedTokenError(token, message));
	    };
	    Parser.prototype.collectComments = function () {
	        if (!this.config.comment) {
	            this.scanner.scanComments();
	        }
	        else {
	            var comments = this.scanner.scanComments();
	            if (comments.length > 0 && this.delegate) {
	                for (var i = 0; i < comments.length; ++i) {
	                    var e = comments[i];
	                    var node = void 0;
	                    node = {
	                        type: e.multiLine ? 'BlockComment' : 'LineComment',
	                        value: this.scanner.source.slice(e.slice[0], e.slice[1])
	                    };
	                    if (this.config.range) {
	                        node.range = e.range;
	                    }
	                    if (this.config.loc) {
	                        node.loc = e.loc;
	                    }
	                    var metadata = {
	                        start: {
	                            line: e.loc.start.line,
	                            column: e.loc.start.column,
	                            offset: e.range[0]
	                        },
	                        end: {
	                            line: e.loc.end.line,
	                            column: e.loc.end.column,
	                            offset: e.range[1]
	                        }
	                    };
	                    this.delegate(node, metadata);
	                }
	            }
	        }
	    };
	    // From internal representation to an external structure
	    Parser.prototype.getTokenRaw = function (token) {
	        return this.scanner.source.slice(token.start, token.end);
	    };
	    Parser.prototype.convertToken = function (token) {
	        var t = {
	            type: token_1.TokenName[token.type],
	            value: this.getTokenRaw(token)
	        };
	        if (this.config.range) {
	            t.range = [token.start, token.end];
	        }
	        if (this.config.loc) {
	            t.loc = {
	                start: {
	                    line: this.startMarker.line,
	                    column: this.startMarker.column
	                },
	                end: {
	                    line: this.scanner.lineNumber,
	                    column: this.scanner.index - this.scanner.lineStart
	                }
	            };
	        }
	        if (token.type === 9 /* RegularExpression */) {
	            var pattern = token.pattern;
	            var flags = token.flags;
	            t.regex = { pattern: pattern, flags: flags };
	        }
	        return t;
	    };
	    Parser.prototype.nextToken = function () {
	        var token = this.lookahead;
	        this.lastMarker.index = this.scanner.index;
	        this.lastMarker.line = this.scanner.lineNumber;
	        this.lastMarker.column = this.scanner.index - this.scanner.lineStart;
	        this.collectComments();
	        if (this.scanner.index !== this.startMarker.index) {
	            this.startMarker.index = this.scanner.index;
	            this.startMarker.line = this.scanner.lineNumber;
	            this.startMarker.column = this.scanner.index - this.scanner.lineStart;
	        }
	        var next = this.scanner.lex();
	        this.hasLineTerminator = (token.lineNumber !== next.lineNumber);
	        if (next && this.context.strict && next.type === 3 /* Identifier */) {
	            if (this.scanner.isStrictModeReservedWord(next.value)) {
	                next.type = 4 /* Keyword */;
	            }
	        }
	        this.lookahead = next;
	        if (this.config.tokens && next.type !== 2 /* EOF */) {
	            this.tokens.push(this.convertToken(next));
	        }
	        return token;
	    };
	    Parser.prototype.nextRegexToken = function () {
	        this.collectComments();
	        var token = this.scanner.scanRegExp();
	        if (this.config.tokens) {
	            // Pop the previous token, '/' or '/='
	            // This is added from the lookahead token.
	            this.tokens.pop();
	            this.tokens.push(this.convertToken(token));
	        }
	        // Prime the next lookahead.
	        this.lookahead = token;
	        this.nextToken();
	        return token;
	    };
	    Parser.prototype.createNode = function () {
	        return {
	            index: this.startMarker.index,
	            line: this.startMarker.line,
	            column: this.startMarker.column
	        };
	    };
	    Parser.prototype.startNode = function (token) {
	        return {
	            index: token.start,
	            line: token.lineNumber,
	            column: token.start - token.lineStart
	        };
	    };
	    Parser.prototype.finalize = function (marker, node) {
	        if (this.config.range) {
	            node.range = [marker.index, this.lastMarker.index];
	        }
	        if (this.config.loc) {
	            node.loc = {
	                start: {
	                    line: marker.line,
	                    column: marker.column,
	                },
	                end: {
	                    line: this.lastMarker.line,
	                    column: this.lastMarker.column
	                }
	            };
	            if (this.config.source) {
	                node.loc.source = this.config.source;
	            }
	        }
	        if (this.delegate) {
	            var metadata = {
	                start: {
	                    line: marker.line,
	                    column: marker.column,
	                    offset: marker.index
	                },
	                end: {
	                    line: this.lastMarker.line,
	                    column: this.lastMarker.column,
	                    offset: this.lastMarker.index
	                }
	            };
	            this.delegate(node, metadata);
	        }
	        return node;
	    };
	    // Expect the next token to match the specified punctuator.
	    // If not, an exception will be thrown.
	    Parser.prototype.expect = function (value) {
	        var token = this.nextToken();
	        if (token.type !== 7 /* Punctuator */ || token.value !== value) {
	            this.throwUnexpectedToken(token);
	        }
	    };
	    // Quietly expect a comma when in tolerant mode, otherwise delegates to expect().
	    Parser.prototype.expectCommaSeparator = function () {
	        if (this.config.tolerant) {
	            var token = this.lookahead;
	            if (token.type === 7 /* Punctuator */ && token.value === ',') {
	                this.nextToken();
	            }
	            else if (token.type === 7 /* Punctuator */ && token.value === ';') {
	                this.nextToken();
	                this.tolerateUnexpectedToken(token);
	            }
	            else {
	                this.tolerateUnexpectedToken(token, messages_1.Messages.UnexpectedToken);
	            }
	        }
	        else {
	            this.expect(',');
	        }
	    };
	    // Expect the next token to match the specified keyword.
	    // If not, an exception will be thrown.
	    Parser.prototype.expectKeyword = function (keyword) {
	        var token = this.nextToken();
	        if (token.type !== 4 /* Keyword */ || token.value !== keyword) {
	            this.throwUnexpectedToken(token);
	        }
	    };
	    // Return true if the next token matches the specified punctuator.
	    Parser.prototype.match = function (value) {
	        return this.lookahead.type === 7 /* Punctuator */ && this.lookahead.value === value;
	    };
	    // Return true if the next token matches the specified keyword
	    Parser.prototype.matchKeyword = function (keyword) {
	        return this.lookahead.type === 4 /* Keyword */ && this.lookahead.value === keyword;
	    };
	    // Return true if the next token matches the specified contextual keyword
	    // (where an identifier is sometimes a keyword depending on the context)
	    Parser.prototype.matchContextualKeyword = function (keyword) {
	        return this.lookahead.type === 3 /* Identifier */ && this.lookahead.value === keyword;
	    };
	    // Return true if the next token is an assignment operator
	    Parser.prototype.matchAssign = function () {
	        if (this.lookahead.type !== 7 /* Punctuator */) {
	            return false;
	        }
	        var op = this.lookahead.value;
	        return op === '=' ||
	            op === '*=' ||
	            op === '**=' ||
	            op === '/=' ||
	            op === '%=' ||
	            op === '+=' ||
	            op === '-=' ||
	            op === '<<=' ||
	            op === '>>=' ||
	            op === '>>>=' ||
	            op === '&=' ||
	            op === '^=' ||
	            op === '|=';
	    };
	    // Cover grammar support.
	    //
	    // When an assignment expression position starts with an left parenthesis, the determination of the type
	    // of the syntax is to be deferred arbitrarily long until the end of the parentheses pair (plus a lookahead)
	    // or the first comma. This situation also defers the determination of all the expressions nested in the pair.
	    //
	    // There are three productions that can be parsed in a parentheses pair that needs to be determined
	    // after the outermost pair is closed. They are:
	    //
	    //   1. AssignmentExpression
	    //   2. BindingElements
	    //   3. AssignmentTargets
	    //
	    // In order to avoid exponential backtracking, we use two flags to denote if the production can be
	    // binding element or assignment target.
	    //
	    // The three productions have the relationship:
	    //
	    //   BindingElements ⊆ AssignmentTargets ⊆ AssignmentExpression
	    //
	    // with a single exception that CoverInitializedName when used directly in an Expression, generates
	    // an early error. Therefore, we need the third state, firstCoverInitializedNameError, to track the
	    // first usage of CoverInitializedName and report it when we reached the end of the parentheses pair.
	    //
	    // isolateCoverGrammar function runs the given parser function with a new cover grammar context, and it does not
	    // effect the current flags. This means the production the parser parses is only used as an expression. Therefore
	    // the CoverInitializedName check is conducted.
	    //
	    // inheritCoverGrammar function runs the given parse function with a new cover grammar context, and it propagates
	    // the flags outside of the parser. This means the production the parser parses is used as a part of a potential
	    // pattern. The CoverInitializedName check is deferred.
	    Parser.prototype.isolateCoverGrammar = function (parseFunction) {
	        var previousIsBindingElement = this.context.isBindingElement;
	        var previousIsAssignmentTarget = this.context.isAssignmentTarget;
	        var previousFirstCoverInitializedNameError = this.context.firstCoverInitializedNameError;
	        this.context.isBindingElement = true;
	        this.context.isAssignmentTarget = true;
	        this.context.firstCoverInitializedNameError = null;
	        var result = parseFunction.call(this);
	        if (this.context.firstCoverInitializedNameError !== null) {
	            this.throwUnexpectedToken(this.context.firstCoverInitializedNameError);
	        }
	        this.context.isBindingElement = previousIsBindingElement;
	        this.context.isAssignmentTarget = previousIsAssignmentTarget;
	        this.context.firstCoverInitializedNameError = previousFirstCoverInitializedNameError;
	        return result;
	    };
	    Parser.prototype.inheritCoverGrammar = function (parseFunction) {
	        var previousIsBindingElement = this.context.isBindingElement;
	        var previousIsAssignmentTarget = this.context.isAssignmentTarget;
	        var previousFirstCoverInitializedNameError = this.context.firstCoverInitializedNameError;
	        this.context.isBindingElement = true;
	        this.context.isAssignmentTarget = true;
	        this.context.firstCoverInitializedNameError = null;
	        var result = parseFunction.call(this);
	        this.context.isBindingElement = this.context.isBindingElement && previousIsBindingElement;
	        this.context.isAssignmentTarget = this.context.isAssignmentTarget && previousIsAssignmentTarget;
	        this.context.firstCoverInitializedNameError = previousFirstCoverInitializedNameError || this.context.firstCoverInitializedNameError;
	        return result;
	    };
	    Parser.prototype.consumeSemicolon = function () {
	        if (this.match(';')) {
	            this.nextToken();
	        }
	        else if (!this.hasLineTerminator) {
	            if (this.lookahead.type !== 2 /* EOF */ && !this.match('}')) {
	                this.throwUnexpectedToken(this.lookahead);
	            }
	            this.lastMarker.index = this.startMarker.index;
	            this.lastMarker.line = this.startMarker.line;
	            this.lastMarker.column = this.startMarker.column;
	        }
	    };
	    // https://tc39.github.io/ecma262/#sec-primary-expression
	    Parser.prototype.parsePrimaryExpression = function () {
	        var node = this.createNode();
	        var expr;
	        var token, raw;
	        switch (this.lookahead.type) {
	            case 3 /* Identifier */:
	                if ((this.context.isModule || this.context.await) && this.lookahead.value === 'await') {
	                    this.tolerateUnexpectedToken(this.lookahead);
	                }
	                expr = this.matchAsyncFunction() ? this.parseFunctionExpression() : this.finalize(node, new Node.Identifier(this.nextToken().value));
	                break;
	            case 6 /* NumericLiteral */:
	            case 8 /* StringLiteral */:
	                if (this.context.strict && this.lookahead.octal) {
	                    this.tolerateUnexpectedToken(this.lookahead, messages_1.Messages.StrictOctalLiteral);
	                }
	                this.context.isAssignmentTarget = false;
	                this.context.isBindingElement = false;
	                token = this.nextToken();
	                raw = this.getTokenRaw(token);
	                expr = this.finalize(node, new Node.Literal(token.value, raw));
	                break;
	            case 1 /* BooleanLiteral */:
	                this.context.isAssignmentTarget = false;
	                this.context.isBindingElement = false;
	                token = this.nextToken();
	                raw = this.getTokenRaw(token);
	                expr = this.finalize(node, new Node.Literal(token.value === 'true', raw));
	                break;
	            case 5 /* NullLiteral */:
	                this.context.isAssignmentTarget = false;
	                this.context.isBindingElement = false;
	                token = this.nextToken();
	                raw = this.getTokenRaw(token);
	                expr = this.finalize(node, new Node.Literal(null, raw));
	                break;
	            case 10 /* Template */:
	                expr = this.parseTemplateLiteral();
	                break;
	            case 7 /* Punctuator */:
	                switch (this.lookahead.value) {
	                    case '(':
	                        this.context.isBindingElement = false;
	                        expr = this.inheritCoverGrammar(this.parseGroupExpression);
	                        break;
	                    case '[':
	                        expr = this.inheritCoverGrammar(this.parseArrayInitializer);
	                        break;
	                    case '{':
	                        expr = this.inheritCoverGrammar(this.parseObjectInitializer);
	                        break;
	                    case '/':
	                    case '/=':
	                        this.context.isAssignmentTarget = false;
	                        this.context.isBindingElement = false;
	                        this.scanner.index = this.startMarker.index;
	                        token = this.nextRegexToken();
	                        raw = this.getTokenRaw(token);
	                        expr = this.finalize(node, new Node.RegexLiteral(token.regex, raw, token.pattern, token.flags));
	                        break;
	                    default:
	                        expr = this.throwUnexpectedToken(this.nextToken());
	                }
	                break;
	            case 4 /* Keyword */:
	                if (!this.context.strict && this.context.allowYield && this.matchKeyword('yield')) {
	                    expr = this.parseIdentifierName();
	                }
	                else if (!this.context.strict && this.matchKeyword('let')) {
	                    expr = this.finalize(node, new Node.Identifier(this.nextToken().value));
	                }
	                else {
	                    this.context.isAssignmentTarget = false;
	                    this.context.isBindingElement = false;
	                    if (this.matchKeyword('function')) {
	                        expr = this.parseFunctionExpression();
	                    }
	                    else if (this.matchKeyword('this')) {
	                        this.nextToken();
	                        expr = this.finalize(node, new Node.ThisExpression());
	                    }
	                    else if (this.matchKeyword('class')) {
	                        expr = this.parseClassExpression();
	                    }
	                    else {
	                        expr = this.throwUnexpectedToken(this.nextToken());
	                    }
	                }
	                break;
	            default:
	                expr = this.throwUnexpectedToken(this.nextToken());
	        }
	        return expr;
	    };
	    // https://tc39.github.io/ecma262/#sec-array-initializer
	    Parser.prototype.parseSpreadElement = function () {
	        var node = this.createNode();
	        this.expect('...');
	        var arg = this.inheritCoverGrammar(this.parseAssignmentExpression);
	        return this.finalize(node, new Node.SpreadElement(arg));
	    };
	    Parser.prototype.parseArrayInitializer = function () {
	        var node = this.createNode();
	        var elements = [];
	        this.expect('[');
	        while (!this.match(']')) {
	            if (this.match(',')) {
	                this.nextToken();
	                elements.push(null);
	            }
	            else if (this.match('...')) {
	                var element = this.parseSpreadElement();
	                if (!this.match(']')) {
	                    this.context.isAssignmentTarget = false;
	                    this.context.isBindingElement = false;
	                    this.expect(',');
	                }
	                elements.push(element);
	            }
	            else {
	                elements.push(this.inheritCoverGrammar(this.parseAssignmentExpression));
	                if (!this.match(']')) {
	                    this.expect(',');
	                }
	            }
	        }
	        this.expect(']');
	        return this.finalize(node, new Node.ArrayExpression(elements));
	    };
	    // https://tc39.github.io/ecma262/#sec-object-initializer
	    Parser.prototype.parsePropertyMethod = function (params) {
	        this.context.isAssignmentTarget = false;
	        this.context.isBindingElement = false;
	        var previousStrict = this.context.strict;
	        var previousAllowStrictDirective = this.context.allowStrictDirective;
	        this.context.allowStrictDirective = params.simple;
	        var body = this.isolateCoverGrammar(this.parseFunctionSourceElements);
	        if (this.context.strict && params.firstRestricted) {
	            this.tolerateUnexpectedToken(params.firstRestricted, params.message);
	        }
	        if (this.context.strict && params.stricted) {
	            this.tolerateUnexpectedToken(params.stricted, params.message);
	        }
	        this.context.strict = previousStrict;
	        this.context.allowStrictDirective = previousAllowStrictDirective;
	        return body;
	    };
	    Parser.prototype.parsePropertyMethodFunction = function () {
	        var isGenerator = false;
	        var node = this.createNode();
	        var previousAllowYield = this.context.allowYield;
	        this.context.allowYield = false;
	        var params = this.parseFormalParameters();
	        var method = this.parsePropertyMethod(params);
	        this.context.allowYield = previousAllowYield;
	        return this.finalize(node, new Node.FunctionExpression(null, params.params, method, isGenerator));
	    };
	    Parser.prototype.parsePropertyMethodAsyncFunction = function () {
	        var node = this.createNode();
	        var previousAllowYield = this.context.allowYield;
	        var previousAwait = this.context.await;
	        this.context.allowYield = false;
	        this.context.await = true;
	        var params = this.parseFormalParameters();
	        var method = this.parsePropertyMethod(params);
	        this.context.allowYield = previousAllowYield;
	        this.context.await = previousAwait;
	        return this.finalize(node, new Node.AsyncFunctionExpression(null, params.params, method));
	    };
	    Parser.prototype.parseObjectPropertyKey = function () {
	        var node = this.createNode();
	        var token = this.nextToken();
	        var key;
	        switch (token.type) {
	            case 8 /* StringLiteral */:
	            case 6 /* NumericLiteral */:
	                if (this.context.strict && token.octal) {
	                    this.tolerateUnexpectedToken(token, messages_1.Messages.StrictOctalLiteral);
	                }
	                var raw = this.getTokenRaw(token);
	                key = this.finalize(node, new Node.Literal(token.value, raw));
	                break;
	            case 3 /* Identifier */:
	            case 1 /* BooleanLiteral */:
	            case 5 /* NullLiteral */:
	            case 4 /* Keyword */:
	                key = this.finalize(node, new Node.Identifier(token.value));
	                break;
	            case 7 /* Punctuator */:
	                if (token.value === '[') {
	                    key = this.isolateCoverGrammar(this.parseAssignmentExpression);
	                    this.expect(']');
	                }
	                else {
	                    key = this.throwUnexpectedToken(token);
	                }
	                break;
	            default:
	                key = this.throwUnexpectedToken(token);
	        }
	        return key;
	    };
	    Parser.prototype.isPropertyKey = function (key, value) {
	        return (key.type === syntax_1.Syntax.Identifier && key.name === value) ||
	            (key.type === syntax_1.Syntax.Literal && key.value === value);
	    };
	    Parser.prototype.parseObjectProperty = function (hasProto) {
	        var node = this.createNode();
	        var token = this.lookahead;
	        var kind;
	        var key = null;
	        var value = null;
	        var computed = false;
	        var method = false;
	        var shorthand = false;
	        var isAsync = false;
	        if (token.type === 3 /* Identifier */) {
	            var id = token.value;
	            this.nextToken();
	            computed = this.match('[');
	            isAsync = !this.hasLineTerminator && (id === 'async') &&
	                !this.match(':') && !this.match('(') && !this.match('*');
	            key = isAsync ? this.parseObjectPropertyKey() : this.finalize(node, new Node.Identifier(id));
	        }
	        else if (this.match('*')) {
	            this.nextToken();
	        }
	        else {
	            computed = this.match('[');
	            key = this.parseObjectPropertyKey();
	        }
	        var lookaheadPropertyKey = this.qualifiedPropertyName(this.lookahead);
	        if (token.type === 3 /* Identifier */ && !isAsync && token.value === 'get' && lookaheadPropertyKey) {
	            kind = 'get';
	            computed = this.match('[');
	            key = this.parseObjectPropertyKey();
	            this.context.allowYield = false;
	            value = this.parseGetterMethod();
	        }
	        else if (token.type === 3 /* Identifier */ && !isAsync && token.value === 'set' && lookaheadPropertyKey) {
	            kind = 'set';
	            computed = this.match('[');
	            key = this.parseObjectPropertyKey();
	            value = this.parseSetterMethod();
	        }
	        else if (token.type === 7 /* Punctuator */ && token.value === '*' && lookaheadPropertyKey) {
	            kind = 'init';
	            computed = this.match('[');
	            key = this.parseObjectPropertyKey();
	            value = this.parseGeneratorMethod();
	            method = true;
	        }
	        else {
	            if (!key) {
	                this.throwUnexpectedToken(this.lookahead);
	            }
	            kind = 'init';
	            if (this.match(':') && !isAsync) {
	                if (!computed && this.isPropertyKey(key, '__proto__')) {
	                    if (hasProto.value) {
	                        this.tolerateError(messages_1.Messages.DuplicateProtoProperty);
	                    }
	                    hasProto.value = true;
	                }
	                this.nextToken();
	                value = this.inheritCoverGrammar(this.parseAssignmentExpression);
	            }
	            else if (this.match('(')) {
	                value = isAsync ? this.parsePropertyMethodAsyncFunction() : this.parsePropertyMethodFunction();
	                method = true;
	            }
	            else if (token.type === 3 /* Identifier */) {
	                var id = this.finalize(node, new Node.Identifier(token.value));
	                if (this.match('=')) {
	                    this.context.firstCoverInitializedNameError = this.lookahead;
	                    this.nextToken();
	                    shorthand = true;
	                    var init = this.isolateCoverGrammar(this.parseAssignmentExpression);
	                    value = this.finalize(node, new Node.AssignmentPattern(id, init));
	                }
	                else {
	                    shorthand = true;
	                    value = id;
	                }
	            }
	            else {
	                this.throwUnexpectedToken(this.nextToken());
	            }
	        }
	        return this.finalize(node, new Node.Property(kind, key, computed, value, method, shorthand));
	    };
	    Parser.prototype.parseObjectInitializer = function () {
	        var node = this.createNode();
	        this.expect('{');
	        var properties = [];
	        var hasProto = { value: false };
	        while (!this.match('}')) {
	            properties.push(this.parseObjectProperty(hasProto));
	            if (!this.match('}')) {
	                this.expectCommaSeparator();
	            }
	        }
	        this.expect('}');
	        return this.finalize(node, new Node.ObjectExpression(properties));
	    };
	    // https://tc39.github.io/ecma262/#sec-template-literals
	    Parser.prototype.parseTemplateHead = function () {
	        assert_1.assert(this.lookahead.head, 'Template literal must start with a template head');
	        var node = this.createNode();
	        var token = this.nextToken();
	        var raw = token.value;
	        var cooked = token.cooked;
	        return this.finalize(node, new Node.TemplateElement({ raw: raw, cooked: cooked }, token.tail));
	    };
	    Parser.prototype.parseTemplateElement = function () {
	        if (this.lookahead.type !== 10 /* Template */) {
	            this.throwUnexpectedToken();
	        }
	        var node = this.createNode();
	        var token = this.nextToken();
	        var raw = token.value;
	        var cooked = token.cooked;
	        return this.finalize(node, new Node.TemplateElement({ raw: raw, cooked: cooked }, token.tail));
	    };
	    Parser.prototype.parseTemplateLiteral = function () {
	        var node = this.createNode();
	        var expressions = [];
	        var quasis = [];
	        var quasi = this.parseTemplateHead();
	        quasis.push(quasi);
	        while (!quasi.tail) {
	            expressions.push(this.parseExpression());
	            quasi = this.parseTemplateElement();
	            quasis.push(quasi);
	        }
	        return this.finalize(node, new Node.TemplateLiteral(quasis, expressions));
	    };
	    // https://tc39.github.io/ecma262/#sec-grouping-operator
	    Parser.prototype.reinterpretExpressionAsPattern = function (expr) {
	        switch (expr.type) {
	            case syntax_1.Syntax.Identifier:
	            case syntax_1.Syntax.MemberExpression:
	            case syntax_1.Syntax.RestElement:
	            case syntax_1.Syntax.AssignmentPattern:
	                break;
	            case syntax_1.Syntax.SpreadElement:
	                expr.type = syntax_1.Syntax.RestElement;
	                this.reinterpretExpressionAsPattern(expr.argument);
	                break;
	            case syntax_1.Syntax.ArrayExpression:
	                expr.type = syntax_1.Syntax.ArrayPattern;
	                for (var i = 0; i < expr.elements.length; i++) {
	                    if (expr.elements[i] !== null) {
	                        this.reinterpretExpressionAsPattern(expr.elements[i]);
	                    }
	                }
	                break;
	            case syntax_1.Syntax.ObjectExpression:
	                expr.type = syntax_1.Syntax.ObjectPattern;
	                for (var i = 0; i < expr.properties.length; i++) {
	                    this.reinterpretExpressionAsPattern(expr.properties[i].value);
	                }
	                break;
	            case syntax_1.Syntax.AssignmentExpression:
	                expr.type = syntax_1.Syntax.AssignmentPattern;
	                delete expr.operator;
	                this.reinterpretExpressionAsPattern(expr.left);
	                break;
	            default:
	                // Allow other node type for tolerant parsing.
	                break;
	        }
	    };
	    Parser.prototype.parseGroupExpression = function () {
	        var expr;
	        this.expect('(');
	        if (this.match(')')) {
	            this.nextToken();
	            if (!this.match('=>')) {
	                this.expect('=>');
	            }
	            expr = {
	                type: ArrowParameterPlaceHolder,
	                params: [],
	                async: false
	            };
	        }
	        else {
	            var startToken = this.lookahead;
	            var params = [];
	            if (this.match('...')) {
	                expr = this.parseRestElement(params);
	                this.expect(')');
	                if (!this.match('=>')) {
	                    this.expect('=>');
	                }
	                expr = {
	                    type: ArrowParameterPlaceHolder,
	                    params: [expr],
	                    async: false
	                };
	            }
	            else {
	                var arrow = false;
	                this.context.isBindingElement = true;
	                expr = this.inheritCoverGrammar(this.parseAssignmentExpression);
	                if (this.match(',')) {
	                    var expressions = [];
	                    this.context.isAssignmentTarget = false;
	                    expressions.push(expr);
	                    while (this.lookahead.type !== 2 /* EOF */) {
	                        if (!this.match(',')) {
	                            break;
	                        }
	                        this.nextToken();
	                        if (this.match(')')) {
	                            this.nextToken();
	                            for (var i = 0; i < expressions.length; i++) {
	                                this.reinterpretExpressionAsPattern(expressions[i]);
	                            }
	                            arrow = true;
	                            expr = {
	                                type: ArrowParameterPlaceHolder,
	                                params: expressions,
	                                async: false
	                            };
	                        }
	                        else if (this.match('...')) {
	                            if (!this.context.isBindingElement) {
	                                this.throwUnexpectedToken(this.lookahead);
	                            }
	                            expressions.push(this.parseRestElement(params));
	                            this.expect(')');
	                            if (!this.match('=>')) {
	                                this.expect('=>');
	                            }
	                            this.context.isBindingElement = false;
	                            for (var i = 0; i < expressions.length; i++) {
	                                this.reinterpretExpressionAsPattern(expressions[i]);
	                            }
	                            arrow = true;
	                            expr = {
	                                type: ArrowParameterPlaceHolder,
	                                params: expressions,
	                                async: false
	                            };
	                        }
	                        else {
	                            expressions.push(this.inheritCoverGrammar(this.parseAssignmentExpression));
	                        }
	                        if (arrow) {
	                            break;
	                        }
	                    }
	                    if (!arrow) {
	                        expr = this.finalize(this.startNode(startToken), new Node.SequenceExpression(expressions));
	                    }
	                }
	                if (!arrow) {
	                    this.expect(')');
	                    if (this.match('=>')) {
	                        if (expr.type === syntax_1.Syntax.Identifier && expr.name === 'yield') {
	                            arrow = true;
	                            expr = {
	                                type: ArrowParameterPlaceHolder,
	                                params: [expr],
	                                async: false
	                            };
	                        }
	                        if (!arrow) {
	                            if (!this.context.isBindingElement) {
	                                this.throwUnexpectedToken(this.lookahead);
	                            }
	                            if (expr.type === syntax_1.Syntax.SequenceExpression) {
	                                for (var i = 0; i < expr.expressions.length; i++) {
	                                    this.reinterpretExpressionAsPattern(expr.expressions[i]);
	                                }
	                            }
	                            else {
	                                this.reinterpretExpressionAsPattern(expr);
	                            }
	                            var parameters = (expr.type === syntax_1.Syntax.SequenceExpression ? expr.expressions : [expr]);
	                            expr = {
	                                type: ArrowParameterPlaceHolder,
	                                params: parameters,
	                                async: false
	                            };
	                        }
	                    }
	                    this.context.isBindingElement = false;
	                }
	            }
	        }
	        return expr;
	    };
	    // https://tc39.github.io/ecma262/#sec-left-hand-side-expressions
	    Parser.prototype.parseArguments = function () {
	        this.expect('(');
	        var args = [];
	        if (!this.match(')')) {
	            while (true) {
	                var expr = this.match('...') ? this.parseSpreadElement() :
	                    this.isolateCoverGrammar(this.parseAssignmentExpression);
	                args.push(expr);
	                if (this.match(')')) {
	                    break;
	                }
	                this.expectCommaSeparator();
	                if (this.match(')')) {
	                    break;
	                }
	            }
	        }
	        this.expect(')');
	        return args;
	    };
	    Parser.prototype.isIdentifierName = function (token) {
	        return token.type === 3 /* Identifier */ ||
	            token.type === 4 /* Keyword */ ||
	            token.type === 1 /* BooleanLiteral */ ||
	            token.type === 5 /* NullLiteral */;
	    };
	    Parser.prototype.parseIdentifierName = function () {
	        var node = this.createNode();
	        var token = this.nextToken();
	        if (!this.isIdentifierName(token)) {
	            this.throwUnexpectedToken(token);
	        }
	        return this.finalize(node, new Node.Identifier(token.value));
	    };
	    Parser.prototype.parseNewExpression = function () {
	        var node = this.createNode();
	        var id = this.parseIdentifierName();
	        assert_1.assert(id.name === 'new', 'New expression must start with `new`');
	        var expr;
	        if (this.match('.')) {
	            this.nextToken();
	            if (this.lookahead.type === 3 /* Identifier */ && this.context.inFunctionBody && this.lookahead.value === 'target') {
	                var property = this.parseIdentifierName();
	                expr = new Node.MetaProperty(id, property);
	            }
	            else {
	                this.throwUnexpectedToken(this.lookahead);
	            }
	        }
	        else {
	            var callee = this.isolateCoverGrammar(this.parseLeftHandSideExpression);
	            var args = this.match('(') ? this.parseArguments() : [];
	            expr = new Node.NewExpression(callee, args);
	            this.context.isAssignmentTarget = false;
	            this.context.isBindingElement = false;
	        }
	        return this.finalize(node, expr);
	    };
	    Parser.prototype.parseAsyncArgument = function () {
	        var arg = this.parseAssignmentExpression();
	        this.context.firstCoverInitializedNameError = null;
	        return arg;
	    };
	    Parser.prototype.parseAsyncArguments = function () {
	        this.expect('(');
	        var args = [];
	        if (!this.match(')')) {
	            while (true) {
	                var expr = this.match('...') ? this.parseSpreadElement() :
	                    this.isolateCoverGrammar(this.parseAsyncArgument);
	                args.push(expr);
	                if (this.match(')')) {
	                    break;
	                }
	                this.expectCommaSeparator();
	                if (this.match(')')) {
	                    break;
	                }
	            }
	        }
	        this.expect(')');
	        return args;
	    };
	    Parser.prototype.parseLeftHandSideExpressionAllowCall = function () {
	        var startToken = this.lookahead;
	        var maybeAsync = this.matchContextualKeyword('async');
	        var previousAllowIn = this.context.allowIn;
	        this.context.allowIn = true;
	        var expr;
	        if (this.matchKeyword('super') && this.context.inFunctionBody) {
	            expr = this.createNode();
	            this.nextToken();
	            expr = this.finalize(expr, new Node.Super());
	            if (!this.match('(') && !this.match('.') && !this.match('[')) {
	                this.throwUnexpectedToken(this.lookahead);
	            }
	        }
	        else {
	            expr = this.inheritCoverGrammar(this.matchKeyword('new') ? this.parseNewExpression : this.parsePrimaryExpression);
	        }
	        while (true) {
	            if (this.match('.')) {
	                this.context.isBindingElement = false;
	                this.context.isAssignmentTarget = true;
	                this.expect('.');
	                var property = this.parseIdentifierName();
	                expr = this.finalize(this.startNode(startToken), new Node.StaticMemberExpression(expr, property));
	            }
	            else if (this.match('(')) {
	                var asyncArrow = maybeAsync && (startToken.lineNumber === this.lookahead.lineNumber);
	                this.context.isBindingElement = false;
	                this.context.isAssignmentTarget = false;
	                var args = asyncArrow ? this.parseAsyncArguments() : this.parseArguments();
	                expr = this.finalize(this.startNode(startToken), new Node.CallExpression(expr, args));
	                if (asyncArrow && this.match('=>')) {
	                    for (var i = 0; i < args.length; ++i) {
	                        this.reinterpretExpressionAsPattern(args[i]);
	                    }
	                    expr = {
	                        type: ArrowParameterPlaceHolder,
	                        params: args,
	                        async: true
	                    };
	                }
	            }
	            else if (this.match('[')) {
	                this.context.isBindingElement = false;
	                this.context.isAssignmentTarget = true;
	                this.expect('[');
	                var property = this.isolateCoverGrammar(this.parseExpression);
	                this.expect(']');
	                expr = this.finalize(this.startNode(startToken), new Node.ComputedMemberExpression(expr, property));
	            }
	            else if (this.lookahead.type === 10 /* Template */ && this.lookahead.head) {
	                var quasi = this.parseTemplateLiteral();
	                expr = this.finalize(this.startNode(startToken), new Node.TaggedTemplateExpression(expr, quasi));
	            }
	            else {
	                break;
	            }
	        }
	        this.context.allowIn = previousAllowIn;
	        return expr;
	    };
	    Parser.prototype.parseSuper = function () {
	        var node = this.createNode();
	        this.expectKeyword('super');
	        if (!this.match('[') && !this.match('.')) {
	            this.throwUnexpectedToken(this.lookahead);
	        }
	        return this.finalize(node, new Node.Super());
	    };
	    Parser.prototype.parseLeftHandSideExpression = function () {
	        assert_1.assert(this.context.allowIn, 'callee of new expression always allow in keyword.');
	        var node = this.startNode(this.lookahead);
	        var expr = (this.matchKeyword('super') && this.context.inFunctionBody) ? this.parseSuper() :
	            this.inheritCoverGrammar(this.matchKeyword('new') ? this.parseNewExpression : this.parsePrimaryExpression);
	        while (true) {
	            if (this.match('[')) {
	                this.context.isBindingElement = false;
	                this.context.isAssignmentTarget = true;
	                this.expect('[');
	                var property = this.isolateCoverGrammar(this.parseExpression);
	                this.expect(']');
	                expr = this.finalize(node, new Node.ComputedMemberExpression(expr, property));
	            }
	            else if (this.match('.')) {
	                this.context.isBindingElement = false;
	                this.context.isAssignmentTarget = true;
	                this.expect('.');
	                var property = this.parseIdentifierName();
	                expr = this.finalize(node, new Node.StaticMemberExpression(expr, property));
	            }
	            else if (this.lookahead.type === 10 /* Template */ && this.lookahead.head) {
	                var quasi = this.parseTemplateLiteral();
	                expr = this.finalize(node, new Node.TaggedTemplateExpression(expr, quasi));
	            }
	            else {
	                break;
	            }
	        }
	        return expr;
	    };
	    // https://tc39.github.io/ecma262/#sec-update-expressions
	    Parser.prototype.parseUpdateExpression = function () {
	        var expr;
	        var startToken = this.lookahead;
	        if (this.match('++') || this.match('--')) {
	            var node = this.startNode(startToken);
	            var token = this.nextToken();
	            expr = this.inheritCoverGrammar(this.parseUnaryExpression);
	            if (this.context.strict && expr.type === syntax_1.Syntax.Identifier && this.scanner.isRestrictedWord(expr.name)) {
	                this.tolerateError(messages_1.Messages.StrictLHSPrefix);
	            }
	            if (!this.context.isAssignmentTarget) {
	                this.tolerateError(messages_1.Messages.InvalidLHSInAssignment);
	            }
	            var prefix = true;
	            expr = this.finalize(node, new Node.UpdateExpression(token.value, expr, prefix));
	            this.context.isAssignmentTarget = false;
	            this.context.isBindingElement = false;
	        }
	        else {
	            expr = this.inheritCoverGrammar(this.parseLeftHandSideExpressionAllowCall);
	            if (!this.hasLineTerminator && this.lookahead.type === 7 /* Punctuator */) {
	                if (this.match('++') || this.match('--')) {
	                    if (this.context.strict && expr.type === syntax_1.Syntax.Identifier && this.scanner.isRestrictedWord(expr.name)) {
	                        this.tolerateError(messages_1.Messages.StrictLHSPostfix);
	                    }
	                    if (!this.context.isAssignmentTarget) {
	                        this.tolerateError(messages_1.Messages.InvalidLHSInAssignment);
	                    }
	                    this.context.isAssignmentTarget = false;
	                    this.context.isBindingElement = false;
	                    var operator = this.nextToken().value;
	                    var prefix = false;
	                    expr = this.finalize(this.startNode(startToken), new Node.UpdateExpression(operator, expr, prefix));
	                }
	            }
	        }
	        return expr;
	    };
	    // https://tc39.github.io/ecma262/#sec-unary-operators
	    Parser.prototype.parseAwaitExpression = function () {
	        var node = this.createNode();
	        this.nextToken();
	        var argument = this.parseUnaryExpression();
	        return this.finalize(node, new Node.AwaitExpression(argument));
	    };
	    Parser.prototype.parseUnaryExpression = function () {
	        var expr;
	        if (this.match('+') || this.match('-') || this.match('~') || this.match('!') ||
	            this.matchKeyword('delete') || this.matchKeyword('void') || this.matchKeyword('typeof')) {
	            var node = this.startNode(this.lookahead);
	            var token = this.nextToken();
	            expr = this.inheritCoverGrammar(this.parseUnaryExpression);
	            expr = this.finalize(node, new Node.UnaryExpression(token.value, expr));
	            if (this.context.strict && expr.operator === 'delete' && expr.argument.type === syntax_1.Syntax.Identifier) {
	                this.tolerateError(messages_1.Messages.StrictDelete);
	            }
	            this.context.isAssignmentTarget = false;
	            this.context.isBindingElement = false;
	        }
	        else if (this.context.await && this.matchContextualKeyword('await')) {
	            expr = this.parseAwaitExpression();
	        }
	        else {
	            expr = this.parseUpdateExpression();
	        }
	        return expr;
	    };
	    Parser.prototype.parseExponentiationExpression = function () {
	        var startToken = this.lookahead;
	        var expr = this.inheritCoverGrammar(this.parseUnaryExpression);
	        if (expr.type !== syntax_1.Syntax.UnaryExpression && this.match('**')) {
	            this.nextToken();
	            this.context.isAssignmentTarget = false;
	            this.context.isBindingElement = false;
	            var left = expr;
	            var right = this.isolateCoverGrammar(this.parseExponentiationExpression);
	            expr = this.finalize(this.startNode(startToken), new Node.BinaryExpression('**', left, right));
	        }
	        return expr;
	    };
	    // https://tc39.github.io/ecma262/#sec-exp-operator
	    // https://tc39.github.io/ecma262/#sec-multiplicative-operators
	    // https://tc39.github.io/ecma262/#sec-additive-operators
	    // https://tc39.github.io/ecma262/#sec-bitwise-shift-operators
	    // https://tc39.github.io/ecma262/#sec-relational-operators
	    // https://tc39.github.io/ecma262/#sec-equality-operators
	    // https://tc39.github.io/ecma262/#sec-binary-bitwise-operators
	    // https://tc39.github.io/ecma262/#sec-binary-logical-operators
	    Parser.prototype.binaryPrecedence = function (token) {
	        var op = token.value;
	        var precedence;
	        if (token.type === 7 /* Punctuator */) {
	            precedence = this.operatorPrecedence[op] || 0;
	        }
	        else if (token.type === 4 /* Keyword */) {
	            precedence = (op === 'instanceof' || (this.context.allowIn && op === 'in')) ? 7 : 0;
	        }
	        else {
	            precedence = 0;
	        }
	        return precedence;
	    };
	    Parser.prototype.parseBinaryExpression = function () {
	        var startToken = this.lookahead;
	        var expr = this.inheritCoverGrammar(this.parseExponentiationExpression);
	        var token = this.lookahead;
	        var prec = this.binaryPrecedence(token);
	        if (prec > 0) {
	            this.nextToken();
	            this.context.isAssignmentTarget = false;
	            this.context.isBindingElement = false;
	            var markers = [startToken, this.lookahead];
	            var left = expr;
	            var right = this.isolateCoverGrammar(this.parseExponentiationExpression);
	            var stack = [left, token.value, right];
	            var precedences = [prec];
	            while (true) {
	                prec = this.binaryPrecedence(this.lookahead);
	                if (prec <= 0) {
	                    break;
	                }
	                // Reduce: make a binary expression from the three topmost entries.
	                while ((stack.length > 2) && (prec <= precedences[precedences.length - 1])) {
	                    right = stack.pop();
	                    var operator = stack.pop();
	                    precedences.pop();
	                    left = stack.pop();
	                    markers.pop();
	                    var node = this.startNode(markers[markers.length - 1]);
	                    stack.push(this.finalize(node, new Node.BinaryExpression(operator, left, right)));
	                }
	                // Shift.
	                stack.push(this.nextToken().value);
	                precedences.push(prec);
	                markers.push(this.lookahead);
	                stack.push(this.isolateCoverGrammar(this.parseExponentiationExpression));
	            }
	            // Final reduce to clean-up the stack.
	            var i = stack.length - 1;
	            expr = stack[i];
	            markers.pop();
	            while (i > 1) {
	                var node = this.startNode(markers.pop());
	                var operator = stack[i - 1];
	                expr = this.finalize(node, new Node.BinaryExpression(operator, stack[i - 2], expr));
	                i -= 2;
	            }
	        }
	        return expr;
	    };
	    // https://tc39.github.io/ecma262/#sec-conditional-operator
	    Parser.prototype.parseConditionalExpression = function () {
	        var startToken = this.lookahead;
	        var expr = this.inheritCoverGrammar(this.parseBinaryExpression);
	        if (this.match('?')) {
	            this.nextToken();
	            var previousAllowIn = this.context.allowIn;
	            this.context.allowIn = true;
	            var consequent = this.isolateCoverGrammar(this.parseAssignmentExpression);
	            this.context.allowIn = previousAllowIn;
	            this.expect(':');
	            var alternate = this.isolateCoverGrammar(this.parseAssignmentExpression);
	            expr = this.finalize(this.startNode(startToken), new Node.ConditionalExpression(expr, consequent, alternate));
	            this.context.isAssignmentTarget = false;
	            this.context.isBindingElement = false;
	        }
	        return expr;
	    };
	    // https://tc39.github.io/ecma262/#sec-assignment-operators
	    Parser.prototype.checkPatternParam = function (options, param) {
	        switch (param.type) {
	            case syntax_1.Syntax.Identifier:
	                this.validateParam(options, param, param.name);
	                break;
	            case syntax_1.Syntax.RestElement:
	                this.checkPatternParam(options, param.argument);
	                break;
	            case syntax_1.Syntax.AssignmentPattern:
	                this.checkPatternParam(options, param.left);
	                break;
	            case syntax_1.Syntax.ArrayPattern:
	                for (var i = 0; i < param.elements.length; i++) {
	                    if (param.elements[i] !== null) {
	                        this.checkPatternParam(options, param.elements[i]);
	                    }
	                }
	                break;
	            case syntax_1.Syntax.ObjectPattern:
	                for (var i = 0; i < param.properties.length; i++) {
	                    this.checkPatternParam(options, param.properties[i].value);
	                }
	                break;
	            default:
	                break;
	        }
	        options.simple = options.simple && (param instanceof Node.Identifier);
	    };
	    Parser.prototype.reinterpretAsCoverFormalsList = function (expr) {
	        var params = [expr];
	        var options;
	        var asyncArrow = false;
	        switch (expr.type) {
	            case syntax_1.Syntax.Identifier:
	                break;
	            case ArrowParameterPlaceHolder:
	                params = expr.params;
	                asyncArrow = expr.async;
	                break;
	            default:
	                return null;
	        }
	        options = {
	            simple: true,
	            paramSet: {}
	        };
	        for (var i = 0; i < params.length; ++i) {
	            var param = params[i];
	            if (param.type === syntax_1.Syntax.AssignmentPattern) {
	                if (param.right.type === syntax_1.Syntax.YieldExpression) {
	                    if (param.right.argument) {
	                        this.throwUnexpectedToken(this.lookahead);
	                    }
	                    param.right.type = syntax_1.Syntax.Identifier;
	                    param.right.name = 'yield';
	                    delete param.right.argument;
	                    delete param.right.delegate;
	                }
	            }
	            else if (asyncArrow && param.type === syntax_1.Syntax.Identifier && param.name === 'await') {
	                this.throwUnexpectedToken(this.lookahead);
	            }
	            this.checkPatternParam(options, param);
	            params[i] = param;
	        }
	        if (this.context.strict || !this.context.allowYield) {
	            for (var i = 0; i < params.length; ++i) {
	                var param = params[i];
	                if (param.type === syntax_1.Syntax.YieldExpression) {
	                    this.throwUnexpectedToken(this.lookahead);
	                }
	            }
	        }
	        if (options.message === messages_1.Messages.StrictParamDupe) {
	            var token = this.context.strict ? options.stricted : options.firstRestricted;
	            this.throwUnexpectedToken(token, options.message);
	        }
	        return {
	            simple: options.simple,
	            params: params,
	            stricted: options.stricted,
	            firstRestricted: options.firstRestricted,
	            message: options.message
	        };
	    };
	    Parser.prototype.parseAssignmentExpression = function () {
	        var expr;
	        if (!this.context.allowYield && this.matchKeyword('yield')) {
	            expr = this.parseYieldExpression();
	        }
	        else {
	            var startToken = this.lookahead;
	            var token = startToken;
	            expr = this.parseConditionalExpression();
	            if (token.type === 3 /* Identifier */ && (token.lineNumber === this.lookahead.lineNumber) && token.value === 'async') {
	                if (this.lookahead.type === 3 /* Identifier */ || this.matchKeyword('yield')) {
	                    var arg = this.parsePrimaryExpression();
	                    this.reinterpretExpressionAsPattern(arg);
	                    expr = {
	                        type: ArrowParameterPlaceHolder,
	                        params: [arg],
	                        async: true
	                    };
	                }
	            }
	            if (expr.type === ArrowParameterPlaceHolder || this.match('=>')) {
	                // https://tc39.github.io/ecma262/#sec-arrow-function-definitions
	                this.context.isAssignmentTarget = false;
	                this.context.isBindingElement = false;
	                var isAsync = expr.async;
	                var list = this.reinterpretAsCoverFormalsList(expr);
	                if (list) {
	                    if (this.hasLineTerminator) {
	                        this.tolerateUnexpectedToken(this.lookahead);
	                    }
	                    this.context.firstCoverInitializedNameError = null;
	                    var previousStrict = this.context.strict;
	                    var previousAllowStrictDirective = this.context.allowStrictDirective;
	                    this.context.allowStrictDirective = list.simple;
	                    var previousAllowYield = this.context.allowYield;
	                    var previousAwait = this.context.await;
	                    this.context.allowYield = true;
	                    this.context.await = isAsync;
	                    var node = this.startNode(startToken);
	                    this.expect('=>');
	                    var body = void 0;
	                    if (this.match('{')) {
	                        var previousAllowIn = this.context.allowIn;
	                        this.context.allowIn = true;
	                        body = this.parseFunctionSourceElements();
	                        this.context.allowIn = previousAllowIn;
	                    }
	                    else {
	                        body = this.isolateCoverGrammar(this.parseAssignmentExpression);
	                    }
	                    var expression = body.type !== syntax_1.Syntax.BlockStatement;
	                    if (this.context.strict && list.firstRestricted) {
	                        this.throwUnexpectedToken(list.firstRestricted, list.message);
	                    }
	                    if (this.context.strict && list.stricted) {
	                        this.tolerateUnexpectedToken(list.stricted, list.message);
	                    }
	                    expr = isAsync ? this.finalize(node, new Node.AsyncArrowFunctionExpression(list.params, body, expression)) :
	                        this.finalize(node, new Node.ArrowFunctionExpression(list.params, body, expression));
	                    this.context.strict = previousStrict;
	                    this.context.allowStrictDirective = previousAllowStrictDirective;
	                    this.context.allowYield = previousAllowYield;
	                    this.context.await = previousAwait;
	                }
	            }
	            else {
	                if (this.matchAssign()) {
	                    if (!this.context.isAssignmentTarget) {
	                        this.tolerateError(messages_1.Messages.InvalidLHSInAssignment);
	                    }
	                    if (this.context.strict && expr.type === syntax_1.Syntax.Identifier) {
	                        var id = expr;
	                        if (this.scanner.isRestrictedWord(id.name)) {
	                            this.tolerateUnexpectedToken(token, messages_1.Messages.StrictLHSAssignment);
	                        }
	                        if (this.scanner.isStrictModeReservedWord(id.name)) {
	                            this.tolerateUnexpectedToken(token, messages_1.Messages.StrictReservedWord);
	                        }
	                    }
	                    if (!this.match('=')) {
	                        this.context.isAssignmentTarget = false;
	                        this.context.isBindingElement = false;
	                    }
	                    else {
	                        this.reinterpretExpressionAsPattern(expr);
	                    }
	                    token = this.nextToken();
	                    var operator = token.value;
	                    var right = this.isolateCoverGrammar(this.parseAssignmentExpression);
	                    expr = this.finalize(this.startNode(startToken), new Node.AssignmentExpression(operator, expr, right));
	                    this.context.firstCoverInitializedNameError = null;
	                }
	            }
	        }
	        return expr;
	    };
	    // https://tc39.github.io/ecma262/#sec-comma-operator
	    Parser.prototype.parseExpression = function () {
	        var startToken = this.lookahead;
	        var expr = this.isolateCoverGrammar(this.parseAssignmentExpression);
	        if (this.match(',')) {
	            var expressions = [];
	            expressions.push(expr);
	            while (this.lookahead.type !== 2 /* EOF */) {
	                if (!this.match(',')) {
	                    break;
	                }
	                this.nextToken();
	                expressions.push(this.isolateCoverGrammar(this.parseAssignmentExpression));
	            }
	            expr = this.finalize(this.startNode(startToken), new Node.SequenceExpression(expressions));
	        }
	        return expr;
	    };
	    // https://tc39.github.io/ecma262/#sec-block
	    Parser.prototype.parseStatementListItem = function () {
	        var statement;
	        this.context.isAssignmentTarget = true;
	        this.context.isBindingElement = true;
	        if (this.lookahead.type === 4 /* Keyword */) {
	            switch (this.lookahead.value) {
	                case 'export':
	                    if (!this.context.isModule) {
	                        this.tolerateUnexpectedToken(this.lookahead, messages_1.Messages.IllegalExportDeclaration);
	                    }
	                    statement = this.parseExportDeclaration();
	                    break;
	                case 'import':
	                    if (!this.context.isModule) {
	                        this.tolerateUnexpectedToken(this.lookahead, messages_1.Messages.IllegalImportDeclaration);
	                    }
	                    statement = this.parseImportDeclaration();
	                    break;
	                case 'const':
	                    statement = this.parseLexicalDeclaration({ inFor: false });
	                    break;
	                case 'function':
	                    statement = this.parseFunctionDeclaration();
	                    break;
	                case 'class':
	                    statement = this.parseClassDeclaration();
	                    break;
	                case 'let':
	                    statement = this.isLexicalDeclaration() ? this.parseLexicalDeclaration({ inFor: false }) : this.parseStatement();
	                    break;
	                default:
	                    statement = this.parseStatement();
	                    break;
	            }
	        }
	        else {
	            statement = this.parseStatement();
	        }
	        return statement;
	    };
	    Parser.prototype.parseBlock = function () {
	        var node = this.createNode();
	        this.expect('{');
	        var block = [];
	        while (true) {
	            if (this.match('}')) {
	                break;
	            }
	            block.push(this.parseStatementListItem());
	        }
	        this.expect('}');
	        return this.finalize(node, new Node.BlockStatement(block));
	    };
	    // https://tc39.github.io/ecma262/#sec-let-and-const-declarations
	    Parser.prototype.parseLexicalBinding = function (kind, options) {
	        var node = this.createNode();
	        var params = [];
	        var id = this.parsePattern(params, kind);
	        if (this.context.strict && id.type === syntax_1.Syntax.Identifier) {
	            if (this.scanner.isRestrictedWord(id.name)) {
	                this.tolerateError(messages_1.Messages.StrictVarName);
	            }
	        }
	        var init = null;
	        if (kind === 'const') {
	            if (!this.matchKeyword('in') && !this.matchContextualKeyword('of')) {
	                if (this.match('=')) {
	                    this.nextToken();
	                    init = this.isolateCoverGrammar(this.parseAssignmentExpression);
	                }
	                else {
	                    this.throwError(messages_1.Messages.DeclarationMissingInitializer, 'const');
	                }
	            }
	        }
	        else if ((!options.inFor && id.type !== syntax_1.Syntax.Identifier) || this.match('=')) {
	            this.expect('=');
	            init = this.isolateCoverGrammar(this.parseAssignmentExpression);
	        }
	        return this.finalize(node, new Node.VariableDeclarator(id, init));
	    };
	    Parser.prototype.parseBindingList = function (kind, options) {
	        var list = [this.parseLexicalBinding(kind, options)];
	        while (this.match(',')) {
	            this.nextToken();
	            list.push(this.parseLexicalBinding(kind, options));
	        }
	        return list;
	    };
	    Parser.prototype.isLexicalDeclaration = function () {
	        var state = this.scanner.saveState();
	        this.scanner.scanComments();
	        var next = this.scanner.lex();
	        this.scanner.restoreState(state);
	        return (next.type === 3 /* Identifier */) ||
	            (next.type === 7 /* Punctuator */ && next.value === '[') ||
	            (next.type === 7 /* Punctuator */ && next.value === '{') ||
	            (next.type === 4 /* Keyword */ && next.value === 'let') ||
	            (next.type === 4 /* Keyword */ && next.value === 'yield');
	    };
	    Parser.prototype.parseLexicalDeclaration = function (options) {
	        var node = this.createNode();
	        var kind = this.nextToken().value;
	        assert_1.assert(kind === 'let' || kind === 'const', 'Lexical declaration must be either let or const');
	        var declarations = this.parseBindingList(kind, options);
	        this.consumeSemicolon();
	        return this.finalize(node, new Node.VariableDeclaration(declarations, kind));
	    };
	    // https://tc39.github.io/ecma262/#sec-destructuring-binding-patterns
	    Parser.prototype.parseBindingRestElement = function (params, kind) {
	        var node = this.createNode();
	        this.expect('...');
	        var arg = this.parsePattern(params, kind);
	        return this.finalize(node, new Node.RestElement(arg));
	    };
	    Parser.prototype.parseArrayPattern = function (params, kind) {
	        var node = this.createNode();
	        this.expect('[');
	        var elements = [];
	        while (!this.match(']')) {
	            if (this.match(',')) {
	                this.nextToken();
	                elements.push(null);
	            }
	            else {
	                if (this.match('...')) {
	                    elements.push(this.parseBindingRestElement(params, kind));
	                    break;
	                }
	                else {
	                    elements.push(this.parsePatternWithDefault(params, kind));
	                }
	                if (!this.match(']')) {
	                    this.expect(',');
	                }
	            }
	        }
	        this.expect(']');
	        return this.finalize(node, new Node.ArrayPattern(elements));
	    };
	    Parser.prototype.parsePropertyPattern = function (params, kind) {
	        var node = this.createNode();
	        var computed = false;
	        var shorthand = false;
	        var method = false;
	        var key;
	        var value;
	        if (this.lookahead.type === 3 /* Identifier */) {
	            var keyToken = this.lookahead;
	            key = this.parseVariableIdentifier();
	            var init = this.finalize(node, new Node.Identifier(keyToken.value));
	            if (this.match('=')) {
	                params.push(keyToken);
	                shorthand = true;
	                this.nextToken();
	                var expr = this.parseAssignmentExpression();
	                value = this.finalize(this.startNode(keyToken), new Node.AssignmentPattern(init, expr));
	            }
	            else if (!this.match(':')) {
	                params.push(keyToken);
	                shorthand = true;
	                value = init;
	            }
	            else {
	                this.expect(':');
	                value = this.parsePatternWithDefault(params, kind);
	            }
	        }
	        else {
	            computed = this.match('[');
	            key = this.parseObjectPropertyKey();
	            this.expect(':');
	            value = this.parsePatternWithDefault(params, kind);
	        }
	        return this.finalize(node, new Node.Property('init', key, computed, value, method, shorthand));
	    };
	    Parser.prototype.parseObjectPattern = function (params, kind) {
	        var node = this.createNode();
	        var properties = [];
	        this.expect('{');
	        while (!this.match('}')) {
	            properties.push(this.parsePropertyPattern(params, kind));
	            if (!this.match('}')) {
	                this.expect(',');
	            }
	        }
	        this.expect('}');
	        return this.finalize(node, new Node.ObjectPattern(properties));
	    };
	    Parser.prototype.parsePattern = function (params, kind) {
	        var pattern;
	        if (this.match('[')) {
	            pattern = this.parseArrayPattern(params, kind);
	        }
	        else if (this.match('{')) {
	            pattern = this.parseObjectPattern(params, kind);
	        }
	        else {
	            if (this.matchKeyword('let') && (kind === 'const' || kind === 'let')) {
	                this.tolerateUnexpectedToken(this.lookahead, messages_1.Messages.LetInLexicalBinding);
	            }
	            params.push(this.lookahead);
	            pattern = this.parseVariableIdentifier(kind);
	        }
	        return pattern;
	    };
	    Parser.prototype.parsePatternWithDefault = function (params, kind) {
	        var startToken = this.lookahead;
	        var pattern = this.parsePattern(params, kind);
	        if (this.match('=')) {
	            this.nextToken();
	            var previousAllowYield = this.context.allowYield;
	            this.context.allowYield = true;
	            var right = this.isolateCoverGrammar(this.parseAssignmentExpression);
	            this.context.allowYield = previousAllowYield;
	            pattern = this.finalize(this.startNode(startToken), new Node.AssignmentPattern(pattern, right));
	        }
	        return pattern;
	    };
	    // https://tc39.github.io/ecma262/#sec-variable-statement
	    Parser.prototype.parseVariableIdentifier = function (kind) {
	        var node = this.createNode();
	        var token = this.nextToken();
	        if (token.type === 4 /* Keyword */ && token.value === 'yield') {
	            if (this.context.strict) {
	                this.tolerateUnexpectedToken(token, messages_1.Messages.StrictReservedWord);
	            }
	            else if (!this.context.allowYield) {
	                this.throwUnexpectedToken(token);
	            }
	        }
	        else if (token.type !== 3 /* Identifier */) {
	            if (this.context.strict && token.type === 4 /* Keyword */ && this.scanner.isStrictModeReservedWord(token.value)) {
	                this.tolerateUnexpectedToken(token, messages_1.Messages.StrictReservedWord);
	            }
	            else {
	                if (this.context.strict || token.value !== 'let' || kind !== 'var') {
	                    this.throwUnexpectedToken(token);
	                }
	            }
	        }
	        else if ((this.context.isModule || this.context.await) && token.type === 3 /* Identifier */ && token.value === 'await') {
	            this.tolerateUnexpectedToken(token);
	        }
	        return this.finalize(node, new Node.Identifier(token.value));
	    };
	    Parser.prototype.parseVariableDeclaration = function (options) {
	        var node = this.createNode();
	        var params = [];
	        var id = this.parsePattern(params, 'var');
	        if (this.context.strict && id.type === syntax_1.Syntax.Identifier) {
	            if (this.scanner.isRestrictedWord(id.name)) {
	                this.tolerateError(messages_1.Messages.StrictVarName);
	            }
	        }
	        var init = null;
	        if (this.match('=')) {
	            this.nextToken();
	            init = this.isolateCoverGrammar(this.parseAssignmentExpression);
	        }
	        else if (id.type !== syntax_1.Syntax.Identifier && !options.inFor) {
	            this.expect('=');
	        }
	        return this.finalize(node, new Node.VariableDeclarator(id, init));
	    };
	    Parser.prototype.parseVariableDeclarationList = function (options) {
	        var opt = { inFor: options.inFor };
	        var list = [];
	        list.push(this.parseVariableDeclaration(opt));
	        while (this.match(',')) {
	            this.nextToken();
	            list.push(this.parseVariableDeclaration(opt));
	        }
	        return list;
	    };
	    Parser.prototype.parseVariableStatement = function () {
	        var node = this.createNode();
	        this.expectKeyword('var');
	        var declarations = this.parseVariableDeclarationList({ inFor: false });
	        this.consumeSemicolon();
	        return this.finalize(node, new Node.VariableDeclaration(declarations, 'var'));
	    };
	    // https://tc39.github.io/ecma262/#sec-empty-statement
	    Parser.prototype.parseEmptyStatement = function () {
	        var node = this.createNode();
	        this.expect(';');
	        return this.finalize(node, new Node.EmptyStatement());
	    };
	    // https://tc39.github.io/ecma262/#sec-expression-statement
	    Parser.prototype.parseExpressionStatement = function () {
	        var node = this.createNode();
	        var expr = this.parseExpression();
	        this.consumeSemicolon();
	        return this.finalize(node, new Node.ExpressionStatement(expr));
	    };
	    // https://tc39.github.io/ecma262/#sec-if-statement
	    Parser.prototype.parseIfClause = function () {
	        if (this.context.strict && this.matchKeyword('function')) {
	            this.tolerateError(messages_1.Messages.StrictFunction);
	        }
	        return this.parseStatement();
	    };
	    Parser.prototype.parseIfStatement = function () {
	        var node = this.createNode();
	        var consequent;
	        var alternate = null;
	        this.expectKeyword('if');
	        this.expect('(');
	        var test = this.parseExpression();
	        if (!this.match(')') && this.config.tolerant) {
	            this.tolerateUnexpectedToken(this.nextToken());
	            consequent = this.finalize(this.createNode(), new Node.EmptyStatement());
	        }
	        else {
	            this.expect(')');
	            consequent = this.parseIfClause();
	            if (this.matchKeyword('else')) {
	                this.nextToken();
	                alternate = this.parseIfClause();
	            }
	        }
	        return this.finalize(node, new Node.IfStatement(test, consequent, alternate));
	    };
	    // https://tc39.github.io/ecma262/#sec-do-while-statement
	    Parser.prototype.parseDoWhileStatement = function () {
	        var node = this.createNode();
	        this.expectKeyword('do');
	        var previousInIteration = this.context.inIteration;
	        this.context.inIteration = true;
	        var body = this.parseStatement();
	        this.context.inIteration = previousInIteration;
	        this.expectKeyword('while');
	        this.expect('(');
	        var test = this.parseExpression();
	        if (!this.match(')') && this.config.tolerant) {
	            this.tolerateUnexpectedToken(this.nextToken());
	        }
	        else {
	            this.expect(')');
	            if (this.match(';')) {
	                this.nextToken();
	            }
	        }
	        return this.finalize(node, new Node.DoWhileStatement(body, test));
	    };
	    // https://tc39.github.io/ecma262/#sec-while-statement
	    Parser.prototype.parseWhileStatement = function () {
	        var node = this.createNode();
	        var body;
	        this.expectKeyword('while');
	        this.expect('(');
	        var test = this.parseExpression();
	        if (!this.match(')') && this.config.tolerant) {
	            this.tolerateUnexpectedToken(this.nextToken());
	            body = this.finalize(this.createNode(), new Node.EmptyStatement());
	        }
	        else {
	            this.expect(')');
	            var previousInIteration = this.context.inIteration;
	            this.context.inIteration = true;
	            body = this.parseStatement();
	            this.context.inIteration = previousInIteration;
	        }
	        return this.finalize(node, new Node.WhileStatement(test, body));
	    };
	    // https://tc39.github.io/ecma262/#sec-for-statement
	    // https://tc39.github.io/ecma262/#sec-for-in-and-for-of-statements
	    Parser.prototype.parseForStatement = function () {
	        var init = null;
	        var test = null;
	        var update = null;
	        var forIn = true;
	        var left, right;
	        var node = this.createNode();
	        this.expectKeyword('for');
	        this.expect('(');
	        if (this.match(';')) {
	            this.nextToken();
	        }
	        else {
	            if (this.matchKeyword('var')) {
	                init = this.createNode();
	                this.nextToken();
	                var previousAllowIn = this.context.allowIn;
	                this.context.allowIn = false;
	                var declarations = this.parseVariableDeclarationList({ inFor: true });
	                this.context.allowIn = previousAllowIn;
	                if (declarations.length === 1 && this.matchKeyword('in')) {
	                    var decl = declarations[0];
	                    if (decl.init && (decl.id.type === syntax_1.Syntax.ArrayPattern || decl.id.type === syntax_1.Syntax.ObjectPattern || this.context.strict)) {
	                        this.tolerateError(messages_1.Messages.ForInOfLoopInitializer, 'for-in');
	                    }
	                    init = this.finalize(init, new Node.VariableDeclaration(declarations, 'var'));
	                    this.nextToken();
	                    left = init;
	                    right = this.parseExpression();
	                    init = null;
	                }
	                else if (declarations.length === 1 && declarations[0].init === null && this.matchContextualKeyword('of')) {
	                    init = this.finalize(init, new Node.VariableDeclaration(declarations, 'var'));
	                    this.nextToken();
	                    left = init;
	                    right = this.parseAssignmentExpression();
	                    init = null;
	                    forIn = false;
	                }
	                else {
	                    init = this.finalize(init, new Node.VariableDeclaration(declarations, 'var'));
	                    this.expect(';');
	                }
	            }
	            else if (this.matchKeyword('const') || this.matchKeyword('let')) {
	                init = this.createNode();
	                var kind = this.nextToken().value;
	                if (!this.context.strict && this.lookahead.value === 'in') {
	                    init = this.finalize(init, new Node.Identifier(kind));
	                    this.nextToken();
	                    left = init;
	                    right = this.parseExpression();
	                    init = null;
	                }
	                else {
	                    var previousAllowIn = this.context.allowIn;
	                    this.context.allowIn = false;
	                    var declarations = this.parseBindingList(kind, { inFor: true });
	                    this.context.allowIn = previousAllowIn;
	                    if (declarations.length === 1 && declarations[0].init === null && this.matchKeyword('in')) {
	                        init = this.finalize(init, new Node.VariableDeclaration(declarations, kind));
	                        this.nextToken();
	                        left = init;
	                        right = this.parseExpression();
	                        init = null;
	                    }
	                    else if (declarations.length === 1 && declarations[0].init === null && this.matchContextualKeyword('of')) {
	                        init = this.finalize(init, new Node.VariableDeclaration(declarations, kind));
	                        this.nextToken();
	                        left = init;
	                        right = this.parseAssignmentExpression();
	                        init = null;
	                        forIn = false;
	                    }
	                    else {
	                        this.consumeSemicolon();
	                        init = this.finalize(init, new Node.VariableDeclaration(declarations, kind));
	                    }
	                }
	            }
	            else {
	                var initStartToken = this.lookahead;
	                var previousAllowIn = this.context.allowIn;
	                this.context.allowIn = false;
	                init = this.inheritCoverGrammar(this.parseAssignmentExpression);
	                this.context.allowIn = previousAllowIn;
	                if (this.matchKeyword('in')) {
	                    if (!this.context.isAssignmentTarget || init.type === syntax_1.Syntax.AssignmentExpression) {
	                        this.tolerateError(messages_1.Messages.InvalidLHSInForIn);
	                    }
	                    this.nextToken();
	                    this.reinterpretExpressionAsPattern(init);
	                    left = init;
	                    right = this.parseExpression();
	                    init = null;
	                }
	                else if (this.matchContextualKeyword('of')) {
	                    if (!this.context.isAssignmentTarget || init.type === syntax_1.Syntax.AssignmentExpression) {
	                        this.tolerateError(messages_1.Messages.InvalidLHSInForLoop);
	                    }
	                    this.nextToken();
	                    this.reinterpretExpressionAsPattern(init);
	                    left = init;
	                    right = this.parseAssignmentExpression();
	                    init = null;
	                    forIn = false;
	                }
	                else {
	                    if (this.match(',')) {
	                        var initSeq = [init];
	                        while (this.match(',')) {
	                            this.nextToken();
	                            initSeq.push(this.isolateCoverGrammar(this.parseAssignmentExpression));
	                        }
	                        init = this.finalize(this.startNode(initStartToken), new Node.SequenceExpression(initSeq));
	                    }
	                    this.expect(';');
	                }
	            }
	        }
	        if (typeof left === 'undefined') {
	            if (!this.match(';')) {
	                test = this.parseExpression();
	            }
	            this.expect(';');
	            if (!this.match(')')) {
	                update = this.parseExpression();
	            }
	        }
	        var body;
	        if (!this.match(')') && this.config.tolerant) {
	            this.tolerateUnexpectedToken(this.nextToken());
	            body = this.finalize(this.createNode(), new Node.EmptyStatement());
	        }
	        else {
	            this.expect(')');
	            var previousInIteration = this.context.inIteration;
	            this.context.inIteration = true;
	            body = this.isolateCoverGrammar(this.parseStatement);
	            this.context.inIteration = previousInIteration;
	        }
	        return (typeof left === 'undefined') ?
	            this.finalize(node, new Node.ForStatement(init, test, update, body)) :
	            forIn ? this.finalize(node, new Node.ForInStatement(left, right, body)) :
	                this.finalize(node, new Node.ForOfStatement(left, right, body));
	    };
	    // https://tc39.github.io/ecma262/#sec-continue-statement
	    Parser.prototype.parseContinueStatement = function () {
	        var node = this.createNode();
	        this.expectKeyword('continue');
	        var label = null;
	        if (this.lookahead.type === 3 /* Identifier */ && !this.hasLineTerminator) {
	            var id = this.parseVariableIdentifier();
	            label = id;
	            var key = '$' + id.name;
	            if (!Object.prototype.hasOwnProperty.call(this.context.labelSet, key)) {
	                this.throwError(messages_1.Messages.UnknownLabel, id.name);
	            }
	        }
	        this.consumeSemicolon();
	        if (label === null && !this.context.inIteration) {
	            this.throwError(messages_1.Messages.IllegalContinue);
	        }
	        return this.finalize(node, new Node.ContinueStatement(label));
	    };
	    // https://tc39.github.io/ecma262/#sec-break-statement
	    Parser.prototype.parseBreakStatement = function () {
	        var node = this.createNode();
	        this.expectKeyword('break');
	        var label = null;
	        if (this.lookahead.type === 3 /* Identifier */ && !this.hasLineTerminator) {
	            var id = this.parseVariableIdentifier();
	            var key = '$' + id.name;
	            if (!Object.prototype.hasOwnProperty.call(this.context.labelSet, key)) {
	                this.throwError(messages_1.Messages.UnknownLabel, id.name);
	            }
	            label = id;
	        }
	        this.consumeSemicolon();
	        if (label === null && !this.context.inIteration && !this.context.inSwitch) {
	            this.throwError(messages_1.Messages.IllegalBreak);
	        }
	        return this.finalize(node, new Node.BreakStatement(label));
	    };
	    // https://tc39.github.io/ecma262/#sec-return-statement
	    Parser.prototype.parseReturnStatement = function () {
	        if (!this.context.inFunctionBody) {
	            this.tolerateError(messages_1.Messages.IllegalReturn);
	        }
	        var node = this.createNode();
	        this.expectKeyword('return');
	        var hasArgument = !this.match(';') && !this.match('}') &&
	            !this.hasLineTerminator && this.lookahead.type !== 2 /* EOF */;
	        var argument = hasArgument ? this.parseExpression() : null;
	        this.consumeSemicolon();
	        return this.finalize(node, new Node.ReturnStatement(argument));
	    };
	    // https://tc39.github.io/ecma262/#sec-with-statement
	    Parser.prototype.parseWithStatement = function () {
	        if (this.context.strict) {
	            this.tolerateError(messages_1.Messages.StrictModeWith);
	        }
	        var node = this.createNode();
	        var body;
	        this.expectKeyword('with');
	        this.expect('(');
	        var object = this.parseExpression();
	        if (!this.match(')') && this.config.tolerant) {
	            this.tolerateUnexpectedToken(this.nextToken());
	            body = this.finalize(this.createNode(), new Node.EmptyStatement());
	        }
	        else {
	            this.expect(')');
	            body = this.parseStatement();
	        }
	        return this.finalize(node, new Node.WithStatement(object, body));
	    };
	    // https://tc39.github.io/ecma262/#sec-switch-statement
	    Parser.prototype.parseSwitchCase = function () {
	        var node = this.createNode();
	        var test;
	        if (this.matchKeyword('default')) {
	            this.nextToken();
	            test = null;
	        }
	        else {
	            this.expectKeyword('case');
	            test = this.parseExpression();
	        }
	        this.expect(':');
	        var consequent = [];
	        while (true) {
	            if (this.match('}') || this.matchKeyword('default') || this.matchKeyword('case')) {
	                break;
	            }
	            consequent.push(this.parseStatementListItem());
	        }
	        return this.finalize(node, new Node.SwitchCase(test, consequent));
	    };
	    Parser.prototype.parseSwitchStatement = function () {
	        var node = this.createNode();
	        this.expectKeyword('switch');
	        this.expect('(');
	        var discriminant = this.parseExpression();
	        this.expect(')');
	        var previousInSwitch = this.context.inSwitch;
	        this.context.inSwitch = true;
	        var cases = [];
	        var defaultFound = false;
	        this.expect('{');
	        while (true) {
	            if (this.match('}')) {
	                break;
	            }
	            var clause = this.parseSwitchCase();
	            if (clause.test === null) {
	                if (defaultFound) {
	                    this.throwError(messages_1.Messages.MultipleDefaultsInSwitch);
	                }
	                defaultFound = true;
	            }
	            cases.push(clause);
	        }
	        this.expect('}');
	        this.context.inSwitch = previousInSwitch;
	        return this.finalize(node, new Node.SwitchStatement(discriminant, cases));
	    };
	    // https://tc39.github.io/ecma262/#sec-labelled-statements
	    Parser.prototype.parseLabelledStatement = function () {
	        var node = this.createNode();
	        var expr = this.parseExpression();
	        var statement;
	        if ((expr.type === syntax_1.Syntax.Identifier) && this.match(':')) {
	            this.nextToken();
	            var id = expr;
	            var key = '$' + id.name;
	            if (Object.prototype.hasOwnProperty.call(this.context.labelSet, key)) {
	                this.throwError(messages_1.Messages.Redeclaration, 'Label', id.name);
	            }
	            this.context.labelSet[key] = true;
	            var body = void 0;
	            if (this.matchKeyword('class')) {
	                this.tolerateUnexpectedToken(this.lookahead);
	                body = this.parseClassDeclaration();
	            }
	            else if (this.matchKeyword('function')) {
	                var token = this.lookahead;
	                var declaration = this.parseFunctionDeclaration();
	                if (this.context.strict) {
	                    this.tolerateUnexpectedToken(token, messages_1.Messages.StrictFunction);
	                }
	                else if (declaration.generator) {
	                    this.tolerateUnexpectedToken(token, messages_1.Messages.GeneratorInLegacyContext);
	                }
	                body = declaration;
	            }
	            else {
	                body = this.parseStatement();
	            }
	            delete this.context.labelSet[key];
	            statement = new Node.LabeledStatement(id, body);
	        }
	        else {
	            this.consumeSemicolon();
	            statement = new Node.ExpressionStatement(expr);
	        }
	        return this.finalize(node, statement);
	    };
	    // https://tc39.github.io/ecma262/#sec-throw-statement
	    Parser.prototype.parseThrowStatement = function () {
	        var node = this.createNode();
	        this.expectKeyword('throw');
	        if (this.hasLineTerminator) {
	            this.throwError(messages_1.Messages.NewlineAfterThrow);
	        }
	        var argument = this.parseExpression();
	        this.consumeSemicolon();
	        return this.finalize(node, new Node.ThrowStatement(argument));
	    };
	    // https://tc39.github.io/ecma262/#sec-try-statement
	    Parser.prototype.parseCatchClause = function () {
	        var node = this.createNode();
	        this.expectKeyword('catch');
	        this.expect('(');
	        if (this.match(')')) {
	            this.throwUnexpectedToken(this.lookahead);
	        }
	        var params = [];
	        var param = this.parsePattern(params);
	        var paramMap = {};
	        for (var i = 0; i < params.length; i++) {
	            var key = '$' + params[i].value;
	            if (Object.prototype.hasOwnProperty.call(paramMap, key)) {
	                this.tolerateError(messages_1.Messages.DuplicateBinding, params[i].value);
	            }
	            paramMap[key] = true;
	        }
	        if (this.context.strict && param.type === syntax_1.Syntax.Identifier) {
	            if (this.scanner.isRestrictedWord(param.name)) {
	                this.tolerateError(messages_1.Messages.StrictCatchVariable);
	            }
	        }
	        this.expect(')');
	        var body = this.parseBlock();
	        return this.finalize(node, new Node.CatchClause(param, body));
	    };
	    Parser.prototype.parseFinallyClause = function () {
	        this.expectKeyword('finally');
	        return this.parseBlock();
	    };
	    Parser.prototype.parseTryStatement = function () {
	        var node = this.createNode();
	        this.expectKeyword('try');
	        var block = this.parseBlock();
	        var handler = this.matchKeyword('catch') ? this.parseCatchClause() : null;
	        var finalizer = this.matchKeyword('finally') ? this.parseFinallyClause() : null;
	        if (!handler && !finalizer) {
	            this.throwError(messages_1.Messages.NoCatchOrFinally);
	        }
	        return this.finalize(node, new Node.TryStatement(block, handler, finalizer));
	    };
	    // https://tc39.github.io/ecma262/#sec-debugger-statement
	    Parser.prototype.parseDebuggerStatement = function () {
	        var node = this.createNode();
	        this.expectKeyword('debugger');
	        this.consumeSemicolon();
	        return this.finalize(node, new Node.DebuggerStatement());
	    };
	    // https://tc39.github.io/ecma262/#sec-ecmascript-language-statements-and-declarations
	    Parser.prototype.parseStatement = function () {
	        var statement;
	        switch (this.lookahead.type) {
	            case 1 /* BooleanLiteral */:
	            case 5 /* NullLiteral */:
	            case 6 /* NumericLiteral */:
	            case 8 /* StringLiteral */:
	            case 10 /* Template */:
	            case 9 /* RegularExpression */:
	                statement = this.parseExpressionStatement();
	                break;
	            case 7 /* Punctuator */:
	                var value = this.lookahead.value;
	                if (value === '{') {
	                    statement = this.parseBlock();
	                }
	                else if (value === '(') {
	                    statement = this.parseExpressionStatement();
	                }
	                else if (value === ';') {
	                    statement = this.parseEmptyStatement();
	                }
	                else {
	                    statement = this.parseExpressionStatement();
	                }
	                break;
	            case 3 /* Identifier */:
	                statement = this.matchAsyncFunction() ? this.parseFunctionDeclaration() : this.parseLabelledStatement();
	                break;
	            case 4 /* Keyword */:
	                switch (this.lookahead.value) {
	                    case 'break':
	                        statement = this.parseBreakStatement();
	                        break;
	                    case 'continue':
	                        statement = this.parseContinueStatement();
	                        break;
	                    case 'debugger':
	                        statement = this.parseDebuggerStatement();
	                        break;
	                    case 'do':
	                        statement = this.parseDoWhileStatement();
	                        break;
	                    case 'for':
	                        statement = this.parseForStatement();
	                        break;
	                    case 'function':
	                        statement = this.parseFunctionDeclaration();
	                        break;
	                    case 'if':
	                        statement = this.parseIfStatement();
	                        break;
	                    case 'return':
	                        statement = this.parseReturnStatement();
	                        break;
	                    case 'switch':
	                        statement = this.parseSwitchStatement();
	                        break;
	                    case 'throw':
	                        statement = this.parseThrowStatement();
	                        break;
	                    case 'try':
	                        statement = this.parseTryStatement();
	                        break;
	                    case 'var':
	                        statement = this.parseVariableStatement();
	                        break;
	                    case 'while':
	                        statement = this.parseWhileStatement();
	                        break;
	                    case 'with':
	                        statement = this.parseWithStatement();
	                        break;
	                    default:
	                        statement = this.parseExpressionStatement();
	                        break;
	                }
	                break;
	            default:
	                statement = this.throwUnexpectedToken(this.lookahead);
	        }
	        return statement;
	    };
	    // https://tc39.github.io/ecma262/#sec-function-definitions
	    Parser.prototype.parseFunctionSourceElements = function () {
	        var node = this.createNode();
	        this.expect('{');
	        var body = this.parseDirectivePrologues();
	        var previousLabelSet = this.context.labelSet;
	        var previousInIteration = this.context.inIteration;
	        var previousInSwitch = this.context.inSwitch;
	        var previousInFunctionBody = this.context.inFunctionBody;
	        this.context.labelSet = {};
	        this.context.inIteration = false;
	        this.context.inSwitch = false;
	        this.context.inFunctionBody = true;
	        while (this.lookahead.type !== 2 /* EOF */) {
	            if (this.match('}')) {
	                break;
	            }
	            body.push(this.parseStatementListItem());
	        }
	        this.expect('}');
	        this.context.labelSet = previousLabelSet;
	        this.context.inIteration = previousInIteration;
	        this.context.inSwitch = previousInSwitch;
	        this.context.inFunctionBody = previousInFunctionBody;
	        return this.finalize(node, new Node.BlockStatement(body));
	    };
	    Parser.prototype.validateParam = function (options, param, name) {
	        var key = '$' + name;
	        if (this.context.strict) {
	            if (this.scanner.isRestrictedWord(name)) {
	                options.stricted = param;
	                options.message = messages_1.Messages.StrictParamName;
	            }
	            if (Object.prototype.hasOwnProperty.call(options.paramSet, key)) {
	                options.stricted = param;
	                options.message = messages_1.Messages.StrictParamDupe;
	            }
	        }
	        else if (!options.firstRestricted) {
	            if (this.scanner.isRestrictedWord(name)) {
	                options.firstRestricted = param;
	                options.message = messages_1.Messages.StrictParamName;
	            }
	            else if (this.scanner.isStrictModeReservedWord(name)) {
	                options.firstRestricted = param;
	                options.message = messages_1.Messages.StrictReservedWord;
	            }
	            else if (Object.prototype.hasOwnProperty.call(options.paramSet, key)) {
	                options.stricted = param;
	                options.message = messages_1.Messages.StrictParamDupe;
	            }
	        }
	        /* istanbul ignore next */
	        if (typeof Object.defineProperty === 'function') {
	            Object.defineProperty(options.paramSet, key, { value: true, enumerable: true, writable: true, configurable: true });
	        }
	        else {
	            options.paramSet[key] = true;
	        }
	    };
	    Parser.prototype.parseRestElement = function (params) {
	        var node = this.createNode();
	        this.expect('...');
	        var arg = this.parsePattern(params);
	        if (this.match('=')) {
	            this.throwError(messages_1.Messages.DefaultRestParameter);
	        }
	        if (!this.match(')')) {
	            this.throwError(messages_1.Messages.ParameterAfterRestParameter);
	        }
	        return this.finalize(node, new Node.RestElement(arg));
	    };
	    Parser.prototype.parseFormalParameter = function (options) {
	        var params = [];
	        var param = this.match('...') ? this.parseRestElement(params) : this.parsePatternWithDefault(params);
	        for (var i = 0; i < params.length; i++) {
	            this.validateParam(options, params[i], params[i].value);
	        }
	        options.simple = options.simple && (param instanceof Node.Identifier);
	        options.params.push(param);
	    };
	    Parser.prototype.parseFormalParameters = function (firstRestricted) {
	        var options;
	        options = {
	            simple: true,
	            params: [],
	            firstRestricted: firstRestricted
	        };
	        this.expect('(');
	        if (!this.match(')')) {
	            options.paramSet = {};
	            while (this.lookahead.type !== 2 /* EOF */) {
	                this.parseFormalParameter(options);
	                if (this.match(')')) {
	                    break;
	                }
	                this.expect(',');
	                if (this.match(')')) {
	                    break;
	                }
	            }
	        }
	        this.expect(')');
	        return {
	            simple: options.simple,
	            params: options.params,
	            stricted: options.stricted,
	            firstRestricted: options.firstRestricted,
	            message: options.message
	        };
	    };
	    Parser.prototype.matchAsyncFunction = function () {
	        var match = this.matchContextualKeyword('async');
	        if (match) {
	            var state = this.scanner.saveState();
	            this.scanner.scanComments();
	            var next = this.scanner.lex();
	            this.scanner.restoreState(state);
	            match = (state.lineNumber === next.lineNumber) && (next.type === 4 /* Keyword */) && (next.value === 'function');
	        }
	        return match;
	    };
	    Parser.prototype.parseFunctionDeclaration = function (identifierIsOptional) {
	        var node = this.createNode();
	        var isAsync = this.matchContextualKeyword('async');
	        if (isAsync) {
	            this.nextToken();
	        }
	        this.expectKeyword('function');
	        var isGenerator = isAsync ? false : this.match('*');
	        if (isGenerator) {
	            this.nextToken();
	        }
	        var message;
	        var id = null;
	        var firstRestricted = null;
	        if (!identifierIsOptional || !this.match('(')) {
	            var token = this.lookahead;
	            id = this.parseVariableIdentifier();
	            if (this.context.strict) {
	                if (this.scanner.isRestrictedWord(token.value)) {
	                    this.tolerateUnexpectedToken(token, messages_1.Messages.StrictFunctionName);
	                }
	            }
	            else {
	                if (this.scanner.isRestrictedWord(token.value)) {
	                    firstRestricted = token;
	                    message = messages_1.Messages.StrictFunctionName;
	                }
	                else if (this.scanner.isStrictModeReservedWord(token.value)) {
	                    firstRestricted = token;
	                    message = messages_1.Messages.StrictReservedWord;
	                }
	            }
	        }
	        var previousAllowAwait = this.context.await;
	        var previousAllowYield = this.context.allowYield;
	        this.context.await = isAsync;
	        this.context.allowYield = !isGenerator;
	        var formalParameters = this.parseFormalParameters(firstRestricted);
	        var params = formalParameters.params;
	        var stricted = formalParameters.stricted;
	        firstRestricted = formalParameters.firstRestricted;
	        if (formalParameters.message) {
	            message = formalParameters.message;
	        }
	        var previousStrict = this.context.strict;
	        var previousAllowStrictDirective = this.context.allowStrictDirective;
	        this.context.allowStrictDirective = formalParameters.simple;
	        var body = this.parseFunctionSourceElements();
	        if (this.context.strict && firstRestricted) {
	            this.throwUnexpectedToken(firstRestricted, message);
	        }
	        if (this.context.strict && stricted) {
	            this.tolerateUnexpectedToken(stricted, message);
	        }
	        this.context.strict = previousStrict;
	        this.context.allowStrictDirective = previousAllowStrictDirective;
	        this.context.await = previousAllowAwait;
	        this.context.allowYield = previousAllowYield;
	        return isAsync ? this.finalize(node, new Node.AsyncFunctionDeclaration(id, params, body)) :
	            this.finalize(node, new Node.FunctionDeclaration(id, params, body, isGenerator));
	    };
	    Parser.prototype.parseFunctionExpression = function () {
	        var node = this.createNode();
	        var isAsync = this.matchContextualKeyword('async');
	        if (isAsync) {
	            this.nextToken();
	        }
	        this.expectKeyword('function');
	        var isGenerator = isAsync ? false : this.match('*');
	        if (isGenerator) {
	            this.nextToken();
	        }
	        var message;
	        var id = null;
	        var firstRestricted;
	        var previousAllowAwait = this.context.await;
	        var previousAllowYield = this.context.allowYield;
	        this.context.await = isAsync;
	        this.context.allowYield = !isGenerator;
	        if (!this.match('(')) {
	            var token = this.lookahead;
	            id = (!this.context.strict && !isGenerator && this.matchKeyword('yield')) ? this.parseIdentifierName() : this.parseVariableIdentifier();
	            if (this.context.strict) {
	                if (this.scanner.isRestrictedWord(token.value)) {
	                    this.tolerateUnexpectedToken(token, messages_1.Messages.StrictFunctionName);
	                }
	            }
	            else {
	                if (this.scanner.isRestrictedWord(token.value)) {
	                    firstRestricted = token;
	                    message = messages_1.Messages.StrictFunctionName;
	                }
	                else if (this.scanner.isStrictModeReservedWord(token.value)) {
	                    firstRestricted = token;
	                    message = messages_1.Messages.StrictReservedWord;
	                }
	            }
	        }
	        var formalParameters = this.parseFormalParameters(firstRestricted);
	        var params = formalParameters.params;
	        var stricted = formalParameters.stricted;
	        firstRestricted = formalParameters.firstRestricted;
	        if (formalParameters.message) {
	            message = formalParameters.message;
	        }
	        var previousStrict = this.context.strict;
	        var previousAllowStrictDirective = this.context.allowStrictDirective;
	        this.context.allowStrictDirective = formalParameters.simple;
	        var body = this.parseFunctionSourceElements();
	        if (this.context.strict && firstRestricted) {
	            this.throwUnexpectedToken(firstRestricted, message);
	        }
	        if (this.context.strict && stricted) {
	            this.tolerateUnexpectedToken(stricted, message);
	        }
	        this.context.strict = previousStrict;
	        this.context.allowStrictDirective = previousAllowStrictDirective;
	        this.context.await = previousAllowAwait;
	        this.context.allowYield = previousAllowYield;
	        return isAsync ? this.finalize(node, new Node.AsyncFunctionExpression(id, params, body)) :
	            this.finalize(node, new Node.FunctionExpression(id, params, body, isGenerator));
	    };
	    // https://tc39.github.io/ecma262/#sec-directive-prologues-and-the-use-strict-directive
	    Parser.prototype.parseDirective = function () {
	        var token = this.lookahead;
	        var node = this.createNode();
	        var expr = this.parseExpression();
	        var directive = (expr.type === syntax_1.Syntax.Literal) ? this.getTokenRaw(token).slice(1, -1) : null;
	        this.consumeSemicolon();
	        return this.finalize(node, directive ? new Node.Directive(expr, directive) : new Node.ExpressionStatement(expr));
	    };
	    Parser.prototype.parseDirectivePrologues = function () {
	        var firstRestricted = null;
	        var body = [];
	        while (true) {
	            var token = this.lookahead;
	            if (token.type !== 8 /* StringLiteral */) {
	                break;
	            }
	            var statement = this.parseDirective();
	            body.push(statement);
	            var directive = statement.directive;
	            if (typeof directive !== 'string') {
	                break;
	            }
	            if (directive === 'use strict') {
	                this.context.strict = true;
	                if (firstRestricted) {
	                    this.tolerateUnexpectedToken(firstRestricted, messages_1.Messages.StrictOctalLiteral);
	                }
	                if (!this.context.allowStrictDirective) {
	                    this.tolerateUnexpectedToken(token, messages_1.Messages.IllegalLanguageModeDirective);
	                }
	            }
	            else {
	                if (!firstRestricted && token.octal) {
	                    firstRestricted = token;
	                }
	            }
	        }
	        return body;
	    };
	    // https://tc39.github.io/ecma262/#sec-method-definitions
	    Parser.prototype.qualifiedPropertyName = function (token) {
	        switch (token.type) {
	            case 3 /* Identifier */:
	            case 8 /* StringLiteral */:
	            case 1 /* BooleanLiteral */:
	            case 5 /* NullLiteral */:
	            case 6 /* NumericLiteral */:
	            case 4 /* Keyword */:
	                return true;
	            case 7 /* Punctuator */:
	                return token.value === '[';
	            default:
	                break;
	        }
	        return false;
	    };
	    Parser.prototype.parseGetterMethod = function () {
	        var node = this.createNode();
	        var isGenerator = false;
	        var previousAllowYield = this.context.allowYield;
	        this.context.allowYield = false;
	        var formalParameters = this.parseFormalParameters();
	        if (formalParameters.params.length > 0) {
	            this.tolerateError(messages_1.Messages.BadGetterArity);
	        }
	        var method = this.parsePropertyMethod(formalParameters);
	        this.context.allowYield = previousAllowYield;
	        return this.finalize(node, new Node.FunctionExpression(null, formalParameters.params, method, isGenerator));
	    };
	    Parser.prototype.parseSetterMethod = function () {
	        var node = this.createNode();
	        var isGenerator = false;
	        var previousAllowYield = this.context.allowYield;
	        this.context.allowYield = false;
	        var formalParameters = this.parseFormalParameters();
	        if (formalParameters.params.length !== 1) {
	            this.tolerateError(messages_1.Messages.BadSetterArity);
	        }
	        else if (formalParameters.params[0] instanceof Node.RestElement) {
	            this.tolerateError(messages_1.Messages.BadSetterRestParameter);
	        }
	        var method = this.parsePropertyMethod(formalParameters);
	        this.context.allowYield = previousAllowYield;
	        return this.finalize(node, new Node.FunctionExpression(null, formalParameters.params, method, isGenerator));
	    };
	    Parser.prototype.parseGeneratorMethod = function () {
	        var node = this.createNode();
	        var isGenerator = true;
	        var previousAllowYield = this.context.allowYield;
	        this.context.allowYield = true;
	        var params = this.parseFormalParameters();
	        this.context.allowYield = false;
	        var method = this.parsePropertyMethod(params);
	        this.context.allowYield = previousAllowYield;
	        return this.finalize(node, new Node.FunctionExpression(null, params.params, method, isGenerator));
	    };
	    // https://tc39.github.io/ecma262/#sec-generator-function-definitions
	    Parser.prototype.isStartOfExpression = function () {
	        var start = true;
	        var value = this.lookahead.value;
	        switch (this.lookahead.type) {
	            case 7 /* Punctuator */:
	                start = (value === '[') || (value === '(') || (value === '{') ||
	                    (value === '+') || (value === '-') ||
	                    (value === '!') || (value === '~') ||
	                    (value === '++') || (value === '--') ||
	                    (value === '/') || (value === '/='); // regular expression literal
	                break;
	            case 4 /* Keyword */:
	                start = (value === 'class') || (value === 'delete') ||
	                    (value === 'function') || (value === 'let') || (value === 'new') ||
	                    (value === 'super') || (value === 'this') || (value === 'typeof') ||
	                    (value === 'void') || (value === 'yield');
	                break;
	            default:
	                break;
	        }
	        return start;
	    };
	    Parser.prototype.parseYieldExpression = function () {
	        var node = this.createNode();
	        this.expectKeyword('yield');
	        var argument = null;
	        var delegate = false;
	        if (!this.hasLineTerminator) {
	            var previousAllowYield = this.context.allowYield;
	            this.context.allowYield = false;
	            delegate = this.match('*');
	            if (delegate) {
	                this.nextToken();
	                argument = this.parseAssignmentExpression();
	            }
	            else if (this.isStartOfExpression()) {
	                argument = this.parseAssignmentExpression();
	            }
	            this.context.allowYield = previousAllowYield;
	        }
	        return this.finalize(node, new Node.YieldExpression(argument, delegate));
	    };
	    // https://tc39.github.io/ecma262/#sec-class-definitions
	    Parser.prototype.parseClassElement = function (hasConstructor) {
	        var token = this.lookahead;
	        var node = this.createNode();
	        var kind = '';
	        var key = null;
	        var value = null;
	        var computed = false;
	        var method = false;
	        var isStatic = false;
	        var isAsync = false;
	        if (this.match('*')) {
	            this.nextToken();
	        }
	        else {
	            computed = this.match('[');
	            key = this.parseObjectPropertyKey();
	            var id = key;
	            if (id.name === 'static' && (this.qualifiedPropertyName(this.lookahead) || this.match('*'))) {
	                token = this.lookahead;
	                isStatic = true;
	                computed = this.match('[');
	                if (this.match('*')) {
	                    this.nextToken();
	                }
	                else {
	                    key = this.parseObjectPropertyKey();
	                }
	            }
	            if ((token.type === 3 /* Identifier */) && !this.hasLineTerminator && (token.value === 'async')) {
	                var punctuator = this.lookahead.value;
	                if (punctuator !== ':' && punctuator !== '(' && punctuator !== '*') {
	                    isAsync = true;
	                    token = this.lookahead;
	                    key = this.parseObjectPropertyKey();
	                    if (token.type === 3 /* Identifier */) {
	                        if (token.value === 'get' || token.value === 'set') {
	                            this.tolerateUnexpectedToken(token);
	                        }
	                        else if (token.value === 'constructor') {
	                            this.tolerateUnexpectedToken(token, messages_1.Messages.ConstructorIsAsync);
	                        }
	                    }
	                }
	            }
	        }
	        var lookaheadPropertyKey = this.qualifiedPropertyName(this.lookahead);
	        if (token.type === 3 /* Identifier */) {
	            if (token.value === 'get' && lookaheadPropertyKey) {
	                kind = 'get';
	                computed = this.match('[');
	                key = this.parseObjectPropertyKey();
	                this.context.allowYield = false;
	                value = this.parseGetterMethod();
	            }
	            else if (token.value === 'set' && lookaheadPropertyKey) {
	                kind = 'set';
	                computed = this.match('[');
	                key = this.parseObjectPropertyKey();
	                value = this.parseSetterMethod();
	            }
	        }
	        else if (token.type === 7 /* Punctuator */ && token.value === '*' && lookaheadPropertyKey) {
	            kind = 'init';
	            computed = this.match('[');
	            key = this.parseObjectPropertyKey();
	            value = this.parseGeneratorMethod();
	            method = true;
	        }
	        if (!kind && key && this.match('(')) {
	            kind = 'init';
	            value = isAsync ? this.parsePropertyMethodAsyncFunction() : this.parsePropertyMethodFunction();
	            method = true;
	        }
	        if (!kind) {
	            this.throwUnexpectedToken(this.lookahead);
	        }
	        if (kind === 'init') {
	            kind = 'method';
	        }
	        if (!computed) {
	            if (isStatic && this.isPropertyKey(key, 'prototype')) {
	                this.throwUnexpectedToken(token, messages_1.Messages.StaticPrototype);
	            }
	            if (!isStatic && this.isPropertyKey(key, 'constructor')) {
	                if (kind !== 'method' || !method || (value && value.generator)) {
	                    this.throwUnexpectedToken(token, messages_1.Messages.ConstructorSpecialMethod);
	                }
	                if (hasConstructor.value) {
	                    this.throwUnexpectedToken(token, messages_1.Messages.DuplicateConstructor);
	                }
	                else {
	                    hasConstructor.value = true;
	                }
	                kind = 'constructor';
	            }
	        }
	        return this.finalize(node, new Node.MethodDefinition(key, computed, value, kind, isStatic));
	    };
	    Parser.prototype.parseClassElementList = function () {
	        var body = [];
	        var hasConstructor = { value: false };
	        this.expect('{');
	        while (!this.match('}')) {
	            if (this.match(';')) {
	                this.nextToken();
	            }
	            else {
	                body.push(this.parseClassElement(hasConstructor));
	            }
	        }
	        this.expect('}');
	        return body;
	    };
	    Parser.prototype.parseClassBody = function () {
	        var node = this.createNode();
	        var elementList = this.parseClassElementList();
	        return this.finalize(node, new Node.ClassBody(elementList));
	    };
	    Parser.prototype.parseClassDeclaration = function (identifierIsOptional) {
	        var node = this.createNode();
	        var previousStrict = this.context.strict;
	        this.context.strict = true;
	        this.expectKeyword('class');
	        var id = (identifierIsOptional && (this.lookahead.type !== 3 /* Identifier */)) ? null : this.parseVariableIdentifier();
	        var superClass = null;
	        if (this.matchKeyword('extends')) {
	            this.nextToken();
	            superClass = this.isolateCoverGrammar(this.parseLeftHandSideExpressionAllowCall);
	        }
	        var classBody = this.parseClassBody();
	        this.context.strict = previousStrict;
	        return this.finalize(node, new Node.ClassDeclaration(id, superClass, classBody));
	    };
	    Parser.prototype.parseClassExpression = function () {
	        var node = this.createNode();
	        var previousStrict = this.context.strict;
	        this.context.strict = true;
	        this.expectKeyword('class');
	        var id = (this.lookahead.type === 3 /* Identifier */) ? this.parseVariableIdentifier() : null;
	        var superClass = null;
	        if (this.matchKeyword('extends')) {
	            this.nextToken();
	            superClass = this.isolateCoverGrammar(this.parseLeftHandSideExpressionAllowCall);
	        }
	        var classBody = this.parseClassBody();
	        this.context.strict = previousStrict;
	        return this.finalize(node, new Node.ClassExpression(id, superClass, classBody));
	    };
	    // https://tc39.github.io/ecma262/#sec-scripts
	    // https://tc39.github.io/ecma262/#sec-modules
	    Parser.prototype.parseModule = function () {
	        this.context.strict = true;
	        this.context.isModule = true;
	        var node = this.createNode();
	        var body = this.parseDirectivePrologues();
	        while (this.lookahead.type !== 2 /* EOF */) {
	            body.push(this.parseStatementListItem());
	        }
	        return this.finalize(node, new Node.Module(body));
	    };
	    Parser.prototype.parseScript = function () {
	        var node = this.createNode();
	        var body = this.parseDirectivePrologues();
	        while (this.lookahead.type !== 2 /* EOF */) {
	            body.push(this.parseStatementListItem());
	        }
	        return this.finalize(node, new Node.Script(body));
	    };
	    // https://tc39.github.io/ecma262/#sec-imports
	    Parser.prototype.parseModuleSpecifier = function () {
	        var node = this.createNode();
	        if (this.lookahead.type !== 8 /* StringLiteral */) {
	            this.throwError(messages_1.Messages.InvalidModuleSpecifier);
	        }
	        var token = this.nextToken();
	        var raw = this.getTokenRaw(token);
	        return this.finalize(node, new Node.Literal(token.value, raw));
	    };
	    // import {<foo as bar>} ...;
	    Parser.prototype.parseImportSpecifier = function () {
	        var node = this.createNode();
	        var imported;
	        var local;
	        if (this.lookahead.type === 3 /* Identifier */) {
	            imported = this.parseVariableIdentifier();
	            local = imported;
	            if (this.matchContextualKeyword('as')) {
	                this.nextToken();
	                local = this.parseVariableIdentifier();
	            }
	        }
	        else {
	            imported = this.parseIdentifierName();
	            local = imported;
	            if (this.matchContextualKeyword('as')) {
	                this.nextToken();
	                local = this.parseVariableIdentifier();
	            }
	            else {
	                this.throwUnexpectedToken(this.nextToken());
	            }
	        }
	        return this.finalize(node, new Node.ImportSpecifier(local, imported));
	    };
	    // {foo, bar as bas}
	    Parser.prototype.parseNamedImports = function () {
	        this.expect('{');
	        var specifiers = [];
	        while (!this.match('}')) {
	            specifiers.push(this.parseImportSpecifier());
	            if (!this.match('}')) {
	                this.expect(',');
	            }
	        }
	        this.expect('}');
	        return specifiers;
	    };
	    // import <foo> ...;
	    Parser.prototype.parseImportDefaultSpecifier = function () {
	        var node = this.createNode();
	        var local = this.parseIdentifierName();
	        return this.finalize(node, new Node.ImportDefaultSpecifier(local));
	    };
	    // import <* as foo> ...;
	    Parser.prototype.parseImportNamespaceSpecifier = function () {
	        var node = this.createNode();
	        this.expect('*');
	        if (!this.matchContextualKeyword('as')) {
	            this.throwError(messages_1.Messages.NoAsAfterImportNamespace);
	        }
	        this.nextToken();
	        var local = this.parseIdentifierName();
	        return this.finalize(node, new Node.ImportNamespaceSpecifier(local));
	    };
	    Parser.prototype.parseImportDeclaration = function () {
	        if (this.context.inFunctionBody) {
	            this.throwError(messages_1.Messages.IllegalImportDeclaration);
	        }
	        var node = this.createNode();
	        this.expectKeyword('import');
	        var src;
	        var specifiers = [];
	        if (this.lookahead.type === 8 /* StringLiteral */) {
	            // import 'foo';
	            src = this.parseModuleSpecifier();
	        }
	        else {
	            if (this.match('{')) {
	                // import {bar}
	                specifiers = specifiers.concat(this.parseNamedImports());
	            }
	            else if (this.match('*')) {
	                // import * as foo
	                specifiers.push(this.parseImportNamespaceSpecifier());
	            }
	            else if (this.isIdentifierName(this.lookahead) && !this.matchKeyword('default')) {
	                // import foo
	                specifiers.push(this.parseImportDefaultSpecifier());
	                if (this.match(',')) {
	                    this.nextToken();
	                    if (this.match('*')) {
	                        // import foo, * as foo
	                        specifiers.push(this.parseImportNamespaceSpecifier());
	                    }
	                    else if (this.match('{')) {
	                        // import foo, {bar}
	                        specifiers = specifiers.concat(this.parseNamedImports());
	                    }
	                    else {
	                        this.throwUnexpectedToken(this.lookahead);
	                    }
	                }
	            }
	            else {
	                this.throwUnexpectedToken(this.nextToken());
	            }
	            if (!this.matchContextualKeyword('from')) {
	                var message = this.lookahead.value ? messages_1.Messages.UnexpectedToken : messages_1.Messages.MissingFromClause;
	                this.throwError(message, this.lookahead.value);
	            }
	            this.nextToken();
	            src = this.parseModuleSpecifier();
	        }
	        this.consumeSemicolon();
	        return this.finalize(node, new Node.ImportDeclaration(specifiers, src));
	    };
	    // https://tc39.github.io/ecma262/#sec-exports
	    Parser.prototype.parseExportSpecifier = function () {
	        var node = this.createNode();
	        var local = this.parseIdentifierName();
	        var exported = local;
	        if (this.matchContextualKeyword('as')) {
	            this.nextToken();
	            exported = this.parseIdentifierName();
	        }
	        return this.finalize(node, new Node.ExportSpecifier(local, exported));
	    };
	    Parser.prototype.parseExportDeclaration = function () {
	        if (this.context.inFunctionBody) {
	            this.throwError(messages_1.Messages.IllegalExportDeclaration);
	        }
	        var node = this.createNode();
	        this.expectKeyword('export');
	        var exportDeclaration;
	        if (this.matchKeyword('default')) {
	            // export default ...
	            this.nextToken();
	            if (this.matchKeyword('function')) {
	                // export default function foo () {}
	                // export default function () {}
	                var declaration = this.parseFunctionDeclaration(true);
	                exportDeclaration = this.finalize(node, new Node.ExportDefaultDeclaration(declaration));
	            }
	            else if (this.matchKeyword('class')) {
	                // export default class foo {}
	                var declaration = this.parseClassDeclaration(true);
	                exportDeclaration = this.finalize(node, new Node.ExportDefaultDeclaration(declaration));
	            }
	            else if (this.matchContextualKeyword('async')) {
	                // export default async function f () {}
	                // export default async function () {}
	                // export default async x => x
	                var declaration = this.matchAsyncFunction() ? this.parseFunctionDeclaration(true) : this.parseAssignmentExpression();
	                exportDeclaration = this.finalize(node, new Node.ExportDefaultDeclaration(declaration));
	            }
	            else {
	                if (this.matchContextualKeyword('from')) {
	                    this.throwError(messages_1.Messages.UnexpectedToken, this.lookahead.value);
	                }
	                // export default {};
	                // export default [];
	                // export default (1 + 2);
	                var declaration = this.match('{') ? this.parseObjectInitializer() :
	                    this.match('[') ? this.parseArrayInitializer() : this.parseAssignmentExpression();
	                this.consumeSemicolon();
	                exportDeclaration = this.finalize(node, new Node.ExportDefaultDeclaration(declaration));
	            }
	        }
	        else if (this.match('*')) {
	            // export * from 'foo';
	            this.nextToken();
	            if (!this.matchContextualKeyword('from')) {
	                var message = this.lookahead.value ? messages_1.Messages.UnexpectedToken : messages_1.Messages.MissingFromClause;
	                this.throwError(message, this.lookahead.value);
	            }
	            this.nextToken();
	            var src = this.parseModuleSpecifier();
	            this.consumeSemicolon();
	            exportDeclaration = this.finalize(node, new Node.ExportAllDeclaration(src));
	        }
	        else if (this.lookahead.type === 4 /* Keyword */) {
	            // export var f = 1;
	            var declaration = void 0;
	            switch (this.lookahead.value) {
	                case 'let':
	                case 'const':
	                    declaration = this.parseLexicalDeclaration({ inFor: false });
	                    break;
	                case 'var':
	                case 'class':
	                case 'function':
	                    declaration = this.parseStatementListItem();
	                    break;
	                default:
	                    this.throwUnexpectedToken(this.lookahead);
	            }
	            exportDeclaration = this.finalize(node, new Node.ExportNamedDeclaration(declaration, [], null));
	        }
	        else if (this.matchAsyncFunction()) {
	            var declaration = this.parseFunctionDeclaration();
	            exportDeclaration = this.finalize(node, new Node.ExportNamedDeclaration(declaration, [], null));
	        }
	        else {
	            var specifiers = [];
	            var source = null;
	            var isExportFromIdentifier = false;
	            this.expect('{');
	            while (!this.match('}')) {
	                isExportFromIdentifier = isExportFromIdentifier || this.matchKeyword('default');
	                specifiers.push(this.parseExportSpecifier());
	                if (!this.match('}')) {
	                    this.expect(',');
	                }
	            }
	            this.expect('}');
	            if (this.matchContextualKeyword('from')) {
	                // export {default} from 'foo';
	                // export {foo} from 'foo';
	                this.nextToken();
	                source = this.parseModuleSpecifier();
	                this.consumeSemicolon();
	            }
	            else if (isExportFromIdentifier) {
	                // export {default}; // missing fromClause
	                var message = this.lookahead.value ? messages_1.Messages.UnexpectedToken : messages_1.Messages.MissingFromClause;
	                this.throwError(message, this.lookahead.value);
	            }
	            else {
	                // export {foo};
	                this.consumeSemicolon();
	            }
	            exportDeclaration = this.finalize(node, new Node.ExportNamedDeclaration(null, specifiers, source));
	        }
	        return exportDeclaration;
	    };
	    return Parser;
	}());
	exports.Parser = Parser;


/***/ },
/* 9 */
/***/ function(module, exports) {

	"use strict";
	// Ensure the condition is true, otherwise throw an error.
	// This is only to have a better contract semantic, i.e. another safety net
	// to catch a logic error. The condition shall be fulfilled in normal case.
	// Do NOT use this to enforce a certain condition on any user input.
	Object.defineProperty(exports, "__esModule", { value: true });
	function assert(condition, message) {
	    /* istanbul ignore if */
	    if (!condition) {
	        throw new Error('ASSERT: ' + message);
	    }
	}
	exports.assert = assert;


/***/ },
/* 10 */
/***/ function(module, exports) {

	"use strict";
	/* tslint:disable:max-classes-per-file */
	Object.defineProperty(exports, "__esModule", { value: true });
	var ErrorHandler = (function () {
	    function ErrorHandler() {
	        this.errors = [];
	        this.tolerant = false;
	    }
	    ErrorHandler.prototype.recordError = function (error) {
	        this.errors.push(error);
	    };
	    ErrorHandler.prototype.tolerate = function (error) {
	        if (this.tolerant) {
	            this.recordError(error);
	        }
	        else {
	            throw error;
	        }
	    };
	    ErrorHandler.prototype.constructError = function (msg, column) {
	        var error = new Error(msg);
	        try {
	            throw error;
	        }
	        catch (base) {
	            /* istanbul ignore else */
	            if (Object.create && Object.defineProperty) {
	                error = Object.create(base);
	                Object.defineProperty(error, 'column', { value: column });
	            }
	        }
	        /* istanbul ignore next */
	        return error;
	    };
	    ErrorHandler.prototype.createError = function (index, line, col, description) {
	        var msg = 'Line ' + line + ': ' + description;
	        var error = this.constructError(msg, col);
	        error.index = index;
	        error.lineNumber = line;
	        error.description = description;
	        return error;
	    };
	    ErrorHandler.prototype.throwError = function (index, line, col, description) {
	        throw this.createError(index, line, col, description);
	    };
	    ErrorHandler.prototype.tolerateError = function (index, line, col, description) {
	        var error = this.createError(index, line, col, description);
	        if (this.tolerant) {
	            this.recordError(error);
	        }
	        else {
	            throw error;
	        }
	    };
	    return ErrorHandler;
	}());
	exports.ErrorHandler = ErrorHandler;


/***/ },
/* 11 */
/***/ function(module, exports) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	// Error messages should be identical to V8.
	exports.Messages = {
	    BadGetterArity: 'Getter must not have any formal parameters',
	    BadSetterArity: 'Setter must have exactly one formal parameter',
	    BadSetterRestParameter: 'Setter function argument must not be a rest parameter',
	    ConstructorIsAsync: 'Class constructor may not be an async method',
	    ConstructorSpecialMethod: 'Class constructor may not be an accessor',
	    DeclarationMissingInitializer: 'Missing initializer in %0 declaration',
	    DefaultRestParameter: 'Unexpected token =',
	    DuplicateBinding: 'Duplicate binding %0',
	    DuplicateConstructor: 'A class may only have one constructor',
	    DuplicateProtoProperty: 'Duplicate __proto__ fields are not allowed in object literals',
	    ForInOfLoopInitializer: '%0 loop variable declaration may not have an initializer',
	    GeneratorInLegacyContext: 'Generator declarations are not allowed in legacy contexts',
	    IllegalBreak: 'Illegal break statement',
	    IllegalContinue: 'Illegal continue statement',
	    IllegalExportDeclaration: 'Unexpected token',
	    IllegalImportDeclaration: 'Unexpected token',
	    IllegalLanguageModeDirective: 'Illegal \'use strict\' directive in function with non-simple parameter list',
	    IllegalReturn: 'Illegal return statement',
	    InvalidEscapedReservedWord: 'Keyword must not contain escaped characters',
	    InvalidHexEscapeSequence: 'Invalid hexadecimal escape sequence',
	    InvalidLHSInAssignment: 'Invalid left-hand side in assignment',
	    InvalidLHSInForIn: 'Invalid left-hand side in for-in',
	    InvalidLHSInForLoop: 'Invalid left-hand side in for-loop',
	    InvalidModuleSpecifier: 'Unexpected token',
	    InvalidRegExp: 'Invalid regular expression',
	    LetInLexicalBinding: 'let is disallowed as a lexically bound name',
	    MissingFromClause: 'Unexpected token',
	    MultipleDefaultsInSwitch: 'More than one default clause in switch statement',
	    NewlineAfterThrow: 'Illegal newline after throw',
	    NoAsAfterImportNamespace: 'Unexpected token',
	    NoCatchOrFinally: 'Missing catch or finally after try',
	    ParameterAfterRestParameter: 'Rest parameter must be last formal parameter',
	    Redeclaration: '%0 \'%1\' has already been declared',
	    StaticPrototype: 'Classes may not have static property named prototype',
	    StrictCatchVariable: 'Catch variable may not be eval or arguments in strict mode',
	    StrictDelete: 'Delete of an unqualified identifier in strict mode.',
	    StrictFunction: 'In strict mode code, functions can only be declared at top level or inside a block',
	    StrictFunctionName: 'Function name may not be eval or arguments in strict mode',
	    StrictLHSAssignment: 'Assignment to eval or arguments is not allowed in strict mode',
	    StrictLHSPostfix: 'Postfix increment/decrement may not have eval or arguments operand in strict mode',
	    StrictLHSPrefix: 'Prefix increment/decrement may not have eval or arguments operand in strict mode',
	    StrictModeWith: 'Strict mode code may not include a with statement',
	    StrictOctalLiteral: 'Octal literals are not allowed in strict mode.',
	    StrictParamDupe: 'Strict mode function may not have duplicate parameter names',
	    StrictParamName: 'Parameter name eval or arguments is not allowed in strict mode',
	    StrictReservedWord: 'Use of future reserved word in strict mode',
	    StrictVarName: 'Variable name may not be eval or arguments in strict mode',
	    TemplateOctalLiteral: 'Octal literals are not allowed in template strings.',
	    UnexpectedEOS: 'Unexpected end of input',
	    UnexpectedIdentifier: 'Unexpected identifier',
	    UnexpectedNumber: 'Unexpected number',
	    UnexpectedReserved: 'Unexpected reserved word',
	    UnexpectedString: 'Unexpected string',
	    UnexpectedTemplate: 'Unexpected quasi %0',
	    UnexpectedToken: 'Unexpected token %0',
	    UnexpectedTokenIllegal: 'Unexpected token ILLEGAL',
	    UnknownLabel: 'Undefined label \'%0\'',
	    UnterminatedRegExp: 'Invalid regular expression: missing /'
	};


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	var assert_1 = __webpack_require__(9);
	var character_1 = __webpack_require__(4);
	var messages_1 = __webpack_require__(11);
	function hexValue(ch) {
	    return '0123456789abcdef'.indexOf(ch.toLowerCase());
	}
	function octalValue(ch) {
	    return '01234567'.indexOf(ch);
	}
	var Scanner = (function () {
	    function Scanner(code, handler) {
	        this.source = code;
	        this.errorHandler = handler;
	        this.trackComment = false;
	        this.length = code.length;
	        this.index = 0;
	        this.lineNumber = (code.length > 0) ? 1 : 0;
	        this.lineStart = 0;
	        this.curlyStack = [];
	    }
	    Scanner.prototype.saveState = function () {
	        return {
	            index: this.index,
	            lineNumber: this.lineNumber,
	            lineStart: this.lineStart
	        };
	    };
	    Scanner.prototype.restoreState = function (state) {
	        this.index = state.index;
	        this.lineNumber = state.lineNumber;
	        this.lineStart = state.lineStart;
	    };
	    Scanner.prototype.eof = function () {
	        return this.index >= this.length;
	    };
	    Scanner.prototype.throwUnexpectedToken = function (message) {
	        if (message === void 0) { message = messages_1.Messages.UnexpectedTokenIllegal; }
	        return this.errorHandler.throwError(this.index, this.lineNumber, this.index - this.lineStart + 1, message);
	    };
	    Scanner.prototype.tolerateUnexpectedToken = function (message) {
	        if (message === void 0) { message = messages_1.Messages.UnexpectedTokenIllegal; }
	        this.errorHandler.tolerateError(this.index, this.lineNumber, this.index - this.lineStart + 1, message);
	    };
	    // https://tc39.github.io/ecma262/#sec-comments
	    Scanner.prototype.skipSingleLineComment = function (offset) {
	        var comments = [];
	        var start, loc;
	        if (this.trackComment) {
	            comments = [];
	            start = this.index - offset;
	            loc = {
	                start: {
	                    line: this.lineNumber,
	                    column: this.index - this.lineStart - offset
	                },
	                end: {}
	            };
	        }
	        while (!this.eof()) {
	            var ch = this.source.charCodeAt(this.index);
	            ++this.index;
	            if (character_1.Character.isLineTerminator(ch)) {
	                if (this.trackComment) {
	                    loc.end = {
	                        line: this.lineNumber,
	                        column: this.index - this.lineStart - 1
	                    };
	                    var entry = {
	                        multiLine: false,
	                        slice: [start + offset, this.index - 1],
	                        range: [start, this.index - 1],
	                        loc: loc
	                    };
	                    comments.push(entry);
	                }
	                if (ch === 13 && this.source.charCodeAt(this.index) === 10) {
	                    ++this.index;
	                }
	                ++this.lineNumber;
	                this.lineStart = this.index;
	                return comments;
	            }
	        }
	        if (this.trackComment) {
	            loc.end = {
	                line: this.lineNumber,
	                column: this.index - this.lineStart
	            };
	            var entry = {
	                multiLine: false,
	                slice: [start + offset, this.index],
	                range: [start, this.index],
	                loc: loc
	            };
	            comments.push(entry);
	        }
	        return comments;
	    };
	    Scanner.prototype.skipMultiLineComment = function () {
	        var comments = [];
	        var start, loc;
	        if (this.trackComment) {
	            comments = [];
	            start = this.index - 2;
	            loc = {
	                start: {
	                    line: this.lineNumber,
	                    column: this.index - this.lineStart - 2
	                },
	                end: {}
	            };
	        }
	        while (!this.eof()) {
	            var ch = this.source.charCodeAt(this.index);
	            if (character_1.Character.isLineTerminator(ch)) {
	                if (ch === 0x0D && this.source.charCodeAt(this.index + 1) === 0x0A) {
	                    ++this.index;
	                }
	                ++this.lineNumber;
	                ++this.index;
	                this.lineStart = this.index;
	            }
	            else if (ch === 0x2A) {
	                // Block comment ends with '*/'.
	                if (this.source.charCodeAt(this.index + 1) === 0x2F) {
	                    this.index += 2;
	                    if (this.trackComment) {
	                        loc.end = {
	                            line: this.lineNumber,
	                            column: this.index - this.lineStart
	                        };
	                        var entry = {
	                            multiLine: true,
	                            slice: [start + 2, this.index - 2],
	                            range: [start, this.index],
	                            loc: loc
	                        };
	                        comments.push(entry);
	                    }
	                    return comments;
	                }
	                ++this.index;
	            }
	            else {
	                ++this.index;
	            }
	        }
	        // Ran off the end of the file - the whole thing is a comment
	        if (this.trackComment) {
	            loc.end = {
	                line: this.lineNumber,
	                column: this.index - this.lineStart
	            };
	            var entry = {
	                multiLine: true,
	                slice: [start + 2, this.index],
	                range: [start, this.index],
	                loc: loc
	            };
	            comments.push(entry);
	        }
	        this.tolerateUnexpectedToken();
	        return comments;
	    };
	    Scanner.prototype.scanComments = function () {
	        var comments;
	        if (this.trackComment) {
	            comments = [];
	        }
	        var start = (this.index === 0);
	        while (!this.eof()) {
	            var ch = this.source.charCodeAt(this.index);
	            if (character_1.Character.isWhiteSpace(ch)) {
	                ++this.index;
	            }
	            else if (character_1.Character.isLineTerminator(ch)) {
	                ++this.index;
	                if (ch === 0x0D && this.source.charCodeAt(this.index) === 0x0A) {
	                    ++this.index;
	                }
	                ++this.lineNumber;
	                this.lineStart = this.index;
	                start = true;
	            }
	            else if (ch === 0x2F) {
	                ch = this.source.charCodeAt(this.index + 1);
	                if (ch === 0x2F) {
	                    this.index += 2;
	                    var comment = this.skipSingleLineComment(2);
	                    if (this.trackComment) {
	                        comments = comments.concat(comment);
	                    }
	                    start = true;
	                }
	                else if (ch === 0x2A) {
	                    this.index += 2;
	                    var comment = this.skipMultiLineComment();
	                    if (this.trackComment) {
	                        comments = comments.concat(comment);
	                    }
	                }
	                else {
	                    break;
	                }
	            }
	            else if (start && ch === 0x2D) {
	                // U+003E is '>'
	                if ((this.source.charCodeAt(this.index + 1) === 0x2D) && (this.source.charCodeAt(this.index + 2) === 0x3E)) {
	                    // '-->' is a single-line comment
	                    this.index += 3;
	                    var comment = this.skipSingleLineComment(3);
	                    if (this.trackComment) {
	                        comments = comments.concat(comment);
	                    }
	                }
	                else {
	                    break;
	                }
	            }
	            else if (ch === 0x3C) {
	                if (this.source.slice(this.index + 1, this.index + 4) === '!--') {
	                    this.index += 4; // `<!--`
	                    var comment = this.skipSingleLineComment(4);
	                    if (this.trackComment) {
	                        comments = comments.concat(comment);
	                    }
	                }
	                else {
	                    break;
	                }
	            }
	            else {
	                break;
	            }
	        }
	        return comments;
	    };
	    // https://tc39.github.io/ecma262/#sec-future-reserved-words
	    Scanner.prototype.isFutureReservedWord = function (id) {
	        switch (id) {
	            case 'enum':
	            case 'export':
	            case 'import':
	            case 'super':
	                return true;
	            default:
	                return false;
	        }
	    };
	    Scanner.prototype.isStrictModeReservedWord = function (id) {
	        switch (id) {
	            case 'implements':
	            case 'interface':
	            case 'package':
	            case 'private':
	            case 'protected':
	            case 'public':
	            case 'static':
	            case 'yield':
	            case 'let':
	                return true;
	            default:
	                return false;
	        }
	    };
	    Scanner.prototype.isRestrictedWord = function (id) {
	        return id === 'eval' || id === 'arguments';
	    };
	    // https://tc39.github.io/ecma262/#sec-keywords
	    Scanner.prototype.isKeyword = function (id) {
	        switch (id.length) {
	            case 2:
	                return (id === 'if') || (id === 'in') || (id === 'do');
	            case 3:
	                return (id === 'var') || (id === 'for') || (id === 'new') ||
	                    (id === 'try') || (id === 'let');
	            case 4:
	                return (id === 'this') || (id === 'else') || (id === 'case') ||
	                    (id === 'void') || (id === 'with') || (id === 'enum');
	            case 5:
	                return (id === 'while') || (id === 'break') || (id === 'catch') ||
	                    (id === 'throw') || (id === 'const') || (id === 'yield') ||
	                    (id === 'class') || (id === 'super');
	            case 6:
	                return (id === 'return') || (id === 'typeof') || (id === 'delete') ||
	                    (id === 'switch') || (id === 'export') || (id === 'import');
	            case 7:
	                return (id === 'default') || (id === 'finally') || (id === 'extends');
	            case 8:
	                return (id === 'function') || (id === 'continue') || (id === 'debugger');
	            case 10:
	                return (id === 'instanceof');
	            default:
	                return false;
	        }
	    };
	    Scanner.prototype.codePointAt = function (i) {
	        var cp = this.source.charCodeAt(i);
	        if (cp >= 0xD800 && cp <= 0xDBFF) {
	            var second = this.source.charCodeAt(i + 1);
	            if (second >= 0xDC00 && second <= 0xDFFF) {
	                var first = cp;
	                cp = (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
	            }
	        }
	        return cp;
	    };
	    Scanner.prototype.scanHexEscape = function (prefix) {
	        var len = (prefix === 'u') ? 4 : 2;
	        var code = 0;
	        for (var i = 0; i < len; ++i) {
	            if (!this.eof() && character_1.Character.isHexDigit(this.source.charCodeAt(this.index))) {
	                code = code * 16 + hexValue(this.source[this.index++]);
	            }
	            else {
	                return null;
	            }
	        }
	        return String.fromCharCode(code);
	    };
	    Scanner.prototype.scanUnicodeCodePointEscape = function () {
	        var ch = this.source[this.index];
	        var code = 0;
	        // At least, one hex digit is required.
	        if (ch === '}') {
	            this.throwUnexpectedToken();
	        }
	        while (!this.eof()) {
	            ch = this.source[this.index++];
	            if (!character_1.Character.isHexDigit(ch.charCodeAt(0))) {
	                break;
	            }
	            code = code * 16 + hexValue(ch);
	        }
	        if (code > 0x10FFFF || ch !== '}') {
	            this.throwUnexpectedToken();
	        }
	        return character_1.Character.fromCodePoint(code);
	    };
	    Scanner.prototype.getIdentifier = function () {
	        var start = this.index++;
	        while (!this.eof()) {
	            var ch = this.source.charCodeAt(this.index);
	            if (ch === 0x5C) {
	                // Blackslash (U+005C) marks Unicode escape sequence.
	                this.index = start;
	                return this.getComplexIdentifier();
	            }
	            else if (ch >= 0xD800 && ch < 0xDFFF) {
	                // Need to handle surrogate pairs.
	                this.index = start;
	                return this.getComplexIdentifier();
	            }
	            if (character_1.Character.isIdentifierPart(ch)) {
	                ++this.index;
	            }
	            else {
	                break;
	            }
	        }
	        return this.source.slice(start, this.index);
	    };
	    Scanner.prototype.getComplexIdentifier = function () {
	        var cp = this.codePointAt(this.index);
	        var id = character_1.Character.fromCodePoint(cp);
	        this.index += id.length;
	        // '\u' (U+005C, U+0075) denotes an escaped character.
	        var ch;
	        if (cp === 0x5C) {
	            if (this.source.charCodeAt(this.index) !== 0x75) {
	                this.throwUnexpectedToken();
	            }
	            ++this.index;
	            if (this.source[this.index] === '{') {
	                ++this.index;
	                ch = this.scanUnicodeCodePointEscape();
	            }
	            else {
	                ch = this.scanHexEscape('u');
	                if (ch === null || ch === '\\' || !character_1.Character.isIdentifierStart(ch.charCodeAt(0))) {
	                    this.throwUnexpectedToken();
	                }
	            }
	            id = ch;
	        }
	        while (!this.eof()) {
	            cp = this.codePointAt(this.index);
	            if (!character_1.Character.isIdentifierPart(cp)) {
	                break;
	            }
	            ch = character_1.Character.fromCodePoint(cp);
	            id += ch;
	            this.index += ch.length;
	            // '\u' (U+005C, U+0075) denotes an escaped character.
	            if (cp === 0x5C) {
	                id = id.substr(0, id.length - 1);
	                if (this.source.charCodeAt(this.index) !== 0x75) {
	                    this.throwUnexpectedToken();
	                }
	                ++this.index;
	                if (this.source[this.index] === '{') {
	                    ++this.index;
	                    ch = this.scanUnicodeCodePointEscape();
	                }
	                else {
	                    ch = this.scanHexEscape('u');
	                    if (ch === null || ch === '\\' || !character_1.Character.isIdentifierPart(ch.charCodeAt(0))) {
	                        this.throwUnexpectedToken();
	                    }
	                }
	                id += ch;
	            }
	        }
	        return id;
	    };
	    Scanner.prototype.octalToDecimal = function (ch) {
	        // \0 is not octal escape sequence
	        var octal = (ch !== '0');
	        var code = octalValue(ch);
	        if (!this.eof() && character_1.Character.isOctalDigit(this.source.charCodeAt(this.index))) {
	            octal = true;
	            code = code * 8 + octalValue(this.source[this.index++]);
	            // 3 digits are only allowed when string starts
	            // with 0, 1, 2, 3
	            if ('0123'.indexOf(ch) >= 0 && !this.eof() && character_1.Character.isOctalDigit(this.source.charCodeAt(this.index))) {
	                code = code * 8 + octalValue(this.source[this.index++]);
	            }
	        }
	        return {
	            code: code,
	            octal: octal
	        };
	    };
	    // https://tc39.github.io/ecma262/#sec-names-and-keywords
	    Scanner.prototype.scanIdentifier = function () {
	        var type;
	        var start = this.index;
	        // Backslash (U+005C) starts an escaped character.
	        var id = (this.source.charCodeAt(start) === 0x5C) ? this.getComplexIdentifier() : this.getIdentifier();
	        // There is no keyword or literal with only one character.
	        // Thus, it must be an identifier.
	        if (id.length === 1) {
	            type = 3 /* Identifier */;
	        }
	        else if (this.isKeyword(id)) {
	            type = 4 /* Keyword */;
	        }
	        else if (id === 'null') {
	            type = 5 /* NullLiteral */;
	        }
	        else if (id === 'true' || id === 'false') {
	            type = 1 /* BooleanLiteral */;
	        }
	        else {
	            type = 3 /* Identifier */;
	        }
	        if (type !== 3 /* Identifier */ && (start + id.length !== this.index)) {
	            var restore = this.index;
	            this.index = start;
	            this.tolerateUnexpectedToken(messages_1.Messages.InvalidEscapedReservedWord);
	            this.index = restore;
	        }
	        return {
	            type: type,
	            value: id,
	            lineNumber: this.lineNumber,
	            lineStart: this.lineStart,
	            start: start,
	            end: this.index
	        };
	    };
	    // https://tc39.github.io/ecma262/#sec-punctuators
	    Scanner.prototype.scanPunctuator = function () {
	        var start = this.index;
	        // Check for most common single-character punctuators.
	        var str = this.source[this.index];
	        switch (str) {
	            case '(':
	            case '{':
	                if (str === '{') {
	                    this.curlyStack.push('{');
	                }
	                ++this.index;
	                break;
	            case '.':
	                ++this.index;
	                if (this.source[this.index] === '.' && this.source[this.index + 1] === '.') {
	                    // Spread operator: ...
	                    this.index += 2;
	                    str = '...';
	                }
	                break;
	            case '}':
	                ++this.index;
	                this.curlyStack.pop();
	                break;
	            case ')':
	            case ';':
	            case ',':
	            case '[':
	            case ']':
	            case ':':
	            case '?':
	            case '~':
	                ++this.index;
	                break;
	            default:
	                // 4-character punctuator.
	                str = this.source.substr(this.index, 4);
	                if (str === '>>>=') {
	                    this.index += 4;
	                }
	                else {
	                    // 3-character punctuators.
	                    str = str.substr(0, 3);
	                    if (str === '===' || str === '!==' || str === '>>>' ||
	                        str === '<<=' || str === '>>=' || str === '**=') {
	                        this.index += 3;
	                    }
	                    else {
	                        // 2-character punctuators.
	                        str = str.substr(0, 2);
	                        if (str === '&&' || str === '||' || str === '==' || str === '!=' ||
	                            str === '+=' || str === '-=' || str === '*=' || str === '/=' ||
	                            str === '++' || str === '--' || str === '<<' || str === '>>' ||
	                            str === '&=' || str === '|=' || str === '^=' || str === '%=' ||
	                            str === '<=' || str === '>=' || str === '=>' || str === '**') {
	                            this.index += 2;
	                        }
	                        else {
	                            // 1-character punctuators.
	                            str = this.source[this.index];
	                            if ('<>=!+-*%&|^/'.indexOf(str) >= 0) {
	                                ++this.index;
	                            }
	                        }
	                    }
	                }
	        }
	        if (this.index === start) {
	            this.throwUnexpectedToken();
	        }
	        return {
	            type: 7 /* Punctuator */,
	            value: str,
	            lineNumber: this.lineNumber,
	            lineStart: this.lineStart,
	            start: start,
	            end: this.index
	        };
	    };
	    // https://tc39.github.io/ecma262/#sec-literals-numeric-literals
	    Scanner.prototype.scanHexLiteral = function (start) {
	        var num = '';
	        while (!this.eof()) {
	            if (!character_1.Character.isHexDigit(this.source.charCodeAt(this.index))) {
	                break;
	            }
	            num += this.source[this.index++];
	        }
	        if (num.length === 0) {
	            this.throwUnexpectedToken();
	        }
	        if (character_1.Character.isIdentifierStart(this.source.charCodeAt(this.index))) {
	            this.throwUnexpectedToken();
	        }
	        return {
	            type: 6 /* NumericLiteral */,
	            value: parseInt('0x' + num, 16),
	            lineNumber: this.lineNumber,
	            lineStart: this.lineStart,
	            start: start,
	            end: this.index
	        };
	    };
	    Scanner.prototype.scanBinaryLiteral = function (start) {
	        var num = '';
	        var ch;
	        while (!this.eof()) {
	            ch = this.source[this.index];
	            if (ch !== '0' && ch !== '1') {
	                break;
	            }
	            num += this.source[this.index++];
	        }
	        if (num.length === 0) {
	            // only 0b or 0B
	            this.throwUnexpectedToken();
	        }
	        if (!this.eof()) {
	            ch = this.source.charCodeAt(this.index);
	            /* istanbul ignore else */
	            if (character_1.Character.isIdentifierStart(ch) || character_1.Character.isDecimalDigit(ch)) {
	                this.throwUnexpectedToken();
	            }
	        }
	        return {
	            type: 6 /* NumericLiteral */,
	            value: parseInt(num, 2),
	            lineNumber: this.lineNumber,
	            lineStart: this.lineStart,
	            start: start,
	            end: this.index
	        };
	    };
	    Scanner.prototype.scanOctalLiteral = function (prefix, start) {
	        var num = '';
	        var octal = false;
	        if (character_1.Character.isOctalDigit(prefix.charCodeAt(0))) {
	            octal = true;
	            num = '0' + this.source[this.index++];
	        }
	        else {
	            ++this.index;
	        }
	        while (!this.eof()) {
	            if (!character_1.Character.isOctalDigit(this.source.charCodeAt(this.index))) {
	                break;
	            }
	            num += this.source[this.index++];
	        }
	        if (!octal && num.length === 0) {
	            // only 0o or 0O
	            this.throwUnexpectedToken();
	        }
	        if (character_1.Character.isIdentifierStart(this.source.charCodeAt(this.index)) || character_1.Character.isDecimalDigit(this.source.charCodeAt(this.index))) {
	            this.throwUnexpectedToken();
	        }
	        return {
	            type: 6 /* NumericLiteral */,
	            value: parseInt(num, 8),
	            octal: octal,
	            lineNumber: this.lineNumber,
	            lineStart: this.lineStart,
	            start: start,
	            end: this.index
	        };
	    };
	    Scanner.prototype.isImplicitOctalLiteral = function () {
	        // Implicit octal, unless there is a non-octal digit.
	        // (Annex B.1.1 on Numeric Literals)
	        for (var i = this.index + 1; i < this.length; ++i) {
	            var ch = this.source[i];
	            if (ch === '8' || ch === '9') {
	                return false;
	            }
	            if (!character_1.Character.isOctalDigit(ch.charCodeAt(0))) {
	                return true;
	            }
	        }
	        return true;
	    };
	    Scanner.prototype.scanNumericLiteral = function () {
	        var start = this.index;
	        var ch = this.source[start];
	        assert_1.assert(character_1.Character.isDecimalDigit(ch.charCodeAt(0)) || (ch === '.'), 'Numeric literal must start with a decimal digit or a decimal point');
	        var num = '';
	        if (ch !== '.') {
	            num = this.source[this.index++];
	            ch = this.source[this.index];
	            // Hex number starts with '0x'.
	            // Octal number starts with '0'.
	            // Octal number in ES6 starts with '0o'.
	            // Binary number in ES6 starts with '0b'.
	            if (num === '0') {
	                if (ch === 'x' || ch === 'X') {
	                    ++this.index;
	                    return this.scanHexLiteral(start);
	                }
	                if (ch === 'b' || ch === 'B') {
	                    ++this.index;
	                    return this.scanBinaryLiteral(start);
	                }
	                if (ch === 'o' || ch === 'O') {
	                    return this.scanOctalLiteral(ch, start);
	                }
	                if (ch && character_1.Character.isOctalDigit(ch.charCodeAt(0))) {
	                    if (this.isImplicitOctalLiteral()) {
	                        return this.scanOctalLiteral(ch, start);
	                    }
	                }
	            }
	            while (character_1.Character.isDecimalDigit(this.source.charCodeAt(this.index))) {
	                num += this.source[this.index++];
	            }
	            ch = this.source[this.index];
	        }
	        if (ch === '.') {
	            num += this.source[this.index++];
	            while (character_1.Character.isDecimalDigit(this.source.charCodeAt(this.index))) {
	                num += this.source[this.index++];
	            }
	            ch = this.source[this.index];
	        }
	        if (ch === 'e' || ch === 'E') {
	            num += this.source[this.index++];
	            ch = this.source[this.index];
	            if (ch === '+' || ch === '-') {
	                num += this.source[this.index++];
	            }
	            if (character_1.Character.isDecimalDigit(this.source.charCodeAt(this.index))) {
	                while (character_1.Character.isDecimalDigit(this.source.charCodeAt(this.index))) {
	                    num += this.source[this.index++];
	                }
	            }
	            else {
	                this.throwUnexpectedToken();
	            }
	        }
	        if (character_1.Character.isIdentifierStart(this.source.charCodeAt(this.index))) {
	            this.throwUnexpectedToken();
	        }
	        return {
	            type: 6 /* NumericLiteral */,
	            value: parseFloat(num),
	            lineNumber: this.lineNumber,
	            lineStart: this.lineStart,
	            start: start,
	            end: this.index
	        };
	    };
	    // https://tc39.github.io/ecma262/#sec-literals-string-literals
	    Scanner.prototype.scanStringLiteral = function () {
	        var start = this.index;
	        var quote = this.source[start];
	        assert_1.assert((quote === '\'' || quote === '"'), 'String literal must starts with a quote');
	        ++this.index;
	        var octal = false;
	        var str = '';
	        while (!this.eof()) {
	            var ch = this.source[this.index++];
	            if (ch === quote) {
	                quote = '';
	                break;
	            }
	            else if (ch === '\\') {
	                ch = this.source[this.index++];
	                if (!ch || !character_1.Character.isLineTerminator(ch.charCodeAt(0))) {
	                    switch (ch) {
	                        case 'u':
	                            if (this.source[this.index] === '{') {
	                                ++this.index;
	                                str += this.scanUnicodeCodePointEscape();
	                            }
	                            else {
	                                var unescaped_1 = this.scanHexEscape(ch);
	                                if (unescaped_1 === null) {
	                                    this.throwUnexpectedToken();
	                                }
	                                str += unescaped_1;
	                            }
	                            break;
	                        case 'x':
	                            var unescaped = this.scanHexEscape(ch);
	                            if (unescaped === null) {
	                                this.throwUnexpectedToken(messages_1.Messages.InvalidHexEscapeSequence);
	                            }
	                            str += unescaped;
	                            break;
	                        case 'n':
	                            str += '\n';
	                            break;
	                        case 'r':
	                            str += '\r';
	                            break;
	                        case 't':
	                            str += '\t';
	                            break;
	                        case 'b':
	                            str += '\b';
	                            break;
	                        case 'f':
	                            str += '\f';
	                            break;
	                        case 'v':
	                            str += '\x0B';
	                            break;
	                        case '8':
	                        case '9':
	                            str += ch;
	                            this.tolerateUnexpectedToken();
	                            break;
	                        default:
	                            if (ch && character_1.Character.isOctalDigit(ch.charCodeAt(0))) {
	                                var octToDec = this.octalToDecimal(ch);
	                                octal = octToDec.octal || octal;
	                                str += String.fromCharCode(octToDec.code);
	                            }
	                            else {
	                                str += ch;
	                            }
	                            break;
	                    }
	                }
	                else {
	                    ++this.lineNumber;
	                    if (ch === '\r' && this.source[this.index] === '\n') {
	                        ++this.index;
	                    }
	                    this.lineStart = this.index;
	                }
	            }
	            else if (character_1.Character.isLineTerminator(ch.charCodeAt(0))) {
	                break;
	            }
	            else {
	                str += ch;
	            }
	        }
	        if (quote !== '') {
	            this.index = start;
	            this.throwUnexpectedToken();
	        }
	        return {
	            type: 8 /* StringLiteral */,
	            value: str,
	            octal: octal,
	            lineNumber: this.lineNumber,
	            lineStart: this.lineStart,
	            start: start,
	            end: this.index
	        };
	    };
	    // https://tc39.github.io/ecma262/#sec-template-literal-lexical-components
	    Scanner.prototype.scanTemplate = function () {
	        var cooked = '';
	        var terminated = false;
	        var start = this.index;
	        var head = (this.source[start] === '`');
	        var tail = false;
	        var rawOffset = 2;
	        ++this.index;
	        while (!this.eof()) {
	            var ch = this.source[this.index++];
	            if (ch === '`') {
	                rawOffset = 1;
	                tail = true;
	                terminated = true;
	                break;
	            }
	            else if (ch === '$') {
	                if (this.source[this.index] === '{') {
	                    this.curlyStack.push('${');
	                    ++this.index;
	                    terminated = true;
	                    break;
	                }
	                cooked += ch;
	            }
	            else if (ch === '\\') {
	                ch = this.source[this.index++];
	                if (!character_1.Character.isLineTerminator(ch.charCodeAt(0))) {
	                    switch (ch) {
	                        case 'n':
	                            cooked += '\n';
	                            break;
	                        case 'r':
	                            cooked += '\r';
	                            break;
	                        case 't':
	                            cooked += '\t';
	                            break;
	                        case 'u':
	                            if (this.source[this.index] === '{') {
	                                ++this.index;
	                                cooked += this.scanUnicodeCodePointEscape();
	                            }
	                            else {
	                                var restore = this.index;
	                                var unescaped_2 = this.scanHexEscape(ch);
	                                if (unescaped_2 !== null) {
	                                    cooked += unescaped_2;
	                                }
	                                else {
	                                    this.index = restore;
	                                    cooked += ch;
	                                }
	                            }
	                            break;
	                        case 'x':
	                            var unescaped = this.scanHexEscape(ch);
	                            if (unescaped === null) {
	                                this.throwUnexpectedToken(messages_1.Messages.InvalidHexEscapeSequence);
	                            }
	                            cooked += unescaped;
	                            break;
	                        case 'b':
	                            cooked += '\b';
	                            break;
	                        case 'f':
	                            cooked += '\f';
	                            break;
	                        case 'v':
	                            cooked += '\v';
	                            break;
	                        default:
	                            if (ch === '0') {
	                                if (character_1.Character.isDecimalDigit(this.source.charCodeAt(this.index))) {
	                                    // Illegal: \01 \02 and so on
	                                    this.throwUnexpectedToken(messages_1.Messages.TemplateOctalLiteral);
	                                }
	                                cooked += '\0';
	                            }
	                            else if (character_1.Character.isOctalDigit(ch.charCodeAt(0))) {
	                                // Illegal: \1 \2
	                                this.throwUnexpectedToken(messages_1.Messages.TemplateOctalLiteral);
	                            }
	                            else {
	                                cooked += ch;
	                            }
	                            break;
	                    }
	                }
	                else {
	                    ++this.lineNumber;
	                    if (ch === '\r' && this.source[this.index] === '\n') {
	                        ++this.index;
	                    }
	                    this.lineStart = this.index;
	                }
	            }
	            else if (character_1.Character.isLineTerminator(ch.charCodeAt(0))) {
	                ++this.lineNumber;
	                if (ch === '\r' && this.source[this.index] === '\n') {
	                    ++this.index;
	                }
	                this.lineStart = this.index;
	                cooked += '\n';
	            }
	            else {
	                cooked += ch;
	            }
	        }
	        if (!terminated) {
	            this.throwUnexpectedToken();
	        }
	        if (!head) {
	            this.curlyStack.pop();
	        }
	        return {
	            type: 10 /* Template */,
	            value: this.source.slice(start + 1, this.index - rawOffset),
	            cooked: cooked,
	            head: head,
	            tail: tail,
	            lineNumber: this.lineNumber,
	            lineStart: this.lineStart,
	            start: start,
	            end: this.index
	        };
	    };
	    // https://tc39.github.io/ecma262/#sec-literals-regular-expression-literals
	    Scanner.prototype.testRegExp = function (pattern, flags) {
	        // The BMP character to use as a replacement for astral symbols when
	        // translating an ES6 "u"-flagged pattern to an ES5-compatible
	        // approximation.
	        // Note: replacing with '\uFFFF' enables false positives in unlikely
	        // scenarios. For example, `[\u{1044f}-\u{10440}]` is an invalid
	        // pattern that would not be detected by this substitution.
	        var astralSubstitute = '\uFFFF';
	        var tmp = pattern;
	        var self = this;
	        if (flags.indexOf('u') >= 0) {
	            tmp = tmp
	                .replace(/\\u\{([0-9a-fA-F]+)\}|\\u([a-fA-F0-9]{4})/g, function ($0, $1, $2) {
	                var codePoint = parseInt($1 || $2, 16);
	                if (codePoint > 0x10FFFF) {
	                    self.throwUnexpectedToken(messages_1.Messages.InvalidRegExp);
	                }
	                if (codePoint <= 0xFFFF) {
	                    return String.fromCharCode(codePoint);
	                }
	                return astralSubstitute;
	            })
	                .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, astralSubstitute);
	        }
	        // First, detect invalid regular expressions.
	        try {
	            RegExp(tmp);
	        }
	        catch (e) {
	            this.throwUnexpectedToken(messages_1.Messages.InvalidRegExp);
	        }
	        // Return a regular expression object for this pattern-flag pair, or
	        // `null` in case the current environment doesn't support the flags it
	        // uses.
	        try {
	            return new RegExp(pattern, flags);
	        }
	        catch (exception) {
	            /* istanbul ignore next */
	            return null;
	        }
	    };
	    Scanner.prototype.scanRegExpBody = function () {
	        var ch = this.source[this.index];
	        assert_1.assert(ch === '/', 'Regular expression literal must start with a slash');
	        var str = this.source[this.index++];
	        var classMarker = false;
	        var terminated = false;
	        while (!this.eof()) {
	            ch = this.source[this.index++];
	            str += ch;
	            if (ch === '\\') {
	                ch = this.source[this.index++];
	                // https://tc39.github.io/ecma262/#sec-literals-regular-expression-literals
	                if (character_1.Character.isLineTerminator(ch.charCodeAt(0))) {
	                    this.throwUnexpectedToken(messages_1.Messages.UnterminatedRegExp);
	                }
	                str += ch;
	            }
	            else if (character_1.Character.isLineTerminator(ch.charCodeAt(0))) {
	                this.throwUnexpectedToken(messages_1.Messages.UnterminatedRegExp);
	            }
	            else if (classMarker) {
	                if (ch === ']') {
	                    classMarker = false;
	                }
	            }
	            else {
	                if (ch === '/') {
	                    terminated = true;
	                    break;
	                }
	                else if (ch === '[') {
	                    classMarker = true;
	                }
	            }
	        }
	        if (!terminated) {
	            this.throwUnexpectedToken(messages_1.Messages.UnterminatedRegExp);
	        }
	        // Exclude leading and trailing slash.
	        return str.substr(1, str.length - 2);
	    };
	    Scanner.prototype.scanRegExpFlags = function () {
	        var str = '';
	        var flags = '';
	        while (!this.eof()) {
	            var ch = this.source[this.index];
	            if (!character_1.Character.isIdentifierPart(ch.charCodeAt(0))) {
	                break;
	            }
	            ++this.index;
	            if (ch === '\\' && !this.eof()) {
	                ch = this.source[this.index];
	                if (ch === 'u') {
	                    ++this.index;
	                    var restore = this.index;
	                    var char = this.scanHexEscape('u');
	                    if (char !== null) {
	                        flags += char;
	                        for (str += '\\u'; restore < this.index; ++restore) {
	                            str += this.source[restore];
	                        }
	                    }
	                    else {
	                        this.index = restore;
	                        flags += 'u';
	                        str += '\\u';
	                    }
	                    this.tolerateUnexpectedToken();
	                }
	                else {
	                    str += '\\';
	                    this.tolerateUnexpectedToken();
	                }
	            }
	            else {
	                flags += ch;
	                str += ch;
	            }
	        }
	        return flags;
	    };
	    Scanner.prototype.scanRegExp = function () {
	        var start = this.index;
	        var pattern = this.scanRegExpBody();
	        var flags = this.scanRegExpFlags();
	        var value = this.testRegExp(pattern, flags);
	        return {
	            type: 9 /* RegularExpression */,
	            value: '',
	            pattern: pattern,
	            flags: flags,
	            regex: value,
	            lineNumber: this.lineNumber,
	            lineStart: this.lineStart,
	            start: start,
	            end: this.index
	        };
	    };
	    Scanner.prototype.lex = function () {
	        if (this.eof()) {
	            return {
	                type: 2 /* EOF */,
	                value: '',
	                lineNumber: this.lineNumber,
	                lineStart: this.lineStart,
	                start: this.index,
	                end: this.index
	            };
	        }
	        var cp = this.source.charCodeAt(this.index);
	        if (character_1.Character.isIdentifierStart(cp)) {
	            return this.scanIdentifier();
	        }
	        // Very common: ( and ) and ;
	        if (cp === 0x28 || cp === 0x29 || cp === 0x3B) {
	            return this.scanPunctuator();
	        }
	        // String literal starts with single quote (U+0027) or double quote (U+0022).
	        if (cp === 0x27 || cp === 0x22) {
	            return this.scanStringLiteral();
	        }
	        // Dot (.) U+002E can also start a floating-point number, hence the need
	        // to check the next character.
	        if (cp === 0x2E) {
	            if (character_1.Character.isDecimalDigit(this.source.charCodeAt(this.index + 1))) {
	                return this.scanNumericLiteral();
	            }
	            return this.scanPunctuator();
	        }
	        if (character_1.Character.isDecimalDigit(cp)) {
	            return this.scanNumericLiteral();
	        }
	        // Template literals start with ` (U+0060) for template head
	        // or } (U+007D) for template middle or template tail.
	        if (cp === 0x60 || (cp === 0x7D && this.curlyStack[this.curlyStack.length - 1] === '${')) {
	            return this.scanTemplate();
	        }
	        // Possible identifier start in a surrogate pair.
	        if (cp >= 0xD800 && cp < 0xDFFF) {
	            if (character_1.Character.isIdentifierStart(this.codePointAt(this.index))) {
	                return this.scanIdentifier();
	            }
	        }
	        return this.scanPunctuator();
	    };
	    return Scanner;
	}());
	exports.Scanner = Scanner;


/***/ },
/* 13 */
/***/ function(module, exports) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.TokenName = {};
	exports.TokenName[1 /* BooleanLiteral */] = 'Boolean';
	exports.TokenName[2 /* EOF */] = '<end>';
	exports.TokenName[3 /* Identifier */] = 'Identifier';
	exports.TokenName[4 /* Keyword */] = 'Keyword';
	exports.TokenName[5 /* NullLiteral */] = 'Null';
	exports.TokenName[6 /* NumericLiteral */] = 'Numeric';
	exports.TokenName[7 /* Punctuator */] = 'Punctuator';
	exports.TokenName[8 /* StringLiteral */] = 'String';
	exports.TokenName[9 /* RegularExpression */] = 'RegularExpression';
	exports.TokenName[10 /* Template */] = 'Template';


/***/ },
/* 14 */
/***/ function(module, exports) {

	"use strict";
	// Generated by generate-xhtml-entities.js. DO NOT MODIFY!
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.XHTMLEntities = {
	    quot: '\u0022',
	    amp: '\u0026',
	    apos: '\u0027',
	    gt: '\u003E',
	    nbsp: '\u00A0',
	    iexcl: '\u00A1',
	    cent: '\u00A2',
	    pound: '\u00A3',
	    curren: '\u00A4',
	    yen: '\u00A5',
	    brvbar: '\u00A6',
	    sect: '\u00A7',
	    uml: '\u00A8',
	    copy: '\u00A9',
	    ordf: '\u00AA',
	    laquo: '\u00AB',
	    not: '\u00AC',
	    shy: '\u00AD',
	    reg: '\u00AE',
	    macr: '\u00AF',
	    deg: '\u00B0',
	    plusmn: '\u00B1',
	    sup2: '\u00B2',
	    sup3: '\u00B3',
	    acute: '\u00B4',
	    micro: '\u00B5',
	    para: '\u00B6',
	    middot: '\u00B7',
	    cedil: '\u00B8',
	    sup1: '\u00B9',
	    ordm: '\u00BA',
	    raquo: '\u00BB',
	    frac14: '\u00BC',
	    frac12: '\u00BD',
	    frac34: '\u00BE',
	    iquest: '\u00BF',
	    Agrave: '\u00C0',
	    Aacute: '\u00C1',
	    Acirc: '\u00C2',
	    Atilde: '\u00C3',
	    Auml: '\u00C4',
	    Aring: '\u00C5',
	    AElig: '\u00C6',
	    Ccedil: '\u00C7',
	    Egrave: '\u00C8',
	    Eacute: '\u00C9',
	    Ecirc: '\u00CA',
	    Euml: '\u00CB',
	    Igrave: '\u00CC',
	    Iacute: '\u00CD',
	    Icirc: '\u00CE',
	    Iuml: '\u00CF',
	    ETH: '\u00D0',
	    Ntilde: '\u00D1',
	    Ograve: '\u00D2',
	    Oacute: '\u00D3',
	    Ocirc: '\u00D4',
	    Otilde: '\u00D5',
	    Ouml: '\u00D6',
	    times: '\u00D7',
	    Oslash: '\u00D8',
	    Ugrave: '\u00D9',
	    Uacute: '\u00DA',
	    Ucirc: '\u00DB',
	    Uuml: '\u00DC',
	    Yacute: '\u00DD',
	    THORN: '\u00DE',
	    szlig: '\u00DF',
	    agrave: '\u00E0',
	    aacute: '\u00E1',
	    acirc: '\u00E2',
	    atilde: '\u00E3',
	    auml: '\u00E4',
	    aring: '\u00E5',
	    aelig: '\u00E6',
	    ccedil: '\u00E7',
	    egrave: '\u00E8',
	    eacute: '\u00E9',
	    ecirc: '\u00EA',
	    euml: '\u00EB',
	    igrave: '\u00EC',
	    iacute: '\u00ED',
	    icirc: '\u00EE',
	    iuml: '\u00EF',
	    eth: '\u00F0',
	    ntilde: '\u00F1',
	    ograve: '\u00F2',
	    oacute: '\u00F3',
	    ocirc: '\u00F4',
	    otilde: '\u00F5',
	    ouml: '\u00F6',
	    divide: '\u00F7',
	    oslash: '\u00F8',
	    ugrave: '\u00F9',
	    uacute: '\u00FA',
	    ucirc: '\u00FB',
	    uuml: '\u00FC',
	    yacute: '\u00FD',
	    thorn: '\u00FE',
	    yuml: '\u00FF',
	    OElig: '\u0152',
	    oelig: '\u0153',
	    Scaron: '\u0160',
	    scaron: '\u0161',
	    Yuml: '\u0178',
	    fnof: '\u0192',
	    circ: '\u02C6',
	    tilde: '\u02DC',
	    Alpha: '\u0391',
	    Beta: '\u0392',
	    Gamma: '\u0393',
	    Delta: '\u0394',
	    Epsilon: '\u0395',
	    Zeta: '\u0396',
	    Eta: '\u0397',
	    Theta: '\u0398',
	    Iota: '\u0399',
	    Kappa: '\u039A',
	    Lambda: '\u039B',
	    Mu: '\u039C',
	    Nu: '\u039D',
	    Xi: '\u039E',
	    Omicron: '\u039F',
	    Pi: '\u03A0',
	    Rho: '\u03A1',
	    Sigma: '\u03A3',
	    Tau: '\u03A4',
	    Upsilon: '\u03A5',
	    Phi: '\u03A6',
	    Chi: '\u03A7',
	    Psi: '\u03A8',
	    Omega: '\u03A9',
	    alpha: '\u03B1',
	    beta: '\u03B2',
	    gamma: '\u03B3',
	    delta: '\u03B4',
	    epsilon: '\u03B5',
	    zeta: '\u03B6',
	    eta: '\u03B7',
	    theta: '\u03B8',
	    iota: '\u03B9',
	    kappa: '\u03BA',
	    lambda: '\u03BB',
	    mu: '\u03BC',
	    nu: '\u03BD',
	    xi: '\u03BE',
	    omicron: '\u03BF',
	    pi: '\u03C0',
	    rho: '\u03C1',
	    sigmaf: '\u03C2',
	    sigma: '\u03C3',
	    tau: '\u03C4',
	    upsilon: '\u03C5',
	    phi: '\u03C6',
	    chi: '\u03C7',
	    psi: '\u03C8',
	    omega: '\u03C9',
	    thetasym: '\u03D1',
	    upsih: '\u03D2',
	    piv: '\u03D6',
	    ensp: '\u2002',
	    emsp: '\u2003',
	    thinsp: '\u2009',
	    zwnj: '\u200C',
	    zwj: '\u200D',
	    lrm: '\u200E',
	    rlm: '\u200F',
	    ndash: '\u2013',
	    mdash: '\u2014',
	    lsquo: '\u2018',
	    rsquo: '\u2019',
	    sbquo: '\u201A',
	    ldquo: '\u201C',
	    rdquo: '\u201D',
	    bdquo: '\u201E',
	    dagger: '\u2020',
	    Dagger: '\u2021',
	    bull: '\u2022',
	    hellip: '\u2026',
	    permil: '\u2030',
	    prime: '\u2032',
	    Prime: '\u2033',
	    lsaquo: '\u2039',
	    rsaquo: '\u203A',
	    oline: '\u203E',
	    frasl: '\u2044',
	    euro: '\u20AC',
	    image: '\u2111',
	    weierp: '\u2118',
	    real: '\u211C',
	    trade: '\u2122',
	    alefsym: '\u2135',
	    larr: '\u2190',
	    uarr: '\u2191',
	    rarr: '\u2192',
	    darr: '\u2193',
	    harr: '\u2194',
	    crarr: '\u21B5',
	    lArr: '\u21D0',
	    uArr: '\u21D1',
	    rArr: '\u21D2',
	    dArr: '\u21D3',
	    hArr: '\u21D4',
	    forall: '\u2200',
	    part: '\u2202',
	    exist: '\u2203',
	    empty: '\u2205',
	    nabla: '\u2207',
	    isin: '\u2208',
	    notin: '\u2209',
	    ni: '\u220B',
	    prod: '\u220F',
	    sum: '\u2211',
	    minus: '\u2212',
	    lowast: '\u2217',
	    radic: '\u221A',
	    prop: '\u221D',
	    infin: '\u221E',
	    ang: '\u2220',
	    and: '\u2227',
	    or: '\u2228',
	    cap: '\u2229',
	    cup: '\u222A',
	    int: '\u222B',
	    there4: '\u2234',
	    sim: '\u223C',
	    cong: '\u2245',
	    asymp: '\u2248',
	    ne: '\u2260',
	    equiv: '\u2261',
	    le: '\u2264',
	    ge: '\u2265',
	    sub: '\u2282',
	    sup: '\u2283',
	    nsub: '\u2284',
	    sube: '\u2286',
	    supe: '\u2287',
	    oplus: '\u2295',
	    otimes: '\u2297',
	    perp: '\u22A5',
	    sdot: '\u22C5',
	    lceil: '\u2308',
	    rceil: '\u2309',
	    lfloor: '\u230A',
	    rfloor: '\u230B',
	    loz: '\u25CA',
	    spades: '\u2660',
	    clubs: '\u2663',
	    hearts: '\u2665',
	    diams: '\u2666',
	    lang: '\u27E8',
	    rang: '\u27E9'
	};


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	var error_handler_1 = __webpack_require__(10);
	var scanner_1 = __webpack_require__(12);
	var token_1 = __webpack_require__(13);
	var Reader = (function () {
	    function Reader() {
	        this.values = [];
	        this.curly = this.paren = -1;
	    }
	    // A function following one of those tokens is an expression.
	    Reader.prototype.beforeFunctionExpression = function (t) {
	        return ['(', '{', '[', 'in', 'typeof', 'instanceof', 'new',
	            'return', 'case', 'delete', 'throw', 'void',
	            // assignment operators
	            '=', '+=', '-=', '*=', '**=', '/=', '%=', '<<=', '>>=', '>>>=',
	            '&=', '|=', '^=', ',',
	            // binary/unary operators
	            '+', '-', '*', '**', '/', '%', '++', '--', '<<', '>>', '>>>', '&',
	            '|', '^', '!', '~', '&&', '||', '?', ':', '===', '==', '>=',
	            '<=', '<', '>', '!=', '!=='].indexOf(t) >= 0;
	    };
	    // Determine if forward slash (/) is an operator or part of a regular expression
	    // https://github.com/mozilla/sweet.js/wiki/design
	    Reader.prototype.isRegexStart = function () {
	        var previous = this.values[this.values.length - 1];
	        var regex = (previous !== null);
	        switch (previous) {
	            case 'this':
	            case ']':
	                regex = false;
	                break;
	            case ')':
	                var keyword = this.values[this.paren - 1];
	                regex = (keyword === 'if' || keyword === 'while' || keyword === 'for' || keyword === 'with');
	                break;
	            case '}':
	                // Dividing a function by anything makes little sense,
	                // but we have to check for that.
	                regex = false;
	                if (this.values[this.curly - 3] === 'function') {
	                    // Anonymous function, e.g. function(){} /42
	                    var check = this.values[this.curly - 4];
	                    regex = check ? !this.beforeFunctionExpression(check) : false;
	                }
	                else if (this.values[this.curly - 4] === 'function') {
	                    // Named function, e.g. function f(){} /42/
	                    var check = this.values[this.curly - 5];
	                    regex = check ? !this.beforeFunctionExpression(check) : true;
	                }
	                break;
	            default:
	                break;
	        }
	        return regex;
	    };
	    Reader.prototype.push = function (token) {
	        if (token.type === 7 /* Punctuator */ || token.type === 4 /* Keyword */) {
	            if (token.value === '{') {
	                this.curly = this.values.length;
	            }
	            else if (token.value === '(') {
	                this.paren = this.values.length;
	            }
	            this.values.push(token.value);
	        }
	        else {
	            this.values.push(null);
	        }
	    };
	    return Reader;
	}());
	var Tokenizer = (function () {
	    function Tokenizer(code, config) {
	        this.errorHandler = new error_handler_1.ErrorHandler();
	        this.errorHandler.tolerant = config ? (typeof config.tolerant === 'boolean' && config.tolerant) : false;
	        this.scanner = new scanner_1.Scanner(code, this.errorHandler);
	        this.scanner.trackComment = config ? (typeof config.comment === 'boolean' && config.comment) : false;
	        this.trackRange = config ? (typeof config.range === 'boolean' && config.range) : false;
	        this.trackLoc = config ? (typeof config.loc === 'boolean' && config.loc) : false;
	        this.buffer = [];
	        this.reader = new Reader();
	    }
	    Tokenizer.prototype.errors = function () {
	        return this.errorHandler.errors;
	    };
	    Tokenizer.prototype.getNextToken = function () {
	        if (this.buffer.length === 0) {
	            var comments = this.scanner.scanComments();
	            if (this.scanner.trackComment) {
	                for (var i = 0; i < comments.length; ++i) {
	                    var e = comments[i];
	                    var value = this.scanner.source.slice(e.slice[0], e.slice[1]);
	                    var comment = {
	                        type: e.multiLine ? 'BlockComment' : 'LineComment',
	                        value: value
	                    };
	                    if (this.trackRange) {
	                        comment.range = e.range;
	                    }
	                    if (this.trackLoc) {
	                        comment.loc = e.loc;
	                    }
	                    this.buffer.push(comment);
	                }
	            }
	            if (!this.scanner.eof()) {
	                var loc = void 0;
	                if (this.trackLoc) {
	                    loc = {
	                        start: {
	                            line: this.scanner.lineNumber,
	                            column: this.scanner.index - this.scanner.lineStart
	                        },
	                        end: {}
	                    };
	                }
	                var startRegex = (this.scanner.source[this.scanner.index] === '/') && this.reader.isRegexStart();
	                var token = startRegex ? this.scanner.scanRegExp() : this.scanner.lex();
	                this.reader.push(token);
	                var entry = {
	                    type: token_1.TokenName[token.type],
	                    value: this.scanner.source.slice(token.start, token.end)
	                };
	                if (this.trackRange) {
	                    entry.range = [token.start, token.end];
	                }
	                if (this.trackLoc) {
	                    loc.end = {
	                        line: this.scanner.lineNumber,
	                        column: this.scanner.index - this.scanner.lineStart
	                    };
	                    entry.loc = loc;
	                }
	                if (token.type === 9 /* RegularExpression */) {
	                    var pattern = token.pattern;
	                    var flags = token.flags;
	                    entry.regex = { pattern: pattern, flags: flags };
	                }
	                this.buffer.push(entry);
	            }
	        }
	        return this.buffer.shift();
	    };
	    return Tokenizer;
	}());
	exports.Tokenizer = Tokenizer;


/***/ }
/******/ ])
});
;
},{}],15:[function(require,module,exports){
/*
  Copyright (C) 2012-2013 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2012 Ariya Hidayat <ariya.hidayat@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
/*jslint vars:false, bitwise:true*/
/*jshint indent:4*/
/*global exports:true*/
(function clone(exports) {
    'use strict';

    var Syntax,
        isArray,
        VisitorOption,
        VisitorKeys,
        objectCreate,
        objectKeys,
        BREAK,
        SKIP,
        REMOVE;

    function ignoreJSHintError() { }

    isArray = Array.isArray;
    if (!isArray) {
        isArray = function isArray(array) {
            return Object.prototype.toString.call(array) === '[object Array]';
        };
    }

    function deepCopy(obj) {
        var ret = {}, key, val;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                val = obj[key];
                if (typeof val === 'object' && val !== null) {
                    ret[key] = deepCopy(val);
                } else {
                    ret[key] = val;
                }
            }
        }
        return ret;
    }

    function shallowCopy(obj) {
        var ret = {}, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                ret[key] = obj[key];
            }
        }
        return ret;
    }
    ignoreJSHintError(shallowCopy);

    // based on LLVM libc++ upper_bound / lower_bound
    // MIT License

    function upperBound(array, func) {
        var diff, len, i, current;

        len = array.length;
        i = 0;

        while (len) {
            diff = len >>> 1;
            current = i + diff;
            if (func(array[current])) {
                len = diff;
            } else {
                i = current + 1;
                len -= diff + 1;
            }
        }
        return i;
    }

    function lowerBound(array, func) {
        var diff, len, i, current;

        len = array.length;
        i = 0;

        while (len) {
            diff = len >>> 1;
            current = i + diff;
            if (func(array[current])) {
                i = current + 1;
                len -= diff + 1;
            } else {
                len = diff;
            }
        }
        return i;
    }
    ignoreJSHintError(lowerBound);

    objectCreate = Object.create || (function () {
        function F() { }

        return function (o) {
            F.prototype = o;
            return new F();
        };
    })();

    objectKeys = Object.keys || function (o) {
        var keys = [], key;
        for (key in o) {
            keys.push(key);
        }
        return keys;
    };

    function extend(to, from) {
        var keys = objectKeys(from), key, i, len;
        for (i = 0, len = keys.length; i < len; i += 1) {
            key = keys[i];
            to[key] = from[key];
        }
        return to;
    }

    Syntax = {
        AssignmentExpression: 'AssignmentExpression',
        AssignmentPattern: 'AssignmentPattern',
        ArrayExpression: 'ArrayExpression',
        ArrayPattern: 'ArrayPattern',
        ArrowFunctionExpression: 'ArrowFunctionExpression',
        AwaitExpression: 'AwaitExpression', // CAUTION: It's deferred to ES7.
        BlockStatement: 'BlockStatement',
        BinaryExpression: 'BinaryExpression',
        BreakStatement: 'BreakStatement',
        CallExpression: 'CallExpression',
        CatchClause: 'CatchClause',
        ClassBody: 'ClassBody',
        ClassDeclaration: 'ClassDeclaration',
        ClassExpression: 'ClassExpression',
        ComprehensionBlock: 'ComprehensionBlock',  // CAUTION: It's deferred to ES7.
        ComprehensionExpression: 'ComprehensionExpression',  // CAUTION: It's deferred to ES7.
        ConditionalExpression: 'ConditionalExpression',
        ContinueStatement: 'ContinueStatement',
        DebuggerStatement: 'DebuggerStatement',
        DirectiveStatement: 'DirectiveStatement',
        DoWhileStatement: 'DoWhileStatement',
        EmptyStatement: 'EmptyStatement',
        ExportAllDeclaration: 'ExportAllDeclaration',
        ExportDefaultDeclaration: 'ExportDefaultDeclaration',
        ExportNamedDeclaration: 'ExportNamedDeclaration',
        ExportSpecifier: 'ExportSpecifier',
        ExpressionStatement: 'ExpressionStatement',
        ForStatement: 'ForStatement',
        ForInStatement: 'ForInStatement',
        ForOfStatement: 'ForOfStatement',
        FunctionDeclaration: 'FunctionDeclaration',
        FunctionExpression: 'FunctionExpression',
        GeneratorExpression: 'GeneratorExpression',  // CAUTION: It's deferred to ES7.
        Identifier: 'Identifier',
        IfStatement: 'IfStatement',
        ImportDeclaration: 'ImportDeclaration',
        ImportDefaultSpecifier: 'ImportDefaultSpecifier',
        ImportNamespaceSpecifier: 'ImportNamespaceSpecifier',
        ImportSpecifier: 'ImportSpecifier',
        Literal: 'Literal',
        LabeledStatement: 'LabeledStatement',
        LogicalExpression: 'LogicalExpression',
        MemberExpression: 'MemberExpression',
        MetaProperty: 'MetaProperty',
        MethodDefinition: 'MethodDefinition',
        ModuleSpecifier: 'ModuleSpecifier',
        NewExpression: 'NewExpression',
        ObjectExpression: 'ObjectExpression',
        ObjectPattern: 'ObjectPattern',
        Program: 'Program',
        Property: 'Property',
        RestElement: 'RestElement',
        ReturnStatement: 'ReturnStatement',
        SequenceExpression: 'SequenceExpression',
        SpreadElement: 'SpreadElement',
        Super: 'Super',
        SwitchStatement: 'SwitchStatement',
        SwitchCase: 'SwitchCase',
        TaggedTemplateExpression: 'TaggedTemplateExpression',
        TemplateElement: 'TemplateElement',
        TemplateLiteral: 'TemplateLiteral',
        ThisExpression: 'ThisExpression',
        ThrowStatement: 'ThrowStatement',
        TryStatement: 'TryStatement',
        UnaryExpression: 'UnaryExpression',
        UpdateExpression: 'UpdateExpression',
        VariableDeclaration: 'VariableDeclaration',
        VariableDeclarator: 'VariableDeclarator',
        WhileStatement: 'WhileStatement',
        WithStatement: 'WithStatement',
        YieldExpression: 'YieldExpression'
    };

    VisitorKeys = {
        AssignmentExpression: ['left', 'right'],
        AssignmentPattern: ['left', 'right'],
        ArrayExpression: ['elements'],
        ArrayPattern: ['elements'],
        ArrowFunctionExpression: ['params', 'body'],
        AwaitExpression: ['argument'], // CAUTION: It's deferred to ES7.
        BlockStatement: ['body'],
        BinaryExpression: ['left', 'right'],
        BreakStatement: ['label'],
        CallExpression: ['callee', 'arguments'],
        CatchClause: ['param', 'body'],
        ClassBody: ['body'],
        ClassDeclaration: ['id', 'superClass', 'body'],
        ClassExpression: ['id', 'superClass', 'body'],
        ComprehensionBlock: ['left', 'right'],  // CAUTION: It's deferred to ES7.
        ComprehensionExpression: ['blocks', 'filter', 'body'],  // CAUTION: It's deferred to ES7.
        ConditionalExpression: ['test', 'consequent', 'alternate'],
        ContinueStatement: ['label'],
        DebuggerStatement: [],
        DirectiveStatement: [],
        DoWhileStatement: ['body', 'test'],
        EmptyStatement: [],
        ExportAllDeclaration: ['source'],
        ExportDefaultDeclaration: ['declaration'],
        ExportNamedDeclaration: ['declaration', 'specifiers', 'source'],
        ExportSpecifier: ['exported', 'local'],
        ExpressionStatement: ['expression'],
        ForStatement: ['init', 'test', 'update', 'body'],
        ForInStatement: ['left', 'right', 'body'],
        ForOfStatement: ['left', 'right', 'body'],
        FunctionDeclaration: ['id', 'params', 'body'],
        FunctionExpression: ['id', 'params', 'body'],
        GeneratorExpression: ['blocks', 'filter', 'body'],  // CAUTION: It's deferred to ES7.
        Identifier: [],
        IfStatement: ['test', 'consequent', 'alternate'],
        ImportDeclaration: ['specifiers', 'source'],
        ImportDefaultSpecifier: ['local'],
        ImportNamespaceSpecifier: ['local'],
        ImportSpecifier: ['imported', 'local'],
        Literal: [],
        LabeledStatement: ['label', 'body'],
        LogicalExpression: ['left', 'right'],
        MemberExpression: ['object', 'property'],
        MetaProperty: ['meta', 'property'],
        MethodDefinition: ['key', 'value'],
        ModuleSpecifier: [],
        NewExpression: ['callee', 'arguments'],
        ObjectExpression: ['properties'],
        ObjectPattern: ['properties'],
        Program: ['body'],
        Property: ['key', 'value'],
        RestElement: [ 'argument' ],
        ReturnStatement: ['argument'],
        SequenceExpression: ['expressions'],
        SpreadElement: ['argument'],
        Super: [],
        SwitchStatement: ['discriminant', 'cases'],
        SwitchCase: ['test', 'consequent'],
        TaggedTemplateExpression: ['tag', 'quasi'],
        TemplateElement: [],
        TemplateLiteral: ['quasis', 'expressions'],
        ThisExpression: [],
        ThrowStatement: ['argument'],
        TryStatement: ['block', 'handler', 'finalizer'],
        UnaryExpression: ['argument'],
        UpdateExpression: ['argument'],
        VariableDeclaration: ['declarations'],
        VariableDeclarator: ['id', 'init'],
        WhileStatement: ['test', 'body'],
        WithStatement: ['object', 'body'],
        YieldExpression: ['argument']
    };

    // unique id
    BREAK = {};
    SKIP = {};
    REMOVE = {};

    VisitorOption = {
        Break: BREAK,
        Skip: SKIP,
        Remove: REMOVE
    };

    function Reference(parent, key) {
        this.parent = parent;
        this.key = key;
    }

    Reference.prototype.replace = function replace(node) {
        this.parent[this.key] = node;
    };

    Reference.prototype.remove = function remove() {
        if (isArray(this.parent)) {
            this.parent.splice(this.key, 1);
            return true;
        } else {
            this.replace(null);
            return false;
        }
    };

    function Element(node, path, wrap, ref) {
        this.node = node;
        this.path = path;
        this.wrap = wrap;
        this.ref = ref;
    }

    function Controller() { }

    // API:
    // return property path array from root to current node
    Controller.prototype.path = function path() {
        var i, iz, j, jz, result, element;

        function addToPath(result, path) {
            if (isArray(path)) {
                for (j = 0, jz = path.length; j < jz; ++j) {
                    result.push(path[j]);
                }
            } else {
                result.push(path);
            }
        }

        // root node
        if (!this.__current.path) {
            return null;
        }

        // first node is sentinel, second node is root element
        result = [];
        for (i = 2, iz = this.__leavelist.length; i < iz; ++i) {
            element = this.__leavelist[i];
            addToPath(result, element.path);
        }
        addToPath(result, this.__current.path);
        return result;
    };

    // API:
    // return type of current node
    Controller.prototype.type = function () {
        var node = this.current();
        return node.type || this.__current.wrap;
    };

    // API:
    // return array of parent elements
    Controller.prototype.parents = function parents() {
        var i, iz, result;

        // first node is sentinel
        result = [];
        for (i = 1, iz = this.__leavelist.length; i < iz; ++i) {
            result.push(this.__leavelist[i].node);
        }

        return result;
    };

    // API:
    // return current node
    Controller.prototype.current = function current() {
        return this.__current.node;
    };

    Controller.prototype.__execute = function __execute(callback, element) {
        var previous, result;

        result = undefined;

        previous  = this.__current;
        this.__current = element;
        this.__state = null;
        if (callback) {
            result = callback.call(this, element.node, this.__leavelist[this.__leavelist.length - 1].node);
        }
        this.__current = previous;

        return result;
    };

    // API:
    // notify control skip / break
    Controller.prototype.notify = function notify(flag) {
        this.__state = flag;
    };

    // API:
    // skip child nodes of current node
    Controller.prototype.skip = function () {
        this.notify(SKIP);
    };

    // API:
    // break traversals
    Controller.prototype['break'] = function () {
        this.notify(BREAK);
    };

    // API:
    // remove node
    Controller.prototype.remove = function () {
        this.notify(REMOVE);
    };

    Controller.prototype.__initialize = function(root, visitor) {
        this.visitor = visitor;
        this.root = root;
        this.__worklist = [];
        this.__leavelist = [];
        this.__current = null;
        this.__state = null;
        this.__fallback = null;
        if (visitor.fallback === 'iteration') {
            this.__fallback = objectKeys;
        } else if (typeof visitor.fallback === 'function') {
            this.__fallback = visitor.fallback;
        }

        this.__keys = VisitorKeys;
        if (visitor.keys) {
            this.__keys = extend(objectCreate(this.__keys), visitor.keys);
        }
    };

    function isNode(node) {
        if (node == null) {
            return false;
        }
        return typeof node === 'object' && typeof node.type === 'string';
    }

    function isProperty(nodeType, key) {
        return (nodeType === Syntax.ObjectExpression || nodeType === Syntax.ObjectPattern) && 'properties' === key;
    }

    Controller.prototype.traverse = function traverse(root, visitor) {
        var worklist,
            leavelist,
            element,
            node,
            nodeType,
            ret,
            key,
            current,
            current2,
            candidates,
            candidate,
            sentinel;

        this.__initialize(root, visitor);

        sentinel = {};

        // reference
        worklist = this.__worklist;
        leavelist = this.__leavelist;

        // initialize
        worklist.push(new Element(root, null, null, null));
        leavelist.push(new Element(null, null, null, null));

        while (worklist.length) {
            element = worklist.pop();

            if (element === sentinel) {
                element = leavelist.pop();

                ret = this.__execute(visitor.leave, element);

                if (this.__state === BREAK || ret === BREAK) {
                    return;
                }
                continue;
            }

            if (element.node) {

                ret = this.__execute(visitor.enter, element);

                if (this.__state === BREAK || ret === BREAK) {
                    return;
                }

                worklist.push(sentinel);
                leavelist.push(element);

                if (this.__state === SKIP || ret === SKIP) {
                    continue;
                }

                node = element.node;
                nodeType = node.type || element.wrap;
                candidates = this.__keys[nodeType];
                if (!candidates) {
                    if (this.__fallback) {
                        candidates = this.__fallback(node);
                    } else {
                        throw new Error('Unknown node type ' + nodeType + '.');
                    }
                }

                current = candidates.length;
                while ((current -= 1) >= 0) {
                    key = candidates[current];
                    candidate = node[key];
                    if (!candidate) {
                        continue;
                    }

                    if (isArray(candidate)) {
                        current2 = candidate.length;
                        while ((current2 -= 1) >= 0) {
                            if (!candidate[current2]) {
                                continue;
                            }
                            if (isProperty(nodeType, candidates[current])) {
                                element = new Element(candidate[current2], [key, current2], 'Property', null);
                            } else if (isNode(candidate[current2])) {
                                element = new Element(candidate[current2], [key, current2], null, null);
                            } else {
                                continue;
                            }
                            worklist.push(element);
                        }
                    } else if (isNode(candidate)) {
                        worklist.push(new Element(candidate, key, null, null));
                    }
                }
            }
        }
    };

    Controller.prototype.replace = function replace(root, visitor) {
        var worklist,
            leavelist,
            node,
            nodeType,
            target,
            element,
            current,
            current2,
            candidates,
            candidate,
            sentinel,
            outer,
            key;

        function removeElem(element) {
            var i,
                key,
                nextElem,
                parent;

            if (element.ref.remove()) {
                // When the reference is an element of an array.
                key = element.ref.key;
                parent = element.ref.parent;

                // If removed from array, then decrease following items' keys.
                i = worklist.length;
                while (i--) {
                    nextElem = worklist[i];
                    if (nextElem.ref && nextElem.ref.parent === parent) {
                        if  (nextElem.ref.key < key) {
                            break;
                        }
                        --nextElem.ref.key;
                    }
                }
            }
        }

        this.__initialize(root, visitor);

        sentinel = {};

        // reference
        worklist = this.__worklist;
        leavelist = this.__leavelist;

        // initialize
        outer = {
            root: root
        };
        element = new Element(root, null, null, new Reference(outer, 'root'));
        worklist.push(element);
        leavelist.push(element);

        while (worklist.length) {
            element = worklist.pop();

            if (element === sentinel) {
                element = leavelist.pop();

                target = this.__execute(visitor.leave, element);

                // node may be replaced with null,
                // so distinguish between undefined and null in this place
                if (target !== undefined && target !== BREAK && target !== SKIP && target !== REMOVE) {
                    // replace
                    element.ref.replace(target);
                }

                if (this.__state === REMOVE || target === REMOVE) {
                    removeElem(element);
                }

                if (this.__state === BREAK || target === BREAK) {
                    return outer.root;
                }
                continue;
            }

            target = this.__execute(visitor.enter, element);

            // node may be replaced with null,
            // so distinguish between undefined and null in this place
            if (target !== undefined && target !== BREAK && target !== SKIP && target !== REMOVE) {
                // replace
                element.ref.replace(target);
                element.node = target;
            }

            if (this.__state === REMOVE || target === REMOVE) {
                removeElem(element);
                element.node = null;
            }

            if (this.__state === BREAK || target === BREAK) {
                return outer.root;
            }

            // node may be null
            node = element.node;
            if (!node) {
                continue;
            }

            worklist.push(sentinel);
            leavelist.push(element);

            if (this.__state === SKIP || target === SKIP) {
                continue;
            }

            nodeType = node.type || element.wrap;
            candidates = this.__keys[nodeType];
            if (!candidates) {
                if (this.__fallback) {
                    candidates = this.__fallback(node);
                } else {
                    throw new Error('Unknown node type ' + nodeType + '.');
                }
            }

            current = candidates.length;
            while ((current -= 1) >= 0) {
                key = candidates[current];
                candidate = node[key];
                if (!candidate) {
                    continue;
                }

                if (isArray(candidate)) {
                    current2 = candidate.length;
                    while ((current2 -= 1) >= 0) {
                        if (!candidate[current2]) {
                            continue;
                        }
                        if (isProperty(nodeType, candidates[current])) {
                            element = new Element(candidate[current2], [key, current2], 'Property', new Reference(candidate, current2));
                        } else if (isNode(candidate[current2])) {
                            element = new Element(candidate[current2], [key, current2], null, new Reference(candidate, current2));
                        } else {
                            continue;
                        }
                        worklist.push(element);
                    }
                } else if (isNode(candidate)) {
                    worklist.push(new Element(candidate, key, null, new Reference(node, key)));
                }
            }
        }

        return outer.root;
    };

    function traverse(root, visitor) {
        var controller = new Controller();
        return controller.traverse(root, visitor);
    }

    function replace(root, visitor) {
        var controller = new Controller();
        return controller.replace(root, visitor);
    }

    function extendCommentRange(comment, tokens) {
        var target;

        target = upperBound(tokens, function search(token) {
            return token.range[0] > comment.range[0];
        });

        comment.extendedRange = [comment.range[0], comment.range[1]];

        if (target !== tokens.length) {
            comment.extendedRange[1] = tokens[target].range[0];
        }

        target -= 1;
        if (target >= 0) {
            comment.extendedRange[0] = tokens[target].range[1];
        }

        return comment;
    }

    function attachComments(tree, providedComments, tokens) {
        // At first, we should calculate extended comment ranges.
        var comments = [], comment, len, i, cursor;

        if (!tree.range) {
            throw new Error('attachComments needs range information');
        }

        // tokens array is empty, we attach comments to tree as 'leadingComments'
        if (!tokens.length) {
            if (providedComments.length) {
                for (i = 0, len = providedComments.length; i < len; i += 1) {
                    comment = deepCopy(providedComments[i]);
                    comment.extendedRange = [0, tree.range[0]];
                    comments.push(comment);
                }
                tree.leadingComments = comments;
            }
            return tree;
        }

        for (i = 0, len = providedComments.length; i < len; i += 1) {
            comments.push(extendCommentRange(deepCopy(providedComments[i]), tokens));
        }

        // This is based on John Freeman's implementation.
        cursor = 0;
        traverse(tree, {
            enter: function (node) {
                var comment;

                while (cursor < comments.length) {
                    comment = comments[cursor];
                    if (comment.extendedRange[1] > node.range[0]) {
                        break;
                    }

                    if (comment.extendedRange[1] === node.range[0]) {
                        if (!node.leadingComments) {
                            node.leadingComments = [];
                        }
                        node.leadingComments.push(comment);
                        comments.splice(cursor, 1);
                    } else {
                        cursor += 1;
                    }
                }

                // already out of owned node
                if (cursor === comments.length) {
                    return VisitorOption.Break;
                }

                if (comments[cursor].extendedRange[0] > node.range[1]) {
                    return VisitorOption.Skip;
                }
            }
        });

        cursor = 0;
        traverse(tree, {
            leave: function (node) {
                var comment;

                while (cursor < comments.length) {
                    comment = comments[cursor];
                    if (node.range[1] < comment.extendedRange[0]) {
                        break;
                    }

                    if (node.range[1] === comment.extendedRange[0]) {
                        if (!node.trailingComments) {
                            node.trailingComments = [];
                        }
                        node.trailingComments.push(comment);
                        comments.splice(cursor, 1);
                    } else {
                        cursor += 1;
                    }
                }

                // already out of owned node
                if (cursor === comments.length) {
                    return VisitorOption.Break;
                }

                if (comments[cursor].extendedRange[0] > node.range[1]) {
                    return VisitorOption.Skip;
                }
            }
        });

        return tree;
    }

    exports.version = require('./package.json').version;
    exports.Syntax = Syntax;
    exports.traverse = traverse;
    exports.replace = replace;
    exports.attachComments = attachComments;
    exports.VisitorKeys = VisitorKeys;
    exports.VisitorOption = VisitorOption;
    exports.Controller = Controller;
    exports.cloneEnvironment = function () { return clone({}); };

    return exports;
}(exports));
/* vim: set sw=4 ts=4 et tw=80 : */

},{"./package.json":16}],16:[function(require,module,exports){
module.exports={
  "_from": "estraverse@^4.2.0",
  "_id": "estraverse@4.2.0",
  "_inBundle": false,
  "_integrity": "sha1-De4/7TH81GlhjOc0IJn8GvoL2xM=",
  "_location": "/estraverse",
  "_phantomChildren": {},
  "_requested": {
    "type": "range",
    "registry": true,
    "raw": "estraverse@^4.2.0",
    "name": "estraverse",
    "escapedName": "estraverse",
    "rawSpec": "^4.2.0",
    "saveSpec": null,
    "fetchSpec": "^4.2.0"
  },
  "_requiredBy": [
    "/escodegen"
  ],
  "_resolved": "http://repo.arteris.com/repository/npm/estraverse/-/estraverse-4.2.0.tgz",
  "_shasum": "0dee3fed31fcd469618ce7342099fc1afa0bdb13",
  "_spec": "estraverse@^4.2.0",
  "_where": "/home/dant/arteris/fontgenerator/node_modules/escodegen",
  "bugs": {
    "url": "https://github.com/estools/estraverse/issues"
  },
  "bundleDependencies": false,
  "deprecated": false,
  "description": "ECMAScript JS AST traversal functions",
  "devDependencies": {
    "babel-preset-es2015": "^6.3.13",
    "babel-register": "^6.3.13",
    "chai": "^2.1.1",
    "espree": "^1.11.0",
    "gulp": "^3.8.10",
    "gulp-bump": "^0.2.2",
    "gulp-filter": "^2.0.0",
    "gulp-git": "^1.0.1",
    "gulp-tag-version": "^1.2.1",
    "jshint": "^2.5.6",
    "mocha": "^2.1.0"
  },
  "engines": {
    "node": ">=0.10.0"
  },
  "homepage": "https://github.com/estools/estraverse",
  "license": "BSD-2-Clause",
  "main": "estraverse.js",
  "maintainers": [
    {
      "name": "Yusuke Suzuki",
      "email": "utatane.tea@gmail.com",
      "url": "http://github.com/Constellation"
    }
  ],
  "name": "estraverse",
  "repository": {
    "type": "git",
    "url": "git+ssh://git@github.com/estools/estraverse.git"
  },
  "scripts": {
    "lint": "jshint estraverse.js",
    "test": "npm run-script lint && npm run-script unit-test",
    "unit-test": "mocha --compilers js:babel-register"
  },
  "version": "4.2.0"
}

},{}],17:[function(require,module,exports){
/*
  Copyright (C) 2013 Yusuke Suzuki <utatane.tea@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS 'AS IS'
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function () {
    'use strict';

    function isExpression(node) {
        if (node == null) { return false; }
        switch (node.type) {
            case 'ArrayExpression':
            case 'AssignmentExpression':
            case 'BinaryExpression':
            case 'CallExpression':
            case 'ConditionalExpression':
            case 'FunctionExpression':
            case 'Identifier':
            case 'Literal':
            case 'LogicalExpression':
            case 'MemberExpression':
            case 'NewExpression':
            case 'ObjectExpression':
            case 'SequenceExpression':
            case 'ThisExpression':
            case 'UnaryExpression':
            case 'UpdateExpression':
                return true;
        }
        return false;
    }

    function isIterationStatement(node) {
        if (node == null) { return false; }
        switch (node.type) {
            case 'DoWhileStatement':
            case 'ForInStatement':
            case 'ForStatement':
            case 'WhileStatement':
                return true;
        }
        return false;
    }

    function isStatement(node) {
        if (node == null) { return false; }
        switch (node.type) {
            case 'BlockStatement':
            case 'BreakStatement':
            case 'ContinueStatement':
            case 'DebuggerStatement':
            case 'DoWhileStatement':
            case 'EmptyStatement':
            case 'ExpressionStatement':
            case 'ForInStatement':
            case 'ForStatement':
            case 'IfStatement':
            case 'LabeledStatement':
            case 'ReturnStatement':
            case 'SwitchStatement':
            case 'ThrowStatement':
            case 'TryStatement':
            case 'VariableDeclaration':
            case 'WhileStatement':
            case 'WithStatement':
                return true;
        }
        return false;
    }

    function isSourceElement(node) {
      return isStatement(node) || node != null && node.type === 'FunctionDeclaration';
    }

    function trailingStatement(node) {
        switch (node.type) {
        case 'IfStatement':
            if (node.alternate != null) {
                return node.alternate;
            }
            return node.consequent;

        case 'LabeledStatement':
        case 'ForStatement':
        case 'ForInStatement':
        case 'WhileStatement':
        case 'WithStatement':
            return node.body;
        }
        return null;
    }

    function isProblematicIfStatement(node) {
        var current;

        if (node.type !== 'IfStatement') {
            return false;
        }
        if (node.alternate == null) {
            return false;
        }
        current = node.consequent;
        do {
            if (current.type === 'IfStatement') {
                if (current.alternate == null)  {
                    return true;
                }
            }
            current = trailingStatement(current);
        } while (current);

        return false;
    }

    module.exports = {
        isExpression: isExpression,
        isStatement: isStatement,
        isIterationStatement: isIterationStatement,
        isSourceElement: isSourceElement,
        isProblematicIfStatement: isProblematicIfStatement,

        trailingStatement: trailingStatement
    };
}());
/* vim: set sw=4 ts=4 et tw=80 : */

},{}],18:[function(require,module,exports){
/*
  Copyright (C) 2013-2014 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2014 Ivan Nikulin <ifaaan@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function () {
    'use strict';

    var ES6Regex, ES5Regex, NON_ASCII_WHITESPACES, IDENTIFIER_START, IDENTIFIER_PART, ch;

    // See `tools/generate-identifier-regex.js`.
    ES5Regex = {
        // ECMAScript 5.1/Unicode v7.0.0 NonAsciiIdentifierStart:
        NonAsciiIdentifierStart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/,
        // ECMAScript 5.1/Unicode v7.0.0 NonAsciiIdentifierPart:
        NonAsciiIdentifierPart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/
    };

    ES6Regex = {
        // ECMAScript 6/Unicode v7.0.0 NonAsciiIdentifierStart:
        NonAsciiIdentifierStart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDE00-\uDE11\uDE13-\uDE2B\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF5D-\uDF61]|\uD805[\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDE00-\uDE2F\uDE44\uDE80-\uDEAA]|\uD806[\uDCA0-\uDCDF\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF98]|\uD809[\uDC00-\uDC6E]|[\uD80C\uD840-\uD868\uD86A-\uD86C][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D]|\uD87E[\uDC00-\uDE1D]/,
        // ECMAScript 6/Unicode v7.0.0 NonAsciiIdentifierPart:
        NonAsciiIdentifierPart: /[\xAA\xB5\xB7\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1369-\u1371\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDD0-\uDDDA\uDE00-\uDE11\uDE13-\uDE37\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF01-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9]|\uD806[\uDCA0-\uDCE9\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF98]|\uD809[\uDC00-\uDC6E]|[\uD80C\uD840-\uD868\uD86A-\uD86C][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/
    };

    function isDecimalDigit(ch) {
        return 0x30 <= ch && ch <= 0x39;  // 0..9
    }

    function isHexDigit(ch) {
        return 0x30 <= ch && ch <= 0x39 ||  // 0..9
            0x61 <= ch && ch <= 0x66 ||     // a..f
            0x41 <= ch && ch <= 0x46;       // A..F
    }

    function isOctalDigit(ch) {
        return ch >= 0x30 && ch <= 0x37;  // 0..7
    }

    // 7.2 White Space

    NON_ASCII_WHITESPACES = [
        0x1680, 0x180E,
        0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A,
        0x202F, 0x205F,
        0x3000,
        0xFEFF
    ];

    function isWhiteSpace(ch) {
        return ch === 0x20 || ch === 0x09 || ch === 0x0B || ch === 0x0C || ch === 0xA0 ||
            ch >= 0x1680 && NON_ASCII_WHITESPACES.indexOf(ch) >= 0;
    }

    // 7.3 Line Terminators

    function isLineTerminator(ch) {
        return ch === 0x0A || ch === 0x0D || ch === 0x2028 || ch === 0x2029;
    }

    // 7.6 Identifier Names and Identifiers

    function fromCodePoint(cp) {
        if (cp <= 0xFFFF) { return String.fromCharCode(cp); }
        var cu1 = String.fromCharCode(Math.floor((cp - 0x10000) / 0x400) + 0xD800);
        var cu2 = String.fromCharCode(((cp - 0x10000) % 0x400) + 0xDC00);
        return cu1 + cu2;
    }

    IDENTIFIER_START = new Array(0x80);
    for(ch = 0; ch < 0x80; ++ch) {
        IDENTIFIER_START[ch] =
            ch >= 0x61 && ch <= 0x7A ||  // a..z
            ch >= 0x41 && ch <= 0x5A ||  // A..Z
            ch === 0x24 || ch === 0x5F;  // $ (dollar) and _ (underscore)
    }

    IDENTIFIER_PART = new Array(0x80);
    for(ch = 0; ch < 0x80; ++ch) {
        IDENTIFIER_PART[ch] =
            ch >= 0x61 && ch <= 0x7A ||  // a..z
            ch >= 0x41 && ch <= 0x5A ||  // A..Z
            ch >= 0x30 && ch <= 0x39 ||  // 0..9
            ch === 0x24 || ch === 0x5F;  // $ (dollar) and _ (underscore)
    }

    function isIdentifierStartES5(ch) {
        return ch < 0x80 ? IDENTIFIER_START[ch] : ES5Regex.NonAsciiIdentifierStart.test(fromCodePoint(ch));
    }

    function isIdentifierPartES5(ch) {
        return ch < 0x80 ? IDENTIFIER_PART[ch] : ES5Regex.NonAsciiIdentifierPart.test(fromCodePoint(ch));
    }

    function isIdentifierStartES6(ch) {
        return ch < 0x80 ? IDENTIFIER_START[ch] : ES6Regex.NonAsciiIdentifierStart.test(fromCodePoint(ch));
    }

    function isIdentifierPartES6(ch) {
        return ch < 0x80 ? IDENTIFIER_PART[ch] : ES6Regex.NonAsciiIdentifierPart.test(fromCodePoint(ch));
    }

    module.exports = {
        isDecimalDigit: isDecimalDigit,
        isHexDigit: isHexDigit,
        isOctalDigit: isOctalDigit,
        isWhiteSpace: isWhiteSpace,
        isLineTerminator: isLineTerminator,
        isIdentifierStartES5: isIdentifierStartES5,
        isIdentifierPartES5: isIdentifierPartES5,
        isIdentifierStartES6: isIdentifierStartES6,
        isIdentifierPartES6: isIdentifierPartES6
    };
}());
/* vim: set sw=4 ts=4 et tw=80 : */

},{}],19:[function(require,module,exports){
/*
  Copyright (C) 2013 Yusuke Suzuki <utatane.tea@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function () {
    'use strict';

    var code = require('./code');

    function isStrictModeReservedWordES6(id) {
        switch (id) {
        case 'implements':
        case 'interface':
        case 'package':
        case 'private':
        case 'protected':
        case 'public':
        case 'static':
        case 'let':
            return true;
        default:
            return false;
        }
    }

    function isKeywordES5(id, strict) {
        // yield should not be treated as keyword under non-strict mode.
        if (!strict && id === 'yield') {
            return false;
        }
        return isKeywordES6(id, strict);
    }

    function isKeywordES6(id, strict) {
        if (strict && isStrictModeReservedWordES6(id)) {
            return true;
        }

        switch (id.length) {
        case 2:
            return (id === 'if') || (id === 'in') || (id === 'do');
        case 3:
            return (id === 'var') || (id === 'for') || (id === 'new') || (id === 'try');
        case 4:
            return (id === 'this') || (id === 'else') || (id === 'case') ||
                (id === 'void') || (id === 'with') || (id === 'enum');
        case 5:
            return (id === 'while') || (id === 'break') || (id === 'catch') ||
                (id === 'throw') || (id === 'const') || (id === 'yield') ||
                (id === 'class') || (id === 'super');
        case 6:
            return (id === 'return') || (id === 'typeof') || (id === 'delete') ||
                (id === 'switch') || (id === 'export') || (id === 'import');
        case 7:
            return (id === 'default') || (id === 'finally') || (id === 'extends');
        case 8:
            return (id === 'function') || (id === 'continue') || (id === 'debugger');
        case 10:
            return (id === 'instanceof');
        default:
            return false;
        }
    }

    function isReservedWordES5(id, strict) {
        return id === 'null' || id === 'true' || id === 'false' || isKeywordES5(id, strict);
    }

    function isReservedWordES6(id, strict) {
        return id === 'null' || id === 'true' || id === 'false' || isKeywordES6(id, strict);
    }

    function isRestrictedWord(id) {
        return id === 'eval' || id === 'arguments';
    }

    function isIdentifierNameES5(id) {
        var i, iz, ch;

        if (id.length === 0) { return false; }

        ch = id.charCodeAt(0);
        if (!code.isIdentifierStartES5(ch)) {
            return false;
        }

        for (i = 1, iz = id.length; i < iz; ++i) {
            ch = id.charCodeAt(i);
            if (!code.isIdentifierPartES5(ch)) {
                return false;
            }
        }
        return true;
    }

    function decodeUtf16(lead, trail) {
        return (lead - 0xD800) * 0x400 + (trail - 0xDC00) + 0x10000;
    }

    function isIdentifierNameES6(id) {
        var i, iz, ch, lowCh, check;

        if (id.length === 0) { return false; }

        check = code.isIdentifierStartES6;
        for (i = 0, iz = id.length; i < iz; ++i) {
            ch = id.charCodeAt(i);
            if (0xD800 <= ch && ch <= 0xDBFF) {
                ++i;
                if (i >= iz) { return false; }
                lowCh = id.charCodeAt(i);
                if (!(0xDC00 <= lowCh && lowCh <= 0xDFFF)) {
                    return false;
                }
                ch = decodeUtf16(ch, lowCh);
            }
            if (!check(ch)) {
                return false;
            }
            check = code.isIdentifierPartES6;
        }
        return true;
    }

    function isIdentifierES5(id, strict) {
        return isIdentifierNameES5(id) && !isReservedWordES5(id, strict);
    }

    function isIdentifierES6(id, strict) {
        return isIdentifierNameES6(id) && !isReservedWordES6(id, strict);
    }

    module.exports = {
        isKeywordES5: isKeywordES5,
        isKeywordES6: isKeywordES6,
        isReservedWordES5: isReservedWordES5,
        isReservedWordES6: isReservedWordES6,
        isRestrictedWord: isRestrictedWord,
        isIdentifierNameES5: isIdentifierNameES5,
        isIdentifierNameES6: isIdentifierNameES6,
        isIdentifierES5: isIdentifierES5,
        isIdentifierES6: isIdentifierES6
    };
}());
/* vim: set sw=4 ts=4 et tw=80 : */

},{"./code":18}],20:[function(require,module,exports){
/*
  Copyright (C) 2013 Yusuke Suzuki <utatane.tea@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/


(function () {
    'use strict';

    exports.ast = require('./ast');
    exports.code = require('./code');
    exports.keyword = require('./keyword');
}());
/* vim: set sw=4 ts=4 et tw=80 : */

},{"./ast":17,"./code":18,"./keyword":19}],21:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],22:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":59}],23:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _container = require('./container');

var _container2 = _interopRequireDefault(_container);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Represents an at-rule.
 *
 * If it’s followed in the CSS by a {} block, this node will have
 * a nodes property representing its children.
 *
 * @extends Container
 *
 * @example
 * const root = postcss.parse('@charset "UTF-8"; @media print {}');
 *
 * const charset = root.first;
 * charset.type  //=> 'atrule'
 * charset.nodes //=> undefined
 *
 * const media = root.last;
 * media.nodes   //=> []
 */
var AtRule = function (_Container) {
  _inherits(AtRule, _Container);

  function AtRule(defaults) {
    _classCallCheck(this, AtRule);

    var _this = _possibleConstructorReturn(this, _Container.call(this, defaults));

    _this.type = 'atrule';
    return _this;
  }

  AtRule.prototype.append = function append() {
    var _Container$prototype$;

    if (!this.nodes) this.nodes = [];

    for (var _len = arguments.length, children = Array(_len), _key = 0; _key < _len; _key++) {
      children[_key] = arguments[_key];
    }

    return (_Container$prototype$ = _Container.prototype.append).call.apply(_Container$prototype$, [this].concat(children));
  };

  AtRule.prototype.prepend = function prepend() {
    var _Container$prototype$2;

    if (!this.nodes) this.nodes = [];

    for (var _len2 = arguments.length, children = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      children[_key2] = arguments[_key2];
    }

    return (_Container$prototype$2 = _Container.prototype.prepend).call.apply(_Container$prototype$2, [this].concat(children));
  };

  /**
   * @memberof AtRule#
   * @member {string} name - the at-rule’s name immediately follows the `@`
   *
   * @example
   * const root  = postcss.parse('@media print {}');
   * media.name //=> 'media'
   * const media = root.first;
   */

  /**
   * @memberof AtRule#
   * @member {string} params - the at-rule’s parameters, the values
   *                           that follow the at-rule’s name but precede
   *                           any {} block
   *
   * @example
   * const root  = postcss.parse('@media print, screen {}');
   * const media = root.first;
   * media.params //=> 'print, screen'
   */

  /**
   * @memberof AtRule#
   * @member {object} raws - Information to generate byte-to-byte equal
   *                         node string as it was in the origin input.
   *
   * Every parser saves its own properties,
   * but the default CSS parser uses:
   *
   * * `before`: the space symbols before the node. It also stores `*`
   *   and `_` symbols before the declaration (IE hack).
   * * `after`: the space symbols after the last child of the node
   *   to the end of the node.
   * * `between`: the symbols between the property and value
   *   for declarations, selector and `{` for rules, or last parameter
   *   and `{` for at-rules.
   * * `semicolon`: contains true if the last child has
   *   an (optional) semicolon.
   * * `afterName`: the space between the at-rule name and its parameters.
   *
   * PostCSS cleans at-rule parameters from comments and extra spaces,
   * but it stores origin content in raws properties.
   * As such, if you don’t change a declaration’s value,
   * PostCSS will use the raw value with comments.
   *
   * @example
   * const root = postcss.parse('  @media\nprint {\n}')
   * root.first.first.raws //=> { before: '  ',
   *                       //     between: ' ',
   *                       //     afterName: '\n',
   *                       //     after: '\n' }
   */


  return AtRule;
}(_container2.default);

exports.default = AtRule;
module.exports = exports['default'];


},{"./container":25}],24:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _node = require('./node');

var _node2 = _interopRequireDefault(_node);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Represents a comment between declarations or statements (rule and at-rules).
 *
 * Comments inside selectors, at-rule parameters, or declaration values
 * will be stored in the `raws` properties explained above.
 *
 * @extends Node
 */
var Comment = function (_Node) {
  _inherits(Comment, _Node);

  function Comment(defaults) {
    _classCallCheck(this, Comment);

    var _this = _possibleConstructorReturn(this, _Node.call(this, defaults));

    _this.type = 'comment';
    return _this;
  }

  /**
   * @memberof Comment#
   * @member {string} text - the comment’s text
   */

  /**
   * @memberof Comment#
   * @member {object} raws - Information to generate byte-to-byte equal
   *                         node string as it was in the origin input.
   *
   * Every parser saves its own properties,
   * but the default CSS parser uses:
   *
   * * `before`: the space symbols before the node.
   * * `left`: the space symbols between `/*` and the comment’s text.
   * * `right`: the space symbols between the comment’s text.
   */


  return Comment;
}(_node2.default);

exports.default = Comment;
module.exports = exports['default'];


},{"./node":32}],25:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _declaration = require('./declaration');

var _declaration2 = _interopRequireDefault(_declaration);

var _comment = require('./comment');

var _comment2 = _interopRequireDefault(_comment);

var _node = require('./node');

var _node2 = _interopRequireDefault(_node);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function cleanSource(nodes) {
    return nodes.map(function (i) {
        if (i.nodes) i.nodes = cleanSource(i.nodes);
        delete i.source;
        return i;
    });
}

/**
 * The {@link Root}, {@link AtRule}, and {@link Rule} container nodes
 * inherit some common methods to help work with their children.
 *
 * Note that all containers can store any content. If you write a rule inside
 * a rule, PostCSS will parse it.
 *
 * @extends Node
 * @abstract
 */

var Container = function (_Node) {
    _inherits(Container, _Node);

    function Container() {
        _classCallCheck(this, Container);

        return _possibleConstructorReturn(this, _Node.apply(this, arguments));
    }

    Container.prototype.push = function push(child) {
        child.parent = this;
        this.nodes.push(child);
        return this;
    };

    /**
     * Iterates through the container’s immediate children,
     * calling `callback` for each child.
     *
     * Returning `false` in the callback will break iteration.
     *
     * This method only iterates through the container’s immediate children.
     * If you need to recursively iterate through all the container’s descendant
     * nodes, use {@link Container#walk}.
     *
     * Unlike the for `{}`-cycle or `Array#forEach` this iterator is safe
     * if you are mutating the array of child nodes during iteration.
     * PostCSS will adjust the current index to match the mutations.
     *
     * @param {childIterator} callback - iterator receives each node and index
     *
     * @return {false|undefined} returns `false` if iteration was broke
     *
     * @example
     * const root = postcss.parse('a { color: black; z-index: 1 }');
     * const rule = root.first;
     *
     * for ( let decl of rule.nodes ) {
     *     decl.cloneBefore({ prop: '-webkit-' + decl.prop });
     *     // Cycle will be infinite, because cloneBefore moves the current node
     *     // to the next index
     * }
     *
     * rule.each(decl => {
     *     decl.cloneBefore({ prop: '-webkit-' + decl.prop });
     *     // Will be executed only for color and z-index
     * });
     */


    Container.prototype.each = function each(callback) {
        if (!this.lastEach) this.lastEach = 0;
        if (!this.indexes) this.indexes = {};

        this.lastEach += 1;
        var id = this.lastEach;
        this.indexes[id] = 0;

        if (!this.nodes) return undefined;

        var index = void 0,
            result = void 0;
        while (this.indexes[id] < this.nodes.length) {
            index = this.indexes[id];
            result = callback(this.nodes[index], index);
            if (result === false) break;

            this.indexes[id] += 1;
        }

        delete this.indexes[id];

        return result;
    };

    /**
     * Traverses the container’s descendant nodes, calling callback
     * for each node.
     *
     * Like container.each(), this method is safe to use
     * if you are mutating arrays during iteration.
     *
     * If you only need to iterate through the container’s immediate children,
     * use {@link Container#each}.
     *
     * @param {childIterator} callback - iterator receives each node and index
     *
     * @return {false|undefined} returns `false` if iteration was broke
     *
     * @example
     * root.walk(node => {
     *   // Traverses all descendant nodes.
     * });
     */


    Container.prototype.walk = function walk(callback) {
        return this.each(function (child, i) {
            var result = callback(child, i);
            if (result !== false && child.walk) {
                result = child.walk(callback);
            }
            return result;
        });
    };

    /**
     * Traverses the container’s descendant nodes, calling callback
     * for each declaration node.
     *
     * If you pass a filter, iteration will only happen over declarations
     * with matching properties.
     *
     * Like {@link Container#each}, this method is safe
     * to use if you are mutating arrays during iteration.
     *
     * @param {string|RegExp} [prop]   - string or regular expression
     *                                   to filter declarations by property name
     * @param {childIterator} callback - iterator receives each node and index
     *
     * @return {false|undefined} returns `false` if iteration was broke
     *
     * @example
     * root.walkDecls(decl => {
     *   checkPropertySupport(decl.prop);
     * });
     *
     * root.walkDecls('border-radius', decl => {
     *   decl.remove();
     * });
     *
     * root.walkDecls(/^background/, decl => {
     *   decl.value = takeFirstColorFromGradient(decl.value);
     * });
     */


    Container.prototype.walkDecls = function walkDecls(prop, callback) {
        if (!callback) {
            callback = prop;
            return this.walk(function (child, i) {
                if (child.type === 'decl') {
                    return callback(child, i);
                }
            });
        } else if (prop instanceof RegExp) {
            return this.walk(function (child, i) {
                if (child.type === 'decl' && prop.test(child.prop)) {
                    return callback(child, i);
                }
            });
        } else {
            return this.walk(function (child, i) {
                if (child.type === 'decl' && child.prop === prop) {
                    return callback(child, i);
                }
            });
        }
    };

    /**
     * Traverses the container’s descendant nodes, calling callback
     * for each rule node.
     *
     * If you pass a filter, iteration will only happen over rules
     * with matching selectors.
     *
     * Like {@link Container#each}, this method is safe
     * to use if you are mutating arrays during iteration.
     *
     * @param {string|RegExp} [selector] - string or regular expression
     *                                     to filter rules by selector
     * @param {childIterator} callback   - iterator receives each node and index
     *
     * @return {false|undefined} returns `false` if iteration was broke
     *
     * @example
     * const selectors = [];
     * root.walkRules(rule => {
     *   selectors.push(rule.selector);
     * });
     * console.log(`Your CSS uses ${selectors.length} selectors`);
     */


    Container.prototype.walkRules = function walkRules(selector, callback) {
        if (!callback) {
            callback = selector;

            return this.walk(function (child, i) {
                if (child.type === 'rule') {
                    return callback(child, i);
                }
            });
        } else if (selector instanceof RegExp) {
            return this.walk(function (child, i) {
                if (child.type === 'rule' && selector.test(child.selector)) {
                    return callback(child, i);
                }
            });
        } else {
            return this.walk(function (child, i) {
                if (child.type === 'rule' && child.selector === selector) {
                    return callback(child, i);
                }
            });
        }
    };

    /**
     * Traverses the container’s descendant nodes, calling callback
     * for each at-rule node.
     *
     * If you pass a filter, iteration will only happen over at-rules
     * that have matching names.
     *
     * Like {@link Container#each}, this method is safe
     * to use if you are mutating arrays during iteration.
     *
     * @param {string|RegExp} [name]   - string or regular expression
     *                                   to filter at-rules by name
     * @param {childIterator} callback - iterator receives each node and index
     *
     * @return {false|undefined} returns `false` if iteration was broke
     *
     * @example
     * root.walkAtRules(rule => {
     *   if ( isOld(rule.name) ) rule.remove();
     * });
     *
     * let first = false;
     * root.walkAtRules('charset', rule => {
     *   if ( !first ) {
     *     first = true;
     *   } else {
     *     rule.remove();
     *   }
     * });
     */


    Container.prototype.walkAtRules = function walkAtRules(name, callback) {
        if (!callback) {
            callback = name;
            return this.walk(function (child, i) {
                if (child.type === 'atrule') {
                    return callback(child, i);
                }
            });
        } else if (name instanceof RegExp) {
            return this.walk(function (child, i) {
                if (child.type === 'atrule' && name.test(child.name)) {
                    return callback(child, i);
                }
            });
        } else {
            return this.walk(function (child, i) {
                if (child.type === 'atrule' && child.name === name) {
                    return callback(child, i);
                }
            });
        }
    };

    /**
     * Traverses the container’s descendant nodes, calling callback
     * for each comment node.
     *
     * Like {@link Container#each}, this method is safe
     * to use if you are mutating arrays during iteration.
     *
     * @param {childIterator} callback - iterator receives each node and index
     *
     * @return {false|undefined} returns `false` if iteration was broke
     *
     * @example
     * root.walkComments(comment => {
     *   comment.remove();
     * });
     */


    Container.prototype.walkComments = function walkComments(callback) {
        return this.walk(function (child, i) {
            if (child.type === 'comment') {
                return callback(child, i);
            }
        });
    };

    /**
     * Inserts new nodes to the end of the container.
     *
     * @param {...(Node|object|string|Node[])} children - new nodes
     *
     * @return {Node} this node for methods chain
     *
     * @example
     * const decl1 = postcss.decl({ prop: 'color', value: 'black' });
     * const decl2 = postcss.decl({ prop: 'background-color', value: 'white' });
     * rule.append(decl1, decl2);
     *
     * root.append({ name: 'charset', params: '"UTF-8"' });  // at-rule
     * root.append({ selector: 'a' });                       // rule
     * rule.append({ prop: 'color', value: 'black' });       // declaration
     * rule.append({ text: 'Comment' })                      // comment
     *
     * root.append('a {}');
     * root.first.append('color: black; z-index: 1');
     */


    Container.prototype.append = function append() {
        for (var _len = arguments.length, children = Array(_len), _key = 0; _key < _len; _key++) {
            children[_key] = arguments[_key];
        }

        for (var _iterator = children, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
            var _ref;

            if (_isArray) {
                if (_i >= _iterator.length) break;
                _ref = _iterator[_i++];
            } else {
                _i = _iterator.next();
                if (_i.done) break;
                _ref = _i.value;
            }

            var child = _ref;

            var nodes = this.normalize(child, this.last);
            for (var _iterator2 = nodes, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
                var _ref2;

                if (_isArray2) {
                    if (_i2 >= _iterator2.length) break;
                    _ref2 = _iterator2[_i2++];
                } else {
                    _i2 = _iterator2.next();
                    if (_i2.done) break;
                    _ref2 = _i2.value;
                }

                var node = _ref2;
                this.nodes.push(node);
            }
        }
        return this;
    };

    /**
     * Inserts new nodes to the start of the container.
     *
     * @param {...(Node|object|string|Node[])} children - new nodes
     *
     * @return {Node} this node for methods chain
     *
     * @example
     * const decl1 = postcss.decl({ prop: 'color', value: 'black' });
     * const decl2 = postcss.decl({ prop: 'background-color', value: 'white' });
     * rule.prepend(decl1, decl2);
     *
     * root.append({ name: 'charset', params: '"UTF-8"' });  // at-rule
     * root.append({ selector: 'a' });                       // rule
     * rule.append({ prop: 'color', value: 'black' });       // declaration
     * rule.append({ text: 'Comment' })                      // comment
     *
     * root.append('a {}');
     * root.first.append('color: black; z-index: 1');
     */


    Container.prototype.prepend = function prepend() {
        for (var _len2 = arguments.length, children = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            children[_key2] = arguments[_key2];
        }

        children = children.reverse();
        for (var _iterator3 = children, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
            var _ref3;

            if (_isArray3) {
                if (_i3 >= _iterator3.length) break;
                _ref3 = _iterator3[_i3++];
            } else {
                _i3 = _iterator3.next();
                if (_i3.done) break;
                _ref3 = _i3.value;
            }

            var child = _ref3;

            var nodes = this.normalize(child, this.first, 'prepend').reverse();
            for (var _iterator4 = nodes, _isArray4 = Array.isArray(_iterator4), _i4 = 0, _iterator4 = _isArray4 ? _iterator4 : _iterator4[Symbol.iterator]();;) {
                var _ref4;

                if (_isArray4) {
                    if (_i4 >= _iterator4.length) break;
                    _ref4 = _iterator4[_i4++];
                } else {
                    _i4 = _iterator4.next();
                    if (_i4.done) break;
                    _ref4 = _i4.value;
                }

                var node = _ref4;
                this.nodes.unshift(node);
            }for (var id in this.indexes) {
                this.indexes[id] = this.indexes[id] + nodes.length;
            }
        }
        return this;
    };

    Container.prototype.cleanRaws = function cleanRaws(keepBetween) {
        _Node.prototype.cleanRaws.call(this, keepBetween);
        if (this.nodes) {
            for (var _iterator5 = this.nodes, _isArray5 = Array.isArray(_iterator5), _i5 = 0, _iterator5 = _isArray5 ? _iterator5 : _iterator5[Symbol.iterator]();;) {
                var _ref5;

                if (_isArray5) {
                    if (_i5 >= _iterator5.length) break;
                    _ref5 = _iterator5[_i5++];
                } else {
                    _i5 = _iterator5.next();
                    if (_i5.done) break;
                    _ref5 = _i5.value;
                }

                var node = _ref5;
                node.cleanRaws(keepBetween);
            }
        }
    };

    /**
     * Insert new node before old node within the container.
     *
     * @param {Node|number} exist             - child or child’s index.
     * @param {Node|object|string|Node[]} add - new node
     *
     * @return {Node} this node for methods chain
     *
     * @example
     * rule.insertBefore(decl, decl.clone({ prop: '-webkit-' + decl.prop }));
     */


    Container.prototype.insertBefore = function insertBefore(exist, add) {
        exist = this.index(exist);

        var type = exist === 0 ? 'prepend' : false;
        var nodes = this.normalize(add, this.nodes[exist], type).reverse();
        for (var _iterator6 = nodes, _isArray6 = Array.isArray(_iterator6), _i6 = 0, _iterator6 = _isArray6 ? _iterator6 : _iterator6[Symbol.iterator]();;) {
            var _ref6;

            if (_isArray6) {
                if (_i6 >= _iterator6.length) break;
                _ref6 = _iterator6[_i6++];
            } else {
                _i6 = _iterator6.next();
                if (_i6.done) break;
                _ref6 = _i6.value;
            }

            var node = _ref6;
            this.nodes.splice(exist, 0, node);
        }var index = void 0;
        for (var id in this.indexes) {
            index = this.indexes[id];
            if (exist <= index) {
                this.indexes[id] = index + nodes.length;
            }
        }

        return this;
    };

    /**
     * Insert new node after old node within the container.
     *
     * @param {Node|number} exist             - child or child’s index
     * @param {Node|object|string|Node[]} add - new node
     *
     * @return {Node} this node for methods chain
     */


    Container.prototype.insertAfter = function insertAfter(exist, add) {
        exist = this.index(exist);

        var nodes = this.normalize(add, this.nodes[exist]).reverse();
        for (var _iterator7 = nodes, _isArray7 = Array.isArray(_iterator7), _i7 = 0, _iterator7 = _isArray7 ? _iterator7 : _iterator7[Symbol.iterator]();;) {
            var _ref7;

            if (_isArray7) {
                if (_i7 >= _iterator7.length) break;
                _ref7 = _iterator7[_i7++];
            } else {
                _i7 = _iterator7.next();
                if (_i7.done) break;
                _ref7 = _i7.value;
            }

            var node = _ref7;
            this.nodes.splice(exist + 1, 0, node);
        }var index = void 0;
        for (var id in this.indexes) {
            index = this.indexes[id];
            if (exist < index) {
                this.indexes[id] = index + nodes.length;
            }
        }

        return this;
    };

    /**
     * Removes node from the container and cleans the parent properties
     * from the node and its children.
     *
     * @param {Node|number} child - child or child’s index
     *
     * @return {Node} this node for methods chain
     *
     * @example
     * rule.nodes.length  //=> 5
     * rule.removeChild(decl);
     * rule.nodes.length  //=> 4
     * decl.parent        //=> undefined
     */


    Container.prototype.removeChild = function removeChild(child) {
        child = this.index(child);
        this.nodes[child].parent = undefined;
        this.nodes.splice(child, 1);

        var index = void 0;
        for (var id in this.indexes) {
            index = this.indexes[id];
            if (index >= child) {
                this.indexes[id] = index - 1;
            }
        }

        return this;
    };

    /**
     * Removes all children from the container
     * and cleans their parent properties.
     *
     * @return {Node} this node for methods chain
     *
     * @example
     * rule.removeAll();
     * rule.nodes.length //=> 0
     */


    Container.prototype.removeAll = function removeAll() {
        for (var _iterator8 = this.nodes, _isArray8 = Array.isArray(_iterator8), _i8 = 0, _iterator8 = _isArray8 ? _iterator8 : _iterator8[Symbol.iterator]();;) {
            var _ref8;

            if (_isArray8) {
                if (_i8 >= _iterator8.length) break;
                _ref8 = _iterator8[_i8++];
            } else {
                _i8 = _iterator8.next();
                if (_i8.done) break;
                _ref8 = _i8.value;
            }

            var node = _ref8;
            node.parent = undefined;
        }this.nodes = [];
        return this;
    };

    /**
     * Passes all declaration values within the container that match pattern
     * through callback, replacing those values with the returned result
     * of callback.
     *
     * This method is useful if you are using a custom unit or function
     * and need to iterate through all values.
     *
     * @param {string|RegExp} pattern      - replace pattern
     * @param {object} opts                - options to speed up the search
     * @param {string|string[]} opts.props - an array of property names
     * @param {string} opts.fast           - string that’s used
     *                                       to narrow down values and speed up
                                             the regexp search
     * @param {function|string} callback   - string to replace pattern
     *                                       or callback that returns a new
     *                                       value.
     *                                       The callback will receive
     *                                       the same arguments as those
     *                                       passed to a function parameter
     *                                       of `String#replace`.
     *
     * @return {Node} this node for methods chain
     *
     * @example
     * root.replaceValues(/\d+rem/, { fast: 'rem' }, string => {
     *   return 15 * parseInt(string) + 'px';
     * });
     */


    Container.prototype.replaceValues = function replaceValues(pattern, opts, callback) {
        if (!callback) {
            callback = opts;
            opts = {};
        }

        this.walkDecls(function (decl) {
            if (opts.props && opts.props.indexOf(decl.prop) === -1) return;
            if (opts.fast && decl.value.indexOf(opts.fast) === -1) return;

            decl.value = decl.value.replace(pattern, callback);
        });

        return this;
    };

    /**
     * Returns `true` if callback returns `true`
     * for all of the container’s children.
     *
     * @param {childCondition} condition - iterator returns true or false.
     *
     * @return {boolean} is every child pass condition
     *
     * @example
     * const noPrefixes = rule.every(i => i.prop[0] !== '-');
     */


    Container.prototype.every = function every(condition) {
        return this.nodes.every(condition);
    };

    /**
     * Returns `true` if callback returns `true` for (at least) one
     * of the container’s children.
     *
     * @param {childCondition} condition - iterator returns true or false.
     *
     * @return {boolean} is some child pass condition
     *
     * @example
     * const hasPrefix = rule.some(i => i.prop[0] === '-');
     */


    Container.prototype.some = function some(condition) {
        return this.nodes.some(condition);
    };

    /**
     * Returns a `child`’s index within the {@link Container#nodes} array.
     *
     * @param {Node} child - child of the current container.
     *
     * @return {number} child index
     *
     * @example
     * rule.index( rule.nodes[2] ) //=> 2
     */


    Container.prototype.index = function index(child) {
        if (typeof child === 'number') {
            return child;
        } else {
            return this.nodes.indexOf(child);
        }
    };

    /**
     * The container’s first child.
     *
     * @type {Node}
     *
     * @example
     * rule.first == rules.nodes[0];
     */


    Container.prototype.normalize = function normalize(nodes, sample) {
        var _this2 = this;

        if (typeof nodes === 'string') {
            var parse = require('./parse');
            nodes = cleanSource(parse(nodes).nodes);
        } else if (Array.isArray(nodes)) {
            nodes = nodes.slice(0);
            for (var _iterator9 = nodes, _isArray9 = Array.isArray(_iterator9), _i9 = 0, _iterator9 = _isArray9 ? _iterator9 : _iterator9[Symbol.iterator]();;) {
                var _ref9;

                if (_isArray9) {
                    if (_i9 >= _iterator9.length) break;
                    _ref9 = _iterator9[_i9++];
                } else {
                    _i9 = _iterator9.next();
                    if (_i9.done) break;
                    _ref9 = _i9.value;
                }

                var i = _ref9;

                if (i.parent) i.parent.removeChild(i, 'ignore');
            }
        } else if (nodes.type === 'root') {
            nodes = nodes.nodes.slice(0);
            for (var _iterator10 = nodes, _isArray10 = Array.isArray(_iterator10), _i11 = 0, _iterator10 = _isArray10 ? _iterator10 : _iterator10[Symbol.iterator]();;) {
                var _ref10;

                if (_isArray10) {
                    if (_i11 >= _iterator10.length) break;
                    _ref10 = _iterator10[_i11++];
                } else {
                    _i11 = _iterator10.next();
                    if (_i11.done) break;
                    _ref10 = _i11.value;
                }

                var _i10 = _ref10;

                if (_i10.parent) _i10.parent.removeChild(_i10, 'ignore');
            }
        } else if (nodes.type) {
            nodes = [nodes];
        } else if (nodes.prop) {
            if (typeof nodes.value === 'undefined') {
                throw new Error('Value field is missed in node creation');
            } else if (typeof nodes.value !== 'string') {
                nodes.value = String(nodes.value);
            }
            nodes = [new _declaration2.default(nodes)];
        } else if (nodes.selector) {
            var Rule = require('./rule');
            nodes = [new Rule(nodes)];
        } else if (nodes.name) {
            var AtRule = require('./at-rule');
            nodes = [new AtRule(nodes)];
        } else if (nodes.text) {
            nodes = [new _comment2.default(nodes)];
        } else {
            throw new Error('Unknown node type in node creation');
        }

        var processed = nodes.map(function (i) {
            if (typeof i.before !== 'function') i = _this2.rebuild(i);

            if (i.parent) i.parent.removeChild(i);
            if (typeof i.raws.before === 'undefined') {
                if (sample && typeof sample.raws.before !== 'undefined') {
                    i.raws.before = sample.raws.before.replace(/[^\s]/g, '');
                }
            }
            i.parent = _this2;
            return i;
        });

        return processed;
    };

    Container.prototype.rebuild = function rebuild(node, parent) {
        var _this3 = this;

        var fix = void 0;
        if (node.type === 'root') {
            var Root = require('./root');
            fix = new Root();
        } else if (node.type === 'atrule') {
            var AtRule = require('./at-rule');
            fix = new AtRule();
        } else if (node.type === 'rule') {
            var Rule = require('./rule');
            fix = new Rule();
        } else if (node.type === 'decl') {
            fix = new _declaration2.default();
        } else if (node.type === 'comment') {
            fix = new _comment2.default();
        }

        for (var i in node) {
            if (i === 'nodes') {
                fix.nodes = node.nodes.map(function (j) {
                    return _this3.rebuild(j, fix);
                });
            } else if (i === 'parent' && parent) {
                fix.parent = parent;
            } else if (node.hasOwnProperty(i)) {
                fix[i] = node[i];
            }
        }

        return fix;
    };

    /**
     * @memberof Container#
     * @member {Node[]} nodes - an array containing the container’s children
     *
     * @example
     * const root = postcss.parse('a { color: black }');
     * root.nodes.length           //=> 1
     * root.nodes[0].selector      //=> 'a'
     * root.nodes[0].nodes[0].prop //=> 'color'
     */

    _createClass(Container, [{
        key: 'first',
        get: function get() {
            if (!this.nodes) return undefined;
            return this.nodes[0];
        }

        /**
         * The container’s last child.
         *
         * @type {Node}
         *
         * @example
         * rule.last == rule.nodes[rule.nodes.length - 1];
         */

    }, {
        key: 'last',
        get: function get() {
            if (!this.nodes) return undefined;
            return this.nodes[this.nodes.length - 1];
        }
    }]);

    return Container;
}(_node2.default);

exports.default = Container;

/**
 * @callback childCondition
 * @param {Node} node    - container child
 * @param {number} index - child index
 * @param {Node[]} nodes - all container children
 * @return {boolean}
 */

/**
 * @callback childIterator
 * @param {Node} node    - container child
 * @param {number} index - child index
 * @return {false|undefined} returning `false` will break iteration
 */

module.exports = exports['default'];


},{"./at-rule":23,"./comment":24,"./declaration":27,"./node":32,"./parse":33,"./root":39,"./rule":40}],26:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _supportsColor = require('supports-color');

var _supportsColor2 = _interopRequireDefault(_supportsColor);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _terminalHighlight = require('./terminal-highlight');

var _terminalHighlight2 = _interopRequireDefault(_terminalHighlight);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * The CSS parser throws this error for broken CSS.
 *
 * Custom parsers can throw this error for broken custom syntax using
 * the {@link Node#error} method.
 *
 * PostCSS will use the input source map to detect the original error location.
 * If you wrote a Sass file, compiled it to CSS and then parsed it with PostCSS,
 * PostCSS will show the original position in the Sass file.
 *
 * If you need the position in the PostCSS input
 * (e.g., to debug the previous compiler), use `error.input.file`.
 *
 * @example
 * // Catching and checking syntax error
 * try {
 *   postcss.parse('a{')
 * } catch (error) {
 *   if ( error.name === 'CssSyntaxError' ) {
 *     error //=> CssSyntaxError
 *   }
 * }
 *
 * @example
 * // Raising error from plugin
 * throw node.error('Unknown variable', { plugin: 'postcss-vars' });
 */
var CssSyntaxError = function () {

    /**
     * @param {string} message  - error message
     * @param {number} [line]   - source line of the error
     * @param {number} [column] - source column of the error
     * @param {string} [source] - source code of the broken file
     * @param {string} [file]   - absolute path to the broken file
     * @param {string} [plugin] - PostCSS plugin name, if error came from plugin
     */
    function CssSyntaxError(message, line, column, source, file, plugin) {
        _classCallCheck(this, CssSyntaxError);

        /**
         * @member {string} - Always equal to `'CssSyntaxError'`. You should
         *                    always check error type
         *                    by `error.name === 'CssSyntaxError'` instead of
         *                    `error instanceof CssSyntaxError`, because
         *                    npm could have several PostCSS versions.
         *
         * @example
         * if ( error.name === 'CssSyntaxError' ) {
         *   error //=> CssSyntaxError
         * }
         */
        this.name = 'CssSyntaxError';
        /**
         * @member {string} - Error message.
         *
         * @example
         * error.message //=> 'Unclosed block'
         */
        this.reason = message;

        if (file) {
            /**
             * @member {string} - Absolute path to the broken file.
             *
             * @example
             * error.file       //=> 'a.sass'
             * error.input.file //=> 'a.css'
             */
            this.file = file;
        }
        if (source) {
            /**
             * @member {string} - Source code of the broken file.
             *
             * @example
             * error.source       //=> 'a { b {} }'
             * error.input.column //=> 'a b { }'
             */
            this.source = source;
        }
        if (plugin) {
            /**
             * @member {string} - Plugin name, if error came from plugin.
             *
             * @example
             * error.plugin //=> 'postcss-vars'
             */
            this.plugin = plugin;
        }
        if (typeof line !== 'undefined' && typeof column !== 'undefined') {
            /**
             * @member {number} - Source line of the error.
             *
             * @example
             * error.line       //=> 2
             * error.input.line //=> 4
             */
            this.line = line;
            /**
             * @member {number} - Source column of the error.
             *
             * @example
             * error.column       //=> 1
             * error.input.column //=> 4
             */
            this.column = column;
        }

        this.setMessage();

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, CssSyntaxError);
        }
    }

    CssSyntaxError.prototype.setMessage = function setMessage() {
        /**
         * @member {string} - Full error text in the GNU error format
         *                    with plugin, file, line and column.
         *
         * @example
         * error.message //=> 'a.css:1:1: Unclosed block'
         */
        this.message = this.plugin ? this.plugin + ': ' : '';
        this.message += this.file ? this.file : '<css input>';
        if (typeof this.line !== 'undefined') {
            this.message += ':' + this.line + ':' + this.column;
        }
        this.message += ': ' + this.reason;
    };

    /**
     * Returns a few lines of CSS source that caused the error.
     *
     * If the CSS has an input source map without `sourceContent`,
     * this method will return an empty string.
     *
     * @param {boolean} [color] whether arrow will be colored red by terminal
     *                          color codes. By default, PostCSS will detect
     *                          color support by `process.stdout.isTTY`
     *                          and `process.env.NODE_DISABLE_COLORS`.
     *
     * @example
     * error.showSourceCode() //=> "  4 | }
     *                        //      5 | a {
     *                        //    > 6 |   bad
     *                        //        |   ^
     *                        //      7 | }
     *                        //      8 | b {"
     *
     * @return {string} few lines of CSS source that caused the error
     */


    CssSyntaxError.prototype.showSourceCode = function showSourceCode(color) {
        var _this = this;

        if (!this.source) return '';

        var css = this.source;
        if (typeof color === 'undefined') color = _supportsColor2.default;
        if (color) css = (0, _terminalHighlight2.default)(css);

        var lines = css.split(/\r?\n/);
        var start = Math.max(this.line - 3, 0);
        var end = Math.min(this.line + 2, lines.length);

        var maxWidth = String(end).length;

        function mark(text) {
            if (color && _chalk2.default.red) {
                return _chalk2.default.red.bold(text);
            } else {
                return text;
            }
        }
        function aside(text) {
            if (color && _chalk2.default.gray) {
                return _chalk2.default.gray(text);
            } else {
                return text;
            }
        }

        return lines.slice(start, end).map(function (line, index) {
            var number = start + 1 + index;
            var gutter = ' ' + (' ' + number).slice(-maxWidth) + ' | ';
            if (number === _this.line) {
                var spacing = aside(gutter.replace(/\d/g, ' ')) + line.slice(0, _this.column - 1).replace(/[^\t]/g, ' ');
                return mark('>') + aside(gutter) + line + '\n ' + spacing + mark('^');
            } else {
                return ' ' + aside(gutter) + line;
            }
        }).join('\n');
    };

    /**
     * Returns error position, message and source code of the broken part.
     *
     * @example
     * error.toString() //=> "CssSyntaxError: app.css:1:1: Unclosed block
     *                  //    > 1 | a {
     *                  //        | ^"
     *
     * @return {string} error position, message and source code
     */


    CssSyntaxError.prototype.toString = function toString() {
        var code = this.showSourceCode();
        if (code) {
            code = '\n\n' + code + '\n';
        }
        return this.name + ': ' + this.message + code;
    };

    /**
     * @memberof CssSyntaxError#
     * @member {Input} input - Input object with PostCSS internal information
     *                         about input file. If input has source map
     *                         from previous tool, PostCSS will use origin
     *                         (for example, Sass) source. You can use this
     *                         object to get PostCSS input source.
     *
     * @example
     * error.input.file //=> 'a.css'
     * error.file       //=> 'a.sass'
     */

    return CssSyntaxError;
}();

exports.default = CssSyntaxError;
module.exports = exports['default'];


},{"./terminal-highlight":43,"chalk":10,"supports-color":10}],27:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _node = require('./node');

var _node2 = _interopRequireDefault(_node);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Represents a CSS declaration.
 *
 * @extends Node
 *
 * @example
 * const root = postcss.parse('a { color: black }');
 * const decl = root.first.first;
 * decl.type       //=> 'decl'
 * decl.toString() //=> ' color: black'
 */
var Declaration = function (_Node) {
  _inherits(Declaration, _Node);

  function Declaration(defaults) {
    _classCallCheck(this, Declaration);

    var _this = _possibleConstructorReturn(this, _Node.call(this, defaults));

    _this.type = 'decl';
    return _this;
  }

  /**
   * @memberof Declaration#
   * @member {string} prop - the declaration’s property name
   *
   * @example
   * const root = postcss.parse('a { color: black }');
   * const decl = root.first.first;
   * decl.prop //=> 'color'
   */

  /**
   * @memberof Declaration#
   * @member {string} value - the declaration’s value
   *
   * @example
   * const root = postcss.parse('a { color: black }');
   * const decl = root.first.first;
   * decl.value //=> 'black'
   */

  /**
   * @memberof Declaration#
   * @member {boolean} important - `true` if the declaration
   *                               has an !important annotation.
   *
   * @example
   * const root = postcss.parse('a { color: black !important; color: red }');
   * root.first.first.important //=> true
   * root.first.last.important  //=> undefined
   */

  /**
   * @memberof Declaration#
   * @member {object} raws - Information to generate byte-to-byte equal
   *                         node string as it was in the origin input.
   *
   * Every parser saves its own properties,
   * but the default CSS parser uses:
   *
   * * `before`: the space symbols before the node. It also stores `*`
   *   and `_` symbols before the declaration (IE hack).
   * * `between`: the symbols between the property and value
   *   for declarations.
   * * `important`: the content of the important statement,
   *   if it is not just `!important`.
   *
   * PostCSS cleans declaration from comments and extra spaces,
   * but it stores origin content in raws properties.
   * As such, if you don’t change a declaration’s value,
   * PostCSS will use the raw value with comments.
   *
   * @example
   * const root = postcss.parse('a {\n  color:black\n}')
   * root.first.first.raws //=> { before: '\n  ', between: ':' }
   */

  return Declaration;
}(_node2.default);

exports.default = Declaration;
module.exports = exports['default'];


},{"./node":32}],28:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _cssSyntaxError = require('./css-syntax-error');

var _cssSyntaxError2 = _interopRequireDefault(_cssSyntaxError);

var _previousMap = require('./previous-map');

var _previousMap2 = _interopRequireDefault(_previousMap);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var sequence = 0;

/**
 * Represents the source CSS.
 *
 * @example
 * const root  = postcss.parse(css, { from: file });
 * const input = root.source.input;
 */

var Input = function () {

    /**
     * @param {string} css    - input CSS source
     * @param {object} [opts] - {@link Processor#process} options
     */
    function Input(css) {
        var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        _classCallCheck(this, Input);

        /**
         * @member {string} - input CSS source
         *
         * @example
         * const input = postcss.parse('a{}', { from: file }).input;
         * input.css //=> "a{}";
         */
        this.css = css.toString();

        if (this.css[0] === '\uFEFF' || this.css[0] === '\uFFFE') {
            this.css = this.css.slice(1);
        }

        if (opts.from) {
            if (/^\w+:\/\//.test(opts.from)) {
                /**
                 * @member {string} - The absolute path to the CSS source file
                 *                    defined with the `from` option.
                 *
                 * @example
                 * const root = postcss.parse(css, { from: 'a.css' });
                 * root.source.input.file //=> '/home/ai/a.css'
                 */
                this.file = opts.from;
            } else {
                this.file = _path2.default.resolve(opts.from);
            }
        }

        var map = new _previousMap2.default(this.css, opts);
        if (map.text) {
            /**
             * @member {PreviousMap} - The input source map passed from
             *                         a compilation step before PostCSS
             *                         (for example, from Sass compiler).
             *
             * @example
             * root.source.input.map.consumer().sources //=> ['a.sass']
             */
            this.map = map;
            var file = map.consumer().file;
            if (!this.file && file) this.file = this.mapResolve(file);
        }

        if (!this.file) {
            sequence += 1;
            /**
             * @member {string} - The unique ID of the CSS source. It will be
             *                    created if `from` option is not provided
             *                    (because PostCSS does not know the file path).
             *
             * @example
             * const root = postcss.parse(css);
             * root.source.input.file //=> undefined
             * root.source.input.id   //=> "<input css 1>"
             */
            this.id = '<input css ' + sequence + '>';
        }
        if (this.map) this.map.file = this.from;
    }

    Input.prototype.error = function error(message, line, column) {
        var opts = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

        var result = void 0;
        var origin = this.origin(line, column);
        if (origin) {
            result = new _cssSyntaxError2.default(message, origin.line, origin.column, origin.source, origin.file, opts.plugin);
        } else {
            result = new _cssSyntaxError2.default(message, line, column, this.css, this.file, opts.plugin);
        }

        result.input = { line: line, column: column, source: this.css };
        if (this.file) result.input.file = this.file;

        return result;
    };

    /**
     * Reads the input source map and returns a symbol position
     * in the input source (e.g., in a Sass file that was compiled
     * to CSS before being passed to PostCSS).
     *
     * @param {number} line   - line in input CSS
     * @param {number} column - column in input CSS
     *
     * @return {filePosition} position in input source
     *
     * @example
     * root.source.input.origin(1, 1) //=> { file: 'a.css', line: 3, column: 1 }
     */


    Input.prototype.origin = function origin(line, column) {
        if (!this.map) return false;
        var consumer = this.map.consumer();

        var from = consumer.originalPositionFor({ line: line, column: column });
        if (!from.source) return false;

        var result = {
            file: this.mapResolve(from.source),
            line: from.line,
            column: from.column
        };

        var source = consumer.sourceContentFor(from.source);
        if (source) result.source = source;

        return result;
    };

    Input.prototype.mapResolve = function mapResolve(file) {
        if (/^\w+:\/\//.test(file)) {
            return file;
        } else {
            return _path2.default.resolve(this.map.consumer().sourceRoot || '.', file);
        }
    };

    /**
     * The CSS source identifier. Contains {@link Input#file} if the user
     * set the `from` option, or {@link Input#id} if they did not.
     * @type {string}
     *
     * @example
     * const root = postcss.parse(css, { from: 'a.css' });
     * root.source.input.from //=> "/home/ai/a.css"
     *
     * const root = postcss.parse(css);
     * root.source.input.from //=> "<input css 1>"
     */


    _createClass(Input, [{
        key: 'from',
        get: function get() {
            return this.file || this.id;
        }
    }]);

    return Input;
}();

exports.default = Input;

/**
 * @typedef  {object} filePosition
 * @property {string} file   - path to file
 * @property {number} line   - source line in file
 * @property {number} column - source column in file
 */

module.exports = exports['default'];


},{"./css-syntax-error":26,"./previous-map":36,"path":22}],29:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _mapGenerator = require('./map-generator');

var _mapGenerator2 = _interopRequireDefault(_mapGenerator);

var _stringify2 = require('./stringify');

var _stringify3 = _interopRequireDefault(_stringify2);

var _result = require('./result');

var _result2 = _interopRequireDefault(_result);

var _parse = require('./parse');

var _parse2 = _interopRequireDefault(_parse);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function isPromise(obj) {
    return (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object' && typeof obj.then === 'function';
}

/**
 * A Promise proxy for the result of PostCSS transformations.
 *
 * A `LazyResult` instance is returned by {@link Processor#process}.
 *
 * @example
 * const lazy = postcss([cssnext]).process(css);
 */

var LazyResult = function () {
    function LazyResult(processor, css, opts) {
        _classCallCheck(this, LazyResult);

        this.stringified = false;
        this.processed = false;

        var root = void 0;
        if ((typeof css === 'undefined' ? 'undefined' : _typeof(css)) === 'object' && css.type === 'root') {
            root = css;
        } else if (css instanceof LazyResult || css instanceof _result2.default) {
            root = css.root;
            if (css.map) {
                if (typeof opts.map === 'undefined') opts.map = {};
                if (!opts.map.inline) opts.map.inline = false;
                opts.map.prev = css.map;
            }
        } else {
            var parser = _parse2.default;
            if (opts.syntax) parser = opts.syntax.parse;
            if (opts.parser) parser = opts.parser;
            if (parser.parse) parser = parser.parse;

            try {
                root = parser(css, opts);
            } catch (error) {
                this.error = error;
            }
        }

        this.result = new _result2.default(processor, root, opts);
    }

    /**
     * Returns a {@link Processor} instance, which will be used
     * for CSS transformations.
     * @type {Processor}
     */


    /**
     * Processes input CSS through synchronous plugins
     * and calls {@link Result#warnings()}.
     *
     * @return {Warning[]} warnings from plugins
     */
    LazyResult.prototype.warnings = function warnings() {
        return this.sync().warnings();
    };

    /**
     * Alias for the {@link LazyResult#css} property.
     *
     * @example
     * lazy + '' === lazy.css;
     *
     * @return {string} output CSS
     */


    LazyResult.prototype.toString = function toString() {
        return this.css;
    };

    /**
     * Processes input CSS through synchronous and asynchronous plugins
     * and calls `onFulfilled` with a Result instance. If a plugin throws
     * an error, the `onRejected` callback will be executed.
     *
     * It implements standard Promise API.
     *
     * @param {onFulfilled} onFulfilled - callback will be executed
     *                                    when all plugins will finish work
     * @param {onRejected}  onRejected  - callback will be executed on any error
     *
     * @return {Promise} Promise API to make queue
     *
     * @example
     * postcss([cssnext]).process(css).then(result => {
     *   console.log(result.css);
     * });
     */


    LazyResult.prototype.then = function then(onFulfilled, onRejected) {
        return this.async().then(onFulfilled, onRejected);
    };

    /**
     * Processes input CSS through synchronous and asynchronous plugins
     * and calls onRejected for each error thrown in any plugin.
     *
     * It implements standard Promise API.
     *
     * @param {onRejected} onRejected - callback will be executed on any error
     *
     * @return {Promise} Promise API to make queue
     *
     * @example
     * postcss([cssnext]).process(css).then(result => {
     *   console.log(result.css);
     * }).catch(error => {
     *   console.error(error);
     * });
     */


    LazyResult.prototype.catch = function _catch(onRejected) {
        return this.async().catch(onRejected);
    };

    LazyResult.prototype.handleError = function handleError(error, plugin) {
        try {
            this.error = error;
            if (error.name === 'CssSyntaxError' && !error.plugin) {
                error.plugin = plugin.postcssPlugin;
                error.setMessage();
            } else if (plugin.postcssVersion) {
                var pluginName = plugin.postcssPlugin;
                var pluginVer = plugin.postcssVersion;
                var runtimeVer = this.result.processor.version;
                var a = pluginVer.split('.');
                var b = runtimeVer.split('.');

                if (a[0] !== b[0] || parseInt(a[1]) > parseInt(b[1])) {
                    console.error('Unknown error from PostCSS plugin. ' + 'Your current PostCSS version ' + 'is ' + runtimeVer + ', but ' + pluginName + ' ' + 'uses ' + pluginVer + '. Perhaps this is ' + 'the source of the error below.');
                }
            }
        } catch (err) {
            if (console && console.error) console.error(err);
        }
    };

    LazyResult.prototype.asyncTick = function asyncTick(resolve, reject) {
        var _this = this;

        if (this.plugin >= this.processor.plugins.length) {
            this.processed = true;
            return resolve();
        }

        try {
            var plugin = this.processor.plugins[this.plugin];
            var promise = this.run(plugin);
            this.plugin += 1;

            if (isPromise(promise)) {
                promise.then(function () {
                    _this.asyncTick(resolve, reject);
                }).catch(function (error) {
                    _this.handleError(error, plugin);
                    _this.processed = true;
                    reject(error);
                });
            } else {
                this.asyncTick(resolve, reject);
            }
        } catch (error) {
            this.processed = true;
            reject(error);
        }
    };

    LazyResult.prototype.async = function async() {
        var _this2 = this;

        if (this.processed) {
            return new Promise(function (resolve, reject) {
                if (_this2.error) {
                    reject(_this2.error);
                } else {
                    resolve(_this2.stringify());
                }
            });
        }
        if (this.processing) {
            return this.processing;
        }

        this.processing = new Promise(function (resolve, reject) {
            if (_this2.error) return reject(_this2.error);
            _this2.plugin = 0;
            _this2.asyncTick(resolve, reject);
        }).then(function () {
            _this2.processed = true;
            return _this2.stringify();
        });

        return this.processing;
    };

    LazyResult.prototype.sync = function sync() {
        if (this.processed) return this.result;
        this.processed = true;

        if (this.processing) {
            throw new Error('Use process(css).then(cb) to work with async plugins');
        }

        if (this.error) throw this.error;

        for (var _iterator = this.result.processor.plugins, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
            var _ref;

            if (_isArray) {
                if (_i >= _iterator.length) break;
                _ref = _iterator[_i++];
            } else {
                _i = _iterator.next();
                if (_i.done) break;
                _ref = _i.value;
            }

            var plugin = _ref;

            var promise = this.run(plugin);
            if (isPromise(promise)) {
                throw new Error('Use process(css).then(cb) to work with async plugins');
            }
        }

        return this.result;
    };

    LazyResult.prototype.run = function run(plugin) {
        this.result.lastPlugin = plugin;

        try {
            return plugin(this.result.root, this.result);
        } catch (error) {
            this.handleError(error, plugin);
            throw error;
        }
    };

    LazyResult.prototype.stringify = function stringify() {
        if (this.stringified) return this.result;
        this.stringified = true;

        this.sync();

        var opts = this.result.opts;
        var str = _stringify3.default;
        if (opts.syntax) str = opts.syntax.stringify;
        if (opts.stringifier) str = opts.stringifier;
        if (str.stringify) str = str.stringify;

        var map = new _mapGenerator2.default(str, this.result.root, this.result.opts);
        var data = map.generate();
        this.result.css = data[0];
        this.result.map = data[1];

        return this.result;
    };

    _createClass(LazyResult, [{
        key: 'processor',
        get: function get() {
            return this.result.processor;
        }

        /**
         * Options from the {@link Processor#process} call.
         * @type {processOptions}
         */

    }, {
        key: 'opts',
        get: function get() {
            return this.result.opts;
        }

        /**
         * Processes input CSS through synchronous plugins, converts `Root`
         * to a CSS string and returns {@link Result#css}.
         *
         * This property will only work with synchronous plugins.
         * If the processor contains any asynchronous plugins
         * it will throw an error. This is why this method is only
         * for debug purpose, you should always use {@link LazyResult#then}.
         *
         * @type {string}
         * @see Result#css
         */

    }, {
        key: 'css',
        get: function get() {
            return this.stringify().css;
        }

        /**
         * An alias for the `css` property. Use it with syntaxes
         * that generate non-CSS output.
         *
         * This property will only work with synchronous plugins.
         * If the processor contains any asynchronous plugins
         * it will throw an error. This is why this method is only
         * for debug purpose, you should always use {@link LazyResult#then}.
         *
         * @type {string}
         * @see Result#content
         */

    }, {
        key: 'content',
        get: function get() {
            return this.stringify().content;
        }

        /**
         * Processes input CSS through synchronous plugins
         * and returns {@link Result#map}.
         *
         * This property will only work with synchronous plugins.
         * If the processor contains any asynchronous plugins
         * it will throw an error. This is why this method is only
         * for debug purpose, you should always use {@link LazyResult#then}.
         *
         * @type {SourceMapGenerator}
         * @see Result#map
         */

    }, {
        key: 'map',
        get: function get() {
            return this.stringify().map;
        }

        /**
         * Processes input CSS through synchronous plugins
         * and returns {@link Result#root}.
         *
         * This property will only work with synchronous plugins. If the processor
         * contains any asynchronous plugins it will throw an error.
         *
         * This is why this method is only for debug purpose,
         * you should always use {@link LazyResult#then}.
         *
         * @type {Root}
         * @see Result#root
         */

    }, {
        key: 'root',
        get: function get() {
            return this.sync().root;
        }

        /**
         * Processes input CSS through synchronous plugins
         * and returns {@link Result#messages}.
         *
         * This property will only work with synchronous plugins. If the processor
         * contains any asynchronous plugins it will throw an error.
         *
         * This is why this method is only for debug purpose,
         * you should always use {@link LazyResult#then}.
         *
         * @type {Message[]}
         * @see Result#messages
         */

    }, {
        key: 'messages',
        get: function get() {
            return this.sync().messages;
        }
    }]);

    return LazyResult;
}();

exports.default = LazyResult;

/**
 * @callback onFulfilled
 * @param {Result} result
 */

/**
 * @callback onRejected
 * @param {Error} error
 */

module.exports = exports['default'];


},{"./map-generator":31,"./parse":33,"./result":38,"./stringify":42}],30:[function(require,module,exports){
'use strict';

exports.__esModule = true;
/**
 * Contains helpers for safely splitting lists of CSS values,
 * preserving parentheses and quotes.
 *
 * @example
 * const list = postcss.list;
 *
 * @namespace list
 */
var list = {
    split: function split(string, separators, last) {
        var array = [];
        var current = '';
        var split = false;

        var func = 0;
        var quote = false;
        var escape = false;

        for (var i = 0; i < string.length; i++) {
            var letter = string[i];

            if (quote) {
                if (escape) {
                    escape = false;
                } else if (letter === '\\') {
                    escape = true;
                } else if (letter === quote) {
                    quote = false;
                }
            } else if (letter === '"' || letter === '\'') {
                quote = letter;
            } else if (letter === '(') {
                func += 1;
            } else if (letter === ')') {
                if (func > 0) func -= 1;
            } else if (func === 0) {
                if (separators.indexOf(letter) !== -1) split = true;
            }

            if (split) {
                if (current !== '') array.push(current.trim());
                current = '';
                split = false;
            } else {
                current += letter;
            }
        }

        if (last || current !== '') array.push(current.trim());
        return array;
    },


    /**
     * Safely splits space-separated values (such as those for `background`,
     * `border-radius`, and other shorthand properties).
     *
     * @param {string} string - space-separated values
     *
     * @return {string[]} split values
     *
     * @example
     * postcss.list.space('1px calc(10% + 1px)') //=> ['1px', 'calc(10% + 1px)']
     */
    space: function space(string) {
        var spaces = [' ', '\n', '\t'];
        return list.split(string, spaces);
    },


    /**
     * Safely splits comma-separated values (such as those for `transition-*`
     * and `background` properties).
     *
     * @param {string} string - comma-separated values
     *
     * @return {string[]} split values
     *
     * @example
     * postcss.list.comma('black, linear-gradient(white, black)')
     * //=> ['black', 'linear-gradient(white, black)']
     */
    comma: function comma(string) {
        var comma = ',';
        return list.split(string, [comma], true);
    }
};

exports.default = list;
module.exports = exports['default'];


},{}],31:[function(require,module,exports){
(function (Buffer){
'use strict';

exports.__esModule = true;

var _sourceMap = require('source-map');

var _sourceMap2 = _interopRequireDefault(_sourceMap);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MapGenerator = function () {
    function MapGenerator(stringify, root, opts) {
        _classCallCheck(this, MapGenerator);

        this.stringify = stringify;
        this.mapOpts = opts.map || {};
        this.root = root;
        this.opts = opts;
    }

    MapGenerator.prototype.isMap = function isMap() {
        if (typeof this.opts.map !== 'undefined') {
            return !!this.opts.map;
        } else {
            return this.previous().length > 0;
        }
    };

    MapGenerator.prototype.previous = function previous() {
        var _this = this;

        if (!this.previousMaps) {
            this.previousMaps = [];
            this.root.walk(function (node) {
                if (node.source && node.source.input.map) {
                    var map = node.source.input.map;
                    if (_this.previousMaps.indexOf(map) === -1) {
                        _this.previousMaps.push(map);
                    }
                }
            });
        }

        return this.previousMaps;
    };

    MapGenerator.prototype.isInline = function isInline() {
        if (typeof this.mapOpts.inline !== 'undefined') {
            return this.mapOpts.inline;
        }

        var annotation = this.mapOpts.annotation;
        if (typeof annotation !== 'undefined' && annotation !== true) {
            return false;
        }

        if (this.previous().length) {
            return this.previous().some(function (i) {
                return i.inline;
            });
        } else {
            return true;
        }
    };

    MapGenerator.prototype.isSourcesContent = function isSourcesContent() {
        if (typeof this.mapOpts.sourcesContent !== 'undefined') {
            return this.mapOpts.sourcesContent;
        }
        if (this.previous().length) {
            return this.previous().some(function (i) {
                return i.withContent();
            });
        } else {
            return true;
        }
    };

    MapGenerator.prototype.clearAnnotation = function clearAnnotation() {
        if (this.mapOpts.annotation === false) return;

        var node = void 0;
        for (var i = this.root.nodes.length - 1; i >= 0; i--) {
            node = this.root.nodes[i];
            if (node.type !== 'comment') continue;
            if (node.text.indexOf('# sourceMappingURL=') === 0) {
                this.root.removeChild(i);
            }
        }
    };

    MapGenerator.prototype.setSourcesContent = function setSourcesContent() {
        var _this2 = this;

        var already = {};
        this.root.walk(function (node) {
            if (node.source) {
                var from = node.source.input.from;
                if (from && !already[from]) {
                    already[from] = true;
                    var relative = _this2.relative(from);
                    _this2.map.setSourceContent(relative, node.source.input.css);
                }
            }
        });
    };

    MapGenerator.prototype.applyPrevMaps = function applyPrevMaps() {
        for (var _iterator = this.previous(), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
            var _ref;

            if (_isArray) {
                if (_i >= _iterator.length) break;
                _ref = _iterator[_i++];
            } else {
                _i = _iterator.next();
                if (_i.done) break;
                _ref = _i.value;
            }

            var prev = _ref;

            var from = this.relative(prev.file);
            var root = prev.root || _path2.default.dirname(prev.file);
            var map = void 0;

            if (this.mapOpts.sourcesContent === false) {
                map = new _sourceMap2.default.SourceMapConsumer(prev.text);
                if (map.sourcesContent) {
                    map.sourcesContent = map.sourcesContent.map(function () {
                        return null;
                    });
                }
            } else {
                map = prev.consumer();
            }

            this.map.applySourceMap(map, from, this.relative(root));
        }
    };

    MapGenerator.prototype.isAnnotation = function isAnnotation() {
        if (this.isInline()) {
            return true;
        } else if (typeof this.mapOpts.annotation !== 'undefined') {
            return this.mapOpts.annotation;
        } else if (this.previous().length) {
            return this.previous().some(function (i) {
                return i.annotation;
            });
        } else {
            return true;
        }
    };

    MapGenerator.prototype.toBase64 = function toBase64(str) {
        if (Buffer) {
            if (Buffer.from && Buffer.from !== Uint8Array.from) {
                return Buffer.from(str).toString('base64');
            } else {
                return new Buffer(str).toString('base64');
            }
        } else {
            return window.btoa(unescape(encodeURIComponent(str)));
        }
    };

    MapGenerator.prototype.addAnnotation = function addAnnotation() {
        var content = void 0;

        if (this.isInline()) {

            content = 'data:application/json;base64,' + this.toBase64(this.map.toString());
        } else if (typeof this.mapOpts.annotation === 'string') {
            content = this.mapOpts.annotation;
        } else {
            content = this.outputFile() + '.map';
        }

        var eol = '\n';
        if (this.css.indexOf('\r\n') !== -1) eol = '\r\n';

        this.css += eol + '/*# sourceMappingURL=' + content + ' */';
    };

    MapGenerator.prototype.outputFile = function outputFile() {
        if (this.opts.to) {
            return this.relative(this.opts.to);
        } else if (this.opts.from) {
            return this.relative(this.opts.from);
        } else {
            return 'to.css';
        }
    };

    MapGenerator.prototype.generateMap = function generateMap() {
        this.generateString();
        if (this.isSourcesContent()) this.setSourcesContent();
        if (this.previous().length > 0) this.applyPrevMaps();
        if (this.isAnnotation()) this.addAnnotation();

        if (this.isInline()) {
            return [this.css];
        } else {
            return [this.css, this.map];
        }
    };

    MapGenerator.prototype.relative = function relative(file) {
        if (file.indexOf('<') === 0) return file;
        if (/^\w+:\/\//.test(file)) return file;

        var from = this.opts.to ? _path2.default.dirname(this.opts.to) : '.';

        if (typeof this.mapOpts.annotation === 'string') {
            from = _path2.default.dirname(_path2.default.resolve(from, this.mapOpts.annotation));
        }

        file = _path2.default.relative(from, file);
        if (_path2.default.sep === '\\') {
            return file.replace(/\\/g, '/');
        } else {
            return file;
        }
    };

    MapGenerator.prototype.sourcePath = function sourcePath(node) {
        if (this.mapOpts.from) {
            return this.mapOpts.from;
        } else {
            return this.relative(node.source.input.from);
        }
    };

    MapGenerator.prototype.generateString = function generateString() {
        var _this3 = this;

        this.css = '';
        this.map = new _sourceMap2.default.SourceMapGenerator({ file: this.outputFile() });

        var line = 1;
        var column = 1;

        var lines = void 0,
            last = void 0;
        this.stringify(this.root, function (str, node, type) {
            _this3.css += str;

            if (node && type !== 'end') {
                if (node.source && node.source.start) {
                    _this3.map.addMapping({
                        source: _this3.sourcePath(node),
                        generated: { line: line, column: column - 1 },
                        original: {
                            line: node.source.start.line,
                            column: node.source.start.column - 1
                        }
                    });
                } else {
                    _this3.map.addMapping({
                        source: '<no source>',
                        original: { line: 1, column: 0 },
                        generated: { line: line, column: column - 1 }
                    });
                }
            }

            lines = str.match(/\n/g);
            if (lines) {
                line += lines.length;
                last = str.lastIndexOf('\n');
                column = str.length - last;
            } else {
                column += str.length;
            }

            if (node && type !== 'start') {
                if (node.source && node.source.end) {
                    _this3.map.addMapping({
                        source: _this3.sourcePath(node),
                        generated: { line: line, column: column - 1 },
                        original: {
                            line: node.source.end.line,
                            column: node.source.end.column
                        }
                    });
                } else {
                    _this3.map.addMapping({
                        source: '<no source>',
                        original: { line: 1, column: 0 },
                        generated: { line: line, column: column - 1 }
                    });
                }
            }
        });
    };

    MapGenerator.prototype.generate = function generate() {
        this.clearAnnotation();

        if (this.isMap()) {
            return this.generateMap();
        } else {
            var result = '';
            this.stringify(this.root, function (i) {
                result += i;
            });
            return [result];
        }
    };

    return MapGenerator;
}();

exports.default = MapGenerator;
module.exports = exports['default'];


}).call(this,require("buffer").Buffer)
},{"buffer":11,"path":22,"source-map":58}],32:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _cssSyntaxError = require('./css-syntax-error');

var _cssSyntaxError2 = _interopRequireDefault(_cssSyntaxError);

var _stringifier = require('./stringifier');

var _stringifier2 = _interopRequireDefault(_stringifier);

var _stringify = require('./stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _warnOnce = require('./warn-once');

var _warnOnce2 = _interopRequireDefault(_warnOnce);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var cloneNode = function cloneNode(obj, parent) {
    var cloned = new obj.constructor();

    for (var i in obj) {
        if (!obj.hasOwnProperty(i)) continue;
        var value = obj[i];
        var type = typeof value === 'undefined' ? 'undefined' : _typeof(value);

        if (i === 'parent' && type === 'object') {
            if (parent) cloned[i] = parent;
        } else if (i === 'source') {
            cloned[i] = value;
        } else if (value instanceof Array) {
            cloned[i] = value.map(function (j) {
                return cloneNode(j, cloned);
            });
        } else {
            if (type === 'object' && value !== null) value = cloneNode(value);
            cloned[i] = value;
        }
    }

    return cloned;
};

/**
 * All node classes inherit the following common methods.
 *
 * @abstract
 */

var Node = function () {

    /**
     * @param {object} [defaults] - value for node properties
     */
    function Node() {
        var defaults = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        _classCallCheck(this, Node);

        this.raws = {};
        if ((typeof defaults === 'undefined' ? 'undefined' : _typeof(defaults)) !== 'object' && typeof defaults !== 'undefined') {
            throw new Error('PostCSS nodes constructor accepts object, not ' + JSON.stringify(defaults));
        }
        for (var name in defaults) {
            this[name] = defaults[name];
        }
    }

    /**
     * Returns a CssSyntaxError instance containing the original position
     * of the node in the source, showing line and column numbers and also
     * a small excerpt to facilitate debugging.
     *
     * If present, an input source map will be used to get the original position
     * of the source, even from a previous compilation step
     * (e.g., from Sass compilation).
     *
     * This method produces very useful error messages.
     *
     * @param {string} message     - error description
     * @param {object} [opts]      - options
     * @param {string} opts.plugin - plugin name that created this error.
     *                               PostCSS will set it automatically.
     * @param {string} opts.word   - a word inside a node’s string that should
     *                               be highlighted as the source of the error
     * @param {number} opts.index  - an index inside a node’s string that should
     *                               be highlighted as the source of the error
     *
     * @return {CssSyntaxError} error object to throw it
     *
     * @example
     * if ( !variables[name] ) {
     *   throw decl.error('Unknown variable ' + name, { word: name });
     *   // CssSyntaxError: postcss-vars:a.sass:4:3: Unknown variable $black
     *   //   color: $black
     *   // a
     *   //          ^
     *   //   background: white
     * }
     */


    Node.prototype.error = function error(message) {
        var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        if (this.source) {
            var pos = this.positionBy(opts);
            return this.source.input.error(message, pos.line, pos.column, opts);
        } else {
            return new _cssSyntaxError2.default(message);
        }
    };

    /**
     * This method is provided as a convenience wrapper for {@link Result#warn}.
     *
     * @param {Result} result      - the {@link Result} instance
     *                               that will receive the warning
     * @param {string} text        - warning message
     * @param {object} [opts]      - options
     * @param {string} opts.plugin - plugin name that created this warning.
     *                               PostCSS will set it automatically.
     * @param {string} opts.word   - a word inside a node’s string that should
     *                               be highlighted as the source of the warning
     * @param {number} opts.index  - an index inside a node’s string that should
     *                               be highlighted as the source of the warning
     *
     * @return {Warning} created warning object
     *
     * @example
     * const plugin = postcss.plugin('postcss-deprecated', () => {
     *   return (root, result) => {
     *     root.walkDecls('bad', decl => {
     *       decl.warn(result, 'Deprecated property bad');
     *     });
     *   };
     * });
     */


    Node.prototype.warn = function warn(result, text, opts) {
        var data = { node: this };
        for (var i in opts) {
            data[i] = opts[i];
        }return result.warn(text, data);
    };

    /**
     * Removes the node from its parent and cleans the parent properties
     * from the node and its children.
     *
     * @example
     * if ( decl.prop.match(/^-webkit-/) ) {
     *   decl.remove();
     * }
     *
     * @return {Node} node to make calls chain
     */


    Node.prototype.remove = function remove() {
        if (this.parent) {
            this.parent.removeChild(this);
        }
        this.parent = undefined;
        return this;
    };

    /**
     * Returns a CSS string representing the node.
     *
     * @param {stringifier|syntax} [stringifier] - a syntax to use
     *                                             in string generation
     *
     * @return {string} CSS string of this node
     *
     * @example
     * postcss.rule({ selector: 'a' }).toString() //=> "a {}"
     */


    Node.prototype.toString = function toString() {
        var stringifier = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _stringify2.default;

        if (stringifier.stringify) stringifier = stringifier.stringify;
        var result = '';
        stringifier(this, function (i) {
            result += i;
        });
        return result;
    };

    /**
     * Returns a clone of the node.
     *
     * The resulting cloned node and its (cloned) children will have
     * a clean parent and code style properties.
     *
     * @param {object} [overrides] - new properties to override in the clone.
     *
     * @example
     * const cloned = decl.clone({ prop: '-moz-' + decl.prop });
     * cloned.raws.before  //=> undefined
     * cloned.parent       //=> undefined
     * cloned.toString()   //=> -moz-transform: scale(0)
     *
     * @return {Node} clone of the node
     */


    Node.prototype.clone = function clone() {
        var overrides = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        var cloned = cloneNode(this);
        for (var name in overrides) {
            cloned[name] = overrides[name];
        }
        return cloned;
    };

    /**
     * Shortcut to clone the node and insert the resulting cloned node
     * before the current node.
     *
     * @param {object} [overrides] - new properties to override in the clone.
     *
     * @example
     * decl.cloneBefore({ prop: '-moz-' + decl.prop });
     *
     * @return {Node} - new node
     */


    Node.prototype.cloneBefore = function cloneBefore() {
        var overrides = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        var cloned = this.clone(overrides);
        this.parent.insertBefore(this, cloned);
        return cloned;
    };

    /**
     * Shortcut to clone the node and insert the resulting cloned node
     * after the current node.
     *
     * @param {object} [overrides] - new properties to override in the clone.
     *
     * @return {Node} - new node
     */


    Node.prototype.cloneAfter = function cloneAfter() {
        var overrides = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        var cloned = this.clone(overrides);
        this.parent.insertAfter(this, cloned);
        return cloned;
    };

    /**
     * Inserts node(s) before the current node and removes the current node.
     *
     * @param {...Node} nodes - node(s) to replace current one
     *
     * @example
     * if ( atrule.name == 'mixin' ) {
     *   atrule.replaceWith(mixinRules[atrule.params]);
     * }
     *
     * @return {Node} current node to methods chain
     */


    Node.prototype.replaceWith = function replaceWith() {
        if (this.parent) {
            for (var _len = arguments.length, nodes = Array(_len), _key = 0; _key < _len; _key++) {
                nodes[_key] = arguments[_key];
            }

            for (var _iterator = nodes, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
                var _ref;

                if (_isArray) {
                    if (_i >= _iterator.length) break;
                    _ref = _iterator[_i++];
                } else {
                    _i = _iterator.next();
                    if (_i.done) break;
                    _ref = _i.value;
                }

                var node = _ref;

                this.parent.insertBefore(this, node);
            }

            this.remove();
        }

        return this;
    };

    Node.prototype.moveTo = function moveTo(newParent) {
        (0, _warnOnce2.default)('Node#moveTo was deprecated. Use Container#append.');
        this.cleanRaws(this.root() === newParent.root());
        this.remove();
        newParent.append(this);
        return this;
    };

    Node.prototype.moveBefore = function moveBefore(otherNode) {
        (0, _warnOnce2.default)('Node#moveBefore was deprecated. Use Node#before.');
        this.cleanRaws(this.root() === otherNode.root());
        this.remove();
        otherNode.parent.insertBefore(otherNode, this);
        return this;
    };

    Node.prototype.moveAfter = function moveAfter(otherNode) {
        (0, _warnOnce2.default)('Node#moveAfter was deprecated. Use Node#after.');
        this.cleanRaws(this.root() === otherNode.root());
        this.remove();
        otherNode.parent.insertAfter(otherNode, this);
        return this;
    };

    /**
     * Returns the next child of the node’s parent.
     * Returns `undefined` if the current node is the last child.
     *
     * @return {Node|undefined} next node
     *
     * @example
     * if ( comment.text === 'delete next' ) {
     *   const next = comment.next();
     *   if ( next ) {
     *     next.remove();
     *   }
     * }
     */


    Node.prototype.next = function next() {
        var index = this.parent.index(this);
        return this.parent.nodes[index + 1];
    };

    /**
     * Returns the previous child of the node’s parent.
     * Returns `undefined` if the current node is the first child.
     *
     * @return {Node|undefined} previous node
     *
     * @example
     * const annotation = decl.prev();
     * if ( annotation.type == 'comment' ) {
     *  readAnnotation(annotation.text);
     * }
     */


    Node.prototype.prev = function prev() {
        var index = this.parent.index(this);
        return this.parent.nodes[index - 1];
    };

    /**
     * Insert new node before current node to current node’s parent.
     *
     * Just alias for `node.parent.insertBefore(node, add)`.
     *
     * @param {Node|object|string|Node[]} add - new node
     *
     * @return {Node} this node for methods chain.
     *
     * @example
     * decl.before('content: ""');
     */


    Node.prototype.before = function before(add) {
        this.parent.insertBefore(this, add);
        return this;
    };

    /**
     * Insert new node after current node to current node’s parent.
     *
     * Just alias for `node.parent.insertAfter(node, add)`.
     *
     * @param {Node|object|string|Node[]} add - new node
     *
     * @return {Node} this node for methods chain.
     *
     * @example
     * decl.after('color: black');
     */


    Node.prototype.after = function after(add) {
        this.parent.insertAfter(this, add);
        return this;
    };

    Node.prototype.toJSON = function toJSON() {
        var fixed = {};

        for (var name in this) {
            if (!this.hasOwnProperty(name)) continue;
            if (name === 'parent') continue;
            var value = this[name];

            if (value instanceof Array) {
                fixed[name] = value.map(function (i) {
                    if ((typeof i === 'undefined' ? 'undefined' : _typeof(i)) === 'object' && i.toJSON) {
                        return i.toJSON();
                    } else {
                        return i;
                    }
                });
            } else if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value.toJSON) {
                fixed[name] = value.toJSON();
            } else {
                fixed[name] = value;
            }
        }

        return fixed;
    };

    /**
     * Returns a {@link Node#raws} value. If the node is missing
     * the code style property (because the node was manually built or cloned),
     * PostCSS will try to autodetect the code style property by looking
     * at other nodes in the tree.
     *
     * @param {string} prop          - name of code style property
     * @param {string} [defaultType] - name of default value, it can be missed
     *                                 if the value is the same as prop
     *
     * @example
     * const root = postcss.parse('a { background: white }');
     * root.nodes[0].append({ prop: 'color', value: 'black' });
     * root.nodes[0].nodes[1].raws.before   //=> undefined
     * root.nodes[0].nodes[1].raw('before') //=> ' '
     *
     * @return {string} code style value
     */


    Node.prototype.raw = function raw(prop, defaultType) {
        var str = new _stringifier2.default();
        return str.raw(this, prop, defaultType);
    };

    /**
     * Finds the Root instance of the node’s tree.
     *
     * @example
     * root.nodes[0].nodes[0].root() === root
     *
     * @return {Root} root parent
     */


    Node.prototype.root = function root() {
        var result = this;
        while (result.parent) {
            result = result.parent;
        }return result;
    };

    Node.prototype.cleanRaws = function cleanRaws(keepBetween) {
        delete this.raws.before;
        delete this.raws.after;
        if (!keepBetween) delete this.raws.between;
    };

    Node.prototype.positionInside = function positionInside(index) {
        var string = this.toString();
        var column = this.source.start.column;
        var line = this.source.start.line;

        for (var i = 0; i < index; i++) {
            if (string[i] === '\n') {
                column = 1;
                line += 1;
            } else {
                column += 1;
            }
        }

        return { line: line, column: column };
    };

    Node.prototype.positionBy = function positionBy(opts) {
        var pos = this.source.start;
        if (opts.index) {
            pos = this.positionInside(opts.index);
        } else if (opts.word) {
            var index = this.toString().indexOf(opts.word);
            if (index !== -1) pos = this.positionInside(index);
        }
        return pos;
    };

    /**
     * @memberof Node#
     * @member {string} type - String representing the node’s type.
     *                         Possible values are `root`, `atrule`, `rule`,
     *                         `decl`, or `comment`.
     *
     * @example
     * postcss.decl({ prop: 'color', value: 'black' }).type //=> 'decl'
     */

    /**
     * @memberof Node#
     * @member {Container} parent - the node’s parent node.
     *
     * @example
     * root.nodes[0].parent == root;
     */

    /**
     * @memberof Node#
     * @member {source} source - the input source of the node
     *
     * The property is used in source map generation.
     *
     * If you create a node manually (e.g., with `postcss.decl()`),
     * that node will not have a `source` property and will be absent
     * from the source map. For this reason, the plugin developer should
     * consider cloning nodes to create new ones (in which case the new node’s
     * source will reference the original, cloned node) or setting
     * the `source` property manually.
     *
     * ```js
     * // Bad
     * const prefixed = postcss.decl({
     *   prop: '-moz-' + decl.prop,
     *   value: decl.value
     * });
     *
     * // Good
     * const prefixed = decl.clone({ prop: '-moz-' + decl.prop });
     * ```
     *
     * ```js
     * if ( atrule.name == 'add-link' ) {
     *   const rule = postcss.rule({ selector: 'a', source: atrule.source });
     *   atrule.parent.insertBefore(atrule, rule);
     * }
     * ```
     *
     * @example
     * decl.source.input.from //=> '/home/ai/a.sass'
     * decl.source.start      //=> { line: 10, column: 2 }
     * decl.source.end        //=> { line: 10, column: 12 }
     */

    /**
     * @memberof Node#
     * @member {object} raws - Information to generate byte-to-byte equal
     *                         node string as it was in the origin input.
     *
     * Every parser saves its own properties,
     * but the default CSS parser uses:
     *
     * * `before`: the space symbols before the node. It also stores `*`
     *   and `_` symbols before the declaration (IE hack).
     * * `after`: the space symbols after the last child of the node
     *   to the end of the node.
     * * `between`: the symbols between the property and value
     *   for declarations, selector and `{` for rules, or last parameter
     *   and `{` for at-rules.
     * * `semicolon`: contains true if the last child has
     *   an (optional) semicolon.
     * * `afterName`: the space between the at-rule name and its parameters.
     * * `left`: the space symbols between `/*` and the comment’s text.
     * * `right`: the space symbols between the comment’s text
     *   and <code>*&#47;</code>.
     * * `important`: the content of the important statement,
     *   if it is not just `!important`.
     *
     * PostCSS cleans selectors, declaration values and at-rule parameters
     * from comments and extra spaces, but it stores origin content in raws
     * properties. As such, if you don’t change a declaration’s value,
     * PostCSS will use the raw value with comments.
     *
     * @example
     * const root = postcss.parse('a {\n  color:black\n}')
     * root.first.first.raws //=> { before: '\n  ', between: ':' }
     */

    return Node;
}();

exports.default = Node;

/**
 * @typedef {object} position
 * @property {number} line   - source line in file
 * @property {number} column - source column in file
 */

/**
 * @typedef {object} source
 * @property {Input} input    - {@link Input} with input file
 * @property {position} start - The starting position of the node’s source
 * @property {position} end   - The ending position of the node’s source
 */

module.exports = exports['default'];


},{"./css-syntax-error":26,"./stringifier":41,"./stringify":42,"./warn-once":46}],33:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.default = parse;

var _parser = require('./parser');

var _parser2 = _interopRequireDefault(_parser);

var _input = require('./input');

var _input2 = _interopRequireDefault(_input);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function parse(css, opts) {
    if (opts && opts.safe) {
        throw new Error('Option safe was removed. ' + 'Use parser: require("postcss-safe-parser")');
    }

    var input = new _input2.default(css, opts);
    var parser = new _parser2.default(input);
    try {
        parser.parse();
    } catch (e) {
        if (e.name === 'CssSyntaxError' && opts && opts.from) {
            if (/\.scss$/i.test(opts.from)) {
                e.message += '\nYou tried to parse SCSS with ' + 'the standard CSS parser; ' + 'try again with the postcss-scss parser';
            } else if (/\.sass/i.test(opts.from)) {
                e.message += '\nYou tried to parse Sass with ' + 'the standard CSS parser; ' + 'try again with the postcss-sass parser';
            } else if (/\.less$/i.test(opts.from)) {
                e.message += '\nYou tried to parse Less with ' + 'the standard CSS parser; ' + 'try again with the postcss-less parser';
            }
        }
        throw e;
    }

    return parser.root;
}
module.exports = exports['default'];


},{"./input":28,"./parser":34}],34:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _declaration = require('./declaration');

var _declaration2 = _interopRequireDefault(_declaration);

var _tokenize = require('./tokenize');

var _tokenize2 = _interopRequireDefault(_tokenize);

var _comment = require('./comment');

var _comment2 = _interopRequireDefault(_comment);

var _atRule = require('./at-rule');

var _atRule2 = _interopRequireDefault(_atRule);

var _root = require('./root');

var _root2 = _interopRequireDefault(_root);

var _rule = require('./rule');

var _rule2 = _interopRequireDefault(_rule);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Parser = function () {
    function Parser(input) {
        _classCallCheck(this, Parser);

        this.input = input;

        this.root = new _root2.default();
        this.current = this.root;
        this.spaces = '';
        this.semicolon = false;

        this.createTokenizer();
        this.root.source = { input: input, start: { line: 1, column: 1 } };
    }

    Parser.prototype.createTokenizer = function createTokenizer() {
        this.tokenizer = (0, _tokenize2.default)(this.input);
    };

    Parser.prototype.parse = function parse() {
        var token = void 0;
        while (!this.tokenizer.endOfFile()) {
            token = this.tokenizer.nextToken();

            switch (token[0]) {

                case 'space':
                    this.spaces += token[1];
                    break;

                case ';':
                    this.freeSemicolon(token);
                    break;

                case '}':
                    this.end(token);
                    break;

                case 'comment':
                    this.comment(token);
                    break;

                case 'at-word':
                    this.atrule(token);
                    break;

                case '{':
                    this.emptyRule(token);
                    break;

                default:
                    this.other(token);
                    break;
            }
        }
        this.endFile();
    };

    Parser.prototype.comment = function comment(token) {
        var node = new _comment2.default();
        this.init(node, token[2], token[3]);
        node.source.end = { line: token[4], column: token[5] };

        var text = token[1].slice(2, -2);
        if (/^\s*$/.test(text)) {
            node.text = '';
            node.raws.left = text;
            node.raws.right = '';
        } else {
            var match = text.match(/^(\s*)([^]*[^\s])(\s*)$/);
            node.text = match[2];
            node.raws.left = match[1];
            node.raws.right = match[3];
        }
    };

    Parser.prototype.emptyRule = function emptyRule(token) {
        var node = new _rule2.default();
        this.init(node, token[2], token[3]);
        node.selector = '';
        node.raws.between = '';
        this.current = node;
    };

    Parser.prototype.other = function other(start) {
        var end = false;
        var type = null;
        var colon = false;
        var bracket = null;
        var brackets = [];

        var tokens = [];
        var token = start;
        while (token) {
            type = token[0];
            tokens.push(token);

            if (type === '(' || type === '[') {
                if (!bracket) bracket = token;
                brackets.push(type === '(' ? ')' : ']');
            } else if (brackets.length === 0) {
                if (type === ';') {
                    if (colon) {
                        this.decl(tokens);
                        return;
                    } else {
                        break;
                    }
                } else if (type === '{') {
                    this.rule(tokens);
                    return;
                } else if (type === '}') {
                    this.tokenizer.back(tokens.pop());
                    end = true;
                    break;
                } else if (type === ':') {
                    colon = true;
                }
            } else if (type === brackets[brackets.length - 1]) {
                brackets.pop();
                if (brackets.length === 0) bracket = null;
            }

            token = this.tokenizer.nextToken();
        }

        if (this.tokenizer.endOfFile()) end = true;
        if (brackets.length > 0) this.unclosedBracket(bracket);

        if (end && colon) {
            while (tokens.length) {
                token = tokens[tokens.length - 1][0];
                if (token !== 'space' && token !== 'comment') break;
                this.tokenizer.back(tokens.pop());
            }
            this.decl(tokens);
            return;
        } else {
            this.unknownWord(tokens);
        }
    };

    Parser.prototype.rule = function rule(tokens) {
        tokens.pop();

        var node = new _rule2.default();
        this.init(node, tokens[0][2], tokens[0][3]);

        node.raws.between = this.spacesAndCommentsFromEnd(tokens);
        this.raw(node, 'selector', tokens);
        this.current = node;
    };

    Parser.prototype.decl = function decl(tokens) {
        var node = new _declaration2.default();
        this.init(node);

        var last = tokens[tokens.length - 1];
        if (last[0] === ';') {
            this.semicolon = true;
            tokens.pop();
        }
        if (last[4]) {
            node.source.end = { line: last[4], column: last[5] };
        } else {
            node.source.end = { line: last[2], column: last[3] };
        }

        while (tokens[0][0] !== 'word') {
            if (tokens.length === 1) this.unknownWord(tokens);
            node.raws.before += tokens.shift()[1];
        }
        node.source.start = { line: tokens[0][2], column: tokens[0][3] };

        node.prop = '';
        while (tokens.length) {
            var type = tokens[0][0];
            if (type === ':' || type === 'space' || type === 'comment') {
                break;
            }
            node.prop += tokens.shift()[1];
        }

        node.raws.between = '';

        var token = void 0;
        while (tokens.length) {
            token = tokens.shift();

            if (token[0] === ':') {
                node.raws.between += token[1];
                break;
            } else {
                node.raws.between += token[1];
            }
        }

        if (node.prop[0] === '_' || node.prop[0] === '*') {
            node.raws.before += node.prop[0];
            node.prop = node.prop.slice(1);
        }
        node.raws.between += this.spacesAndCommentsFromStart(tokens);
        this.precheckMissedSemicolon(tokens);

        for (var i = tokens.length - 1; i > 0; i--) {
            token = tokens[i];
            if (token[1].toLowerCase() === '!important') {
                node.important = true;
                var string = this.stringFrom(tokens, i);
                string = this.spacesFromEnd(tokens) + string;
                if (string !== ' !important') node.raws.important = string;
                break;
            } else if (token[1].toLowerCase() === 'important') {
                var cache = tokens.slice(0);
                var str = '';
                for (var j = i; j > 0; j--) {
                    var _type = cache[j][0];
                    if (str.trim().indexOf('!') === 0 && _type !== 'space') {
                        break;
                    }
                    str = cache.pop()[1] + str;
                }
                if (str.trim().indexOf('!') === 0) {
                    node.important = true;
                    node.raws.important = str;
                    tokens = cache;
                }
            }

            if (token[0] !== 'space' && token[0] !== 'comment') {
                break;
            }
        }

        this.raw(node, 'value', tokens);

        if (node.value.indexOf(':') !== -1) this.checkMissedSemicolon(tokens);
    };

    Parser.prototype.atrule = function atrule(token) {
        var node = new _atRule2.default();
        node.name = token[1].slice(1);
        if (node.name === '') {
            this.unnamedAtrule(node, token);
        }
        this.init(node, token[2], token[3]);

        var prev = void 0;
        var shift = void 0;
        var last = false;
        var open = false;
        var params = [];

        while (!this.tokenizer.endOfFile()) {
            token = this.tokenizer.nextToken();

            if (token[0] === ';') {
                node.source.end = { line: token[2], column: token[3] };
                this.semicolon = true;
                break;
            } else if (token[0] === '{') {
                open = true;
                break;
            } else if (token[0] === '}') {
                if (params.length > 0) {
                    shift = params.length - 1;
                    prev = params[shift];
                    while (prev && prev[0] === 'space') {
                        prev = params[--shift];
                    }
                    if (prev) {
                        node.source.end = { line: prev[4], column: prev[5] };
                    }
                }
                this.end(token);
                break;
            } else {
                params.push(token);
            }

            if (this.tokenizer.endOfFile()) {
                last = true;
                break;
            }
        }

        node.raws.between = this.spacesAndCommentsFromEnd(params);
        if (params.length) {
            node.raws.afterName = this.spacesAndCommentsFromStart(params);
            this.raw(node, 'params', params);
            if (last) {
                token = params[params.length - 1];
                node.source.end = { line: token[4], column: token[5] };
                this.spaces = node.raws.between;
                node.raws.between = '';
            }
        } else {
            node.raws.afterName = '';
            node.params = '';
        }

        if (open) {
            node.nodes = [];
            this.current = node;
        }
    };

    Parser.prototype.end = function end(token) {
        if (this.current.nodes && this.current.nodes.length) {
            this.current.raws.semicolon = this.semicolon;
        }
        this.semicolon = false;

        this.current.raws.after = (this.current.raws.after || '') + this.spaces;
        this.spaces = '';

        if (this.current.parent) {
            this.current.source.end = { line: token[2], column: token[3] };
            this.current = this.current.parent;
        } else {
            this.unexpectedClose(token);
        }
    };

    Parser.prototype.endFile = function endFile() {
        if (this.current.parent) this.unclosedBlock();
        if (this.current.nodes && this.current.nodes.length) {
            this.current.raws.semicolon = this.semicolon;
        }
        this.current.raws.after = (this.current.raws.after || '') + this.spaces;
    };

    Parser.prototype.freeSemicolon = function freeSemicolon(token) {
        this.spaces += token[1];
        if (this.current.nodes) {
            var prev = this.current.nodes[this.current.nodes.length - 1];
            if (prev && prev.type === 'rule' && !prev.raws.ownSemicolon) {
                prev.raws.ownSemicolon = this.spaces;
                this.spaces = '';
            }
        }
    };

    // Helpers

    Parser.prototype.init = function init(node, line, column) {
        this.current.push(node);

        node.source = { start: { line: line, column: column }, input: this.input };
        node.raws.before = this.spaces;
        this.spaces = '';
        if (node.type !== 'comment') this.semicolon = false;
    };

    Parser.prototype.raw = function raw(node, prop, tokens) {
        var token = void 0,
            type = void 0;
        var length = tokens.length;
        var value = '';
        var clean = true;
        for (var i = 0; i < length; i += 1) {
            token = tokens[i];
            type = token[0];
            if (type === 'comment' || type === 'space' && i === length - 1) {
                clean = false;
            } else {
                value += token[1];
            }
        }
        if (!clean) {
            var raw = tokens.reduce(function (all, i) {
                return all + i[1];
            }, '');
            node.raws[prop] = { value: value, raw: raw };
        }
        node[prop] = value;
    };

    Parser.prototype.spacesAndCommentsFromEnd = function spacesAndCommentsFromEnd(tokens) {
        var lastTokenType = void 0;
        var spaces = '';
        while (tokens.length) {
            lastTokenType = tokens[tokens.length - 1][0];
            if (lastTokenType !== 'space' && lastTokenType !== 'comment') break;
            spaces = tokens.pop()[1] + spaces;
        }
        return spaces;
    };

    Parser.prototype.spacesAndCommentsFromStart = function spacesAndCommentsFromStart(tokens) {
        var next = void 0;
        var spaces = '';
        while (tokens.length) {
            next = tokens[0][0];
            if (next !== 'space' && next !== 'comment') break;
            spaces += tokens.shift()[1];
        }
        return spaces;
    };

    Parser.prototype.spacesFromEnd = function spacesFromEnd(tokens) {
        var lastTokenType = void 0;
        var spaces = '';
        while (tokens.length) {
            lastTokenType = tokens[tokens.length - 1][0];
            if (lastTokenType !== 'space') break;
            spaces = tokens.pop()[1] + spaces;
        }
        return spaces;
    };

    Parser.prototype.stringFrom = function stringFrom(tokens, from) {
        var result = '';
        for (var i = from; i < tokens.length; i++) {
            result += tokens[i][1];
        }
        tokens.splice(from, tokens.length - from);
        return result;
    };

    Parser.prototype.colon = function colon(tokens) {
        var brackets = 0;
        var token = void 0,
            type = void 0,
            prev = void 0;
        for (var i = 0; i < tokens.length; i++) {
            token = tokens[i];
            type = token[0];

            if (type === '(') {
                brackets += 1;
            } else if (type === ')') {
                brackets -= 1;
            } else if (brackets === 0 && type === ':') {
                if (!prev) {
                    this.doubleColon(token);
                } else if (prev[0] === 'word' && prev[1] === 'progid') {
                    continue;
                } else {
                    return i;
                }
            }

            prev = token;
        }
        return false;
    };

    // Errors

    Parser.prototype.unclosedBracket = function unclosedBracket(bracket) {
        throw this.input.error('Unclosed bracket', bracket[2], bracket[3]);
    };

    Parser.prototype.unknownWord = function unknownWord(tokens) {
        throw this.input.error('Unknown word', tokens[0][2], tokens[0][3]);
    };

    Parser.prototype.unexpectedClose = function unexpectedClose(token) {
        throw this.input.error('Unexpected }', token[2], token[3]);
    };

    Parser.prototype.unclosedBlock = function unclosedBlock() {
        var pos = this.current.source.start;
        throw this.input.error('Unclosed block', pos.line, pos.column);
    };

    Parser.prototype.doubleColon = function doubleColon(token) {
        throw this.input.error('Double colon', token[2], token[3]);
    };

    Parser.prototype.unnamedAtrule = function unnamedAtrule(node, token) {
        throw this.input.error('At-rule without name', token[2], token[3]);
    };

    Parser.prototype.precheckMissedSemicolon = function precheckMissedSemicolon(tokens) {
        // Hook for Safe Parser
        tokens;
    };

    Parser.prototype.checkMissedSemicolon = function checkMissedSemicolon(tokens) {
        var colon = this.colon(tokens);
        if (colon === false) return;

        var founded = 0;
        var token = void 0;
        for (var j = colon - 1; j >= 0; j--) {
            token = tokens[j];
            if (token[0] !== 'space') {
                founded += 1;
                if (founded === 2) break;
            }
        }
        throw this.input.error('Missed semicolon', token[2], token[3]);
    };

    return Parser;
}();

exports.default = Parser;
module.exports = exports['default'];


},{"./at-rule":23,"./comment":24,"./declaration":27,"./root":39,"./rule":40,"./tokenize":44}],35:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _declaration = require('./declaration');

var _declaration2 = _interopRequireDefault(_declaration);

var _processor = require('./processor');

var _processor2 = _interopRequireDefault(_processor);

var _stringify = require('./stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _comment = require('./comment');

var _comment2 = _interopRequireDefault(_comment);

var _atRule = require('./at-rule');

var _atRule2 = _interopRequireDefault(_atRule);

var _vendor = require('./vendor');

var _vendor2 = _interopRequireDefault(_vendor);

var _parse = require('./parse');

var _parse2 = _interopRequireDefault(_parse);

var _list = require('./list');

var _list2 = _interopRequireDefault(_list);

var _rule = require('./rule');

var _rule2 = _interopRequireDefault(_rule);

var _root = require('./root');

var _root2 = _interopRequireDefault(_root);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Create a new {@link Processor} instance that will apply `plugins`
 * as CSS processors.
 *
 * @param {Array.<Plugin|pluginFunction>|Processor} plugins - PostCSS
 *        plugins. See {@link Processor#use} for plugin format.
 *
 * @return {Processor} Processor to process multiple CSS
 *
 * @example
 * import postcss from 'postcss';
 *
 * postcss(plugins).process(css, { from, to }).then(result => {
 *   console.log(result.css);
 * });
 *
 * @namespace postcss
 */
function postcss() {
  for (var _len = arguments.length, plugins = Array(_len), _key = 0; _key < _len; _key++) {
    plugins[_key] = arguments[_key];
  }

  if (plugins.length === 1 && Array.isArray(plugins[0])) {
    plugins = plugins[0];
  }
  return new _processor2.default(plugins);
}

/**
 * Creates a PostCSS plugin with a standard API.
 *
 * The newly-wrapped function will provide both the name and PostCSS
 * version of the plugin.
 *
 * ```js
 *  const processor = postcss([replace]);
 *  processor.plugins[0].postcssPlugin  //=> 'postcss-replace'
 *  processor.plugins[0].postcssVersion //=> '5.1.0'
 * ```
 *
 * The plugin function receives 2 arguments: {@link Root}
 * and {@link Result} instance. The function should mutate the provided
 * `Root` node. Alternatively, you can create a new `Root` node
 * and override the `result.root` property.
 *
 * ```js
 * const cleaner = postcss.plugin('postcss-cleaner', () => {
 *   return (root, result) => {
 *     result.root = postcss.root();
 *   };
 * });
 * ```
 *
 * As a convenience, plugins also expose a `process` method so that you can use
 * them as standalone tools.
 *
 * ```js
 * cleaner.process(css, processOpts, pluginOpts);
 * // This is equivalent to:
 * postcss([ cleaner(pluginOpts) ]).process(css, processOpts);
 * ```
 *
 * Asynchronous plugins should return a `Promise` instance.
 *
 * ```js
 * postcss.plugin('postcss-import', () => {
 *   return (root, result) => {
 *     return new Promise( (resolve, reject) => {
 *       fs.readFile('base.css', (base) => {
 *         root.prepend(base);
 *         resolve();
 *       });
 *     });
 *   };
 * });
 * ```
 *
 * Add warnings using the {@link Node#warn} method.
 * Send data to other plugins using the {@link Result#messages} array.
 *
 * ```js
 * postcss.plugin('postcss-caniuse-test', () => {
 *   return (root, result) => {
 *     css.walkDecls(decl => {
 *       if ( !caniuse.support(decl.prop) ) {
 *         decl.warn(result, 'Some browsers do not support ' + decl.prop);
 *       }
 *     });
 *   };
 * });
 * ```
 *
 * @param {string} name          - PostCSS plugin name. Same as in `name`
 *                                 property in `package.json`. It will be saved
 *                                 in `plugin.postcssPlugin` property.
 * @param {function} initializer - will receive plugin options
 *                                 and should return {@link pluginFunction}
 *
 * @return {Plugin} PostCSS plugin
 */
postcss.plugin = function plugin(name, initializer) {
  var creator = function creator() {
    var transformer = initializer.apply(undefined, arguments);
    transformer.postcssPlugin = name;
    transformer.postcssVersion = new _processor2.default().version;
    return transformer;
  };

  var cache = void 0;
  Object.defineProperty(creator, 'postcss', {
    get: function get() {
      if (!cache) cache = creator();
      return cache;
    }
  });

  creator.process = function (css, processOpts, pluginOpts) {
    return postcss([creator(pluginOpts)]).process(css, processOpts);
  };

  return creator;
};

/**
 * Default function to convert a node tree into a CSS string.
 *
 * @param {Node} node       - start node for stringifing. Usually {@link Root}.
 * @param {builder} builder - function to concatenate CSS from node’s parts
 *                            or generate string and source map
 *
 * @return {void}
 *
 * @function
 */
postcss.stringify = _stringify2.default;

/**
 * Parses source css and returns a new {@link Root} node,
 * which contains the source CSS nodes.
 *
 * @param {string|toString} css   - string with input CSS or any object
 *                                  with toString() method, like a Buffer
 * @param {processOptions} [opts] - options with only `from` and `map` keys
 *
 * @return {Root} PostCSS AST
 *
 * @example
 * // Simple CSS concatenation with source map support
 * const root1 = postcss.parse(css1, { from: file1 });
 * const root2 = postcss.parse(css2, { from: file2 });
 * root1.append(root2).toResult().css;
 *
 * @function
 */
postcss.parse = _parse2.default;

/**
 * @member {vendor} - Contains the {@link vendor} module.
 *
 * @example
 * postcss.vendor.unprefixed('-moz-tab') //=> ['tab']
 */
postcss.vendor = _vendor2.default;

/**
 * @member {list} - Contains the {@link list} module.
 *
 * @example
 * postcss.list.space('5px calc(10% + 5px)') //=> ['5px', 'calc(10% + 5px)']
 */
postcss.list = _list2.default;

/**
 * Creates a new {@link Comment} node.
 *
 * @param {object} [defaults] - properties for the new node.
 *
 * @return {Comment} new Comment node
 *
 * @example
 * postcss.comment({ text: 'test' })
 */
postcss.comment = function (defaults) {
  return new _comment2.default(defaults);
};

/**
 * Creates a new {@link AtRule} node.
 *
 * @param {object} [defaults] - properties for the new node.
 *
 * @return {AtRule} new AtRule node
 *
 * @example
 * postcss.atRule({ name: 'charset' }).toString() //=> "@charset"
 */
postcss.atRule = function (defaults) {
  return new _atRule2.default(defaults);
};

/**
 * Creates a new {@link Declaration} node.
 *
 * @param {object} [defaults] - properties for the new node.
 *
 * @return {Declaration} new Declaration node
 *
 * @example
 * postcss.decl({ prop: 'color', value: 'red' }).toString() //=> "color: red"
 */
postcss.decl = function (defaults) {
  return new _declaration2.default(defaults);
};

/**
 * Creates a new {@link Rule} node.
 *
 * @param {object} [defaults] - properties for the new node.
 *
 * @return {Rule} new Rule node
 *
 * @example
 * postcss.rule({ selector: 'a' }).toString() //=> "a {\n}"
 */
postcss.rule = function (defaults) {
  return new _rule2.default(defaults);
};

/**
 * Creates a new {@link Root} node.
 *
 * @param {object} [defaults] - properties for the new node.
 *
 * @return {Root} new Root node
 *
 * @example
 * postcss.root({ after: '\n' }).toString() //=> "\n"
 */
postcss.root = function (defaults) {
  return new _root2.default(defaults);
};

exports.default = postcss;
module.exports = exports['default'];


},{"./at-rule":23,"./comment":24,"./declaration":27,"./list":30,"./parse":33,"./processor":37,"./root":39,"./rule":40,"./stringify":42,"./vendor":45}],36:[function(require,module,exports){
(function (Buffer){
'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _sourceMap = require('source-map');

var _sourceMap2 = _interopRequireDefault(_sourceMap);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function fromBase64(str) {
    if (Buffer) {
        if (Buffer.from && Buffer.from !== Uint8Array.from) {
            return Buffer.from(str, 'base64').toString();
        } else {
            return new Buffer(str, 'base64').toString();
        }
    } else {
        return window.atob(str);
    }
}

/**
 * Source map information from input CSS.
 * For example, source map after Sass compiler.
 *
 * This class will automatically find source map in input CSS or in file system
 * near input file (according `from` option).
 *
 * @example
 * const root = postcss.parse(css, { from: 'a.sass.css' });
 * root.input.map //=> PreviousMap
 */

var PreviousMap = function () {

    /**
     * @param {string}         css    - input CSS source
     * @param {processOptions} [opts] - {@link Processor#process} options
     */
    function PreviousMap(css, opts) {
        _classCallCheck(this, PreviousMap);

        this.loadAnnotation(css);
        /**
         * @member {boolean} - Was source map inlined by data-uri to input CSS.
         */
        this.inline = this.startWith(this.annotation, 'data:');

        var prev = opts.map ? opts.map.prev : undefined;
        var text = this.loadMap(opts.from, prev);
        if (text) this.text = text;
    }

    /**
     * Create a instance of `SourceMapGenerator` class
     * from the `source-map` library to work with source map information.
     *
     * It is lazy method, so it will create object only on first call
     * and then it will use cache.
     *
     * @return {SourceMapGenerator} object with source map information
     */


    PreviousMap.prototype.consumer = function consumer() {
        if (!this.consumerCache) {
            this.consumerCache = new _sourceMap2.default.SourceMapConsumer(this.text);
        }
        return this.consumerCache;
    };

    /**
     * Does source map contains `sourcesContent` with input source text.
     *
     * @return {boolean} Is `sourcesContent` present
     */


    PreviousMap.prototype.withContent = function withContent() {
        return !!(this.consumer().sourcesContent && this.consumer().sourcesContent.length > 0);
    };

    PreviousMap.prototype.startWith = function startWith(string, start) {
        if (!string) return false;
        return string.substr(0, start.length) === start;
    };

    PreviousMap.prototype.loadAnnotation = function loadAnnotation(css) {
        var match = css.match(/\/\*\s*# sourceMappingURL=(.*)\s*\*\//);
        if (match) this.annotation = match[1].trim();
    };

    PreviousMap.prototype.decodeInline = function decodeInline(text) {
        // data:application/json;charset=utf-8;base64,
        // data:application/json;charset=utf8;base64,
        // data:application/json;base64,
        var baseUri = /^data:application\/json;(?:charset=utf-?8;)?base64,/;
        var uri = 'data:application/json,';

        if (this.startWith(text, uri)) {
            return decodeURIComponent(text.substr(uri.length));
        } else if (baseUri.test(text)) {
            return fromBase64(text.substr(RegExp.lastMatch.length));
        } else {
            var encoding = text.match(/data:application\/json;([^,]+),/)[1];
            throw new Error('Unsupported source map encoding ' + encoding);
        }
    };

    PreviousMap.prototype.loadMap = function loadMap(file, prev) {
        if (prev === false) return false;

        if (prev) {
            if (typeof prev === 'string') {
                return prev;
            } else if (typeof prev === 'function') {
                var prevPath = prev(file);
                if (prevPath && _fs2.default.existsSync && _fs2.default.existsSync(prevPath)) {
                    return _fs2.default.readFileSync(prevPath, 'utf-8').toString().trim();
                } else {
                    throw new Error('Unable to load previous source map: ' + prevPath.toString());
                }
            } else if (prev instanceof _sourceMap2.default.SourceMapConsumer) {
                return _sourceMap2.default.SourceMapGenerator.fromSourceMap(prev).toString();
            } else if (prev instanceof _sourceMap2.default.SourceMapGenerator) {
                return prev.toString();
            } else if (this.isMap(prev)) {
                return JSON.stringify(prev);
            } else {
                throw new Error('Unsupported previous source map format: ' + prev.toString());
            }
        } else if (this.inline) {
            return this.decodeInline(this.annotation);
        } else if (this.annotation) {
            var map = this.annotation;
            if (file) map = _path2.default.join(_path2.default.dirname(file), map);

            this.root = _path2.default.dirname(map);
            if (_fs2.default.existsSync && _fs2.default.existsSync(map)) {
                return _fs2.default.readFileSync(map, 'utf-8').toString().trim();
            } else {
                return false;
            }
        }
    };

    PreviousMap.prototype.isMap = function isMap(map) {
        if ((typeof map === 'undefined' ? 'undefined' : _typeof(map)) !== 'object') return false;
        return typeof map.mappings === 'string' || typeof map._mappings === 'string';
    };

    return PreviousMap;
}();

exports.default = PreviousMap;
module.exports = exports['default'];


}).call(this,require("buffer").Buffer)
},{"buffer":11,"fs":10,"path":22,"source-map":58}],37:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _lazyResult = require('./lazy-result');

var _lazyResult2 = _interopRequireDefault(_lazyResult);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Contains plugins to process CSS. Create one `Processor` instance,
 * initialize its plugins, and then use that instance on numerous CSS files.
 *
 * @example
 * const processor = postcss([autoprefixer, precss]);
 * processor.process(css1).then(result => console.log(result.css));
 * processor.process(css2).then(result => console.log(result.css));
 */
var Processor = function () {

  /**
   * @param {Array.<Plugin|pluginFunction>|Processor} plugins - PostCSS
   *        plugins. See {@link Processor#use} for plugin format.
   */
  function Processor() {
    var plugins = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

    _classCallCheck(this, Processor);

    /**
     * @member {string} - Current PostCSS version.
     *
     * @example
     * if ( result.processor.version.split('.')[0] !== '6' ) {
     *   throw new Error('This plugin works only with PostCSS 6');
     * }
     */
    this.version = '6.0.13';
    /**
     * @member {pluginFunction[]} - Plugins added to this processor.
     *
     * @example
     * const processor = postcss([autoprefixer, precss]);
     * processor.plugins.length //=> 2
     */
    this.plugins = this.normalize(plugins);
  }

  /**
   * Adds a plugin to be used as a CSS processor.
   *
   * PostCSS plugin can be in 4 formats:
   * * A plugin created by {@link postcss.plugin} method.
   * * A function. PostCSS will pass the function a @{link Root}
   *   as the first argument and current {@link Result} instance
   *   as the second.
   * * An object with a `postcss` method. PostCSS will use that method
   *   as described in #2.
   * * Another {@link Processor} instance. PostCSS will copy plugins
   *   from that instance into this one.
   *
   * Plugins can also be added by passing them as arguments when creating
   * a `postcss` instance (see [`postcss(plugins)`]).
   *
   * Asynchronous plugins should return a `Promise` instance.
   *
   * @param {Plugin|pluginFunction|Processor} plugin - PostCSS plugin
   *                                                   or {@link Processor}
   *                                                   with plugins
   *
   * @example
   * const processor = postcss()
   *   .use(autoprefixer)
   *   .use(precss);
   *
   * @return {Processes} current processor to make methods chain
   */


  Processor.prototype.use = function use(plugin) {
    this.plugins = this.plugins.concat(this.normalize([plugin]));
    return this;
  };

  /**
   * Parses source CSS and returns a {@link LazyResult} Promise proxy.
   * Because some plugins can be asynchronous it doesn’t make
   * any transformations. Transformations will be applied
   * in the {@link LazyResult} methods.
   *
   * @param {string|toString|Result} css - String with input CSS or
   *                                       any object with a `toString()`
   *                                       method, like a Buffer.
   *                                       Optionally, send a {@link Result}
   *                                       instance and the processor will
   *                                       take the {@link Root} from it.
   * @param {processOptions} [opts]      - options
   *
   * @return {LazyResult} Promise proxy
   *
   * @example
   * processor.process(css, { from: 'a.css', to: 'a.out.css' })
   *   .then(result => {
   *      console.log(result.css);
   *   });
   */


  Processor.prototype.process = function process(css) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    return new _lazyResult2.default(this, css, opts);
  };

  Processor.prototype.normalize = function normalize(plugins) {
    var normalized = [];
    for (var _iterator = plugins, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref = _i.value;
      }

      var i = _ref;

      if (i.postcss) i = i.postcss;

      if ((typeof i === 'undefined' ? 'undefined' : _typeof(i)) === 'object' && Array.isArray(i.plugins)) {
        normalized = normalized.concat(i.plugins);
      } else if (typeof i === 'function') {
        normalized.push(i);
      } else if ((typeof i === 'undefined' ? 'undefined' : _typeof(i)) === 'object' && (i.parse || i.stringify)) {
        throw new Error('PostCSS syntaxes cannot be used as plugins. ' + 'Instead, please use one of the ' + 'syntax/parser/stringifier options as ' + 'outlined in your PostCSS ' + 'runner documentation.');
      } else {
        throw new Error(i + ' is not a PostCSS plugin');
      }
    }
    return normalized;
  };

  return Processor;
}();

exports.default = Processor;

/**
 * @callback builder
 * @param {string} part          - part of generated CSS connected to this node
 * @param {Node}   node          - AST node
 * @param {"start"|"end"} [type] - node’s part type
 */

/**
 * @callback parser
 *
 * @param {string|toString} css   - string with input CSS or any object
 *                                  with toString() method, like a Buffer
 * @param {processOptions} [opts] - options with only `from` and `map` keys
 *
 * @return {Root} PostCSS AST
 */

/**
 * @callback stringifier
 *
 * @param {Node} node       - start node for stringifing. Usually {@link Root}.
 * @param {builder} builder - function to concatenate CSS from node’s parts
 *                            or generate string and source map
 *
 * @return {void}
 */

/**
 * @typedef {object} syntax
 * @property {parser} parse          - function to generate AST by string
 * @property {stringifier} stringify - function to generate string by AST
 */

/**
 * @typedef {object} toString
 * @property {function} toString
 */

/**
 * @callback pluginFunction
 * @param {Root} root     - parsed input CSS
 * @param {Result} result - result to set warnings or check other plugins
 */

/**
 * @typedef {object} Plugin
 * @property {function} postcss - PostCSS plugin function
 */

/**
 * @typedef {object} processOptions
 * @property {string} from             - the path of the CSS source file.
 *                                       You should always set `from`,
 *                                       because it is used in source map
 *                                       generation and syntax error messages.
 * @property {string} to               - the path where you’ll put the output
 *                                       CSS file. You should always set `to`
 *                                       to generate correct source maps.
 * @property {parser} parser           - function to generate AST by string
 * @property {stringifier} stringifier - class to generate string by AST
 * @property {syntax} syntax           - object with `parse` and `stringify`
 * @property {object} map              - source map options
 * @property {boolean} map.inline                    - does source map should
 *                                                     be embedded in the output
 *                                                     CSS as a base64-encoded
 *                                                     comment
 * @property {string|object|false|function} map.prev - source map content
 *                                                     from a previous
 *                                                     processing step
 *                                                     (for example, Sass).
 *                                                     PostCSS will try to find
 *                                                     previous map
 *                                                     automatically, so you
 *                                                     could disable it by
 *                                                     `false` value.
 * @property {boolean} map.sourcesContent            - does PostCSS should set
 *                                                     the origin content to map
 * @property {string|false} map.annotation           - does PostCSS should set
 *                                                     annotation comment to map
 * @property {string} map.from                       - override `from` in map’s
 *                                                     `sources`
 */

module.exports = exports['default'];


},{"./lazy-result":29}],38:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _warning = require('./warning');

var _warning2 = _interopRequireDefault(_warning);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Provides the result of the PostCSS transformations.
 *
 * A Result instance is returned by {@link LazyResult#then}
 * or {@link Root#toResult} methods.
 *
 * @example
 * postcss([cssnext]).process(css).then(function (result) {
 *    console.log(result.css);
 * });
 *
 * @example
 * var result2 = postcss.parse(css).toResult();
 */
var Result = function () {

  /**
   * @param {Processor} processor - processor used for this transformation.
   * @param {Root}      root      - Root node after all transformations.
   * @param {processOptions} opts - options from the {@link Processor#process}
   *                                or {@link Root#toResult}
   */
  function Result(processor, root, opts) {
    _classCallCheck(this, Result);

    /**
     * @member {Processor} - The Processor instance used
     *                       for this transformation.
     *
     * @example
     * for ( let plugin of result.processor.plugins) {
     *   if ( plugin.postcssPlugin === 'postcss-bad' ) {
     *     throw 'postcss-good is incompatible with postcss-bad';
     *   }
     * });
     */
    this.processor = processor;
    /**
     * @member {Message[]} - Contains messages from plugins
     *                       (e.g., warnings or custom messages).
     *                       Each message should have type
     *                       and plugin properties.
     *
     * @example
     * postcss.plugin('postcss-min-browser', () => {
     *   return (root, result) => {
     *     var browsers = detectMinBrowsersByCanIUse(root);
     *     result.messages.push({
     *       type:    'min-browser',
     *       plugin:  'postcss-min-browser',
     *       browsers: browsers
     *     });
     *   };
     * });
     */
    this.messages = [];
    /**
     * @member {Root} - Root node after all transformations.
     *
     * @example
     * root.toResult().root == root;
     */
    this.root = root;
    /**
     * @member {processOptions} - Options from the {@link Processor#process}
     *                            or {@link Root#toResult} call
     *                            that produced this Result instance.
     *
     * @example
     * root.toResult(opts).opts == opts;
     */
    this.opts = opts;
    /**
     * @member {string} - A CSS string representing of {@link Result#root}.
     *
     * @example
     * postcss.parse('a{}').toResult().css //=> "a{}"
     */
    this.css = undefined;
    /**
     * @member {SourceMapGenerator} - An instance of `SourceMapGenerator`
     *                                class from the `source-map` library,
     *                                representing changes
     *                                to the {@link Result#root} instance.
     *
     * @example
     * result.map.toJSON() //=> { version: 3, file: 'a.css', … }
     *
     * @example
     * if ( result.map ) {
     *   fs.writeFileSync(result.opts.to + '.map', result.map.toString());
     * }
     */
    this.map = undefined;
  }

  /**
   * Returns for @{link Result#css} content.
   *
   * @example
   * result + '' === result.css
   *
   * @return {string} string representing of {@link Result#root}
   */


  Result.prototype.toString = function toString() {
    return this.css;
  };

  /**
   * Creates an instance of {@link Warning} and adds it
   * to {@link Result#messages}.
   *
   * @param {string} text        - warning message
   * @param {Object} [opts]      - warning options
   * @param {Node}   opts.node   - CSS node that caused the warning
   * @param {string} opts.word   - word in CSS source that caused the warning
   * @param {number} opts.index  - index in CSS node string that caused
   *                               the warning
   * @param {string} opts.plugin - name of the plugin that created
   *                               this warning. {@link Result#warn} fills
   *                               this property automatically.
   *
   * @return {Warning} created warning
   */


  Result.prototype.warn = function warn(text) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (!opts.plugin) {
      if (this.lastPlugin && this.lastPlugin.postcssPlugin) {
        opts.plugin = this.lastPlugin.postcssPlugin;
      }
    }

    var warning = new _warning2.default(text, opts);
    this.messages.push(warning);

    return warning;
  };

  /**
   * Returns warnings from plugins. Filters {@link Warning} instances
   * from {@link Result#messages}.
   *
   * @example
   * result.warnings().forEach(warn => {
   *   console.warn(warn.toString());
   * });
   *
   * @return {Warning[]} warnings from plugins
   */


  Result.prototype.warnings = function warnings() {
    return this.messages.filter(function (i) {
      return i.type === 'warning';
    });
  };

  /**
   * An alias for the {@link Result#css} property.
   * Use it with syntaxes that generate non-CSS output.
   * @type {string}
   *
   * @example
   * result.css === result.content;
   */


  _createClass(Result, [{
    key: 'content',
    get: function get() {
      return this.css;
    }
  }]);

  return Result;
}();

exports.default = Result;

/**
 * @typedef  {object} Message
 * @property {string} type   - message type
 * @property {string} plugin - source PostCSS plugin name
 */

module.exports = exports['default'];


},{"./warning":47}],39:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _container = require('./container');

var _container2 = _interopRequireDefault(_container);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Represents a CSS file and contains all its parsed nodes.
 *
 * @extends Container
 *
 * @example
 * const root = postcss.parse('a{color:black} b{z-index:2}');
 * root.type         //=> 'root'
 * root.nodes.length //=> 2
 */
var Root = function (_Container) {
    _inherits(Root, _Container);

    function Root(defaults) {
        _classCallCheck(this, Root);

        var _this = _possibleConstructorReturn(this, _Container.call(this, defaults));

        _this.type = 'root';
        if (!_this.nodes) _this.nodes = [];
        return _this;
    }

    Root.prototype.removeChild = function removeChild(child, ignore) {
        var index = this.index(child);

        if (!ignore && index === 0 && this.nodes.length > 1) {
            this.nodes[1].raws.before = this.nodes[index].raws.before;
        }

        return _Container.prototype.removeChild.call(this, child);
    };

    Root.prototype.normalize = function normalize(child, sample, type) {
        var nodes = _Container.prototype.normalize.call(this, child);

        if (sample) {
            if (type === 'prepend') {
                if (this.nodes.length > 1) {
                    sample.raws.before = this.nodes[1].raws.before;
                } else {
                    delete sample.raws.before;
                }
            } else if (this.first !== sample) {
                for (var _iterator = nodes, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
                    var _ref;

                    if (_isArray) {
                        if (_i >= _iterator.length) break;
                        _ref = _iterator[_i++];
                    } else {
                        _i = _iterator.next();
                        if (_i.done) break;
                        _ref = _i.value;
                    }

                    var node = _ref;

                    node.raws.before = sample.raws.before;
                }
            }
        }

        return nodes;
    };

    /**
     * Returns a {@link Result} instance representing the root’s CSS.
     *
     * @param {processOptions} [opts] - options with only `to` and `map` keys
     *
     * @return {Result} result with current root’s CSS
     *
     * @example
     * const root1 = postcss.parse(css1, { from: 'a.css' });
     * const root2 = postcss.parse(css2, { from: 'b.css' });
     * root1.append(root2);
     * const result = root1.toResult({ to: 'all.css', map: true });
     */


    Root.prototype.toResult = function toResult() {
        var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        var LazyResult = require('./lazy-result');
        var Processor = require('./processor');

        var lazy = new LazyResult(new Processor(), this, opts);
        return lazy.stringify();
    };

    /**
     * @memberof Root#
     * @member {object} raws - Information to generate byte-to-byte equal
     *                         node string as it was in the origin input.
     *
     * Every parser saves its own properties,
     * but the default CSS parser uses:
     *
     * * `after`: the space symbols after the last child to the end of file.
     * * `semicolon`: is the last child has an (optional) semicolon.
     *
     * @example
     * postcss.parse('a {}\n').raws //=> { after: '\n' }
     * postcss.parse('a {}').raws   //=> { after: '' }
     */

    return Root;
}(_container2.default);

exports.default = Root;
module.exports = exports['default'];


},{"./container":25,"./lazy-result":29,"./processor":37}],40:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _container = require('./container');

var _container2 = _interopRequireDefault(_container);

var _list = require('./list');

var _list2 = _interopRequireDefault(_list);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Represents a CSS rule: a selector followed by a declaration block.
 *
 * @extends Container
 *
 * @example
 * const root = postcss.parse('a{}');
 * const rule = root.first;
 * rule.type       //=> 'rule'
 * rule.toString() //=> 'a{}'
 */
var Rule = function (_Container) {
  _inherits(Rule, _Container);

  function Rule(defaults) {
    _classCallCheck(this, Rule);

    var _this = _possibleConstructorReturn(this, _Container.call(this, defaults));

    _this.type = 'rule';
    if (!_this.nodes) _this.nodes = [];
    return _this;
  }

  /**
   * An array containing the rule’s individual selectors.
   * Groups of selectors are split at commas.
   *
   * @type {string[]}
   *
   * @example
   * const root = postcss.parse('a, b { }');
   * const rule = root.first;
   *
   * rule.selector  //=> 'a, b'
   * rule.selectors //=> ['a', 'b']
   *
   * rule.selectors = ['a', 'strong'];
   * rule.selector //=> 'a, strong'
   */


  _createClass(Rule, [{
    key: 'selectors',
    get: function get() {
      return _list2.default.comma(this.selector);
    },
    set: function set(values) {
      var match = this.selector ? this.selector.match(/,\s*/) : null;
      var sep = match ? match[0] : ',' + this.raw('between', 'beforeOpen');
      this.selector = values.join(sep);
    }

    /**
     * @memberof Rule#
     * @member {string} selector - the rule’s full selector represented
     *                             as a string
     *
     * @example
     * const root = postcss.parse('a, b { }');
     * const rule = root.first;
     * rule.selector //=> 'a, b'
     */

    /**
     * @memberof Rule#
     * @member {object} raws - Information to generate byte-to-byte equal
     *                         node string as it was in the origin input.
     *
     * Every parser saves its own properties,
     * but the default CSS parser uses:
     *
     * * `before`: the space symbols before the node. It also stores `*`
     *   and `_` symbols before the declaration (IE hack).
     * * `after`: the space symbols after the last child of the node
     *   to the end of the node.
     * * `between`: the symbols between the property and value
     *   for declarations, selector and `{` for rules, or last parameter
     *   and `{` for at-rules.
     * * `semicolon`: contains `true` if the last child has
     *   an (optional) semicolon.
     * * `ownSemicolon`: contains `true` if there is semicolon after rule.
     *
     * PostCSS cleans selectors from comments and extra spaces,
     * but it stores origin content in raws properties.
     * As such, if you don’t change a declaration’s value,
     * PostCSS will use the raw value with comments.
     *
     * @example
     * const root = postcss.parse('a {\n  color:black\n}')
     * root.first.first.raws //=> { before: '', between: ' ', after: '\n' }
     */

  }]);

  return Rule;
}(_container2.default);

exports.default = Rule;
module.exports = exports['default'];


},{"./container":25,"./list":30}],41:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var defaultRaw = {
    colon: ': ',
    indent: '    ',
    beforeDecl: '\n',
    beforeRule: '\n',
    beforeOpen: ' ',
    beforeClose: '\n',
    beforeComment: '\n',
    after: '\n',
    emptyBody: '',
    commentLeft: ' ',
    commentRight: ' '
};

function capitalize(str) {
    return str[0].toUpperCase() + str.slice(1);
}

var Stringifier = function () {
    function Stringifier(builder) {
        _classCallCheck(this, Stringifier);

        this.builder = builder;
    }

    Stringifier.prototype.stringify = function stringify(node, semicolon) {
        this[node.type](node, semicolon);
    };

    Stringifier.prototype.root = function root(node) {
        this.body(node);
        if (node.raws.after) this.builder(node.raws.after);
    };

    Stringifier.prototype.comment = function comment(node) {
        var left = this.raw(node, 'left', 'commentLeft');
        var right = this.raw(node, 'right', 'commentRight');
        this.builder('/*' + left + node.text + right + '*/', node);
    };

    Stringifier.prototype.decl = function decl(node, semicolon) {
        var between = this.raw(node, 'between', 'colon');
        var string = node.prop + between + this.rawValue(node, 'value');

        if (node.important) {
            string += node.raws.important || ' !important';
        }

        if (semicolon) string += ';';
        this.builder(string, node);
    };

    Stringifier.prototype.rule = function rule(node) {
        this.block(node, this.rawValue(node, 'selector'));
        if (node.raws.ownSemicolon) {
            this.builder(node.raws.ownSemicolon, node, 'end');
        }
    };

    Stringifier.prototype.atrule = function atrule(node, semicolon) {
        var name = '@' + node.name;
        var params = node.params ? this.rawValue(node, 'params') : '';

        if (typeof node.raws.afterName !== 'undefined') {
            name += node.raws.afterName;
        } else if (params) {
            name += ' ';
        }

        if (node.nodes) {
            this.block(node, name + params);
        } else {
            var end = (node.raws.between || '') + (semicolon ? ';' : '');
            this.builder(name + params + end, node);
        }
    };

    Stringifier.prototype.body = function body(node) {
        var last = node.nodes.length - 1;
        while (last > 0) {
            if (node.nodes[last].type !== 'comment') break;
            last -= 1;
        }

        var semicolon = this.raw(node, 'semicolon');
        for (var i = 0; i < node.nodes.length; i++) {
            var child = node.nodes[i];
            var before = this.raw(child, 'before');
            if (before) this.builder(before);
            this.stringify(child, last !== i || semicolon);
        }
    };

    Stringifier.prototype.block = function block(node, start) {
        var between = this.raw(node, 'between', 'beforeOpen');
        this.builder(start + between + '{', node, 'start');

        var after = void 0;
        if (node.nodes && node.nodes.length) {
            this.body(node);
            after = this.raw(node, 'after');
        } else {
            after = this.raw(node, 'after', 'emptyBody');
        }

        if (after) this.builder(after);
        this.builder('}', node, 'end');
    };

    Stringifier.prototype.raw = function raw(node, own, detect) {
        var value = void 0;
        if (!detect) detect = own;

        // Already had
        if (own) {
            value = node.raws[own];
            if (typeof value !== 'undefined') return value;
        }

        var parent = node.parent;

        // Hack for first rule in CSS
        if (detect === 'before') {
            if (!parent || parent.type === 'root' && parent.first === node) {
                return '';
            }
        }

        // Floating child without parent
        if (!parent) return defaultRaw[detect];

        // Detect style by other nodes
        var root = node.root();
        if (!root.rawCache) root.rawCache = {};
        if (typeof root.rawCache[detect] !== 'undefined') {
            return root.rawCache[detect];
        }

        if (detect === 'before' || detect === 'after') {
            return this.beforeAfter(node, detect);
        } else {
            var method = 'raw' + capitalize(detect);
            if (this[method]) {
                value = this[method](root, node);
            } else {
                root.walk(function (i) {
                    value = i.raws[own];
                    if (typeof value !== 'undefined') return false;
                });
            }
        }

        if (typeof value === 'undefined') value = defaultRaw[detect];

        root.rawCache[detect] = value;
        return value;
    };

    Stringifier.prototype.rawSemicolon = function rawSemicolon(root) {
        var value = void 0;
        root.walk(function (i) {
            if (i.nodes && i.nodes.length && i.last.type === 'decl') {
                value = i.raws.semicolon;
                if (typeof value !== 'undefined') return false;
            }
        });
        return value;
    };

    Stringifier.prototype.rawEmptyBody = function rawEmptyBody(root) {
        var value = void 0;
        root.walk(function (i) {
            if (i.nodes && i.nodes.length === 0) {
                value = i.raws.after;
                if (typeof value !== 'undefined') return false;
            }
        });
        return value;
    };

    Stringifier.prototype.rawIndent = function rawIndent(root) {
        if (root.raws.indent) return root.raws.indent;
        var value = void 0;
        root.walk(function (i) {
            var p = i.parent;
            if (p && p !== root && p.parent && p.parent === root) {
                if (typeof i.raws.before !== 'undefined') {
                    var parts = i.raws.before.split('\n');
                    value = parts[parts.length - 1];
                    value = value.replace(/[^\s]/g, '');
                    return false;
                }
            }
        });
        return value;
    };

    Stringifier.prototype.rawBeforeComment = function rawBeforeComment(root, node) {
        var value = void 0;
        root.walkComments(function (i) {
            if (typeof i.raws.before !== 'undefined') {
                value = i.raws.before;
                if (value.indexOf('\n') !== -1) {
                    value = value.replace(/[^\n]+$/, '');
                }
                return false;
            }
        });
        if (typeof value === 'undefined') {
            value = this.raw(node, null, 'beforeDecl');
        } else if (value) {
            value = value.replace(/[^\s]/g, '');
        }
        return value;
    };

    Stringifier.prototype.rawBeforeDecl = function rawBeforeDecl(root, node) {
        var value = void 0;
        root.walkDecls(function (i) {
            if (typeof i.raws.before !== 'undefined') {
                value = i.raws.before;
                if (value.indexOf('\n') !== -1) {
                    value = value.replace(/[^\n]+$/, '');
                }
                return false;
            }
        });
        if (typeof value === 'undefined') {
            value = this.raw(node, null, 'beforeRule');
        } else if (value) {
            value = value.replace(/[^\s]/g, '');
        }
        return value;
    };

    Stringifier.prototype.rawBeforeRule = function rawBeforeRule(root) {
        var value = void 0;
        root.walk(function (i) {
            if (i.nodes && (i.parent !== root || root.first !== i)) {
                if (typeof i.raws.before !== 'undefined') {
                    value = i.raws.before;
                    if (value.indexOf('\n') !== -1) {
                        value = value.replace(/[^\n]+$/, '');
                    }
                    return false;
                }
            }
        });
        if (value) value = value.replace(/[^\s]/g, '');
        return value;
    };

    Stringifier.prototype.rawBeforeClose = function rawBeforeClose(root) {
        var value = void 0;
        root.walk(function (i) {
            if (i.nodes && i.nodes.length > 0) {
                if (typeof i.raws.after !== 'undefined') {
                    value = i.raws.after;
                    if (value.indexOf('\n') !== -1) {
                        value = value.replace(/[^\n]+$/, '');
                    }
                    return false;
                }
            }
        });
        if (value) value = value.replace(/[^\s]/g, '');
        return value;
    };

    Stringifier.prototype.rawBeforeOpen = function rawBeforeOpen(root) {
        var value = void 0;
        root.walk(function (i) {
            if (i.type !== 'decl') {
                value = i.raws.between;
                if (typeof value !== 'undefined') return false;
            }
        });
        return value;
    };

    Stringifier.prototype.rawColon = function rawColon(root) {
        var value = void 0;
        root.walkDecls(function (i) {
            if (typeof i.raws.between !== 'undefined') {
                value = i.raws.between.replace(/[^\s:]/g, '');
                return false;
            }
        });
        return value;
    };

    Stringifier.prototype.beforeAfter = function beforeAfter(node, detect) {
        var value = void 0;
        if (node.type === 'decl') {
            value = this.raw(node, null, 'beforeDecl');
        } else if (node.type === 'comment') {
            value = this.raw(node, null, 'beforeComment');
        } else if (detect === 'before') {
            value = this.raw(node, null, 'beforeRule');
        } else {
            value = this.raw(node, null, 'beforeClose');
        }

        var buf = node.parent;
        var depth = 0;
        while (buf && buf.type !== 'root') {
            depth += 1;
            buf = buf.parent;
        }

        if (value.indexOf('\n') !== -1) {
            var indent = this.raw(node, null, 'indent');
            if (indent.length) {
                for (var step = 0; step < depth; step++) {
                    value += indent;
                }
            }
        }

        return value;
    };

    Stringifier.prototype.rawValue = function rawValue(node, prop) {
        var value = node[prop];
        var raw = node.raws[prop];
        if (raw && raw.value === value) {
            return raw.raw;
        } else {
            return value;
        }
    };

    return Stringifier;
}();

exports.default = Stringifier;
module.exports = exports['default'];


},{}],42:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.default = stringify;

var _stringifier = require('./stringifier');

var _stringifier2 = _interopRequireDefault(_stringifier);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function stringify(node, builder) {
    var str = new _stringifier2.default(builder);
    str.stringify(node);
}
module.exports = exports['default'];


},{"./stringifier":41}],43:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _tokenize = require('./tokenize');

var _tokenize2 = _interopRequireDefault(_tokenize);

var _input = require('./input');

var _input2 = _interopRequireDefault(_input);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var HIGHLIGHT_THEME = {
    'brackets': _chalk2.default.cyan,
    'at-word': _chalk2.default.cyan,
    'call': _chalk2.default.cyan,
    'comment': _chalk2.default.gray,
    'string': _chalk2.default.green,
    'class': _chalk2.default.yellow,
    'hash': _chalk2.default.magenta,
    '(': _chalk2.default.cyan,
    ')': _chalk2.default.cyan,
    '{': _chalk2.default.yellow,
    '}': _chalk2.default.yellow,
    '[': _chalk2.default.yellow,
    ']': _chalk2.default.yellow,
    ':': _chalk2.default.yellow,
    ';': _chalk2.default.yellow
};

function getTokenType(_ref, processor) {
    var type = _ref[0],
        value = _ref[1];

    if (type === 'word') {
        if (value[0] === '.') {
            return 'class';
        }
        if (value[0] === '#') {
            return 'hash';
        }
    }

    if (!processor.endOfFile()) {
        var next = processor.nextToken();
        processor.back(next);
        if (next[0] === 'brackets' || next[0] === '(') return 'call';
    }

    return type;
}

function terminalHighlight(css) {
    var processor = (0, _tokenize2.default)(new _input2.default(css), { ignoreErrors: true });
    var result = '';

    var _loop = function _loop() {
        var token = processor.nextToken();
        var color = HIGHLIGHT_THEME[getTokenType(token, processor)];
        if (color) {
            result += token[1].split(/\r?\n/).map(function (i) {
                return color(i);
            }).join('\n');
        } else {
            result += token[1];
        }
    };

    while (!processor.endOfFile()) {
        _loop();
    }
    return result;
}

exports.default = terminalHighlight;
module.exports = exports['default'];


},{"./input":28,"./tokenize":44,"chalk":10}],44:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.default = tokenizer;
var SINGLE_QUOTE = 39;
var DOUBLE_QUOTE = 34;
var BACKSLASH = 92;
var SLASH = 47;
var NEWLINE = 10;
var SPACE = 32;
var FEED = 12;
var TAB = 9;
var CR = 13;
var OPEN_SQUARE = 91;
var CLOSE_SQUARE = 93;
var OPEN_PARENTHESES = 40;
var CLOSE_PARENTHESES = 41;
var OPEN_CURLY = 123;
var CLOSE_CURLY = 125;
var SEMICOLON = 59;
var ASTERISK = 42;
var COLON = 58;
var AT = 64;

var RE_AT_END = /[ \n\t\r\f\{\(\)'"\\;/\[\]#]/g;
var RE_WORD_END = /[ \n\t\r\f\(\)\{\}:;@!'"\\\]\[#]|\/(?=\*)/g;
var RE_BAD_BRACKET = /.[\\\/\("'\n]/;
var RE_HEX_ESCAPE = /[a-f0-9]/i;

function tokenizer(input) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var css = input.css.valueOf();
    var ignore = options.ignoreErrors;

    var code = void 0,
        next = void 0,
        quote = void 0,
        lines = void 0,
        last = void 0,
        content = void 0,
        escape = void 0,
        nextLine = void 0,
        nextOffset = void 0,
        escaped = void 0,
        escapePos = void 0,
        prev = void 0,
        n = void 0,
        currentToken = void 0;

    var length = css.length;
    var offset = -1;
    var line = 1;
    var pos = 0;
    var buffer = [];
    var returned = [];

    function unclosed(what) {
        throw input.error('Unclosed ' + what, line, pos - offset);
    }

    function endOfFile() {
        return returned.length === 0 && pos >= length;
    }

    function nextToken() {
        if (returned.length) return returned.pop();
        if (pos >= length) return;

        code = css.charCodeAt(pos);
        if (code === NEWLINE || code === FEED || code === CR && css.charCodeAt(pos + 1) !== NEWLINE) {
            offset = pos;
            line += 1;
        }

        switch (code) {
            case NEWLINE:
            case SPACE:
            case TAB:
            case CR:
            case FEED:
                next = pos;
                do {
                    next += 1;
                    code = css.charCodeAt(next);
                    if (code === NEWLINE) {
                        offset = next;
                        line += 1;
                    }
                } while (code === SPACE || code === NEWLINE || code === TAB || code === CR || code === FEED);

                currentToken = ['space', css.slice(pos, next)];
                pos = next - 1;
                break;

            case OPEN_SQUARE:
                currentToken = ['[', '[', line, pos - offset];
                break;

            case CLOSE_SQUARE:
                currentToken = [']', ']', line, pos - offset];
                break;

            case OPEN_CURLY:
                currentToken = ['{', '{', line, pos - offset];
                break;

            case CLOSE_CURLY:
                currentToken = ['}', '}', line, pos - offset];
                break;

            case COLON:
                currentToken = [':', ':', line, pos - offset];
                break;

            case SEMICOLON:
                currentToken = [';', ';', line, pos - offset];
                break;

            case OPEN_PARENTHESES:
                prev = buffer.length ? buffer.pop()[1] : '';
                n = css.charCodeAt(pos + 1);
                if (prev === 'url' && n !== SINGLE_QUOTE && n !== DOUBLE_QUOTE && n !== SPACE && n !== NEWLINE && n !== TAB && n !== FEED && n !== CR) {
                    next = pos;
                    do {
                        escaped = false;
                        next = css.indexOf(')', next + 1);
                        if (next === -1) {
                            if (ignore) {
                                next = pos;
                                break;
                            } else {
                                unclosed('bracket');
                            }
                        }
                        escapePos = next;
                        while (css.charCodeAt(escapePos - 1) === BACKSLASH) {
                            escapePos -= 1;
                            escaped = !escaped;
                        }
                    } while (escaped);

                    currentToken = ['brackets', css.slice(pos, next + 1), line, pos - offset, line, next - offset];

                    pos = next;
                } else {
                    next = css.indexOf(')', pos + 1);
                    content = css.slice(pos, next + 1);

                    if (next === -1 || RE_BAD_BRACKET.test(content)) {
                        currentToken = ['(', '(', line, pos - offset];
                    } else {
                        currentToken = ['brackets', content, line, pos - offset, line, next - offset];
                        pos = next;
                    }
                }

                break;

            case CLOSE_PARENTHESES:
                currentToken = [')', ')', line, pos - offset];
                break;

            case SINGLE_QUOTE:
            case DOUBLE_QUOTE:
                quote = code === SINGLE_QUOTE ? '\'' : '"';
                next = pos;
                do {
                    escaped = false;
                    next = css.indexOf(quote, next + 1);
                    if (next === -1) {
                        if (ignore) {
                            next = pos + 1;
                            break;
                        } else {
                            unclosed('string');
                        }
                    }
                    escapePos = next;
                    while (css.charCodeAt(escapePos - 1) === BACKSLASH) {
                        escapePos -= 1;
                        escaped = !escaped;
                    }
                } while (escaped);

                content = css.slice(pos, next + 1);
                lines = content.split('\n');
                last = lines.length - 1;

                if (last > 0) {
                    nextLine = line + last;
                    nextOffset = next - lines[last].length;
                } else {
                    nextLine = line;
                    nextOffset = offset;
                }

                currentToken = ['string', css.slice(pos, next + 1), line, pos - offset, nextLine, next - nextOffset];

                offset = nextOffset;
                line = nextLine;
                pos = next;
                break;

            case AT:
                RE_AT_END.lastIndex = pos + 1;
                RE_AT_END.test(css);
                if (RE_AT_END.lastIndex === 0) {
                    next = css.length - 1;
                } else {
                    next = RE_AT_END.lastIndex - 2;
                }

                currentToken = ['at-word', css.slice(pos, next + 1), line, pos - offset, line, next - offset];

                pos = next;
                break;

            case BACKSLASH:
                next = pos;
                escape = true;
                while (css.charCodeAt(next + 1) === BACKSLASH) {
                    next += 1;
                    escape = !escape;
                }
                code = css.charCodeAt(next + 1);
                if (escape && code !== SLASH && code !== SPACE && code !== NEWLINE && code !== TAB && code !== CR && code !== FEED) {
                    next += 1;
                    if (RE_HEX_ESCAPE.test(css.charAt(next))) {
                        while (RE_HEX_ESCAPE.test(css.charAt(next + 1))) {
                            next += 1;
                        }
                        if (css.charCodeAt(next + 1) === SPACE) {
                            next += 1;
                        }
                    }
                }

                currentToken = ['word', css.slice(pos, next + 1), line, pos - offset, line, next - offset];

                pos = next;
                break;

            default:
                if (code === SLASH && css.charCodeAt(pos + 1) === ASTERISK) {
                    next = css.indexOf('*/', pos + 2) + 1;
                    if (next === 0) {
                        if (ignore) {
                            next = css.length;
                        } else {
                            unclosed('comment');
                        }
                    }

                    content = css.slice(pos, next + 1);
                    lines = content.split('\n');
                    last = lines.length - 1;

                    if (last > 0) {
                        nextLine = line + last;
                        nextOffset = next - lines[last].length;
                    } else {
                        nextLine = line;
                        nextOffset = offset;
                    }

                    currentToken = ['comment', content, line, pos - offset, nextLine, next - nextOffset];

                    offset = nextOffset;
                    line = nextLine;
                    pos = next;
                } else {
                    RE_WORD_END.lastIndex = pos + 1;
                    RE_WORD_END.test(css);
                    if (RE_WORD_END.lastIndex === 0) {
                        next = css.length - 1;
                    } else {
                        next = RE_WORD_END.lastIndex - 2;
                    }

                    currentToken = ['word', css.slice(pos, next + 1), line, pos - offset, line, next - offset];

                    buffer.push(currentToken);

                    pos = next;
                }

                break;
        }

        pos++;
        return currentToken;
    }

    function back(token) {
        returned.push(token);
    }

    return {
        back: back,
        nextToken: nextToken,
        endOfFile: endOfFile
    };
}
module.exports = exports['default'];


},{}],45:[function(require,module,exports){
'use strict';

exports.__esModule = true;
/**
 * Contains helpers for working with vendor prefixes.
 *
 * @example
 * const vendor = postcss.vendor;
 *
 * @namespace vendor
 */
var vendor = {

    /**
     * Returns the vendor prefix extracted from an input string.
     *
     * @param {string} prop - string with or without vendor prefix
     *
     * @return {string} vendor prefix or empty string
     *
     * @example
     * postcss.vendor.prefix('-moz-tab-size') //=> '-moz-'
     * postcss.vendor.prefix('tab-size')      //=> ''
     */
    prefix: function prefix(prop) {
        var match = prop.match(/^(-\w+-)/);
        if (match) {
            return match[0];
        } else {
            return '';
        }
    },


    /**
     * Returns the input string stripped of its vendor prefix.
     *
     * @param {string} prop - string with or without vendor prefix
     *
     * @return {string} string name without vendor prefixes
     *
     * @example
     * postcss.vendor.unprefixed('-moz-tab-size') //=> 'tab-size'
     */
    unprefixed: function unprefixed(prop) {
        return prop.replace(/^-\w+-/, '');
    }
};

exports.default = vendor;
module.exports = exports['default'];


},{}],46:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.default = warnOnce;
var printed = {};

function warnOnce(message) {
    if (printed[message]) return;
    printed[message] = true;

    if (typeof console !== 'undefined' && console.warn) console.warn(message);
}
module.exports = exports['default'];


},{}],47:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Represents a plugin’s warning. It can be created using {@link Node#warn}.
 *
 * @example
 * if ( decl.important ) {
 *     decl.warn(result, 'Avoid !important', { word: '!important' });
 * }
 */
var Warning = function () {

  /**
   * @param {string} text        - warning message
   * @param {Object} [opts]      - warning options
   * @param {Node}   opts.node   - CSS node that caused the warning
   * @param {string} opts.word   - word in CSS source that caused the warning
   * @param {number} opts.index  - index in CSS node string that caused
   *                               the warning
   * @param {string} opts.plugin - name of the plugin that created
   *                               this warning. {@link Result#warn} fills
   *                               this property automatically.
   */
  function Warning(text) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Warning);

    /**
     * @member {string} - Type to filter warnings from
     *                    {@link Result#messages}. Always equal
     *                    to `"warning"`.
     *
     * @example
     * const nonWarning = result.messages.filter(i => i.type !== 'warning')
     */
    this.type = 'warning';
    /**
     * @member {string} - The warning message.
     *
     * @example
     * warning.text //=> 'Try to avoid !important'
     */
    this.text = text;

    if (opts.node && opts.node.source) {
      var pos = opts.node.positionBy(opts);
      /**
       * @member {number} - Line in the input file
       *                    with this warning’s source
       *
       * @example
       * warning.line //=> 5
       */
      this.line = pos.line;
      /**
       * @member {number} - Column in the input file
       *                    with this warning’s source.
       *
       * @example
       * warning.column //=> 6
       */
      this.column = pos.column;
    }

    for (var opt in opts) {
      this[opt] = opts[opt];
    }
  }

  /**
   * Returns a warning position and message.
   *
   * @example
   * warning.toString() //=> 'postcss-lint:a.css:10:14: Avoid !important'
   *
   * @return {string} warning position and message
   */


  Warning.prototype.toString = function toString() {
    if (this.node) {
      return this.node.error(this.text, {
        plugin: this.plugin,
        index: this.index,
        word: this.word
      }).message;
    } else if (this.plugin) {
      return this.plugin + ': ' + this.text;
    } else {
      return this.text;
    }
  };

  /**
   * @memberof Warning#
   * @member {string} plugin - The name of the plugin that created
   *                           it will fill this property automatically.
   *                           this warning. When you call {@link Node#warn}
   *
   * @example
   * warning.plugin //=> 'postcss-important'
   */

  /**
   * @memberof Warning#
   * @member {Node} node - Contains the CSS node that caused the warning.
   *
   * @example
   * warning.node.toString() //=> 'color: white !important'
   */

  return Warning;
}();

exports.default = Warning;
module.exports = exports['default'];


},{}],48:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var util = require('./util');
var has = Object.prototype.hasOwnProperty;
var hasNativeMap = typeof Map !== "undefined";

/**
 * A data structure which is a combination of an array and a set. Adding a new
 * member is O(1), testing for membership is O(1), and finding the index of an
 * element is O(1). Removing elements from the set is not supported. Only
 * strings are supported for membership.
 */
function ArraySet() {
  this._array = [];
  this._set = hasNativeMap ? new Map() : Object.create(null);
}

/**
 * Static method for creating ArraySet instances from an existing array.
 */
ArraySet.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
  var set = new ArraySet();
  for (var i = 0, len = aArray.length; i < len; i++) {
    set.add(aArray[i], aAllowDuplicates);
  }
  return set;
};

/**
 * Return how many unique items are in this ArraySet. If duplicates have been
 * added, than those do not count towards the size.
 *
 * @returns Number
 */
ArraySet.prototype.size = function ArraySet_size() {
  return hasNativeMap ? this._set.size : Object.getOwnPropertyNames(this._set).length;
};

/**
 * Add the given string to this set.
 *
 * @param String aStr
 */
ArraySet.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
  var sStr = hasNativeMap ? aStr : util.toSetString(aStr);
  var isDuplicate = hasNativeMap ? this.has(aStr) : has.call(this._set, sStr);
  var idx = this._array.length;
  if (!isDuplicate || aAllowDuplicates) {
    this._array.push(aStr);
  }
  if (!isDuplicate) {
    if (hasNativeMap) {
      this._set.set(aStr, idx);
    } else {
      this._set[sStr] = idx;
    }
  }
};

/**
 * Is the given string a member of this set?
 *
 * @param String aStr
 */
ArraySet.prototype.has = function ArraySet_has(aStr) {
  if (hasNativeMap) {
    return this._set.has(aStr);
  } else {
    var sStr = util.toSetString(aStr);
    return has.call(this._set, sStr);
  }
};

/**
 * What is the index of the given string in the array?
 *
 * @param String aStr
 */
ArraySet.prototype.indexOf = function ArraySet_indexOf(aStr) {
  if (hasNativeMap) {
    var idx = this._set.get(aStr);
    if (idx >= 0) {
        return idx;
    }
  } else {
    var sStr = util.toSetString(aStr);
    if (has.call(this._set, sStr)) {
      return this._set[sStr];
    }
  }

  throw new Error('"' + aStr + '" is not in the set.');
};

/**
 * What is the element at the given index?
 *
 * @param Number aIdx
 */
ArraySet.prototype.at = function ArraySet_at(aIdx) {
  if (aIdx >= 0 && aIdx < this._array.length) {
    return this._array[aIdx];
  }
  throw new Error('No element indexed by ' + aIdx);
};

/**
 * Returns the array representation of this set (which has the proper indices
 * indicated by indexOf). Note that this is a copy of the internal array used
 * for storing the members so that no one can mess with internal state.
 */
ArraySet.prototype.toArray = function ArraySet_toArray() {
  return this._array.slice();
};

exports.ArraySet = ArraySet;

},{"./util":57}],49:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 *
 * Based on the Base 64 VLQ implementation in Closure Compiler:
 * https://code.google.com/p/closure-compiler/source/browse/trunk/src/com/google/debugging/sourcemap/Base64VLQ.java
 *
 * Copyright 2011 The Closure Compiler Authors. All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *  * Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above
 *    copyright notice, this list of conditions and the following
 *    disclaimer in the documentation and/or other materials provided
 *    with the distribution.
 *  * Neither the name of Google Inc. nor the names of its
 *    contributors may be used to endorse or promote products derived
 *    from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

var base64 = require('./base64');

// A single base 64 digit can contain 6 bits of data. For the base 64 variable
// length quantities we use in the source map spec, the first bit is the sign,
// the next four bits are the actual value, and the 6th bit is the
// continuation bit. The continuation bit tells us whether there are more
// digits in this value following this digit.
//
//   Continuation
//   |    Sign
//   |    |
//   V    V
//   101011

var VLQ_BASE_SHIFT = 5;

// binary: 100000
var VLQ_BASE = 1 << VLQ_BASE_SHIFT;

// binary: 011111
var VLQ_BASE_MASK = VLQ_BASE - 1;

// binary: 100000
var VLQ_CONTINUATION_BIT = VLQ_BASE;

/**
 * Converts from a two-complement value to a value where the sign bit is
 * placed in the least significant bit.  For example, as decimals:
 *   1 becomes 2 (10 binary), -1 becomes 3 (11 binary)
 *   2 becomes 4 (100 binary), -2 becomes 5 (101 binary)
 */
function toVLQSigned(aValue) {
  return aValue < 0
    ? ((-aValue) << 1) + 1
    : (aValue << 1) + 0;
}

/**
 * Converts to a two-complement value from a value where the sign bit is
 * placed in the least significant bit.  For example, as decimals:
 *   2 (10 binary) becomes 1, 3 (11 binary) becomes -1
 *   4 (100 binary) becomes 2, 5 (101 binary) becomes -2
 */
function fromVLQSigned(aValue) {
  var isNegative = (aValue & 1) === 1;
  var shifted = aValue >> 1;
  return isNegative
    ? -shifted
    : shifted;
}

/**
 * Returns the base 64 VLQ encoded value.
 */
exports.encode = function base64VLQ_encode(aValue) {
  var encoded = "";
  var digit;

  var vlq = toVLQSigned(aValue);

  do {
    digit = vlq & VLQ_BASE_MASK;
    vlq >>>= VLQ_BASE_SHIFT;
    if (vlq > 0) {
      // There are still more digits in this value, so we must make sure the
      // continuation bit is marked.
      digit |= VLQ_CONTINUATION_BIT;
    }
    encoded += base64.encode(digit);
  } while (vlq > 0);

  return encoded;
};

/**
 * Decodes the next base 64 VLQ value from the given string and returns the
 * value and the rest of the string via the out parameter.
 */
exports.decode = function base64VLQ_decode(aStr, aIndex, aOutParam) {
  var strLen = aStr.length;
  var result = 0;
  var shift = 0;
  var continuation, digit;

  do {
    if (aIndex >= strLen) {
      throw new Error("Expected more digits in base 64 VLQ value.");
    }

    digit = base64.decode(aStr.charCodeAt(aIndex++));
    if (digit === -1) {
      throw new Error("Invalid base64 digit: " + aStr.charAt(aIndex - 1));
    }

    continuation = !!(digit & VLQ_CONTINUATION_BIT);
    digit &= VLQ_BASE_MASK;
    result = result + (digit << shift);
    shift += VLQ_BASE_SHIFT;
  } while (continuation);

  aOutParam.value = fromVLQSigned(result);
  aOutParam.rest = aIndex;
};

},{"./base64":50}],50:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var intToCharMap = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');

/**
 * Encode an integer in the range of 0 to 63 to a single base 64 digit.
 */
exports.encode = function (number) {
  if (0 <= number && number < intToCharMap.length) {
    return intToCharMap[number];
  }
  throw new TypeError("Must be between 0 and 63: " + number);
};

/**
 * Decode a single base 64 character code digit to an integer. Returns -1 on
 * failure.
 */
exports.decode = function (charCode) {
  var bigA = 65;     // 'A'
  var bigZ = 90;     // 'Z'

  var littleA = 97;  // 'a'
  var littleZ = 122; // 'z'

  var zero = 48;     // '0'
  var nine = 57;     // '9'

  var plus = 43;     // '+'
  var slash = 47;    // '/'

  var littleOffset = 26;
  var numberOffset = 52;

  // 0 - 25: ABCDEFGHIJKLMNOPQRSTUVWXYZ
  if (bigA <= charCode && charCode <= bigZ) {
    return (charCode - bigA);
  }

  // 26 - 51: abcdefghijklmnopqrstuvwxyz
  if (littleA <= charCode && charCode <= littleZ) {
    return (charCode - littleA + littleOffset);
  }

  // 52 - 61: 0123456789
  if (zero <= charCode && charCode <= nine) {
    return (charCode - zero + numberOffset);
  }

  // 62: +
  if (charCode == plus) {
    return 62;
  }

  // 63: /
  if (charCode == slash) {
    return 63;
  }

  // Invalid base64 digit.
  return -1;
};

},{}],51:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

exports.GREATEST_LOWER_BOUND = 1;
exports.LEAST_UPPER_BOUND = 2;

/**
 * Recursive implementation of binary search.
 *
 * @param aLow Indices here and lower do not contain the needle.
 * @param aHigh Indices here and higher do not contain the needle.
 * @param aNeedle The element being searched for.
 * @param aHaystack The non-empty array being searched.
 * @param aCompare Function which takes two elements and returns -1, 0, or 1.
 * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
 *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 */
function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare, aBias) {
  // This function terminates when one of the following is true:
  //
  //   1. We find the exact element we are looking for.
  //
  //   2. We did not find the exact element, but we can return the index of
  //      the next-closest element.
  //
  //   3. We did not find the exact element, and there is no next-closest
  //      element than the one we are searching for, so we return -1.
  var mid = Math.floor((aHigh - aLow) / 2) + aLow;
  var cmp = aCompare(aNeedle, aHaystack[mid], true);
  if (cmp === 0) {
    // Found the element we are looking for.
    return mid;
  }
  else if (cmp > 0) {
    // Our needle is greater than aHaystack[mid].
    if (aHigh - mid > 1) {
      // The element is in the upper half.
      return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare, aBias);
    }

    // The exact needle element was not found in this haystack. Determine if
    // we are in termination case (3) or (2) and return the appropriate thing.
    if (aBias == exports.LEAST_UPPER_BOUND) {
      return aHigh < aHaystack.length ? aHigh : -1;
    } else {
      return mid;
    }
  }
  else {
    // Our needle is less than aHaystack[mid].
    if (mid - aLow > 1) {
      // The element is in the lower half.
      return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare, aBias);
    }

    // we are in termination case (3) or (2) and return the appropriate thing.
    if (aBias == exports.LEAST_UPPER_BOUND) {
      return mid;
    } else {
      return aLow < 0 ? -1 : aLow;
    }
  }
}

/**
 * This is an implementation of binary search which will always try and return
 * the index of the closest element if there is no exact hit. This is because
 * mappings between original and generated line/col pairs are single points,
 * and there is an implicit region between each of them, so a miss just means
 * that you aren't on the very start of a region.
 *
 * @param aNeedle The element you are looking for.
 * @param aHaystack The array that is being searched.
 * @param aCompare A function which takes the needle and an element in the
 *     array and returns -1, 0, or 1 depending on whether the needle is less
 *     than, equal to, or greater than the element, respectively.
 * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
 *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'binarySearch.GREATEST_LOWER_BOUND'.
 */
exports.search = function search(aNeedle, aHaystack, aCompare, aBias) {
  if (aHaystack.length === 0) {
    return -1;
  }

  var index = recursiveSearch(-1, aHaystack.length, aNeedle, aHaystack,
                              aCompare, aBias || exports.GREATEST_LOWER_BOUND);
  if (index < 0) {
    return -1;
  }

  // We have found either the exact element, or the next-closest element than
  // the one we are searching for. However, there may be more than one such
  // element. Make sure we always return the smallest of these.
  while (index - 1 >= 0) {
    if (aCompare(aHaystack[index], aHaystack[index - 1], true) !== 0) {
      break;
    }
    --index;
  }

  return index;
};

},{}],52:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2014 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var util = require('./util');

/**
 * Determine whether mappingB is after mappingA with respect to generated
 * position.
 */
function generatedPositionAfter(mappingA, mappingB) {
  // Optimized for most common case
  var lineA = mappingA.generatedLine;
  var lineB = mappingB.generatedLine;
  var columnA = mappingA.generatedColumn;
  var columnB = mappingB.generatedColumn;
  return lineB > lineA || lineB == lineA && columnB >= columnA ||
         util.compareByGeneratedPositionsInflated(mappingA, mappingB) <= 0;
}

/**
 * A data structure to provide a sorted view of accumulated mappings in a
 * performance conscious manner. It trades a neglibable overhead in general
 * case for a large speedup in case of mappings being added in order.
 */
function MappingList() {
  this._array = [];
  this._sorted = true;
  // Serves as infimum
  this._last = {generatedLine: -1, generatedColumn: 0};
}

/**
 * Iterate through internal items. This method takes the same arguments that
 * `Array.prototype.forEach` takes.
 *
 * NOTE: The order of the mappings is NOT guaranteed.
 */
MappingList.prototype.unsortedForEach =
  function MappingList_forEach(aCallback, aThisArg) {
    this._array.forEach(aCallback, aThisArg);
  };

/**
 * Add the given source mapping.
 *
 * @param Object aMapping
 */
MappingList.prototype.add = function MappingList_add(aMapping) {
  if (generatedPositionAfter(this._last, aMapping)) {
    this._last = aMapping;
    this._array.push(aMapping);
  } else {
    this._sorted = false;
    this._array.push(aMapping);
  }
};

/**
 * Returns the flat, sorted array of mappings. The mappings are sorted by
 * generated position.
 *
 * WARNING: This method returns internal data without copying, for
 * performance. The return value must NOT be mutated, and should be treated as
 * an immutable borrow. If you want to take ownership, you must make your own
 * copy.
 */
MappingList.prototype.toArray = function MappingList_toArray() {
  if (!this._sorted) {
    this._array.sort(util.compareByGeneratedPositionsInflated);
    this._sorted = true;
  }
  return this._array;
};

exports.MappingList = MappingList;

},{"./util":57}],53:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

// It turns out that some (most?) JavaScript engines don't self-host
// `Array.prototype.sort`. This makes sense because C++ will likely remain
// faster than JS when doing raw CPU-intensive sorting. However, when using a
// custom comparator function, calling back and forth between the VM's C++ and
// JIT'd JS is rather slow *and* loses JIT type information, resulting in
// worse generated code for the comparator function than would be optimal. In
// fact, when sorting with a comparator, these costs outweigh the benefits of
// sorting in C++. By using our own JS-implemented Quick Sort (below), we get
// a ~3500ms mean speed-up in `bench/bench.html`.

/**
 * Swap the elements indexed by `x` and `y` in the array `ary`.
 *
 * @param {Array} ary
 *        The array.
 * @param {Number} x
 *        The index of the first item.
 * @param {Number} y
 *        The index of the second item.
 */
function swap(ary, x, y) {
  var temp = ary[x];
  ary[x] = ary[y];
  ary[y] = temp;
}

/**
 * Returns a random integer within the range `low .. high` inclusive.
 *
 * @param {Number} low
 *        The lower bound on the range.
 * @param {Number} high
 *        The upper bound on the range.
 */
function randomIntInRange(low, high) {
  return Math.round(low + (Math.random() * (high - low)));
}

/**
 * The Quick Sort algorithm.
 *
 * @param {Array} ary
 *        An array to sort.
 * @param {function} comparator
 *        Function to use to compare two items.
 * @param {Number} p
 *        Start index of the array
 * @param {Number} r
 *        End index of the array
 */
function doQuickSort(ary, comparator, p, r) {
  // If our lower bound is less than our upper bound, we (1) partition the
  // array into two pieces and (2) recurse on each half. If it is not, this is
  // the empty array and our base case.

  if (p < r) {
    // (1) Partitioning.
    //
    // The partitioning chooses a pivot between `p` and `r` and moves all
    // elements that are less than or equal to the pivot to the before it, and
    // all the elements that are greater than it after it. The effect is that
    // once partition is done, the pivot is in the exact place it will be when
    // the array is put in sorted order, and it will not need to be moved
    // again. This runs in O(n) time.

    // Always choose a random pivot so that an input array which is reverse
    // sorted does not cause O(n^2) running time.
    var pivotIndex = randomIntInRange(p, r);
    var i = p - 1;

    swap(ary, pivotIndex, r);
    var pivot = ary[r];

    // Immediately after `j` is incremented in this loop, the following hold
    // true:
    //
    //   * Every element in `ary[p .. i]` is less than or equal to the pivot.
    //
    //   * Every element in `ary[i+1 .. j-1]` is greater than the pivot.
    for (var j = p; j < r; j++) {
      if (comparator(ary[j], pivot) <= 0) {
        i += 1;
        swap(ary, i, j);
      }
    }

    swap(ary, i + 1, j);
    var q = i + 1;

    // (2) Recurse on each half.

    doQuickSort(ary, comparator, p, q - 1);
    doQuickSort(ary, comparator, q + 1, r);
  }
}

/**
 * Sort the given array in-place with the given comparator function.
 *
 * @param {Array} ary
 *        An array to sort.
 * @param {function} comparator
 *        Function to use to compare two items.
 */
exports.quickSort = function (ary, comparator) {
  doQuickSort(ary, comparator, 0, ary.length - 1);
};

},{}],54:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var util = require('./util');
var binarySearch = require('./binary-search');
var ArraySet = require('./array-set').ArraySet;
var base64VLQ = require('./base64-vlq');
var quickSort = require('./quick-sort').quickSort;

function SourceMapConsumer(aSourceMap, aSourceMapURL) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = util.parseSourceMapInput(aSourceMap);
  }

  return sourceMap.sections != null
    ? new IndexedSourceMapConsumer(sourceMap, aSourceMapURL)
    : new BasicSourceMapConsumer(sourceMap, aSourceMapURL);
}

SourceMapConsumer.fromSourceMap = function(aSourceMap, aSourceMapURL) {
  return BasicSourceMapConsumer.fromSourceMap(aSourceMap, aSourceMapURL);
}

/**
 * The version of the source mapping spec that we are consuming.
 */
SourceMapConsumer.prototype._version = 3;

// `__generatedMappings` and `__originalMappings` are arrays that hold the
// parsed mapping coordinates from the source map's "mappings" attribute. They
// are lazily instantiated, accessed via the `_generatedMappings` and
// `_originalMappings` getters respectively, and we only parse the mappings
// and create these arrays once queried for a source location. We jump through
// these hoops because there can be many thousands of mappings, and parsing
// them is expensive, so we only want to do it if we must.
//
// Each object in the arrays is of the form:
//
//     {
//       generatedLine: The line number in the generated code,
//       generatedColumn: The column number in the generated code,
//       source: The path to the original source file that generated this
//               chunk of code,
//       originalLine: The line number in the original source that
//                     corresponds to this chunk of generated code,
//       originalColumn: The column number in the original source that
//                       corresponds to this chunk of generated code,
//       name: The name of the original symbol which generated this chunk of
//             code.
//     }
//
// All properties except for `generatedLine` and `generatedColumn` can be
// `null`.
//
// `_generatedMappings` is ordered by the generated positions.
//
// `_originalMappings` is ordered by the original positions.

SourceMapConsumer.prototype.__generatedMappings = null;
Object.defineProperty(SourceMapConsumer.prototype, '_generatedMappings', {
  configurable: true,
  enumerable: true,
  get: function () {
    if (!this.__generatedMappings) {
      this._parseMappings(this._mappings, this.sourceRoot);
    }

    return this.__generatedMappings;
  }
});

SourceMapConsumer.prototype.__originalMappings = null;
Object.defineProperty(SourceMapConsumer.prototype, '_originalMappings', {
  configurable: true,
  enumerable: true,
  get: function () {
    if (!this.__originalMappings) {
      this._parseMappings(this._mappings, this.sourceRoot);
    }

    return this.__originalMappings;
  }
});

SourceMapConsumer.prototype._charIsMappingSeparator =
  function SourceMapConsumer_charIsMappingSeparator(aStr, index) {
    var c = aStr.charAt(index);
    return c === ";" || c === ",";
  };

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
SourceMapConsumer.prototype._parseMappings =
  function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    throw new Error("Subclasses must implement _parseMappings");
  };

SourceMapConsumer.GENERATED_ORDER = 1;
SourceMapConsumer.ORIGINAL_ORDER = 2;

SourceMapConsumer.GREATEST_LOWER_BOUND = 1;
SourceMapConsumer.LEAST_UPPER_BOUND = 2;

/**
 * Iterate over each mapping between an original source/line/column and a
 * generated line/column in this source map.
 *
 * @param Function aCallback
 *        The function that is called with each mapping.
 * @param Object aContext
 *        Optional. If specified, this object will be the value of `this` every
 *        time that `aCallback` is called.
 * @param aOrder
 *        Either `SourceMapConsumer.GENERATED_ORDER` or
 *        `SourceMapConsumer.ORIGINAL_ORDER`. Specifies whether you want to
 *        iterate over the mappings sorted by the generated file's line/column
 *        order or the original's source/line/column order, respectively. Defaults to
 *        `SourceMapConsumer.GENERATED_ORDER`.
 */
SourceMapConsumer.prototype.eachMapping =
  function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
    var context = aContext || null;
    var order = aOrder || SourceMapConsumer.GENERATED_ORDER;

    var mappings;
    switch (order) {
    case SourceMapConsumer.GENERATED_ORDER:
      mappings = this._generatedMappings;
      break;
    case SourceMapConsumer.ORIGINAL_ORDER:
      mappings = this._originalMappings;
      break;
    default:
      throw new Error("Unknown order of iteration.");
    }

    var sourceRoot = this.sourceRoot;
    mappings.map(function (mapping) {
      var source = mapping.source === null ? null : this._sources.at(mapping.source);
      source = util.computeSourceURL(sourceRoot, source, this._sourceMapURL);
      return {
        source: source,
        generatedLine: mapping.generatedLine,
        generatedColumn: mapping.generatedColumn,
        originalLine: mapping.originalLine,
        originalColumn: mapping.originalColumn,
        name: mapping.name === null ? null : this._names.at(mapping.name)
      };
    }, this).forEach(aCallback, context);
  };

/**
 * Returns all generated line and column information for the original source,
 * line, and column provided. If no column is provided, returns all mappings
 * corresponding to a either the line we are searching for or the next
 * closest line that has any mappings. Otherwise, returns all mappings
 * corresponding to the given line and either the column we are searching for
 * or the next closest column that has any offsets.
 *
 * The only argument is an object with the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.  The line number is 1-based.
 *   - column: Optional. the column number in the original source.
 *    The column number is 0-based.
 *
 * and an array of objects is returned, each with the following properties:
 *
 *   - line: The line number in the generated source, or null.  The
 *    line number is 1-based.
 *   - column: The column number in the generated source, or null.
 *    The column number is 0-based.
 */
SourceMapConsumer.prototype.allGeneratedPositionsFor =
  function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
    var line = util.getArg(aArgs, 'line');

    // When there is no exact match, BasicSourceMapConsumer.prototype._findMapping
    // returns the index of the closest mapping less than the needle. By
    // setting needle.originalColumn to 0, we thus find the last mapping for
    // the given line, provided such a mapping exists.
    var needle = {
      source: util.getArg(aArgs, 'source'),
      originalLine: line,
      originalColumn: util.getArg(aArgs, 'column', 0)
    };

    needle.source = this._findSourceIndex(needle.source);
    if (needle.source < 0) {
      return [];
    }

    var mappings = [];

    var index = this._findMapping(needle,
                                  this._originalMappings,
                                  "originalLine",
                                  "originalColumn",
                                  util.compareByOriginalPositions,
                                  binarySearch.LEAST_UPPER_BOUND);
    if (index >= 0) {
      var mapping = this._originalMappings[index];

      if (aArgs.column === undefined) {
        var originalLine = mapping.originalLine;

        // Iterate until either we run out of mappings, or we run into
        // a mapping for a different line than the one we found. Since
        // mappings are sorted, this is guaranteed to find all mappings for
        // the line we found.
        while (mapping && mapping.originalLine === originalLine) {
          mappings.push({
            line: util.getArg(mapping, 'generatedLine', null),
            column: util.getArg(mapping, 'generatedColumn', null),
            lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
          });

          mapping = this._originalMappings[++index];
        }
      } else {
        var originalColumn = mapping.originalColumn;

        // Iterate until either we run out of mappings, or we run into
        // a mapping for a different line than the one we were searching for.
        // Since mappings are sorted, this is guaranteed to find all mappings for
        // the line we are searching for.
        while (mapping &&
               mapping.originalLine === line &&
               mapping.originalColumn == originalColumn) {
          mappings.push({
            line: util.getArg(mapping, 'generatedLine', null),
            column: util.getArg(mapping, 'generatedColumn', null),
            lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
          });

          mapping = this._originalMappings[++index];
        }
      }
    }

    return mappings;
  };

exports.SourceMapConsumer = SourceMapConsumer;

/**
 * A BasicSourceMapConsumer instance represents a parsed source map which we can
 * query for information about the original file positions by giving it a file
 * position in the generated source.
 *
 * The first parameter is the raw source map (either as a JSON string, or
 * already parsed to an object). According to the spec, source maps have the
 * following attributes:
 *
 *   - version: Which version of the source map spec this map is following.
 *   - sources: An array of URLs to the original source files.
 *   - names: An array of identifiers which can be referrenced by individual mappings.
 *   - sourceRoot: Optional. The URL root from which all sources are relative.
 *   - sourcesContent: Optional. An array of contents of the original source files.
 *   - mappings: A string of base64 VLQs which contain the actual mappings.
 *   - file: Optional. The generated file this source map is associated with.
 *
 * Here is an example source map, taken from the source map spec[0]:
 *
 *     {
 *       version : 3,
 *       file: "out.js",
 *       sourceRoot : "",
 *       sources: ["foo.js", "bar.js"],
 *       names: ["src", "maps", "are", "fun"],
 *       mappings: "AA,AB;;ABCDE;"
 *     }
 *
 * The second parameter, if given, is a string whose value is the URL
 * at which the source map was found.  This URL is used to compute the
 * sources array.
 *
 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?pli=1#
 */
function BasicSourceMapConsumer(aSourceMap, aSourceMapURL) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = util.parseSourceMapInput(aSourceMap);
  }

  var version = util.getArg(sourceMap, 'version');
  var sources = util.getArg(sourceMap, 'sources');
  // Sass 3.3 leaves out the 'names' array, so we deviate from the spec (which
  // requires the array) to play nice here.
  var names = util.getArg(sourceMap, 'names', []);
  var sourceRoot = util.getArg(sourceMap, 'sourceRoot', null);
  var sourcesContent = util.getArg(sourceMap, 'sourcesContent', null);
  var mappings = util.getArg(sourceMap, 'mappings');
  var file = util.getArg(sourceMap, 'file', null);

  // Once again, Sass deviates from the spec and supplies the version as a
  // string rather than a number, so we use loose equality checking here.
  if (version != this._version) {
    throw new Error('Unsupported version: ' + version);
  }

  if (sourceRoot) {
    sourceRoot = util.normalize(sourceRoot);
  }

  sources = sources
    .map(String)
    // Some source maps produce relative source paths like "./foo.js" instead of
    // "foo.js".  Normalize these first so that future comparisons will succeed.
    // See bugzil.la/1090768.
    .map(util.normalize)
    // Always ensure that absolute sources are internally stored relative to
    // the source root, if the source root is absolute. Not doing this would
    // be particularly problematic when the source root is a prefix of the
    // source (valid, but why??). See github issue #199 and bugzil.la/1188982.
    .map(function (source) {
      return sourceRoot && util.isAbsolute(sourceRoot) && util.isAbsolute(source)
        ? util.relative(sourceRoot, source)
        : source;
    });

  // Pass `true` below to allow duplicate names and sources. While source maps
  // are intended to be compressed and deduplicated, the TypeScript compiler
  // sometimes generates source maps with duplicates in them. See Github issue
  // #72 and bugzil.la/889492.
  this._names = ArraySet.fromArray(names.map(String), true);
  this._sources = ArraySet.fromArray(sources, true);

  this._absoluteSources = this._sources.toArray().map(function (s) {
    return util.computeSourceURL(sourceRoot, s, aSourceMapURL);
  });

  this.sourceRoot = sourceRoot;
  this.sourcesContent = sourcesContent;
  this._mappings = mappings;
  this._sourceMapURL = aSourceMapURL;
  this.file = file;
}

BasicSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
BasicSourceMapConsumer.prototype.consumer = SourceMapConsumer;

/**
 * Utility function to find the index of a source.  Returns -1 if not
 * found.
 */
BasicSourceMapConsumer.prototype._findSourceIndex = function(aSource) {
  var relativeSource = aSource;
  if (this.sourceRoot != null) {
    relativeSource = util.relative(this.sourceRoot, relativeSource);
  }

  if (this._sources.has(relativeSource)) {
    return this._sources.indexOf(relativeSource);
  }

  // Maybe aSource is an absolute URL as returned by |sources|.  In
  // this case we can't simply undo the transform.
  var i;
  for (i = 0; i < this._absoluteSources.length; ++i) {
    if (this._absoluteSources[i] == aSource) {
      return i;
    }
  }

  return -1;
};

/**
 * Create a BasicSourceMapConsumer from a SourceMapGenerator.
 *
 * @param SourceMapGenerator aSourceMap
 *        The source map that will be consumed.
 * @param String aSourceMapURL
 *        The URL at which the source map can be found (optional)
 * @returns BasicSourceMapConsumer
 */
BasicSourceMapConsumer.fromSourceMap =
  function SourceMapConsumer_fromSourceMap(aSourceMap, aSourceMapURL) {
    var smc = Object.create(BasicSourceMapConsumer.prototype);

    var names = smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true);
    var sources = smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true);
    smc.sourceRoot = aSourceMap._sourceRoot;
    smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(),
                                                            smc.sourceRoot);
    smc.file = aSourceMap._file;
    smc._sourceMapURL = aSourceMapURL;
    smc._absoluteSources = smc._sources.toArray().map(function (s) {
      return util.computeSourceURL(smc.sourceRoot, s, aSourceMapURL);
    });

    // Because we are modifying the entries (by converting string sources and
    // names to indices into the sources and names ArraySets), we have to make
    // a copy of the entry or else bad things happen. Shared mutable state
    // strikes again! See github issue #191.

    var generatedMappings = aSourceMap._mappings.toArray().slice();
    var destGeneratedMappings = smc.__generatedMappings = [];
    var destOriginalMappings = smc.__originalMappings = [];

    for (var i = 0, length = generatedMappings.length; i < length; i++) {
      var srcMapping = generatedMappings[i];
      var destMapping = new Mapping;
      destMapping.generatedLine = srcMapping.generatedLine;
      destMapping.generatedColumn = srcMapping.generatedColumn;

      if (srcMapping.source) {
        destMapping.source = sources.indexOf(srcMapping.source);
        destMapping.originalLine = srcMapping.originalLine;
        destMapping.originalColumn = srcMapping.originalColumn;

        if (srcMapping.name) {
          destMapping.name = names.indexOf(srcMapping.name);
        }

        destOriginalMappings.push(destMapping);
      }

      destGeneratedMappings.push(destMapping);
    }

    quickSort(smc.__originalMappings, util.compareByOriginalPositions);

    return smc;
  };

/**
 * The version of the source mapping spec that we are consuming.
 */
BasicSourceMapConsumer.prototype._version = 3;

/**
 * The list of original sources.
 */
Object.defineProperty(BasicSourceMapConsumer.prototype, 'sources', {
  get: function () {
    return this._absoluteSources.slice();
  }
});

/**
 * Provide the JIT with a nice shape / hidden class.
 */
function Mapping() {
  this.generatedLine = 0;
  this.generatedColumn = 0;
  this.source = null;
  this.originalLine = null;
  this.originalColumn = null;
  this.name = null;
}

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
BasicSourceMapConsumer.prototype._parseMappings =
  function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    var generatedLine = 1;
    var previousGeneratedColumn = 0;
    var previousOriginalLine = 0;
    var previousOriginalColumn = 0;
    var previousSource = 0;
    var previousName = 0;
    var length = aStr.length;
    var index = 0;
    var cachedSegments = {};
    var temp = {};
    var originalMappings = [];
    var generatedMappings = [];
    var mapping, str, segment, end, value;

    while (index < length) {
      if (aStr.charAt(index) === ';') {
        generatedLine++;
        index++;
        previousGeneratedColumn = 0;
      }
      else if (aStr.charAt(index) === ',') {
        index++;
      }
      else {
        mapping = new Mapping();
        mapping.generatedLine = generatedLine;

        // Because each offset is encoded relative to the previous one,
        // many segments often have the same encoding. We can exploit this
        // fact by caching the parsed variable length fields of each segment,
        // allowing us to avoid a second parse if we encounter the same
        // segment again.
        for (end = index; end < length; end++) {
          if (this._charIsMappingSeparator(aStr, end)) {
            break;
          }
        }
        str = aStr.slice(index, end);

        segment = cachedSegments[str];
        if (segment) {
          index += str.length;
        } else {
          segment = [];
          while (index < end) {
            base64VLQ.decode(aStr, index, temp);
            value = temp.value;
            index = temp.rest;
            segment.push(value);
          }

          if (segment.length === 2) {
            throw new Error('Found a source, but no line and column');
          }

          if (segment.length === 3) {
            throw new Error('Found a source and line, but no column');
          }

          cachedSegments[str] = segment;
        }

        // Generated column.
        mapping.generatedColumn = previousGeneratedColumn + segment[0];
        previousGeneratedColumn = mapping.generatedColumn;

        if (segment.length > 1) {
          // Original source.
          mapping.source = previousSource + segment[1];
          previousSource += segment[1];

          // Original line.
          mapping.originalLine = previousOriginalLine + segment[2];
          previousOriginalLine = mapping.originalLine;
          // Lines are stored 0-based
          mapping.originalLine += 1;

          // Original column.
          mapping.originalColumn = previousOriginalColumn + segment[3];
          previousOriginalColumn = mapping.originalColumn;

          if (segment.length > 4) {
            // Original name.
            mapping.name = previousName + segment[4];
            previousName += segment[4];
          }
        }

        generatedMappings.push(mapping);
        if (typeof mapping.originalLine === 'number') {
          originalMappings.push(mapping);
        }
      }
    }

    quickSort(generatedMappings, util.compareByGeneratedPositionsDeflated);
    this.__generatedMappings = generatedMappings;

    quickSort(originalMappings, util.compareByOriginalPositions);
    this.__originalMappings = originalMappings;
  };

/**
 * Find the mapping that best matches the hypothetical "needle" mapping that
 * we are searching for in the given "haystack" of mappings.
 */
BasicSourceMapConsumer.prototype._findMapping =
  function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName,
                                         aColumnName, aComparator, aBias) {
    // To return the position we are searching for, we must first find the
    // mapping for the given position and then return the opposite position it
    // points to. Because the mappings are sorted, we can use binary search to
    // find the best mapping.

    if (aNeedle[aLineName] <= 0) {
      throw new TypeError('Line must be greater than or equal to 1, got '
                          + aNeedle[aLineName]);
    }
    if (aNeedle[aColumnName] < 0) {
      throw new TypeError('Column must be greater than or equal to 0, got '
                          + aNeedle[aColumnName]);
    }

    return binarySearch.search(aNeedle, aMappings, aComparator, aBias);
  };

/**
 * Compute the last column for each generated mapping. The last column is
 * inclusive.
 */
BasicSourceMapConsumer.prototype.computeColumnSpans =
  function SourceMapConsumer_computeColumnSpans() {
    for (var index = 0; index < this._generatedMappings.length; ++index) {
      var mapping = this._generatedMappings[index];

      // Mappings do not contain a field for the last generated columnt. We
      // can come up with an optimistic estimate, however, by assuming that
      // mappings are contiguous (i.e. given two consecutive mappings, the
      // first mapping ends where the second one starts).
      if (index + 1 < this._generatedMappings.length) {
        var nextMapping = this._generatedMappings[index + 1];

        if (mapping.generatedLine === nextMapping.generatedLine) {
          mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
          continue;
        }
      }

      // The last mapping for each line spans the entire line.
      mapping.lastGeneratedColumn = Infinity;
    }
  };

/**
 * Returns the original source, line, and column information for the generated
 * source's line and column positions provided. The only argument is an object
 * with the following properties:
 *
 *   - line: The line number in the generated source.  The line number
 *     is 1-based.
 *   - column: The column number in the generated source.  The column
 *     number is 0-based.
 *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
 *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
 *
 * and an object is returned with the following properties:
 *
 *   - source: The original source file, or null.
 *   - line: The line number in the original source, or null.  The
 *     line number is 1-based.
 *   - column: The column number in the original source, or null.  The
 *     column number is 0-based.
 *   - name: The original identifier, or null.
 */
BasicSourceMapConsumer.prototype.originalPositionFor =
  function SourceMapConsumer_originalPositionFor(aArgs) {
    var needle = {
      generatedLine: util.getArg(aArgs, 'line'),
      generatedColumn: util.getArg(aArgs, 'column')
    };

    var index = this._findMapping(
      needle,
      this._generatedMappings,
      "generatedLine",
      "generatedColumn",
      util.compareByGeneratedPositionsDeflated,
      util.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND)
    );

    if (index >= 0) {
      var mapping = this._generatedMappings[index];

      if (mapping.generatedLine === needle.generatedLine) {
        var source = util.getArg(mapping, 'source', null);
        if (source !== null) {
          source = this._sources.at(source);
          source = util.computeSourceURL(this.sourceRoot, source, this._sourceMapURL);
        }
        var name = util.getArg(mapping, 'name', null);
        if (name !== null) {
          name = this._names.at(name);
        }
        return {
          source: source,
          line: util.getArg(mapping, 'originalLine', null),
          column: util.getArg(mapping, 'originalColumn', null),
          name: name
        };
      }
    }

    return {
      source: null,
      line: null,
      column: null,
      name: null
    };
  };

/**
 * Return true if we have the source content for every source in the source
 * map, false otherwise.
 */
BasicSourceMapConsumer.prototype.hasContentsOfAllSources =
  function BasicSourceMapConsumer_hasContentsOfAllSources() {
    if (!this.sourcesContent) {
      return false;
    }
    return this.sourcesContent.length >= this._sources.size() &&
      !this.sourcesContent.some(function (sc) { return sc == null; });
  };

/**
 * Returns the original source content. The only argument is the url of the
 * original source file. Returns null if no original source content is
 * available.
 */
BasicSourceMapConsumer.prototype.sourceContentFor =
  function SourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
    if (!this.sourcesContent) {
      return null;
    }

    var index = this._findSourceIndex(aSource);
    if (index >= 0) {
      return this.sourcesContent[index];
    }

    var relativeSource = aSource;
    if (this.sourceRoot != null) {
      relativeSource = util.relative(this.sourceRoot, relativeSource);
    }

    var url;
    if (this.sourceRoot != null
        && (url = util.urlParse(this.sourceRoot))) {
      // XXX: file:// URIs and absolute paths lead to unexpected behavior for
      // many users. We can help them out when they expect file:// URIs to
      // behave like it would if they were running a local HTTP server. See
      // https://bugzilla.mozilla.org/show_bug.cgi?id=885597.
      var fileUriAbsPath = relativeSource.replace(/^file:\/\//, "");
      if (url.scheme == "file"
          && this._sources.has(fileUriAbsPath)) {
        return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)]
      }

      if ((!url.path || url.path == "/")
          && this._sources.has("/" + relativeSource)) {
        return this.sourcesContent[this._sources.indexOf("/" + relativeSource)];
      }
    }

    // This function is used recursively from
    // IndexedSourceMapConsumer.prototype.sourceContentFor. In that case, we
    // don't want to throw if we can't find the source - we just want to
    // return null, so we provide a flag to exit gracefully.
    if (nullOnMissing) {
      return null;
    }
    else {
      throw new Error('"' + relativeSource + '" is not in the SourceMap.');
    }
  };

/**
 * Returns the generated line and column information for the original source,
 * line, and column positions provided. The only argument is an object with
 * the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.  The line number
 *     is 1-based.
 *   - column: The column number in the original source.  The column
 *     number is 0-based.
 *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
 *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
 *
 * and an object is returned with the following properties:
 *
 *   - line: The line number in the generated source, or null.  The
 *     line number is 1-based.
 *   - column: The column number in the generated source, or null.
 *     The column number is 0-based.
 */
BasicSourceMapConsumer.prototype.generatedPositionFor =
  function SourceMapConsumer_generatedPositionFor(aArgs) {
    var source = util.getArg(aArgs, 'source');
    source = this._findSourceIndex(source);
    if (source < 0) {
      return {
        line: null,
        column: null,
        lastColumn: null
      };
    }

    var needle = {
      source: source,
      originalLine: util.getArg(aArgs, 'line'),
      originalColumn: util.getArg(aArgs, 'column')
    };

    var index = this._findMapping(
      needle,
      this._originalMappings,
      "originalLine",
      "originalColumn",
      util.compareByOriginalPositions,
      util.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND)
    );

    if (index >= 0) {
      var mapping = this._originalMappings[index];

      if (mapping.source === needle.source) {
        return {
          line: util.getArg(mapping, 'generatedLine', null),
          column: util.getArg(mapping, 'generatedColumn', null),
          lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
        };
      }
    }

    return {
      line: null,
      column: null,
      lastColumn: null
    };
  };

exports.BasicSourceMapConsumer = BasicSourceMapConsumer;

/**
 * An IndexedSourceMapConsumer instance represents a parsed source map which
 * we can query for information. It differs from BasicSourceMapConsumer in
 * that it takes "indexed" source maps (i.e. ones with a "sections" field) as
 * input.
 *
 * The first parameter is a raw source map (either as a JSON string, or already
 * parsed to an object). According to the spec for indexed source maps, they
 * have the following attributes:
 *
 *   - version: Which version of the source map spec this map is following.
 *   - file: Optional. The generated file this source map is associated with.
 *   - sections: A list of section definitions.
 *
 * Each value under the "sections" field has two fields:
 *   - offset: The offset into the original specified at which this section
 *       begins to apply, defined as an object with a "line" and "column"
 *       field.
 *   - map: A source map definition. This source map could also be indexed,
 *       but doesn't have to be.
 *
 * Instead of the "map" field, it's also possible to have a "url" field
 * specifying a URL to retrieve a source map from, but that's currently
 * unsupported.
 *
 * Here's an example source map, taken from the source map spec[0], but
 * modified to omit a section which uses the "url" field.
 *
 *  {
 *    version : 3,
 *    file: "app.js",
 *    sections: [{
 *      offset: {line:100, column:10},
 *      map: {
 *        version : 3,
 *        file: "section.js",
 *        sources: ["foo.js", "bar.js"],
 *        names: ["src", "maps", "are", "fun"],
 *        mappings: "AAAA,E;;ABCDE;"
 *      }
 *    }],
 *  }
 *
 * The second parameter, if given, is a string whose value is the URL
 * at which the source map was found.  This URL is used to compute the
 * sources array.
 *
 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit#heading=h.535es3xeprgt
 */
function IndexedSourceMapConsumer(aSourceMap, aSourceMapURL) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = util.parseSourceMapInput(aSourceMap);
  }

  var version = util.getArg(sourceMap, 'version');
  var sections = util.getArg(sourceMap, 'sections');

  if (version != this._version) {
    throw new Error('Unsupported version: ' + version);
  }

  this._sources = new ArraySet();
  this._names = new ArraySet();

  var lastOffset = {
    line: -1,
    column: 0
  };
  this._sections = sections.map(function (s) {
    if (s.url) {
      // The url field will require support for asynchronicity.
      // See https://github.com/mozilla/source-map/issues/16
      throw new Error('Support for url field in sections not implemented.');
    }
    var offset = util.getArg(s, 'offset');
    var offsetLine = util.getArg(offset, 'line');
    var offsetColumn = util.getArg(offset, 'column');

    if (offsetLine < lastOffset.line ||
        (offsetLine === lastOffset.line && offsetColumn < lastOffset.column)) {
      throw new Error('Section offsets must be ordered and non-overlapping.');
    }
    lastOffset = offset;

    return {
      generatedOffset: {
        // The offset fields are 0-based, but we use 1-based indices when
        // encoding/decoding from VLQ.
        generatedLine: offsetLine + 1,
        generatedColumn: offsetColumn + 1
      },
      consumer: new SourceMapConsumer(util.getArg(s, 'map'), aSourceMapURL)
    }
  });
}

IndexedSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
IndexedSourceMapConsumer.prototype.constructor = SourceMapConsumer;

/**
 * The version of the source mapping spec that we are consuming.
 */
IndexedSourceMapConsumer.prototype._version = 3;

/**
 * The list of original sources.
 */
Object.defineProperty(IndexedSourceMapConsumer.prototype, 'sources', {
  get: function () {
    var sources = [];
    for (var i = 0; i < this._sections.length; i++) {
      for (var j = 0; j < this._sections[i].consumer.sources.length; j++) {
        sources.push(this._sections[i].consumer.sources[j]);
      }
    }
    return sources;
  }
});

/**
 * Returns the original source, line, and column information for the generated
 * source's line and column positions provided. The only argument is an object
 * with the following properties:
 *
 *   - line: The line number in the generated source.  The line number
 *     is 1-based.
 *   - column: The column number in the generated source.  The column
 *     number is 0-based.
 *
 * and an object is returned with the following properties:
 *
 *   - source: The original source file, or null.
 *   - line: The line number in the original source, or null.  The
 *     line number is 1-based.
 *   - column: The column number in the original source, or null.  The
 *     column number is 0-based.
 *   - name: The original identifier, or null.
 */
IndexedSourceMapConsumer.prototype.originalPositionFor =
  function IndexedSourceMapConsumer_originalPositionFor(aArgs) {
    var needle = {
      generatedLine: util.getArg(aArgs, 'line'),
      generatedColumn: util.getArg(aArgs, 'column')
    };

    // Find the section containing the generated position we're trying to map
    // to an original position.
    var sectionIndex = binarySearch.search(needle, this._sections,
      function(needle, section) {
        var cmp = needle.generatedLine - section.generatedOffset.generatedLine;
        if (cmp) {
          return cmp;
        }

        return (needle.generatedColumn -
                section.generatedOffset.generatedColumn);
      });
    var section = this._sections[sectionIndex];

    if (!section) {
      return {
        source: null,
        line: null,
        column: null,
        name: null
      };
    }

    return section.consumer.originalPositionFor({
      line: needle.generatedLine -
        (section.generatedOffset.generatedLine - 1),
      column: needle.generatedColumn -
        (section.generatedOffset.generatedLine === needle.generatedLine
         ? section.generatedOffset.generatedColumn - 1
         : 0),
      bias: aArgs.bias
    });
  };

/**
 * Return true if we have the source content for every source in the source
 * map, false otherwise.
 */
IndexedSourceMapConsumer.prototype.hasContentsOfAllSources =
  function IndexedSourceMapConsumer_hasContentsOfAllSources() {
    return this._sections.every(function (s) {
      return s.consumer.hasContentsOfAllSources();
    });
  };

/**
 * Returns the original source content. The only argument is the url of the
 * original source file. Returns null if no original source content is
 * available.
 */
IndexedSourceMapConsumer.prototype.sourceContentFor =
  function IndexedSourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];

      var content = section.consumer.sourceContentFor(aSource, true);
      if (content) {
        return content;
      }
    }
    if (nullOnMissing) {
      return null;
    }
    else {
      throw new Error('"' + aSource + '" is not in the SourceMap.');
    }
  };

/**
 * Returns the generated line and column information for the original source,
 * line, and column positions provided. The only argument is an object with
 * the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.  The line number
 *     is 1-based.
 *   - column: The column number in the original source.  The column
 *     number is 0-based.
 *
 * and an object is returned with the following properties:
 *
 *   - line: The line number in the generated source, or null.  The
 *     line number is 1-based. 
 *   - column: The column number in the generated source, or null.
 *     The column number is 0-based.
 */
IndexedSourceMapConsumer.prototype.generatedPositionFor =
  function IndexedSourceMapConsumer_generatedPositionFor(aArgs) {
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];

      // Only consider this section if the requested source is in the list of
      // sources of the consumer.
      if (section.consumer._findSourceIndex(util.getArg(aArgs, 'source')) === -1) {
        continue;
      }
      var generatedPosition = section.consumer.generatedPositionFor(aArgs);
      if (generatedPosition) {
        var ret = {
          line: generatedPosition.line +
            (section.generatedOffset.generatedLine - 1),
          column: generatedPosition.column +
            (section.generatedOffset.generatedLine === generatedPosition.line
             ? section.generatedOffset.generatedColumn - 1
             : 0)
        };
        return ret;
      }
    }

    return {
      line: null,
      column: null
    };
  };

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
IndexedSourceMapConsumer.prototype._parseMappings =
  function IndexedSourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    this.__generatedMappings = [];
    this.__originalMappings = [];
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];
      var sectionMappings = section.consumer._generatedMappings;
      for (var j = 0; j < sectionMappings.length; j++) {
        var mapping = sectionMappings[j];

        var source = section.consumer._sources.at(mapping.source);
        source = util.computeSourceURL(section.consumer.sourceRoot, source, this._sourceMapURL);
        this._sources.add(source);
        source = this._sources.indexOf(source);

        var name = null;
        if (mapping.name) {
          name = section.consumer._names.at(mapping.name);
          this._names.add(name);
          name = this._names.indexOf(name);
        }

        // The mappings coming from the consumer for the section have
        // generated positions relative to the start of the section, so we
        // need to offset them to be relative to the start of the concatenated
        // generated file.
        var adjustedMapping = {
          source: source,
          generatedLine: mapping.generatedLine +
            (section.generatedOffset.generatedLine - 1),
          generatedColumn: mapping.generatedColumn +
            (section.generatedOffset.generatedLine === mapping.generatedLine
            ? section.generatedOffset.generatedColumn - 1
            : 0),
          originalLine: mapping.originalLine,
          originalColumn: mapping.originalColumn,
          name: name
        };

        this.__generatedMappings.push(adjustedMapping);
        if (typeof adjustedMapping.originalLine === 'number') {
          this.__originalMappings.push(adjustedMapping);
        }
      }
    }

    quickSort(this.__generatedMappings, util.compareByGeneratedPositionsDeflated);
    quickSort(this.__originalMappings, util.compareByOriginalPositions);
  };

exports.IndexedSourceMapConsumer = IndexedSourceMapConsumer;

},{"./array-set":48,"./base64-vlq":49,"./binary-search":51,"./quick-sort":53,"./util":57}],55:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var base64VLQ = require('./base64-vlq');
var util = require('./util');
var ArraySet = require('./array-set').ArraySet;
var MappingList = require('./mapping-list').MappingList;

/**
 * An instance of the SourceMapGenerator represents a source map which is
 * being built incrementally. You may pass an object with the following
 * properties:
 *
 *   - file: The filename of the generated source.
 *   - sourceRoot: A root for all relative URLs in this source map.
 */
function SourceMapGenerator(aArgs) {
  if (!aArgs) {
    aArgs = {};
  }
  this._file = util.getArg(aArgs, 'file', null);
  this._sourceRoot = util.getArg(aArgs, 'sourceRoot', null);
  this._skipValidation = util.getArg(aArgs, 'skipValidation', false);
  this._sources = new ArraySet();
  this._names = new ArraySet();
  this._mappings = new MappingList();
  this._sourcesContents = null;
}

SourceMapGenerator.prototype._version = 3;

/**
 * Creates a new SourceMapGenerator based on a SourceMapConsumer
 *
 * @param aSourceMapConsumer The SourceMap.
 */
SourceMapGenerator.fromSourceMap =
  function SourceMapGenerator_fromSourceMap(aSourceMapConsumer) {
    var sourceRoot = aSourceMapConsumer.sourceRoot;
    var generator = new SourceMapGenerator({
      file: aSourceMapConsumer.file,
      sourceRoot: sourceRoot
    });
    aSourceMapConsumer.eachMapping(function (mapping) {
      var newMapping = {
        generated: {
          line: mapping.generatedLine,
          column: mapping.generatedColumn
        }
      };

      if (mapping.source != null) {
        newMapping.source = mapping.source;
        if (sourceRoot != null) {
          newMapping.source = util.relative(sourceRoot, newMapping.source);
        }

        newMapping.original = {
          line: mapping.originalLine,
          column: mapping.originalColumn
        };

        if (mapping.name != null) {
          newMapping.name = mapping.name;
        }
      }

      generator.addMapping(newMapping);
    });
    aSourceMapConsumer.sources.forEach(function (sourceFile) {
      var sourceRelative = sourceFile;
      if (sourceRoot !== null) {
        sourceRelative = util.relative(sourceRoot, sourceFile);
      }

      if (!generator._sources.has(sourceRelative)) {
        generator._sources.add(sourceRelative);
      }

      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        generator.setSourceContent(sourceFile, content);
      }
    });
    return generator;
  };

/**
 * Add a single mapping from original source line and column to the generated
 * source's line and column for this source map being created. The mapping
 * object should have the following properties:
 *
 *   - generated: An object with the generated line and column positions.
 *   - original: An object with the original line and column positions.
 *   - source: The original source file (relative to the sourceRoot).
 *   - name: An optional original token name for this mapping.
 */
SourceMapGenerator.prototype.addMapping =
  function SourceMapGenerator_addMapping(aArgs) {
    var generated = util.getArg(aArgs, 'generated');
    var original = util.getArg(aArgs, 'original', null);
    var source = util.getArg(aArgs, 'source', null);
    var name = util.getArg(aArgs, 'name', null);

    if (!this._skipValidation) {
      this._validateMapping(generated, original, source, name);
    }

    if (source != null) {
      source = String(source);
      if (!this._sources.has(source)) {
        this._sources.add(source);
      }
    }

    if (name != null) {
      name = String(name);
      if (!this._names.has(name)) {
        this._names.add(name);
      }
    }

    this._mappings.add({
      generatedLine: generated.line,
      generatedColumn: generated.column,
      originalLine: original != null && original.line,
      originalColumn: original != null && original.column,
      source: source,
      name: name
    });
  };

/**
 * Set the source content for a source file.
 */
SourceMapGenerator.prototype.setSourceContent =
  function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
    var source = aSourceFile;
    if (this._sourceRoot != null) {
      source = util.relative(this._sourceRoot, source);
    }

    if (aSourceContent != null) {
      // Add the source content to the _sourcesContents map.
      // Create a new _sourcesContents map if the property is null.
      if (!this._sourcesContents) {
        this._sourcesContents = Object.create(null);
      }
      this._sourcesContents[util.toSetString(source)] = aSourceContent;
    } else if (this._sourcesContents) {
      // Remove the source file from the _sourcesContents map.
      // If the _sourcesContents map is empty, set the property to null.
      delete this._sourcesContents[util.toSetString(source)];
      if (Object.keys(this._sourcesContents).length === 0) {
        this._sourcesContents = null;
      }
    }
  };

/**
 * Applies the mappings of a sub-source-map for a specific source file to the
 * source map being generated. Each mapping to the supplied source file is
 * rewritten using the supplied source map. Note: The resolution for the
 * resulting mappings is the minimium of this map and the supplied map.
 *
 * @param aSourceMapConsumer The source map to be applied.
 * @param aSourceFile Optional. The filename of the source file.
 *        If omitted, SourceMapConsumer's file property will be used.
 * @param aSourceMapPath Optional. The dirname of the path to the source map
 *        to be applied. If relative, it is relative to the SourceMapConsumer.
 *        This parameter is needed when the two source maps aren't in the same
 *        directory, and the source map to be applied contains relative source
 *        paths. If so, those relative source paths need to be rewritten
 *        relative to the SourceMapGenerator.
 */
SourceMapGenerator.prototype.applySourceMap =
  function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
    var sourceFile = aSourceFile;
    // If aSourceFile is omitted, we will use the file property of the SourceMap
    if (aSourceFile == null) {
      if (aSourceMapConsumer.file == null) {
        throw new Error(
          'SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, ' +
          'or the source map\'s "file" property. Both were omitted.'
        );
      }
      sourceFile = aSourceMapConsumer.file;
    }
    var sourceRoot = this._sourceRoot;
    // Make "sourceFile" relative if an absolute Url is passed.
    if (sourceRoot != null) {
      sourceFile = util.relative(sourceRoot, sourceFile);
    }
    // Applying the SourceMap can add and remove items from the sources and
    // the names array.
    var newSources = new ArraySet();
    var newNames = new ArraySet();

    // Find mappings for the "sourceFile"
    this._mappings.unsortedForEach(function (mapping) {
      if (mapping.source === sourceFile && mapping.originalLine != null) {
        // Check if it can be mapped by the source map, then update the mapping.
        var original = aSourceMapConsumer.originalPositionFor({
          line: mapping.originalLine,
          column: mapping.originalColumn
        });
        if (original.source != null) {
          // Copy mapping
          mapping.source = original.source;
          if (aSourceMapPath != null) {
            mapping.source = util.join(aSourceMapPath, mapping.source)
          }
          if (sourceRoot != null) {
            mapping.source = util.relative(sourceRoot, mapping.source);
          }
          mapping.originalLine = original.line;
          mapping.originalColumn = original.column;
          if (original.name != null) {
            mapping.name = original.name;
          }
        }
      }

      var source = mapping.source;
      if (source != null && !newSources.has(source)) {
        newSources.add(source);
      }

      var name = mapping.name;
      if (name != null && !newNames.has(name)) {
        newNames.add(name);
      }

    }, this);
    this._sources = newSources;
    this._names = newNames;

    // Copy sourcesContents of applied map.
    aSourceMapConsumer.sources.forEach(function (sourceFile) {
      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        if (aSourceMapPath != null) {
          sourceFile = util.join(aSourceMapPath, sourceFile);
        }
        if (sourceRoot != null) {
          sourceFile = util.relative(sourceRoot, sourceFile);
        }
        this.setSourceContent(sourceFile, content);
      }
    }, this);
  };

/**
 * A mapping can have one of the three levels of data:
 *
 *   1. Just the generated position.
 *   2. The Generated position, original position, and original source.
 *   3. Generated and original position, original source, as well as a name
 *      token.
 *
 * To maintain consistency, we validate that any new mapping being added falls
 * in to one of these categories.
 */
SourceMapGenerator.prototype._validateMapping =
  function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource,
                                              aName) {
    // When aOriginal is truthy but has empty values for .line and .column,
    // it is most likely a programmer error. In this case we throw a very
    // specific error message to try to guide them the right way.
    // For example: https://github.com/Polymer/polymer-bundler/pull/519
    if (aOriginal && typeof aOriginal.line !== 'number' && typeof aOriginal.column !== 'number') {
        throw new Error(
            'original.line and original.column are not numbers -- you probably meant to omit ' +
            'the original mapping entirely and only map the generated position. If so, pass ' +
            'null for the original mapping instead of an object with empty or null values.'
        );
    }

    if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
        && aGenerated.line > 0 && aGenerated.column >= 0
        && !aOriginal && !aSource && !aName) {
      // Case 1.
      return;
    }
    else if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
             && aOriginal && 'line' in aOriginal && 'column' in aOriginal
             && aGenerated.line > 0 && aGenerated.column >= 0
             && aOriginal.line > 0 && aOriginal.column >= 0
             && aSource) {
      // Cases 2 and 3.
      return;
    }
    else {
      throw new Error('Invalid mapping: ' + JSON.stringify({
        generated: aGenerated,
        source: aSource,
        original: aOriginal,
        name: aName
      }));
    }
  };

/**
 * Serialize the accumulated mappings in to the stream of base 64 VLQs
 * specified by the source map format.
 */
SourceMapGenerator.prototype._serializeMappings =
  function SourceMapGenerator_serializeMappings() {
    var previousGeneratedColumn = 0;
    var previousGeneratedLine = 1;
    var previousOriginalColumn = 0;
    var previousOriginalLine = 0;
    var previousName = 0;
    var previousSource = 0;
    var result = '';
    var next;
    var mapping;
    var nameIdx;
    var sourceIdx;

    var mappings = this._mappings.toArray();
    for (var i = 0, len = mappings.length; i < len; i++) {
      mapping = mappings[i];
      next = ''

      if (mapping.generatedLine !== previousGeneratedLine) {
        previousGeneratedColumn = 0;
        while (mapping.generatedLine !== previousGeneratedLine) {
          next += ';';
          previousGeneratedLine++;
        }
      }
      else {
        if (i > 0) {
          if (!util.compareByGeneratedPositionsInflated(mapping, mappings[i - 1])) {
            continue;
          }
          next += ',';
        }
      }

      next += base64VLQ.encode(mapping.generatedColumn
                                 - previousGeneratedColumn);
      previousGeneratedColumn = mapping.generatedColumn;

      if (mapping.source != null) {
        sourceIdx = this._sources.indexOf(mapping.source);
        next += base64VLQ.encode(sourceIdx - previousSource);
        previousSource = sourceIdx;

        // lines are stored 0-based in SourceMap spec version 3
        next += base64VLQ.encode(mapping.originalLine - 1
                                   - previousOriginalLine);
        previousOriginalLine = mapping.originalLine - 1;

        next += base64VLQ.encode(mapping.originalColumn
                                   - previousOriginalColumn);
        previousOriginalColumn = mapping.originalColumn;

        if (mapping.name != null) {
          nameIdx = this._names.indexOf(mapping.name);
          next += base64VLQ.encode(nameIdx - previousName);
          previousName = nameIdx;
        }
      }

      result += next;
    }

    return result;
  };

SourceMapGenerator.prototype._generateSourcesContent =
  function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
    return aSources.map(function (source) {
      if (!this._sourcesContents) {
        return null;
      }
      if (aSourceRoot != null) {
        source = util.relative(aSourceRoot, source);
      }
      var key = util.toSetString(source);
      return Object.prototype.hasOwnProperty.call(this._sourcesContents, key)
        ? this._sourcesContents[key]
        : null;
    }, this);
  };

/**
 * Externalize the source map.
 */
SourceMapGenerator.prototype.toJSON =
  function SourceMapGenerator_toJSON() {
    var map = {
      version: this._version,
      sources: this._sources.toArray(),
      names: this._names.toArray(),
      mappings: this._serializeMappings()
    };
    if (this._file != null) {
      map.file = this._file;
    }
    if (this._sourceRoot != null) {
      map.sourceRoot = this._sourceRoot;
    }
    if (this._sourcesContents) {
      map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
    }

    return map;
  };

/**
 * Render the source map being generated to a string.
 */
SourceMapGenerator.prototype.toString =
  function SourceMapGenerator_toString() {
    return JSON.stringify(this.toJSON());
  };

exports.SourceMapGenerator = SourceMapGenerator;

},{"./array-set":48,"./base64-vlq":49,"./mapping-list":52,"./util":57}],56:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var SourceMapGenerator = require('./source-map-generator').SourceMapGenerator;
var util = require('./util');

// Matches a Windows-style `\r\n` newline or a `\n` newline used by all other
// operating systems these days (capturing the result).
var REGEX_NEWLINE = /(\r?\n)/;

// Newline character code for charCodeAt() comparisons
var NEWLINE_CODE = 10;

// Private symbol for identifying `SourceNode`s when multiple versions of
// the source-map library are loaded. This MUST NOT CHANGE across
// versions!
var isSourceNode = "$$$isSourceNode$$$";

/**
 * SourceNodes provide a way to abstract over interpolating/concatenating
 * snippets of generated JavaScript source code while maintaining the line and
 * column information associated with the original source code.
 *
 * @param aLine The original line number.
 * @param aColumn The original column number.
 * @param aSource The original source's filename.
 * @param aChunks Optional. An array of strings which are snippets of
 *        generated JS, or other SourceNodes.
 * @param aName The original identifier.
 */
function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
  this.children = [];
  this.sourceContents = {};
  this.line = aLine == null ? null : aLine;
  this.column = aColumn == null ? null : aColumn;
  this.source = aSource == null ? null : aSource;
  this.name = aName == null ? null : aName;
  this[isSourceNode] = true;
  if (aChunks != null) this.add(aChunks);
}

/**
 * Creates a SourceNode from generated code and a SourceMapConsumer.
 *
 * @param aGeneratedCode The generated code
 * @param aSourceMapConsumer The SourceMap for the generated code
 * @param aRelativePath Optional. The path that relative sources in the
 *        SourceMapConsumer should be relative to.
 */
SourceNode.fromStringWithSourceMap =
  function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer, aRelativePath) {
    // The SourceNode we want to fill with the generated code
    // and the SourceMap
    var node = new SourceNode();

    // All even indices of this array are one line of the generated code,
    // while all odd indices are the newlines between two adjacent lines
    // (since `REGEX_NEWLINE` captures its match).
    // Processed fragments are accessed by calling `shiftNextLine`.
    var remainingLines = aGeneratedCode.split(REGEX_NEWLINE);
    var remainingLinesIndex = 0;
    var shiftNextLine = function() {
      var lineContents = getNextLine();
      // The last line of a file might not have a newline.
      var newLine = getNextLine() || "";
      return lineContents + newLine;

      function getNextLine() {
        return remainingLinesIndex < remainingLines.length ?
            remainingLines[remainingLinesIndex++] : undefined;
      }
    };

    // We need to remember the position of "remainingLines"
    var lastGeneratedLine = 1, lastGeneratedColumn = 0;

    // The generate SourceNodes we need a code range.
    // To extract it current and last mapping is used.
    // Here we store the last mapping.
    var lastMapping = null;

    aSourceMapConsumer.eachMapping(function (mapping) {
      if (lastMapping !== null) {
        // We add the code from "lastMapping" to "mapping":
        // First check if there is a new line in between.
        if (lastGeneratedLine < mapping.generatedLine) {
          // Associate first line with "lastMapping"
          addMappingWithCode(lastMapping, shiftNextLine());
          lastGeneratedLine++;
          lastGeneratedColumn = 0;
          // The remaining code is added without mapping
        } else {
          // There is no new line in between.
          // Associate the code between "lastGeneratedColumn" and
          // "mapping.generatedColumn" with "lastMapping"
          var nextLine = remainingLines[remainingLinesIndex] || '';
          var code = nextLine.substr(0, mapping.generatedColumn -
                                        lastGeneratedColumn);
          remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn -
                                              lastGeneratedColumn);
          lastGeneratedColumn = mapping.generatedColumn;
          addMappingWithCode(lastMapping, code);
          // No more remaining code, continue
          lastMapping = mapping;
          return;
        }
      }
      // We add the generated code until the first mapping
      // to the SourceNode without any mapping.
      // Each line is added as separate string.
      while (lastGeneratedLine < mapping.generatedLine) {
        node.add(shiftNextLine());
        lastGeneratedLine++;
      }
      if (lastGeneratedColumn < mapping.generatedColumn) {
        var nextLine = remainingLines[remainingLinesIndex] || '';
        node.add(nextLine.substr(0, mapping.generatedColumn));
        remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn);
        lastGeneratedColumn = mapping.generatedColumn;
      }
      lastMapping = mapping;
    }, this);
    // We have processed all mappings.
    if (remainingLinesIndex < remainingLines.length) {
      if (lastMapping) {
        // Associate the remaining code in the current line with "lastMapping"
        addMappingWithCode(lastMapping, shiftNextLine());
      }
      // and add the remaining lines without any mapping
      node.add(remainingLines.splice(remainingLinesIndex).join(""));
    }

    // Copy sourcesContent into SourceNode
    aSourceMapConsumer.sources.forEach(function (sourceFile) {
      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        if (aRelativePath != null) {
          sourceFile = util.join(aRelativePath, sourceFile);
        }
        node.setSourceContent(sourceFile, content);
      }
    });

    return node;

    function addMappingWithCode(mapping, code) {
      if (mapping === null || mapping.source === undefined) {
        node.add(code);
      } else {
        var source = aRelativePath
          ? util.join(aRelativePath, mapping.source)
          : mapping.source;
        node.add(new SourceNode(mapping.originalLine,
                                mapping.originalColumn,
                                source,
                                code,
                                mapping.name));
      }
    }
  };

/**
 * Add a chunk of generated JS to this source node.
 *
 * @param aChunk A string snippet of generated JS code, another instance of
 *        SourceNode, or an array where each member is one of those things.
 */
SourceNode.prototype.add = function SourceNode_add(aChunk) {
  if (Array.isArray(aChunk)) {
    aChunk.forEach(function (chunk) {
      this.add(chunk);
    }, this);
  }
  else if (aChunk[isSourceNode] || typeof aChunk === "string") {
    if (aChunk) {
      this.children.push(aChunk);
    }
  }
  else {
    throw new TypeError(
      "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
    );
  }
  return this;
};

/**
 * Add a chunk of generated JS to the beginning of this source node.
 *
 * @param aChunk A string snippet of generated JS code, another instance of
 *        SourceNode, or an array where each member is one of those things.
 */
SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
  if (Array.isArray(aChunk)) {
    for (var i = aChunk.length-1; i >= 0; i--) {
      this.prepend(aChunk[i]);
    }
  }
  else if (aChunk[isSourceNode] || typeof aChunk === "string") {
    this.children.unshift(aChunk);
  }
  else {
    throw new TypeError(
      "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
    );
  }
  return this;
};

/**
 * Walk over the tree of JS snippets in this node and its children. The
 * walking function is called once for each snippet of JS and is passed that
 * snippet and the its original associated source's line/column location.
 *
 * @param aFn The traversal function.
 */
SourceNode.prototype.walk = function SourceNode_walk(aFn) {
  var chunk;
  for (var i = 0, len = this.children.length; i < len; i++) {
    chunk = this.children[i];
    if (chunk[isSourceNode]) {
      chunk.walk(aFn);
    }
    else {
      if (chunk !== '') {
        aFn(chunk, { source: this.source,
                     line: this.line,
                     column: this.column,
                     name: this.name });
      }
    }
  }
};

/**
 * Like `String.prototype.join` except for SourceNodes. Inserts `aStr` between
 * each of `this.children`.
 *
 * @param aSep The separator.
 */
SourceNode.prototype.join = function SourceNode_join(aSep) {
  var newChildren;
  var i;
  var len = this.children.length;
  if (len > 0) {
    newChildren = [];
    for (i = 0; i < len-1; i++) {
      newChildren.push(this.children[i]);
      newChildren.push(aSep);
    }
    newChildren.push(this.children[i]);
    this.children = newChildren;
  }
  return this;
};

/**
 * Call String.prototype.replace on the very right-most source snippet. Useful
 * for trimming whitespace from the end of a source node, etc.
 *
 * @param aPattern The pattern to replace.
 * @param aReplacement The thing to replace the pattern with.
 */
SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
  var lastChild = this.children[this.children.length - 1];
  if (lastChild[isSourceNode]) {
    lastChild.replaceRight(aPattern, aReplacement);
  }
  else if (typeof lastChild === 'string') {
    this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
  }
  else {
    this.children.push(''.replace(aPattern, aReplacement));
  }
  return this;
};

/**
 * Set the source content for a source file. This will be added to the SourceMapGenerator
 * in the sourcesContent field.
 *
 * @param aSourceFile The filename of the source file
 * @param aSourceContent The content of the source file
 */
SourceNode.prototype.setSourceContent =
  function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
    this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
  };

/**
 * Walk over the tree of SourceNodes. The walking function is called for each
 * source file content and is passed the filename and source content.
 *
 * @param aFn The traversal function.
 */
SourceNode.prototype.walkSourceContents =
  function SourceNode_walkSourceContents(aFn) {
    for (var i = 0, len = this.children.length; i < len; i++) {
      if (this.children[i][isSourceNode]) {
        this.children[i].walkSourceContents(aFn);
      }
    }

    var sources = Object.keys(this.sourceContents);
    for (var i = 0, len = sources.length; i < len; i++) {
      aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
    }
  };

/**
 * Return the string representation of this source node. Walks over the tree
 * and concatenates all the various snippets together to one string.
 */
SourceNode.prototype.toString = function SourceNode_toString() {
  var str = "";
  this.walk(function (chunk) {
    str += chunk;
  });
  return str;
};

/**
 * Returns the string representation of this source node along with a source
 * map.
 */
SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
  var generated = {
    code: "",
    line: 1,
    column: 0
  };
  var map = new SourceMapGenerator(aArgs);
  var sourceMappingActive = false;
  var lastOriginalSource = null;
  var lastOriginalLine = null;
  var lastOriginalColumn = null;
  var lastOriginalName = null;
  this.walk(function (chunk, original) {
    generated.code += chunk;
    if (original.source !== null
        && original.line !== null
        && original.column !== null) {
      if(lastOriginalSource !== original.source
         || lastOriginalLine !== original.line
         || lastOriginalColumn !== original.column
         || lastOriginalName !== original.name) {
        map.addMapping({
          source: original.source,
          original: {
            line: original.line,
            column: original.column
          },
          generated: {
            line: generated.line,
            column: generated.column
          },
          name: original.name
        });
      }
      lastOriginalSource = original.source;
      lastOriginalLine = original.line;
      lastOriginalColumn = original.column;
      lastOriginalName = original.name;
      sourceMappingActive = true;
    } else if (sourceMappingActive) {
      map.addMapping({
        generated: {
          line: generated.line,
          column: generated.column
        }
      });
      lastOriginalSource = null;
      sourceMappingActive = false;
    }
    for (var idx = 0, length = chunk.length; idx < length; idx++) {
      if (chunk.charCodeAt(idx) === NEWLINE_CODE) {
        generated.line++;
        generated.column = 0;
        // Mappings end at eol
        if (idx + 1 === length) {
          lastOriginalSource = null;
          sourceMappingActive = false;
        } else if (sourceMappingActive) {
          map.addMapping({
            source: original.source,
            original: {
              line: original.line,
              column: original.column
            },
            generated: {
              line: generated.line,
              column: generated.column
            },
            name: original.name
          });
        }
      } else {
        generated.column++;
      }
    }
  });
  this.walkSourceContents(function (sourceFile, sourceContent) {
    map.setSourceContent(sourceFile, sourceContent);
  });

  return { code: generated.code, map: map };
};

exports.SourceNode = SourceNode;

},{"./source-map-generator":55,"./util":57}],57:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

/**
 * This is a helper function for getting values from parameter/options
 * objects.
 *
 * @param args The object we are extracting values from
 * @param name The name of the property we are getting.
 * @param defaultValue An optional value to return if the property is missing
 * from the object. If this is not specified and the property is missing, an
 * error will be thrown.
 */
function getArg(aArgs, aName, aDefaultValue) {
  if (aName in aArgs) {
    return aArgs[aName];
  } else if (arguments.length === 3) {
    return aDefaultValue;
  } else {
    throw new Error('"' + aName + '" is a required argument.');
  }
}
exports.getArg = getArg;

var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.-]*)(?::(\d+))?(.*)$/;
var dataUrlRegexp = /^data:.+\,.+$/;

function urlParse(aUrl) {
  var match = aUrl.match(urlRegexp);
  if (!match) {
    return null;
  }
  return {
    scheme: match[1],
    auth: match[2],
    host: match[3],
    port: match[4],
    path: match[5]
  };
}
exports.urlParse = urlParse;

function urlGenerate(aParsedUrl) {
  var url = '';
  if (aParsedUrl.scheme) {
    url += aParsedUrl.scheme + ':';
  }
  url += '//';
  if (aParsedUrl.auth) {
    url += aParsedUrl.auth + '@';
  }
  if (aParsedUrl.host) {
    url += aParsedUrl.host;
  }
  if (aParsedUrl.port) {
    url += ":" + aParsedUrl.port
  }
  if (aParsedUrl.path) {
    url += aParsedUrl.path;
  }
  return url;
}
exports.urlGenerate = urlGenerate;

/**
 * Normalizes a path, or the path portion of a URL:
 *
 * - Replaces consecutive slashes with one slash.
 * - Removes unnecessary '.' parts.
 * - Removes unnecessary '<dir>/..' parts.
 *
 * Based on code in the Node.js 'path' core module.
 *
 * @param aPath The path or url to normalize.
 */
function normalize(aPath) {
  var path = aPath;
  var url = urlParse(aPath);
  if (url) {
    if (!url.path) {
      return aPath;
    }
    path = url.path;
  }
  var isAbsolute = exports.isAbsolute(path);

  var parts = path.split(/\/+/);
  for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
    part = parts[i];
    if (part === '.') {
      parts.splice(i, 1);
    } else if (part === '..') {
      up++;
    } else if (up > 0) {
      if (part === '') {
        // The first part is blank if the path is absolute. Trying to go
        // above the root is a no-op. Therefore we can remove all '..' parts
        // directly after the root.
        parts.splice(i + 1, up);
        up = 0;
      } else {
        parts.splice(i, 2);
        up--;
      }
    }
  }
  path = parts.join('/');

  if (path === '') {
    path = isAbsolute ? '/' : '.';
  }

  if (url) {
    url.path = path;
    return urlGenerate(url);
  }
  return path;
}
exports.normalize = normalize;

/**
 * Joins two paths/URLs.
 *
 * @param aRoot The root path or URL.
 * @param aPath The path or URL to be joined with the root.
 *
 * - If aPath is a URL or a data URI, aPath is returned, unless aPath is a
 *   scheme-relative URL: Then the scheme of aRoot, if any, is prepended
 *   first.
 * - Otherwise aPath is a path. If aRoot is a URL, then its path portion
 *   is updated with the result and aRoot is returned. Otherwise the result
 *   is returned.
 *   - If aPath is absolute, the result is aPath.
 *   - Otherwise the two paths are joined with a slash.
 * - Joining for example 'http://' and 'www.example.com' is also supported.
 */
function join(aRoot, aPath) {
  if (aRoot === "") {
    aRoot = ".";
  }
  if (aPath === "") {
    aPath = ".";
  }
  var aPathUrl = urlParse(aPath);
  var aRootUrl = urlParse(aRoot);
  if (aRootUrl) {
    aRoot = aRootUrl.path || '/';
  }

  // `join(foo, '//www.example.org')`
  if (aPathUrl && !aPathUrl.scheme) {
    if (aRootUrl) {
      aPathUrl.scheme = aRootUrl.scheme;
    }
    return urlGenerate(aPathUrl);
  }

  if (aPathUrl || aPath.match(dataUrlRegexp)) {
    return aPath;
  }

  // `join('http://', 'www.example.com')`
  if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
    aRootUrl.host = aPath;
    return urlGenerate(aRootUrl);
  }

  var joined = aPath.charAt(0) === '/'
    ? aPath
    : normalize(aRoot.replace(/\/+$/, '') + '/' + aPath);

  if (aRootUrl) {
    aRootUrl.path = joined;
    return urlGenerate(aRootUrl);
  }
  return joined;
}
exports.join = join;

exports.isAbsolute = function (aPath) {
  return aPath.charAt(0) === '/' || urlRegexp.test(aPath);
};

/**
 * Make a path relative to a URL or another path.
 *
 * @param aRoot The root path or URL.
 * @param aPath The path or URL to be made relative to aRoot.
 */
function relative(aRoot, aPath) {
  if (aRoot === "") {
    aRoot = ".";
  }

  aRoot = aRoot.replace(/\/$/, '');

  // It is possible for the path to be above the root. In this case, simply
  // checking whether the root is a prefix of the path won't work. Instead, we
  // need to remove components from the root one by one, until either we find
  // a prefix that fits, or we run out of components to remove.
  var level = 0;
  while (aPath.indexOf(aRoot + '/') !== 0) {
    var index = aRoot.lastIndexOf("/");
    if (index < 0) {
      return aPath;
    }

    // If the only part of the root that is left is the scheme (i.e. http://,
    // file:///, etc.), one or more slashes (/), or simply nothing at all, we
    // have exhausted all components, so the path is not relative to the root.
    aRoot = aRoot.slice(0, index);
    if (aRoot.match(/^([^\/]+:\/)?\/*$/)) {
      return aPath;
    }

    ++level;
  }

  // Make sure we add a "../" for each component we removed from the root.
  return Array(level + 1).join("../") + aPath.substr(aRoot.length + 1);
}
exports.relative = relative;

var supportsNullProto = (function () {
  var obj = Object.create(null);
  return !('__proto__' in obj);
}());

function identity (s) {
  return s;
}

/**
 * Because behavior goes wacky when you set `__proto__` on objects, we
 * have to prefix all the strings in our set with an arbitrary character.
 *
 * See https://github.com/mozilla/source-map/pull/31 and
 * https://github.com/mozilla/source-map/issues/30
 *
 * @param String aStr
 */
function toSetString(aStr) {
  if (isProtoString(aStr)) {
    return '$' + aStr;
  }

  return aStr;
}
exports.toSetString = supportsNullProto ? identity : toSetString;

function fromSetString(aStr) {
  if (isProtoString(aStr)) {
    return aStr.slice(1);
  }

  return aStr;
}
exports.fromSetString = supportsNullProto ? identity : fromSetString;

function isProtoString(s) {
  if (!s) {
    return false;
  }

  var length = s.length;

  if (length < 9 /* "__proto__".length */) {
    return false;
  }

  if (s.charCodeAt(length - 1) !== 95  /* '_' */ ||
      s.charCodeAt(length - 2) !== 95  /* '_' */ ||
      s.charCodeAt(length - 3) !== 111 /* 'o' */ ||
      s.charCodeAt(length - 4) !== 116 /* 't' */ ||
      s.charCodeAt(length - 5) !== 111 /* 'o' */ ||
      s.charCodeAt(length - 6) !== 114 /* 'r' */ ||
      s.charCodeAt(length - 7) !== 112 /* 'p' */ ||
      s.charCodeAt(length - 8) !== 95  /* '_' */ ||
      s.charCodeAt(length - 9) !== 95  /* '_' */) {
    return false;
  }

  for (var i = length - 10; i >= 0; i--) {
    if (s.charCodeAt(i) !== 36 /* '$' */) {
      return false;
    }
  }

  return true;
}

/**
 * Comparator between two mappings where the original positions are compared.
 *
 * Optionally pass in `true` as `onlyCompareGenerated` to consider two
 * mappings with the same original source/line/column, but different generated
 * line and column the same. Useful when searching for a mapping with a
 * stubbed out mapping.
 */
function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
  var cmp = strcmp(mappingA.source, mappingB.source);
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0 || onlyCompareOriginal) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  return strcmp(mappingA.name, mappingB.name);
}
exports.compareByOriginalPositions = compareByOriginalPositions;

/**
 * Comparator between two mappings with deflated source and name indices where
 * the generated positions are compared.
 *
 * Optionally pass in `true` as `onlyCompareGenerated` to consider two
 * mappings with the same generated line and column, but different
 * source/name/original line and column the same. Useful when searching for a
 * mapping with a stubbed out mapping.
 */
function compareByGeneratedPositionsDeflated(mappingA, mappingB, onlyCompareGenerated) {
  var cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0 || onlyCompareGenerated) {
    return cmp;
  }

  cmp = strcmp(mappingA.source, mappingB.source);
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0) {
    return cmp;
  }

  return strcmp(mappingA.name, mappingB.name);
}
exports.compareByGeneratedPositionsDeflated = compareByGeneratedPositionsDeflated;

function strcmp(aStr1, aStr2) {
  if (aStr1 === aStr2) {
    return 0;
  }

  if (aStr1 === null) {
    return 1; // aStr2 !== null
  }

  if (aStr2 === null) {
    return -1; // aStr1 !== null
  }

  if (aStr1 > aStr2) {
    return 1;
  }

  return -1;
}

/**
 * Comparator between two mappings with inflated source and name strings where
 * the generated positions are compared.
 */
function compareByGeneratedPositionsInflated(mappingA, mappingB) {
  var cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = strcmp(mappingA.source, mappingB.source);
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0) {
    return cmp;
  }

  return strcmp(mappingA.name, mappingB.name);
}
exports.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated;

/**
 * Strip any JSON XSSI avoidance prefix from the string (as documented
 * in the source maps specification), and then parse the string as
 * JSON.
 */
function parseSourceMapInput(str) {
  return JSON.parse(str.replace(/^\)]}'[^\n]*\n/, ''));
}
exports.parseSourceMapInput = parseSourceMapInput;

/**
 * Compute the URL of a source given the the source root, the source's
 * URL, and the source map's URL.
 */
function computeSourceURL(sourceRoot, sourceURL, sourceMapURL) {
  sourceURL = sourceURL || '';

  if (sourceRoot) {
    // This follows what Chrome does.
    if (sourceRoot[sourceRoot.length - 1] !== '/' && sourceURL[0] !== '/') {
      sourceRoot += '/';
    }
    // The spec says:
    //   Line 4: An optional source root, useful for relocating source
    //   files on a server or removing repeated values in the
    //   “sources” entry.  This value is prepended to the individual
    //   entries in the “source” field.
    sourceURL = sourceRoot + sourceURL;
  }

  // Historically, SourceMapConsumer did not take the sourceMapURL as
  // a parameter.  This mode is still somewhat supported, which is why
  // this code block is conditional.  However, it's preferable to pass
  // the source map URL to SourceMapConsumer, so that this function
  // can implement the source URL resolution algorithm as outlined in
  // the spec.  This block is basically the equivalent of:
  //    new URL(sourceURL, sourceMapURL).toString()
  // ... except it avoids using URL, which wasn't available in the
  // older releases of node still supported by this library.
  //
  // The spec says:
  //   If the sources are not absolute URLs after prepending of the
  //   “sourceRoot”, the sources are resolved relative to the
  //   SourceMap (like resolving script src in a html document).
  if (sourceMapURL) {
    var parsed = urlParse(sourceMapURL);
    if (!parsed) {
      throw new Error("sourceMapURL could not be parsed");
    }
    if (parsed.path) {
      // Strip the last path component, but keep the "/".
      var index = parsed.path.lastIndexOf('/');
      if (index >= 0) {
        parsed.path = parsed.path.substring(0, index + 1);
      }
    }
    sourceURL = join(urlGenerate(parsed), sourceURL);
  }

  return normalize(sourceURL);
}
exports.computeSourceURL = computeSourceURL;

},{}],58:[function(require,module,exports){
/*
 * Copyright 2009-2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE.txt or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
exports.SourceMapGenerator = require('./lib/source-map-generator').SourceMapGenerator;
exports.SourceMapConsumer = require('./lib/source-map-consumer').SourceMapConsumer;
exports.SourceNode = require('./lib/source-node').SourceNode;

},{"./lib/source-map-consumer":54,"./lib/source-map-generator":55,"./lib/source-node":56}],59:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],60:[function(require,module,exports){
arguments[4][48][0].apply(exports,arguments)
},{"./util":69,"dup":48}],61:[function(require,module,exports){
arguments[4][49][0].apply(exports,arguments)
},{"./base64":62,"dup":49}],62:[function(require,module,exports){
arguments[4][50][0].apply(exports,arguments)
},{"dup":50}],63:[function(require,module,exports){
arguments[4][51][0].apply(exports,arguments)
},{"dup":51}],64:[function(require,module,exports){
arguments[4][52][0].apply(exports,arguments)
},{"./util":69,"dup":52}],65:[function(require,module,exports){
arguments[4][53][0].apply(exports,arguments)
},{"dup":53}],66:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var util = require('./util');
var binarySearch = require('./binary-search');
var ArraySet = require('./array-set').ArraySet;
var base64VLQ = require('./base64-vlq');
var quickSort = require('./quick-sort').quickSort;

function SourceMapConsumer(aSourceMap) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
  }

  return sourceMap.sections != null
    ? new IndexedSourceMapConsumer(sourceMap)
    : new BasicSourceMapConsumer(sourceMap);
}

SourceMapConsumer.fromSourceMap = function(aSourceMap) {
  return BasicSourceMapConsumer.fromSourceMap(aSourceMap);
}

/**
 * The version of the source mapping spec that we are consuming.
 */
SourceMapConsumer.prototype._version = 3;

// `__generatedMappings` and `__originalMappings` are arrays that hold the
// parsed mapping coordinates from the source map's "mappings" attribute. They
// are lazily instantiated, accessed via the `_generatedMappings` and
// `_originalMappings` getters respectively, and we only parse the mappings
// and create these arrays once queried for a source location. We jump through
// these hoops because there can be many thousands of mappings, and parsing
// them is expensive, so we only want to do it if we must.
//
// Each object in the arrays is of the form:
//
//     {
//       generatedLine: The line number in the generated code,
//       generatedColumn: The column number in the generated code,
//       source: The path to the original source file that generated this
//               chunk of code,
//       originalLine: The line number in the original source that
//                     corresponds to this chunk of generated code,
//       originalColumn: The column number in the original source that
//                       corresponds to this chunk of generated code,
//       name: The name of the original symbol which generated this chunk of
//             code.
//     }
//
// All properties except for `generatedLine` and `generatedColumn` can be
// `null`.
//
// `_generatedMappings` is ordered by the generated positions.
//
// `_originalMappings` is ordered by the original positions.

SourceMapConsumer.prototype.__generatedMappings = null;
Object.defineProperty(SourceMapConsumer.prototype, '_generatedMappings', {
  get: function () {
    if (!this.__generatedMappings) {
      this._parseMappings(this._mappings, this.sourceRoot);
    }

    return this.__generatedMappings;
  }
});

SourceMapConsumer.prototype.__originalMappings = null;
Object.defineProperty(SourceMapConsumer.prototype, '_originalMappings', {
  get: function () {
    if (!this.__originalMappings) {
      this._parseMappings(this._mappings, this.sourceRoot);
    }

    return this.__originalMappings;
  }
});

SourceMapConsumer.prototype._charIsMappingSeparator =
  function SourceMapConsumer_charIsMappingSeparator(aStr, index) {
    var c = aStr.charAt(index);
    return c === ";" || c === ",";
  };

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
SourceMapConsumer.prototype._parseMappings =
  function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    throw new Error("Subclasses must implement _parseMappings");
  };

SourceMapConsumer.GENERATED_ORDER = 1;
SourceMapConsumer.ORIGINAL_ORDER = 2;

SourceMapConsumer.GREATEST_LOWER_BOUND = 1;
SourceMapConsumer.LEAST_UPPER_BOUND = 2;

/**
 * Iterate over each mapping between an original source/line/column and a
 * generated line/column in this source map.
 *
 * @param Function aCallback
 *        The function that is called with each mapping.
 * @param Object aContext
 *        Optional. If specified, this object will be the value of `this` every
 *        time that `aCallback` is called.
 * @param aOrder
 *        Either `SourceMapConsumer.GENERATED_ORDER` or
 *        `SourceMapConsumer.ORIGINAL_ORDER`. Specifies whether you want to
 *        iterate over the mappings sorted by the generated file's line/column
 *        order or the original's source/line/column order, respectively. Defaults to
 *        `SourceMapConsumer.GENERATED_ORDER`.
 */
SourceMapConsumer.prototype.eachMapping =
  function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
    var context = aContext || null;
    var order = aOrder || SourceMapConsumer.GENERATED_ORDER;

    var mappings;
    switch (order) {
    case SourceMapConsumer.GENERATED_ORDER:
      mappings = this._generatedMappings;
      break;
    case SourceMapConsumer.ORIGINAL_ORDER:
      mappings = this._originalMappings;
      break;
    default:
      throw new Error("Unknown order of iteration.");
    }

    var sourceRoot = this.sourceRoot;
    mappings.map(function (mapping) {
      var source = mapping.source === null ? null : this._sources.at(mapping.source);
      if (source != null && sourceRoot != null) {
        source = util.join(sourceRoot, source);
      }
      return {
        source: source,
        generatedLine: mapping.generatedLine,
        generatedColumn: mapping.generatedColumn,
        originalLine: mapping.originalLine,
        originalColumn: mapping.originalColumn,
        name: mapping.name === null ? null : this._names.at(mapping.name)
      };
    }, this).forEach(aCallback, context);
  };

/**
 * Returns all generated line and column information for the original source,
 * line, and column provided. If no column is provided, returns all mappings
 * corresponding to a either the line we are searching for or the next
 * closest line that has any mappings. Otherwise, returns all mappings
 * corresponding to the given line and either the column we are searching for
 * or the next closest column that has any offsets.
 *
 * The only argument is an object with the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.
 *   - column: Optional. the column number in the original source.
 *
 * and an array of objects is returned, each with the following properties:
 *
 *   - line: The line number in the generated source, or null.
 *   - column: The column number in the generated source, or null.
 */
SourceMapConsumer.prototype.allGeneratedPositionsFor =
  function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
    var line = util.getArg(aArgs, 'line');

    // When there is no exact match, BasicSourceMapConsumer.prototype._findMapping
    // returns the index of the closest mapping less than the needle. By
    // setting needle.originalColumn to 0, we thus find the last mapping for
    // the given line, provided such a mapping exists.
    var needle = {
      source: util.getArg(aArgs, 'source'),
      originalLine: line,
      originalColumn: util.getArg(aArgs, 'column', 0)
    };

    if (this.sourceRoot != null) {
      needle.source = util.relative(this.sourceRoot, needle.source);
    }
    if (!this._sources.has(needle.source)) {
      return [];
    }
    needle.source = this._sources.indexOf(needle.source);

    var mappings = [];

    var index = this._findMapping(needle,
                                  this._originalMappings,
                                  "originalLine",
                                  "originalColumn",
                                  util.compareByOriginalPositions,
                                  binarySearch.LEAST_UPPER_BOUND);
    if (index >= 0) {
      var mapping = this._originalMappings[index];

      if (aArgs.column === undefined) {
        var originalLine = mapping.originalLine;

        // Iterate until either we run out of mappings, or we run into
        // a mapping for a different line than the one we found. Since
        // mappings are sorted, this is guaranteed to find all mappings for
        // the line we found.
        while (mapping && mapping.originalLine === originalLine) {
          mappings.push({
            line: util.getArg(mapping, 'generatedLine', null),
            column: util.getArg(mapping, 'generatedColumn', null),
            lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
          });

          mapping = this._originalMappings[++index];
        }
      } else {
        var originalColumn = mapping.originalColumn;

        // Iterate until either we run out of mappings, or we run into
        // a mapping for a different line than the one we were searching for.
        // Since mappings are sorted, this is guaranteed to find all mappings for
        // the line we are searching for.
        while (mapping &&
               mapping.originalLine === line &&
               mapping.originalColumn == originalColumn) {
          mappings.push({
            line: util.getArg(mapping, 'generatedLine', null),
            column: util.getArg(mapping, 'generatedColumn', null),
            lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
          });

          mapping = this._originalMappings[++index];
        }
      }
    }

    return mappings;
  };

exports.SourceMapConsumer = SourceMapConsumer;

/**
 * A BasicSourceMapConsumer instance represents a parsed source map which we can
 * query for information about the original file positions by giving it a file
 * position in the generated source.
 *
 * The only parameter is the raw source map (either as a JSON string, or
 * already parsed to an object). According to the spec, source maps have the
 * following attributes:
 *
 *   - version: Which version of the source map spec this map is following.
 *   - sources: An array of URLs to the original source files.
 *   - names: An array of identifiers which can be referrenced by individual mappings.
 *   - sourceRoot: Optional. The URL root from which all sources are relative.
 *   - sourcesContent: Optional. An array of contents of the original source files.
 *   - mappings: A string of base64 VLQs which contain the actual mappings.
 *   - file: Optional. The generated file this source map is associated with.
 *
 * Here is an example source map, taken from the source map spec[0]:
 *
 *     {
 *       version : 3,
 *       file: "out.js",
 *       sourceRoot : "",
 *       sources: ["foo.js", "bar.js"],
 *       names: ["src", "maps", "are", "fun"],
 *       mappings: "AA,AB;;ABCDE;"
 *     }
 *
 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?pli=1#
 */
function BasicSourceMapConsumer(aSourceMap) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
  }

  var version = util.getArg(sourceMap, 'version');
  var sources = util.getArg(sourceMap, 'sources');
  // Sass 3.3 leaves out the 'names' array, so we deviate from the spec (which
  // requires the array) to play nice here.
  var names = util.getArg(sourceMap, 'names', []);
  var sourceRoot = util.getArg(sourceMap, 'sourceRoot', null);
  var sourcesContent = util.getArg(sourceMap, 'sourcesContent', null);
  var mappings = util.getArg(sourceMap, 'mappings');
  var file = util.getArg(sourceMap, 'file', null);

  // Once again, Sass deviates from the spec and supplies the version as a
  // string rather than a number, so we use loose equality checking here.
  if (version != this._version) {
    throw new Error('Unsupported version: ' + version);
  }

  sources = sources
    .map(String)
    // Some source maps produce relative source paths like "./foo.js" instead of
    // "foo.js".  Normalize these first so that future comparisons will succeed.
    // See bugzil.la/1090768.
    .map(util.normalize)
    // Always ensure that absolute sources are internally stored relative to
    // the source root, if the source root is absolute. Not doing this would
    // be particularly problematic when the source root is a prefix of the
    // source (valid, but why??). See github issue #199 and bugzil.la/1188982.
    .map(function (source) {
      return sourceRoot && util.isAbsolute(sourceRoot) && util.isAbsolute(source)
        ? util.relative(sourceRoot, source)
        : source;
    });

  // Pass `true` below to allow duplicate names and sources. While source maps
  // are intended to be compressed and deduplicated, the TypeScript compiler
  // sometimes generates source maps with duplicates in them. See Github issue
  // #72 and bugzil.la/889492.
  this._names = ArraySet.fromArray(names.map(String), true);
  this._sources = ArraySet.fromArray(sources, true);

  this.sourceRoot = sourceRoot;
  this.sourcesContent = sourcesContent;
  this._mappings = mappings;
  this.file = file;
}

BasicSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
BasicSourceMapConsumer.prototype.consumer = SourceMapConsumer;

/**
 * Create a BasicSourceMapConsumer from a SourceMapGenerator.
 *
 * @param SourceMapGenerator aSourceMap
 *        The source map that will be consumed.
 * @returns BasicSourceMapConsumer
 */
BasicSourceMapConsumer.fromSourceMap =
  function SourceMapConsumer_fromSourceMap(aSourceMap) {
    var smc = Object.create(BasicSourceMapConsumer.prototype);

    var names = smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true);
    var sources = smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true);
    smc.sourceRoot = aSourceMap._sourceRoot;
    smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(),
                                                            smc.sourceRoot);
    smc.file = aSourceMap._file;

    // Because we are modifying the entries (by converting string sources and
    // names to indices into the sources and names ArraySets), we have to make
    // a copy of the entry or else bad things happen. Shared mutable state
    // strikes again! See github issue #191.

    var generatedMappings = aSourceMap._mappings.toArray().slice();
    var destGeneratedMappings = smc.__generatedMappings = [];
    var destOriginalMappings = smc.__originalMappings = [];

    for (var i = 0, length = generatedMappings.length; i < length; i++) {
      var srcMapping = generatedMappings[i];
      var destMapping = new Mapping;
      destMapping.generatedLine = srcMapping.generatedLine;
      destMapping.generatedColumn = srcMapping.generatedColumn;

      if (srcMapping.source) {
        destMapping.source = sources.indexOf(srcMapping.source);
        destMapping.originalLine = srcMapping.originalLine;
        destMapping.originalColumn = srcMapping.originalColumn;

        if (srcMapping.name) {
          destMapping.name = names.indexOf(srcMapping.name);
        }

        destOriginalMappings.push(destMapping);
      }

      destGeneratedMappings.push(destMapping);
    }

    quickSort(smc.__originalMappings, util.compareByOriginalPositions);

    return smc;
  };

/**
 * The version of the source mapping spec that we are consuming.
 */
BasicSourceMapConsumer.prototype._version = 3;

/**
 * The list of original sources.
 */
Object.defineProperty(BasicSourceMapConsumer.prototype, 'sources', {
  get: function () {
    return this._sources.toArray().map(function (s) {
      return this.sourceRoot != null ? util.join(this.sourceRoot, s) : s;
    }, this);
  }
});

/**
 * Provide the JIT with a nice shape / hidden class.
 */
function Mapping() {
  this.generatedLine = 0;
  this.generatedColumn = 0;
  this.source = null;
  this.originalLine = null;
  this.originalColumn = null;
  this.name = null;
}

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
BasicSourceMapConsumer.prototype._parseMappings =
  function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    var generatedLine = 1;
    var previousGeneratedColumn = 0;
    var previousOriginalLine = 0;
    var previousOriginalColumn = 0;
    var previousSource = 0;
    var previousName = 0;
    var length = aStr.length;
    var index = 0;
    var cachedSegments = {};
    var temp = {};
    var originalMappings = [];
    var generatedMappings = [];
    var mapping, str, segment, end, value;

    while (index < length) {
      if (aStr.charAt(index) === ';') {
        generatedLine++;
        index++;
        previousGeneratedColumn = 0;
      }
      else if (aStr.charAt(index) === ',') {
        index++;
      }
      else {
        mapping = new Mapping();
        mapping.generatedLine = generatedLine;

        // Because each offset is encoded relative to the previous one,
        // many segments often have the same encoding. We can exploit this
        // fact by caching the parsed variable length fields of each segment,
        // allowing us to avoid a second parse if we encounter the same
        // segment again.
        for (end = index; end < length; end++) {
          if (this._charIsMappingSeparator(aStr, end)) {
            break;
          }
        }
        str = aStr.slice(index, end);

        segment = cachedSegments[str];
        if (segment) {
          index += str.length;
        } else {
          segment = [];
          while (index < end) {
            base64VLQ.decode(aStr, index, temp);
            value = temp.value;
            index = temp.rest;
            segment.push(value);
          }

          if (segment.length === 2) {
            throw new Error('Found a source, but no line and column');
          }

          if (segment.length === 3) {
            throw new Error('Found a source and line, but no column');
          }

          cachedSegments[str] = segment;
        }

        // Generated column.
        mapping.generatedColumn = previousGeneratedColumn + segment[0];
        previousGeneratedColumn = mapping.generatedColumn;

        if (segment.length > 1) {
          // Original source.
          mapping.source = previousSource + segment[1];
          previousSource += segment[1];

          // Original line.
          mapping.originalLine = previousOriginalLine + segment[2];
          previousOriginalLine = mapping.originalLine;
          // Lines are stored 0-based
          mapping.originalLine += 1;

          // Original column.
          mapping.originalColumn = previousOriginalColumn + segment[3];
          previousOriginalColumn = mapping.originalColumn;

          if (segment.length > 4) {
            // Original name.
            mapping.name = previousName + segment[4];
            previousName += segment[4];
          }
        }

        generatedMappings.push(mapping);
        if (typeof mapping.originalLine === 'number') {
          originalMappings.push(mapping);
        }
      }
    }

    quickSort(generatedMappings, util.compareByGeneratedPositionsDeflated);
    this.__generatedMappings = generatedMappings;

    quickSort(originalMappings, util.compareByOriginalPositions);
    this.__originalMappings = originalMappings;
  };

/**
 * Find the mapping that best matches the hypothetical "needle" mapping that
 * we are searching for in the given "haystack" of mappings.
 */
BasicSourceMapConsumer.prototype._findMapping =
  function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName,
                                         aColumnName, aComparator, aBias) {
    // To return the position we are searching for, we must first find the
    // mapping for the given position and then return the opposite position it
    // points to. Because the mappings are sorted, we can use binary search to
    // find the best mapping.

    if (aNeedle[aLineName] <= 0) {
      throw new TypeError('Line must be greater than or equal to 1, got '
                          + aNeedle[aLineName]);
    }
    if (aNeedle[aColumnName] < 0) {
      throw new TypeError('Column must be greater than or equal to 0, got '
                          + aNeedle[aColumnName]);
    }

    return binarySearch.search(aNeedle, aMappings, aComparator, aBias);
  };

/**
 * Compute the last column for each generated mapping. The last column is
 * inclusive.
 */
BasicSourceMapConsumer.prototype.computeColumnSpans =
  function SourceMapConsumer_computeColumnSpans() {
    for (var index = 0; index < this._generatedMappings.length; ++index) {
      var mapping = this._generatedMappings[index];

      // Mappings do not contain a field for the last generated columnt. We
      // can come up with an optimistic estimate, however, by assuming that
      // mappings are contiguous (i.e. given two consecutive mappings, the
      // first mapping ends where the second one starts).
      if (index + 1 < this._generatedMappings.length) {
        var nextMapping = this._generatedMappings[index + 1];

        if (mapping.generatedLine === nextMapping.generatedLine) {
          mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
          continue;
        }
      }

      // The last mapping for each line spans the entire line.
      mapping.lastGeneratedColumn = Infinity;
    }
  };

/**
 * Returns the original source, line, and column information for the generated
 * source's line and column positions provided. The only argument is an object
 * with the following properties:
 *
 *   - line: The line number in the generated source.
 *   - column: The column number in the generated source.
 *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
 *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
 *
 * and an object is returned with the following properties:
 *
 *   - source: The original source file, or null.
 *   - line: The line number in the original source, or null.
 *   - column: The column number in the original source, or null.
 *   - name: The original identifier, or null.
 */
BasicSourceMapConsumer.prototype.originalPositionFor =
  function SourceMapConsumer_originalPositionFor(aArgs) {
    var needle = {
      generatedLine: util.getArg(aArgs, 'line'),
      generatedColumn: util.getArg(aArgs, 'column')
    };

    var index = this._findMapping(
      needle,
      this._generatedMappings,
      "generatedLine",
      "generatedColumn",
      util.compareByGeneratedPositionsDeflated,
      util.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND)
    );

    if (index >= 0) {
      var mapping = this._generatedMappings[index];

      if (mapping.generatedLine === needle.generatedLine) {
        var source = util.getArg(mapping, 'source', null);
        if (source !== null) {
          source = this._sources.at(source);
          if (this.sourceRoot != null) {
            source = util.join(this.sourceRoot, source);
          }
        }
        var name = util.getArg(mapping, 'name', null);
        if (name !== null) {
          name = this._names.at(name);
        }
        return {
          source: source,
          line: util.getArg(mapping, 'originalLine', null),
          column: util.getArg(mapping, 'originalColumn', null),
          name: name
        };
      }
    }

    return {
      source: null,
      line: null,
      column: null,
      name: null
    };
  };

/**
 * Return true if we have the source content for every source in the source
 * map, false otherwise.
 */
BasicSourceMapConsumer.prototype.hasContentsOfAllSources =
  function BasicSourceMapConsumer_hasContentsOfAllSources() {
    if (!this.sourcesContent) {
      return false;
    }
    return this.sourcesContent.length >= this._sources.size() &&
      !this.sourcesContent.some(function (sc) { return sc == null; });
  };

/**
 * Returns the original source content. The only argument is the url of the
 * original source file. Returns null if no original source content is
 * available.
 */
BasicSourceMapConsumer.prototype.sourceContentFor =
  function SourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
    if (!this.sourcesContent) {
      return null;
    }

    if (this.sourceRoot != null) {
      aSource = util.relative(this.sourceRoot, aSource);
    }

    if (this._sources.has(aSource)) {
      return this.sourcesContent[this._sources.indexOf(aSource)];
    }

    var url;
    if (this.sourceRoot != null
        && (url = util.urlParse(this.sourceRoot))) {
      // XXX: file:// URIs and absolute paths lead to unexpected behavior for
      // many users. We can help them out when they expect file:// URIs to
      // behave like it would if they were running a local HTTP server. See
      // https://bugzilla.mozilla.org/show_bug.cgi?id=885597.
      var fileUriAbsPath = aSource.replace(/^file:\/\//, "");
      if (url.scheme == "file"
          && this._sources.has(fileUriAbsPath)) {
        return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)]
      }

      if ((!url.path || url.path == "/")
          && this._sources.has("/" + aSource)) {
        return this.sourcesContent[this._sources.indexOf("/" + aSource)];
      }
    }

    // This function is used recursively from
    // IndexedSourceMapConsumer.prototype.sourceContentFor. In that case, we
    // don't want to throw if we can't find the source - we just want to
    // return null, so we provide a flag to exit gracefully.
    if (nullOnMissing) {
      return null;
    }
    else {
      throw new Error('"' + aSource + '" is not in the SourceMap.');
    }
  };

/**
 * Returns the generated line and column information for the original source,
 * line, and column positions provided. The only argument is an object with
 * the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.
 *   - column: The column number in the original source.
 *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
 *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
 *
 * and an object is returned with the following properties:
 *
 *   - line: The line number in the generated source, or null.
 *   - column: The column number in the generated source, or null.
 */
BasicSourceMapConsumer.prototype.generatedPositionFor =
  function SourceMapConsumer_generatedPositionFor(aArgs) {
    var source = util.getArg(aArgs, 'source');
    if (this.sourceRoot != null) {
      source = util.relative(this.sourceRoot, source);
    }
    if (!this._sources.has(source)) {
      return {
        line: null,
        column: null,
        lastColumn: null
      };
    }
    source = this._sources.indexOf(source);

    var needle = {
      source: source,
      originalLine: util.getArg(aArgs, 'line'),
      originalColumn: util.getArg(aArgs, 'column')
    };

    var index = this._findMapping(
      needle,
      this._originalMappings,
      "originalLine",
      "originalColumn",
      util.compareByOriginalPositions,
      util.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND)
    );

    if (index >= 0) {
      var mapping = this._originalMappings[index];

      if (mapping.source === needle.source) {
        return {
          line: util.getArg(mapping, 'generatedLine', null),
          column: util.getArg(mapping, 'generatedColumn', null),
          lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
        };
      }
    }

    return {
      line: null,
      column: null,
      lastColumn: null
    };
  };

exports.BasicSourceMapConsumer = BasicSourceMapConsumer;

/**
 * An IndexedSourceMapConsumer instance represents a parsed source map which
 * we can query for information. It differs from BasicSourceMapConsumer in
 * that it takes "indexed" source maps (i.e. ones with a "sections" field) as
 * input.
 *
 * The only parameter is a raw source map (either as a JSON string, or already
 * parsed to an object). According to the spec for indexed source maps, they
 * have the following attributes:
 *
 *   - version: Which version of the source map spec this map is following.
 *   - file: Optional. The generated file this source map is associated with.
 *   - sections: A list of section definitions.
 *
 * Each value under the "sections" field has two fields:
 *   - offset: The offset into the original specified at which this section
 *       begins to apply, defined as an object with a "line" and "column"
 *       field.
 *   - map: A source map definition. This source map could also be indexed,
 *       but doesn't have to be.
 *
 * Instead of the "map" field, it's also possible to have a "url" field
 * specifying a URL to retrieve a source map from, but that's currently
 * unsupported.
 *
 * Here's an example source map, taken from the source map spec[0], but
 * modified to omit a section which uses the "url" field.
 *
 *  {
 *    version : 3,
 *    file: "app.js",
 *    sections: [{
 *      offset: {line:100, column:10},
 *      map: {
 *        version : 3,
 *        file: "section.js",
 *        sources: ["foo.js", "bar.js"],
 *        names: ["src", "maps", "are", "fun"],
 *        mappings: "AAAA,E;;ABCDE;"
 *      }
 *    }],
 *  }
 *
 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit#heading=h.535es3xeprgt
 */
function IndexedSourceMapConsumer(aSourceMap) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
  }

  var version = util.getArg(sourceMap, 'version');
  var sections = util.getArg(sourceMap, 'sections');

  if (version != this._version) {
    throw new Error('Unsupported version: ' + version);
  }

  this._sources = new ArraySet();
  this._names = new ArraySet();

  var lastOffset = {
    line: -1,
    column: 0
  };
  this._sections = sections.map(function (s) {
    if (s.url) {
      // The url field will require support for asynchronicity.
      // See https://github.com/mozilla/source-map/issues/16
      throw new Error('Support for url field in sections not implemented.');
    }
    var offset = util.getArg(s, 'offset');
    var offsetLine = util.getArg(offset, 'line');
    var offsetColumn = util.getArg(offset, 'column');

    if (offsetLine < lastOffset.line ||
        (offsetLine === lastOffset.line && offsetColumn < lastOffset.column)) {
      throw new Error('Section offsets must be ordered and non-overlapping.');
    }
    lastOffset = offset;

    return {
      generatedOffset: {
        // The offset fields are 0-based, but we use 1-based indices when
        // encoding/decoding from VLQ.
        generatedLine: offsetLine + 1,
        generatedColumn: offsetColumn + 1
      },
      consumer: new SourceMapConsumer(util.getArg(s, 'map'))
    }
  });
}

IndexedSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
IndexedSourceMapConsumer.prototype.constructor = SourceMapConsumer;

/**
 * The version of the source mapping spec that we are consuming.
 */
IndexedSourceMapConsumer.prototype._version = 3;

/**
 * The list of original sources.
 */
Object.defineProperty(IndexedSourceMapConsumer.prototype, 'sources', {
  get: function () {
    var sources = [];
    for (var i = 0; i < this._sections.length; i++) {
      for (var j = 0; j < this._sections[i].consumer.sources.length; j++) {
        sources.push(this._sections[i].consumer.sources[j]);
      }
    }
    return sources;
  }
});

/**
 * Returns the original source, line, and column information for the generated
 * source's line and column positions provided. The only argument is an object
 * with the following properties:
 *
 *   - line: The line number in the generated source.
 *   - column: The column number in the generated source.
 *
 * and an object is returned with the following properties:
 *
 *   - source: The original source file, or null.
 *   - line: The line number in the original source, or null.
 *   - column: The column number in the original source, or null.
 *   - name: The original identifier, or null.
 */
IndexedSourceMapConsumer.prototype.originalPositionFor =
  function IndexedSourceMapConsumer_originalPositionFor(aArgs) {
    var needle = {
      generatedLine: util.getArg(aArgs, 'line'),
      generatedColumn: util.getArg(aArgs, 'column')
    };

    // Find the section containing the generated position we're trying to map
    // to an original position.
    var sectionIndex = binarySearch.search(needle, this._sections,
      function(needle, section) {
        var cmp = needle.generatedLine - section.generatedOffset.generatedLine;
        if (cmp) {
          return cmp;
        }

        return (needle.generatedColumn -
                section.generatedOffset.generatedColumn);
      });
    var section = this._sections[sectionIndex];

    if (!section) {
      return {
        source: null,
        line: null,
        column: null,
        name: null
      };
    }

    return section.consumer.originalPositionFor({
      line: needle.generatedLine -
        (section.generatedOffset.generatedLine - 1),
      column: needle.generatedColumn -
        (section.generatedOffset.generatedLine === needle.generatedLine
         ? section.generatedOffset.generatedColumn - 1
         : 0),
      bias: aArgs.bias
    });
  };

/**
 * Return true if we have the source content for every source in the source
 * map, false otherwise.
 */
IndexedSourceMapConsumer.prototype.hasContentsOfAllSources =
  function IndexedSourceMapConsumer_hasContentsOfAllSources() {
    return this._sections.every(function (s) {
      return s.consumer.hasContentsOfAllSources();
    });
  };

/**
 * Returns the original source content. The only argument is the url of the
 * original source file. Returns null if no original source content is
 * available.
 */
IndexedSourceMapConsumer.prototype.sourceContentFor =
  function IndexedSourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];

      var content = section.consumer.sourceContentFor(aSource, true);
      if (content) {
        return content;
      }
    }
    if (nullOnMissing) {
      return null;
    }
    else {
      throw new Error('"' + aSource + '" is not in the SourceMap.');
    }
  };

/**
 * Returns the generated line and column information for the original source,
 * line, and column positions provided. The only argument is an object with
 * the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.
 *   - column: The column number in the original source.
 *
 * and an object is returned with the following properties:
 *
 *   - line: The line number in the generated source, or null.
 *   - column: The column number in the generated source, or null.
 */
IndexedSourceMapConsumer.prototype.generatedPositionFor =
  function IndexedSourceMapConsumer_generatedPositionFor(aArgs) {
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];

      // Only consider this section if the requested source is in the list of
      // sources of the consumer.
      if (section.consumer.sources.indexOf(util.getArg(aArgs, 'source')) === -1) {
        continue;
      }
      var generatedPosition = section.consumer.generatedPositionFor(aArgs);
      if (generatedPosition) {
        var ret = {
          line: generatedPosition.line +
            (section.generatedOffset.generatedLine - 1),
          column: generatedPosition.column +
            (section.generatedOffset.generatedLine === generatedPosition.line
             ? section.generatedOffset.generatedColumn - 1
             : 0)
        };
        return ret;
      }
    }

    return {
      line: null,
      column: null
    };
  };

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
IndexedSourceMapConsumer.prototype._parseMappings =
  function IndexedSourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    this.__generatedMappings = [];
    this.__originalMappings = [];
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];
      var sectionMappings = section.consumer._generatedMappings;
      for (var j = 0; j < sectionMappings.length; j++) {
        var mapping = sectionMappings[j];

        var source = section.consumer._sources.at(mapping.source);
        if (section.consumer.sourceRoot !== null) {
          source = util.join(section.consumer.sourceRoot, source);
        }
        this._sources.add(source);
        source = this._sources.indexOf(source);

        var name = section.consumer._names.at(mapping.name);
        this._names.add(name);
        name = this._names.indexOf(name);

        // The mappings coming from the consumer for the section have
        // generated positions relative to the start of the section, so we
        // need to offset them to be relative to the start of the concatenated
        // generated file.
        var adjustedMapping = {
          source: source,
          generatedLine: mapping.generatedLine +
            (section.generatedOffset.generatedLine - 1),
          generatedColumn: mapping.generatedColumn +
            (section.generatedOffset.generatedLine === mapping.generatedLine
            ? section.generatedOffset.generatedColumn - 1
            : 0),
          originalLine: mapping.originalLine,
          originalColumn: mapping.originalColumn,
          name: name
        };

        this.__generatedMappings.push(adjustedMapping);
        if (typeof adjustedMapping.originalLine === 'number') {
          this.__originalMappings.push(adjustedMapping);
        }
      }
    }

    quickSort(this.__generatedMappings, util.compareByGeneratedPositionsDeflated);
    quickSort(this.__originalMappings, util.compareByOriginalPositions);
  };

exports.IndexedSourceMapConsumer = IndexedSourceMapConsumer;

},{"./array-set":60,"./base64-vlq":61,"./binary-search":63,"./quick-sort":65,"./util":69}],67:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var base64VLQ = require('./base64-vlq');
var util = require('./util');
var ArraySet = require('./array-set').ArraySet;
var MappingList = require('./mapping-list').MappingList;

/**
 * An instance of the SourceMapGenerator represents a source map which is
 * being built incrementally. You may pass an object with the following
 * properties:
 *
 *   - file: The filename of the generated source.
 *   - sourceRoot: A root for all relative URLs in this source map.
 */
function SourceMapGenerator(aArgs) {
  if (!aArgs) {
    aArgs = {};
  }
  this._file = util.getArg(aArgs, 'file', null);
  this._sourceRoot = util.getArg(aArgs, 'sourceRoot', null);
  this._skipValidation = util.getArg(aArgs, 'skipValidation', false);
  this._sources = new ArraySet();
  this._names = new ArraySet();
  this._mappings = new MappingList();
  this._sourcesContents = null;
}

SourceMapGenerator.prototype._version = 3;

/**
 * Creates a new SourceMapGenerator based on a SourceMapConsumer
 *
 * @param aSourceMapConsumer The SourceMap.
 */
SourceMapGenerator.fromSourceMap =
  function SourceMapGenerator_fromSourceMap(aSourceMapConsumer) {
    var sourceRoot = aSourceMapConsumer.sourceRoot;
    var generator = new SourceMapGenerator({
      file: aSourceMapConsumer.file,
      sourceRoot: sourceRoot
    });
    aSourceMapConsumer.eachMapping(function (mapping) {
      var newMapping = {
        generated: {
          line: mapping.generatedLine,
          column: mapping.generatedColumn
        }
      };

      if (mapping.source != null) {
        newMapping.source = mapping.source;
        if (sourceRoot != null) {
          newMapping.source = util.relative(sourceRoot, newMapping.source);
        }

        newMapping.original = {
          line: mapping.originalLine,
          column: mapping.originalColumn
        };

        if (mapping.name != null) {
          newMapping.name = mapping.name;
        }
      }

      generator.addMapping(newMapping);
    });
    aSourceMapConsumer.sources.forEach(function (sourceFile) {
      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        generator.setSourceContent(sourceFile, content);
      }
    });
    return generator;
  };

/**
 * Add a single mapping from original source line and column to the generated
 * source's line and column for this source map being created. The mapping
 * object should have the following properties:
 *
 *   - generated: An object with the generated line and column positions.
 *   - original: An object with the original line and column positions.
 *   - source: The original source file (relative to the sourceRoot).
 *   - name: An optional original token name for this mapping.
 */
SourceMapGenerator.prototype.addMapping =
  function SourceMapGenerator_addMapping(aArgs) {
    var generated = util.getArg(aArgs, 'generated');
    var original = util.getArg(aArgs, 'original', null);
    var source = util.getArg(aArgs, 'source', null);
    var name = util.getArg(aArgs, 'name', null);

    if (!this._skipValidation) {
      this._validateMapping(generated, original, source, name);
    }

    if (source != null) {
      source = String(source);
      if (!this._sources.has(source)) {
        this._sources.add(source);
      }
    }

    if (name != null) {
      name = String(name);
      if (!this._names.has(name)) {
        this._names.add(name);
      }
    }

    this._mappings.add({
      generatedLine: generated.line,
      generatedColumn: generated.column,
      originalLine: original != null && original.line,
      originalColumn: original != null && original.column,
      source: source,
      name: name
    });
  };

/**
 * Set the source content for a source file.
 */
SourceMapGenerator.prototype.setSourceContent =
  function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
    var source = aSourceFile;
    if (this._sourceRoot != null) {
      source = util.relative(this._sourceRoot, source);
    }

    if (aSourceContent != null) {
      // Add the source content to the _sourcesContents map.
      // Create a new _sourcesContents map if the property is null.
      if (!this._sourcesContents) {
        this._sourcesContents = Object.create(null);
      }
      this._sourcesContents[util.toSetString(source)] = aSourceContent;
    } else if (this._sourcesContents) {
      // Remove the source file from the _sourcesContents map.
      // If the _sourcesContents map is empty, set the property to null.
      delete this._sourcesContents[util.toSetString(source)];
      if (Object.keys(this._sourcesContents).length === 0) {
        this._sourcesContents = null;
      }
    }
  };

/**
 * Applies the mappings of a sub-source-map for a specific source file to the
 * source map being generated. Each mapping to the supplied source file is
 * rewritten using the supplied source map. Note: The resolution for the
 * resulting mappings is the minimium of this map and the supplied map.
 *
 * @param aSourceMapConsumer The source map to be applied.
 * @param aSourceFile Optional. The filename of the source file.
 *        If omitted, SourceMapConsumer's file property will be used.
 * @param aSourceMapPath Optional. The dirname of the path to the source map
 *        to be applied. If relative, it is relative to the SourceMapConsumer.
 *        This parameter is needed when the two source maps aren't in the same
 *        directory, and the source map to be applied contains relative source
 *        paths. If so, those relative source paths need to be rewritten
 *        relative to the SourceMapGenerator.
 */
SourceMapGenerator.prototype.applySourceMap =
  function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
    var sourceFile = aSourceFile;
    // If aSourceFile is omitted, we will use the file property of the SourceMap
    if (aSourceFile == null) {
      if (aSourceMapConsumer.file == null) {
        throw new Error(
          'SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, ' +
          'or the source map\'s "file" property. Both were omitted.'
        );
      }
      sourceFile = aSourceMapConsumer.file;
    }
    var sourceRoot = this._sourceRoot;
    // Make "sourceFile" relative if an absolute Url is passed.
    if (sourceRoot != null) {
      sourceFile = util.relative(sourceRoot, sourceFile);
    }
    // Applying the SourceMap can add and remove items from the sources and
    // the names array.
    var newSources = new ArraySet();
    var newNames = new ArraySet();

    // Find mappings for the "sourceFile"
    this._mappings.unsortedForEach(function (mapping) {
      if (mapping.source === sourceFile && mapping.originalLine != null) {
        // Check if it can be mapped by the source map, then update the mapping.
        var original = aSourceMapConsumer.originalPositionFor({
          line: mapping.originalLine,
          column: mapping.originalColumn
        });
        if (original.source != null) {
          // Copy mapping
          mapping.source = original.source;
          if (aSourceMapPath != null) {
            mapping.source = util.join(aSourceMapPath, mapping.source)
          }
          if (sourceRoot != null) {
            mapping.source = util.relative(sourceRoot, mapping.source);
          }
          mapping.originalLine = original.line;
          mapping.originalColumn = original.column;
          if (original.name != null) {
            mapping.name = original.name;
          }
        }
      }

      var source = mapping.source;
      if (source != null && !newSources.has(source)) {
        newSources.add(source);
      }

      var name = mapping.name;
      if (name != null && !newNames.has(name)) {
        newNames.add(name);
      }

    }, this);
    this._sources = newSources;
    this._names = newNames;

    // Copy sourcesContents of applied map.
    aSourceMapConsumer.sources.forEach(function (sourceFile) {
      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        if (aSourceMapPath != null) {
          sourceFile = util.join(aSourceMapPath, sourceFile);
        }
        if (sourceRoot != null) {
          sourceFile = util.relative(sourceRoot, sourceFile);
        }
        this.setSourceContent(sourceFile, content);
      }
    }, this);
  };

/**
 * A mapping can have one of the three levels of data:
 *
 *   1. Just the generated position.
 *   2. The Generated position, original position, and original source.
 *   3. Generated and original position, original source, as well as a name
 *      token.
 *
 * To maintain consistency, we validate that any new mapping being added falls
 * in to one of these categories.
 */
SourceMapGenerator.prototype._validateMapping =
  function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource,
                                              aName) {
    // When aOriginal is truthy but has empty values for .line and .column,
    // it is most likely a programmer error. In this case we throw a very
    // specific error message to try to guide them the right way.
    // For example: https://github.com/Polymer/polymer-bundler/pull/519
    if (aOriginal && typeof aOriginal.line !== 'number' && typeof aOriginal.column !== 'number') {
        throw new Error(
            'original.line and original.column are not numbers -- you probably meant to omit ' +
            'the original mapping entirely and only map the generated position. If so, pass ' +
            'null for the original mapping instead of an object with empty or null values.'
        );
    }

    if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
        && aGenerated.line > 0 && aGenerated.column >= 0
        && !aOriginal && !aSource && !aName) {
      // Case 1.
      return;
    }
    else if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
             && aOriginal && 'line' in aOriginal && 'column' in aOriginal
             && aGenerated.line > 0 && aGenerated.column >= 0
             && aOriginal.line > 0 && aOriginal.column >= 0
             && aSource) {
      // Cases 2 and 3.
      return;
    }
    else {
      throw new Error('Invalid mapping: ' + JSON.stringify({
        generated: aGenerated,
        source: aSource,
        original: aOriginal,
        name: aName
      }));
    }
  };

/**
 * Serialize the accumulated mappings in to the stream of base 64 VLQs
 * specified by the source map format.
 */
SourceMapGenerator.prototype._serializeMappings =
  function SourceMapGenerator_serializeMappings() {
    var previousGeneratedColumn = 0;
    var previousGeneratedLine = 1;
    var previousOriginalColumn = 0;
    var previousOriginalLine = 0;
    var previousName = 0;
    var previousSource = 0;
    var result = '';
    var next;
    var mapping;
    var nameIdx;
    var sourceIdx;

    var mappings = this._mappings.toArray();
    for (var i = 0, len = mappings.length; i < len; i++) {
      mapping = mappings[i];
      next = ''

      if (mapping.generatedLine !== previousGeneratedLine) {
        previousGeneratedColumn = 0;
        while (mapping.generatedLine !== previousGeneratedLine) {
          next += ';';
          previousGeneratedLine++;
        }
      }
      else {
        if (i > 0) {
          if (!util.compareByGeneratedPositionsInflated(mapping, mappings[i - 1])) {
            continue;
          }
          next += ',';
        }
      }

      next += base64VLQ.encode(mapping.generatedColumn
                                 - previousGeneratedColumn);
      previousGeneratedColumn = mapping.generatedColumn;

      if (mapping.source != null) {
        sourceIdx = this._sources.indexOf(mapping.source);
        next += base64VLQ.encode(sourceIdx - previousSource);
        previousSource = sourceIdx;

        // lines are stored 0-based in SourceMap spec version 3
        next += base64VLQ.encode(mapping.originalLine - 1
                                   - previousOriginalLine);
        previousOriginalLine = mapping.originalLine - 1;

        next += base64VLQ.encode(mapping.originalColumn
                                   - previousOriginalColumn);
        previousOriginalColumn = mapping.originalColumn;

        if (mapping.name != null) {
          nameIdx = this._names.indexOf(mapping.name);
          next += base64VLQ.encode(nameIdx - previousName);
          previousName = nameIdx;
        }
      }

      result += next;
    }

    return result;
  };

SourceMapGenerator.prototype._generateSourcesContent =
  function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
    return aSources.map(function (source) {
      if (!this._sourcesContents) {
        return null;
      }
      if (aSourceRoot != null) {
        source = util.relative(aSourceRoot, source);
      }
      var key = util.toSetString(source);
      return Object.prototype.hasOwnProperty.call(this._sourcesContents, key)
        ? this._sourcesContents[key]
        : null;
    }, this);
  };

/**
 * Externalize the source map.
 */
SourceMapGenerator.prototype.toJSON =
  function SourceMapGenerator_toJSON() {
    var map = {
      version: this._version,
      sources: this._sources.toArray(),
      names: this._names.toArray(),
      mappings: this._serializeMappings()
    };
    if (this._file != null) {
      map.file = this._file;
    }
    if (this._sourceRoot != null) {
      map.sourceRoot = this._sourceRoot;
    }
    if (this._sourcesContents) {
      map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
    }

    return map;
  };

/**
 * Render the source map being generated to a string.
 */
SourceMapGenerator.prototype.toString =
  function SourceMapGenerator_toString() {
    return JSON.stringify(this.toJSON());
  };

exports.SourceMapGenerator = SourceMapGenerator;

},{"./array-set":60,"./base64-vlq":61,"./mapping-list":64,"./util":69}],68:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var SourceMapGenerator = require('./source-map-generator').SourceMapGenerator;
var util = require('./util');

// Matches a Windows-style `\r\n` newline or a `\n` newline used by all other
// operating systems these days (capturing the result).
var REGEX_NEWLINE = /(\r?\n)/;

// Newline character code for charCodeAt() comparisons
var NEWLINE_CODE = 10;

// Private symbol for identifying `SourceNode`s when multiple versions of
// the source-map library are loaded. This MUST NOT CHANGE across
// versions!
var isSourceNode = "$$$isSourceNode$$$";

/**
 * SourceNodes provide a way to abstract over interpolating/concatenating
 * snippets of generated JavaScript source code while maintaining the line and
 * column information associated with the original source code.
 *
 * @param aLine The original line number.
 * @param aColumn The original column number.
 * @param aSource The original source's filename.
 * @param aChunks Optional. An array of strings which are snippets of
 *        generated JS, or other SourceNodes.
 * @param aName The original identifier.
 */
function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
  this.children = [];
  this.sourceContents = {};
  this.line = aLine == null ? null : aLine;
  this.column = aColumn == null ? null : aColumn;
  this.source = aSource == null ? null : aSource;
  this.name = aName == null ? null : aName;
  this[isSourceNode] = true;
  if (aChunks != null) this.add(aChunks);
}

/**
 * Creates a SourceNode from generated code and a SourceMapConsumer.
 *
 * @param aGeneratedCode The generated code
 * @param aSourceMapConsumer The SourceMap for the generated code
 * @param aRelativePath Optional. The path that relative sources in the
 *        SourceMapConsumer should be relative to.
 */
SourceNode.fromStringWithSourceMap =
  function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer, aRelativePath) {
    // The SourceNode we want to fill with the generated code
    // and the SourceMap
    var node = new SourceNode();

    // All even indices of this array are one line of the generated code,
    // while all odd indices are the newlines between two adjacent lines
    // (since `REGEX_NEWLINE` captures its match).
    // Processed fragments are accessed by calling `shiftNextLine`.
    var remainingLines = aGeneratedCode.split(REGEX_NEWLINE);
    var remainingLinesIndex = 0;
    var shiftNextLine = function() {
      var lineContents = getNextLine();
      // The last line of a file might not have a newline.
      var newLine = getNextLine() || "";
      return lineContents + newLine;

      function getNextLine() {
        return remainingLinesIndex < remainingLines.length ?
            remainingLines[remainingLinesIndex++] : undefined;
      }
    };

    // We need to remember the position of "remainingLines"
    var lastGeneratedLine = 1, lastGeneratedColumn = 0;

    // The generate SourceNodes we need a code range.
    // To extract it current and last mapping is used.
    // Here we store the last mapping.
    var lastMapping = null;

    aSourceMapConsumer.eachMapping(function (mapping) {
      if (lastMapping !== null) {
        // We add the code from "lastMapping" to "mapping":
        // First check if there is a new line in between.
        if (lastGeneratedLine < mapping.generatedLine) {
          // Associate first line with "lastMapping"
          addMappingWithCode(lastMapping, shiftNextLine());
          lastGeneratedLine++;
          lastGeneratedColumn = 0;
          // The remaining code is added without mapping
        } else {
          // There is no new line in between.
          // Associate the code between "lastGeneratedColumn" and
          // "mapping.generatedColumn" with "lastMapping"
          var nextLine = remainingLines[remainingLinesIndex];
          var code = nextLine.substr(0, mapping.generatedColumn -
                                        lastGeneratedColumn);
          remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn -
                                              lastGeneratedColumn);
          lastGeneratedColumn = mapping.generatedColumn;
          addMappingWithCode(lastMapping, code);
          // No more remaining code, continue
          lastMapping = mapping;
          return;
        }
      }
      // We add the generated code until the first mapping
      // to the SourceNode without any mapping.
      // Each line is added as separate string.
      while (lastGeneratedLine < mapping.generatedLine) {
        node.add(shiftNextLine());
        lastGeneratedLine++;
      }
      if (lastGeneratedColumn < mapping.generatedColumn) {
        var nextLine = remainingLines[remainingLinesIndex];
        node.add(nextLine.substr(0, mapping.generatedColumn));
        remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn);
        lastGeneratedColumn = mapping.generatedColumn;
      }
      lastMapping = mapping;
    }, this);
    // We have processed all mappings.
    if (remainingLinesIndex < remainingLines.length) {
      if (lastMapping) {
        // Associate the remaining code in the current line with "lastMapping"
        addMappingWithCode(lastMapping, shiftNextLine());
      }
      // and add the remaining lines without any mapping
      node.add(remainingLines.splice(remainingLinesIndex).join(""));
    }

    // Copy sourcesContent into SourceNode
    aSourceMapConsumer.sources.forEach(function (sourceFile) {
      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        if (aRelativePath != null) {
          sourceFile = util.join(aRelativePath, sourceFile);
        }
        node.setSourceContent(sourceFile, content);
      }
    });

    return node;

    function addMappingWithCode(mapping, code) {
      if (mapping === null || mapping.source === undefined) {
        node.add(code);
      } else {
        var source = aRelativePath
          ? util.join(aRelativePath, mapping.source)
          : mapping.source;
        node.add(new SourceNode(mapping.originalLine,
                                mapping.originalColumn,
                                source,
                                code,
                                mapping.name));
      }
    }
  };

/**
 * Add a chunk of generated JS to this source node.
 *
 * @param aChunk A string snippet of generated JS code, another instance of
 *        SourceNode, or an array where each member is one of those things.
 */
SourceNode.prototype.add = function SourceNode_add(aChunk) {
  if (Array.isArray(aChunk)) {
    aChunk.forEach(function (chunk) {
      this.add(chunk);
    }, this);
  }
  else if (aChunk[isSourceNode] || typeof aChunk === "string") {
    if (aChunk) {
      this.children.push(aChunk);
    }
  }
  else {
    throw new TypeError(
      "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
    );
  }
  return this;
};

/**
 * Add a chunk of generated JS to the beginning of this source node.
 *
 * @param aChunk A string snippet of generated JS code, another instance of
 *        SourceNode, or an array where each member is one of those things.
 */
SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
  if (Array.isArray(aChunk)) {
    for (var i = aChunk.length-1; i >= 0; i--) {
      this.prepend(aChunk[i]);
    }
  }
  else if (aChunk[isSourceNode] || typeof aChunk === "string") {
    this.children.unshift(aChunk);
  }
  else {
    throw new TypeError(
      "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
    );
  }
  return this;
};

/**
 * Walk over the tree of JS snippets in this node and its children. The
 * walking function is called once for each snippet of JS and is passed that
 * snippet and the its original associated source's line/column location.
 *
 * @param aFn The traversal function.
 */
SourceNode.prototype.walk = function SourceNode_walk(aFn) {
  var chunk;
  for (var i = 0, len = this.children.length; i < len; i++) {
    chunk = this.children[i];
    if (chunk[isSourceNode]) {
      chunk.walk(aFn);
    }
    else {
      if (chunk !== '') {
        aFn(chunk, { source: this.source,
                     line: this.line,
                     column: this.column,
                     name: this.name });
      }
    }
  }
};

/**
 * Like `String.prototype.join` except for SourceNodes. Inserts `aStr` between
 * each of `this.children`.
 *
 * @param aSep The separator.
 */
SourceNode.prototype.join = function SourceNode_join(aSep) {
  var newChildren;
  var i;
  var len = this.children.length;
  if (len > 0) {
    newChildren = [];
    for (i = 0; i < len-1; i++) {
      newChildren.push(this.children[i]);
      newChildren.push(aSep);
    }
    newChildren.push(this.children[i]);
    this.children = newChildren;
  }
  return this;
};

/**
 * Call String.prototype.replace on the very right-most source snippet. Useful
 * for trimming whitespace from the end of a source node, etc.
 *
 * @param aPattern The pattern to replace.
 * @param aReplacement The thing to replace the pattern with.
 */
SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
  var lastChild = this.children[this.children.length - 1];
  if (lastChild[isSourceNode]) {
    lastChild.replaceRight(aPattern, aReplacement);
  }
  else if (typeof lastChild === 'string') {
    this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
  }
  else {
    this.children.push(''.replace(aPattern, aReplacement));
  }
  return this;
};

/**
 * Set the source content for a source file. This will be added to the SourceMapGenerator
 * in the sourcesContent field.
 *
 * @param aSourceFile The filename of the source file
 * @param aSourceContent The content of the source file
 */
SourceNode.prototype.setSourceContent =
  function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
    this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
  };

/**
 * Walk over the tree of SourceNodes. The walking function is called for each
 * source file content and is passed the filename and source content.
 *
 * @param aFn The traversal function.
 */
SourceNode.prototype.walkSourceContents =
  function SourceNode_walkSourceContents(aFn) {
    for (var i = 0, len = this.children.length; i < len; i++) {
      if (this.children[i][isSourceNode]) {
        this.children[i].walkSourceContents(aFn);
      }
    }

    var sources = Object.keys(this.sourceContents);
    for (var i = 0, len = sources.length; i < len; i++) {
      aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
    }
  };

/**
 * Return the string representation of this source node. Walks over the tree
 * and concatenates all the various snippets together to one string.
 */
SourceNode.prototype.toString = function SourceNode_toString() {
  var str = "";
  this.walk(function (chunk) {
    str += chunk;
  });
  return str;
};

/**
 * Returns the string representation of this source node along with a source
 * map.
 */
SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
  var generated = {
    code: "",
    line: 1,
    column: 0
  };
  var map = new SourceMapGenerator(aArgs);
  var sourceMappingActive = false;
  var lastOriginalSource = null;
  var lastOriginalLine = null;
  var lastOriginalColumn = null;
  var lastOriginalName = null;
  this.walk(function (chunk, original) {
    generated.code += chunk;
    if (original.source !== null
        && original.line !== null
        && original.column !== null) {
      if(lastOriginalSource !== original.source
         || lastOriginalLine !== original.line
         || lastOriginalColumn !== original.column
         || lastOriginalName !== original.name) {
        map.addMapping({
          source: original.source,
          original: {
            line: original.line,
            column: original.column
          },
          generated: {
            line: generated.line,
            column: generated.column
          },
          name: original.name
        });
      }
      lastOriginalSource = original.source;
      lastOriginalLine = original.line;
      lastOriginalColumn = original.column;
      lastOriginalName = original.name;
      sourceMappingActive = true;
    } else if (sourceMappingActive) {
      map.addMapping({
        generated: {
          line: generated.line,
          column: generated.column
        }
      });
      lastOriginalSource = null;
      sourceMappingActive = false;
    }
    for (var idx = 0, length = chunk.length; idx < length; idx++) {
      if (chunk.charCodeAt(idx) === NEWLINE_CODE) {
        generated.line++;
        generated.column = 0;
        // Mappings end at eol
        if (idx + 1 === length) {
          lastOriginalSource = null;
          sourceMappingActive = false;
        } else if (sourceMappingActive) {
          map.addMapping({
            source: original.source,
            original: {
              line: original.line,
              column: original.column
            },
            generated: {
              line: generated.line,
              column: generated.column
            },
            name: original.name
          });
        }
      } else {
        generated.column++;
      }
    }
  });
  this.walkSourceContents(function (sourceFile, sourceContent) {
    map.setSourceContent(sourceFile, sourceContent);
  });

  return { code: generated.code, map: map };
};

exports.SourceNode = SourceNode;

},{"./source-map-generator":67,"./util":69}],69:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

/**
 * This is a helper function for getting values from parameter/options
 * objects.
 *
 * @param args The object we are extracting values from
 * @param name The name of the property we are getting.
 * @param defaultValue An optional value to return if the property is missing
 * from the object. If this is not specified and the property is missing, an
 * error will be thrown.
 */
function getArg(aArgs, aName, aDefaultValue) {
  if (aName in aArgs) {
    return aArgs[aName];
  } else if (arguments.length === 3) {
    return aDefaultValue;
  } else {
    throw new Error('"' + aName + '" is a required argument.');
  }
}
exports.getArg = getArg;

var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.]*)(?::(\d+))?(\S*)$/;
var dataUrlRegexp = /^data:.+\,.+$/;

function urlParse(aUrl) {
  var match = aUrl.match(urlRegexp);
  if (!match) {
    return null;
  }
  return {
    scheme: match[1],
    auth: match[2],
    host: match[3],
    port: match[4],
    path: match[5]
  };
}
exports.urlParse = urlParse;

function urlGenerate(aParsedUrl) {
  var url = '';
  if (aParsedUrl.scheme) {
    url += aParsedUrl.scheme + ':';
  }
  url += '//';
  if (aParsedUrl.auth) {
    url += aParsedUrl.auth + '@';
  }
  if (aParsedUrl.host) {
    url += aParsedUrl.host;
  }
  if (aParsedUrl.port) {
    url += ":" + aParsedUrl.port
  }
  if (aParsedUrl.path) {
    url += aParsedUrl.path;
  }
  return url;
}
exports.urlGenerate = urlGenerate;

/**
 * Normalizes a path, or the path portion of a URL:
 *
 * - Replaces consecutive slashes with one slash.
 * - Removes unnecessary '.' parts.
 * - Removes unnecessary '<dir>/..' parts.
 *
 * Based on code in the Node.js 'path' core module.
 *
 * @param aPath The path or url to normalize.
 */
function normalize(aPath) {
  var path = aPath;
  var url = urlParse(aPath);
  if (url) {
    if (!url.path) {
      return aPath;
    }
    path = url.path;
  }
  var isAbsolute = exports.isAbsolute(path);

  var parts = path.split(/\/+/);
  for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
    part = parts[i];
    if (part === '.') {
      parts.splice(i, 1);
    } else if (part === '..') {
      up++;
    } else if (up > 0) {
      if (part === '') {
        // The first part is blank if the path is absolute. Trying to go
        // above the root is a no-op. Therefore we can remove all '..' parts
        // directly after the root.
        parts.splice(i + 1, up);
        up = 0;
      } else {
        parts.splice(i, 2);
        up--;
      }
    }
  }
  path = parts.join('/');

  if (path === '') {
    path = isAbsolute ? '/' : '.';
  }

  if (url) {
    url.path = path;
    return urlGenerate(url);
  }
  return path;
}
exports.normalize = normalize;

/**
 * Joins two paths/URLs.
 *
 * @param aRoot The root path or URL.
 * @param aPath The path or URL to be joined with the root.
 *
 * - If aPath is a URL or a data URI, aPath is returned, unless aPath is a
 *   scheme-relative URL: Then the scheme of aRoot, if any, is prepended
 *   first.
 * - Otherwise aPath is a path. If aRoot is a URL, then its path portion
 *   is updated with the result and aRoot is returned. Otherwise the result
 *   is returned.
 *   - If aPath is absolute, the result is aPath.
 *   - Otherwise the two paths are joined with a slash.
 * - Joining for example 'http://' and 'www.example.com' is also supported.
 */
function join(aRoot, aPath) {
  if (aRoot === "") {
    aRoot = ".";
  }
  if (aPath === "") {
    aPath = ".";
  }
  var aPathUrl = urlParse(aPath);
  var aRootUrl = urlParse(aRoot);
  if (aRootUrl) {
    aRoot = aRootUrl.path || '/';
  }

  // `join(foo, '//www.example.org')`
  if (aPathUrl && !aPathUrl.scheme) {
    if (aRootUrl) {
      aPathUrl.scheme = aRootUrl.scheme;
    }
    return urlGenerate(aPathUrl);
  }

  if (aPathUrl || aPath.match(dataUrlRegexp)) {
    return aPath;
  }

  // `join('http://', 'www.example.com')`
  if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
    aRootUrl.host = aPath;
    return urlGenerate(aRootUrl);
  }

  var joined = aPath.charAt(0) === '/'
    ? aPath
    : normalize(aRoot.replace(/\/+$/, '') + '/' + aPath);

  if (aRootUrl) {
    aRootUrl.path = joined;
    return urlGenerate(aRootUrl);
  }
  return joined;
}
exports.join = join;

exports.isAbsolute = function (aPath) {
  return aPath.charAt(0) === '/' || !!aPath.match(urlRegexp);
};

/**
 * Make a path relative to a URL or another path.
 *
 * @param aRoot The root path or URL.
 * @param aPath The path or URL to be made relative to aRoot.
 */
function relative(aRoot, aPath) {
  if (aRoot === "") {
    aRoot = ".";
  }

  aRoot = aRoot.replace(/\/$/, '');

  // It is possible for the path to be above the root. In this case, simply
  // checking whether the root is a prefix of the path won't work. Instead, we
  // need to remove components from the root one by one, until either we find
  // a prefix that fits, or we run out of components to remove.
  var level = 0;
  while (aPath.indexOf(aRoot + '/') !== 0) {
    var index = aRoot.lastIndexOf("/");
    if (index < 0) {
      return aPath;
    }

    // If the only part of the root that is left is the scheme (i.e. http://,
    // file:///, etc.), one or more slashes (/), or simply nothing at all, we
    // have exhausted all components, so the path is not relative to the root.
    aRoot = aRoot.slice(0, index);
    if (aRoot.match(/^([^\/]+:\/)?\/*$/)) {
      return aPath;
    }

    ++level;
  }

  // Make sure we add a "../" for each component we removed from the root.
  return Array(level + 1).join("../") + aPath.substr(aRoot.length + 1);
}
exports.relative = relative;

var supportsNullProto = (function () {
  var obj = Object.create(null);
  return !('__proto__' in obj);
}());

function identity (s) {
  return s;
}

/**
 * Because behavior goes wacky when you set `__proto__` on objects, we
 * have to prefix all the strings in our set with an arbitrary character.
 *
 * See https://github.com/mozilla/source-map/pull/31 and
 * https://github.com/mozilla/source-map/issues/30
 *
 * @param String aStr
 */
function toSetString(aStr) {
  if (isProtoString(aStr)) {
    return '$' + aStr;
  }

  return aStr;
}
exports.toSetString = supportsNullProto ? identity : toSetString;

function fromSetString(aStr) {
  if (isProtoString(aStr)) {
    return aStr.slice(1);
  }

  return aStr;
}
exports.fromSetString = supportsNullProto ? identity : fromSetString;

function isProtoString(s) {
  if (!s) {
    return false;
  }

  var length = s.length;

  if (length < 9 /* "__proto__".length */) {
    return false;
  }

  if (s.charCodeAt(length - 1) !== 95  /* '_' */ ||
      s.charCodeAt(length - 2) !== 95  /* '_' */ ||
      s.charCodeAt(length - 3) !== 111 /* 'o' */ ||
      s.charCodeAt(length - 4) !== 116 /* 't' */ ||
      s.charCodeAt(length - 5) !== 111 /* 'o' */ ||
      s.charCodeAt(length - 6) !== 114 /* 'r' */ ||
      s.charCodeAt(length - 7) !== 112 /* 'p' */ ||
      s.charCodeAt(length - 8) !== 95  /* '_' */ ||
      s.charCodeAt(length - 9) !== 95  /* '_' */) {
    return false;
  }

  for (var i = length - 10; i >= 0; i--) {
    if (s.charCodeAt(i) !== 36 /* '$' */) {
      return false;
    }
  }

  return true;
}

/**
 * Comparator between two mappings where the original positions are compared.
 *
 * Optionally pass in `true` as `onlyCompareGenerated` to consider two
 * mappings with the same original source/line/column, but different generated
 * line and column the same. Useful when searching for a mapping with a
 * stubbed out mapping.
 */
function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
  var cmp = mappingA.source - mappingB.source;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0 || onlyCompareOriginal) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  return mappingA.name - mappingB.name;
}
exports.compareByOriginalPositions = compareByOriginalPositions;

/**
 * Comparator between two mappings with deflated source and name indices where
 * the generated positions are compared.
 *
 * Optionally pass in `true` as `onlyCompareGenerated` to consider two
 * mappings with the same generated line and column, but different
 * source/name/original line and column the same. Useful when searching for a
 * mapping with a stubbed out mapping.
 */
function compareByGeneratedPositionsDeflated(mappingA, mappingB, onlyCompareGenerated) {
  var cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0 || onlyCompareGenerated) {
    return cmp;
  }

  cmp = mappingA.source - mappingB.source;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0) {
    return cmp;
  }

  return mappingA.name - mappingB.name;
}
exports.compareByGeneratedPositionsDeflated = compareByGeneratedPositionsDeflated;

function strcmp(aStr1, aStr2) {
  if (aStr1 === aStr2) {
    return 0;
  }

  if (aStr1 > aStr2) {
    return 1;
  }

  return -1;
}

/**
 * Comparator between two mappings with inflated source and name strings where
 * the generated positions are compared.
 */
function compareByGeneratedPositionsInflated(mappingA, mappingB) {
  var cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = strcmp(mappingA.source, mappingB.source);
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0) {
    return cmp;
  }

  return strcmp(mappingA.name, mappingB.name);
}
exports.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated;

},{}],70:[function(require,module,exports){
arguments[4][58][0].apply(exports,arguments)
},{"./lib/source-map-consumer":66,"./lib/source-map-generator":67,"./lib/source-node":68,"dup":58}]},{},[1]);
