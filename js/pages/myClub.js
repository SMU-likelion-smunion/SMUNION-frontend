const API_SERVER_DOMAIN = "https://smunion.shop";
let accessToken = getCookie("accessToken");
let refreshToken = getCookie("refreshToken");

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

function getMyClub(token) {
  return fetch(`${API_SERVER_DOMAIN}/api/v1/users/clubs`, {
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

function sendMyClub(token, memberClubId) {
  return fetch(`${API_SERVER_DOMAIN}/api/v1/users/clubs/select?memberClubId=${memberClubId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.isSuccess) {
        //alert("동아리 선택에 성공했습니다!");
        getMyClub(token);
      } else {
        //alert(data.message || "동아리 선택에 실패했습니다.");
      }
    })
    .catch((error) => {
      console.error("에러 발생:", error);
      //alert("서버와의 통신 중 오류가 발생했습니다.");
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
  //console.log(accessToken);

  const clubBox = document.getElementById("clubBox");

  getMyClub(accessToken).then((data) => {
    if (data && data.result) {
      console.log("target data", data);
      clubBox.innerHTML = "";
      data.result.forEach((club) => {
        const clubDiv = document.createElement("div");
        clubDiv.classList.add("club");
        // clubDiv.id = club.memberClubId;
        clubDiv.setAttribute("data-club-id", club.memberClubId);
        clubDiv.setAttribute("data-club-name", club.clubName); // clubName 저장
        clubDiv.innerHTML = `
          <img src="${club.url}" class="club_img">
          <p class="club_title">${club.clubName}</p>
        `;
        clubBox.appendChild(clubDiv);
      });
    }
  });

  clubBox.addEventListener("click", (event) => {
    const clickedClub = event.target.closest(".club");
    if (!clickedClub) return;

    const memberClubId = clickedClub.getAttribute("data-club-id");
    if (!memberClubId) {
      console.error("memberClubId를 찾을 수 없습니다.");
      return;
    }

    console.log("선택한 클럽 ID:", memberClubId);

    sendMyClub(accessToken, memberClubId);

    getClubDetail(accessToken).then((data) => {
      if (data && data.result) {
        // console.log("클릭한 클럽:", clickedClubName);
        // console.log("서버 클럽 이름:", data.result.name);
        window.location.href = "/html/pages/club-main.html";

        // if (clickedClubName === data.result.name) {
        //   window.location.href = "/html/pages/club-main.html"; // 이동
        // } else {
        //   window.location.href = "/html/pages/club-full-calendar.html"; // 기본 이동
        // }
      }
    });
  });
});
