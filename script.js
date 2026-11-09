class operator {
    constructor(main) {
        this.main = main;
        this.cart = new Map();
        this.producten = [];
        this.pages = {
            home: "./sites/home.html",
            menu: "./sites/menu.html",
            gallery: "./sites/gallery.html",
            contact: "./sites/contacts.html",
            order: "./sites/order.html",
            promotions: "./sites/promotions.html"
        };
        this.termekek = this.loadTermekek();
        this.termekek.catch(error => {
            console.error("A termékeket nem sikerült betölteni.", error);
        });
    }

    async loadTermekek() {
        const response = await fetch("./json/termekek.json");
        if (!response.ok) {
            throw new Error(`A termékek betöltése sikertelen: ${response.status}`);
        }

        const termekek = await response.json();
        if (!Array.isArray(termekek) || termekek.some(termek =>
            termek === null ||
            typeof termek !== "object" ||
            typeof termek.location !== "string" ||
            typeof termek.t_tipus !== "string" ||
            typeof termek.nev !== "string" ||
            typeof termek.ingredient !== "string" ||
            typeof termek.ar !== "number"
        )) {
            throw new Error("Érvénytelen a termékek JSON-formátuma.");
        }
        return termekek;
    }

    async load(site) {
        const pageHashes = {
            home: "home",
            menu: "menu",
            gallery: "gallery",
            contact: "contact",
            order: "order",
            offers: "promotions"
        };
        const pagePath = this.pages[pageHashes[site] || site];

        if (!pagePath) {
            return;
        }

        try {
            const response = await fetch(pagePath);
            if (!response.ok) {
                throw new Error(`Az oldal betöltése sikertelen: ${response.status}`);
            }
            this.main.innerHTML = await response.text();

            if (pageHashes[site] === "menu" || site === "menu") {
                const productList = this.main.querySelector("#product-list");
                if (!productList) {
                    throw new Error("A menüoldalon nem található a terméklista.");
                }

                try {
                    const termekek = await this.termekek;
                    this.producten = termekek;
                    this.renderTermekek(termekek, productList);
                    this.setupTermekSzurok(termekek, productList);
                } catch {
                    productList.textContent = "A termékeket nem sikerült betölteni.";
                }
            }

            if (pageHashes[site] === "order" || site === "order") {
                this.renderKosar();
            }
        } catch (error) {
            console.error("Az oldal tartalmát nem sikerült betölteni.", error);
            this.main.textContent = "Az oldal tartalmát nem sikerült betölteni.";
        }
    }

    renderTermekek(termekek, container) {
        container.replaceChildren();

        for (const termek of termekek) {
            const productIndex = this.producten.indexOf(termek);
            const col = document.createElement("div");
            col.className = "col";

            const article = document.createElement("article");
            const image = document.createElement("img");
            image.src = termek.location;
            image.alt = termek.nev;
            image.className = "img-fluid w-100 card-img";

            const name = document.createElement("h3");
            name.className = "mt-3";
            name.textContent = termek.nev;

            const description = document.createElement("p");
            description.textContent = termek.ingredient;

            const price = document.createElement("p");
            price.textContent = `${termek.ar} Ft`;

            const addButton = document.createElement("button");
            addButton.type = "button";
            addButton.className = "add-to-cart";
            addButton.dataset.productIndex = String(productIndex);
            addButton.textContent = "Kosárba";

            article.append(image, name, description, price, addButton);
            col.append(article);
            container.append(col);
        }

    }

    setupTermekSzurok(termekek, productList) {
        const filters = this.main.querySelector("#product-filters");
        if (!filters) {
            throw new Error("A menüoldalon nem találhatók a termékszűrők.");
        }

        productList.addEventListener("click", event => {
            const button = event.target.closest("button.add-to-cart");
            if (!button || !productList.contains(button)) {
                return;
            }

            const productIndex = Number(button.dataset.productIndex);
            const quantity = this.cart.get(productIndex) || 0;
            this.cart.set(productIndex, quantity + 1);
            button.textContent = "Kosárba téve";
            window.setTimeout(() => {
                if (button.isConnected) {
                    button.textContent = "Kosárba";
                }
            }, 1000);
        });

        filters.addEventListener("click", event => {
            const button = event.target.closest("button[data-category]");
            if (!button || !filters.contains(button)) {
                return; //
            }

            const category = button.dataset.category;
            const filteredProducts = category === "all"
                ? termekek
                : termekek.filter(termek => termek.t_tipus === category);

            for (const filterButton of filters.querySelectorAll("button[data-category]")) {
                filterButton.setAttribute("aria-pressed", String(filterButton === button));
            }

            this.renderTermekek(filteredProducts, productList);
        });
    }

    renderKosar() {
        const cartItems = this.main.querySelector("#cart-items");
        const totalElement = this.main.querySelector("#cart-total");
        if (!cartItems || !totalElement) {
            throw new Error("A rendelés oldalon nem található a kosár.");
        }

        cartItems.replaceChildren();
        let total = 0;

        if (this.cart.size === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.textContent = "A kosarad jelenleg üres.";
            cartItems.append(emptyMessage);
        }

        for (const [productIndex, quantity] of this.cart) {
            const termek = this.producten[productIndex];
            if (!termek) {
                continue;
            }

            total += termek.ar * quantity;

            const article = document.createElement("article");
            article.className = "row align-items-center g-3 mb-4";
            const imageColumn = document.createElement("div");
            imageColumn.className = "col-4 col-sm-3";
            const image = document.createElement("img");
            image.src = termek.location;
            image.alt = termek.nev;
            image.className = "img-fluid";
            imageColumn.append(image);

            const details = document.createElement("div");
            details.className = "col";
            const name = document.createElement("h3");
            name.textContent = termek.nev;
            const price = document.createElement("p");
            price.textContent = `${termek.ar} Ft / db`;
            const quantityDisplay = document.createElement("span");
            quantityDisplay.className = "mx-2";
            quantityDisplay.textContent = String(quantity);

            const decreaseButton = document.createElement("button");
            decreaseButton.type = "button";
            decreaseButton.dataset.cartAction = "decrease";
            decreaseButton.dataset.productIndex = String(productIndex);
            decreaseButton.setAttribute("aria-label", `${termek.nev} mennyiségének csökkentése`);
            decreaseButton.textContent = "−";

            const increaseButton = document.createElement("button");
            increaseButton.type = "button";
            increaseButton.dataset.cartAction = "increase";
            increaseButton.dataset.productIndex = String(productIndex);
            increaseButton.setAttribute("aria-label", `${termek.nev} mennyiségének növelése`);
            increaseButton.textContent = "+";

            const lineTotal = document.createElement("p");
            lineTotal.textContent = `Részösszeg: ${termek.ar * quantity} Ft`;
            details.append(name, price, decreaseButton, quantityDisplay, increaseButton, lineTotal);
            article.append(imageColumn, details);
            cartItems.append(article);
        }

        totalElement.textContent = `${total} Ft`;
        cartItems.addEventListener("click", event => {
            const button = event.target.closest("button[data-cart-action]");
            if (!button || !cartItems.contains(button)) {
                return;
            }

            const productIndex = Number(button.dataset.productIndex);
            const quantity = this.cart.get(productIndex);
            if (button.dataset.cartAction === "increase") {
                this.cart.set(productIndex, quantity + 1);
            } else if (quantity <= 1) {
                this.cart.delete(productIndex);
            } else {
                this.cart.set(productIndex, quantity - 1);
            }
            this.renderKosar();
        }, { once: true });
    }
}

/*
class User {
    constructor(nev,email,jelszo) {
        this.nev = nev;
        this.email = email;
        this.jelszo = jelszo;
        this.Rendelesek = [];
    }
}
*/

window.sites = new operator(document.getElementById("MainContent"));
window.addEventListener("hashchange", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.sites.load(window.location.hash.slice(1));
});
window.sites.load(window.location.hash.slice(1) || "home");

