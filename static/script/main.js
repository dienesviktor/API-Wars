function init() {
    currentPage = "https://swapi.dev/api/planets";
    nextPage = null;
    previousPage = null;
    switchPage = true;

    previousButton = document.querySelector("#previous");
    nextButton = document.querySelector("#next");

    previousButton.addEventListener("click", handlePreviousPage);
    nextButton.addEventListener("click", handleNextPage);

    getData();
    getVoteStat();
}

function showLoading(element) {
    element.classList.add("loading");
    element.style.display = "block";
}

function hideLoading(element) {
    element.classList.remove("loading");
    element.style.display = "none";
}


function getData() {
    let tableData = document.querySelector("#table-data");
    let tableHead = document.querySelector("#table-head");
    let loading = document.querySelector("#loading");
    tableData.innerHTML = "";
    tableHead.innerHTML = "";
    showLoading(loading);
    fetch(currentPage)
        .then(response => response.json())
        .then((data) => {
            if (data.next !== null) {
                nextPage = data.next;
            } else {
                nextPage = currentPage;
                nextButton.setAttribute("disabled", "")
            }

            if (data.previous !== null) {
                previousPage = data.previous;
            } else {
                previousPage = currentPage;
                previousButton.setAttribute("disabled", "")
            }

            tableHead.innerHTML = `<tr>
                                        <th>Name</th>
                                        <th>Diameter</th>
                                        <th>Climate</th>
                                        <th>Terrain</th>
                                        <th>Surface Water Percentage</th>
                                        <th>Population</th>
                                        <th>Residents</th>
                                        <th id="vote-column">Vote</th>
                                    </tr>`

            let planets = data.results;
            for (let planet of planets) {
                fetch("/get-user")
                    .then(response => {
                        hideLoading(loading);
                        return response.json()
                    })
                    .then(user => {
                        tableData.innerHTML += updateTable(planet, user);
                    })
            }
        })
        .then(() => {
            switchPage = true;
        });
}


function handlePreviousPage() {
    if (switchPage) {
        if (currentPage !== null) {
            nextButton.removeAttribute("disabled")
        }
        switchPage = false;
        currentPage = previousPage;
        getData();
    }
}


function handleNextPage() {
    if (switchPage) {
        if (currentPage !== null) {
            previousButton.removeAttribute("disabled")
        }
        switchPage = false;
        currentPage = nextPage;
        getData();
    }
}


function updateTable(planet, user) {
    let diameter = planet.diameter !== "unknown" ? `${Number(planet.diameter).toLocaleString()} km` : planet.diameter;
    let waterPercentage = planet.surface_water !== "unknown" ? `${planet.surface_water}%` : planet.surface_water;
    let population = planet.population !== "unknown" ? `${Number(planet.population).toLocaleString()} people` : planet.population;
    let residents = formatResidents(planet.residents, planet.name);
    if (user !== null) {
        return `<tr>
                <td>${planet.name}</td>
                <td>${diameter}</td>
                <td>${planet.climate}</td>
                <td>${planet.terrain}</td>
                <td>${waterPercentage}</td>
                <td>${population}</td>
                <td>${residents}</td>
                <td><button class="btn btn-secondary" onclick="votePlanets('${planet.url}', '${planet.name}')">Vote</button></td>
            </tr>`
    } else {
        let voteColumn = document.querySelector("#vote-column");
        if (voteColumn) {
            voteColumn.remove();
        }
        return `<tr>
                <td>${planet.name}</td>
                <td>${diameter}</td>
                <td>${planet.climate}</td>
                <td>${planet.terrain}</td>
                <td>${waterPercentage}</td>
                <td>${population}</td>
                <td>${residents}</td>
             </tr>`
    }

}


function formatResidents(residents, planet) {
    if (residents.length !== 0) {
        createModals(residents, planet);
        getResidents(residents, planet);
        return `<button class="btn btn-secondary" data-toggle="modal" data-target="#${planet.replace(/ /gi, "")}">${residents.length} resident(s)</button>`;
    } else {
        return 'No known residents';
    }
}


function createModals(residents, planet) {
    let modals = document.querySelector("#modals");
    modals.innerHTML += `<div class="modal fade" id="${planet.replace(/ /gi, "")}" tabindex="-1" role="dialog" aria-hidden="true">
                                <div class="modal-dialog modal-lg" role="document">
                                    <div class="modal-content">
                                        <div class="modal-header">
                                            <h5 class="modal-title">Residents of ${planet}</h5>
                                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                                <span aria-hidden="true">&times;</span>
                                            </button>
                                        </div>
                                        <div class="modal-body">
                                        <div class="table-responsive table-bordered table-striped">
                                            <table class="table">
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Height</th>
                                                    <th>Mass</th>
                                                    <th>Hair color</th>
                                                    <th>Skin color</th>
                                                    <th>Eye color</th>
                                                    <th>Birth year</th>
                                                    <th>Gender</th>
                                                </tr>
                                                <tbody id="${planet.replace(/ /gi, "")}-modal-data"></tbody>
                                            </table>
                                        </div>
                                        </div>
                                        <div class="modal-footer">
                                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                                        </div>
                                    </div>
                                </div>
                          </div>`
}


function getResidents(residents, planet) {
    for (residentAPI of residents) {
        fetch(residentAPI)
            .then(response => response.json())
            .then((resident) => {
                let modalData = document.querySelector(`#${planet.replace(/ /gi, "")}-modal-data`)
                let height = resident.height !== "unknown" ? `${resident.height} m` : resident.height;
                let mass = resident.mass !== "unknown" ? `${resident.mass} kg` : resident.mass;
                let gender = resident.gender === "female" ? `♀️${resident.gender}` : (resident.gender === "male" ? `♂️${resident.gender}` : resident.gender)
                modalData.innerHTML += `<tr>
                                            <td>${resident.name}</td>
                                            <td>${height}</td>
                                            <td>${mass}</td>
                                            <td>${resident.hair_color}</td>
                                            <td>${resident.skin_color}</td>
                                            <td>${resident.eye_color}</td>
                                            <td>${resident.birth_year}</td>
                                            <td>${gender}</td>
                                        </tr>`
            })
    }
}


function votePlanets(planetURL, planetName) {
    let planetId = Number(planetURL.replace(/[^\d]/g, ''));
    fetch('/vote', {
        method: 'POST',
        body: JSON.stringify({
            "planet-id": planetId,
            "planet-name": planetName,
        }),
        headers: {
            'Content-type': 'application/json; charset=UTF-8'
        }
    })
        .then(response => response.json())
        .then(data => {
            alert(`Voted on planet ${data["planet"]} successfully!`)
            getVoteStat();
        })
        .catch(error => alert(`There was an error during voting on planet: ${error}`))
}


function getVoteStat() {
    fetch("/vote-stat")
        .then(response => response.json())
        .then(statistic => {
            let voteStatModal = document.querySelector("#voting-stat-modal")
            voteStatModal.innerHTML = "";
            for (stat of statistic) {
                voteStatModal.innerHTML += `<tr>
                                                <td>${stat.planet_name}</td>
                                                <td>${stat.received_votes}</td>
                                            </tr>`
            }
        })
}

init();
