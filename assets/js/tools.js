String.prototype.sanitate = function () {
    return this.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
};

String.prototype.contains = function (str) {
    return this.sanitate().toLowerCase().indexOf((str || '').sanitate().toLowerCase()) !== -1;
};

Array.prototype.linq = function () {
    return Enumerable.from(this);
};

Array.prototype.any = function (exp) {
    return this.filter(exp || (() => true)).length > 0;
};

Array.prototype.count = function (exp) {
    return this.filter(exp || (() => true)).length;
};

Array.prototype.add = function (item) {
    this.push(item);

    return item;
};

Array.prototype.clean = function () {
    this.length = 0;
};

Array.prototype.remove = function (item) {
    $this = this;

    let old = Object.assign([], $this);

    $this.clean();

    old.filter(m => !item(m)).forEach(m =>
        $this.push(m));

    return $this;
};

Array.prototype.set = function (data, identify) {
    $this = this;

    let _temp = [];
    let firstTime = !$this.any();

    data.forEach((m, i) => {
        _temp.push(m);

        // item
        let current = $this.find(x => identify(x, m));

        if (!current) {
            if (!firstTime && $this.insertHandler)
                $this.insertHandler(m);

            current = $this.push(m);

            return;
        }

        // props
        for (let p in m) {
            if (typeof current[p] === 'function')
                continue;

            let condition = current[p] !== m[p];

            if ($this.customValidationHandler)
                condition = $this.customValidationHandler(condition, current, m, p);

            if (condition) {
                if ($this.changeHandler)
                    $this.changeHandler(current, m, p);

                if (Array.isArray(current[p]))
                    Object.assign(current[p], m[p]);
                else {
                    current[p] = m[p];
                }
            }
        }
    });

    let itemsToRemove = $this.filter(m => !_temp.find(x => identify(x, m)));

    if ($this.removeHandler)
        itemsToRemove.forEach($this.removeHandler);

    $this.remove(m =>
        itemsToRemove.find(x => identify(x, m)));

    return $this;
};

Array.prototype.first = function (exp) {
    let r = this.filter(exp || (() => true));

    if (!r.any())
        return null;

    return r[0];
};

function trimEnd(str, char) {
    if (str.endsWith(char))
        return str.substr(0, str.length - 1);
    return str;
}

function toPromise(func) {
    return new Promise(function (resolve, reject) {
        return resolve(func());
    });
}

function toPromiseErrorResult(message) {
    return new Promise(function (resolve, reject) {
        return reject(message);
    });
}

function toPromiseResult(result) {
    return toPromise(() => result);
}

function NotificationProvider($notification) {
    this.ok = function (msj) {
        $notification.success({
            message: `<i class="far fa-check-circle mr-1"></i> ${msj}`
        });
    };

    this.message = function (msj) {
        $notification.warning({
            message: `<i class="fa fa-thumbs-up mr-1"></i> ${msj}`
        });
    };

    this.error = function (msj) {
        $notification.error({
            message: `<i class="fa fa-thumbs-down mr-1"></i> ${msj}`
        });
    };
}

function getCurrentUserSessionId() {
    return localStorage.getItem('currentUserSessionId');
}

function setCurrentUser(userId, forced) {
    if (!forced && !userId) throw Error("El usuerId es null");

    if (forced && !userId)
        return localStorage.removeItem('currentUserSessionId');

    return localStorage.setItem('currentUserSessionId', userId);
}

function errorResult(msj) {
    return 'error: ' + msj;
}

function guid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function getCurrentScore(currentCard, user) {
    if (!currentCard) return null;

    let puntaje = user.puntajes.find(p => p.idTarjeta === currentCard.id);

    return puntaje;
}

function getFormattedDate(format) {
    let fix = s => s.toString().padSart(2, '0');
    let date = new Date();

    return format
        .replace('dd', fix(date.getDate()))
        .replace('mm', fix(date.getDate()))
        .replace('yyyy', date.getFullYear());
}

function checkOverPercentaje(count, total, percentaje) {
    return Math.floor(count * 100 / total) >= percentaje;
}

function withResult(func, result) {
    func();

    return result;
}

let __ = {
    merge: Object.assign
};