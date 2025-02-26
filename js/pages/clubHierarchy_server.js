const API_SERVER_DOMAIN = "https://smunion.shop";
let accessToken = getCookie("accessToken");
// let refreshToken = getCookie("refreshToken");

function getCookie(name) {
  const nameEQ = name + "=";
  const cookies = document.cookie.split(";");

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length, cookie.length);
    }
  }
  return null;
}

function getClubDpt(token) {
  return fetch(`${API_SERVER_DOMAIN}/api/v1/department/getAll`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
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
function getClubDetail(token) {
  return fetch(`${API_SERVER_DOMAIN}/api/v1/club/detail`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
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

document.addEventListener("DOMContentLoaded", () => {
  console.log("Access Token:", accessToken);

  const clubBox = document.getElementById("clubBox");

  getClubDpt(accessToken).then((data) => {
    if (data && data.result.departmentDTOS) {
      console.log(data);
      data.result.departmentDTOS.forEach((dpt) => {
        const clubDptDiv = document.createElement("div");
        clubDptDiv.classList.add("clubinnerDept");
        clubDptDiv.id = `club-${dpt.departmentId}`;
        clubDptDiv.setAttribute("data-clubDept-name", dpt.clubName); // clubName 저장
        clubDptDiv.innerHTML = `        
          <div class="memberAndClubBox clubinnerDept">
     <div class="clubinnerDept">
          <img style="display: none;" class="deleteBtn" src="../../assets/icons/deleteBtn.png">
          <p>${dpt.name}</p>
        </div>
        <img class="vector" src="../../assets/icons/vector.png" onclick="deptMemSee(this);">
      </div>

      <div class="memberInfo" style="display: none; flex-direction: column;">
        <hr class="bottom">
        <div class="userBox">
          <img style="display: none;" class="deleteBtn" src="../../assets/icons/deleteBtn.png">
          <img src="../../assets/images/user_1.png">
          <p>caesar</p>
        </div>
        <hr>
        <div class="userBox">
          <img style="display: none;" class="deleteBtn" src="../../assets/icons/deleteBtn.png">
          <img src="../../assets/images/user_2.png">
          <p>apollo</p>
        </div>
        <hr style="margin-left: 10px;">
        <div class="userBox">
          <img style="display: none;" class="deleteBtn" src="../../assets/icons/deleteBtn.png">
          <img src="../../assets/images/user_3.png">
          <p>steve</p>
        </div>
        <hr style="margin-left: 10px;">
        <div class="userBox">
          <img style="display: none;" class="deleteBtn" src="../../assets/icons/deleteBtn.png">
          <img src="../../assets/images/user_4.png">
          <p>ocean</p>
        </div>
        
      </div>
      </div>  
        `;
        clubBox.appendChild(clubDptDiv);
      });
    }
    getClubDetail(accessToken).then((data) => {
      if (data && data.result) {
        const clubName = document.getElementById("clubName");
        const clubDescription = document.getElementById("clubDetail");
        const clubPic = document.getElementById("clubPic");
        clubName.textContent = data.result.name || "이름 없음";
        clubDescription.textContent = data.result.description || "설명 없음";
        clubPic.src =
          data.result.thumbnailUrl || "../../assets/images/default.png";
      }
    });
  });
});
