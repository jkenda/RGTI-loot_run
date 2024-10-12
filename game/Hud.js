export class Hud {

    redHeart = "../common/images/redHeart.png";
    blackHeart = "../common/images/blackHeart.png";

    static divX = document.getElementById("divX");
    static divY = document.getElementById("divY");
    static divZ = document.getElementById("divZ");
    static divFPS = document.getElementById("divFPS");

    static sumFPS = 0;
    static samples = 0;
    static prevDisplay = 0;

    constructor() {
        this.oneHp = document.getElementById("oneHp");
        this.twoHp = document.getElementById("twoHp");
        this.threeHp = document.getElementById("threeHp");
    }

    displayHp(ammountOfHp) {
        switch (ammountOfHp) {
            case 0:
                this.oneHp.src = this.blackHeart;
                this.twoHp.src = this.blackHeart;
                this.threeHp.src = this.blackHeart;
                break;

            case 1:
                this.oneHp.src = this.redHeart;
                this.twoHp.src = this.blackHeart;
                this.threeHp.src = this.blackHeart;
                break;

            case 2:
                this.oneHp.src = this.redHeart;
                this.twoHp.src = this.redHeart;
                this.threeHp.src = this.blackHeart;
                break;

            case 3:
                this.oneHp.src = this.redHeart;
                this.twoHp.src = this.redHeart;
                this.threeHp.src = this.redHeart;
                break;

            default:
                break;
        }
    }

    static displayCoords(x, y, z) {
        divX.innerText = Math.round(x);
        divY.innerText = Math.round(y);
        divZ.innerText = Math.round(z);
    }

    static displayFPS(dt) {
        this.prevDisplay += dt;
        this.sumFPS += 1 / dt;
        this.samples++;
        if (this.prevDisplay > 1) {
            this.divFPS.innerText = Math.round(this.sumFPS / this.samples);
            this.prevDisplay = 0;
            this.sumFPS = 0;
            this.samples = 0;
        }
    }
}