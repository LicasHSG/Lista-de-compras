let db;

document.addEventListener('DOMContentLoaded', () => {
    let request = indexedDB.open('shoppingListDB', 1);

    request.onerror = (event) => {
        console.error('Database error: ', event.target.errorCode);
    };

    request.onsuccess = (event) => {
        db = event.target.result;
        fetchItems();
    };

    request.onupgradeneeded = (event) => {
        db = event.target.result;
        let objectStore = db.createObjectStore('items', { keyPath: 'id', autoIncrement: true });
        objectStore.createIndex('name', 'name', { unique: false });
        objectStore.createIndex('quantity', 'quantity', { unique: false });
        objectStore.createIndex('price', 'price', { unique: false });
    };

    document.getElementById('itemNameInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addItem();
        }
    });
});

function addItem() {
    const itemNameInput = document.getElementById('itemNameInput');
    const itemName = itemNameInput.value.trim();
    const itemQuantity = 0; // Quantidade padrão
    const itemPrice = 0; // Preço padrão

    if (itemName !== '') {
        let transaction = db.transaction(['items'], 'readwrite');
        let objectStore = transaction.objectStore('items');
        let request = objectStore.add({ name: itemName, quantity: itemQuantity, price: itemPrice });

        request.onsuccess = () => {
            itemNameInput.value = '';
            fetchItems();
        };

        request.onerror = (event) => {
            console.error('Add item error: ', event.target.errorCode);
        };
    } else {
        alert("Por favor, insira um nome válido.");
    }
}

function fetchItems() {
    let transaction = db.transaction(['items'], 'readonly');
    let objectStore = transaction.objectStore('items');
    let request = objectStore.getAll();

    request.onsuccess = (event) => {
        let items = event.target.result;

        // Ordenar os itens pelo nome
        items.sort((a, b) => a.name.localeCompare(b.name));

        const shoppingList = document.getElementById('shoppingList');
        shoppingList.innerHTML = `
            <li>
                <span class="column-header">Nome do Item</span>
                <span class="column-header">Quantidade</span>
                <span class="column-header">Preço</span>
                <span class="column-header">Total</span>
                <span class="column-header">Ações</span>
            </li>
        `;

        items.forEach(item => {
            const li = document.createElement('li');

            const itemNameInput = document.createElement('input');
            itemNameInput.type = 'text';
            itemNameInput.value = item.name;
            itemNameInput.disabled = true;

            const itemQuantityInput = document.createElement('input');
            itemQuantityInput.type = 'number';
            itemQuantityInput.value = item.quantity;
            itemQuantityInput.disabled = true;

            const itemPriceInput = document.createElement('input');
            itemPriceInput.type = 'text';
            itemPriceInput.value = `R$ ${item.price.toFixed(2)}`;
            itemPriceInput.disabled = true;

            const itemTotalSpan = document.createElement('span');
            itemTotalSpan.textContent = `R$ ${(item.quantity * item.price).toFixed(2)}`;

            const editButton = document.createElement('button');
            editButton.textContent = 'Editar';
            editButton.className = 'edit-button';
            editButton.onclick = () => editItem(item.id, itemNameInput, itemQuantityInput, itemPriceInput, itemTotalSpan, editButton);

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Deletar';
            deleteButton.onclick = () => deleteItem(item.id);

            li.appendChild(itemNameInput);
            li.appendChild(itemQuantityInput);
            li.appendChild(itemPriceInput);
            li.appendChild(itemTotalSpan);
            li.appendChild(editButton);
            li.appendChild(deleteButton);
            shoppingList.appendChild(li);
        });
    };

    request.onerror = (event) => {
        console.error('Fetch items error: ', event.target.errorCode);
    };
}

function deleteItem(id) {
    let transaction = db.transaction(['items'], 'readwrite');
    let objectStore = transaction.objectStore('items');
    let request = objectStore.delete(id);

    request.onsuccess = () => {
        fetchItems();
    };

    request.onerror = (event) => {
        console.error('Delete item error: ', event.target.errorCode);
    };
}

function editItem(id, nameInput, quantityInput, priceInput, totalSpan, editButton) {
    if (editButton.textContent === 'Editar') {
        nameInput.disabled = false;
        quantityInput.disabled = false;
        priceInput.disabled = false;
        editButton.textContent = 'Salvar';
    } else {
        const newName = nameInput.value.trim();
        const newQuantity = parseInt(quantityInput.value.trim()) || 0;
        const newPrice = parseFloat(priceInput.value.replace('R$', '').trim()) || 0;

        if (newName !== '') {
            let transaction = db.transaction(['items'], 'readwrite');
            let objectStore = transaction.objectStore('items');
            let request = objectStore.get(id);

            request.onsuccess = (event) => {
                let item = event.target.result;
                item.name = newName;
                item.quantity = newQuantity;
                item.price = newPrice;

                let updateRequest = objectStore.put(item);
                updateRequest.onsuccess = () => {
                    nameInput.disabled = true;
                    quantityInput.disabled = true;
                    priceInput.disabled = true;
                    totalSpan.textContent = `R$ ${(newQuantity * newPrice).toFixed(2)}`;
                    editButton.textContent = 'Editar';
                    fetchItems();
                };
            };

            request.onerror = (event) => {
                console.error('Edit item error: ', event.target.errorCode);
            };
        } else {
            alert("Por favor, insira um nome válido.");
        }
    }
}

function finalizarCompra() {
    let transaction = db.transaction(['items'], 'readonly');
    let objectStore = transaction.objectStore('items');
    let request = objectStore.getAll();

    request.onsuccess = (event) => {
        let items = event.target.result;

        // Ordenar os itens pelo nome
        items.sort((a, b) => a.name.localeCompare(b.name));

        const lastPurchaseList = document.getElementById('lastPurchaseList');
        lastPurchaseList.innerHTML = '';

        items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.name}, ${item.quantity}, R$ ${item.price.toFixed(2)}, R$ ${(item.quantity * item.price).toFixed(2)}`;
            lastPurchaseList.appendChild(li);
        });

        alert("Compra finalizada e salva com sucesso!");
    };

    request.onerror = (event) => {
        console.error('Finalizar compra error: ', event.target.errorCode);
    };
}
