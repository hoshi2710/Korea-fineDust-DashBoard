const setDustType = (idx, dustTypeSelector, nextClass) => {
  const background = document.getElementsByClassName("background")[0];
  if (idx !== null && dustTypeSelector !== null) {
    dustTypeSelector.style.transform = `translate(0px,${50 * idx}px)`;
  }

  const nextAirQualityNo = nextClass.replace("airQuality", "");

  background.style.setProperty("--before-background", `var(--airQuality${nextAirQualityNo}-Gradient)`);
  background.style.setProperty("--before-transition", "opacity 0.5s");
  background.style.setProperty("--before-opacity", 1);
  background.setAttribute("data-next-class", nextClass);
  background.addEventListener("transitionend", (event) => {
    if (!event.target.classList.contains("background")) {
      return;
    }
    if (event.target.style.getPropertyValue("--before-opacity") === "0") {
      return;
    }
    if (event.target.classList.length === 2) {
      event.target.classList.remove(background.classList[1]);
    }
    event.target.classList.add(event.target.getAttribute("data-next-class"));
    background.style.setProperty("--before-transition", "opacity 0s");
    background.style.setProperty("--before-opacity", 0);
    background.setAttribute("data-next-class", "");
  });
};
const changeStatusText = (status,direction) => {
  const statusTextElement = document.getElementsByClassName("status")[0];
  const beforeAfterSwitch = direction ? "after" : "before";
  statusTextElement.style.setProperty(`--${beforeAfterSwitch}-element-content`, `'${status}'`);
  statusTextElement.setAttribute("data-next-status",status);
  statusTextElement.addEventListener("transitionend", (event) => {
    if (!event.target.classList.contains("status")) {
      return;
    }
    if (event.target.style.getPropertyValue("--inner-contents-translateY") === -300 + (direction ? -300 : 300) + "pt") {
      const nextStatus = event.target.getAttribute("data-next-status");
      event.target.innerHTML = `<span>${nextStatus}</span>`;
      event.target.style.setProperty(`--${beforeAfterSwitch}-element-content`, "' '");
      event.target.style.setProperty("transition","0s");
      event.target.style.setProperty("--inner-contents-translateY", "-300pt");
      event.target.style.setProperty("transition","0.2s");
      event.target.setAttribute("data-next-status","");
    }
  });
  statusTextElement.style.setProperty("--inner-contents-translateY", -300 + (direction ? -300 : 300) + "pt");
};

class FineDust {
  constructor(currentSido, currentStation) {
    this.params = {
      serviceKey: "z59JjZUxTFXC32%2FMdzl1rZ943CyUmSPymAM5wW%2FLCZoJ39WjXcTJpHbW5iNxEXl9MtCa4Gf8KDtveHslJPnjgg%3D%3D",
      returnType: "json",
      numOfRows: "100",
      pageNo: "1",
      sidoName: currentSido,
      ver: "1.0",
    };
    this.dustTypeStringKorean = {
      pm10: "미세먼지",
      pm25: "초미세먼지",
      co: "일산화탄소",
      o3: "오존",
    };
    this.fetchedData = null;
    this.fetchProceed = true;
    this.station = currentStation;
    this.valueBlock = {
      value: -1,
      grade: -1,
    };
    this.dustValues = {};
    this.dustValues["pm10"] = JSON.parse(JSON.stringify(this.valueBlock));
    this.dustValues["pm25"] = JSON.parse(JSON.stringify(this.valueBlock));
    this.dustValues["co"] = JSON.parse(JSON.stringify(this.valueBlock));
    this.dustValues["o3"] = JSON.parse(JSON.stringify(this.valueBlock));
    this.dustType = Object.keys(this.dustValues);

    this.fetchQuery = (new URLSearchParams(this.params)).toString().replace(/%25/g, "%");
    this.requestUrl = `https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty?${this.fetchQuery}`;
    this.statusPresetText = {
      1: "좋음",
      2: "보통",
      3: "나쁨",
      4: "매우 나쁨",
    };
    this.locationElement = document.getElementsByClassName("locationText")[0];
    this.selectedDustTypeElement = document.querySelector(".dustValue .selectedDustType");
    this.dustValueElement = document.querySelector(".dustValue i");
    this.statusElement = document.querySelector(".status span");
    this.backgroundElement = document.getElementsByClassName("background")[0];
    this.dustTypeSelector = document.getElementsByClassName("dustTypeSelector")[0];
    this.mainDustType = "pm10";
    this.currentSelectedType = -1;
    this.fetchData()
    this.fetchLoop = setInterval(() => {this.fetchProceed = true; this.fetchData();}, 3600000);
  }
  fetchData() {
    if(!this.fetchProceed){
      return;
    }
    fetch(this.requestUrl)
      .then((response) => {
        return response.body;
      })
      .then(async (body) => {
        let res = new Response(body);
        res
          .json()
          .then((result) => {
            this.output === undefined ? this.fetchData() : undefined;
            this.output = result.response.body.items;

            Object.keys(this.output).forEach((idx) => {
              if (this.output[idx].stationName === this.station) {
                this.fetchedData = this.output[idx];
              }
            });
            Object.keys(this.dustValues).forEach((key) => {
              this.dustValues[key].value = this.fetchedData[key + "Value"];
              this.dustValues[key].grade = this.fetchedData[key + "Grade"];
            });
            setDustType(0, this.dustTypeSelector, this.showResult(this.mainDustType,true));
          })
          .catch((e) => console.log(e));
      });
      this.fetchProceed = false;
  }
  showResult(type) {
    const selectedTypeValues = this.dustValues[type];
    this.locationElement.textContent = this.station;
    this.dustValueElement.textContent = selectedTypeValues["value"];
    changeStatusText(this.statusPresetText[selectedTypeValues["grade"]],this.dustType.indexOf(type) >= this.currentSelectedType);
    this.currentSelectedType = this.dustType.indexOf(type);
    this.statusPresetText[selectedTypeValues["grade"]];
    this.selectedDustTypeElement.textContent = this.dustTypeStringKorean[type];
    return "airQuality" + selectedTypeValues["grade"];
  }
}

const colorPulse = (time) => {
  const backgroundElement = document.getElementsByClassName("background")[0];
  const adjustTimeValue = time % 128000;
  const pulseValue = ((Math.cos(((adjustTimeValue / 1000) * Math.PI) / 8) + 1) / 2) * (2 / 5) + 3 / 5;
  backgroundElement.style.setProperty("--color-pulse", pulseValue);
};

class Search {
  constructor(fineDustManager) {
    this.fineDustManager = fineDustManager;
    this.searchInputElement = document.querySelector(".searchOutline > input");
    this.autoCompletionWordsArea = document.getElementsByClassName("searchAutoCompletion")[0];
  }
  async loadLocationNames() {
    const locationNamesLoadResponse = new Response((await fetch("./locationNames.json")).body);
    return await locationNamesLoadResponse.json();
  }

  createAutoCompleteWordElement(resultArray) {
    const autoCompleteWordElements = [];
    
    let splitedText = this.searchInputElement.value.split(" ");
    this.autoCompletionWordsArea.innerHTML = null;
    resultArray.forEach((text, index) => {
      autoCompleteWordElements.push(document.createElement("div"));
      autoCompleteWordElements[index].textContent = text;
      autoCompleteWordElements[index].className = "autoCompleteWord";
      autoCompleteWordElements[index].onclick = (event) => {
        this.searchInputElement.value = event.target.textContent + " ";
        splitedText = event.target.textContent.split(" ");
        this.searchInputElement.focus();
        if (event.target.textContent.length > 2) {
          this.excuteSearching(splitedText[0], splitedText[1]);
        }
      };

      const listeningReturnKey =
        resultArray[0] === this.searchInputElement.value && this.searchInputElement.value.length > 2;
      this.searchInputElement.onkeypress = listeningReturnKey
        ? (event) => {
            event.key === "Enter" ? this.excuteSearching(splitedText[0], splitedText[1]) : null;
          }
        : null;

      this.autoCompletionWordsArea.appendChild(autoCompleteWordElements[index]);
    });
  }
  excuteSearching(sidoName, stationName) {
    this.fineDustManager.params["sidoName"] = sidoName;
    this.fineDustManager.station = stationName;
    this.fineDustManager.fetchProceed = true;
    this.fineDustManager.fetchData();
    this.searchInputElement.blur();
  }
  async generateAutoCompleteWord(input) {
    const locationNames = await this.loadLocationNames();
    const adminAreaNames = Object.keys(locationNames);
    let splitedText = input.split(" ");
    const locationSearchResult = [];
    if (splitedText.length < 2) {
      for (let i = 0; i < adminAreaNames.length; i += 1) {
        if (adminAreaNames[i].indexOf(splitedText[0]) != -1) {
          locationSearchResult.push(adminAreaNames[i]);
        }
      }
    } else {
      const adminArea = splitedText[0];
      const subAdminAreas = locationNames[adminArea];
      for (let i = 0; i < subAdminAreas.length; i += 1) {
        if (subAdminAreas[i].indexOf(splitedText[1]) != -1) {
          locationSearchResult.push(adminArea + " " + subAdminAreas[i]);
        }
      }
    }

    this.createAutoCompleteWordElement(locationSearchResult);
  }
  loadInputLocation() {}
}

window.onload = () => {
  const currentLocation = "전북 임실읍";
  const fineDust = new FineDust(currentLocation.split(" ")[0], currentLocation.split(" ")[1]);
  const searchManager = new Search(fineDust);
  const searchInput = document.querySelector(".search input");
  const dustTypeSelector = document.getElementsByClassName("dustTypeSelector")[0];
  let dustTypeButtons = {};
  dustTypeButtons["pm10"] = document.getElementsByClassName("pm10DustButton")[0];
  dustTypeButtons["pm25"] = document.getElementsByClassName("pm25DustButton")[0];
  dustTypeButtons["co"] = document.getElementsByClassName("coButton")[0];
  dustTypeButtons["o3"] = document.getElementsByClassName("o3Button")[0];

  const colorPulseInterval = setInterval(() => colorPulse(performance.now()), 10);

  Object.keys(dustTypeButtons).forEach((type, idx) => {
    dustTypeButtons[type].onclick = () => {
      fineDust.currentSelectedType !== idx ? setDustType(idx, dustTypeSelector, fineDust.showResult(type, false)) : undefined;
    };
  });
  searchInput.onfocus = (event) => {
    searchManager.generateAutoCompleteWord(event.target.value);
  };
  searchInput.oninput = (event) => {
    searchManager.generateAutoCompleteWord(event.target.value);
  };
};
