/** shared/collections: see docs/architecture.md for responsibilities. */

export function ObjMap() {
  this._ = {};
}

ObjMap.prototype.set = function (k, v) {
  this._[k] = v;
};

ObjMap.prototype.get = function (k) {
  return this._[k];
};

ObjMap.prototype.has = function (k) {
  return Object.prototype.hasOwnProperty.call(this._, k);
};

ObjMap.prototype.clear = function () {
  this._ = {};
};

export function StrSet() {
  this._ = {};
}

StrSet.prototype.add = function (k) {
  this._[k] = true;
};

StrSet.prototype.has = function (k) {
  return !!this._[k];
};

StrSet.prototype.values = function () {
  var a = [];
  for (var k in this._) {
    if (Object.prototype.hasOwnProperty.call(this._, k)) a.push(k);
  }
  return a;
};

export function makeSetFromArray(arr) {
  var s = new StrSet();
  for (var i = 0; i < arr.length; i++) {
    s.add(String(arr[i]));
  }
  return s;
}

export function uniqueList(arr) {
  var seen = {},
    out = [];
  for (var i = 0; i < arr.length; i++) {
    var v = arr[i];
    if (v && !seen[v]) {
      seen[v] = 1;
      out.push(v);
    }
  }
  return out;
}

export function splitMulti(s) {
  if (!s) return [];
  var parts = String(s).split(/[,;|\\/]/);
  var out = [];
  for (var i = 0; i < parts.length; i++) {
    var t = String(parts[i]).trim();
    if (t) out.push(t);
  }
  return out;
}
