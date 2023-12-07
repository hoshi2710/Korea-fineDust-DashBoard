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

    this.fetchQuery = new URLSearchParams(this.params).toString().replaceAll("%25", "%");
    this.requestUrl = `http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty?${this.fetchQuery}`;
    this.statusPresetText = {
      1: "좋음",
      2: "보통",
      3: "나쁨",
      4: "매우 나쁨",
    };
    this.locationElement = document.getElementsByClassName("locationText")[0];
    this.selectedDustTypeElement = document.querySelector(".dustValue .selectedDustType");
    this.dustValueElement = document.querySelector(".dustValue i");
    this.statusElement = document.getElementsByClassName("status")[0];
    this.backgroundElement = document.getElementsByClassName("background")[0];
    this.fetchData();
    // this.fetchLoop = setInterval(() => this.fetchData(), 3600000);
  }
  fetchData() {
    fetch(this.requestUrl)
      .then((response) => {
        return response.body;
      })
      .then(async (body) => {
        console.log(body);
        let res = new Response(body);
        res.json().then((result) => {
          this.output === undefined ? this.fetchData() : undefined;
          console.log(this.output);
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
          setDustType(null, null, this.showResult("pm10"));
        });
        // .catch((e) => console.log(e));
      });
  }
  showResult(type) {
    const dustType = Object.keys(this.dustValues);
    const selectedTypeValues = this.dustValues[type];
    this.locationElement.textContent = this.station;
    this.dustValueElement.textContent = selectedTypeValues["value"];
    this.statusElement.textContent = this.statusPresetText[selectedTypeValues["grade"]];
    this.selectedDustTypeElement.textContent = this.dustTypeStringKorean[type];
    // if (this.backgroundElement.className !== "background") {
    //   this.backgroundElement.className = "background";
    // }
    // this.backgroundElement.classList.add("airQuality" + selectedTypeValues["grade"]);
    return "airQuality" + selectedTypeValues["grade"];
  }
}

const colorPulse = (time) => {
  const backgroundElement = document.getElementsByClassName("background")[0];
  const adjustTimeValue = time % 128000;
  const pulseValue = ((Math.cos(((adjustTimeValue / 1000) * Math.PI) / 8) + 1) / 2) * (2 / 5) + 3 / 5;
  // console.log(pulseValue);
  backgroundElement.style.setProperty("--color-pulse", pulseValue);
  // console.log("test");
};

window.onload = () => {
  const currentLocation = "전북 임실읍";
  const fineDust = new FineDust(currentLocation.split(" ")[0], currentLocation.split(" ")[1]);
  //   fineDust.changeLocation(currentLocation.split(" ")[0], currentLocation.split(" ")[1]);
  const dustTypeSelector = document.getElementsByClassName("dustTypeSelector")[0];
  let dustTypeButtons = {};
  dustTypeButtons["pm10"] = document.getElementsByClassName("pm10DustButton")[0];
  dustTypeButtons["pm25"] = document.getElementsByClassName("pm25DustButton")[0];
  dustTypeButtons["co"] = document.getElementsByClassName("coButton")[0];
  dustTypeButtons["o3"] = document.getElementsByClassName("o3Button")[0];

  const colorPulseInterval = setInterval(() => colorPulse(performance.now()), 1);

  Object.keys(dustTypeButtons).forEach((type, idx) => {
    dustTypeButtons[type].onclick = () => {
      setDustType(idx, dustTypeSelector, fineDust.showResult(type));
    };
  });
};