function UserScore(idTarjeta, numero) {
    this.idTarjeta = idTarjeta;
    this.numero = numero;
}

function CardScore(usuario, puntaje) {
    this.usuario = usuario;
    this.puntaje = puntaje;
}

function User(nombre) {
    this.idCard;
    this.nombre = nombre;
    this.puntajes = [];

    this.getScore = (card) => {
        let scoreObj = getCurrentScore(card, this);

        return scoreObj ? scoreObj.numero : 0;
    };

    this.hasVoted = (card) => {
        return this.getScore(card) !== 0;
    };
}

function Project(nombre, user) {
    this.id = guid();
    this.nombre = nombre;
    this.creadoPor = user ? {
        idCard: user.idCard,
        nombre: user.nombre
    } : null;
}

function Card(name) {
    this.id = guid();
    this.nombre = name;
    this.activo = true;
    this.puntaciones = [];
    this.showingResults;
}