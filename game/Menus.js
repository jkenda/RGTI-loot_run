
export class Menus {

    constructor() {
        this.canvas = document.querySelector("canvas");
        // menus
        this.mainMenu = document.getElementById("main-menu");
        this.deathMenu = document.getElementById("death-menu");
        this.victoryMenu = document.getElementById("victory-menu");

        // buttons
        this.startGameButton = document.getElementById("start-game");
        this.goToMainMenuButton = document.getElementById("go-to-menu");
        this.restartGameButton = document.getElementById("restart-game");
        this.goToMainMenuButtonFromDeath = document.getElementById("go-to-menu-from-death");
        this.goToMainMenuButtonFromVictory = document.getElementById("go-to-menu-from-victory");
    }

    addEventListeners() {
        this.startGameButton.addEventListener("click", _ => {
            this.showGameWindow();
            this.lockMouseToCanvas();
        });

        this.restartGameButton.addEventListener("click", () => {
            this.showGameWindow();
            this.lockMouseToCanvas();
        });

        this.goToMainMenuButtonFromDeath.addEventListener("click", () => {
            this.showMainMenu();
        });

        this.goToMainMenuButtonFromVictory.addEventListener("click", () => {
            this.showMainMenu();
        });

        this.goToMainMenuButton.addEventListener("click", _ => {
            this.showMainMenu();
        });
    }

    lockMouseToCanvas() {
        this.canvas.requestPointerLock();
    }

    showGameWindow() {
        fade(this.mainMenu);
        fade(this.deathMenu);
        fade(this.victoryMenu);
    }

    showMainMenu() {
        unfade(this.mainMenu);
        fade(this.deathMenu);
        fade(this.victoryMenu);
    }

    showDeathMenu() {
        document.exitPointerLock();
        fade(this.mainMenu);
        unfade(this.deathMenu);
        fade(this.victoryMenu);
    }

    showVictoryMenu() {
        document.exitPointerLock();
        fade(this.mainMenu);
        fade(this.deathMenu);
        unfade(this.victoryMenu);
    }
}

function fade(element) {
    var op = 100;  // initial opacity
    var timer = setInterval(function () {
        element.style.opacity = op / 100;
        element.style.filter = 'alpha(opacity=' + op + ")";
        if (op < 0) {
            clearInterval(timer);
            element.style.zIndex = -1;
        }
        op -= 5;
    }, 25);
}

function unfade(element) {
    var op = 0;  // initial opacity
    element.style.zIndex = 1;
    var timer = setInterval(function () {
        element.style.opacity = op / 100;
        element.style.filter = 'alpha(opacity=' + op + ")";
        if (op > 100) {
            clearInterval(timer);
        }
        op += 5;
    }, 25);
}

