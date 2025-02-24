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

document.addEventListener("DOMContentLoaded", () => {
  console.log("Access Token:", accessToken);

  const clubBox = document.getElementById("clubBox");  

  getMyClub(accessToken).then((data) => {

    if (data && data.result) {
      console.log("target data", data);
      clubBox.innerHTML = "";
      data.result.forEach((club) => {
        const clubDiv = document.createElement("div");
        clubDiv.classList.add("club"); 
        clubDiv.innerHTML = `
          <img src="../../assets/images/lion-face.png" class="club_img">
          <p class="club_title">${club.clubName}</p>
        `;
        clubBox.appendChild(clubDiv);  
      });
    }
  });
});
