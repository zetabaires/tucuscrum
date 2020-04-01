String.prototype.sanitate = function () {
    return this.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
};

String.prototype.contains = function (str) {
    return this.sanitate().toLowerCase().indexOf((str || '').sanitate().toLowerCase()) !== -1;
};

Array.prototype.any = function (exp) {
    return this.filter(exp || (() => true)).length > 0;
};

Array.prototype.count = function (exp) {
    return this.filter(exp || (() => true)).length;
};

function getCurrentUser() {
    let data = sessionStorage.getItem('currentuser');

    if (data) return JSON.parse(data);

    return null;
}

function setCurrentUser(data) {
    return sessionStorage.setItem('currentuser', JSON.stringify(data));
}

function guid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function getCurrentPuntaje($scope, user) {
    if (!$scope.currentTarjeta) return 0;

    let puntaje = user.puntajes.find(p => p.idTarjeta === $scope.currentTarjeta.id);

    return puntaje || { numero: 0 };
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