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

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("saveButton").addEventListener("click", async () => {
    const joinCode = document.getElementById("joinCodeInput").value;
    const deptId = document.getElementById("deptIdInput").value;
    const nickname = document.getElementById("nicknameInput").value;

    // 유효성 검사
    if (!joinCode || !deptId || !nickname) {
      alert("동아리 참여 코드, 부서 코드, 별명을 모두 입력해주세요.");
      return;
    }

    try {
      const response = await fetch(API_SERVER_DOMAIN + `/api/v1/club/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          departmentId: deptId,
          code: joinCode,
          nickname: nickname,
          isStaff: "false",
        }),
      });
      const result = await response.json();
      if (response.ok) {
        console.log(response);

        alert(result.message);
        window.location.href = "myClub.html";
      } else {
        alert(result.message || "요청 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    }
  });
});
