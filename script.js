class SiteLoader {
    constructor(main) {
        this.main = main;
        this.pages = fetch("./json/sites.json").then(response => {
            if (!response.ok) {
                throw new Error(`Az oldalak betöltése sikertelen: ${response.status}`);
            }
            return response.json();
        });
    }

    async load(site) {
        const pageIndexes = {
            home: 0,
            menu: 1,
            gallery: 2,
            contact: 3,
            order: 4,
            promotions: 5
        };
        const pageIndex = pageIndexes[site];

        if (pageIndex === undefined) {
            return;
        }

        try {
            const pages = await this.pages;
            console.log(this.main)
            if (!Array.isArray(pages) || typeof pages[pageIndex] !== "string") {
                throw new Error("Érvénytelen az oldalak JSON-formátuma.");
            }
            this.main.innerHTML = pages[pageIndex];
        } catch (error) {
            console.error("Az oldal tartalmát nem sikerült betölteni.", error);
            this.main.textContent = "Az oldal tartalmát nem sikerült betölteni.";
        }
    }
}

window.sites = new SiteLoader(document.getElementById("MainContent"));
window.sites.load("home");

class User {
    constructor(nev,email,jelszo) {
        this.nev = nev;
        this.email = email;
        this.jelszo = jelszo;
        this.Rendelesek = [];
    }

    login(email,jelszo) {
        let users = this.deserialize_users("filepath");
        for (let user of users) {
            if ((user.email === email || user.nev === email) && user.jelszo === this.password_hash(jelszo)) {
                return user;
            }
        }
        return new User();
    }

    signup(nev,email,jelszo) {
        let users = this.deserialize_users("filepath");
        users.push(new User(nev,email,this.password_hash(jelszo)));
        serialize_users(users);
        return new User(nev,email,this.password_hash(jelszo));
    }

    password_hash(jelszo) {
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256');
        hash.update(jelszo);
        return hash.digest('hex');
    }

    rendeles_hozzaadas(rendeles) {
        this.Rendelesek.push(rendeles);
    }

    serialize_users(obj) {
        let objs = this.deserialize_users("filepath");
        objs.push(obj);
        writeFileSync("filepath", JSON.stringify(objs));
    }

    deserialize_users() {
        let obj = readFileSync("filepath", 'utf-8');
        return JSON.parse(obj,User);
    }
}

class Termek {
    constructor(location,t_tipus,nev,ingredient,ar) {
        this.location = location;
        this.t_tipus = t_tipus;
        this.nev = nev;
        this.ingredient = ingredient;
        this.discription = ingredient;
        this.ar = parseInt(ar);
    }

    serialize_termek(obj) {
        let objs = this.deserialize_termek("filepath");
        objs.push(obj);
        writeFileSync("filepath", JSON.stringify(objs));
    }

    deserialize_termek() {
        let obj = readFileSync("filepath", 'utf-8');
        return JSON.parse(obj,Termek);
    }
}

class Kosar {
    constructor(user) {
        this.user = user;
        this.termekek = [];
        this.osszeg; // sum(termkek.ar)
    }

    add_termek(termek) {
        this.termekek.push(termek);
    }

    rendel() {
        // Rendeles()
    }
}

class Rendeles {
    constructor(azonosito,osszeg,user,date,termekek,varos,iszam,utca,hszam) {
        this.azonosito = azonosito;
        this.user = user;
        this.date = date;
        this.termekek = termekek;
        this.osszeg = osszeg;
        this.allapot = "Folyamatban"; // Future 
        this.varos = varos;
        this.iszam = iszam;
        this.utca = utca;
        this.hszam = hszam;
    }

    serialize_rendeles(obj) {
        let objs = this.deserialize_rendeles("filepath");
        objs.push(obj);
        writeFileSync("filepath", JSON.stringify(objs));
    }

    deserialize_rendeles() {
        let obj = readFileSync("filepath", 'utf-8');
        return JSON.parse(obj,Rendeles);
    }
}