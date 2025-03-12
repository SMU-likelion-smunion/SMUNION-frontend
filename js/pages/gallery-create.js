const API_SERVER_DOMAIN = "https://smunion.shop";

let accessToken = getCookie("accessToken");
const uploadedImages = []; //저장된 이미지 배열

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

//clubId 가져오기
function getClubId() {
  let accessToken = getToken();
  fetch(API_SERVER_DOMAIN + `/api/v1/users/clubs/selected`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      //console.log("data", data);

      if (data.isSuccess) {
        //console.log("get memberClubId 완료");
        const currentClubId = data.result.memberClubId;
        localStorage.setItem("currentClubId", currentClubId);
        //console.log(currentClubId);
      } else {
        throw new Error("memberClubId 가져오기 실패");
      }
    })
    .catch((error) => {
      console.error("Error", error);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  let accessToken = getToken();
  getClubId();

  const prevScreen = document.querySelector(".prev-screen");
  const finishBtn = document.querySelector(".finish-btn");
  const nameInput = document.querySelector("#gallery-name-input");
  const galleryUpload = document.querySelector(".gallery-upload");
  const galleryContent = document.querySelector(".gallery-create-content");

  //이전 화면으로 이동
  prevScreen.addEventListener("click", () => {
    window.history.back();
  });

  //이미지 업로드
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.style.display = "none";
  document.body.appendChild(fileInput);

  //업로드 버튼 클릭
  galleryUpload.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = function (e) {
        const uploadItem = document.createElement("div");
        uploadItem.classList.add("upload-item");

        const img = document.createElement("img");
        img.src = e.target.result;

        uploadItem.appendChild(img);
        galleryContent.insertBefore(uploadItem, galleryUpload);

        uploadedImages.push(file);
      };

      reader.readAsDataURL(file);
      fileInput.value = ""; //같은 파일 연속 업로드 가능
    }
  });

  //'완료' 클릭 시
  finishBtn.addEventListener("click", async () => {
    //갤러리 이름 미입력 시
    if (!nameInput.value.trim()) {
      alert("갤러리 이름을 입력해 주세요.");
      return;
    }

    let formData = new FormData();

    formData.append("name", nameInput.value);

    if (uploadedImages.length > 0) {
      uploadedImages.forEach((file) => {
        formData.append("images", file, file.name);
      });
    }

    try {
      for (const x of formData.entries()) {
        //console.log(x);
      }

      const response = await fetch(`${API_SERVER_DOMAIN}/api/v1/gallery/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        alert("갤러리 생성이 완료되었습니다.");
        //console.log(data);
        window.location.href = "/html/pages/gallery-view-more.html";
      } else {
        alert(`갤러리 생성 실패: ${data.message}`);
      }
    } catch (error) {
      console.error("failed:", error);
    }
  });
});
