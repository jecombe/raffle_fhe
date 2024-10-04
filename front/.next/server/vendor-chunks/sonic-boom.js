"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/sonic-boom";
exports.ids = ["vendor-chunks/sonic-boom"];
exports.modules = {

/***/ "(ssr)/./node_modules/sonic-boom/index.js":
/*!******************************************!*\
  !*** ./node_modules/sonic-boom/index.js ***!
  \******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\n\nconst fs = __webpack_require__(/*! fs */ \"fs\")\nconst EventEmitter = __webpack_require__(/*! events */ \"events\")\nconst inherits = (__webpack_require__(/*! util */ \"util\").inherits)\nconst path = __webpack_require__(/*! path */ \"path\")\nconst sleep = __webpack_require__(/*! atomic-sleep */ \"(ssr)/./node_modules/atomic-sleep/index.js\")\n\nconst BUSY_WRITE_TIMEOUT = 100\n\n// 16 KB. Don't write more than docker buffer size.\n// https://github.com/moby/moby/blob/513ec73831269947d38a644c278ce3cac36783b2/daemon/logger/copier.go#L13\nconst MAX_WRITE = 16 * 1024\n\nfunction openFile (file, sonic) {\n  sonic._opening = true\n  sonic._writing = true\n  sonic._asyncDrainScheduled = false\n\n  // NOTE: 'error' and 'ready' events emitted below only relevant when sonic.sync===false\n  // for sync mode, there is no way to add a listener that will receive these\n\n  function fileOpened (err, fd) {\n    if (err) {\n      sonic._reopening = false\n      sonic._writing = false\n      sonic._opening = false\n\n      if (sonic.sync) {\n        process.nextTick(() => {\n          if (sonic.listenerCount('error') > 0) {\n            sonic.emit('error', err)\n          }\n        })\n      } else {\n        sonic.emit('error', err)\n      }\n      return\n    }\n\n    sonic.fd = fd\n    sonic.file = file\n    sonic._reopening = false\n    sonic._opening = false\n    sonic._writing = false\n\n    if (sonic.sync) {\n      process.nextTick(() => sonic.emit('ready'))\n    } else {\n      sonic.emit('ready')\n    }\n\n    if (sonic._reopening) {\n      return\n    }\n\n    // start\n    if (!sonic._writing && sonic._len > sonic.minLength && !sonic.destroyed) {\n      actualWrite(sonic)\n    }\n  }\n\n  const flags = sonic.append ? 'a' : 'w'\n  const mode = sonic.mode\n\n  if (sonic.sync) {\n    try {\n      if (sonic.mkdir) fs.mkdirSync(path.dirname(file), { recursive: true })\n      const fd = fs.openSync(file, flags, mode)\n      fileOpened(null, fd)\n    } catch (err) {\n      fileOpened(err)\n      throw err\n    }\n  } else if (sonic.mkdir) {\n    fs.mkdir(path.dirname(file), { recursive: true }, (err) => {\n      if (err) return fileOpened(err)\n      fs.open(file, flags, mode, fileOpened)\n    })\n  } else {\n    fs.open(file, flags, mode, fileOpened)\n  }\n}\n\nfunction SonicBoom (opts) {\n  if (!(this instanceof SonicBoom)) {\n    return new SonicBoom(opts)\n  }\n\n  let { fd, dest, minLength, maxLength, maxWrite, sync, append = true, mode, mkdir, retryEAGAIN } = opts || {}\n\n  fd = fd || dest\n\n  this._bufs = []\n  this._len = 0\n  this.fd = -1\n  this._writing = false\n  this._writingBuf = ''\n  this._ending = false\n  this._reopening = false\n  this._asyncDrainScheduled = false\n  this._hwm = Math.max(minLength || 0, 16387)\n  this.file = null\n  this.destroyed = false\n  this.minLength = minLength || 0\n  this.maxLength = maxLength || 0\n  this.maxWrite = maxWrite || MAX_WRITE\n  this.sync = sync || false\n  this.append = append || false\n  this.mode = mode\n  this.retryEAGAIN = retryEAGAIN || (() => true)\n  this.mkdir = mkdir || false\n\n  if (typeof fd === 'number') {\n    this.fd = fd\n    process.nextTick(() => this.emit('ready'))\n  } else if (typeof fd === 'string') {\n    openFile(fd, this)\n  } else {\n    throw new Error('SonicBoom supports only file descriptors and files')\n  }\n  if (this.minLength >= this.maxWrite) {\n    throw new Error(`minLength should be smaller than maxWrite (${this.maxWrite})`)\n  }\n\n  this.release = (err, n) => {\n    if (err) {\n      if (err.code === 'EAGAIN' && this.retryEAGAIN(err, this._writingBuf.length, this._len - this._writingBuf.length)) {\n        if (this.sync) {\n          // This error code should not happen in sync mode, because it is\n          // not using the underlining operating system asynchronous functions.\n          // However it happens, and so we handle it.\n          // Ref: https://github.com/pinojs/pino/issues/783\n          try {\n            sleep(BUSY_WRITE_TIMEOUT)\n            this.release(undefined, 0)\n          } catch (err) {\n            this.release(err)\n          }\n        } else {\n          // Let's give the destination some time to process the chunk.\n          setTimeout(() => {\n            fs.write(this.fd, this._writingBuf, 'utf8', this.release)\n          }, BUSY_WRITE_TIMEOUT)\n        }\n      } else {\n        this._writing = false\n\n        this.emit('error', err)\n      }\n      return\n    }\n    this.emit('write', n)\n\n    this._len -= n\n    this._writingBuf = this._writingBuf.slice(n)\n\n    if (this._writingBuf.length) {\n      if (!this.sync) {\n        fs.write(this.fd, this._writingBuf, 'utf8', this.release)\n        return\n      }\n\n      try {\n        do {\n          const n = fs.writeSync(this.fd, this._writingBuf, 'utf8')\n          this._len -= n\n          this._writingBuf = this._writingBuf.slice(n)\n        } while (this._writingBuf)\n      } catch (err) {\n        this.release(err)\n        return\n      }\n    }\n\n    const len = this._len\n    if (this._reopening) {\n      this._writing = false\n      this._reopening = false\n      this.reopen()\n    } else if (len > this.minLength) {\n      actualWrite(this)\n    } else if (this._ending) {\n      if (len > 0) {\n        actualWrite(this)\n      } else {\n        this._writing = false\n        actualClose(this)\n      }\n    } else {\n      this._writing = false\n      if (this.sync) {\n        if (!this._asyncDrainScheduled) {\n          this._asyncDrainScheduled = true\n          process.nextTick(emitDrain, this)\n        }\n      } else {\n        this.emit('drain')\n      }\n    }\n  }\n\n  this.on('newListener', function (name) {\n    if (name === 'drain') {\n      this._asyncDrainScheduled = false\n    }\n  })\n}\n\nfunction emitDrain (sonic) {\n  const hasListeners = sonic.listenerCount('drain') > 0\n  if (!hasListeners) return\n  sonic._asyncDrainScheduled = false\n  sonic.emit('drain')\n}\n\ninherits(SonicBoom, EventEmitter)\n\nSonicBoom.prototype.write = function (data) {\n  if (this.destroyed) {\n    throw new Error('SonicBoom destroyed')\n  }\n\n  const len = this._len + data.length\n  const bufs = this._bufs\n\n  if (this.maxLength && len > this.maxLength) {\n    this.emit('drop', data)\n    return this._len < this._hwm\n  }\n\n  if (\n    bufs.length === 0 ||\n    bufs[bufs.length - 1].length + data.length > this.maxWrite\n  ) {\n    bufs.push('' + data)\n  } else {\n    bufs[bufs.length - 1] += data\n  }\n\n  this._len = len\n\n  if (!this._writing && this._len >= this.minLength) {\n    actualWrite(this)\n  }\n\n  return this._len < this._hwm\n}\n\nSonicBoom.prototype.flush = function () {\n  if (this.destroyed) {\n    throw new Error('SonicBoom destroyed')\n  }\n\n  if (this._writing || this.minLength <= 0) {\n    return\n  }\n\n  if (this._bufs.length === 0) {\n    this._bufs.push('')\n  }\n\n  actualWrite(this)\n}\n\nSonicBoom.prototype.reopen = function (file) {\n  if (this.destroyed) {\n    throw new Error('SonicBoom destroyed')\n  }\n\n  if (this._opening) {\n    this.once('ready', () => {\n      this.reopen(file)\n    })\n    return\n  }\n\n  if (this._ending) {\n    return\n  }\n\n  if (!this.file) {\n    throw new Error('Unable to reopen a file descriptor, you must pass a file to SonicBoom')\n  }\n\n  this._reopening = true\n\n  if (this._writing) {\n    return\n  }\n\n  const fd = this.fd\n  this.once('ready', () => {\n    if (fd !== this.fd) {\n      fs.close(fd, (err) => {\n        if (err) {\n          return this.emit('error', err)\n        }\n      })\n    }\n  })\n\n  openFile(file || this.file, this)\n}\n\nSonicBoom.prototype.end = function () {\n  if (this.destroyed) {\n    throw new Error('SonicBoom destroyed')\n  }\n\n  if (this._opening) {\n    this.once('ready', () => {\n      this.end()\n    })\n    return\n  }\n\n  if (this._ending) {\n    return\n  }\n\n  this._ending = true\n\n  if (this._writing) {\n    return\n  }\n\n  if (this._len > 0 && this.fd >= 0) {\n    actualWrite(this)\n  } else {\n    actualClose(this)\n  }\n}\n\nSonicBoom.prototype.flushSync = function () {\n  if (this.destroyed) {\n    throw new Error('SonicBoom destroyed')\n  }\n\n  if (this.fd < 0) {\n    throw new Error('sonic boom is not ready yet')\n  }\n\n  if (!this._writing && this._writingBuf.length > 0) {\n    this._bufs.unshift(this._writingBuf)\n    this._writingBuf = ''\n  }\n\n  while (this._bufs.length) {\n    const buf = this._bufs[0]\n    try {\n      this._len -= fs.writeSync(this.fd, buf, 'utf8')\n      this._bufs.shift()\n    } catch (err) {\n      if (err.code !== 'EAGAIN' || !this.retryEAGAIN(err, buf.length, this._len - buf.length)) {\n        throw err\n      }\n\n      sleep(BUSY_WRITE_TIMEOUT)\n    }\n  }\n}\n\nSonicBoom.prototype.destroy = function () {\n  if (this.destroyed) {\n    return\n  }\n  actualClose(this)\n}\n\nfunction actualWrite (sonic) {\n  const release = sonic.release\n  sonic._writing = true\n  sonic._writingBuf = sonic._writingBuf || sonic._bufs.shift() || ''\n\n  if (sonic.sync) {\n    try {\n      const written = fs.writeSync(sonic.fd, sonic._writingBuf, 'utf8')\n      release(null, written)\n    } catch (err) {\n      release(err)\n    }\n  } else {\n    fs.write(sonic.fd, sonic._writingBuf, 'utf8', release)\n  }\n}\n\nfunction actualClose (sonic) {\n  if (sonic.fd === -1) {\n    sonic.once('ready', actualClose.bind(null, sonic))\n    return\n  }\n\n  sonic.destroyed = true\n  sonic._bufs = []\n\n  if (sonic.fd !== 1 && sonic.fd !== 2) {\n    fs.close(sonic.fd, done)\n  } else {\n    setImmediate(done)\n  }\n\n  function done (err) {\n    if (err) {\n      sonic.emit('error', err)\n      return\n    }\n\n    if (sonic._ending && !sonic._writing) {\n      sonic.emit('finish')\n    }\n    sonic.emit('close')\n  }\n}\n\n/**\n * These export configurations enable JS and TS developers\n * to consumer SonicBoom in whatever way best suits their needs.\n * Some examples of supported import syntax includes:\n * - `const SonicBoom = require('SonicBoom')`\n * - `const { SonicBoom } = require('SonicBoom')`\n * - `import * as SonicBoom from 'SonicBoom'`\n * - `import { SonicBoom } from 'SonicBoom'`\n * - `import SonicBoom from 'SonicBoom'`\n */\nSonicBoom.SonicBoom = SonicBoom\nSonicBoom.default = SonicBoom\nmodule.exports = SonicBoom\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvc29uaWMtYm9vbS9pbmRleC5qcyIsIm1hcHBpbmdzIjoiQUFBWTs7QUFFWixXQUFXLG1CQUFPLENBQUMsY0FBSTtBQUN2QixxQkFBcUIsbUJBQU8sQ0FBQyxzQkFBUTtBQUNyQyxpQkFBaUIsa0RBQXdCO0FBQ3pDLGFBQWEsbUJBQU8sQ0FBQyxrQkFBTTtBQUMzQixjQUFjLG1CQUFPLENBQUMsZ0VBQWM7O0FBRXBDOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVCxRQUFRO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsMERBQTBELGlCQUFpQjtBQUMzRTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSixtQ0FBbUMsaUJBQWlCO0FBQ3BEO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsSUFBSTtBQUNKO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxRQUFRLDBGQUEwRjs7QUFFbEc7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBLGtFQUFrRSxjQUFjO0FBQ2hGOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZO0FBQ1o7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQSxXQUFXO0FBQ1g7QUFDQSxRQUFRO0FBQ1I7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVixRQUFRO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0EsUUFBUTtBQUNSO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBLEdBQUc7O0FBRUg7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYyxZQUFZO0FBQzFCO0FBQ0EsZUFBZSxZQUFZO0FBQzNCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly90ZXN0Mi8uL25vZGVfbW9kdWxlcy9zb25pYy1ib29tL2luZGV4LmpzPzk1OTgiXSwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKVxuY29uc3QgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJylcbmNvbnN0IGluaGVyaXRzID0gcmVxdWlyZSgndXRpbCcpLmluaGVyaXRzXG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXG5jb25zdCBzbGVlcCA9IHJlcXVpcmUoJ2F0b21pYy1zbGVlcCcpXG5cbmNvbnN0IEJVU1lfV1JJVEVfVElNRU9VVCA9IDEwMFxuXG4vLyAxNiBLQi4gRG9uJ3Qgd3JpdGUgbW9yZSB0aGFuIGRvY2tlciBidWZmZXIgc2l6ZS5cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tb2J5L21vYnkvYmxvYi81MTNlYzczODMxMjY5OTQ3ZDM4YTY0NGMyNzhjZTNjYWMzNjc4M2IyL2RhZW1vbi9sb2dnZXIvY29waWVyLmdvI0wxM1xuY29uc3QgTUFYX1dSSVRFID0gMTYgKiAxMDI0XG5cbmZ1bmN0aW9uIG9wZW5GaWxlIChmaWxlLCBzb25pYykge1xuICBzb25pYy5fb3BlbmluZyA9IHRydWVcbiAgc29uaWMuX3dyaXRpbmcgPSB0cnVlXG4gIHNvbmljLl9hc3luY0RyYWluU2NoZWR1bGVkID0gZmFsc2VcblxuICAvLyBOT1RFOiAnZXJyb3InIGFuZCAncmVhZHknIGV2ZW50cyBlbWl0dGVkIGJlbG93IG9ubHkgcmVsZXZhbnQgd2hlbiBzb25pYy5zeW5jPT09ZmFsc2VcbiAgLy8gZm9yIHN5bmMgbW9kZSwgdGhlcmUgaXMgbm8gd2F5IHRvIGFkZCBhIGxpc3RlbmVyIHRoYXQgd2lsbCByZWNlaXZlIHRoZXNlXG5cbiAgZnVuY3Rpb24gZmlsZU9wZW5lZCAoZXJyLCBmZCkge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIHNvbmljLl9yZW9wZW5pbmcgPSBmYWxzZVxuICAgICAgc29uaWMuX3dyaXRpbmcgPSBmYWxzZVxuICAgICAgc29uaWMuX29wZW5pbmcgPSBmYWxzZVxuXG4gICAgICBpZiAoc29uaWMuc3luYykge1xuICAgICAgICBwcm9jZXNzLm5leHRUaWNrKCgpID0+IHtcbiAgICAgICAgICBpZiAoc29uaWMubGlzdGVuZXJDb3VudCgnZXJyb3InKSA+IDApIHtcbiAgICAgICAgICAgIHNvbmljLmVtaXQoJ2Vycm9yJywgZXJyKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNvbmljLmVtaXQoJ2Vycm9yJywgZXJyKVxuICAgICAgfVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgc29uaWMuZmQgPSBmZFxuICAgIHNvbmljLmZpbGUgPSBmaWxlXG4gICAgc29uaWMuX3Jlb3BlbmluZyA9IGZhbHNlXG4gICAgc29uaWMuX29wZW5pbmcgPSBmYWxzZVxuICAgIHNvbmljLl93cml0aW5nID0gZmFsc2VcblxuICAgIGlmIChzb25pYy5zeW5jKSB7XG4gICAgICBwcm9jZXNzLm5leHRUaWNrKCgpID0+IHNvbmljLmVtaXQoJ3JlYWR5JykpXG4gICAgfSBlbHNlIHtcbiAgICAgIHNvbmljLmVtaXQoJ3JlYWR5JylcbiAgICB9XG5cbiAgICBpZiAoc29uaWMuX3Jlb3BlbmluZykge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgLy8gc3RhcnRcbiAgICBpZiAoIXNvbmljLl93cml0aW5nICYmIHNvbmljLl9sZW4gPiBzb25pYy5taW5MZW5ndGggJiYgIXNvbmljLmRlc3Ryb3llZCkge1xuICAgICAgYWN0dWFsV3JpdGUoc29uaWMpXG4gICAgfVxuICB9XG5cbiAgY29uc3QgZmxhZ3MgPSBzb25pYy5hcHBlbmQgPyAnYScgOiAndydcbiAgY29uc3QgbW9kZSA9IHNvbmljLm1vZGVcblxuICBpZiAoc29uaWMuc3luYykge1xuICAgIHRyeSB7XG4gICAgICBpZiAoc29uaWMubWtkaXIpIGZzLm1rZGlyU3luYyhwYXRoLmRpcm5hbWUoZmlsZSksIHsgcmVjdXJzaXZlOiB0cnVlIH0pXG4gICAgICBjb25zdCBmZCA9IGZzLm9wZW5TeW5jKGZpbGUsIGZsYWdzLCBtb2RlKVxuICAgICAgZmlsZU9wZW5lZChudWxsLCBmZClcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGZpbGVPcGVuZWQoZXJyKVxuICAgICAgdGhyb3cgZXJyXG4gICAgfVxuICB9IGVsc2UgaWYgKHNvbmljLm1rZGlyKSB7XG4gICAgZnMubWtkaXIocGF0aC5kaXJuYW1lKGZpbGUpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9LCAoZXJyKSA9PiB7XG4gICAgICBpZiAoZXJyKSByZXR1cm4gZmlsZU9wZW5lZChlcnIpXG4gICAgICBmcy5vcGVuKGZpbGUsIGZsYWdzLCBtb2RlLCBmaWxlT3BlbmVkKVxuICAgIH0pXG4gIH0gZWxzZSB7XG4gICAgZnMub3BlbihmaWxlLCBmbGFncywgbW9kZSwgZmlsZU9wZW5lZClcbiAgfVxufVxuXG5mdW5jdGlvbiBTb25pY0Jvb20gKG9wdHMpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFNvbmljQm9vbSkpIHtcbiAgICByZXR1cm4gbmV3IFNvbmljQm9vbShvcHRzKVxuICB9XG5cbiAgbGV0IHsgZmQsIGRlc3QsIG1pbkxlbmd0aCwgbWF4TGVuZ3RoLCBtYXhXcml0ZSwgc3luYywgYXBwZW5kID0gdHJ1ZSwgbW9kZSwgbWtkaXIsIHJldHJ5RUFHQUlOIH0gPSBvcHRzIHx8IHt9XG5cbiAgZmQgPSBmZCB8fCBkZXN0XG5cbiAgdGhpcy5fYnVmcyA9IFtdXG4gIHRoaXMuX2xlbiA9IDBcbiAgdGhpcy5mZCA9IC0xXG4gIHRoaXMuX3dyaXRpbmcgPSBmYWxzZVxuICB0aGlzLl93cml0aW5nQnVmID0gJydcbiAgdGhpcy5fZW5kaW5nID0gZmFsc2VcbiAgdGhpcy5fcmVvcGVuaW5nID0gZmFsc2VcbiAgdGhpcy5fYXN5bmNEcmFpblNjaGVkdWxlZCA9IGZhbHNlXG4gIHRoaXMuX2h3bSA9IE1hdGgubWF4KG1pbkxlbmd0aCB8fCAwLCAxNjM4NylcbiAgdGhpcy5maWxlID0gbnVsbFxuICB0aGlzLmRlc3Ryb3llZCA9IGZhbHNlXG4gIHRoaXMubWluTGVuZ3RoID0gbWluTGVuZ3RoIHx8IDBcbiAgdGhpcy5tYXhMZW5ndGggPSBtYXhMZW5ndGggfHwgMFxuICB0aGlzLm1heFdyaXRlID0gbWF4V3JpdGUgfHwgTUFYX1dSSVRFXG4gIHRoaXMuc3luYyA9IHN5bmMgfHwgZmFsc2VcbiAgdGhpcy5hcHBlbmQgPSBhcHBlbmQgfHwgZmFsc2VcbiAgdGhpcy5tb2RlID0gbW9kZVxuICB0aGlzLnJldHJ5RUFHQUlOID0gcmV0cnlFQUdBSU4gfHwgKCgpID0+IHRydWUpXG4gIHRoaXMubWtkaXIgPSBta2RpciB8fCBmYWxzZVxuXG4gIGlmICh0eXBlb2YgZmQgPT09ICdudW1iZXInKSB7XG4gICAgdGhpcy5mZCA9IGZkXG4gICAgcHJvY2Vzcy5uZXh0VGljaygoKSA9PiB0aGlzLmVtaXQoJ3JlYWR5JykpXG4gIH0gZWxzZSBpZiAodHlwZW9mIGZkID09PSAnc3RyaW5nJykge1xuICAgIG9wZW5GaWxlKGZkLCB0aGlzKVxuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcignU29uaWNCb29tIHN1cHBvcnRzIG9ubHkgZmlsZSBkZXNjcmlwdG9ycyBhbmQgZmlsZXMnKVxuICB9XG4gIGlmICh0aGlzLm1pbkxlbmd0aCA+PSB0aGlzLm1heFdyaXRlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBtaW5MZW5ndGggc2hvdWxkIGJlIHNtYWxsZXIgdGhhbiBtYXhXcml0ZSAoJHt0aGlzLm1heFdyaXRlfSlgKVxuICB9XG5cbiAgdGhpcy5yZWxlYXNlID0gKGVyciwgbikgPT4ge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIGlmIChlcnIuY29kZSA9PT0gJ0VBR0FJTicgJiYgdGhpcy5yZXRyeUVBR0FJTihlcnIsIHRoaXMuX3dyaXRpbmdCdWYubGVuZ3RoLCB0aGlzLl9sZW4gLSB0aGlzLl93cml0aW5nQnVmLmxlbmd0aCkpIHtcbiAgICAgICAgaWYgKHRoaXMuc3luYykge1xuICAgICAgICAgIC8vIFRoaXMgZXJyb3IgY29kZSBzaG91bGQgbm90IGhhcHBlbiBpbiBzeW5jIG1vZGUsIGJlY2F1c2UgaXQgaXNcbiAgICAgICAgICAvLyBub3QgdXNpbmcgdGhlIHVuZGVybGluaW5nIG9wZXJhdGluZyBzeXN0ZW0gYXN5bmNocm9ub3VzIGZ1bmN0aW9ucy5cbiAgICAgICAgICAvLyBIb3dldmVyIGl0IGhhcHBlbnMsIGFuZCBzbyB3ZSBoYW5kbGUgaXQuXG4gICAgICAgICAgLy8gUmVmOiBodHRwczovL2dpdGh1Yi5jb20vcGlub2pzL3Bpbm8vaXNzdWVzLzc4M1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBzbGVlcChCVVNZX1dSSVRFX1RJTUVPVVQpXG4gICAgICAgICAgICB0aGlzLnJlbGVhc2UodW5kZWZpbmVkLCAwKVxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgdGhpcy5yZWxlYXNlKGVycilcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gTGV0J3MgZ2l2ZSB0aGUgZGVzdGluYXRpb24gc29tZSB0aW1lIHRvIHByb2Nlc3MgdGhlIGNodW5rLlxuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgZnMud3JpdGUodGhpcy5mZCwgdGhpcy5fd3JpdGluZ0J1ZiwgJ3V0ZjgnLCB0aGlzLnJlbGVhc2UpXG4gICAgICAgICAgfSwgQlVTWV9XUklURV9USU1FT1VUKVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl93cml0aW5nID0gZmFsc2VcblxuICAgICAgICB0aGlzLmVtaXQoJ2Vycm9yJywgZXJyKVxuICAgICAgfVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHRoaXMuZW1pdCgnd3JpdGUnLCBuKVxuXG4gICAgdGhpcy5fbGVuIC09IG5cbiAgICB0aGlzLl93cml0aW5nQnVmID0gdGhpcy5fd3JpdGluZ0J1Zi5zbGljZShuKVxuXG4gICAgaWYgKHRoaXMuX3dyaXRpbmdCdWYubGVuZ3RoKSB7XG4gICAgICBpZiAoIXRoaXMuc3luYykge1xuICAgICAgICBmcy53cml0ZSh0aGlzLmZkLCB0aGlzLl93cml0aW5nQnVmLCAndXRmOCcsIHRoaXMucmVsZWFzZSlcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGRvIHtcbiAgICAgICAgICBjb25zdCBuID0gZnMud3JpdGVTeW5jKHRoaXMuZmQsIHRoaXMuX3dyaXRpbmdCdWYsICd1dGY4JylcbiAgICAgICAgICB0aGlzLl9sZW4gLT0gblxuICAgICAgICAgIHRoaXMuX3dyaXRpbmdCdWYgPSB0aGlzLl93cml0aW5nQnVmLnNsaWNlKG4pXG4gICAgICAgIH0gd2hpbGUgKHRoaXMuX3dyaXRpbmdCdWYpXG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgdGhpcy5yZWxlYXNlKGVycilcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgbGVuID0gdGhpcy5fbGVuXG4gICAgaWYgKHRoaXMuX3Jlb3BlbmluZykge1xuICAgICAgdGhpcy5fd3JpdGluZyA9IGZhbHNlXG4gICAgICB0aGlzLl9yZW9wZW5pbmcgPSBmYWxzZVxuICAgICAgdGhpcy5yZW9wZW4oKVxuICAgIH0gZWxzZSBpZiAobGVuID4gdGhpcy5taW5MZW5ndGgpIHtcbiAgICAgIGFjdHVhbFdyaXRlKHRoaXMpXG4gICAgfSBlbHNlIGlmICh0aGlzLl9lbmRpbmcpIHtcbiAgICAgIGlmIChsZW4gPiAwKSB7XG4gICAgICAgIGFjdHVhbFdyaXRlKHRoaXMpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl93cml0aW5nID0gZmFsc2VcbiAgICAgICAgYWN0dWFsQ2xvc2UodGhpcylcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fd3JpdGluZyA9IGZhbHNlXG4gICAgICBpZiAodGhpcy5zeW5jKSB7XG4gICAgICAgIGlmICghdGhpcy5fYXN5bmNEcmFpblNjaGVkdWxlZCkge1xuICAgICAgICAgIHRoaXMuX2FzeW5jRHJhaW5TY2hlZHVsZWQgPSB0cnVlXG4gICAgICAgICAgcHJvY2Vzcy5uZXh0VGljayhlbWl0RHJhaW4sIHRoaXMpXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZW1pdCgnZHJhaW4nKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHRoaXMub24oJ25ld0xpc3RlbmVyJywgZnVuY3Rpb24gKG5hbWUpIHtcbiAgICBpZiAobmFtZSA9PT0gJ2RyYWluJykge1xuICAgICAgdGhpcy5fYXN5bmNEcmFpblNjaGVkdWxlZCA9IGZhbHNlXG4gICAgfVxuICB9KVxufVxuXG5mdW5jdGlvbiBlbWl0RHJhaW4gKHNvbmljKSB7XG4gIGNvbnN0IGhhc0xpc3RlbmVycyA9IHNvbmljLmxpc3RlbmVyQ291bnQoJ2RyYWluJykgPiAwXG4gIGlmICghaGFzTGlzdGVuZXJzKSByZXR1cm5cbiAgc29uaWMuX2FzeW5jRHJhaW5TY2hlZHVsZWQgPSBmYWxzZVxuICBzb25pYy5lbWl0KCdkcmFpbicpXG59XG5cbmluaGVyaXRzKFNvbmljQm9vbSwgRXZlbnRFbWl0dGVyKVxuXG5Tb25pY0Jvb20ucHJvdG90eXBlLndyaXRlID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgaWYgKHRoaXMuZGVzdHJveWVkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdTb25pY0Jvb20gZGVzdHJveWVkJylcbiAgfVxuXG4gIGNvbnN0IGxlbiA9IHRoaXMuX2xlbiArIGRhdGEubGVuZ3RoXG4gIGNvbnN0IGJ1ZnMgPSB0aGlzLl9idWZzXG5cbiAgaWYgKHRoaXMubWF4TGVuZ3RoICYmIGxlbiA+IHRoaXMubWF4TGVuZ3RoKSB7XG4gICAgdGhpcy5lbWl0KCdkcm9wJywgZGF0YSlcbiAgICByZXR1cm4gdGhpcy5fbGVuIDwgdGhpcy5faHdtXG4gIH1cblxuICBpZiAoXG4gICAgYnVmcy5sZW5ndGggPT09IDAgfHxcbiAgICBidWZzW2J1ZnMubGVuZ3RoIC0gMV0ubGVuZ3RoICsgZGF0YS5sZW5ndGggPiB0aGlzLm1heFdyaXRlXG4gICkge1xuICAgIGJ1ZnMucHVzaCgnJyArIGRhdGEpXG4gIH0gZWxzZSB7XG4gICAgYnVmc1tidWZzLmxlbmd0aCAtIDFdICs9IGRhdGFcbiAgfVxuXG4gIHRoaXMuX2xlbiA9IGxlblxuXG4gIGlmICghdGhpcy5fd3JpdGluZyAmJiB0aGlzLl9sZW4gPj0gdGhpcy5taW5MZW5ndGgpIHtcbiAgICBhY3R1YWxXcml0ZSh0aGlzKVxuICB9XG5cbiAgcmV0dXJuIHRoaXMuX2xlbiA8IHRoaXMuX2h3bVxufVxuXG5Tb25pY0Jvb20ucHJvdG90eXBlLmZsdXNoID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5kZXN0cm95ZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1NvbmljQm9vbSBkZXN0cm95ZWQnKVxuICB9XG5cbiAgaWYgKHRoaXMuX3dyaXRpbmcgfHwgdGhpcy5taW5MZW5ndGggPD0gMCkge1xuICAgIHJldHVyblxuICB9XG5cbiAgaWYgKHRoaXMuX2J1ZnMubGVuZ3RoID09PSAwKSB7XG4gICAgdGhpcy5fYnVmcy5wdXNoKCcnKVxuICB9XG5cbiAgYWN0dWFsV3JpdGUodGhpcylcbn1cblxuU29uaWNCb29tLnByb3RvdHlwZS5yZW9wZW4gPSBmdW5jdGlvbiAoZmlsZSkge1xuICBpZiAodGhpcy5kZXN0cm95ZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1NvbmljQm9vbSBkZXN0cm95ZWQnKVxuICB9XG5cbiAgaWYgKHRoaXMuX29wZW5pbmcpIHtcbiAgICB0aGlzLm9uY2UoJ3JlYWR5JywgKCkgPT4ge1xuICAgICAgdGhpcy5yZW9wZW4oZmlsZSlcbiAgICB9KVxuICAgIHJldHVyblxuICB9XG5cbiAgaWYgKHRoaXMuX2VuZGluZykge1xuICAgIHJldHVyblxuICB9XG5cbiAgaWYgKCF0aGlzLmZpbGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byByZW9wZW4gYSBmaWxlIGRlc2NyaXB0b3IsIHlvdSBtdXN0IHBhc3MgYSBmaWxlIHRvIFNvbmljQm9vbScpXG4gIH1cblxuICB0aGlzLl9yZW9wZW5pbmcgPSB0cnVlXG5cbiAgaWYgKHRoaXMuX3dyaXRpbmcpIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIGNvbnN0IGZkID0gdGhpcy5mZFxuICB0aGlzLm9uY2UoJ3JlYWR5JywgKCkgPT4ge1xuICAgIGlmIChmZCAhPT0gdGhpcy5mZCkge1xuICAgICAgZnMuY2xvc2UoZmQsIChlcnIpID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJldHVybiB0aGlzLmVtaXQoJ2Vycm9yJywgZXJyKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cbiAgfSlcblxuICBvcGVuRmlsZShmaWxlIHx8IHRoaXMuZmlsZSwgdGhpcylcbn1cblxuU29uaWNCb29tLnByb3RvdHlwZS5lbmQgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0aGlzLmRlc3Ryb3llZCkge1xuICAgIHRocm93IG5ldyBFcnJvcignU29uaWNCb29tIGRlc3Ryb3llZCcpXG4gIH1cblxuICBpZiAodGhpcy5fb3BlbmluZykge1xuICAgIHRoaXMub25jZSgncmVhZHknLCAoKSA9PiB7XG4gICAgICB0aGlzLmVuZCgpXG4gICAgfSlcbiAgICByZXR1cm5cbiAgfVxuXG4gIGlmICh0aGlzLl9lbmRpbmcpIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIHRoaXMuX2VuZGluZyA9IHRydWVcblxuICBpZiAodGhpcy5fd3JpdGluZykge1xuICAgIHJldHVyblxuICB9XG5cbiAgaWYgKHRoaXMuX2xlbiA+IDAgJiYgdGhpcy5mZCA+PSAwKSB7XG4gICAgYWN0dWFsV3JpdGUodGhpcylcbiAgfSBlbHNlIHtcbiAgICBhY3R1YWxDbG9zZSh0aGlzKVxuICB9XG59XG5cblNvbmljQm9vbS5wcm90b3R5cGUuZmx1c2hTeW5jID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5kZXN0cm95ZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1NvbmljQm9vbSBkZXN0cm95ZWQnKVxuICB9XG5cbiAgaWYgKHRoaXMuZmQgPCAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzb25pYyBib29tIGlzIG5vdCByZWFkeSB5ZXQnKVxuICB9XG5cbiAgaWYgKCF0aGlzLl93cml0aW5nICYmIHRoaXMuX3dyaXRpbmdCdWYubGVuZ3RoID4gMCkge1xuICAgIHRoaXMuX2J1ZnMudW5zaGlmdCh0aGlzLl93cml0aW5nQnVmKVxuICAgIHRoaXMuX3dyaXRpbmdCdWYgPSAnJ1xuICB9XG5cbiAgd2hpbGUgKHRoaXMuX2J1ZnMubGVuZ3RoKSB7XG4gICAgY29uc3QgYnVmID0gdGhpcy5fYnVmc1swXVxuICAgIHRyeSB7XG4gICAgICB0aGlzLl9sZW4gLT0gZnMud3JpdGVTeW5jKHRoaXMuZmQsIGJ1ZiwgJ3V0ZjgnKVxuICAgICAgdGhpcy5fYnVmcy5zaGlmdCgpXG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBpZiAoZXJyLmNvZGUgIT09ICdFQUdBSU4nIHx8ICF0aGlzLnJldHJ5RUFHQUlOKGVyciwgYnVmLmxlbmd0aCwgdGhpcy5fbGVuIC0gYnVmLmxlbmd0aCkpIHtcbiAgICAgICAgdGhyb3cgZXJyXG4gICAgICB9XG5cbiAgICAgIHNsZWVwKEJVU1lfV1JJVEVfVElNRU9VVClcbiAgICB9XG4gIH1cbn1cblxuU29uaWNCb29tLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5kZXN0cm95ZWQpIHtcbiAgICByZXR1cm5cbiAgfVxuICBhY3R1YWxDbG9zZSh0aGlzKVxufVxuXG5mdW5jdGlvbiBhY3R1YWxXcml0ZSAoc29uaWMpIHtcbiAgY29uc3QgcmVsZWFzZSA9IHNvbmljLnJlbGVhc2VcbiAgc29uaWMuX3dyaXRpbmcgPSB0cnVlXG4gIHNvbmljLl93cml0aW5nQnVmID0gc29uaWMuX3dyaXRpbmdCdWYgfHwgc29uaWMuX2J1ZnMuc2hpZnQoKSB8fCAnJ1xuXG4gIGlmIChzb25pYy5zeW5jKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHdyaXR0ZW4gPSBmcy53cml0ZVN5bmMoc29uaWMuZmQsIHNvbmljLl93cml0aW5nQnVmLCAndXRmOCcpXG4gICAgICByZWxlYXNlKG51bGwsIHdyaXR0ZW4pXG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICByZWxlYXNlKGVycilcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgZnMud3JpdGUoc29uaWMuZmQsIHNvbmljLl93cml0aW5nQnVmLCAndXRmOCcsIHJlbGVhc2UpXG4gIH1cbn1cblxuZnVuY3Rpb24gYWN0dWFsQ2xvc2UgKHNvbmljKSB7XG4gIGlmIChzb25pYy5mZCA9PT0gLTEpIHtcbiAgICBzb25pYy5vbmNlKCdyZWFkeScsIGFjdHVhbENsb3NlLmJpbmQobnVsbCwgc29uaWMpKVxuICAgIHJldHVyblxuICB9XG5cbiAgc29uaWMuZGVzdHJveWVkID0gdHJ1ZVxuICBzb25pYy5fYnVmcyA9IFtdXG5cbiAgaWYgKHNvbmljLmZkICE9PSAxICYmIHNvbmljLmZkICE9PSAyKSB7XG4gICAgZnMuY2xvc2Uoc29uaWMuZmQsIGRvbmUpXG4gIH0gZWxzZSB7XG4gICAgc2V0SW1tZWRpYXRlKGRvbmUpXG4gIH1cblxuICBmdW5jdGlvbiBkb25lIChlcnIpIHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBzb25pYy5lbWl0KCdlcnJvcicsIGVycilcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGlmIChzb25pYy5fZW5kaW5nICYmICFzb25pYy5fd3JpdGluZykge1xuICAgICAgc29uaWMuZW1pdCgnZmluaXNoJylcbiAgICB9XG4gICAgc29uaWMuZW1pdCgnY2xvc2UnKVxuICB9XG59XG5cbi8qKlxuICogVGhlc2UgZXhwb3J0IGNvbmZpZ3VyYXRpb25zIGVuYWJsZSBKUyBhbmQgVFMgZGV2ZWxvcGVyc1xuICogdG8gY29uc3VtZXIgU29uaWNCb29tIGluIHdoYXRldmVyIHdheSBiZXN0IHN1aXRzIHRoZWlyIG5lZWRzLlxuICogU29tZSBleGFtcGxlcyBvZiBzdXBwb3J0ZWQgaW1wb3J0IHN5bnRheCBpbmNsdWRlczpcbiAqIC0gYGNvbnN0IFNvbmljQm9vbSA9IHJlcXVpcmUoJ1NvbmljQm9vbScpYFxuICogLSBgY29uc3QgeyBTb25pY0Jvb20gfSA9IHJlcXVpcmUoJ1NvbmljQm9vbScpYFxuICogLSBgaW1wb3J0ICogYXMgU29uaWNCb29tIGZyb20gJ1NvbmljQm9vbSdgXG4gKiAtIGBpbXBvcnQgeyBTb25pY0Jvb20gfSBmcm9tICdTb25pY0Jvb20nYFxuICogLSBgaW1wb3J0IFNvbmljQm9vbSBmcm9tICdTb25pY0Jvb20nYFxuICovXG5Tb25pY0Jvb20uU29uaWNCb29tID0gU29uaWNCb29tXG5Tb25pY0Jvb20uZGVmYXVsdCA9IFNvbmljQm9vbVxubW9kdWxlLmV4cG9ydHMgPSBTb25pY0Jvb21cbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/sonic-boom/index.js\n");

/***/ })

};
;