let app = angular.module('app', ['ui-notification'])
    .config(function (NotificationProvider) {
        NotificationProvider.setOptions({
            delay: 10000,
            startTop: 20,
            startRight: 10,
            verticalSpacing: 20,
            horizontalSpacing: 20,
            positionX: 'right',
            positionY: 'bottom'
        });
    });

app.controller('appcontroller', function ($scope, $http, Notification) {

    let listas = [];

    $scope.nombreProyecto;
    $scope.nombre;
    $scope.nombreLista;
    $scope.nombreTarjeta;
    $scope.adminUsers = [];
    $scope.isAdmin;

    $scope.showingResults = false;

    $scope.activeUsers = [];
    $scope.currentProyecto;
    $scope.currentUser;
    $scope.currentTarjeta;

    $scope.allTarjetas = [];
    $scope.options = [];
    $scope.optionsList = [];

    $scope.allTarjetasPuntajes = 0;

    $scope.optionsVisible = (list, name) => {
        if (list.map(m => m.name).includes(name)) return list;

        return list.filter(m =>
            m.name.contains(name) || (m.labels && m.labels.any(p => p.name.contains(name))));
    }

    $scope.selectOption = (opt) => {
        $scope.nombreTarjeta = opt;
    }

    $scope.selectOptionList = (opt) => {
        $scope.nombreLista = opt;

        buscar();
    }

    $scope.numbers = [1, 2, 3, 5, 8, 13, 21, 34];

    // check current user
    initCheck();

    $scope.enableTimer = enableTimer;
    if (enableTimer)
        timer();

    $scope.checkActiveUsers = checkActiveUsers;
    $scope.checkDataTimer = checkDataTimer;

    $scope.getVotedCount = () => {
        return $scope.activeUsers.count(m => m.hasVoted());
    };

    $scope.deleteUser = (user) => {
        if (!confirm('Estás seguro que queres sacar a ' + user.nombre))
            return;

        deleteUser(user);
    };

    $scope.logout = () => {
        $scope.currentUser.destroy();
        $scope.currentUser = null;
        $scope.currentTarjeta = null;
        $scope.currentProyecto = null;
    };

    $scope.login = () => {
        if (!$scope.nombre || $scope.nombre.length < 4) return;

        $scope.currentUser = new User($scope.nombre);
        $scope.nombre = null;

        if (!$scope.currentProyecto) return;

        $scope.currentUser.setAfterCreateEvent(() =>
            initLogin());
        checkAdminUser($scope.currentUser);
    };

    $scope.cerrarProyecto = () => {
        if (!confirm('Estás seguro que queres cerrar el proyecto?')) return;

        cerrarProyecto(() => {
            successMessage('Se cerro el proyecto');
        });
    };

    $scope.crearProyecto = () => {
        cerrarProyecto(() => {
            $scope.currentProyecto = new Proyecto($scope.nombreProyecto);
            $scope.nombreProyecto = null;

            initCheck();
        });
    };

    $scope.createTarjeta = () => {
        $scope.currentTarjeta = new Tarjeta($scope.nombreTarjeta);
        $scope.nombreTarjeta = null;
    };

    $scope.oldTarjetas = () => {
        return $scope.allTarjetas.filter(m => !m.activo) || [];
    };

    // todo: revisar
    $scope.analizar = () => {
        $scope.showingResults = !$scope.showingResults;

        //if (!$scope.showingResults) return;

        $scope.currentTarjeta.puntuar($scope.activeUsers.map(m =>
            new Puntacion(m.nombre, m.getPuntaje())));
    };

    $scope.checkCard = (number) => {
        let status = $scope.currentUser &&
            $scope.currentUser.getCurrentPuntaje() &&
            $scope.currentUser.getCurrentPuntaje().numero === number;

        if ($scope.showingResults)
            status = $scope.activeUsers.any(m => m.getCurrentPuntaje().numero === number);

        return status;
    };

    $scope.checkResult = (user) => {
        return $scope.showingResults && user && user.hasVoted();
    };

    $scope.getPuntajeTarjeta = (tarjeta) => {
        let data = Enumerable.from(tarjeta.puntuaciones)
            .where(m => m.puntaje !== 0)
            .groupBy(m => m.puntaje)
            .orderByDescending(m =>
                m.getSource().length)
            .select(m => m.key())
            .firstOrDefault();

        return data;
    };

    $scope.checkMaxMin = (user) => {
        const avarageQuantityPercentaje = 40;

        let data = Enumerable.from($scope.activeUsers.map(m => m.getPuntaje())).where(m => m !== 0);

        if (!data.any()) return false;

        let max = user.getPuntaje() === data.max();
        let min = user.getPuntaje() === data.min();

        let maxCount = $scope.activeUsers.count(m => m.getPuntaje() === data.max());
        let minCount = $scope.activeUsers.count(m => m.getPuntaje() === data.min());

        if (checkOverPercentaje(maxCount, data.count(), avarageQuantityPercentaje))
            max = false;

        if (checkOverPercentaje(minCount, data.count(), avarageQuantityPercentaje))
            min = false;

        return {
            any: max || min,
            max: max,
            min: min
        }
    };

    $scope.colors = {
        "blue": "info",
        "green": "success",
        "yellow": "warning",
        "orange": "warning",
        "red": "danger",
        "lime": "danger",
        "black": "secondary",
        "purple": "primary"
    };

    $scope.checkOwner = () => {
        if (!$scope.currentProyecto || !$scope.currentUser) return;

        return $scope.isAdmin || $scope.currentProyecto.creadoPor.idCard === $scope.currentUser.idCard;
    };

    function timer() {

        setInterval(() => {
            checkDataTimer();
            console.log('se llamó');
        }, 4 * 1000);

        //timerFunc();

        //function timerFunc() {
        //    setTimeout(() => {
        //        ;
        //    }, 4 * 1000);
        //}
    }

    function checkDataTimer() {
        if ($scope.currentUser)
            checkActiveUsers();

        if ($scope.currentTarjeta)
            checkTarjeta();
    }

    function initCheck() {
        checkProyecto(() => {

            checkAdminUsers(() => {
                checkUser();

                if (!$scope.currentProyecto) return;
                if (!$scope.currentUser) return;

                initLogin();
            });
        });
    }

    function initLogin() {
        checkTarjeta(() => warningMessage('Hay una tarjeta activa'));
        checkActiveUsers();
        checkLists();
    }

    function successMessage(msj) {
        Notification.success({
            message: `<i class="far fa-check-circle mr-1"></i> ${msj}`
        });
    }

    function warningMessage(msj) {
        Notification.warning({
            message: `<i class="fa fa-thumbs-up mr-1"></i> ${msj}`
        });
    }

    function errorMessage(msj) {
        Notification.error({
            message: `<i class="fa fa-thumbs-down mr-1"></i> ${msj}`
        });
    }

    function buscar() {
        let lista = listas.find(m => m.name.toLowerCase().indexOf($scope.nombreLista.toLowerCase()) !== -1);

        if (!lista) return;

        if (lista.cards && lista.cards.length > 0) return lista.cards;

        getListClean(lista.id, p => {

            $scope.options = lista.cards = p.map(m => ({
                name: m.name,
                labels: m.labels
            }));
        });
    };

    function checkLists() {
        getBoard(boardId, d => {
            listas = d;

            $scope.optionsList = d.map(m => ({
                name: m.name
            }));
        });
    }

    function checkActiveUsers() {
        getList(activeUsersListId, d => {

            let users = $scope.activeUsers.filter(m => !m.hasVoted()).map(m => m.idCard);

            $scope.activeUsers = d;

            $scope.activeUsers
                .filter(m => users.includes(m.idCard) && m.hasVoted())
                .forEach(m =>
                    successMessage(`El usuario ${m.nombre} voto ${m.getPuntaje()}`));

            checkCurrentUser();
        });
    }

    function checkCurrentUser() {
        let currentUser = $scope.activeUsers.find(m => m.idCard === $scope.currentUser.idCard);

        if (currentUser) return;

        $scope.currentUser = null;
        $scope.currentTarjeta = null;
        $scope.currentProyecto = null;

        errorMessage('Ya no estás en la listad de miembros');
    }

    function checkAdminUsers(callback) {
        getData(adminUsersId, d => {
            $scope.adminUsers = d;

            callback();
        });
    }

    function checkAdminUser(user) {
        if ($scope.adminUsers.find(m => m.nombre === user.nombre))
            $scope.isAdmin = true;
    }

    function checkUser() {
        let currentUserData = getCurrentUser();
        if (!currentUserData) return;

        $scope.currentUser = new User(currentUserData.nombre, currentUserData);
        checkAdminUser($scope.currentUser);
    }

    function checkProyecto(callback) {
        getData(projectId, d => {
            if (d.any())
                $scope.currentProyecto = d[0];

            callback();
        });
    }

    function checkTarjeta(callback) {
        getData(scoreId, d => {

            if (!d.any()) {
                return;
            }

            if ($scope.allTarjetas.count() !== d.count())
                $scope.allTarjetas = d;

            let data = $scope.oldTarjetas().map(m => $scope.getPuntajeTarjeta(m) || 0);
            $scope.allTarjetasPuntajes = Enumerable.from(data).sum();
            initSparkline('visits', '#FC8675', data);

            let tarjetaActiva = $scope.allTarjetas.find(m => m.activo);

            if (!tarjetaActiva) return;

            $scope.currentTarjeta = Object.assign(new Tarjeta(), tarjetaActiva);
            $scope.showingResults = $scope.currentTarjeta.showingResults;

            if (callback)
                callback();
        });
    }

    function create(listId, name, callback) {
        $http.post(getUrl(`cards?idList=${listId}`), { name: name }).then(d => { if (callback) callback(d.data) });
    }

    function remove(id, callback) {
        $http.delete(getUrl(`cards/${id}`)).then(d => { if (callback) callback(d.data) });
    }

    function setData(id, content, callback) {
        $http.put(getUrl(`cards/${id}`), { desc: JSON.stringify(content) }).then(d => { if (callback) callback(d.data) });
    }

    function getData(id, callback) {
        return $http.get(getUrl(`cards/${id}?fields=desc`))
            .then(d => callback(JSON.parse(d.data.desc)));
    }

    function getBoard(id, callback) {
        $http.get(getUrl(`board/${id}/lists?fields=id,name`))
            .then(d => callback(d.data));
    }

    function getList(id, callback) {
        getListClean(id, d => {
            d.forEach(p => p.desc = JSON.parse(p.desc));
            callback(d.map(p => Object.assign(new ActiveUser(), p.desc)));
        });
    }

    function getListClean(id, callback) {
        return $http.get(getUrl(`list/${id}/cards?fields=id,desc,name,labels`))
            .then(d => { if (callback) callback(d.data) });
    }

    function deleteUser(user) {
        remove(user.idCard, () => $scope.checkActiveUsers());
    };

    function cerrarProyecto(callback) {
        setData(scoreId, [], () => $scope.currentTarjeta = null);

        $scope.activeUsers
            .filter(m => m.idCard !== $scope.currentUser.idCard)
            .forEach(m => deleteUser(m));

        setData(projectId, [], () => {
            $scope.currentProyecto = null;

            if (callback)
                callback();
        });
    }

    function Puntaje(idTarjeta, numero) {
        this.idTarjeta = idTarjeta;
        this.numero = numero;
    }

    function Puntacion(usuario, puntaje) {
        this.usuario = usuario;
        this.puntaje = puntaje;
    }

    function ActiveUser() {
        this.idCard;
        this.nombre;
        this.puntajes;

        this.getCurrentPuntaje = () => {
            return getCurrentPuntaje($scope, this);
        }

        this.getPuntaje = () => {
            let puntaje = getCurrentPuntaje($scope, this);

            if (!puntaje) return 0;

            return puntaje.numero;
        }

        this.hasVoted = () => {
            return this.getPuntaje() !== 0;
        }
    }

    function User(nombre, data) {
        this.idCard;
        this.nombre;
        this.puntajes = [];

        let afterCreateEvent;

        this.setAfterCreateEvent = (event) => {
            afterCreateEvent = event;
        }

        let update = (callback) => {
            setData(this.idCard, this, () => {
                setCurrentUser(this);

                if (callback)
                    callback();
            });
        };

        this.destroy = () => {
            setCurrentUser(null);
            remove(this.idCard);
        }

        this.getCurrentPuntaje = () => {
            return getCurrentPuntaje($scope, this);
        }

        this.puntuar = (numero) => {

            let puntaje = this.puntajes.find(m => m.idTarjeta === $scope.currentTarjeta.id);

            if (puntaje) {
                puntaje.numero = puntaje.numero !== numero
                    ? numero
                    : 0;
            }
            else {
                puntaje = new Puntaje($scope.currentTarjeta.id, numero);
                this.puntajes.push(puntaje);
            }

            update(() => {
                if (puntaje.numero > 0)
                    successMessage('Puntuaste con ' + puntaje.numero);
                else
                    warningMessage('Des-puntuaste la tarjeta');
            });

            let activeUser = $scope.activeUsers.find(m => m.idCard === this.idCard);

            if (!activeUser) throw Error("No se encontró el activeUser");

            activeUser.puntajes = this.puntajes;
        };

        (() => {
            if (data) {
                this.idCard = data.idCard;
                this.nombre = data.nombre;
                this.puntajes = data.puntajes;
            }
            else {
                create(activeUsersListId, this.nombre = nombre, d => {
                    this.idCard = d.id;

                    update(afterCreateEvent);
                });
            }
        })();
    }

    function Proyecto(nombre) {
        this.id;
        this.nombre;
        this.creadoPor;

        let update = (data, callback) => {
            setData(projectId, data, () => {
                if (callback)
                    callback();
            });
        };

        (() => {
            if (nombre) {
                this.id = guid();
                this.nombre = nombre;
                this.creadoPor = {
                    idCard: $scope.currentUser.idCard,
                    nombre: $scope.currentUser.nombre
                };

                update([this], () => () => successMessage('Creaste el proyecto'));
            }
        })();
    }

    function Tarjeta(nombre) {
        this.id;
        this.nombre;
        this.activo;
        this.puntaciones = [];
        this.showingResults;

        let update = (set, callback) => {
            getData(scoreId, list => {
                let instance = list.find(m => m.id === this.id);

                if (instance)
                    Object.assign(instance, this);

                if (set)
                    set(list);

                setData(scoreId, list, () => {
                    if (callback)
                        callback();
                });
            });
        };

        this.puntuar = (puntuaciones) => {
            if (!puntuaciones || !puntuaciones.any(m => m !== 0))
                return;

            this.showingResults = $scope.showingResults;
            this.puntuaciones = puntuaciones;

            update(null, () => successMessage('Los datos se analizaron'));
        };

        (() => {
            if (nombre) {
                this.id = guid();
                this.nombre = nombre;
                this.activo = true;

                update(list => {
                    list.forEach(m => m.activo = false);

                    list.push(this);
                }, () => successMessage('Creaste la tarjeta'));
            }
        })();
    }
});