function Program($http, $notification) {
    let $this = this;

    this.notify = new NotificationProvider($notification);

    this.currentUserId;
    this.currentProject;

    this.allCards = [];
    this.allUsers = [];
    this.allAdminUsers = [];

    this.timer = timer;
    this.put = put;
    this.removeUser = removeUser;
    this.get = get;
    this.getList = getList;
    this.getBoard = getBoard;
    this.createUser = createUser;
    this.createCard = createCard;
    this.createProject = createProject;
    this.getCurrentUser = getCurrentUser;
    this.getCurrentCard = getCurrentCard;
    this.getCurrentUserIsAdmin = getCurrentUserIsAdmin;
    this.updateCardScore = updateCardScore;
    this.addUserScore = addUserScore;
    this.addCardScore = addCardScore;
    this.checkStatusAdminUsers = checkStatusAdminUsers;

    this.httpLockTimer;

    function getStackTrace() {
        var err = new Error();
        return err.stack.split('\n').map(m => m.replace(' at ', '').trim().split(' ')[0]).slice(3, 6).join('\n');
    }

    function setLock(status, returnValue) {
        $this.httpLockTimer = status;

        //console.log(getStackTrace());

        return returnValue;
    }

    function timer(callback) {
        let timerFunc = () => toPromise(() =>
            checkStatusProgram()
                .then(data => {
                    if (callback) callback(data);

                    console.log('timer executed');
                })
                .catch(error =>
                    console.log(error))
                .then(() => {

                    if (enableTimer)
                        setTimeout(timerFunc, timerDelay * 1000);

                }));

        return timerFunc();
    }

    async function checkStatusProgram() {
        if (!window.isActive || document.hidden) {
            return toPromiseErrorResult(errorResult('inactive'));
        }

        return toPromiseResult(checkLogin())
            .then((status) => {
                if (!status)
                    return toPromiseErrorResult('missing login');

                checkStatusUsers();
                //checkStatusAdminUsers();

                return checkProjectExist()
                    .then(status => {
                        if (!status)
                            return toPromiseErrorResult('missing project');

                        return checkStatusCard();
                    });
            });
    }

    async function checkStatusAdminUsers() {
        if ($this.allAdminUsers.any())
            return toPromiseResult(true);

        return get(adminUsersId)
            .then(data => $this.allAdminUsers = data);
    }

    async function checkStatusUsers() {
        return getUsers(true).then(data => {

            if (!data || !data.any())
                return false;

            let currentCard = $this.getCurrentCard();

            $this.allUsers.customValidationHandler = (changed, current, item, prop) => {

                if (prop === 'puntajes') {
                    changed &=
                        current.puntajes.length !== item.puntajes.length
                        || current.getScore(currentCard) !== item.getScore(currentCard);
                }

                return changed;
            };

            $this.allUsers.insertHandler = (item) => {
                if (!isCurrentUser(item))
                    $this.notify.message('Se conecto el usuario ' + item.nombre);
            };

            $this.allUsers.changeHandler = (current, item, prop) => {

                if (prop === 'puntajes' && !isCurrentUser(item))
                    $this.notify.message('El usuario ' + item.nombre + (item.getScore(currentCard) !== 0
                        ? ' voto!'
                        : ' quito su voto'));
            };

            $this.allUsers.removeHandler = (item) => {
                if (!isCurrentUser(item))
                    $this.notify.message('Se desconecto el usuario ' + item.nombre);
                else
                    $this.notify.error('Ya no estas conectado');
            };

            let users = data.map(m => __.merge(new User(), m));

            $this.allUsers.set(
                users,
                (p1, p2) => p1.idCard === p2.idCard);

            return true;
        });
    }

    async function checkStatusCard() {
        if ($this.httpLockTimer)
            return toPromiseErrorResult(lockMessage + ' - checkStatusCard');

        return get(scoreId, true).then(data => {

            if (!data || !data.any())
                return false;

            let cards = data.map(m => __.merge(new Card(), m));

            //if ($this.allCards.count() !== data.count())
            //$this.allCards = $this.allCards = data;
            $this.allCards.changeHandler = (current, item, prop) => {

                if (prop === 'showingResults')
                    if (item.showingResults)
                        $this.notify.message('La tarjeta se está analizando y no se votar');
                    else
                        $this.notify.ok('La tarjeta se puede votar nuevamente');
            };

            $this.allCards.set(
                data,
                (p1, p2) => p1.id === p2.id);

            return true;
        });
    }

    async function checkProjectExist() {
        if ($this.currentProject)
            return toPromiseResult(true);

        if ($this.httpLockTimer)
            return toPromiseErrorResult(lockMessage + ' - checkProjectExist');

        return get(projectId, true).then(data => {

            if (!data)
                return false;

            $this.currentProject = __.merge(new Project(), data);

            return true;
        });
    }

    function checkLogin() {
        let currentUserId = getCurrentUserSessionId();

        if (!currentUserId)
            return false;

        return true;
    }

    function getCurrentUser() {
        return $this.allUsers.find(m => m.idCard === getCurrentUserSessionId());
    }

    function checkUserLoginStatus() {
        return toPromiseResult(
            $this.getCurrentUser() && $this.allUsers.any(m => m.idCard === $this.getCurrentUser().idCard));
    }

    function getCurrentUserIsAdmin() {
        return $this.getCurrentUser() && $this.allAdminUsers.any(m => m.nombre === $this.getCurrentUser().nombre);
    }

    function getCurrentCard() {
        return $this.allCards.find(m => m.activo);
    }

    async function addUserScore(number) {
        let currentCard = $this.getCurrentCard();
        let currentUser = $this.getCurrentUser();

        let scoreObj = getCurrentScore(currentCard, currentUser);

        if (scoreObj)
            scoreObj.numero = scoreObj.numero !== number ? number : 0;
        else
            scoreObj = currentUser.puntajes.add(new UserScore(currentCard.id, number));

        return put(currentUser.idCard, currentUser)
            .then(() => scoreObj.numero > 0);
    }

    async function addCardScore() {
        let currentCard = $this.getCurrentCard();

        let score = $this.allUsers
            .filter(m => m.hasVoted(currentCard))
            .map(m => new CardScore(m.nombre, m.getScore(currentCard)));

        if (!score.any())
            return toPromiseResult(false);

        currentCard.showingResults = !currentCard.showingResults;
        currentCard.puntuaciones = score;

        return $this.updateCardScore(currentCard);
    }

    async function createUser(nombre) {
        return post(activeUsersListId, nombre)
            .then(data => put(data.id, __.merge(new User(nombre), { idCard: data.id })))
            .then(data => $this.allUsers.add(__.merge(new User(), data)));
    }

    async function removeUser(user) {
        return remove(user.idCard)
            .then(data => $this.allUsers.remove(m => m.idCard === user.idCard));
    }

    async function createCard(card) {
        return $this.updateCardScore(card, data => {
            data.forEach(m => m.activo = false);
            data.add(card);
        })
            .then(data => {
                if ($this.allCards.any(m => m.id === card.id)) return;

                $this.allCards.forEach(m => m.activo = false);
                $this.allCards.add(card);
            });
    }

    async function createProject(project) {
        return put(projectId, project)
            .then(data => $this.currentProject = project);
    }

    async function updateCardScore(card, customMapp) {
        return get(scoreId)
            .then(data => {
                if (customMapp)
                    customMapp(data);

                let instance = data.find(m => m.id === card.id);

                if (instance)
                    __.merge(instance, card);

                return put(scoreId, data);
            });
    }

    function isCurrentUser(user) {
        let currentUser = getCurrentUser();

        if (!user || !currentUser)
            return false;

        return user.idCard === getCurrentUser().idCard;
    }

    function post(listId, name, submissive) {
        if (!submissive) setLock(true);

        return $http.post(getUrl(`cards?idList=${listId}`), { name: name })
            .then(d => setLock(false, d))
            .then(d => d.data);
    }

    function remove(id, submissive) {
        if (!submissive) setLock(true);

        return $http.delete(getUrl(`cards/${id}`))
            .then(d => setLock(false, d))
            .then(d => d.data);
    }

    function put(id, content, submissive) {
        if (!submissive) setLock(true);

        return $http.put(getUrl(`cards/${id}`), { desc: angular.toJson(content) })
            .then(d => setLock(false, d))
            .then(d => JSON.parse(d.data.desc));
    }

    function get(id, submissive) {
        if (!submissive) setLock(true);

        return $http.get(getUrl(`cards/${id}?fields=desc`))
            .then(d => setLock(false, d))
            .then(d => d.data.desc ? JSON.parse(d.data.desc) : null);
    }

    function getList(id, submissive) {
        return getListByUrl(`list/${id}/cards?fields=id,desc,name,labels`, submissive);
    }

    function getBoard(id, submissive) {
        return getListByUrl(`board/${id}/lists?fields=id,name`, submissive);
    }

    function getListByUrl(url, submissive) {
        if (!submissive) setLock(true);

        return $http.get(getUrl(url))
            .then(d => setLock(false, d))
            .then(d => d.data);
    }

    function getUsers(submissive) {
        return getList(activeUsersListId, submissive)
            .then(d => d.map(p => __.merge(new User(), JSON.parse(p.desc || '{}'))));
    }
}

function cerrarProyecto($scope, $program) {
    return $program.put(scoreId, [])
        .then(() => {
            $program.allCards.clean();

            $program.allUsers
                .filter(m => m.idCard !== $scope.currentUser().idCard)
                .forEach(m => $program.removeUser(m));

            return $program.put(projectId, null)
                .then(data => $program.currentProject = null);
        });
}