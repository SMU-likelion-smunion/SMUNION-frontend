const API_SERVER_DOMAIN = "https://smunion.shop";
let accessToken = getCookie("accessToken");
//let refreshToken = getCookie("refreshToken");

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

/* 쿠키 관련 함수들 */
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

document.addEventListener("DOMContentLoaded", function () {
  getToken();
  console.log(accessToken);
});

document.querySelector(".createBtn").addEventListener("click", function () {
  document.getElementById("fileInput").click();
});

document.getElementById("fileInput").addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const preview = document.createElement("img");
      preview.src = e.target.result;
      preview.className = "preview";
      const uploadContainer = document.querySelector(".uploadPic");
      uploadContainer.innerHTML = "";
      uploadContainer.appendChild(preview);
    };
    reader.readAsDataURL(file);
  }
});

const nameInput = document.querySelector(".content input:nth-of-type(1)");
const explanationInput = document.querySelector(".content input:nth-of-type(2)");
const fileInput = document.getElementById("fileInput");

//동아리 생성 데이터를 서버에 전송
function sendClubData(formData) {
  fetch(API_SERVER_DOMAIN + `/api/v1/club`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      if (data.isSuccess) {
        alert("동아리 생성에 성공했습니다!");
        window.location.href = "clubWaitApproval.html";
      } else {
        alert(data.message || "동아리 생성에 실패했습니다.");
      }
    })
    .catch((error) => {
      console.error("에러 발생:", error);
      alert("서버와의 통신 중 오류가 발생했습니다.");
    });
}

// "완료" 버튼 클릭
document.querySelector(".reviseBtn button:nth-of-type(2)").addEventListener("click", () => {
  if (!nameInput.value.trim() || !explanationInput.value.trim()) {
    alert("동아리명과 설명을 모두 입력해주세요.");
    return;
  }
  if (!fileInput.files[0]) {
    alert("이미지를 업로드해주세요.");
    return;
  }

  const formData = new FormData();
  formData.append("name", nameInput.value.trim());
  formData.append("description", explanationInput.value.trim());
  formData.append("image", fileInput.files[0]);

  sendClubData(formData);
});
