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
            login: "./sites/login.html",
            register: "./sites/register.html",
            promotions: "./sites/promotions.html"
        };
        this.currentUser = null;
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
            login: "login",
            register: "register",
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
                this.setupCheckout();
            }

            if (pageHashes[site] === "login" || site === "login") {
                this.setupLogin();
            }

            if (pageHashes[site] === "register" || site === "register") {
                this.setupRegister();
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
            col.className = "col text-center px-2 py-0";

            const article = document.createElement("article");
            const image = document.createElement("img");
            image.src = termek.location;
            image.alt = termek.nev;
            image.className = "img-fluid w-100 h-50 card-img rounded-3";
            

            const name = document.createElement("h3");
            name.className = "mt-3";
            name.textContent = termek.nev;

            const description = document.createElement("p");
            description.textContent = termek.ingredient;

            const price = document.createElement("h3");
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

    setupCheckout() {
        const choice = this.main.querySelector("#checkout-choice");
        const formContainer = this.main.querySelector("#checkout-form-container");
        const form = this.main.querySelector("#checkout-form");
        const pickupMethod = this.main.querySelector("#pickup-method");
        const addressGroup = this.main.querySelector("#address-group");
        const addressInput = this.main.querySelector("#order-address");
        const message = this.main.querySelector("#checkout-message");
        const accountInfo = this.main.querySelector("#account-info");
        const greeting = this.main.querySelector("#account-greeting");

        if (!choice || !formContainer || !form || !pickupMethod || !addressGroup || !addressInput || !message || !accountInfo || !greeting) {
            throw new Error("A rendelési űrlap hiányos.");
        }

        const updateAddressRequirement = () => {
            const delivery = pickupMethod.value === "kiszallitas";
            addressGroup.hidden = !delivery;
            addressInput.required = delivery;
        };
        pickupMethod.addEventListener("change", updateAddressRequirement);
        updateAddressRequirement();

        const showCheckoutForm = () => {
            choice.hidden = true;
            formContainer.hidden = false;
            message.textContent = "";
        };

        const guestButton = this.main.querySelector("#guest-checkout");
        const loginButton = this.main.querySelector("#login-checkout");
        const logoutButton = this.main.querySelector("#logout-button");
        if (!guestButton || !loginButton || !logoutButton) {
            throw new Error("A rendelési lehetőségek nem találhatók.");
        }

        guestButton.addEventListener("click", () => {
            accountInfo.hidden = true;
            showCheckoutForm();
        });
        loginButton.addEventListener("click", () => {
            window.location.hash = "login";
        });
        logoutButton.addEventListener("click", () => {
            this.currentUser = null;
            form.reset();
            accountInfo.hidden = true;
            formContainer.hidden = true;
            choice.hidden = false;
            updateAddressRequirement();
        });

        if (this.currentUser) {
            const user = this.currentUser;
            this.main.querySelector("#order-name").value = user.nev;
            this.main.querySelector("#order-email").value = user.email;
            this.main.querySelector("#order-phone").value = user.telefon || "";
            addressInput.value = user.cim || "";
            greeting.textContent = `Bejelentkezve: ${user.nev}`;
            accountInfo.hidden = false;
            showCheckoutForm();
        }

        form.addEventListener("submit", event => {
            event.preventDefault();
            if (!form.reportValidity()) {
                return;
            }

            message.textContent = "Az adatok rendben vannak, a rendelés leadásra kész.";
        });
    }

    setupLogin() {
        const form = this.main.querySelector("#login-form");
        const message = this.main.querySelector("#login-message");
        const submitButton = this.main.querySelector("#login-submit");
        if (!form || !message || !submitButton) {
            throw new Error("A bejelentkezési űrlap hiányos.");
        }

        form.addEventListener("submit", async event => {
            event.preventDefault();
            message.textContent = "";
            submitButton.disabled = true;

            try {
                const response = await fetch("./json/users.json");
                if (!response.ok) {
                    throw new Error(`A felhasználók betöltése sikertelen: ${response.status}`);
                }

                const users = await response.json();
                if (!Array.isArray(users) || users.some(user =>
                    user === null ||
                    typeof user !== "object" ||
                    typeof user.nev !== "string" ||
                    typeof user.email !== "string" ||
                    typeof user.jelszo !== "string"
                )) {
                    throw new Error("A users.json formátuma érvénytelen.");
                }

                const email = form.elements.email.value.trim().toLowerCase();
                const password = form.elements.jelszo.value;
                const user = users.find(candidate =>
                    candidate.email.trim().toLowerCase() === email &&
                    candidate.jelszo === password
                );

                if (!user) {
                    message.textContent = "Hibás e-mail-cím vagy jelszó.";
                    return;
                }

                this.currentUser = {
                    nev: user.nev,
                    email: user.email,
                    telefon: typeof user.telefon === "string" ? user.telefon : "",
                    cim: typeof user.cim === "string" ? user.cim : ""
                };
                window.location.hash = "order";
            } catch (error) {
                console.error("A bejelentkezés nem sikerült.", error);
                message.textContent = "A bejelentkezési adatok betöltése nem sikerült. Próbáld újra később.";
            } finally {
                submitButton.disabled = false;
            }
        });
    }

    setupRegister() {
        const form = this.main.querySelector("#register-form");
        if (!form) {
            throw new Error("A regisztrációs űrlap nem található.");
        }

        form.addEventListener("submit", event => {
            event.preventDefault();
            window.alert("Sikertelen regisztráció, A regisztrálás jelenleg nem elérhető");
        });
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
