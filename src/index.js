const API_URL = "https://cs-steam-game-api.herokuapp.com";

// set initial loading state
let loading = false;

// select UI elements
const searchInput = document.querySelector("#search-form");
const gameContentArea = document.querySelector(".game-content-area");

// API calls to retrieve data
const callApi = async (endpoint, params = {}) => {
  loading = true;
  if (loading && endpoint !== "/genres") {
    gameContentArea.innerHTML = `<div class="loader"></div>`;
  }

  let url = API_URL;
  url += endpoint;

  if (Object.keys(params).length) {
    let queryParams = [];
    for (const key in params) {
      queryParams.push(`${key}=${params[key]}`);
    }
    url += "?" + queryParams.join("&");
  }

  try {
    let res = await fetch(url);
    let data = await res.json();
    loading = false;
    return data;
  } catch (err) {
    console.log("err", err);
  }
};

const getGenres = async () => {
  try {
    let data = await callApi("/genres");
    const total = data.total;

    data = await callApi("/genres", { limit: total });
    return data;
  } catch (err) {
    console.log("err", err);
  }
};

const getFeaturedGames = async () => {
  try {
    let data = await callApi("/features");
    return data;
  } catch (err) {
    console.log("err", err);
  }
};

const getGames = async (name, tag, genre) => {
  try {
    let queryParams = Object.assign(
      {},
      name === "" ? "" : { q: name },
      tag === "" ? "" : { steamspy_tags: tag },
      genre === "" ? "" : { genres: genre }
    );

    let data = await callApi("/games", queryParams);
    return data;
  } catch (err) {
    console.log("err", err);
  }
};

const getSingleGameDetails = async (appid) => {
  loading = true;
  if (loading) {
    gameContentArea.innerHTML = `<div class="loader"></div>`;
  }
  try {
    const url = `https://cs-steam-game-api.herokuapp.com/single-game/${appid}`;
    const res = await fetch(url);
    const data = await res.json();
    loading = false;
    return data;
  } catch (err) {
    console.log("err", err);
  }
};

// render data to UI components
const renderGenres = async () => {
  try {
    let data = await getGenres();
    const ulGenreList = document.querySelector(".genre-list");
    ulGenreList.innerHTML = "";
    data.data.forEach((genre) => {
      const liGenre = document.createElement("li");
      liGenre.innerHTML = `<li class="genre-button">${genre.name}</li>`;
      ulGenreList.appendChild(liGenre);
    });
  } catch (err) {
    console.log("err", err);
  }
};

const renderGames = async (searchValue, renderMode) => {
  try {
    let data;
    let listHeader;
    if (renderMode === "genreButton") {
      data = await getGames("", "", searchValue);
      listHeader = searchValue;
    } else if (renderMode === "textSearch" && searchValue) {
      data = await getGames(searchValue, "", "");
      listHeader = `Search results for "${searchValue}"`;
    } else if (renderMode === "tag" && searchValue) {
      data = await getGames("", searchValue, "");
      listHeader = `${searchValue}`;
    } else {
      data = await getFeaturedGames();
      listHeader = "Featured";
    }

    gameContentArea.innerHTML = `<div class="current-list-header">${listHeader}</div>
    <div class="game-area">`;

    const gameWrapperList = gameContentArea.children[1];
    gameWrapperList.innerHTML = "";

    data.data.forEach((game) => {
      const newDiv = document.createElement("div");
      newDiv.innerHTML = `
      <div class="game-wrapper">
      <div class="game-cover">
        <img
          src="${game.header_image}"
        />
        <div class="game-info">
          <p>${game.name}</p>
          <p>$${game.price}</p>
        </div></div>`;
      gameWrapperList.appendChild(newDiv);
    });

    // ask mentor how to improve perfomance
    // add event listener for each game card
    let gameCards = document.querySelectorAll(".game-cover");
    gameCards.forEach((game, index) => {
      game.addEventListener("click", () => {
        const appid = data.data[index].appid;
        renderGameDetails(appid);
      });
    });
  } catch (err) {
    console.log("err", err);
  }
};

const renderGameDetails = async (appid) => {
  try {
    let data = await getSingleGameDetails(appid);
    data = data.data;

    // convert ISO date format to display format
    let releaseDate = new Date(data.release_date);
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ];
    let month = monthNames[releaseDate.getUTCMonth() + 1];
    let day = releaseDate.getUTCDate();
    let year = releaseDate.getUTCFullYear();
    releaseDate = `${day} ${month}, ${year}`;

    gameContentArea.innerHTML = "";
    gameContentArea.classList.add("game-details-area");
    const newDiv = document.createElement("div");
    newDiv.innerHTML = `<div class="game-title-price">
      <div class="game-title">${data.name}</div>
      <div class="game-price">$${data.price}</div>
    </div>
    <div class="game-details">
      <img src="${data.header_image}">
      <div class="details">
        <div class="description">${data.description}</div>
        <div class="extra-info">
          <p>POSITIVE RATINGS: ${numberWithCommas(data.positive_ratings)}</p>
          <p>NEGATIVE RATINGS: ${numberWithCommas(data.negative_ratings)}</p>
          <p>RELEASE DATE: ${releaseDate}</p>
          <p>DEVELOPER: ${data.developer.join(", ")}</p>
        </div>
      </div>
    </div>
    <div class="game-tags">
      <p>Tags</p>
      <div class="tags">
      </div>
    </div>`;

    gameContentArea.appendChild(newDiv);

    let tagsElement = document.querySelector(".tags");
    data.steamspy_tags.forEach((tag) => {
      const newDiv = document.createElement("div");
      newDiv.innerHTML = `<div class="tag">${tag}</div>`;
      tagsElement.appendChild(newDiv);
    });

    let gameTags = document.querySelectorAll(".tag");
    gameTags.forEach((tag, index) => {
      tag.addEventListener("click", () => {
        const tagText = tag.textContent;
        renderGames(tagText, "tag");
      });
    });
  } catch (err) {
    console.log("err", err);
  }
};

// add event listeners for UI components
const addEventListeners = async () => {
  try {
    await renderGenres();
    let renderMode = "";

    // event listener for search button
    let searchButton = document.querySelector(".search-icon");
    searchButton.addEventListener("click", () => {
      const searchText = searchInput.value;
      renderMode = "textSearch";
      renderGames(searchText, renderMode);
    });

    // event listener for pressing 'Enter' while searching by name
    let input = document.querySelector("#search-form");
    input.addEventListener("keypress", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        document.querySelector(".search-icon").click();
      }
    });

    // event listeners for each genre
    let genreButtons = document.querySelectorAll(".genre-button");
    genreButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const genre = button.innerHTML;
        renderMode = "genreButton";
        renderGames(genre, renderMode);
      });
    });
  } catch (err) {
    console.log("err", err);
  }
};

// function for thousand separator from StackOverflow
function numberWithCommas(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

renderGenres();
addEventListeners();
renderGames();
