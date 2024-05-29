/*
 * URL: https://github.com/cubicdaiya/onp
 *
 * Copyright (c) 2013 Tatsuhiko Kubo <cubicdaiya@gmail.com>
 * Copyright (c) 2016, 2022 Axosoft, LLC (www.gitkraken.com)
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

/**
 * The algorithm implemented here is based on "An O(NP) Sequence Comparison Algorithm"
 * by described by Sun Wu, Udi Manber and Gene Myers
*/
export default function (a_, b_) {
    var a          = a_,
        b          = b_,
        m          = a.length,
        n          = b.length,
        reverse    = false,
        offset     = m + 1,
        path       = [],
        pathposi   = [];

    var tmp1,
        tmp2;

    var init = function () {
        if (m >= n) {
            tmp1    = a;
            tmp2    = m;
            a       = b;
            b       = tmp1;
            m       = n;
            n       = tmp2;
            reverse = true;
            offset = m + 1;
        }
    };

    var P = function (startX, startY, endX, endY, r) {
        return {
            startX,
            startY,
            endX,
            endY,
            r
        };
    };

    var snake = function (k, p, pp) {
        var r, x, y, startX, startY;
        if (p > pp) {
            r = path[k-1+offset];
        } else {
            r = path[k+1+offset];
        }

        startY = y = Math.max(p, pp);
        startX = x = y - k;
        while (x < m && y < n && a[x] === b[y]) {
            ++x;
            ++y;
        }

        if (startX == x && startY == y) {
            path[k+offset] = r;
        } else {
            path[k+offset] = pathposi.length;
            pathposi[pathposi.length] = new P(startX, startY, x, y, r);
        }
        return y;
    };

    init();

    return {
        compose : function () {
            var delta, size, fp, p, r, i, k, lastStartX, lastStartY, result;
            delta  = n - m;
            size   = m + n + 3;
            fp     = {};
            for (i=0;i<size;++i) {
                fp[i] = -1;
                path[i] = -1;
            }
            p = -1;
            do {
                ++p;
                for (k=-p;k<=delta-1;++k) {
                    fp[k+offset] = snake(k, fp[k-1+offset]+1, fp[k+1+offset]);
                }
                for (k=delta+p;k>=delta+1;--k) {
                    fp[k+offset] = snake(k, fp[k-1+offset]+1, fp[k+1+offset]);
                }
                fp[delta+offset] = snake(delta, fp[delta-1+offset]+1, fp[delta+1+offset]);
            } while (fp[delta+offset] !== n);

            // THIS IS PATCHED BY LIX: const ed = delta + 2 * p;

            r = path[delta+offset];
            lastStartX = m;
            lastStartY = n;
            result = [];
            while (r !== -1) {
                let elem = pathposi[r];
                if (m != elem.endX || n != elem.endY) {
                    result.push({
                        file1: [
                            reverse ? elem.endY : elem.endX,
                            reverse ? lastStartY - elem.endY : lastStartX - elem.endX
                        ],
                        file2: [
                            reverse ? elem.endX : elem.endY,
                            reverse ? lastStartX - elem.endX : lastStartY - elem.endY
                        ]
                    });
                }

                lastStartX = elem.startX;
                lastStartY = elem.startY;

                r = pathposi[r].r;
            }

            if (lastStartX != 0 || lastStartY != 0) {
                result.push({
                    file1: [0, reverse ? lastStartY : lastStartX],
                    file2: [0, reverse ? lastStartX : lastStartY]
                })
            }

            result.reverse();
            return result;
        }
    };
};
