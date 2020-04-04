const element = new Image();
Object.defineProperty(element, 'id', {
    get: function () {
        console.isOpen = true;
    }
});

setInterval(() => {
    console.isOpen = false;
    console.debug(element);
}, 1 * 1000);