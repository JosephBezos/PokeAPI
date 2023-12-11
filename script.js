// variables
let iOffset = 0;
let iLimit = 1;
let iPageCur = 1;
let iPageNum = 1;
const URL_API = 'https://pokeapi.co/api/v2/pokemon/';
// images
const sDefaultPokemonImg = '404.png';
const sDefaultPokemonAlt = 'Not found';
const sLoadingImg = 'loading.png';
// buttons
const btnPrev = document.getElementById('prev');
const btnNext = document.getElementById('next');
const btnSelect = document.getElementById('select');
// elements
const ePageNum = document.getElementById('pageNum');
const ePageCurrent = document.getElementById('pageCurrent');
const eList = document.getElementById('list');

// functions
const refreshPagination = () => {
    iPageCur = Math.ceil(iOffset / iLimit) + 1;
    ePageNum.textContent = iPageNum;
    ePageCurrent.textContent = iPageCur;

    btnSelect.innerHTML = '';
    const fragment = document.createDocumentFragment();
    const eItem = document.createElement('option');
    eItem.value = 1;
    eItem.textContent = 1;
    eItem.selected = iPageCur === 1;
    fragment.appendChild(eItem);
    for (let i = 20; i <= 500; i += 10) {
        const eItem = document.createElement('option');
        eItem.value = i;
        eItem.textContent = i;
        eItem.selected = i === iPageCur;
        fragment.appendChild(eItem);
    }
    btnSelect.appendChild(fragment);
}

// ...

btnSelect.addEventListener('change', (e) => {
    iLimit = e.target.value; // Update the limit based on the selected value
    iOffset = 0; // Reset the offset when changing the limit
    fetchData().then(data => showList(data));
    refreshPagination(); // Update pagination information
});

btnNext.addEventListener('click', () => {
    if (iOffset < iPageNum * iLimit - iLimit) {
        iOffset += iLimit;
        fetchData().then(data => showList(data));
    }
});

btnSelect.addEventListener('change', (e) => {
    iLimit = e.target.value; // Update the limit based on the selected value
    iOffset = 0; // Reset the offset when changing the limit
    fetchData().then(data => showList(data));
    refreshPagination(); // Update pagination information
});

// Fetches data from the API with optional offset and limit parameters
// Объект для кеширования данных
const cache = {};

const fetchData = async () => {
    try {
        // Ключ кеша на основе текущих параметров запроса
        const cacheKey = `offset=${iOffset}&limit=${iLimit}`;

        // Проверяем, есть ли данные в кеше
        if (cache[cacheKey]) {
            console.log(cache);
            return cache[cacheKey];
        }

        // Виконуємо запит до API
        const response = await fetch(`${URL_API}?${cacheKey}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();

        iPageNum = Math.ceil(data.count / iLimit);

        const pokemonArray = Array.isArray(data) ? data : data.results;

        // Получаем необходимые данные и сохраняем их в кеше
        const result = await Promise.all(pokemonArray.map(async ({ name, url }) => {
            const pokemon = await fetchPokemon(url);
            return {
                name,
                src: pokemon.src,
                id: pokemon.id
            };
        }));

        cache[cacheKey] = result;
        return result;

    }
    catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        throw error;
    }
    finally {
        refreshPagination();
    }
};

const fetchPokemon = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const { sprites: { other: { 'dream_world': { front_default: src } } }, id } = await response.json();

        return { src, id };
    } catch (error) {
        return { src: sDefaultPokemonImg }; // Повертаємо дефолтне зображення
    }
};

const showList = (data) => {
    if (!data) return; // Проверка на существование данных

    eList.innerHTML = '';
    const fragment = document.createDocumentFragment();
    data.forEach(item => {
        const eItem = document.createElement('li');
        const eImg = document.createElement('img');
        const eName = document.createElement('span');
        // Встановлення дефолтних значень
        eImg.src = sLoadingImg;
        eImg.alt = 'Loading...';
        eImg.title = 'Loading...';
        eName.textContent = 'Name: Loading...';
        eName.classList.add('name');

        eItem.appendChild(eImg);
        eItem.appendChild(eName);
        fragment.appendChild(eItem);

        const imageSrc = item.src || sDefaultPokemonImg;
        const imgAltTitle = item.name || sDefaultPokemonAlt;
        const id = item.id || 'Not found';

        eImg.onload = () => {
            eImg.src = imageSrc;
            eImg.alt = imgAltTitle;
            eImg.title = imgAltTitle;
            eName.textContent = 'Name: ' + imgAltTitle + '\n' + 'ID: ' + id;
        };

        eImg.onerror = () => {
            eImg.src = sDefaultPokemonImg; // В случае ошибки загрузки изображения
            eImg.alt = sDefaultPokemonAlt;
            eImg.title = sDefaultPokemonAlt;
            eName.textContent = sDefaultPokemonAlt;
        };

    });
    eList.appendChild(fragment);
}

fetchData().then(data => showList(data));
