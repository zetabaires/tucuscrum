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
    let $program = new Program($http, Notification);

    let boardLists = [];

    $scope.nombreProyecto;
    $scope.nombre;
    $scope.nombreLista;
    $scope.nombreTarjeta;

    $scope.loadingUser;
    $scope.loadingTarjeta;
    $scope.loadingProyecto;

    $scope.options = [];
    $scope.optionsList = [];

    $scope.activeUsers = () => $program.allUsers;
    $scope.currentUser = () => $program.getCurrentUser();
    $scope.currentTarjeta = () => $program.getCurrentCard();
    $scope.currentProyecto = () => $program.currentProject;

    $scope.puntuar = (number) => {
        $program.addUserScore(number)
            .then(data => $program.notify.ok(data ? 'Puntuaste la tarjeta con ' + number : 'Despuntuaste la tarjeta'));
    };

    $scope.allTarjetasPuntajes = 0;

    $scope.optionsVisible = (list, name) => {
        if (list.map(m => m.name).includes(name)) return list;

        return list.filter(m =>
            m.name.contains(name) || (m.labels && m.labels.any(p => p.name.contains(name))));
    };

    $scope.selectOption = (opt) => {
        $scope.nombreTarjeta = opt;
    };

    $scope.selectOptionList = (opt) => {
        $scope.nombreLista = opt;

        buscar();
    };

    function buscar() {
        let lista = boardLists.find(m => m.name.contains($scope.nombreLista));

        if (!lista)
            return;

        if (lista.cards && lista.cards.any())
            return;

        $program.getList(lista.id)
            .then(p => {
                $scope.options = lista.cards = p.map(m => ({
                    name: m.name,
                    labels: m.labels
                }));
            });
    }

    $scope.numbers = [1, 2, 3, 5, 8, 13, 21, 34];

    // check current user
    //initCheck();

    $scope.enableTimer = enableTimer;

    $program.timer(() => {

        let data = $scope.oldTarjetas().map(m => $scope.getPuntajeTarjeta(m) || 0);
        $scope.allTarjetasPuntajes = Enumerable.from(data).sum();

        initSparkline('visits', '#FC8675', data);

        //console.log('actualiza al pedo');
    }).then(() => {
        $program.getBoard(boardId)
            .then(data => {
                boardLists = data;

                $scope.optionsList = data.map(m => ({ name: m.name }));
            })
            .then(() =>
                $program.checkStatusAdminUsers());
    });

    //$scope.checkActiveUsers = checkActiveUsers;
    //$scope.checkDataTimer = checkDataTimer;

    $scope.deleteUser = (user) => {
        if (!confirm('Estás seguro que queres sacar a ' + user.nombre))
            return;

        $program.removeUser(user)
            .then(() => $program.notify.ok('Se eliminó al usuario ' + user.nombre));
    };

    $scope.showingResults = () => $scope.currentTarjeta() && $scope.currentTarjeta().showingResults;
    $scope.getVotedCount = () => $program.allUsers.count(m => m.hasVoted($scope.currentTarjeta()));
    $scope.isAdmin = () => $program.getCurrentUserIsAdmin();
    $scope.oldTarjetas = () => $program.allCards.filter(m => !m.activo) || [];
    $scope.checkCardResult = (number) => $scope.showingResults() && $program.allUsers.any(m => m.getScore($scope.currentTarjeta()) === number);
    $scope.checkResult = (user) => $scope.showingResults() && user && user.hasVoted($scope.currentTarjeta());

    $scope.logout = () => {
        $program.removeUser($scope.currentUser())
            .then(() => setCurrentUser(null, true));
    };

    $scope.login = () => {
        if (!$scope.nombre || $scope.nombre.length < 4) return;

        $scope.loadingUser = true;
        $program.createUser($scope.nombre)
            .then(data => {
                $scope.loadingUser = false;
                setCurrentUser(data.idCard);
                $program.notify.ok('Login exitoso');
            });

        $scope.nombre = null;
    };

    $scope.cerrarProyecto = () => {
        if (!confirm('Estás seguro que queres cerrar el proyecto?')) return;

        $scope.loadingProyecto = true;
        cerrarProyecto($scope, $program)
            .then(() => {
                $scope.loadingProyecto = false;
                $program.notify.ok('Se cerro el proyecto');
            });
    };

    $scope.crearProyecto = () => {
        if (!$scope.nombreProyecto || $scope.nombreProyecto.length < 4) {
            $program.notify.error('Tenes que ingresar un nombre para el proyecto');
            return;
        }

        $scope.loadingProyecto = true;
        $program.createProject(new Project($scope.nombreProyecto, $program.getCurrentUser()))
            .then(() => {
                $scope.loadingProyecto = false;
                $program.notify.ok('El proyecto se creo correctamente');
            });

        $scope.nombreProyecto = null;
    };

    $scope.createTarjeta = () => {
        if (!$scope.nombreTarjeta || $scope.nombreTarjeta.length < 4) {
            $program.notify.error('Tenes que ingresar un nombre para la tarjeta a puntuar');
            return;
        }

        $scope.loadingTarjeta = true;
        $program.createCard(new Card($scope.nombreTarjeta))
            .then(() => {
                $scope.loadingTarjeta = false;
                $program.notify.ok('La tarjeta se creo correctamente');
            });

        $scope.nombreTarjeta = null;
    };

    // todo: revisar
    $scope.analizar = () => {
        let currentCard = $program.getCurrentCard();

        $program.addCardScore()
            .then(() => $program.notify.ok('Los datos puntuados en la tarjeta de guardaron correctamente'));
    };

    $scope.checkCard = (number) => {
        let currentUser = $program.getCurrentUser();

        return currentUser && currentUser.getScore($program.getCurrentCard()) === number;
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
        let currentCard = $program.getCurrentCard();
        let data = Enumerable.from($program.allUsers.map(m => m.getScore(currentCard))).where(m => m !== 0);

        if (!data.any()) return false;

        let max = user.getScore(currentCard) === data.max();
        let min = user.getScore(currentCard) === data.min();

        let maxCount = $program.allUsers.count(m => m.getScore(currentCard) === data.max());
        let minCount = $program.allUsers.count(m => m.getScore(currentCard) === data.min());

        if (checkOverPercentaje(maxCount, data.count(), avarageQuantityPercentaje))
            max = false;

        if (checkOverPercentaje(minCount, data.count(), avarageQuantityPercentaje))
            min = false;

        return {
            any: max || min,
            max: max,
            min: min
        };
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
        if (!$program.currentProject || !$program.getCurrentUser()) return;

        return $scope.isAdmin() || $program.currentProject.creadoPor.idCard === $program.getCurrentUser().idCard;
    };
});