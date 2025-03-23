const API_SERVER_DOMAIN = "https://smunion.shop";
let accessToken = getCookie("accessToken");

function getToken() {
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "accessToken") {
      return value;
    }
  }
  return null;
}

function setCookie(name, value, days) {
  var expires = "";
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + value + expires + "; path=/";
}

function getCookie(name) {
  var nameEQ = name + "=";
  var cookies = document.cookie.split(";");
  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i];
    while (cookie.charAt(0) === " ") {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length, cookie.length);
    }
  }
  return null;
}

function deleteCookie(name) {
  document.cookie = name + "=; Expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/;";
}

//복사 함수
function copy() {
  var copyCode = document.querySelector(".code");

  window.navigator.clipboard.writeText(copyCode.textContent);

  alert("복사되었습니다.");
}

//동아리 부서 전체 조회
function getClubDpt() {
  return fetch(`${API_SERVER_DOMAIN}/api/v1/department/getAll`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (response.status === 401) {
        console.warn("Access Token 만료됨. 새 토큰 요청 중...");
        return refreshAccessToken().then((newToken) => getMyClub(newToken));
      }
      if (!response.ok) throw new Error("User info request failed");
      return response.json();
    })
    .catch((error) => {
      console.error("API 요청 오류:", error);
    });
}

async function getClubDetail() {
  try {
    const response = await fetch(API_SERVER_DOMAIN + `/api/v1/club/detail`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    if (data.isSuccess) {
      return {
        clubInfo_img: data.result.thumbnailUrl,
        clubInfo_name: data.result.name,
        clubInfo_desc: data.result.description,
      };
    } else {
      throw new Error("Failed to fetch club details");
    }
  } catch (error) {
    console.error("Error fetching club details:", error);
    return null;
  }
}

//동아리 부원 수 계산
async function getClubMemberCount() {
  try {
    const response = await fetch(`${API_SERVER_DOMAIN}/api/v1/club`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data && data.result && data.result.memberClubResponseList) {
      const memberCount = data.result.memberClubResponseList.length;
      return memberCount;
    } else {
      console.warn("No member data found.");
      return 0;
    }
  } catch (error) {
    console.error("Error fetching member data:", error);
    return 0;
  }
}

let selectedIcon;
//부서 가져와서 table 생성
async function createDeptTable() {
  try {
    const response = await fetch(`${API_SERVER_DOMAIN}/api/v1/department/getAll`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error("Failed to fetch department data");

    const data = await response.json();

    if (data.isSuccess && data.result.departmentDTOS) {
      const departments = data.result.departmentDTOS;
      const tableBody = document.querySelector("#table tbody");
      tableBody.innerHTML = "";

      departments.forEach((department, index) => {
        const { departmentId, name } = department;

        const row = document.createElement("tr");

        const nameCell = document.createElement("td");
        nameCell.className = "text";
        nameCell.textContent = `${name} (ID: ${departmentId})`;

        const iconCell = document.createElement("td");
        iconCell.className = "icon";

        const iconImg = document.createElement("img");
        iconImg.className = index === 0 ? "checked_circle" : "circle"; // 첫 번째 옵션은 기본값으로 선택
        iconImg.src =
          index === 0 ? "../../assets/icons/checked_circle.png" : "../../assets/icons/circle.png";

        // 첫 번째 아이콘을 전역 변수로 저장
        if (index === 0) {
          selectedIcon = iconImg;
        }

        iconImg.id = departmentId;

        // 클릭 이벤트 추가
        iconImg.addEventListener("click", function () {
          if (selectedIcon) {
            // 이전 선택된 아이콘을 circle로 변경
            selectedIcon.classList.remove("checked_circle");
            selectedIcon.classList.add("circle");
            selectedIcon.src = "../../assets/icons/circle.png";
          }

          // 현재 클릭된 아이콘을 checked_circle로 변경
          this.classList.remove("circle");
          this.classList.add("checked_circle");
          this.src = "../../assets/icons/checked_circle.png";

          // 선택된 아이콘 업데이트
          selectedIcon = this;
        });

        iconCell.appendChild(iconImg);
        row.appendChild(nameCell);
        row.appendChild(iconCell);

        tableBody.appendChild(row);
      });
    } else {
      console.warn("No department data found.");
    }
  } catch (error) {
    console.error("Error updating department table:", error);
  }
}

//승인 코드 생성
function createCode() {
  const selectedDepartment = document.querySelector(".checked_circle");
  if (!selectedDepartment) {
    alert("부서를 선택해주세요!");
    return;
  }

  const departmentId = selectedDepartment.id;
  //console.log(departmentId);

  return fetch(`${API_SERVER_DOMAIN}/api/v1/department/${departmentId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("코드 생성에 실패했습니다.");
      }
      return response.json();
    })
    .then((data) => {
      console.log(data);

      if (data.isSuccess) {
        const generatedCode = data.result;

        const code = document.querySelector(".code");
        if (code) {
          code.textContent = generatedCode;
        }

        alert("코드가 생성되었습니다!");
      } else {
        throw new Error("코드 생성 결과를 불러오지 못했습니다.");
      }
    })
    .catch((error) => {
      console.error("API 요청 오류:", error);
      alert("코드 생성 중 오류가 발생했습니다.");
    });
}

//타이머
function startTimer(duration, display) {
  let timer = duration;
  const interval = setInterval(() => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;

    const formattedMinutes = String(minutes).padStart(2, "0");
    const formattedSeconds = String(seconds).padStart(2, "0");

    display.textContent = `남은 시간: ${formattedMinutes}분 ${formattedSeconds}초`;

    if (timer <= 0) {
      clearInterval(interval);
    }

    timer--;
  }, 1000);
}

document.addEventListener("DOMContentLoaded", async () => {
  getToken();
  console.log("Access Token:", accessToken);

  const clubPic = document.querySelector(".clubPic");
  const clubName = document.querySelector(".clubName");
  const detail = document.querySelector(".detail");

  const clubDetails = await getClubDetail();

  if (clubDetails) {
    const { clubInfo_img, clubInfo_name, clubInfo_desc } = clubDetails;

    if (clubPic) clubPic.src = clubInfo_img;
    if (clubName) clubName.textContent = clubInfo_name || "Unknown Club Name";
    if (detail) detail.textContent = clubInfo_desc || "No description available.";
  } else {
    console.warn("Failed to load club details.");
  }

  const memberCount = await getClubMemberCount();
  const memberCountElement = document.querySelector(".clubMemberNum");
  if (memberCountElement) {
    memberCountElement.textContent = `총 ${memberCount}명`;
  } else {
    console.warn(".memberCount element not found.");
  }

  await createDeptTable();
});

// inviteBtn을 제외하고 다른 img 요소에 클릭 이벤트 적용
document.querySelectorAll("img").forEach(function (element) {
  if (!element.classList.contains("inviteBtn")) {
    element.onclick = function () {
      if (this.classList.contains("circle")) {
        this.classList.remove("circle");
        this.classList.add("checked_circle");
        this.src = "../../assets/icons/checked_circle.png";
      } else if (this.classList.contains("checked_circle")) {
        this.classList.remove("checked_circle");
        this.classList.add("circle");
        this.src = "../../assets/icons/circle.png";
      }
    };
  }
});

const copyBtn = document.querySelector(".copyBtn");
copyBtn.addEventListener("click", () => {
  copy();
});

//코드 생성
document.querySelector(".codeCreateBtn").addEventListener("click", () => {
  createCode()
    .then(() => {
      const timerDisplay = document.querySelector(".timer");
      const fiveMinutes = 5 * 60;
      startTimer(fiveMinutes, timerDisplay);
    })
    .catch((error) => {
      console.error("Error starting timer after code creation:", error);
    });
});
